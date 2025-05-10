import { db } from "../db";
import { sql } from "drizzle-orm";
import { log } from "../vite";

/**
 * This script adds email verification fields to the users table
 * without losing existing data
 */
export async function migrateEmailFields() {
  log("Starting email fields migration...", "migration");
  
  try {
    // Check if email_verified column already exists
    const checkColumnResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'email_verified'
    `);
    
    // If the column doesn't exist, add the new columns
    if (checkColumnResult.rows.length === 0) {
      log("Adding email verification columns to users table...", "migration");
      
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN email_verified BOOLEAN DEFAULT false,
        ADD COLUMN verification_token TEXT,
        ADD COLUMN verification_token_expires TIMESTAMP,
        ADD COLUMN reset_password_token TEXT,
        ADD COLUMN reset_password_token_expires TIMESTAMP,
        ADD COLUMN email_notifications JSONB DEFAULT '{"transactions": true, "marketing": true, "gameUpdates": true}'
      `);
      
      log("Migration completed successfully", "migration");
    } else {
      log("Email verification columns already exist. Skipping migration.", "migration");
    }
    
    return true;
  } catch (error) {
    log(`Migration failed: ${error}`, "migration");
    console.error("Migration error:", error);
    return false;
  }
}

// Export a function to run the migration
export async function runMigration() {
  return await migrateEmailFields();
}