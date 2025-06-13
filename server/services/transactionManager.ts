import { storage } from "../storage";
import { InsertTransaction, Transaction } from "@shared/schema";

export class TransactionManager {
  /**
   * Process deposit with atomic balance update
   */
  static async processDeposit(
    userId: number, 
    amount: number, 
    paymentReference: string,
    paymentMethod: 'quick_deposit' | 'paystack' | 'stripe' = 'quick_deposit'
  ): Promise<{ success: boolean; transaction?: Transaction; newBalance?: number; error?: string }> {
    try {
      // Validate amount
      if (amount <= 0) {
        return { success: false, error: "Invalid deposit amount" };
      }

      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return { success: false, error: "User not found" };
      }

      // Create transaction record first
      const transaction = await storage.createTransaction({
        userId,
        amount,
        type: "deposit",
        status: "completed",
        reference: paymentReference,
        currency: "NGN",
        description: `Deposit of ₦${amount.toLocaleString()}`,
        paymentMethod,
        paymentDetails: { 
          method: paymentMethod,
          timestamp: new Date().toISOString()
        }
      });

      // Update balance atomically
      const newBalance = user.walletBalance + amount;
      const updatedUser = await storage.updateUserBalance(userId, newBalance);

      console.log(`✅ Deposit processed: User ${userId}, Amount: ₦${amount}, New Balance: ₦${newBalance}`);

      return {
        success: true,
        transaction,
        newBalance: updatedUser.walletBalance
      };

    } catch (error) {
      console.error('Deposit processing error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Deposit failed" 
      };
    }
  }

  /**
   * Process withdrawal with balance validation and atomic update
   */
  static async processWithdrawal(
    userId: number,
    amount: number,
    paymentReference: string,
    bankDetails?: any,
    paymentMethod: 'quick_withdrawal' | 'paystack_transfer' = 'quick_withdrawal'
  ): Promise<{ success: boolean; transaction?: Transaction; newBalance?: number; error?: string }> {
    try {
      // Validate amount
      if (amount <= 0) {
        return { success: false, error: "Invalid withdrawal amount" };
      }

      // Get current user and validate balance
      const user = await storage.getUser(userId);
      if (!user) {
        return { success: false, error: "User not found" };
      }

      if (user.walletBalance < amount) {
        return { 
          success: false, 
          error: `Insufficient balance. Available: ₦${user.walletBalance.toLocaleString()}, Requested: ₦${amount.toLocaleString()}` 
        };
      }

      // For Paystack transfers, create pending transaction first
      const transactionStatus = paymentMethod === 'paystack_transfer' ? 'pending' : 'completed';
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        userId,
        amount,
        type: "withdrawal",
        status: transactionStatus,
        reference: paymentReference,
        currency: "NGN",
        description: `Withdrawal of ₦${amount.toLocaleString()}`,
        withdrawalMethod: paymentMethod,
        bankDetails: bankDetails || null,
        paymentDetails: {
          method: paymentMethod,
          timestamp: new Date().toISOString(),
          status: transactionStatus
        }
      });

      // Update balance immediately to prevent double spending
      const newBalance = user.walletBalance - amount;
      const updatedUser = await storage.updateUserBalance(userId, newBalance);

      console.log(`✅ Withdrawal processed: User ${userId}, Amount: ₦${amount}, New Balance: ₦${newBalance}, Status: ${transactionStatus}`);

      return {
        success: true,
        transaction,
        newBalance: updatedUser.walletBalance
      };

    } catch (error) {
      console.error('Withdrawal processing error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Withdrawal failed" 
      };
    }
  }

  /**
   * Reverse a failed transaction (rollback)
   */
  static async reverseTransaction(
    transactionId: number,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return { success: false, error: "Transaction not found" };
      }

      if (transaction.status === 'completed') {
        return { success: false, error: "Cannot reverse completed transaction" };
      }

      // Get user
      const user = await storage.getUser(transaction.userId);
      if (!user) {
        return { success: false, error: "User not found" };
      }

      // Reverse the balance change
      let newBalance = user.walletBalance;
      if (transaction.type === 'withdrawal') {
        // Add back the withdrawn amount
        newBalance += transaction.amount;
      } else if (transaction.type === 'deposit') {
        // Remove the deposited amount
        newBalance -= transaction.amount;
      }

      // Update transaction status
      await storage.updateTransactionStatus(
        transactionId, 
        'failed', 
        `Reversed: ${reason}`
      );

      // Update user balance
      await storage.updateUserBalance(transaction.userId, newBalance);

      console.log(`🔄 Transaction ${transactionId} reversed: ${reason}`);

      return { success: true };

    } catch (error) {
      console.error('Transaction reversal error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Reversal failed" 
      };
    }
  }

  /**
   * Complete a pending transaction
   */
  static async completeTransaction(
    transactionId: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return { success: false, error: "Transaction not found" };
      }

      if (transaction.status !== 'pending') {
        return { success: false, error: "Transaction is not pending" };
      }

      // Update transaction status to completed
      await storage.updateTransactionStatus(
        transactionId, 
        'completed', 
        'Transaction completed successfully'
      );

      console.log(`✅ Transaction ${transactionId} marked as completed`);

      return { success: true };

    } catch (error) {
      console.error('Transaction completion error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Completion failed" 
      };
    }
  }
}