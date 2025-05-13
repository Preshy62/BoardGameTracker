import { db } from '../db';
import { log } from '../vite';
import { sql } from 'drizzle-orm';

export async function addTransactionDescriptionField() {
  try {
    log('Starting transaction description field migration...', 'migration');
    
    // Check if the column already exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name = 'description'
    `);
    
    if (result.rows.length === 0) {
      // Column doesn't exist, add it
      await db.execute(sql`
        ALTER TABLE transactions 
        ADD COLUMN description TEXT
      `);
      log('Added description column to transactions table', 'migration');
    } else {
      log('Description column already exists in transactions table. Skipping migration.', 'migration');
    }
    
    log('Transaction description field migration completed', 'migration');
  } catch (error) {
    log(`Error in transaction description field migration: ${error}`, 'migration');
    throw error;
  }
}