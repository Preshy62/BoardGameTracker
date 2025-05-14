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
    
    // Record the transaction
    await storage.createTransaction({
      userId: Number(userId),
      amount,
      type: 'deposit',
      status: 'completed',
      currency: 'NGN',
      reference: ref,
      bankDetails: {
        paymentProvider: 'paystack',
        paymentMethod: paymentDetails.channel || 'card',
        paymentId: paymentDetails.id,
      }
    });
    
    // Update user's wallet balance
    await storage.updateUserBalance(Number(userId), user.walletBalance + amount);
    
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
        // Process successful charge
        if (userId) {
          const user = await storage.getUser(Number(userId));
          
          if (user) {
            if (transactionId) {
              // Update existing transaction
              log(`Updating existing transaction ${transactionId} to completed`, 'paystack');
              await storage.updateTransactionStatus(transactionId, 'completed');
              
              // If this transaction was already processed, don't double-credit the user
              const transaction = await storage.getTransaction(transactionId);
              if (transaction && transaction.status !== 'completed') {
                // Update user's wallet balance
                await storage.updateUserBalance(Number(userId), user.walletBalance + amount);
                log(`Updated user ${user.username} balance: +${amount} ${data.currency || 'NGN'}`, 'paystack');
              }
            } else {
              // Create new transaction record
              const newTransaction = await storage.createTransaction({
                userId: Number(userId),
                amount,
                type: 'deposit',
                status: 'completed',
                currency: data.currency || 'NGN',
                reference,
                description: `Paystack payment via ${data.channel || 'card'}`,
                paymentDetails: JSON.stringify({
                  provider: 'paystack',
                  method: data.channel || 'card',
                  paymentId: data.id,
                  customerCode: data.customer?.customer_code,
                  email: data.customer?.email,
                  authorizationCode: data.authorization?.authorization_code,
                  cardLast4: data.authorization?.last4,
                  cardType: data.authorization?.card_type
                })
              });
              
              // Update user's wallet balance
              await storage.updateUserBalance(Number(userId), user.walletBalance + amount);
              log(`Created new transaction and updated user ${user.username} balance: +${amount} ${data.currency || 'NGN'}`, 'paystack');
            }
          } else {
            log(`User with ID ${userId} not found for transaction ${reference}`, 'paystack');
          }
        } else {
          log(`No user ID found in metadata for transaction ${reference}`, 'paystack');
        }
        break;
      
      case 'charge.failed':
        // Process failed charge
        if (transactionId) {
          log(`Marking transaction ${transactionId} as failed`, 'paystack');
          await storage.updateTransactionStatus(transactionId, 'failed');
        } else if (userId) {
          // Create a record of the failed transaction
          await storage.createTransaction({
            userId: Number(userId),
            amount,
            type: 'deposit',
            status: 'failed',
            currency: data.currency || 'NGN',
            reference,
            description: `Failed Paystack payment via ${data.channel || 'card'}: ${data.gateway_response || 'Payment failed'}`,
            paymentDetails: JSON.stringify({
              provider: 'paystack',
              method: data.channel || 'card',
              failureReason: data.gateway_response,
              paymentId: data.id
            })
          });
          log(`Created record of failed transaction for user ${userId}`, 'paystack');
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

export default router;