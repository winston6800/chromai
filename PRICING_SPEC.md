# ChromaManga Pricing Implementation Specification

## Overview
This document specifies the implementation requirements for the ChromaManga pricing and subscription system. The pricing model includes 3 consumer tiers (Starter, Professional, Studio) and 1 enterprise tier with usage-based billing.

---

## 1. Pricing Tiers

### 1.1 Consumer Tiers

#### Starter - $9/month
- **Monthly Price:** $9
- **Annual Price:** $90/year (17% discount)
- **Pages/Month:** 50
- **Overage:** $0.25/page
- **Models:** Gemini 2.5 Flash only
- **Features:**
  - Basic colorization (single image mode)
  - Manual editor (basic tools)
  - Standard processing speed
  - 1 reference image per project
  - Community support
  - 7-day storage retention
  - 5MB max file size

#### Professional - $29/month
- **Monthly Price:** $29
- **Annual Price:** $290/year (17% discount)
- **Pages/Month:** 200
- **Overage:** $0.20/page
- **Models:** Gemini 2.5 Flash + Gemini 3 Pro
- **Features:**
  - Consistency Engine (reference image support)
  - Batch processing (up to 10 pages)
  - Advanced manual editor
  - Unlimited reference images
  - Custom prompts per page
  - Global style instructions
  - Priority processing queue
  - High-resolution exports (up to 4K)
  - 30-day storage retention
  - 20MB max file size
  - Email support (24-48hr response)

#### Studio - $79/month
- **Monthly Price:** $79
- **Annual Price:** $790/year (17% discount)
- **Pages/Month:** 1,000
- **Overage:** $0.10/page
- **Models:** Both models + Priority Gemini 3 Pro access
- **Features:**
  - Everything in Professional
  - Unlimited batch processing
  - Advanced manual editor (layers, brushes, effects)
  - Storyboard management (unlimited projects)
  - Multiple export formats (PNG, JPEG, WebP, PDF)
  - Bulk download capabilities
  - Custom watermark options
  - 100MB max file size
  - 90-day storage retention
  - Priority email support (12-24hr response)
  - Early access to new features

### 1.2 Enterprise Tier

#### Enterprise - Custom Pricing
- **Base Fee:** $500-2,000/month (team size dependent)
- **Usage-Based Pricing:**
  - 0-5,000 pages: $0.15/page
  - 5,001-20,000 pages: $0.12/page
  - 20,001-50,000 pages: $0.10/page
  - 50,000+ pages: Custom pricing
- **Add-ons:**
  - API access: +$200/month
  - White-label: +$300/month
  - On-premise: Custom quote
  - Custom integrations: One-time setup + monthly maintenance
- **Contract:** Minimum 12-month commitment
- **Discounts:** 10-15% off for annual billing

---

## 2. Feature Matrix

| Feature | Starter | Professional | Studio | Enterprise |
|---------|---------|-------------|--------|------------|
| **Gemini 2.5 Flash** | ✅ | ✅ | ✅ | ✅ |
| **Gemini 3 Pro** | ❌ | ✅ | ✅ (Priority) | ✅ |
| **Consistency Engine** | ❌ | ✅ | ✅ | ✅ |
| **Batch Processing** | ❌ | ✅ (10 max) | ✅ (Unlimited) | ✅ |
| **Manual Editor** | Basic | Advanced | Pro | Pro |
| **Reference Images** | 1/project | Unlimited | Unlimited | Unlimited |
| **Custom Prompts** | ❌ | ✅ | ✅ | ✅ |
| **Global Instructions** | ❌ | ✅ | ✅ | ✅ |
| **Storyboard Management** | ❌ | ❌ | ✅ | ✅ |
| **Export Formats** | PNG, JPEG | PNG, JPEG, WebP | All + PDF | All + Custom |
| **API Access** | ❌ | ❌ | ❌ | ✅ |
| **White-Label** | ❌ | ❌ | ❌ | ✅ |
| **Team Management** | ❌ | ❌ | ❌ | ✅ |
| **Storage Retention** | 7 days | 30 days | 90 days | Custom |
| **Max File Size** | 5MB | 20MB | 100MB | Custom |
| **Support** | Community | Email (24-48hr) | Priority Email (12-24hr) | 24/7 Dedicated |

---

## 3. Implementation Requirements

### 3.1 User Management

#### User Model
```typescript
interface User {
  id: string;
  email: string;
  subscriptionTier: 'starter' | 'professional' | 'studio' | 'enterprise';
  billingCycle: 'monthly' | 'annual';
  subscriptionStatus: 'active' | 'trial' | 'cancelled' | 'past_due';
  trialEndsAt: Date | null;
  subscriptionStartsAt: Date;
  subscriptionEndsAt: Date;
  pagesUsedThisMonth: number;
  pagesLimit: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}
```

#### Usage Tracking
- Track pages processed per user per month
- Reset counter on billing cycle
- Track API calls per model type
- Store usage history for analytics

### 3.2 Feature Gating

#### Model Access Control
```typescript
function canUseModel(user: User, model: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview'): boolean {
  if (model === 'gemini-2.5-flash-image') return true;
  return ['professional', 'studio', 'enterprise'].includes(user.subscriptionTier);
}
```

#### Feature Flags
- Consistency Engine: Professional+
- Batch Processing: Professional+ (limit based on tier)
- Advanced Editor: Studio+
- API Access: Enterprise only
- White-Label: Enterprise only

### 3.3 Usage Limits

#### Page Limits
- Check `pagesUsedThisMonth < pagesLimit` before processing
- If limit exceeded, show upgrade prompt or allow overage purchase
- Overage pricing varies by tier

#### File Size Limits
- Validate file size on upload
- Reject files exceeding tier limit
- Show upgrade prompt for larger files

#### Storage Retention
- Automatically delete files older than retention period
- Send warning email 7 days before deletion
- Allow storage extension purchase

### 3.4 Billing Integration

#### Payment Provider
- **Primary:** Stripe
- Support credit cards, ACH (Enterprise)
- Handle subscription lifecycle:
  - Trial period (14 days)
  - Subscription activation
  - Renewal
  - Cancellation
  - Upgrade/Downgrade
  - Proration

#### Webhook Handlers
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 3.5 API Endpoints

#### Subscription Management
```
POST /api/subscriptions/create
  - Create subscription with Stripe
  - Start trial period
  - Return checkout URL

POST /api/subscriptions/upgrade
  - Upgrade tier
  - Prorate billing
  - Update feature access immediately

POST /api/subscriptions/cancel
  - Cancel subscription
  - Allow access until period end

GET /api/subscriptions/status
  - Return current subscription details
  - Usage stats
  - Billing info
```

#### Usage Tracking
```
POST /api/usage/track
  - Track page processing
  - Increment usage counter
  - Check limits

GET /api/usage/stats
  - Return current month usage
  - Remaining pages
  - Usage history
```

### 3.6 Frontend Components

#### Subscription Status Widget
- Display current tier
- Show usage progress bar
- Upgrade button
- Billing date

#### Upgrade Prompts
- Show when approaching limit
- Show when feature requires upgrade
- Show when file size exceeds limit

#### Pricing Page
- Display all tiers
- Feature comparison
- Billing cycle toggle
- CTA buttons (Start Trial / Contact Sales)

---

## 4. Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  subscription_tier VARCHAR(20) NOT NULL,
  billing_cycle VARCHAR(10) NOT NULL,
  subscription_status VARCHAR(20) NOT NULL,
  trial_ends_at TIMESTAMP,
  subscription_starts_at TIMESTAMP,
  subscription_ends_at TIMESTAMP,
  pages_used_this_month INTEGER DEFAULT 0,
  pages_limit INTEGER NOT NULL,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Usage Logs Table
```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  pages_processed INTEGER DEFAULT 1,
  model_used VARCHAR(50),
  file_size_bytes BIGINT,
  processing_time_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  tier VARCHAR(20) NOT NULL,
  billing_cycle VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 5. Business Logic

### 5.1 Trial Period
- All new users get 14-day free trial
- Full feature access during trial
- 10 pages included (any model)
- No credit card required
- Auto-convert to selected plan after trial
- Send reminder emails at 7 days, 3 days, 1 day

### 5.2 Overage Handling
- When limit exceeded, show modal:
  - "You've used all your pages this month"
  - Options: Upgrade tier, Purchase overage, Wait for reset
- Overage purchases are one-time charges
- Track overage separately from subscription

### 5.3 Upgrade/Downgrade Flow
- **Upgrade:** Immediate access, prorated billing
- **Downgrade:** Access until period end, then apply new limits
- Show confirmation modal with:
  - New features gained/lost
  - Proration amount
  - Effective date

### 5.4 Cancellation
- Allow cancellation anytime
- Access continues until period end
- Send cancellation survey
- Offer retention discount (optional)

---

## 6. Analytics & Reporting

### Metrics to Track
- MRR (Monthly Recurring Revenue)
- Churn rate
- Upgrade/downgrade rates
- Average pages per user per tier
- Feature usage by tier
- Trial-to-paid conversion rate
- Customer lifetime value (LTV)

### Dashboards
- Revenue dashboard (Stripe + internal)
- Usage analytics
- User segmentation
- Cohort analysis

---

## 7. Security & Compliance

### Data Protection
- Encrypt payment information (Stripe handles)
- Secure API keys (environment variables)
- Rate limiting on API endpoints
- User data isolation

### Compliance
- GDPR compliance (data export, deletion)
- SOC 2 (Enterprise tier)
- Terms of Service
- Privacy Policy
- Refund Policy

---

## 8. Testing Requirements

### Unit Tests
- Feature gating logic
- Usage limit calculations
- Billing proration
- Overage pricing

### Integration Tests
- Stripe webhook handling
- Subscription lifecycle
- Usage tracking
- Feature access control

### E2E Tests
- Signup flow
- Trial period
- Upgrade flow
- Payment processing
- Usage limit enforcement

---

## 9. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] User model with subscription fields
- [ ] Database schema
- [ ] Basic feature gating
- [ ] Usage tracking

### Phase 2: Billing (Week 3-4)
- [ ] Stripe integration
- [ ] Subscription creation
- [ ] Webhook handlers
- [ ] Payment processing

### Phase 3: Frontend (Week 5-6)
- [ ] Pricing page
- [ ] Subscription status widget
- [ ] Upgrade prompts
- [ ] Usage dashboard

### Phase 4: Enterprise (Week 7-8)
- [ ] Enterprise tier features
- [ ] Team management
- [ ] API access
- [ ] Custom billing logic

### Phase 5: Polish (Week 9-10)
- [ ] Analytics dashboard
- [ ] Email notifications
- [ ] Documentation
- [ ] Testing & bug fixes

---

## 10. Success Metrics

### Key Performance Indicators (KPIs)
- **MRR Growth:** Target 20% month-over-month
- **Trial Conversion:** Target 25%+
- **Churn Rate:** Target <5% monthly
- **Average Revenue Per User (ARPU):** Track by tier
- **Customer Acquisition Cost (CAC):** Optimize marketing spend
- **LTV:CAC Ratio:** Target 3:1 or higher

### Monitoring
- Real-time subscription metrics
- Usage alerts (approaching limits)
- Payment failure notifications
- Churn risk indicators

---

## 11. Future Enhancements

### Potential Additions
- Pay-as-you-go option ($0.30/page, no subscription)
- Student discounts (50% off Professional)
- Non-profit discounts (30% off all tiers)
- Referral program (1 month free for both)
- Family/team plans
- Usage-based pricing for all tiers
- Custom model training (Enterprise+)

---

## 12. Support & Documentation

### User Documentation
- Pricing FAQ
- Feature comparison guide
- Upgrade/downgrade instructions
- Billing help center

### Internal Documentation
- API documentation
- Webhook reference
- Billing logic flowcharts
- Support escalation procedures

---

## Appendix: Pricing Calculations

### Cost Analysis (Per Page)
- Gemini 2.5 Flash: ~$0.02-0.05 per image
- Gemini 3 Pro: ~$0.10-0.15 per image
- Target margin: 60-70% after API costs

### Revenue Projections (Example)
- 100 Starter users: $900/month
- 50 Professional users: $1,450/month
- 20 Studio users: $1,580/month
- 5 Enterprise clients: $7,500/month
- **Total: ~$11,430 MRR**

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Owner:** Product Team

