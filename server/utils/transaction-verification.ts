import { Transaction, TransactionStatus, TransactionType } from '@shared/schema';
import { storage } from '../storage';
import { verifyPaystackTransaction, generateReference } from './paystack';
import { log } from '../vite';

/**
 * Generate a unique reference for tracking transactions
 * @param userId User ID to include in the reference
 * @param type Transaction type 
 * @returns Unique reference string
 */
function generateTransactionReference(userId: number, type: string): string {
  const prefix = type.substring(0, 3).toUpperCase();
  return `${prefix}_${generateReference(userId)}`;
}

/**
 * Transaction verification result
 */
interface VerificationResult {
  success: boolean;
  message: string;
  transaction?: Transaction;
  verifiedAmount?: number;
  metadata?: any;
}

/**
 * Verify a transaction with its payment provider 
 * @param transactionId The ID of the transaction to verify
 * @returns Verification result with status and details
 */
export async function verifyTransaction(transactionId: number): Promise<VerificationResult> {
  try {
    // Get transaction from the database
    const transaction = await storage.getTransaction(transactionId);
    if (!transaction) {
      return {
        success: false,
        message: `Transaction with ID ${transactionId} not found`,
      };
    }

    // Skip verification for non-deposit/non-pending transactions
    if (transaction.type !== 'deposit' || transaction.status !== 'pending') {
      return {
        success: false,
        message: `Transaction ${transactionId} is not a pending deposit (type: ${transaction.type}, status: ${transaction.status})`,
        transaction
      };
    }

    // Check transaction reference exists
    if (!transaction.reference) {
      return {
        success: false,
        message: `Transaction ${transactionId} has no reference`,
        transaction
      };
    }

    // Verify with the appropriate payment provider
    // Check payment details to identify the provider
    const paymentDetails = transaction.paymentDetails ? 
      (typeof transaction.paymentDetails === 'string' ? 
        JSON.parse(transaction.paymentDetails as string) : 
        transaction.paymentDetails) : 
      {};
    
    const provider = paymentDetails.provider || 'paystack';
    
    if (provider === 'paystack') {
      const verificationResult = await verifyPaystackTransaction(transaction.reference);
      
      if (verificationResult.success) {
        // Update transaction status based on verification
        const updatedTransaction = await storage.updateTransactionStatus(
          transactionId, 
          verificationResult.success ? 'completed' : 'failed'
        );

        // If successful, update user balance
        if (verificationResult.success && updatedTransaction.userId) {
          const user = await storage.getUser(updatedTransaction.userId);
          if (user) {
            // Add transaction amount to user balance
            const newBalance = (user.walletBalance || 0) + updatedTransaction.amount;
            await storage.updateUserBalance(user.id, newBalance);
            
            log(`Updated balance for user ${user.username} from ${user.walletBalance} to ${newBalance}`, 'transaction');
          }
        }

        return {
          success: true,
          message: `Transaction ${transactionId} verified successfully`,
          transaction: updatedTransaction,
          verifiedAmount: verificationResult.amount,
          metadata: verificationResult.metadata
        };
      } else {
        // If verification failed, mark transaction as failed
        const updatedTransaction = await storage.updateTransactionStatus(transactionId, 'failed');
        
        return {
          success: false,
          message: verificationResult.message || `Transaction verification failed`,
          transaction: updatedTransaction
        };
      }
    } else {
      return {
        success: false,
        message: `Unsupported payment provider`,
        transaction
      };
    }
  } catch (error) {
    console.error('Transaction verification error:', error);
    return {
      success: false,
      message: `Error verifying transaction: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Process a transaction status update and handle related actions
 * @param transactionId The ID of the transaction to update
 * @param newStatus The new status to set
 * @param metadata Optional metadata for the transaction
 * @returns Updated transaction
 */
export async function processTransactionStatusUpdate(
  transactionId: number,
  newStatus: TransactionStatus,
  metadata?: any
): Promise<Transaction> {
  try {
    // Get the transaction
    const transaction = await storage.getTransaction(transactionId);
    if (!transaction) {
      throw new Error(`Transaction with ID ${transactionId} not found`);
    }

    // Skip if status is already set to the new value
    if (transaction.status === newStatus) {
      return transaction;
    }

    // Update transaction status
    const updatedTransaction = await storage.updateTransactionStatus(transactionId, newStatus);
    
    // Handle additional processing based on transaction type and new status
    if (newStatus === 'completed') {
      // For completed deposits, update user balance
      if (transaction.type === 'deposit' && transaction.userId) {
        const user = await storage.getUser(transaction.userId);
        if (user) {
          const newBalance = (user.walletBalance || 0) + transaction.amount;
          await storage.updateUserBalance(user.id, newBalance);
          
          log(`Deposit completed: Updated balance for user ${user.username} from ${user.walletBalance} to ${newBalance}`, 'transaction');
        }
      }
      
      // For completed withdrawals, no additional action needed as balance was already deducted when creating the withdrawal
    } else if (newStatus === 'failed') {
      // For failed withdrawals, refund the user's balance
      if (transaction.type === 'withdrawal' && transaction.userId) {
        const user = await storage.getUser(transaction.userId);
        if (user) {
          const newBalance = (user.walletBalance || 0) + transaction.amount;
          await storage.updateUserBalance(user.id, newBalance);
          
          log(`Withdrawal failed: Refunded ${transaction.amount} to user ${user.username}`, 'transaction');
        }
      }
      
      // For failed deposits, no action needed
    }

    return updatedTransaction;
  } catch (error) {
    console.error('Error processing transaction status update:', error);
    throw error;
  }
}

/**
 * Track and record a new transaction
 * @param userId The user ID associated with the transaction
 * @param amount The transaction amount
 * @param type The transaction type (deposit, withdrawal, winnings, stake)
 * @param currency The currency code
 * @param description Optional transaction description
 * @param metadata Optional transaction metadata
 * @returns The created transaction
 */
export async function trackTransaction(
  userId: number,
  amount: number,
  type: TransactionType,
  currency: string,
  description?: string,
  metadata?: any
): Promise<Transaction> {
  try {
    // Create transaction record
    const transaction = await storage.createTransaction({
      userId,
      amount,
      type,
      status: 'pending',
      currency,
      description: description || `${type.charAt(0).toUpperCase() + type.slice(1)} transaction`,
      reference: metadata?.reference || generateTransactionReference(userId, type),
      paymentDetails: metadata ? JSON.stringify(metadata) : null
    });
    
    log(`Created ${type} transaction of ${amount} ${currency} for user ${userId}`, 'transaction');
    
    // Handle different transaction types
    if (type === 'withdrawal') {
      // For withdrawals, immediately deduct from user balance
      const user = await storage.getUser(userId);
      if (user) {
        if ((user.walletBalance || 0) < amount) {
          // If insufficient balance, fail the transaction
          return await processTransactionStatusUpdate(transaction.id, 'failed');
        }
        
        // Deduct amount from user balance
        const newBalance = (user.walletBalance || 0) - amount;
        await storage.updateUserBalance(userId, newBalance);
        
        log(`Withdrawal pending: Deducted ${amount} from user ${user.username}`, 'transaction');
      }
    } else if (type === 'stake') {
      // For stakes, immediately deduct from user balance
      const user = await storage.getUser(userId);
      if (user) {
        if ((user.walletBalance || 0) < amount) {
          // If insufficient balance, fail the transaction
          return await processTransactionStatusUpdate(transaction.id, 'failed');
        }
        
        // Deduct amount from user balance
        const newBalance = (user.walletBalance || 0) - amount;
        await storage.updateUserBalance(userId, newBalance);
        
        // Mark stake transactions as completed immediately
        return await processTransactionStatusUpdate(transaction.id, 'completed');
      }
    } else if (type === 'winnings') {
      // For winnings, immediately add to user balance and mark as completed
      const user = await storage.getUser(userId);
      if (user) {
        const newBalance = (user.walletBalance || 0) + amount;
        await storage.updateUserBalance(userId, newBalance);
        
        log(`Winnings: Added ${amount} to user ${user.username}`, 'transaction');
        
        // Mark winnings transactions as completed immediately
        return await processTransactionStatusUpdate(transaction.id, 'completed');
      }
    }
    
    return transaction;
  } catch (error) {
    console.error('Error tracking transaction:', error);
    throw error;
  }
}

/**
 * Get a comprehensive transaction history for a user with additional details
 * @param userId The user ID to get transactions for
 * @returns Transaction summary with totals and individual transactions
 */
export async function getUserTransactionSummary(userId: number) {
  try {
    const transactions = await storage.getUserTransactions(userId);
    
    // Calculate totals by type and status
    const summary = {
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalWinnings: 0,
      totalStakes: 0,
      pendingDeposits: 0,
      pendingWithdrawals: 0,
      failedTransactions: 0,
      recentTransactions: transactions.slice(0, 10), // Most recent 10 transactions
      allTransactions: transactions
    };
    
    // Calculate statistics
    for (const transaction of transactions) {
      if (transaction.status === 'completed') {
        if (transaction.type === 'deposit') {
          summary.totalDeposits += transaction.amount;
        } else if (transaction.type === 'withdrawal') {
          summary.totalWithdrawals += transaction.amount;
        } else if (transaction.type === 'winnings') {
          summary.totalWinnings += transaction.amount;
        } else if (transaction.type === 'stake') {
          summary.totalStakes += transaction.amount;
        }
      } else if (transaction.status === 'pending') {
        if (transaction.type === 'deposit') {
          summary.pendingDeposits += transaction.amount;
        } else if (transaction.type === 'withdrawal') {
          summary.pendingWithdrawals += transaction.amount;
        }
      } else if (transaction.status === 'failed') {
        summary.failedTransactions++;
      }
    }
    
    return summary;
  } catch (error) {
    console.error('Error getting user transaction summary:', error);
    throw error;
  }
}

/**
 * Check for pending transactions that need verification and process them
 */
export async function verifyPendingTransactions() {
  try {
    // In a real implementation, we would query for all pending deposit transactions
    // For now, we'll just log that this would happen
    log('Checking for pending transactions that need verification...', 'transaction');
    
    // This would query pending transactions and verify them
    // const pendingDeposits = await storage.getPendingDepositTransactions();
    
    // for (const transaction of pendingDeposits) {
    //   await verifyTransaction(transaction.id);
    // }
  } catch (error) {
    console.error('Error verifying pending transactions:', error);
  }
}

export default {
  verifyTransaction,
  processTransactionStatusUpdate,
  trackTransaction,
  getUserTransactionSummary,
  verifyPendingTransactions
};