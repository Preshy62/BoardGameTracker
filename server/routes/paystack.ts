import { Router } from 'express';
import { storage } from '../storage';
import { paymentProcessing } from '../utils/payment';
import { verifyPaystackSignature } from '../utils/paystack';

const router = Router();

// Paystack payment verification route
router.get('/verify', async (req, res) => {
  try {
    const { reference } = req.query;
    
    if (!reference) {
      return res.status(400).json({ success: false, message: 'Reference is required' });
    }
    
    // Verify the payment
    const verificationResult = await paymentProcessing.verifyPaystackPayment(reference as string);
    
    if (!verificationResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: verificationResult.message || 'Payment verification failed' 
      });
    }
    
    // Extract data from verification
    const { data } = verificationResult;
    
    // Check if payment was successful
    if (data.status !== 'success') {
      return res.redirect(`/payment-failed?reference=${reference}`);
    }
    
    // Extract metadata
    const userId = data.metadata?.userId;
    const amount = data.amount / 100; // Convert from kobo to naira
    
    if (!userId) {
      return res.redirect(`/payment-failed?reference=${reference}&error=Invalid%20metadata`);
    }
    
    // Create transaction
    const transaction = await storage.createTransaction({
      userId,
      amount,
      type: 'deposit',
      status: 'completed',
      reference: data.reference,
      currency: 'NGN',
    });
    
    // Update user balance
    const user = await storage.getUser(userId);
    if (!user) {
      return res.redirect(`/payment-failed?reference=${reference}&error=User%20not%20found`);
    }
    
    // Add amount to current balance
    await storage.updateUserBalance(userId, user.walletBalance + amount);
    
    // Redirect to success page
    return res.redirect(`/payment-success?reference=${reference}&amount=${amount}`);
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.redirect('/payment-failed?error=Server%20error');
  }
});

// Paystack webhook
router.post('/webhook', async (req, res) => {
  try {
    // Verify that the request is from Paystack
    const signature = req.headers['x-paystack-signature'] as string;
    
    if (!signature || !verifyPaystackSignature(signature, req.body)) {
      return res.status(401).send('Invalid signature');
    }
    
    // Process the event
    const event = req.body;
    
    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleSuccessfulCharge(event.data);
        break;
      
      case 'transfer.success':
        await handleSuccessfulTransfer(event.data);
        break;
      
      case 'transfer.failed':
        await handleFailedTransfer(event.data);
        break;
    }
    
    // Acknowledge receipt of the event
    return res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).send('Webhook processing failed');
  }
});

// List banks
router.get('/banks', async (req, res) => {
  try {
    const banksResult = await paymentProcessing.getPaystackBanks();
    
    if (!banksResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: banksResult.message || 'Failed to fetch banks' 
      });
    }
    
    return res.json({ success: true, data: banksResult.data });
  } catch (error) {
    console.error('Banks fetch error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Handle successful charge
async function handleSuccessfulCharge(data: any) {
  try {
    const reference = data.reference;
    const userId = data.metadata?.userId;
    const amount = data.amount / 100; // Convert from kobo to naira
    
    if (!userId) {
      console.error('No user ID found in charge metadata:', data);
      return;
    }
    
    // Check if transaction already exists
    const existingTransactions = await storage.getUserTransactions(userId);
    const transactionExists = existingTransactions.some(t => t.reference === reference);
    
    if (transactionExists) {
      console.log('Transaction already processed:', reference);
      return;
    }
    
    // Create transaction
    const transaction = await storage.createTransaction({
      userId,
      amount,
      type: 'deposit',
      status: 'completed',
      reference,
      currency: 'NGN',
    });
    
    // Update user balance
    const user = await storage.getUser(userId);
    if (!user) {
      console.error('User not found:', userId);
      return;
    }
    
    // Add amount to current balance
    await storage.updateUserBalance(userId, user.walletBalance + amount);
    
    console.log(`Successfully processed charge for user ${userId}, amount ${amount}`);
  } catch (error) {
    console.error('Error handling successful charge:', error);
  }
}

// Handle successful transfer
async function handleSuccessfulTransfer(data: any) {
  try {
    const reference = data.reference;
    
    // Find transaction by reference
    const transaction = await storage.getTransaction(parseInt(reference, 10));
    
    if (!transaction) {
      console.error('Transaction not found for transfer:', reference);
      return;
    }
    
    // Update transaction status
    await storage.updateTransactionStatus(transaction.id, 'completed');
    
    console.log(`Successfully processed transfer for transaction ${transaction.id}`);
  } catch (error) {
    console.error('Error handling successful transfer:', error);
  }
}

// Handle failed transfer
async function handleFailedTransfer(data: any) {
  try {
    const reference = data.reference;
    
    // Find transaction by reference
    const transaction = await storage.getTransaction(parseInt(reference, 10));
    
    if (!transaction) {
      console.error('Transaction not found for failed transfer:', reference);
      return;
    }
    
    // Update transaction status
    await storage.updateTransactionStatus(transaction.id, 'failed');
    
    // Refund the amount to user's wallet if it was a withdrawal
    if (transaction.type === 'withdrawal') {
      const user = await storage.getUser(transaction.userId);
      if (user) {
        await storage.updateUserBalance(user.id, user.walletBalance + transaction.amount);
      }
    }
    
    console.log(`Processed failed transfer for transaction ${transaction.id}`);
  } catch (error) {
    console.error('Error handling failed transfer:', error);
  }
}

export default router;