# Setting Up Gmail SMTP for Email Notifications

To use Gmail for sending emails from your Big Boys Game application, follow these steps:

## Step 1: Ensure you have a Gmail account
If you don't already have a Gmail account, create one at [gmail.com](https://mail.google.com).

## Step 2: Enable 2-Step Verification
App Passwords are only available if you have 2-Step Verification enabled on your Google Account.

1. Go to your [Google Account](https://myaccount.google.com/).
2. Select **Security** in the left navigation panel.
3. Under "Signing in to Google," select **2-Step Verification** and follow the steps.

## Step 3: Create an App Password
1. Go to your [Google Account](https://myaccount.google.com/).
2. Select **Security** in the left navigation panel.
3. Under "Signing in to Google," select **App passwords**.
   (This option will only appear if 2-Step Verification is enabled)
4. At the bottom, choose **Select app** and then **Other (Custom name)**.
5. Enter "Big Boys Game" or another descriptive name.
6. Click **Generate**.
7. The app password is the 16-character code that appears on your screen.
8. Copy this password (you won't be able to see it again).

## Step 4: Configure Your Application
Add these settings to your `.env` file:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM=your-gmail-address@gmail.com
NODE_ENV=production
```

## Important Notes:
- **Never use your regular Gmail password** in the application. Always use an App Password.
- Your Gmail account may have sending limits (typically 500 emails per day for regular Gmail accounts).
- For high-volume production use, consider upgrading to Google Workspace or a dedicated email service.
- If you're testing in development mode, you don't need to configure this as the app will use Ethereal to capture emails.

## Troubleshooting
- If you get authentication errors, double-check that you've entered the App Password correctly.
- Ensure the Gmail account doesn't have additional security restrictions.
- Check if your firewall or network allows outgoing connections to Gmail's SMTP servers.
- For further assistance, refer to [Google's documentation on App Passwords](https://support.google.com/accounts/answer/185833).