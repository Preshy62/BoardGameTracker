import fetch from 'node-fetch';
import { log } from '../vite';

if (!process.env.PAYSTACK_SECRET_KEY) {
  throw new Error('PAYSTACK_SECRET_KEY environment variable is required');
}

const BASE_URL = 'https://api.paystack.co';
const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

/**
 * Generate a unique reference for transactions
 */
export function generateReference(userId: number): string {
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `BBG-${userId}-${timestamp}-${randomPart}`;
}

async function makeRequest(endpoint: string, method: string = 'GET', data?: any) {
  try {
    const options: any = {
      method,
      headers: {
        Authorization: `Bearer ${SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
      log(`Paystack error: ${result.message || 'Unknown error'}`, 'paystack');
      throw new Error(result.message || 'Failed to process request');
    }

    return result;
  } catch (error) {
    log(`Paystack API error: ${error instanceof Error ? error.message : String(error)}`, 'paystack');
    throw error;
  }
}

export async function getBanks() {
  try {
    const result = await makeRequest('/bank');
    return result.data;
  } catch (error) {
    log(`Error fetching banks: ${error instanceof Error ? error.message : String(error)}`, 'paystack');
    throw error;
  }
}

export async function verifyBankAccount(accountNumber: string, bankCode: string) {
  try {
    const result = await makeRequest(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);
    return {
      accountName: result.data.account_name,
      accountNumber: result.data.account_number,
      bankCode,
    };
  } catch (error) {
    log(`Error verifying account: ${error instanceof Error ? error.message : String(error)}`, 'paystack');
    throw error;
  }
}

export async function initiateTransfer(recipient: string, amount: number, reference: string, reason?: string) {
  try {
    const result = await makeRequest('/transfer', 'POST', {
      source: 'balance',
      reason: reason || 'Withdrawal from Big Boys Game',
      amount,
      recipient,
      reference,
    });
    return result.data;
  } catch (error) {
    log(`Error initiating transfer: ${error instanceof Error ? error.message : String(error)}`, 'paystack');
    throw error;
  }
}

export async function createTransferRecipient(
  name: string,
  accountNumber: string,
  bankCode: string,
  currency: string = 'NGN'
) {
  try {
    const result = await makeRequest('/transferrecipient', 'POST', {
      type: 'nuban',
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency,
    });
    return result.data;
  } catch (error) {
    log(`Error creating transfer recipient: ${error instanceof Error ? error.message : String(error)}`, 'paystack');
    throw error;
  }
}

export async function verifyTransaction(reference: string) {
  try {
    const result = await makeRequest(`/transaction/verify/${reference}`);
    return result.data;
  } catch (error) {
    log(`Error verifying transaction: ${error instanceof Error ? error.message : String(error)}`, 'paystack');
    throw error;
  }
}

/**
 * Initialize a payment transaction with Paystack
 */
export async function initializePayment(
  email: string,
  amount: number,
  reference: string,
  callbackUrl: string,
  metadata: any = {}
) {
  try {
    // Convert amount to kobo (Paystack uses the smallest currency unit)
    const amountInKobo = Math.round(amount * 100);
    
    const result = await makeRequest('/transaction/initialize', 'POST', {
      email,
      amount: amountInKobo,
      reference,
      callback_url: callbackUrl,
      metadata
    });
    
    return result.data;
  } catch (error) {
    log(`Error initializing payment: ${error instanceof Error ? error.message : String(error)}`, 'paystack');
    throw error;
  }
}

/**
 * Verify a payment transaction with Paystack
 */
export async function verifyPayment(reference: string) {
  try {
    const result = await makeRequest(`/transaction/verify/${reference}`);
    return result.data;
  } catch (error) {
    log(`Error verifying payment: ${error instanceof Error ? error.message : String(error)}`, 'paystack');
    throw error;
  }
}