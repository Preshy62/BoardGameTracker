import { Router, Request } from 'express';
import { verifyTransaction, trackTransaction, getUserTransactionSummary, processTransactionStatusUpdate } from '../utils/transaction-verification';
import { storage } from '../storage';
import { log } from '../vite';
import { initializePaystackTransaction } from '../utils/paystack';

// Add request type extension for auth functions
declare global {
  namespace Express {
    interface Request {
      isAuthenticated?: () => boolean;
    }
  }
}

const router = Router();

// Get user transaction summary
router.get('/users/:userId/transactions/summary', async (req, res) => {
  try {
    // Check if user is authorized to access this data
    const userId = parseInt(req.params.userId);
    if ((req.session as any).userId !== userId && !req.isAuthenticated?.()) {
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

// Get user transactions with optional filtering
router.get('/users/:userId/transactions', async (req, res) => {
  try {
    // Check if user is authorized to access this data
    const userId = parseInt(req.params.userId);
    if ((req.session as any).userId !== userId && !req.isAuthenticated?.()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this user\'s transactions'
      });
    }
    
    // Extract filter parameters from query
    const {
      startDate,
      endDate,
      type,
      status,
      minAmount,
      maxAmount,
      currency
    } = req.query;
    
    // Build filter object
    const filter: Record<string, any> = {};
    
    // Parse date strings to Date objects if provided
    if (startDate && typeof startDate === 'string') {
      filter.startDate = new Date(startDate);
    }
    
    if (endDate && typeof endDate === 'string') {
      // Set endDate to end of the day
      const date = new Date(endDate);
      date.setHours(23, 59, 59, 999);
      filter.endDate = date;
    }
    
    // Add other filters if provided
    if (type && typeof type === 'string') {
      filter.type = type;
    }
    
    if (status && typeof status === 'string') {
      filter.status = status;
    }
    
    if (minAmount && typeof minAmount === 'string') {
      filter.minAmount = parseFloat(minAmount);
    }
    
    if (maxAmount && typeof maxAmount === 'string') {
      filter.maxAmount = parseFloat(maxAmount);
    }
    
    if (currency && typeof currency === 'string') {
      filter.currency = currency;
    }
    
    // Apply filters to get transactions
    const transactions = await storage.getUserTransactions(userId);
    
    // Filter transactions in memory since we haven't updated the storage interface yet
    const filteredTransactions = transactions.filter(transaction => {
      // Apply date range filter
      if (filter.startDate && new Date(transaction.createdAt) < filter.startDate) {
        return false;
      }
      
      if (filter.endDate && new Date(transaction.createdAt) > filter.endDate) {
        return false;
      }
      
      // Apply type filter
      if (filter.type && transaction.type !== filter.type) {
        return false;
      }
      
      // Apply status filter
      if (filter.status && transaction.status !== filter.status) {
        return false;
      }
      
      // Apply amount range filter
      if (filter.minAmount && transaction.amount < filter.minAmount) {
        return false;
      }
      
      if (filter.maxAmount && transaction.amount > filter.maxAmount) {
        return false;
      }
      
      // Apply currency filter
      if (filter.currency && transaction.currency !== filter.currency) {
        return false;
      }
      
      return true;
    });
    
    // Include summary metrics for filtered transactions
    const totalDeposits = filteredTransactions
      .filter(t => t.type === 'deposit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalWithdrawals = filteredTransactions
      .filter(t => t.type === 'withdrawal' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalWinnings = filteredTransactions
      .filter(t => t.type === 'winnings' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalStakes = filteredTransactions
      .filter(t => t.type === 'stake')
      .reduce((sum, t) => sum + t.amount, 0);
    
    res.json({
      transactions: filteredTransactions,
      count: filteredTransactions.length,
      summary: {
        totalDeposits,
        totalWithdrawals,
        totalWinnings,
        totalStakes,
        netBalance: totalDeposits + totalWinnings - totalWithdrawals - totalStakes
      },
      filter: Object.keys(filter).length > 0 ? filter : null
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      message: `Error getting transactions: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

// Export transactions to CSV
router.get('/users/:userId/transactions/export', async (req, res) => {
  try {
    // Check if user is authorized to access this data
    const userId = parseInt(req.params.userId);
    if ((req.session as any).userId !== userId && !req.isAuthenticated?.()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this user\'s transactions'
      });
    }
    
    // Use the same filtering logic as in the GET route
    const {
      startDate,
      endDate,
      type,
      status,
      minAmount,
      maxAmount,
      currency
    } = req.query;
    
    // Build filter object
    const filter: Record<string, any> = {};
    
    if (startDate && typeof startDate === 'string') {
      filter.startDate = new Date(startDate);
    }
    
    if (endDate && typeof endDate === 'string') {
      const date = new Date(endDate);
      date.setHours(23, 59, 59, 999);
      filter.endDate = date;
    }
    
    if (type && typeof type === 'string') filter.type = type;
    if (status && typeof status === 'string') filter.status = status;
    if (minAmount && typeof minAmount === 'string') filter.minAmount = parseFloat(minAmount);
    if (maxAmount && typeof maxAmount === 'string') filter.maxAmount = parseFloat(maxAmount);
    if (currency && typeof currency === 'string') filter.currency = currency;
    
    // Get transactions
    const transactions = await storage.getUserTransactions(userId);
    
    // Filter transactions
    const filteredTransactions = transactions.filter(transaction => {
      // Date filters
      if (filter.startDate && transaction.createdAt) {
        const transactionDate = new Date(transaction.createdAt.toString());
        if (transactionDate < filter.startDate) return false;
      }
      
      if (filter.endDate && transaction.createdAt) {
        const transactionDate = new Date(transaction.createdAt.toString());
        if (transactionDate > filter.endDate) return false;
      }
      if (filter.type && transaction.type !== filter.type) return false;
      if (filter.status && transaction.status !== filter.status) return false;
      if (filter.minAmount && transaction.amount < filter.minAmount) return false;
      if (filter.maxAmount && transaction.amount > filter.maxAmount) return false;
      if (filter.currency && transaction.currency !== filter.currency) return false;
      return true;
    });
    
    // Format date for filename
    const dateStr = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    
    // Set response headers for CSV download
    res.setHeader('Content-Disposition', `attachment; filename=transactions-${dateStr}.csv`);
    res.setHeader('Content-Type', 'text/csv');
    
    // Create CSV header
    let csv = 'ID,Date,Type,Status,Amount,Currency,Description,Reference\n';
    
    // Add each transaction as a CSV row
    filteredTransactions.forEach(transaction => {
      let dateStr = 'N/A';
      if (transaction.createdAt) {
        const date = new Date(transaction.createdAt.toString());
        dateStr = date.toISOString().split('T')[0];
      }
      
      const description = transaction.description || '';
      const formattedDescription = description.replace(/"/g, '""'); // Escape quotes for CSV
      
      // Build CSV row
      csv += `${transaction.id},${dateStr},${transaction.type},${transaction.status},${transaction.amount},${transaction.currency},"${formattedDescription}",${transaction.reference || ''}\n`;
    });
    
    // Send the CSV data
    res.send(csv);
  } catch (error) {
    console.error('Error exporting transactions:', error);
    res.status(500).json({
      success: false,
      message: `Error exporting transactions: ${error instanceof Error ? error.message : String(error)}`
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
    if ((req.session as any).userId !== transaction.userId && !req.isAuthenticated?.()) {
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
    // const secret = process.env.PAYSTACK_SECRET_KEY;
    // const computedHash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
    // if (computedHash !== hash) {
    //   log('Invalid webhook signature', 'paystack');
    //   return res.status(401).json({ status: 'error', message: 'Invalid signature' });
    // }
    
    const event = req.body;
    log(`Received Paystack webhook event: ${event.event}`, 'paystack');
    
    // Extract common data
    const data = event.data || {};
    const reference = data.reference;
    const amount = data.amount ? data.amount / 100 : 0; // Convert from kobo to naira
    
    // Find existing transaction by reference
    let transaction = null;
    let userId = data.metadata?.userId;
    
    if (!userId && reference) {
      // Search for transaction by reference if userId not in metadata
      const users = await storage.getAllUsers();
      
      // Search through all users' transactions for the reference
      for (const user of users) {
        const userTransactions = await storage.getUserTransactions(user.id);
        const found = userTransactions.find(t => t.reference === reference);
        if (found) {
          transaction = found;
          userId = user.id;
          break;
        }
      }
    } else if (userId) {
      // If userId is available, check that user's transactions
      const userTransactions = await storage.getUserTransactions(Number(userId));
      transaction = userTransactions.find(t => t.reference === reference);
    }
    
    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        // Process successful payment
        if (transaction) {
          // Update existing transaction
          await processTransactionStatusUpdate(transaction.id, 'completed');
          log(`Updated transaction ${transaction.id} to completed via webhook`, 'paystack');
        } else if (userId) {
          // Create new transaction if it doesn't exist
          const user = await storage.getUser(Number(userId));
          
          if (user) {
            // Record the transaction
            const newTransaction = await storage.createTransaction({
              userId: Number(userId),
              amount,
              type: 'deposit',
              status: 'completed',
              currency: 'NGN',
              description: `Paystack payment of ${amount} NGN via ${data.channel || 'card'}`,
              reference,
              paymentDetails: JSON.stringify({
                paymentProvider: 'paystack',
                paymentMethod: data.channel || 'card',
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
            log(`Created new transaction ${newTransaction.id} via webhook`, 'paystack');
          }
        } else {
          log(`Paystack webhook received for unknown reference: ${reference}`, 'paystack');
        }
        break;
        
      case 'transfer.success':
        // Process successful withdrawal/transfer
        if (transaction) {
          await processTransactionStatusUpdate(transaction.id, 'completed');
          log(`Completed withdrawal ${transaction.id} via webhook`, 'paystack');
        }
        break;
        
      case 'transfer.failed':
        // Process failed withdrawal/transfer
        if (transaction) {
          await processTransactionStatusUpdate(transaction.id, 'failed');
          log(`Failed withdrawal ${transaction.id} via webhook`, 'paystack');
        }
        break;
        
      case 'charge.dispute.create':
        // Handle new dispute
        if (transaction) {
          // Mark transaction as disputed in payment details
          const paymentDetails = transaction.paymentDetails ? 
            JSON.parse(transaction.paymentDetails as string) : {};
          
          const updatedDetails = {
            ...paymentDetails,
            disputed: true,
            disputeId: data.id,
            disputeStatus: data.status,
            disputeReason: data.reason
          };
          
          // Update transaction payment details
          // Note: Need to add an updateTransactionDetails method to storage
          log(`Transaction ${transaction.id} has been disputed: ${data.reason}`, 'paystack');
        }
        break;
        
      case 'charge.refund.processed':
        // Handle processed refund
        if (transaction) {
          // Create a new refund transaction linked to the original
          const user = await storage.getUser(Number(transaction.userId));
          if (user) {
            await storage.createTransaction({
              userId: user.id,
              amount: data.amount / 100,
              type: 'refund',
              status: 'completed',
              currency: 'NGN',
              description: `Refund for transaction #${transaction.id}`,
              reference: `refund_${reference}`,
              paymentDetails: JSON.stringify({
                originalTransactionId: transaction.id,
                refundId: data.id,
                refundChannel: data.channel,
                refundReason: data.reason
              })
            });
            
            log(`Created refund for transaction ${transaction.id}`, 'paystack');
          }
        }
        break;
        
      default:
        // Log other events
        log(`Unhandled Paystack webhook event: ${event.event}`, 'paystack');
    }
    
    // Return success to acknowledge receipt
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error processing Paystack webhook:', error);
    log(`Webhook processing error: ${error instanceof Error ? error.message : String(error)}`, 'paystack');
    res.status(200).json({ 
      // Always return 200 to avoid webhook retries, but include error details
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