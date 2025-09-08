# StreamTip Deployment Guide

This guide covers deploying StreamTip to GitHub Pages (demo) and Firebase Hosting (production).

## 🎯 Demo Deployment (GitHub Pages)

### Prerequisites
1. Push code to GitHub repository
2. Enable GitHub Pages in repository settings
3. Set up repository secrets

### GitHub Repository Secrets
Add these secrets in your repository settings:
```
DEMO_THIRDWEB_CLIENT_ID=your_demo_thirdweb_client_id
```

### Automatic Deployment
The demo deploys automatically when you:
- Push to `main` or `demo` branch
- Create a pull request to `main`
- Manually trigger via GitHub Actions

### Manual Deployment
1. Go to GitHub repository → Actions tab
2. Select "Deploy Demo to GitHub Pages"
3. Click "Run workflow"

### Demo URL
After deployment: `https://ajurcevic.github.io/thirdweb-tippingchain`

---

## 🚀 Production Deployment (Firebase Hosting)

### Prerequisites
1. Create Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Install Firebase CLI: `npm install -g firebase-tools`
3. Set up Firebase authentication: `firebase login`

### Firebase Project Setup
```bash
# Initialize Firebase in project
firebase init hosting

# Select existing project or create new one
# Choose 'out' as public directory
# Configure as single-page app: Yes
# Set up automatic builds: No (handled by GitHub Actions)
```

### GitHub Repository Secrets
Add these secrets in your repository settings:

```
# Firebase Configuration
FIREBASE_TOKEN=your_firebase_ci_token
FIREBASE_PROJECT_ID=your_firebase_project_id

# Production Environment Variables
PROD_THIRDWEB_CLIENT_ID=your_production_thirdweb_client_id
PROD_TIPPING_CONTRACT=0x1234567890123456789012345678901234567890
PROD_STREAMER_REGISTRY=0x1234567890123456789012345678901234567890
PROD_BRIDGE_CONTRACT=0x1234567890123456789012345678901234567890
PROD_PLATFORM_WALLET=0x1234567890123456789012345678901234567890
PROD_APECHAIN_USDC_ADDRESS=0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359

# Optional Monitoring
PROD_DATADOG_API_KEY=your_datadog_api_key
PROD_SENTRY_DSN=your_sentry_dsn
```

### Getting Firebase Token
```bash
firebase login:ci
# Copy the token and add as FIREBASE_TOKEN secret
```

### Automatic Deployment
Production deploys automatically when you push to `production` branch.

### Manual Deployment
1. Go to GitHub repository → Actions tab
2. Select "Deploy Production to Firebase Hosting"
3. Click "Run workflow"

### Local Production Build Test
```bash
# Test production build locally
npm run build
npx serve out
```

---

## 📋 Deployment Checklist

### Before Demo Deployment
- [ ] Repository pushed to GitHub
- [ ] GitHub Pages enabled in settings
- [ ] Demo secrets configured
- [ ] Demo branch created (optional)

### Before Production Deployment
- [ ] Smart contracts deployed to production networks
- [ ] Contract addresses updated in secrets
- [ ] Firebase project created and configured
- [ ] Firebase token generated and added to secrets
- [ ] Production environment variables configured
- [ ] Monitoring services set up (optional)
- [ ] Domain configured (optional)

### Post-Deployment
- [ ] Test demo functionality at GitHub Pages URL
- [ ] Test production functionality at Firebase URL
- [ ] Verify API endpoints are working
- [ ] Check monitoring and error tracking
- [ ] Set up custom domain (optional)

---

## 🔧 Troubleshooting

### GitHub Pages Issues
- **404 errors**: Check basePath configuration in next.config.js
- **API routes not working**: GitHub Pages only supports static files, API routes are disabled in demo mode
- **Build failures**: Check Node.js version in workflow (should be 18+)

### Firebase Hosting Issues
- **Function errors**: Ensure all environment variables are set
- **Build failures**: Check Firebase configuration and permissions
- **API routes 500 errors**: Verify all required secrets are configured

### Environment Variables
- Demo mode: `NEXT_PUBLIC_DEMO_MODE=true` (GitHub Pages)
- Production mode: `NEXT_PUBLIC_DEMO_MODE=false` (Firebase)
- Base path: `NEXT_PUBLIC_BASE_PATH=/thirdweb-tippingchain` (GitHub Pages only)

---

## 🌐 Custom Domain Setup

### GitHub Pages
1. Add CNAME file to repository root with your domain
2. Configure DNS A records to point to GitHub Pages IPs
3. Enable HTTPS in repository settings

### Firebase Hosting
```bash
firebase hosting:channel:deploy live --project your-project-id
firebase hosting:domains:add your-domain.com
```

---

## 📊 Monitoring

### Production Monitoring
- Health check endpoint: `/api/health`
- Error tracking via Sentry (if configured)
- Performance monitoring via Datadog (if configured)
- Firebase Hosting analytics in Firebase console

### Demo Monitoring
- Static site monitoring via GitHub Pages status
- Client-side error tracking (if configured)