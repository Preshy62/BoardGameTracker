import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function updateAdminBalances() {
  try {
    console.log("Starting admin balance update...");
    
    // Get admin users
    const admins = await db.select().from(users).where(eq(users.isAdmin, true));
    
    console.log(`Found ${admins.length} admin accounts to update`);
    
    // Update each admin's wallet balance
    for (const admin of admins) {
      console.log(`Updating balance for admin user: ${admin.username} (ID: ${admin.id})`);
      // Set balance to ₦1,000,000
      await db.update(users)
        .set({ walletBalance: 1000000 })
        .where(eq(users.id, admin.id));
    }
    
    console.log("Admin balances updated successfully!");
  } catch (error) {
    console.error("Error updating admin balances:", error);
  }
}

// Run the function
updateAdminBalances()
  .then(() => console.log("Admin balance update completed"))
  .catch(error => console.error("Error in admin balance update:", error))
  .finally(() => process.exit(0));