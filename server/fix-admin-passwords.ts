import bcrypt from "bcrypt";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function fixAdminPasswords() {
  try {
    console.log("Starting admin password fix script...");
    
    // Hash the admin password
    const saltRounds = 10;
    const adminPassword = "admin123";
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
    
    // Get admin users
    const adminUsernames = ["admin", "precious"];
    const admins = await db.select().from(users).where(eq(users.isAdmin, true));
    
    console.log(`Found ${admins.length} admin accounts to update`);
    
    // Update each admin's password
    for (const admin of admins) {
      console.log(`Updating password for admin user: ${admin.username} (ID: ${admin.id})`);
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, admin.id));
    }
    
    console.log("Admin passwords updated successfully!");
  } catch (error) {
    console.error("Error fixing admin passwords:", error);
  }
}

// Run the function
fixAdminPasswords()
  .then(() => console.log("Admin password fix completed"))
  .catch(error => console.error("Error in admin password fix:", error))
  .finally(() => process.exit(0));