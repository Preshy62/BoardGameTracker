import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { initializeSendGrid, sendEmail as sendGridEmail, EmailCategory } from './sendgrid';

// Create a test account for development
// In production, you'd replace this with actual SMTP credentials
let transporter: nodemailer.Transporter;
let emailProvider: 'nodemailer' | 'sendgrid' = 'nodemailer';

// Initialize the email transporter
export async function initializeEmailTransport() {
  if (process.env.NODE_ENV === 'production') {
    // Try SendGrid first if the API key is available
    if (process.env.SENDGRID_API_KEY) {
      const sendgrid = initializeSendGrid();
      if (sendgrid) {
        console.log('Using SendGrid for email delivery');
        emailProvider = 'sendgrid';
        return null;
      }
    }
    
    // Fall back to SMTP if SendGrid is not available or fails
    console.log('Using SMTP for email delivery');
    emailProvider = 'nodemailer';
    
    // Production email service setup with SMTP credentials
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    
    // Verify SMTP connection
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (error) {
      console.error('Failed to verify SMTP connection:', error);
      console.warn('Email functionality may be limited');
    }
  } else {
    // For development, use Ethereal to capture emails
    emailProvider = 'nodemailer';
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      
      console.log('Development email account created:', {
        user: testAccount.user,
        pass: testAccount.pass,
        preview: 'https://ethereal.email/messages'
      });
    } catch (error) {
      console.error('Failed to create Ethereal test account:', error);
      console.warn('Email functionality will be limited in development mode');
    }
  }
  
  return transporter;
}

// Generate a verification token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Generate a password reset token
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(20).toString('hex');
}

// Send verification email
export async function sendVerificationEmail(email: string, token: string) {
  // Ensure email transport is initialized
  if (!transporter && emailProvider === 'nodemailer') {
    await initializeEmailTransport();
  }
  
  // Use frontend route for email verification
  const appUrl = process.env.APP_URL || 'http://localhost:5000';
  // Frontend route - user clicks this in email
  const verificationUrl = `${appUrl}/verify-email/${token}`;
  
  // Email content
  const subject = 'Verify Your Email for Big Boys Game';
  const text = `Welcome to Big Boys Game! Please verify your email by clicking on the following link: ${verificationUrl}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #331D2C; padding: 20px; text-align: center; color: white;">
        <h1>Welcome to Big Boys Game</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; background-color: #f9f9f9;">
        <p>Thank you for registering with Big Boys Game. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #3B3486; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
        </div>
        <p>If the button doesn't work, please copy and paste the following link into your browser:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This link will expire in 3 days.</p>
        <p>If you did not create an account, please ignore this email.</p>
      </div>
      <div style="padding: 10px; text-align: center; font-size: 12px; color: #666;">
        <p>&copy; ${new Date().getFullYear()} Big Boys Game. All rights reserved.</p>
      </div>
    </div>
  `;
  
  let info;
  
  // Send email using the appropriate provider
  if (emailProvider === 'sendgrid') {
    // Use SendGrid with proper category for analytics
    const sent = await sendGridEmail(
      email,
      subject,
      text,
      html,
      process.env.EMAIL_FROM || 'verification@bigboysgame.com',
      EmailCategory.VERIFICATION
    );
    
    if (!sent) {
      console.error('Failed to send verification email via SendGrid');
    } else {
      console.log(`Verification email sent to ${email} via SendGrid`);
    }
    
    return { sent };
  } else {
    // Use Nodemailer
    if (!transporter) {
      console.error('Email transporter not initialized');
      return null;
    }
    
    info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Big Boys Game" <verification@bigboysgame.com>',
      to: email,
      subject,
      text,
      html,
    });
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Verification email sent:', nodemailer.getTestMessageUrl(info));
      console.log('DIRECT VERIFICATION LINK (for development testing):', verificationUrl);
    } else {
      console.log(`Verification email sent to ${email} via SMTP`);
    }
    
    return info;
  }
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, token: string) {
  // Ensure email transport is initialized
  if (!transporter && emailProvider === 'nodemailer') {
    await initializeEmailTransport();
  }
  
  const appUrl = process.env.APP_URL || 'http://localhost:5000';
  const resetUrl = `${appUrl}/reset-password/${token}`;
  
  // Email content
  const subject = 'Reset Your Password for Big Boys Game';
  const text = `You requested to reset your password. Please click on the following link to reset your password: ${resetUrl}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #331D2C; padding: 20px; text-align: center; color: white;">
        <h1>Password Reset</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; background-color: #f9f9f9;">
        <p>You recently requested to reset your password for your Big Boys Game account. Click the button below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3B3486; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If the button doesn't work, please copy and paste the following link into your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      </div>
      <div style="padding: 10px; text-align: center; font-size: 12px; color: #666;">
        <p>&copy; ${new Date().getFullYear()} Big Boys Game. All rights reserved.</p>
      </div>
    </div>
  `;
  
  let info;
  
  // Send email using the appropriate provider
  if (emailProvider === 'sendgrid') {
    // Use SendGrid with proper category for analytics
    const sent = await sendGridEmail(
      email,
      subject,
      text,
      html,
      process.env.EMAIL_FROM || 'support@bigboysgame.com',
      EmailCategory.PASSWORD_RESET
    );
    
    if (!sent) {
      console.error('Failed to send password reset email via SendGrid');
    } else {
      console.log(`Password reset email sent to ${email} via SendGrid`);
    }
    
    return { sent };
  } else {
    // Use Nodemailer
    if (!transporter) {
      console.error('Email transporter not initialized');
      return null;
    }
    
    info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Big Boys Game" <support@bigboysgame.com>',
      to: email,
      subject,
      text,
      html,
    });
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Password reset email sent:', nodemailer.getTestMessageUrl(info));
      console.log('DIRECT RESET LINK (for development testing):', resetUrl);
    } else {
      console.log(`Password reset email sent to ${email} via SMTP`);
    }
    
    return info;
  }
}

// Send transaction notification email
export async function sendTransactionEmail(email: string, transactionType: 'deposit' | 'withdrawal', amount: number, currency: string) {
  // Ensure email transport is initialized
  if (!transporter && emailProvider === 'nodemailer') {
    await initializeEmailTransport();
  }
  
  const subject = transactionType === 'deposit' 
    ? `Deposit Confirmation - ${currency} ${amount}` 
    : `Withdrawal Confirmation - ${currency} ${amount}`;
  
  const text = `
    Transaction Notification
    
    ${transactionType === 'deposit' ? 'Your deposit has been successfully processed.' : 'Your withdrawal request has been processed.'}
    
    Amount: ${currency} ${amount}
    Date: ${new Date().toLocaleString()}
    
    Thank you for playing Big Boys Game!
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #331D2C; padding: 20px; text-align: center; color: white;">
        <h1>Transaction Notification</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; background-color: #f9f9f9;">
        <h2 style="color: #3B3486; text-align: center;">
          ${transactionType === 'deposit' ? 'Deposit Confirmation' : 'Withdrawal Confirmation'}
        </h2>
        <p style="text-align: center; font-size: 24px; margin: 20px 0; color: #333;">
          <strong>${currency} ${amount}</strong>
        </p>
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Transaction Type:</strong> ${transactionType === 'deposit' ? 'Deposit' : 'Withdrawal'}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Status:</strong> <span style="color: green;">Completed</span></p>
        </div>
        <p>
          ${transactionType === 'deposit' 
            ? 'Thank you for your deposit. Your account has been credited with the amount shown above.' 
            : 'Your withdrawal request has been processed. The amount shown above has been sent to your registered bank account.'}
        </p>
        <p>If you did not authorize this transaction, please contact our support team immediately.</p>
      </div>
      <div style="padding: 10px; text-align: center; font-size: 12px; color: #666;">
        <p>&copy; ${new Date().getFullYear()} Big Boys Game. All rights reserved.</p>
      </div>
    </div>
  `;
  
  let info;
  
  // Send email using the appropriate provider
  if (emailProvider === 'sendgrid') {
    // Use SendGrid with proper category for analytics
    const sent = await sendGridEmail(
      email,
      subject,
      text,
      html,
      process.env.EMAIL_FROM || 'transactions@bigboysgame.com',
      EmailCategory.TRANSACTION
    );
    
    if (!sent) {
      console.error('Failed to send transaction email via SendGrid');
    } else {
      console.log(`Transaction email sent to ${email} via SendGrid`);
    }
    
    return { sent };
  } else {
    // Use Nodemailer
    if (!transporter) {
      console.error('Email transporter not initialized');
      return null;
    }
    
    info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Big Boys Game" <transactions@bigboysgame.com>',
      to: email,
      subject,
      text,
      html
    });
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Transaction email sent:', nodemailer.getTestMessageUrl(info));
    } else {
      console.log(`Transaction email sent to ${email} via SMTP`);
    }
    
    return info;
  }
}