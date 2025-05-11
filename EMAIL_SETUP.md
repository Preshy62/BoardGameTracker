# Email Setup Guide for Big Boys Game

This document explains the email sending options available in Big Boys Game and how to configure them.

## Overview

Big Boys Game supports three methods for handling emails:

1. **Development Mode**: Uses Ethereal.email to capture emails without actually sending them
2. **Gmail SMTP**: Uses Gmail's SMTP servers for reliable email delivery
3. **SendGrid API**: Uses SendGrid's API for advanced email delivery with analytics

## Development Mode (Default)

In development mode (when `NODE_ENV=development`), the application automatically creates a temporary Ethereal.email account to capture all outgoing emails.

**Benefits:**
- No configuration needed
- Emails don't actually get sent to recipients
- Email content can be viewed in the Ethereal web interface
- Link to the capture interface is printed in the console logs
- Direct verification links are shown in the console for easy testing

**How to Use:**
1. Simply run the application with `NODE_ENV=development` (default in development)
2. Look for "Development email account created" in the console logs with credentials
3. When emails are sent, a preview URL will be displayed in the logs
4. For email verification, direct verification links are shown in the logs

## Option 1: Gmail SMTP

For production use, you can configure the application to use Gmail's SMTP server.

**Benefits:**
- Free for moderate email volumes
- Reliable delivery
- Works with any Gmail account

**Setup Instructions:**
1. See the detailed guide in [GMAIL_SETUP.md](./GMAIL_SETUP.md)
2. Create a Gmail account or use an existing one
3. Enable 2-Step Verification in your Google Account
4. Generate an App Password for the application
5. Add the following to your `.env` file:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM=your-gmail-address@gmail.com
NODE_ENV=production
```

## Option 2: SendGrid API

For higher volume needs with advanced analytics, you can use SendGrid.

**Benefits:**
- Higher sending limits (100 emails/day free, higher limits with paid plans)
- Detailed analytics on email opens and clicks
- Sender verification provides better deliverability
- No need for app passwords
- Categories for email sorting and tracking

**Setup Instructions:**
1. See the detailed guide in [SENDGRID_SETUP.md](./SENDGRID_SETUP.md)
2. Create a SendGrid account
3. Verify a sender email or domain
4. Create an API key with "Mail Send" permissions
5. Add the following to your `.env` file:
```
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=your_verified_sender_email@example.com
NODE_ENV=production
```

## Automatic Fallback System

The application will automatically try email providers in this order:

1. **SendGrid** (if `SENDGRID_API_KEY` is present)
2. **SMTP** (if `EMAIL_HOST` and related settings are present)
3. **Ethereal** (in development mode)

If a higher-priority provider fails, the system will automatically try the next one.

## Email Templates

The application sends several types of emails:

| Email Type | Description | When Sent |
|------------|-------------|-----------|
| Verification | Account verification | After registration |
| Password Reset | Password reset link | When requesting password reset |
| Transaction | Transaction notification | After deposits or withdrawals |

## Troubleshooting

### Emails Not Being Sent

1. Check your `.env` file for correct configuration
2. Look for error messages in the application logs
3. In development mode, emails are captured by Ethereal, not actually sent
4. For Gmail, ensure your App Password is correct and 2FA is enabled
5. For SendGrid, ensure your sender is verified and API key has correct permissions

### SMTP Connection Errors

Error: "Failed to verify SMTP connection"

- Check that your EMAIL_HOST, EMAIL_PORT, and EMAIL_SECURE settings are correct
- Ensure your EMAIL_USER and EMAIL_PASSWORD are correct
- Check if your email provider allows SMTP access 
- For Gmail, ensure you're using an App Password, not your regular password

### SendGrid Errors

Error: "SendGrid API key not found"

- Check that SENDGRID_API_KEY is set in your `.env` file
- Ensure the API key has "Mail Send" permissions

### Email Testing

You can manually test email functionality by:

1. Registering a new user (tests verification emails)
2. Using the "Forgot Password" function (tests password reset emails)
3. Making a deposit or withdrawal (tests transaction emails)