import { MailService } from '@sendgrid/mail';

// This is a placeholder for SendGrid integration
// We're not actually using this since we're focused on SMTP

let mailService: MailService | null = null;

export function initializeSendGrid(): MailService | null {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SendGrid API key not found, skipping SendGrid initialization');
    return null;
  }

  try {
    const service = new MailService();
    service.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('SendGrid initialized successfully');
    mailService = service;
    return service;
  } catch (error) {
    console.error('Failed to initialize SendGrid:', error);
    return null;
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html: string,
  from: string = 'noreply@bigboysgame.com'
): Promise<boolean> {
  if (!mailService) {
    console.error('SendGrid mail service not initialized');
    return false;
  }

  try {
    await mailService.send({
      to,
      from,
      subject,
      text,
      html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}