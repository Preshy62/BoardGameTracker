# Setting Up SendGrid for Email Notifications in Big Boys Game

This guide will help you set up SendGrid for sending emails from your Big Boys Game application.

## Why SendGrid?

SendGrid offers several advantages over traditional SMTP:
- Higher sending limits (100 emails/day on the free tier)
- Reliable delivery with high deliverability rates
- Email analytics and tracking
- Easy setup without app passwords
- Scalable for production use

## Step 1: Create a SendGrid Account

1. Go to [SendGrid's website](https://sendgrid.com/)
2. Sign up for a free account (no credit card required for the free tier)
3. Verify your account via the email SendGrid sends you

## Step 2: Set Up Sender Authentication

Before you can send emails, you need to verify your sender identity:

1. In the SendGrid dashboard, go to **Settings** → **Sender Authentication**
2. Choose **Verify a Single Sender**
3. Fill in the required information:
   - **From Name**: "Big Boys Game" (or your preferred name)
   - **From Email**: An email address you own and can access
   - **Reply To**: Same as From Email, or another email you control
   - **Company Name**: Your company/game name
   - **Company Address**, **City**, **Country**, etc.: Your information
4. Click **Create**
5. Check your email for the verification message from SendGrid
6. Click the verification link in the email

## Step 3: Create an API Key

1. In the SendGrid dashboard, go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name your key (e.g., "Big Boys Game API Key")
4. Select **Restricted Access** for better security
5. Grant the following permissions:
   - **Mail Send** → **Full Access**
6. Click **Create & View**
7. **IMPORTANT**: Copy your API key immediately. It will only be shown once!

## Step 4: Configure Your Application

1. Add the following to your `.env` file:

```
# SendGrid Configuration
SENDGRID_API_KEY=your_api_key_here
EMAIL_FROM=your_verified_sender_email@example.com

# Set to production when ready to use real emails
NODE_ENV=production
```

2. Restart your application

## Step 5: Testing Your Setup

1. Try registering a new user - this will trigger a verification email
2. Check your SendGrid dashboard under **Activity** → **Email Activity** to see if the email was sent
3. You should receive the verification email at the address you registered with

## Monitoring and Analytics

SendGrid provides powerful analytics for your emails:

1. **Email Activity**: View detailed information about each email sent
2. **Statistics**: See open rates, click rates, and more
3. **Categories**: Our application automatically categorizes emails as:
   - `verification`: Email verification messages
   - `password_reset`: Password reset requests
   - `transaction`: Transaction notifications
   - `notification`: General notifications

## Troubleshooting

If you're not receiving emails:

1. Check if the API key is correctly set in your `.env` file
2. Verify that your sender email is properly authenticated
3. Look for errors in your application logs
4. Check the SendGrid Activity feed to see if there are delivery issues

## SendGrid Limits

- Free tier: 100 emails per day
- Paid tiers: Start at $14.95/month for 40,000 emails

If you need higher limits, consider upgrading your SendGrid plan.

## Fallback Mechanism

If SendGrid is unavailable or not configured, the system will automatically fall back to:
- Ethereal (fake SMTP) in development mode
- SMTP configuration in production mode (if configured)

## Need Help?

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [SendGrid Support](https://support.sendgrid.com/)