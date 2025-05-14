/**
 * Paystack Webhook Test Script
 * 
 * This script simulates Paystack webhook events for testing the webhook handler implementation.
 * It sends POST requests to the webhook test endpoint with different event types to simulate
 * various Paystack events.
 * 
 * Usage:
 * node scripts/test-paystack-webhooks.js <userId>
 * 
 * Where <userId> is the ID of the user to use for testing (required)
 */

const fetch = require('node-fetch');

// Default values
const BASE_URL = 'http://localhost:5000';
const API_PATH = '/api/payment/webhook-test';

// Get the user ID from command line arguments
const userId = process.argv[2];

if (!userId) {
  console.error('Error: User ID is required');
  console.log('Usage: node scripts/test-paystack-webhooks.js <userId>');
  process.exit(1);
}

// Test event scenarios
const testCases = [
  {
    event: 'charge.success',
    amount: 1000,
    description: 'Successful deposit of ₦1,000'
  },
  {
    event: 'charge.failed',
    amount: 500,
    description: 'Failed deposit attempt of ₦500'
  },
  {
    event: 'transfer.success',
    amount: 2000,
    description: 'Successful withdrawal of ₦2,000'
  },
  {
    event: 'transfer.failed',
    amount: 1500,
    description: 'Failed withdrawal of ₦1,500'
  },
  {
    event: 'transfer.reversed',
    amount: 3000,
    description: 'Reversed withdrawal of ₦3,000'
  }
];

// Function to send a test webhook event
async function sendTestWebhook(eventType, amount) {
  const url = `${BASE_URL}${API_PATH}/${eventType}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: parseInt(userId),
        amount: amount,
        reference: `test_${Date.now()}_${eventType.replace('.', '_')}`
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✓ [${eventType}] Test successful`);
    } else {
      console.error(`✗ [${eventType}] Test failed: ${data.message}`);
    }
    
    return data;
  } catch (error) {
    console.error(`✗ [${eventType}] Error sending test webhook:`, error.message);
    return null;
  }
}

// Run all test cases with 3-second interval between them
async function runTests() {
  console.log(`🚀 Starting Paystack webhook tests for user ID: ${userId}`);
  console.log('----------------------------------------');
  
  for (const [index, testCase] of testCases.entries()) {
    console.log(`Test ${index + 1}/${testCases.length}: ${testCase.description}`);
    
    const result = await sendTestWebhook(testCase.event, testCase.amount);
    
    if (result) {
      console.log(`Event: ${testCase.event}, Amount: ₦${testCase.amount}`);
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