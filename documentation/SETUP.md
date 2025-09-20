# LeadsTeNet Multi-User SaaS Setup Guide

This guide will help you set up the complete LeadsTeNet multi-user SaaS platform from scratch.

## 🏗️ Architecture Overview

LeadsTeNet is built as a secure, scalable SaaS platform with:
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Authentication**: Clerk for user management
- **Database**: Supabase PostgreSQL with Row-Level Security
- **AI**: Google Gemini API for personalization
- **Email**: Resend for transactional emails
- **Payments**: Stripe for subscription billing
- **UI**: shadcn/ui components

## 📋 Prerequisites

Before you begin, make sure you have:
- Node.js 18+ installed
- npm or yarn package manager
- Git for version control
- A code editor (VS Code recommended)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repository>
cd LeadGen-Ai
npm install
```

### 2. Environment Setup

Copy the environment template:
```bash
cp .env.example .env.local
```

### 3. Service Configuration

You'll need to set up the following services:

#### 🔐 Clerk Authentication
1. Go to [Clerk Dashboard](https://clerk.com/)
2. Create a new application
3. Copy your keys to `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

#### 🗄️ Supabase Database
1. Go to [Supabase Dashboard](https://supabase.com/)
2. Create a new project
3. Copy your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAi...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAi...
```

#### 🤖 Google Gemini AI
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an API key
3. Add to `.env.local`:
```env
GEMINI_API_KEY=AIzaSy...
```

#### 📧 Resend Email Service
1. Go to [Resend Dashboard](https://resend.com/)
2. Create an API key
3. Verify your sending domain
4. Add to `.env.local`:
```env
RESEND_API_KEY=re_...
```

#### 💳 Stripe Billing
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create products and prices for Pro ($49/month) and Enterprise ($149/month)
3. Copy your keys and price IDs:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
```

### 4. Database Setup

Run the database migrations:
```bash
# If using Supabase CLI
supabase db push

# Or run the SQL manually in Supabase SQL Editor
# Copy and execute: supabase/migrations/20250107000001_multi_user_schema.sql
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your application!

## 🔧 Detailed Configuration

### Stripe Webhook Setup

1. In your Stripe Dashboard, go to Webhooks
2. Create a webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret:
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Clerk Configuration

1. In Clerk Dashboard, go to "User & Authentication" > "Email, Phone, Username"
2. Enable email authentication
3. Configure redirect URLs:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/dashboard`
   - After sign-up: `/dashboard`

### Supabase Row-Level Security

The database uses RLS policies to ensure users can only access their own data. Policies are automatically created by the migration.

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Database Commands
```bash
# Reset database (careful!)
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > types/database.types.ts
```

## 🔒 Security Features

### Authentication & Authorization
- ✅ Clerk integration with MFA support
- ✅ Row-level security in Supabase
- ✅ API route protection
- ✅ User data isolation

### Data Protection
- ✅ Encrypted data at rest (Supabase)
- ✅ Encrypted data in transit (HTTPS)
- ✅ Environment variable protection
- ✅ Input validation and sanitization

### Email Security
- ✅ SPF/DKIM setup (Resend handles this)
- ✅ Rate limiting for email sending
- ✅ Bounce and complaint handling

## 📊 Usage Limits & Billing

### Subscription Tiers

| Feature | Free | Pro ($49/month) | Enterprise ($149/month) |
|---------|------|-----------------|------------------------|
| Emails/month | 50 | 1,000 | 5,000 |
| Campaigns | 3 | 20 | Unlimited |
| Leads/upload | 100 | 500 | 1,000 |
| Support | Community | Priority | Dedicated |

### Usage Tracking

The system automatically tracks:
- Email sends per user per month
- Campaign creation
- Lead uploads
- AI processing requests

Limits are enforced at the API level before processing.

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker Deployment

```dockerfile
# Dockerfile included in the project
docker build -t leadstenet .
docker run -p 3000:3000 leadstenet
```

### Environment Variables for Production

Make sure to set all production environment variables:

```env
# Production URLs
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Production API keys (not test keys)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Production webhook endpoint
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🔧 Customization

### Branding
- Update logo in `components/landing/header.tsx`
- Modify colors in `tailwind.config.ts`
- Update company name throughout components

### Email Templates
- Modify email content in `lib/ai-service.ts`
- Update email styling in `lib/email-service.ts`
- Add custom templates in AI prompts

### Subscription Plans
- Update plans in `lib/stripe-service.ts`
- Modify pricing in `components/landing/pricing.tsx`
- Adjust limits in database schema

## 🐛 Troubleshooting

### Common Issues

**"User not found" errors**
- Check Clerk webhook configuration
- Verify user creation in database

**Stripe webhook failures**
- Verify webhook URL is accessible
- Check webhook secret matches
- Review webhook event types

**Email delivery issues**
- Verify Resend domain setup
- Check API key permissions
- Review rate limiting settings

**Database connection issues**
- Verify Supabase credentials
- Check RLS policies
- Review migration status

### Debugging Commands

```bash
# Check database connection
npm run db:check

# Verify environment variables
npm run env:check

# Run tests
npm test

# Check build errors
npm run build 2>&1 | tee build.log
```

## 📈 Monitoring & Analytics

### Health Checks
- API endpoint monitoring
- Database connection checks
- External service status

### Performance Metrics
- Page load times
- API response times
- Email delivery rates
- User conversion funnel

### Business Metrics
- Monthly recurring revenue (MRR)
- Customer acquisition cost (CAC)
- Churn rate
- Usage per plan

## 🔄 Maintenance

### Regular Tasks
- Monitor usage limits
- Review error logs
- Update dependencies
- Backup database
- Review security settings

### Monthly Tasks
- Analyze billing metrics
- Review customer feedback
- Update documentation
- Security audit
- Performance optimization

## 📞 Support

For issues with this setup:

1. Check the troubleshooting section above
2. Review logs in your deployment platform
3. Check service status pages:
   - [Clerk Status](https://status.clerk.com/)
   - [Supabase Status](https://status.supabase.com/)
   - [Stripe Status](https://status.stripe.com/)
   - [Resend Status](https://resend.com/status)

## 🚨 Important Notes

### Security Considerations
- Never commit `.env` files to version control
- Use strong, unique passwords for all services
- Enable 2FA on all service accounts
- Regularly rotate API keys
- Monitor for suspicious activity

### Compliance
- The platform is designed to be GDPR compliant
- CAN-SPAM compliance is built into email sending
- Review your local privacy laws
- Consider data retention policies

### Scaling
- The architecture supports horizontal scaling
- Database connection pooling is handled by Supabase
- Consider CDN for static assets
- Monitor and optimize database queries

---

🎉 **Congratulations!** You now have a fully functional multi-user SaaS lead generation platform. The system preserves all the original Excel → AI → Email functionality while adding user management, billing, and enterprise-grade security.

For additional help, refer to the API documentation and component documentation in the `/documentation` folder.