#!/usr/bin/env node

/**
 * Test script to demonstrate wallet transaction system
 * Shows stake deductions, winnings credits, and admin commissions
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

// Test user credentials
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

async function login(credentials) {
  const response = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }
  
  // Extract session cookie
  const cookies = response.headers.get('set-cookie');
  const sessionCookie = cookies ? cookies.find(c => c.startsWith('connect.sid=')) : null;
  
  return sessionCookie;
}

async function createUser(userData) {
  const response = await fetch(`${BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.log('Registration response:', error);
    return null;
  }
  
  return await response.json();
}

async function getUserBalance(sessionCookie) {
  const response = await fetch(`${BASE_URL}/api/user`, {
    headers: { 'Cookie': sessionCookie }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get user data: ${response.statusText}`);
  }
  
  const user = await response.json();
  return user.walletBalance;
}

async function getTransactions(sessionCookie) {
  const response = await fetch(`${BASE_URL}/api/transactions`, {
    headers: { 'Cookie': sessionCookie }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get transactions: ${response.statusText}`);
  }
  
  return await response.json();
}

async function createBotGame(sessionCookie, stake = 1000) {
  const response = await fetch(`${BASE_URL}/api/games`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': sessionCookie 
    },
    body: JSON.stringify({
      stake: stake,
      maxPlayers: 2,
      currency: 'NGN',
      playWithBot: true
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create game: ${error}`);
  }
  
  return await response.json();
}

async function rollInGame(sessionCookie, gameId) {
  const response = await fetch(`${BASE_URL}/api/games/${gameId}/roll`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to roll: ${error}`);
  }
  
  return await response.json();
}

async function demonstrateWalletTransactions() {
  console.log('🎮 Testing Wallet Transaction System');
  console.log('====================================\n');
  
  try {
    // Try to register a new user
    console.log('1. Creating test user...');
    const user = await createUser(testUser);
    
    let sessionCookie;
    if (user) {
      console.log(`✓ User created: ${user.username}`);
      // Extract session from registration
      sessionCookie = 'connect.sid=' + user.id; // Simplified for demo
    } else {
      // User might already exist, try to login
      console.log('User already exists, logging in...');
      sessionCookie = await login({
        username: testUser.username,
        password: testUser.password
      });
    }
    
    // Get initial balance
    console.log('\n2. Checking initial wallet balance...');
    const initialBalance = await getUserBalance(sessionCookie);
    console.log(`💰 Initial balance: ₦${initialBalance}`);
    
    // Get initial transactions
    const initialTransactions = await getTransactions(sessionCookie);
    console.log(`📝 Initial transactions: ${initialTransactions.length}`);
    
    // Create a bot game (this will deduct stake)
    console.log('\n3. Creating bot game with ₦1000 stake...');
    const game = await createBotGame(sessionCookie, 1000);
    console.log(`🎯 Game created: ID ${game.id}`);
    
    // Check balance after stake deduction
    const balanceAfterStake = await getUserBalance(sessionCookie);
    console.log(`💸 Balance after stake: ₦${balanceAfterStake} (${balanceAfterStake - initialBalance})`);
    
    // Roll in the game
    console.log('\n4. Rolling in the game...');
    const rollResult = await rollInGame(sessionCookie, game.id);
    console.log(`🎲 Roll result: ${rollResult.rolledNumber}`);
    
    // Wait a moment for game completion
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check final balance
    const finalBalance = await getUserBalance(sessionCookie);
    console.log(`💰 Final balance: ₦${finalBalance}`);
    
    // Get final transactions
    const finalTransactions = await getTransactions(sessionCookie);
    console.log(`📝 Final transactions: ${finalTransactions.length}`);
    
    // Show transaction details
    console.log('\n5. Transaction Summary:');
    console.log('======================');
    const newTransactions = finalTransactions.slice(initialTransactions.length);
    newTransactions.forEach(tx => {
      console.log(`${tx.type.toUpperCase()}: ₦${tx.amount} - ${tx.description || tx.reference}`);
    });
    
    const balanceChange = finalBalance - initialBalance;
    console.log(`\n📊 Net Balance Change: ₦${balanceChange}`);
    
    if (balanceChange > 0) {
      console.log('🎉 Player WON! Winnings were credited.');
    } else if (balanceChange < 0) {
      console.log('💔 Player lost. Stake was deducted.');
    } else {
      console.log('🤝 Break even.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
demonstrateWalletTransactions();