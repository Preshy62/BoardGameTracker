import { Router, Request, Response } from 'express';
import { getBanks, verifyBankAccount, verifyTransaction, verifyPayment } from '../utils/paystack';
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
    
    const event = req.body;
    
    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        // Process successful charge
        const data = event.data;
        const reference = data.reference;
        const amount = data.amount / 100; // Convert from kobo to naira
        const userId = data.metadata?.userId;
        
        if (userId) {
          const user = await storage.getUser(Number(userId));
          
          if (user) {
            // Record the transaction
            await storage.createTransaction({
              userId: Number(userId),
              amount,
              type: 'deposit',
              status: 'completed',
              currency: 'NGN',
              reference,
              metadata: {
                paymentProvider: 'paystack',
                paymentMethod: data.channel || 'card',
                paymentId: data.id,
              }
            });
            
            // Update user's wallet balance
            await storage.updateUserBalance(Number(userId), user.wallet_balance + amount);
          }
        }
        break;
      
      default:
        // Log other events
        log(`Unhandled Paystack webhook event: ${event.event}`, 'paystack');
    }
    
    res.status(200).send('Webhook received');
  } catch (error) {
    log(`Error in /payment/webhook: ${error instanceof Error ? error.message : String(error)}`, 'payment');
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process webhook'
    });
  }
});

export default router;