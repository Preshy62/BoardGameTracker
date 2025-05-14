/**
 * Paystack Webhook Test Script (TypeScript version)
 * 
 * This script simulates Paystack webhook events for testing the webhook handler implementation.
 * 
 * Usage:
 * npx tsx scripts/test-webhooks.ts <userId>
 * 
 * Where <userId> is the ID of the user to use for testing (required)
 */

import fetch from 'node-fetch';

// Default values
const BASE_URL = 'http://localhost:5000';
const API_PATH = '/api/payment/webhook-test';

// Get the user ID from command line arguments
const userId = process.argv[2];

if (!userId) {
  console.error('Error: User ID is required');
  console.log('Usage: npx tsx scripts/test-webhooks.ts <userId>');
  process.exit(1);
}

type TestCase = {
  event: string;
  amount: number;
  description: string;
  type?: string;
  status?: string;
};

// Test event scenarios
const testCases: TestCase[] = [
  {
    event: 'charge.success',
    amount: 1000,
    description: 'Successful deposit of ₦1,000',
    type: 'deposit',
    status: 'completed'
  },
  {
    event: 'charge.failed',
    amount: 500,
    description: 'Failed deposit attempt of ₦500',
    type: 'deposit',
    status: 'failed'
  },
  {
    event: 'transfer.success',
    amount: 2000,
    description: 'Successful withdrawal of ₦2,000',
    type: 'withdrawal',
    status: 'completed'
  },
  {
    event: 'transfer.failed',
    amount: 1500,
    description: 'Failed withdrawal of ₦1,500',
    type: 'withdrawal',
    status: 'failed'
  },
  {
    event: 'transfer.reversed',
    amount: 3000,
    description: 'Reversed withdrawal of ₦3,000',
    type: 'withdrawal',
    status: 'failed'
  }
];

// Function to send a test webhook event
async function sendTestWebhook(testCase: TestCase): Promise<any> {
  const { event, amount, type, status } = testCase;
  const url = `${BASE_URL}${API_PATH}/${event}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: parseInt(userId),
        amount,
        type,
        status,
        reference: `test_${Date.now()}_${event.replace('.', '_')}`
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✓ [${event}] Test successful`);
    } else {
      console.error(`✗ [${event}] Test failed: ${data.message}`);
    }
    
    return data;
  } catch (error: any) {
    console.error(`✗ [${event}] Error sending test webhook:`, error.message);
    return null;
  }
}

// Run all test cases with 3-second interval between them
async function runTests() {
  console.log(`🚀 Starting Paystack webhook tests for user ID: ${userId}`);
  console.log('----------------------------------------');
  
  for (const [index, testCase] of testCases.entries()) {
    console.log(`Test ${index + 1}/${testCases.length}: ${testCase.description}`);
    
    const result = await sendTestWebhook(testCase);
    
    if (result) {
      console.log(`Event: ${testCase.event}, Amount: ₦${testCase.amount}`);
      console.log(`Expected outcome: Transaction ${testCase.status}`);
    }
    
    console.log('----------------------------------------');
    
    // Wait 3 seconds between tests to avoid race conditions
    if (index < testCases.length - 1) {
      console.log('Waiting 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log('✅ All webhook tests completed');
}

// Execute the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});