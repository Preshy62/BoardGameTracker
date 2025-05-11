import { MailService } from '@sendgrid/mail';

let sendgridClient: MailService | null = null;

/**
 * Initialize the SendGrid client with the API key
 */
export function initializeSendGrid(): MailService | null {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key is not set. Email functionality will be limited.');
    return null;
  }

  try {
    const mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY);
    sendgridClient = mailService;
    console.log('SendGrid client initialized successfully');
    return mailService;
  } catch (error) {
    console.error('Error initializing SendGrid:', error);
    return null;
  }
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html: string,
  from = process.env.EMAIL_FROM || 'verification@bigboysgame.com'
): Promise<boolean> {
  if (!sendgridClient) {
    console.error('SendGrid client not initialized');
    return false;
  }

  try {
    await sendgridClient.send({
      to,
      from,
      subject,
      text,
      html
    });
    console.log(`Email sent to ${to} using SendGrid`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

/**
 * Get the SendGrid client instance
 */
export function getSendGridClient(): MailService | null {
  return sendgridClient;
}