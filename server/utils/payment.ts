import { RandomNumberGenerator } from "../game/randomGenerator";
import { 
  generateReference, 
  initializePayment, 
  verifyPayment, 
  initiateTransfer, 
  createTransferRecipient,
  getBanks,
  verifyBankAccount
} from './paystack';

/**
 * Payment processing service for handling deposits and withdrawals
 * Integrates with Paystack for real payment processing, with fallback to mock implementation
 */
class PaymentProcessing {
  private rng: RandomNumberGenerator;
  private useRealPaystack: boolean;

  constructor() {
    this.rng = new RandomNumberGenerator();
    this.useRealPaystack = !!process.env.PAYSTACK_SECRET_KEY;
    
    if (!this.useRealPaystack) {
      console.warn('PAYSTACK_SECRET_KEY not set. Using mock payment processing.');
    }
  }

  /**
   * Process a deposit transaction
   * Integrates with Paystack for payment processing
   * 
   * @param userId The ID of the user making the deposit
   * @param amount The amount to deposit
   * @param email The user's email for Paystack
   * @returns Result object with success status, reference, and data for further processing
   */
  async processDeposit(userId: number, amount: number, email?: string): Promise<{
    success: boolean;
    reference: string;
    authorizationUrl?: string;
    message?: string;
    useQuickDeposit?: boolean;
  }> {
    try {
      // Generate a reference
      const reference = this.useRealPaystack 
        ? generateReference(userId)
        : this.rng.generateTransactionReference('DEP');
      
      // For quick deposits (simulated payments), bypass Paystack
      if (!email || amount <= 0) {
        await this.simulateProcessingDelay();
        return {
          success: true,
          reference,
          useQuickDeposit: true
        };
      }
      
      // If Paystack integration is available, use it
      if (this.useRealPaystack) {
        try {
          // Set callback URL based on environment
          const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
          const callbackUrl = `${baseUrl}/api/payment/verify`;
          
          // Initialize payment with Paystack
          const paystackResponse = await initializePayment(
            email,
            amount,
            reference,
            callbackUrl,
            { userId }
          );
          
          return {
            success: true,
            reference,
            authorizationUrl: paystackResponse.authorization_url,
          };
        } catch (paystackError) {
          console.error('Paystack initialization error:', paystackError);
          // Fall back to mock implementation if Paystack fails
          await this.simulateProcessingDelay();
          return {
            success: true,
            reference,
            useQuickDeposit: true,
            message: 'Using fallback payment due to Paystack error'
          };
        }
      }
      
      // If no Paystack integration, use mock implementation
      await this.simulateProcessingDelay();
      return {
        success: true,
        reference,
        useQuickDeposit: true
      };
    } catch (error) {
      console.error('Deposit processing error:', error);
      return {
        success: false,
        reference: '',
        message: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }

  /**
   * Process a withdrawal transaction
   * Integrates with Paystack for bank transfers
   * 
   * @param userId The ID of the user making the withdrawal
   * @param amount The amount to withdraw
   * @param bankDetails Bank account details for the transfer
   * @returns Result object with success status, reference, and message
   */
  async processWithdrawal(
    userId: number, 
    amount: number, 
    bankDetails?: {
      accountNumber: string;
      bankCode: string;
      accountName: string;
    }
  ): Promise<{
    success: boolean;
    reference: string;
    message?: string;
    transferRecipient?: any;
    transferData?: any;
  }> {
    try {
      // Generate a reference
      const reference = this.useRealPaystack 
        ? generateReference(userId) 
        : this.rng.generateTransactionReference('WTH');
      
      // If Paystack integration is available and bank details are provided, use it
      if (this.useRealPaystack && bankDetails) {
        try {
          // Create a transfer recipient
          const recipientResponse = await createTransferRecipient(
            bankDetails.accountName,
            bankDetails.accountNumber,
            bankDetails.bankCode
          );
          
          // Initiate the transfer
          const transferResponse = await initiateTransfer(
            amount,
            recipientResponse.recipient_code,
            reference,
            `BBG Withdrawal for user ${userId}`
          );
          
          return {
            success: true,
            reference,
            transferRecipient: recipientResponse,
            transferData: transferResponse,
            message: 'Withdrawal initiated successfully'
          };
        } catch (paystackError) {
          console.error('Paystack transfer error:', paystackError);
          // Fall back to mock implementation if Paystack fails
          await this.simulateProcessingDelay();
          return {
            success: true,
            reference,
            message: 'Using fallback withdrawal due to Paystack error'
          };
        }
      }
      
      // If no Paystack integration or no bank details, use mock implementation
      await this.simulateProcessingDelay();
      
      // For the demo, always succeed
      return {
        success: true,
        reference,
        message: 'Withdrawal request processed'
      };
    } catch (error) {
      console.error('Withdrawal processing error:', error);
      return {
        success: false,
        reference: '',
        message: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }

  /**
   * Simulate payment processing delay
   */
  private async simulateProcessingDelay(): Promise<void> {
    return new Promise((resolve) => {
      const delayMs = this.rng.generateRandomInt(500, 1500);
      setTimeout(resolve, delayMs);
    });
  }

  /**
   * Process payment using Paystack
   * This integrates with the Paystack payment gateway
   */
  async processPaystackPayment(
    email: string,
    amount: number,
    reference: string,
    metadata: any = {}
  ): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    try {
      if (!this.useRealPaystack) {
        // If Paystack API is not available, use mock implementation
        await this.simulateProcessingDelay();
        
        return {
          success: true,
          data: {
            authorization_url: `https://checkout.paystack.com/${reference}`,
            access_code: 'mock_access_code',
            reference,
          },
        };
      }
      
      // Set callback URL based on environment
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      const callbackUrl = `${baseUrl}/api/payment/verify`;
      
      // Initialize payment with Paystack
      const paystackResponse = await initializePayment(
        email,
        amount,
        reference,
        callbackUrl,
        metadata
      );
      
      return {
        success: true,
        data: paystackResponse,
      };
    } catch (error) {
      console.error('Paystack payment error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Paystack payment failed',
      };
    }
  }
  
  /**
   * Verify a Paystack payment
   */
  async verifyPaystackPayment(reference: string): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    try {
      if (!this.useRealPaystack) {
        // If Paystack API is not available, use mock implementation
        await this.simulateProcessingDelay();
        
        return {
          success: true,
          data: {
            status: 'success',
            reference,
            amount: 100000, // Mock amount in kobo (₦1,000)
            customer: {
              email: 'user@example.com',
            },
          },
        };
      }
      
      // Verify payment with Paystack
      const verificationResult = await verifyPayment(reference);
      
      return {
        success: true,
        data: verificationResult,
      };
    } catch (error) {
      console.error('Paystack verification error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Paystack verification failed',
      };
    }
  }
  
  /**
   * Get list of banks from Paystack
   */
  async getPaystackBanks(): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    if (!this.useRealPaystack) {
      // Return mock bank data if Paystack is not available
      return {
        success: true,
        data: [
          { name: 'Access Bank', code: '044' },
          { name: 'Guaranty Trust Bank', code: '058' },
          { name: 'First Bank of Nigeria', code: '011' },
          { name: 'United Bank for Africa', code: '033' },
          { name: 'Zenith Bank', code: '057' },
        ]
      };
    }
    
    try {
      const banks = await getBanks();
      return {
        success: true,
        data: banks
      };
    } catch (error) {
      console.error('Paystack banks fetch error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch banks'
      };
    }
  }

  /**
   * Verify a bank account with Paystack
   */
  async verifyBankAccount(
    accountNumber: string,
    bankCode: string
  ): Promise<{
    success: boolean;
    accountName?: string;
    message?: string;
  }> {
    if (!this.useRealPaystack) {
      // Return mock verification data if Paystack is not available
      await this.simulateProcessingDelay();
      
      if (accountNumber.length !== 10) {
        return {
          success: false,
          message: 'Invalid account number. Must be 10 digits.'
        };
      }
      
      // For demo purposes, generate a fake account name based on the account number
      // In a real app, this would validate with the actual bank
      const lastName = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown'][parseInt(accountNumber.charAt(0)) % 5];
      const firstName = ['John', 'Mary', 'James', 'Patricia', 'Robert'][parseInt(accountNumber.charAt(1)) % 5];
      
      return {
        success: true,
        accountName: `${firstName} ${lastName}`
      };
    }
    
    try {
      const accountData = await verifyBankAccount(accountNumber, bankCode);
      
      return {
        success: true,
        accountName: accountData.account_name
      };
    } catch (error) {
      console.error('Bank account verification error:', error);
      return {
        success: false,
        message: error instanceof Error 
          ? error.message 
          : 'Failed to verify bank account. Please check the details and try again.'
      };
    }
  }

  /**
   * Process payment for Stripe (global payment processor)
   * This would be implemented in a real application
   */
  async processStripePayment(
    amount: number,
    currency: string = 'usd',
    description: string = 'Big Boys Game deposit'
  ): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    try {
      // In a real implementation, we would make an API call to Stripe
      // https://stripe.com/docs/api/payment_intents
      
      // For this demo, simulate a successful response
      await this.simulateProcessingDelay();
      
      const clientSecret = `pi_mock_${this.rng.generateRandomString(24)}_secret_${this.rng.generateRandomString(24)}`;
      
      return {
        success: true,
        data: {
          id: `pi_${this.rng.generateRandomString(24)}`,
          object: 'payment_intent',
          amount: amount * 100, // Stripe uses cents
          client_secret: clientSecret,
          currency,
          description,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Stripe payment failed',
      };
    }
  }
}

export const paymentProcessing = new PaymentProcessing();
