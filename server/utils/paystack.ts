import { createHmac } from 'crypto';
import * as paystackLib from 'paystack-node';

// Check if Paystack API key is available
if (!process.env.PAYSTACK_SECRET_KEY) {
  console.error('Warning: PAYSTACK_SECRET_KEY environment variable not set!');
}

// Initialize Paystack
export const paystack = new paystackLib(process.env.PAYSTACK_SECRET_KEY);

// Generate a reference for Paystack transactions 
export function generateReference(userId: number) {
  return `BBG-${userId}-${Date.now().toString()}`;
}

// Verify Paystack webhook signatures
export function verifyPaystackSignature(signature: string, requestBody: any): boolean {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    console.error('Cannot verify Paystack webhook: PAYSTACK_SECRET_KEY not set');
    return false;
  }
  
  const hash = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(requestBody))
    .digest('hex');
  
  return hash === signature;
}

// Initialize a payment (returns data needed for the frontend)
export async function initializePayment(
  email: string, 
  amount: number, 
  reference: string,
  callbackUrl: string,
  metadata: any = {}
) {
  try {
    // Paystack amount is in kobo (multiply by 100)
    const response = await paystack.transaction.initialize({
      email,
      amount: Math.round(amount * 100),
      reference,
      callback_url: callbackUrl,
      metadata,
      currency: 'NGN',
    });
    
    return response.data;
  } catch (error) {
    console.error('Paystack payment initialization error:', error);
    throw error;
  }
}

// Verify a payment
export async function verifyPayment(reference: string) {
  try {
    const response = await paystack.transaction.verify(reference);
    return response.data;
  } catch (error) {
    console.error('Paystack payment verification error:', error);
    throw error;
  }
}

// Initialize a transfer (withdrawal to bank account)
export async function initiateTransfer(
  amount: number,
  recipientCode: string,
  reference: string,
  reason: string = 'Withdrawal'
) {
  try {
    // Paystack amount is in kobo (multiply by 100)
    const response = await paystack.transfer.initiate({
      source: 'balance',
      amount: Math.round(amount * 100),
      recipient: recipientCode,
      reference,
      reason,
    });
    
    return response.data;
  } catch (error) {
    console.error('Paystack transfer initialization error:', error);
    throw error;
  }
}

// Create a transfer recipient (for withdrawals)
export async function createTransferRecipient(
  name: string,
  accountNumber: string,
  bankCode: string,
  currency: string = 'NGN'
) {
  try {
    const response = await paystack.transfer_recipient.create({
      type: 'nuban',
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency,
    });
    
    return response.data;
  } catch (error) {
    console.error('Paystack recipient creation error:', error);
    throw error;
  }
}

// Get a list of banks (for bank selection on withdrawal)
export async function getBanks() {
  try {
    const response = await paystack.misc.list_banks({
      country: 'nigeria',
    });
    
    return response.data;
  } catch (error) {
    console.error('Paystack get banks error:', error);
    throw error;
  }
}

// Verify a bank account
export async function verifyBankAccount(accountNumber: string, bankCode: string) {
  try {
    const response = await paystack.bank.resolve({
      account_number: accountNumber,
      bank_code: bankCode,
    });
    
    return response.data;
  } catch (error) {
    console.error('Paystack bank verification error:', error);
    throw error;
  }
}