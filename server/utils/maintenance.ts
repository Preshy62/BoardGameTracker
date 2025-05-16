import { Request, Response, NextFunction } from "express";

// Maintenance mode settings
interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  startedAt: Date | null;
  allowedIPs: string[];
}

// Default maintenance settings
const maintenanceSettings: MaintenanceSettings = {
  enabled: false,
  message: "We're currently performing scheduled maintenance. Please check back soon.",
  startedAt: null,
  allowedIPs: [] // IPs that can bypass maintenance mode
};

/**
 * Get current maintenance settings
 */
export function getMaintenanceSettings(): MaintenanceSettings {
  return { ...maintenanceSettings };
}

/**
 * Update maintenance settings
 */
export function updateMaintenanceSettings(settings: Partial<MaintenanceSettings>): MaintenanceSettings {
  if (settings.enabled !== undefined && settings.enabled !== maintenanceSettings.enabled) {
    // If enabling maintenance mode for the first time, set the start time
    if (settings.enabled && !maintenanceSettings.enabled) {
      maintenanceSettings.startedAt = new Date();
    } else if (!settings.enabled) {
      maintenanceSettings.startedAt = null;
    }
  }
  
  Object.assign(maintenanceSettings, settings);
  return { ...maintenanceSettings };
}

/**
 * Check if a request should be allowed during maintenance mode
 */
export function shouldAllowDuringMaintenance(req: Request): boolean {
  // Always allow admin API endpoints
  if (req.path.startsWith('/api/admin')) {
    return true;
  }
  
  // Allow specific IPs if configured
  if (maintenanceSettings.allowedIPs.length > 0) {
    const clientIP = req.ip || (req.connection && req.connection.remoteAddress);
    if (clientIP && maintenanceSettings.allowedIPs.includes(clientIP)) {
      return true;
    }
  }
  
  // Allow authenticated admin users
  if (req.session?.userId) {
    // Note: This requires an async check which we can't do in this middleware
    // Instead, we'll rely on the admin-check in the routes
    return true;
  }
  
  // Allow static assets 
  if (req.path.includes('.') || req.path.startsWith('/@')) {
    return true;
  }
  
  return false;
}

/**
 * Middleware to handle maintenance mode
 */
export function maintenanceMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip if maintenance mode is disabled
  if (!maintenanceSettings.enabled) {
    return next();
  }
  
  // Allow certain paths and users
  if (shouldAllowDuringMaintenance(req)) {
    return next();
  }
  
  // If it's an API request, return a JSON response
  if (req.path.startsWith('/api')) {
    return res.status(503).json({
      error: 'maintenance',
      message: maintenanceSettings.message
    });
  }
  
  // For regular requests, return a basic maintenance page
  res.status(503).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Maintenance Mode</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #f5f5f5;
          color: #333;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          padding: 1rem;
          text-align: center;
        }
        .container {
          max-width: 500px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          padding: 2rem;
        }
        h1 {
          color: #e11d48;
          margin-top: 0;
        }
        p {
          font-size: 1.1rem;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Site Maintenance</h1>
        <p>${maintenanceSettings.message}</p>
      </div>
    </body>
    </html>
  `);
}