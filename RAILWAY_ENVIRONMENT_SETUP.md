# Railway Environment Variables Setup

## Critical Variables Needed

Your Big Boys Game requires these environment variables to work properly on Railway:

### 1. Database Configuration
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### 2. Session Management
```
SESSION_SECRET=053db382e7f77895a39d5185af96f0607d83ede788f664e84ff7830d7ccf82d6
NODE_ENV=production
```

### 3. Port Configuration
```
PORT=5000
```

## How to Add Variables in Railway

1. **Go to your Railway project dashboard**
2. **Click "Variables" tab**
3. **Add each variable**:
   - Variable name: `SESSION_SECRET`
   - Value: `053db382e7f77895a39d5185af96f0607d83ede788f664e84ff7830d7ccf82d6`
   
   - Variable name: `NODE_ENV`
   - Value: `production`
   
   - Variable name: `DATABASE_URL`
   - Value: `${{Postgres.DATABASE_URL}}` (This automatically references your PostgreSQL service)

## Optional Payment Variables
Add these if you want payment functionality:
```
STRIPE_SECRET_KEY=your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

## After Adding Variables

1. **Click "Deploy"** to restart with new environment
2. **Check logs** for successful startup
3. **Test your app** - 404 error should be resolved

The missing SESSION_SECRET is likely causing the server to fail startup, resulting in 404 errors.