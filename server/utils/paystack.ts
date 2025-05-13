import { log } from '../vite';

// Paystack verification result interface
interface PaystackVerificationResult {
  success: boolean;
  message?: string;
  reference?: string;
  amount?: number;
  metadata?: any;
}

/**
 * Generate a unique reference for Paystack transactions
 * @param userId User ID to include in the reference
 * @returns Unique reference string
 */
export function generateReference(userId: number): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `BBG_${userId}_${timestamp}_${randomStr}`;
}

/**
 * Initialize a payment transaction with Paystack
 * @param email Customer email
 * @param amount Amount in Naira
 * @param reference Optional reference code
 * @param callbackUrl URL to redirect after payment
 * @param metadata Additional metadata for the transaction
 * @returns Paystack initialization response
 */
export async function initializePayment(
  email: string,
  amount: number,
  reference: string,
  callbackUrl: string,
  metadata: any = {}
): Promise<any> {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    // Convert amount to kobo (Paystack amount is in kobo)
    const amountInKobo = Math.round(amount * 100);
    
    // Prepare request payload
    const payload = {
      email,
      amount: amountInKobo,
      reference,
      callback_url: callbackUrl,
      metadata
    };

    // Make API request to Paystack to initialize transaction
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`Paystack initialization error: ${errorText}`, 'paystack');
      
      throw new Error(`Paystack initialization failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status) {
      return data.data;
    } else {
      throw new Error(data.message || 'Unknown error initializing payment');
    }
  } catch (error) {
    console.error('Error initializing Paystack payment:', error);
    throw error;
  }
}

/**
 * Verify a payment transaction with Paystack
 * @param reference The transaction reference to verify
 * @returns Verification result
 */
export async function verifyPayment(reference: string): Promise<any> {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    // Make API request to Paystack to verify transaction
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      log(`Paystack verification error: ${errorText}`, 'paystack');
      
      throw new Error(`Paystack verification failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status) {
      return data.data;
    } else {
      throw new Error(data.message || 'Unknown error verifying payment');
    }
  } catch (error) {
    console.error('Error verifying Paystack payment:', error);
    throw error;
  }
}

/**
 * Create a transfer recipient for bank transfers
 * @param name Account holder name
 * @param accountNumber Bank account number
 * @param bankCode Bank code
 * @returns Transfer recipient object
 */
export async function createTransferRecipient(
  name: string,
  accountNumber: string,
  bankCode: string
): Promise<any> {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    const payload = {
      type: 'nuban',
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN'
    };

    const response = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`Paystack transfer recipient error: ${errorText}`, 'paystack');
      
      throw new Error(`Paystack transfer recipient creation failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status) {
      return data.data;
    } else {
      throw new Error(data.message || 'Unknown error creating transfer recipient');
    }
  } catch (error) {
    console.error('Error creating Paystack transfer recipient:', error);
    throw error;
  }
}

/**
 * Initiate a transfer to a recipient
 * @param amount Amount to transfer in Naira
 * @param recipientCode Recipient code from createTransferRecipient
 * @param reference Transaction reference
 * @param reason Reason for the transfer
 * @returns Transfer result
 */
export async function initiateTransfer(
  amount: number,
  recipientCode: string,
  reference: string,
  reason: string
): Promise<any> {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    // Convert amount to kobo (Paystack amount is in kobo)
    const amountInKobo = Math.round(amount * 100);
    
    const payload = {
      source: 'balance',
      amount: amountInKobo,
      recipient: recipientCode,
      reference,
      reason
    };

    const response = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`Paystack transfer error: ${errorText}`, 'paystack');
      
      throw new Error(`Paystack transfer failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status) {
      return data.data;
    } else {
      throw new Error(data.message || 'Unknown error initiating transfer');
    }
  } catch (error) {
    console.error('Error initiating Paystack transfer:', error);
    throw error;
  }
}

/**
 * Get list of supported banks from Paystack
 * @returns List of banks
 */
export async function getBanks(): Promise<any[]> {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    const response = await fetch('https://api.paystack.co/bank?currency=NGN', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`Paystack banks fetch error: ${errorText}`, 'paystack');
      
      throw new Error(`Paystack banks fetch failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status) {
      return data.data;
    } else {
      throw new Error(data.message || 'Unknown error fetching banks');
    }
  } catch (error) {
    console.error('Error fetching Paystack banks:', error);
    throw error;
  }
}

/**
 * Verify bank account details
 * @param accountNumber Account number to verify
 * @param bankCode Bank code
 * @returns Account verification results
 */
export async function verifyBankAccount(
  accountNumber: string,
  bankCode: string
): Promise<any> {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      log(`Paystack account verification error: ${errorText}`, 'paystack');
      
      throw new Error(`Paystack account verification failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status) {
      return data.data;
    } else {
      throw new Error(data.message || 'Unknown error verifying account');
    }
  } catch (error) {
    console.error('Error verifying Paystack bank account:', error);
    throw error;
  }
}

/**
 * Verify a Paystack transaction with their API (custom variant)
 * @param reference The Paystack transaction reference
 * @returns Verification result
 */
export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackVerificationResult> {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return {
        success: false,
        message: 'Paystack secret key not configured'
      };
    }

    // Make API request to Paystack to verify transaction
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      log(`Paystack verification error for ${reference}: ${errorText}`, 'paystack');
      
      return {
        success: false,
        message: `Paystack verification failed: ${response.status} ${response.statusText}`
      };
    }

    const data = await response.json();
    
    // Log full response for debugging
    log(`Paystack verification response for ${reference}: ${JSON.stringify(data)}`, 'paystack');

    // Check if transaction was successful
    if (data.status && data.data && data.data.status === 'success') {
      // Extract amount and convert from kobo to Naira (Paystack amount is in kobo)
      const amountInNaira = data.data.amount / 100;
      
      return {
        success: true,
        reference: data.data.reference,
        amount: amountInNaira,
        metadata: data.data.metadata
      };
    } else {
      return {
        success: false,
        message: `Transaction verification failed: ${data.data?.gateway_response || 'Unknown gateway response'}`
      };
    }
  } catch (error) {
    console.error('Error verifying Paystack transaction:', error);
    return {
      success: false,
      message: `Error verifying transaction: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Create a Paystack transaction initialization (custom variant)
 * @param email Customer email
 * @param amount Amount in Naira
 * @param reference Optional custom reference
 * @param metadata Optional metadata
 * @returns Initialization result with authorization URL
 */
export async function initializePaystackTransaction(
  email: string,
  amount: number,
  reference?: string,
  metadata?: any
) {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    // Convert amount to kobo (Paystack amount is in kobo)
    const amountInKobo = Math.round(amount * 100);
    
    // Prepare request payload
    const payload = {
      email,
      amount: amountInKobo,
      reference,
      metadata: metadata || {},
      callback_url: `${process.env.PUBLIC_URL || ''}/deposit/callback`
    };

    // Make API request to Paystack to initialize transaction
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`Paystack initialization error: ${errorText}`, 'paystack');
      
      throw new Error(`Paystack initialization failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Log response for debugging
    log(`Paystack initialization response: ${JSON.stringify(data)}`, 'paystack');

    if (data.status) {
      return {
        success: true,
        reference: data.data.reference,
        authorizationUrl: data.data.authorization_url
      };
    } else {
      throw new Error(`Transaction initialization failed: ${data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error initializing Paystack transaction:', error);
    throw error;
  }
}

export default {
  generateReference,
  initializePayment,
  verifyPayment,
  createTransferRecipient,
  initiateTransfer,
  getBanks,
  verifyBankAccount,
  verifyPaystackTransaction,
  initializePaystackTransaction
};