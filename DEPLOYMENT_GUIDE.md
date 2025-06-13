# Big Boys Game - GoDaddy Hosting Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables Setup
Create a `.env.production` file with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@hostname:port/database_name

# Authentication & Security
SESSION_SECRET=your-super-secure-session-secret-here

# Payment Integration
STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_live_your_live_stripe_public_key
PAYSTACK_SECRET_KEY=sk_live_your_live_paystack_secret_key
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_live_paystack_public_key

# Video Chat Integration
AGORA_APP_ID=your_agora_app_id
VITE_AGORA_APP_ID=your_agora_app_id

# Email Configuration (Optional - for notifications)
SMTP_HOST=your.smtp.host
SMTP_PORT=587
SMTP_USER=your.email@domain.com
SMTP_PASS=your-email-password

# Production Settings
NODE_ENV=production
PORT=3000
```

### 2. Database Setup
- Set up a PostgreSQL database on GoDaddy or external provider
- Update DATABASE_URL with your production database credentials
- Ensure database accepts external connections

### 3. Domain Configuration
- Point your domain to GoDaddy's hosting server
- Set up SSL certificate for HTTPS
- Configure DNS records if using external database

## Build Process

### 1. Install Dependencies
```bash
npm install --production
```

### 2. Build the Application
```bash
npm run build
```

### 3. Test Production Build Locally (Optional)
```bash
npm start
```

## GoDaddy Hosting Setup

### Option A: Shared Hosting (Limited Node.js Support)
**Note**: Most GoDaddy shared hosting plans don't support Node.js applications. You'll need VPS or dedicated hosting.

### Option B: VPS/Dedicated Server

1. **Upload Files**
   - Upload entire project folder to your server
   - Ensure `node_modules` is excluded (will install on server)

2. **Server Configuration**
   ```bash
   # Install Node.js (if not available)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 for process management
   npm install -g pm2
   
   # Navigate to project directory
   cd /path/to/your/project
   
   # Install dependencies
   npm install --production
   
   # Build the application
   npm run build
   
   # Start with PM2
   pm2 start npm --name "bigboysgame" -- start
   pm2 save
   pm2 startup
   ```

3. **Nginx Configuration** (Recommended)
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Alternative Hosting Solutions

If GoDaddy doesn't support Node.js applications well, consider these alternatives:

### 1. Vercel (Recommended for ease)
```bash
npm install -g vercel
vercel --prod
```

### 2. Heroku
```bash
# Install Heroku CLI
# Create Procfile
echo "web: npm start" > Procfile
git add .
git commit -m "Deploy to Heroku"
heroku create your-app-name
git push heroku main
```

### 3. DigitalOcean App Platform
- Connect GitHub repository
- Configure environment variables
- Deploy automatically

### 4. Railway
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Set secure session secrets
- [ ] Configure CORS properly
- [ ] Use production database with backups
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure firewall rules
- [ ] Regular security updates

## Performance Optimization

- [ ] Enable gzip compression
- [ ] Configure CDN for static assets
- [ ] Set up database connection pooling
- [ ] Enable caching headers
- [ ] Monitor application performance
- [ ] Set up database indexing

## Troubleshooting

### Common Issues:
1. **Database Connection Errors**
   - Verify DATABASE_URL format
   - Check firewall settings
   - Ensure database accepts external connections

2. **Environment Variables Not Loading**
   - Verify .env file location
   - Check variable names (case-sensitive)
   - Restart application after changes

3. **Build Failures**
   - Clear node_modules and package-lock.json
   - Reinstall dependencies
   - Check Node.js version compatibility

4. **WebSocket Connection Issues**
   - Configure proxy settings for WebSocket
   - Check firewall for WebSocket ports
   - Verify HTTPS/WSS configuration

## Post-Deployment

1. **Test all features**:
   - User registration/login
   - Game creation and joining
   - Payment processing
   - Video/voice chat
   - Email notifications

2. **Monitor logs** for errors

3. **Set up automated backups** for database

4. **Configure monitoring** and alerting

## Support

For hosting-specific issues, contact GoDaddy support or consider the alternative hosting platforms mentioned above that are more suitable for Node.js applications.