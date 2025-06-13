import { Router, Request, Response } from 'express';
import { getBanks, verifyBankAccount, verifyPayment } from '../utils/paystack';
import { log } from '../vite';
import { storage } from '../storage';

const router = Router();

// Get list of banks
router.get('/banks', async (req: Request, res: Response) => {
  try {
    const banks = await getBanks();
    res.json({
      success: true,
      banks
    });
  } catch (error) {
    log(`Error in /payment/banks: ${error instanceof Error ? error.message : String(error)}`, 'payment');
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch banks'
    });
  }
});

// Verify bank account
router.post('/verify-account', async (req: Request, res: Response) => {
  try {
    const { bankCode, accountNumber } = req.body;

    if (!bankCode || !accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Bank code and account number are required'
      });
    }

    const accountDetails = await verifyBankAccount(accountNumber, bankCode);
    
    res.json({
      success: true,
      accountName: accountDetails.accountName
    });
  } catch (error) {
    log(`Error in /payment/verify-account: ${error instanceof Error ? error.message : String(error)}`, 'payment');
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to verify account'
    });
  }
});

// Process Paystack payment verification
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const { reference, trxref } = req.query;
    const ref = (reference || trxref) as string;
    
    if (!ref) {
      return res.status(400).json({
        success: false,
        message: 'Reference is required'
      });
    }
    
    // Verify the payment
    const paymentDetails = await verifyPayment(ref);
    
    if (paymentDetails.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Payment was not successful'
      });
    }
    
    // Get the userId from metadata
    const userId = paymentDetails.metadata?.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found in payment metadata'
      });
    }
    
    // Get the user
    const user = await storage.getUser(Number(userId));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Convert amount from kobo to naira
    const amount = paymentDetails.amount / 100;
    
    // Process deposit using unified TransactionManager
    const { TransactionManager } = await import('../services/transactionManager');
    const result = await TransactionManager.processDeposit(
      Number(userId),
      amount,
      ref,
      'paystack'
    );
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to process deposit'
      });
    }
    
    // Redirect to success page
    res.redirect(`/?payment=success&amount=${amount}`);
  } catch (error) {
    log(`Error in /payment/verify: ${error instanceof Error ? error.message : String(error)}`, 'payment');
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to verify payment'
    });
  }
});

// Webhook handler for Paystack events
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    // Verify that the request is from Paystack
    const hash = req.headers['x-paystack-signature'];
    
    // Todo: Add signature verification in production
    // const secret = process.env.PAYSTACK_SECRET_KEY;
    // const computedHash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
    // if (computedHash !== hash) {
    //   log('Invalid webhook signature', 'paystack');
    //   return res.status(401).json({ status: 'error', message: 'Invalid signature' });
    // }
    
    const event = req.body;
    
    log(`Received Paystack webhook: ${event.event}`, 'paystack');
    
    // Extract common data
    const data = event.data || {};
    const reference = data.reference;
    const amount = data.amount ? data.amount / 100 : 0; // Convert from kobo to naira
    
    // Find transaction by reference
    let userId = data.metadata?.userId;
    let transactionId = data.metadata?.transactionId;
    
    // If no metadata was found, try to find the transaction by reference
    if (!userId && reference) {
      // Get all users and look through their transactions
      const users = await storage.getAllUsers();
      
      for (const user of users) {
        const userTransactions = await storage.getUserTransactions(user.id);
        const existingTransaction = userTransactions.find(t => t.reference === reference);
        
        if (existingTransaction) {
          userId = user.id;
          transactionId = existingTransaction.id;
          break;
        }
      }
    }
    
    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        // Process successful charge using unified TransactionManager
        if (userId) {
          const { TransactionManager } = await import('../services/transactionManager');
          
          if (transactionId) {
            // Complete existing pending transaction
            log(`Completing existing transaction ${transactionId}`, 'paystack');
            const result = await TransactionManager.completeTransaction(transactionId);
            
            if (result.success) {
              log(`Transaction ${transactionId} completed successfully`, 'paystack');
            } else {
              log(`Failed to complete transaction ${transactionId}: ${result.error}`, 'paystack');
            }
          } else {
            // Process new deposit
            const result = await TransactionManager.processDeposit(
              Number(userId),
              amount,
              reference,
              'paystack'
            );
            
            if (result.success) {
              log(`New Paystack deposit processed: User ${userId}, Amount: ₦${amount}`, 'paystack');
            } else {
              log(`Failed to process Paystack deposit: ${result.error}`, 'paystack');
            }
          }
        } else {
          log(`No user ID found in metadata for transaction ${reference}`, 'paystack');
        }
        break;
      
      case 'charge.failed':
        // Process failed charge using unified TransactionManager
        if (userId) {
          const { TransactionManager } = await import('../services/transactionManager');
          
          if (transactionId) {
            // Reverse existing pending transaction
            const result = await TransactionManager.reverseTransaction(
              transactionId, 
              `Payment failed: ${data.gateway_response || 'Payment failed'}`
            );
            
            if (result.success) {
              log(`Transaction ${transactionId} reversed due to payment failure`, 'paystack');
            } else {
              log(`Failed to reverse transaction ${transactionId}: ${result.error}`, 'paystack');
            }
          } else {
            log(`Failed payment recorded for user ${userId}: ${reference}`, 'paystack');
          }
        }
        break;
      
      case 'transfer.success':
        // Process successful withdrawal/transfer
        if (transactionId) {
          log(`Marking withdrawal ${transactionId} as completed`, 'paystack');
          await storage.updateTransactionStatus(transactionId, 'completed');
        } else if (reference && userId) {
          // Try to find the transaction by reference
          const userTransactions = await storage.getUserTransactions(Number(userId));
          const existingTransaction = userTransactions.find(t => 
            t.reference === reference && 
            t.type === 'withdrawal' && 
            t.status === 'pending'
          );
          
          if (existingTransaction) {
            await storage.updateTransactionStatus(existingTransaction.id, 'completed');
            log(`Updated withdrawal ${existingTransaction.id} to completed status`, 'paystack');
          }
        }
        break;
      
      case 'transfer.failed':
        // Process failed withdrawal/transfer
        if (transactionId) {
          log(`Marking withdrawal ${transactionId} as failed`, 'paystack');
          await storage.updateTransactionStatus(transactionId, 'failed');
          
          // Refund the amount to the user
          if (userId) {
            const user = await storage.getUser(Number(userId));
            if (user) {
              const transaction = await storage.getTransaction(transactionId);
              if (transaction) {
                await storage.updateUserBalance(Number(userId), user.walletBalance + transaction.amount);
                log(`Refunded ${transaction.amount} to user ${user.username} due to failed withdrawal`, 'paystack');
              }
            }
          }
        } else if (reference && userId) {
          // Try to find the transaction by reference
          const userTransactions = await storage.getUserTransactions(Number(userId));
          const existingTransaction = userTransactions.find(t => 
            t.reference === reference && 
            t.type === 'withdrawal' && 
            t.status === 'pending'
          );
          
          if (existingTransaction) {
            await storage.updateTransactionStatus(existingTransaction.id, 'failed');
            
            // Refund the amount to the user
            const user = await storage.getUser(Number(userId));
            if (user) {
              await storage.updateUserBalance(Number(userId), user.walletBalance + existingTransaction.amount);
              log(`Refunded ${existingTransaction.amount} to user ${user.username} due to failed withdrawal`, 'paystack');
            }
          }
        }
        break;
      
      case 'transfer.reversed':
        // Process transfer reversal
        if (transactionId) {
          log(`Marking withdrawal ${transactionId} as failed due to reversal`, 'paystack');
          await storage.updateTransactionStatus(transactionId, 'failed');
          
          // Refund the amount to the user
          if (userId) {
            const user = await storage.getUser(Number(userId));
            if (user) {
              const transaction = await storage.getTransaction(transactionId);
              if (transaction) {
                await storage.updateUserBalance(Number(userId), user.walletBalance + transaction.amount);
                log(`Refunded ${transaction.amount} to user ${user.username} due to reversed withdrawal`, 'paystack');
              }
            }
          }
        }
        break;
      
      case 'subscription.create':
      case 'subscription.disable':
      case 'subscription.enable':
        // Handle subscription events if needed in the future
        log(`Received subscription event: ${event.event}`, 'paystack');
        break;
      
      default:
        // Log other events
        log(`Unhandled Paystack webhook event: ${event.event}`, 'paystack');
    }
    
    // Always return 200 OK for webhook requests, even if processing had issues
    // This prevents Paystack from retrying the webhook unnecessarily
    res.status(200).send('Webhook received');
  } catch (error) {
    log(`Error in /payment/webhook: ${error instanceof Error ? error.message : String(error)}`, 'payment');
    
    // Still return 200 OK to prevent retries, but log the error
    res.status(200).send('Webhook received with processing errors');
  }
});

// For development: Test route to simulate Paystack webhook events
if (process.env.NODE_ENV === 'development') {
  router.post('/webhook-test/:event', async (req: Request, res: Response) => {
    try {
      const { event } = req.params;
      const { userId, amount, reference, type, status } = req.body;
      
      // Validate minimum required parameters
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId is required'
        });
      }
      
      const user = await storage.getUser(Number(userId));
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Define test data based on the event type
      const testData: any = {
        event: event,
        data: {
          id: `test_${Date.now()}`,
          reference: reference || `test_ref_${Date.now()}`,
          amount: (amount || 1000) * 100, // Convert to kobo
          currency: 'NGN',
          channel: 'card',
          status: status || 'success',
          paid_at: new Date().toISOString(),
          metadata: {
            userId: userId,
            transactionType: type || (event.startsWith('charge') ? 'deposit' : 'withdrawal')
          }
        }
      };
      
      // Additional data for specific events
      switch (event) {
        case 'charge.success':
          testData.data.customer = {
            email: user.email || 'test@example.com',
            customer_code: `cust_${userId}_${Date.now()}`
          };
          testData.data.authorization = {
            authorization_code: `auth_${Date.now()}`,
            last4: '4242',
            card_type: 'visa'
          };
          break;
          
        case 'charge.failed':
          testData.data.gateway_response = 'Declined';
          testData.data.status = 'failed';
          break;
          
        case 'transfer.success':
        case 'transfer.failed':
        case 'transfer.reversed':
          testData.data.recipient = {
            recipient_code: `recip_${Date.now()}`,
            type: 'nuban'
          };
          break;
      }
      
      log(`Simulating Paystack webhook event: ${event}`, 'paystack');
      log(`Test payload: ${JSON.stringify(testData)}`, 'paystack');
      
      // Forward the test event to the actual webhook handler
      // Make a request to our own webhook endpoint
      const response = await fetch(`${process.env.PUBLIC_URL || 'http://localhost:5000'}/api/payment/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Paystack-Signature': 'test_signature'
        },
        body: JSON.stringify(testData)
      });
      
      if (response.ok) {
        res.json({
          success: true,
          message: `Simulated ${event} webhook event sent successfully`,
          testData
        });
      } else {
        const error = await response.text();
        res.status(500).json({
          success: false,
          message: `Error sending webhook test event: ${error}`,
          testData
        });
      }
    } catch (error) {
      log(`Error in /payment/webhook-test: ${error instanceof Error ? error.message : String(error)}`, 'payment');
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to simulate webhook event'
      });
    }
  });
}

export default router;