# 🚀 Vercel + Supabase Deployment Checklist

## ✅ **Pre-Deployment Checklist**

### 1. **Supabase Setup**
- [ ] Create Supabase project
- [ ] Get database connection string
- [ ] Get API keys (anon key, service role key)
- [ ] Test database connection locally
- [ ] Run database migrations
- [ ] Verify schema is created correctly

### 2. **Environment Variables**
- [ ] Set `DATABASE_TYPE=postgresql`
- [ ] Set `DATABASE_URL` with Supabase connection string
- [ ] Set `NEXTAUTH_SECRET` (32+ characters)
- [ ] Set `NEXTAUTH_URL` to your Vercel domain
- [ ] Set `SOCKET_IO_URL` to your Vercel domain
- [ ] Set Supabase API keys
- [ ] Set any payment/email/Steam API keys

### 3. **Code Preparation**
- [ ] Test build locally: `npm run build`
- [ ] Test database connection: `npm run supabase:setup`
- [ ] Verify all API routes work
- [ ] Check for any hardcoded localhost URLs
- [ ] Ensure all environment variables are used correctly

### 4. **Vercel Configuration**
- [ ] Connect GitHub repository to Vercel
- [ ] Set build command: `npm run vercel:build`
- [ ] Set all environment variables in Vercel dashboard
- [ ] Configure custom domain (if needed)

## 🚀 **Deployment Steps**

### Step 1: Supabase Setup
```bash
# 1. Create Supabase project at supabase.com
# 2. Get connection details from Settings → Database
# 3. Update your .env file with Supabase credentials
# 4. Test the setup
npm run supabase:setup
```

### Step 2: Vercel Deployment
```bash
# 1. Install Vercel CLI (if not already installed)
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy to Vercel
vercel --prod

# 4. Set environment variables in Vercel dashboard
# 5. Redeploy if needed
vercel --prod
```

### Step 3: Post-Deployment Verification
- [ ] Visit your deployed app
- [ ] Test database connection at `/test-database`
- [ ] Test user registration/login
- [ ] Test core features (games, betting, etc.)
- [ ] Check Vercel function logs
- [ ] Monitor Supabase dashboard

## 🔧 **Environment Variables Reference**

### Required Variables
```env
# Database
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Authentication
NEXTAUTH_SECRET=your-super-secret-key-here-minimum-32-characters
NEXTAUTH_URL=https://your-app.vercel.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Socket.io
SOCKET_IO_URL=https://your-app.vercel.app
```

### Optional Variables
```env
# Steam Authentication
STEAM_API_KEY=your-steam-api-key

# Payments
STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Email
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-smtp-password

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

## 🧪 **Testing Checklist**

### Database Tests
- [ ] Database connection works
- [ ] User registration works
- [ ] User login works
- [ ] Data persistence works
- [ ] API endpoints return correct data

### Feature Tests
- [ ] Provably fair games work
- [ ] Betting system works
- [ ] Chat system works
- [ ] Socket.io real-time features work
- [ ] File uploads work (if applicable)
- [ ] Payment processing works (if applicable)

### Performance Tests
- [ ] Page load times are acceptable
- [ ] API response times are good
- [ ] Database queries are optimized
- [ ] No memory leaks in functions

## 🚨 **Troubleshooting**

### Common Issues

#### Build Failures
```bash
# Check build logs in Vercel dashboard
# Common fixes:
npm run db:generate  # Regenerate Prisma client
npm run build        # Test build locally
```

#### Database Connection Issues
- Verify DATABASE_URL format
- Check Supabase project is active
- Ensure database password is correct
- Test connection locally first

#### Environment Variable Issues
- Check variable names match exactly
- Ensure no extra spaces or quotes
- Verify all required variables are set
- Check Vercel dashboard for typos

#### Socket.io Issues
- Ensure SOCKET_IO_URL matches Vercel domain
- Check CORS settings
- Verify Socket.io server is running

### Debug Commands
```bash
# Test database connection
npm run supabase:setup

# Test build locally
npm run vercel:build

# Check environment variables
vercel env ls

# View deployment logs
vercel logs
```

## 📊 **Monitoring**

### Vercel Dashboard
- [ ] Monitor function execution times
- [ ] Check error rates
- [ ] Monitor bandwidth usage
- [ ] Set up alerts for failures

### Supabase Dashboard
- [ ] Monitor database performance
- [ ] Check connection counts
- [ ] Monitor storage usage
- [ ] Set up backups

### Application Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Monitor user analytics
- [ ] Track performance metrics
- [ ] Set up uptime monitoring

## 🔒 **Security Checklist**

### Environment Security
- [ ] No secrets in code
- [ ] All sensitive data in environment variables
- [ ] Strong passwords and API keys
- [ ] Regular key rotation

### Application Security
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Input validation on all forms
- [ ] SQL injection prevention

### Database Security
- [ ] Database access restricted
- [ ] Strong database password
- [ ] Regular backups enabled
- [ ] Monitor for suspicious activity

## 📈 **Scaling Considerations**

### Performance
- [ ] Database connection pooling
- [ ] CDN for static assets
- [ ] Image optimization
- [ ] Code splitting

### Monitoring
- [ ] Set up performance monitoring
- [ ] Monitor database usage
- [ ] Track user metrics
- [ ] Set up alerts

### Costs
- [ ] Monitor Vercel usage
- [ ] Monitor Supabase usage
- [ ] Optimize function execution
- [ ] Consider upgrade plans

## 🎉 **Post-Deployment**

### Launch Checklist
- [ ] All tests passing
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Documentation updated

### Maintenance
- [ ] Regular security updates
- [ ] Monitor performance
- [ ] Update dependencies
- [ ] Backup database regularly
- [ ] Monitor costs

---

## 📞 **Support Resources**

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

## 🆘 **Emergency Contacts**

- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Supabase Support: [supabase.com/support](https://supabase.com/support)
- GitHub Issues: [github.com/your-repo/issues](https://github.com/your-repo/issues)

---

**Remember**: Always test thoroughly in a staging environment before deploying to production!
