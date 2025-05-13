import { Router } from 'express';
import { verifyTransaction, trackTransaction, getUserTransactionSummary } from '../utils/transaction-verification';
import { storage } from '../storage';
import { log } from '../vite';
import { initializePaystackTransaction } from '../utils/paystack';

const router = Router();

// Get user transaction summary
router.get('/users/:userId/transactions/summary', async (req, res) => {
  try {
    // Check if user is authorized to access this data
    const userId = parseInt(req.params.userId);
    if (req.session.userId !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this user\'s transactions'
      });
    }

    const summary = await getUserTransactionSummary(userId);
    
    res.json(summary);
  } catch (error) {
    console.error('Error getting transaction summary:', error);
    res.status(500).json({
      success: false,
      message: `Error getting transaction summary: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

// Get user transactions 
router.get('/users/:userId/transactions', async (req, res) => {
  try {
    // Check if user is authorized to access this data
    const userId = parseInt(req.params.userId);
    if (req.session.userId !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this user\'s transactions'
      });
    }

    const transactions = await storage.getUserTransactions(userId);
    
    res.json(transactions);
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      message: `Error getting transactions: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

// Verify a transaction
router.post('/transactions/:transactionId/verify', async (req, res) => {
  try {
    const transactionId = parseInt(req.params.transactionId);
    
    // Get the transaction
    const transaction = await storage.getTransaction(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: `Transaction with ID ${transactionId} not found`
      });
    }
    
    // Check if user is authorized to verify this transaction
    if (req.session.userId !== transaction.userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to verify this transaction'
      });
    }
    
    // Verify the transaction
    const verificationResult = await verifyTransaction(transactionId);
    
    res.json(verificationResult);
  } catch (error) {
    console.error('Error verifying transaction:', error);
    res.status(500).json({
      success: false,
      message: `Error verifying transaction: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

// Initialize a Paystack deposit transaction
router.post('/deposit/initialize', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const { amount, currency } = req.body;
    
    if (!amount || !currency) {
      return res.status(400).json({
        success: false,
        message: 'Amount and currency are required'
      });
    }
    
    // Get user information
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!user.email) {
      return res.status(400).json({
        success: false,
        message: 'User email not found'
      });
    }
    
    // Generate a unique reference with timestamp and user ID
    const reference = `dep_${Date.now()}_${req.session.userId}`;
    
    // Create a record of the transaction to track it
    const transaction = await trackTransaction(
      req.session.userId,
      amount,
      'deposit',
      currency,
      'Deposit via Paystack',
      {
        provider: 'paystack',
        reference
      }
    );
    
    // Initialize Paystack transaction
    const initResult = await initializePaystackTransaction(
      user.email,
      amount,
      reference,
      {
        userId: req.session.userId,
        transactionId: transaction.id
      }
    );
    
    res.json({
      success: true,
      transaction,
      authorizationUrl: initResult.authorizationUrl,
      reference: initResult.reference
    });
  } catch (error) {
    console.error('Error initializing deposit:', error);
    res.status(500).json({
      success: false,
      message: `Error initializing deposit: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

// Handle Paystack webhook
router.post('/paystack/webhook', async (req, res) => {
  try {
    // Verify the request is from Paystack
    const hash = req.headers['x-paystack-signature'];
    
    if (!process.env.PAYSTACK_SECRET_KEY) {
      log('Paystack webhook received but no secret key configured', 'paystack');
      return res.status(500).json({ status: 'error', message: 'Configuration error' });
    }
    
    // In a production environment, verify the signature
    // This is a simplified implementation
    
    const event = req.body;
    
    // Handle event
    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;
      
      // Find transaction with this reference
      const transactions = await storage.getAllTransactions();
      const transaction = transactions.find(t => t.reference === reference);
      
      if (transaction) {
        // Verify the transaction
        await verifyTransaction(transaction.id);
        log(`Paystack webhook processed for transaction ${transaction.id}`, 'paystack');
      } else {
        log(`Paystack webhook received for unknown reference: ${reference}`, 'paystack');
      }
    }
    
    // Return success to acknowledge receipt
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error processing Paystack webhook:', error);
    res.status(500).json({
      status: 'error',
      message: `Error processing webhook: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

// Create withdrawal request
router.post('/withdrawal/request', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const { amount, currency, bankDetails } = req.body;
    
    if (!amount || !currency || !bankDetails) {
      return res.status(400).json({
        success: false,
        message: 'Amount, currency, and bank details are required'
      });
    }
    
    // Get user
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user has sufficient balance
    if ((user.walletBalance || 0) < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }
    
    // Create withdrawal transaction
    const transaction = await storage.createWithdrawalRequest(
      req.session.userId,
      amount,
      currency,
      bankDetails
    );
    
    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    res.status(500).json({
      success: false,
      message: `Error creating withdrawal request: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

export default router;