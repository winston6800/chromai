import React, { useState } from 'react';
import { Check, X, Zap, Wand2, Sparkles, Building2, ArrowRight, Star, Users, Briefcase } from 'lucide-react';

interface PricingTier {
  name: string;
  price: string;
  priceAnnual?: string;
  description: string;
  icon: React.ReactNode;
  features: {
    included: string[];
    excluded?: string[];
  };
  limits: {
    pages: string;
    models: string;
    storage: string;
    fileSize: string;
  };
  cta: string;
  popular?: boolean;
  color: string;
}

const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const consumerTiers: PricingTier[] = [
    {
      name: 'Starter',
      price: '$9',
      priceAnnual: '$90',
      description: 'Perfect for hobbyists and students',
      icon: <Zap className="w-6 h-6" />,
      color: 'violet',
      features: {
        included: [
          'Gemini 2.5 Flash model',
          'Up to 50 pages/month',
          'Basic colorization',
          'Manual editor access',
          'Standard processing speed',
          '1 reference image per project',
          'Community support'
        ],
        excluded: [
          'Gemini 3 Pro access',
          'Consistency engine',
          'Batch processing',
          'Priority support'
        ]
      },
      limits: {
        pages: '50/month',
        models: '2.5 Flash only',
        storage: '7 days',
        fileSize: '5MB max'
      },
      cta: 'Start Free Trial'
    },
    {
      name: 'Professional',
      price: '$29',
      priceAnnual: '$290',
      description: 'For content creators and indie artists',
      icon: <Wand2 className="w-6 h-6" />,
      color: 'fuchsia',
      popular: true,
      features: {
        included: [
          'Gemini 2.5 Flash + 3 Pro',
          'Up to 200 pages/month',
          'Consistency Engine',
          'Batch processing (10 pages)',
          'Advanced manual editor',
          'Unlimited reference images',
          'Custom prompts per page',
          'Global style instructions',
          'Priority processing queue',
          'High-res exports (4K)',
          '30-day storage',
          'Email support (24-48hr)'
        ]
      },
      limits: {
        pages: '200/month',
        models: 'Both models',
        storage: '30 days',
        fileSize: '20MB max'
      },
      cta: 'Start Free Trial'
    },
    {
      name: 'Studio',
      price: '$79',
      priceAnnual: '$790',
      description: 'For professional artists and studios',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'purple',
      features: {
        included: [
          'Everything in Professional',
          'Up to 1,000 pages/month',
          'Priority Gemini 3 Pro access',
          'Unlimited batch processing',
          'Advanced manual editor (layers, brushes)',
          'Storyboard management',
          'Multiple export formats (PNG, JPEG, WebP, PDF)',
          'Bulk download capabilities',
          'Custom watermark options',
          '100MB max file size',
          '90-day storage',
          'Priority email support (12-24hr)',
          'Early access to new features'
        ]
      },
      limits: {
        pages: '1,000/month',
        models: 'Both + Priority',
        storage: '90 days',
        fileSize: '100MB max'
      },
      cta: 'Start Free Trial'
    }
  ];

  const enterpriseTier: PricingTier = {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For publishing houses and large studios',
    icon: <Building2 className="w-6 h-6" />,
    color: 'gradient',
    features: {
      included: [
        'Unlimited pages',
        'Dedicated infrastructure',
        'Custom SLA (99.9% uptime)',
        'White-label options',
        'API access (REST)',
        'Team management (SSO, roles)',
        'Advanced analytics',
        'Custom model fine-tuning',
        'On-premise deployment (optional)',
        'Unlimited storage',
        'Dedicated account manager',
        '24/7 priority support',
        'Custom integrations',
        'Training & onboarding',
        'Compliance support (SOC 2, GDPR)'
      ]
    },
    limits: {
      pages: 'Unlimited',
      models: 'All + Custom',
      storage: 'Custom',
      fileSize: 'Custom'
    },
    cta: 'Contact Sales'
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      
      <div className="relative z-10 pt-24 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-900/30 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-wider mb-6">
              <Star className="w-3 h-3" />
              <span>Choose Your Plan</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold font-display tracking-tight mb-6">
              Simple, Transparent
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white">
                Pricing
              </span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
              Start with a 14-day free trial. No credit card required.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-zinc-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  billingCycle === 'annual' ? 'bg-violet-600' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-white' : 'text-zinc-500'}`}>
                Annual
                <span className="ml-2 text-xs text-violet-400">Save 17%</span>
              </span>
            </div>
          </div>

          {/* Consumer Tiers */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {consumerTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative glass-panel rounded-2xl border p-8 flex flex-col ${
                  tier.popular
                    ? 'border-fuchsia-500/50 shadow-2xl shadow-fuchsia-500/10 scale-105'
                    : 'border-white/10'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold rounded-full">
                    Most Popular
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  tier.color === 'violet' ? 'bg-violet-500/20 text-violet-400' :
                  tier.color === 'fuchsia' ? 'bg-fuchsia-500/20 text-fuchsia-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {tier.icon}
                </div>

                <h3 className="text-2xl font-bold font-display mb-2">{tier.name}</h3>
                <p className="text-sm text-zinc-400 mb-6">{tier.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">
                      {billingCycle === 'annual' && tier.priceAnnual ? tier.priceAnnual : tier.price}
                    </span>
                    {tier.price !== 'Custom' && (
                      <span className="text-zinc-500 text-sm">/{billingCycle === 'annual' ? 'year' : 'month'}</span>
                    )}
                  </div>
                </div>

                <button
                  className={`w-full py-3 px-4 rounded-xl font-bold transition-all mb-6 ${
                    tier.popular
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10'
                  }`}
                >
                  {tier.cta}
                </button>

                {/* Limits */}
                <div className="mb-6 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-500">
                    <span>Pages:</span>
                    <span className="text-white">{tier.limits.pages}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Models:</span>
                    <span className="text-white">{tier.limits.models}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Storage:</span>
                    <span className="text-white">{tier.limits.storage}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>File Size:</span>
                    <span className="text-white">{tier.limits.fileSize}</span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6 space-y-3">
                  <div className="text-xs font-bold text-zinc-400 mb-3">Features:</div>
                  {tier.features.included.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-zinc-300">{feature}</span>
                    </div>
                  ))}
                  {tier.features.excluded && tier.features.excluded.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 opacity-50">
                      <X className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                      <span className="text-xs text-zinc-500 line-through">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Enterprise Tier */}
          <div className="glass-panel rounded-2xl border border-white/10 p-8 md:p-12">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                  {enterpriseTier.icon}
                </div>
                <div>
                  <h3 className="text-3xl font-bold font-display mb-2">{enterpriseTier.name}</h3>
                  <p className="text-zinc-400">{enterpriseTier.description}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="text-4xl font-bold mb-2">{enterpriseTier.price}</div>
                  <p className="text-sm text-zinc-400 mb-6">
                    Custom pricing based on your needs. Volume discounts available.
                  </p>
                  <button className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl transition-all flex items-center gap-2">
                    Contact Sales
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-sm">
                  {enterpriseTier.features.included.slice(0, 8).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-fuchsia-400 shrink-0 mt-0.5" />
                      <span className="text-zinc-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{enterpriseTier.limits.pages}</div>
                  <div className="text-xs text-zinc-500">Pages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{enterpriseTier.limits.models}</div>
                  <div className="text-xs text-zinc-500">Models</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{enterpriseTier.limits.storage}</div>
                  <div className="text-xs text-zinc-500">Storage</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{enterpriseTier.limits.fileSize}</div>
                  <div className="text-xs text-zinc-500">File Size</div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ / Additional Info */}
          <div className="mt-16 text-center">
            <p className="text-zinc-400 mb-4">
              All plans include a 14-day free trial. Cancel anytime.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span>Student discounts available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;

