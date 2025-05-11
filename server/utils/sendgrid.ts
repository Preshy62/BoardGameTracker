import { MailService } from '@sendgrid/mail';
import { MailDataRequired } from '@sendgrid/helpers/classes/mail';

/**
 * Enhanced SendGrid email service integration for Big Boys Game
 * Provides robust email sending capabilities with tracking, analytics, and error handling
 */

// Store the initialized mail service
let mailService: MailService | null = null;

// Email categories for analytics in SendGrid dashboard
export const EmailCategory = {
  VERIFICATION: 'verification',
  PASSWORD_RESET: 'password_reset',
  TRANSACTION: 'transaction', 
  NOTIFICATION: 'notification'
} as const;

/**
 * Initialize the SendGrid mail service
 * @returns The initialized MailService instance or null if initialization fails
 */
export function initializeSendGrid(): MailService | null {
  // Check if already initialized
  if (mailService) {
    return mailService;
  }

  // Check if API key is available
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SendGrid API key not found, skipping SendGrid initialization');
    return null;
  }

  try {
    // Create and configure the mail service
    const service = new MailService();
    service.setApiKey(process.env.SENDGRID_API_KEY);
    
    // Store for reuse
    mailService = service;
    
    console.log('SendGrid initialized successfully');
    return service;
  } catch (error) {
    console.error('Failed to initialize SendGrid:', error);
    return null;
  }
}

/**
 * Send an email using SendGrid
 * @param to Recipient email address
 * @param subject Email subject
 * @param text Plain text content
 * @param html HTML content
 * @param from Sender email address (must be verified in SendGrid)
 * @param category Optional category for tracking in SendGrid dashboard
 * @param templateId Optional SendGrid template ID
 * @param dynamicTemplateData Optional data for dynamic templates
 * @returns Boolean indicating success or failure
 */
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html: string,
  from: string = process.env.EMAIL_FROM || 'noreply@bigboysgame.com',
  category?: string,
  templateId?: string,
  dynamicTemplateData?: Record<string, any>
): Promise<boolean> {
  // Ensure SendGrid is initialized
  if (!mailService) {
    const service = initializeSendGrid();
    if (!service) {
      console.error('SendGrid mail service could not be initialized');
      return false;
    }
  }

  try {
    // Create email data
    const msg: MailDataRequired = {
      to,
      from,
      subject,
      text,
      html,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      }
    };

    // Add category if provided
    if (category) {
      // Here we use any to bypass the type check since SendGrid's type definitions 
      // aren't perfectly aligned with their API
      (msg as any).categories = [category];
    }

    // Add template if provided
    if (templateId) {
      msg.templateId = templateId;
      if (dynamicTemplateData) {
        msg.dynamicTemplateData = dynamicTemplateData;
      }
    }

    // Send the email
    await mailService!.send(msg);
    
    console.log(`SendGrid email sent successfully to ${to}`, {
      subject,
      category: category || 'uncategorized'
    });
    
    return true;
  } catch (error: any) {
    // Enhanced error logging
    console.error('SendGrid email error:', {
      message: error.message,
      code: error.code,
      response: error.response?.body,
      recipient: to,
      subject
    });
    
    return false;
  }
}

/**
 * Check if SendGrid is configured and ready to use
 * @returns Boolean indicating if SendGrid is ready
 */
export function isSendGridConfigured(): boolean {
  return !!process.env.SENDGRID_API_KEY && !!mailService;
}