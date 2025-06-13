# Big Boys Game - Railway Deployment Guide

## Quick Start

Since Railway is already linked to your GitHub repository, deployment is straightforward:

1. **Push to GitHub** - Railway will automatically detect changes
2. **Set Environment Variables** - Add required variables in Railway dashboard
3. **Deploy** - Railway will build and deploy automatically

## Environment Variables Setup

In your Railway project dashboard, add these environment variables:

### Core Application
```
NODE_ENV=production
PORT=3000
```

### Database (Railway PostgreSQL)
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
```
*Note: Railway will automatically provide this when you add a PostgreSQL service*

### Authentication & Security
```
SESSION_SECRET=your-super-secure-session-secret-here
```

### Payment Processing (Production Keys)
```
STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_live_your_live_stripe_public_key
PAYSTACK_SECRET_KEY=sk_live_your_live_paystack_secret_key
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_live_paystack_public_key
```

### Video/Voice Chat
```
AGORA_APP_ID=your_agora_app_id
VITE_AGORA_APP_ID=your_agora_app_id
```

### Email Configuration (Optional)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=your-app-specific-password
```

## Railway Services Setup

### 1. Main Application Service
- **Source**: GitHub repository
- **Root Directory**: `/` (root of your repo)
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Port**: 3000

### 2. PostgreSQL Database
- Add PostgreSQL service from Railway marketplace
- Railway will automatically set DATABASE_URL environment variable
- Database will be accessible to your application

### 3. Custom Domains (Optional)
- Add your custom domain in Railway dashboard
- Railway provides free `.railway.app` subdomain
- SSL certificates are automatically managed

## Deployment Steps

### Step 1: Prepare Repository
```bash
# Ensure all files are committed
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### Step 2: Create Railway Project
1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your Big Boys Game repository

### Step 3: Add Database
1. Click "Add Service" in your Railway project
2. Select "Database" → "PostgreSQL"
3. Railway will create database and set DATABASE_URL

### Step 4: Configure Environment Variables
1. Go to your service settings
2. Click "Variables" tab
3. Add all environment variables listed above

### Step 5: Deploy
- Railway automatically builds and deploys when you push to GitHub
- Monitor deployment logs in Railway dashboard
- Access your app via provided Railway URL

## Build Configuration

The application includes:
- `railway.json` - Railway-specific configuration
- `nixpacks.toml` - Build environment setup
- `package.json` - Build and start scripts

## Monitoring & Logs

### View Logs
- Access deployment and application logs in Railway dashboard
- Monitor real-time logs during deployment and runtime

### Health Checks
- Railway automatically monitors application health
- Custom health endpoint: `/api/health` (if implemented)

### Metrics
- View CPU, memory, and network usage in Railway dashboard
- Monitor response times and error rates

## Scaling & Performance

### Automatic Scaling
- Railway provides automatic horizontal scaling
- Configure scaling rules based on CPU/memory usage

### Database Performance
- Railway PostgreSQL includes connection pooling
- Monitor database performance in metrics tab

### CDN & Caching
- Static assets automatically served via Railway's CDN
- Configure caching headers for optimal performance

## Security Best Practices

1. **Environment Variables**
   - Never commit sensitive data to repository
   - Use Railway's environment variable management
   - Rotate secrets regularly

2. **Database Security**
   - Railway PostgreSQL includes automatic backups
   - Database is private by default (not exposed to internet)
   - Use connection pooling for better security

3. **Application Security**
   - HTTPS automatically enabled on Railway
   - Configure CORS properly for production
   - Enable rate limiting and security headers

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check Node.js version compatibility
   # Ensure all dependencies are in package.json
   # Verify build scripts in package.json
   ```

2. **Database Connection Issues**
   ```bash
   # Verify DATABASE_URL environment variable
   # Check PostgreSQL service status
   # Review connection pooling settings
   ```

3. **Environment Variable Issues**
   ```bash
   # Ensure all required variables are set
   # Check variable names (case-sensitive)
   # Verify VITE_ prefix for frontend variables
   ```

### Deployment Logs
- Check build logs for compilation errors
- Monitor runtime logs for application errors
- Use Railway CLI for detailed debugging

## Maintenance

### Updates
- Push changes to GitHub for automatic deployment
- Railway will rebuild and redeploy automatically
- Use Railway's rollback feature if needed

### Backups
- Railway PostgreSQL includes automatic daily backups
- Export database manually for additional backup
- Store environment variables securely

### Monitoring
- Set up alerts for application errors
- Monitor resource usage and scale as needed
- Regular security updates and dependency updates

## Cost Optimization

- Railway offers generous free tier for development
- Production plans start at competitive rates
- Monitor usage to optimize costs
- Use built-in metrics to identify optimization opportunities

## Support

- Railway documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord community for support
- GitHub repository for application-specific issues