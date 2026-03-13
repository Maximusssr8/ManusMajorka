---
title: "Shopify Australia: Complete Setup Guide with GST, Afterpay & AusPost"
description: "Step-by-step guide to setting up your Shopify store for Australian customers. Covers GST configuration, Afterpay/Zip integration, Australia Post shipping, and AU payment gateways."
date: "2025-03-13"
author: "Majorka Team"
tags: ["shopify australia", "shopify setup guide", "GST shopify", "afterpay shopify", "australia post shopify", "ecommerce australia", "dropshipping australia"]
---

# Shopify Australia: Complete Setup Guide with GST, Afterpay & AusPost

Setting up a Shopify store for the Australian market involves more than just picking a theme and listing products. Between GST obligations, local payment preferences like Afterpay, and the logistics of Australia Post shipping, there are several Australia-specific considerations that can make or break your store's success.

This guide walks you through every step of configuring your Shopify store for Australian customers — from initial setup to launch-ready configuration. Whether you're starting a brand-new store or optimising an existing one for the AU market, you'll find everything you need right here.

## Why Shopify Is the Go-To Platform for Australian Sellers

Shopify powers over 600,000 Australian businesses, making it the most popular ecommerce platform in the country. The reasons are straightforward:

- **Local support**: Shopify has a dedicated Australian team and local phone support
- **AUD pricing**: Plans are billed in Australian dollars with no currency conversion headaches
- **AU integrations**: Native support for Australian payment gateways, shipping carriers, and tax systems
- **Scalability**: From a side hustle doing $500 a month to a brand turning over $500K, the platform grows with you

If you're just getting started with ecommerce in Australia, check out our comprehensive guide on [how to start dropshipping in Australia](/blog/how-to-start-dropshipping-australia) for the broader picture before diving into your Shopify setup.

## Step 1: Creating Your Shopify Account (AU Settings)

### Initial Registration

Head to shopify.com.au to ensure you're signing up through the Australian portal. This automatically sets your default currency to AUD and your timezone to your local state.

When creating your account:

1. Use your Australian business email address
2. Enter your business name (this can be changed later)
3. Select "Australia" as your country
4. Choose your state or territory

### Choosing the Right Plan

Shopify offers three main plans for Australian sellers:

- **Basic ($59 AUD/month)**: Perfect for new stores. Includes 2 staff accounts and basic reporting
- **Shopify ($159 AUD/month)**: Mid-tier with 5 staff accounts and professional reports
- **Advanced ($599 AUD/month)**: For established stores needing advanced analytics and lower transaction fees

**Pro tip**: Start with Basic. You can always upgrade once revenue justifies it. The transaction fee difference between Basic (2%) and Advanced (0.6%) only matters when you're processing significant volume.

### Setting Your Store Defaults

Navigate to **Settings > General** and configure:

- **Store name**: Your brand name
- **Store currency**: Australian Dollar (AUD)
- **Time zone**: Select your state (e.g., AEST for NSW/VIC/QLD)
- **Unit system**: Metric (kilograms and centimetres)
- **Default weight unit**: Kilograms

## Step 2: GST Configuration and Tax Settings

Getting GST right is non-negotiable for Australian sellers. The ATO takes this seriously, and incorrect tax configuration can create headaches come BAS time.

### Understanding Your GST Obligations

If your business turns over more than $75,000 per year (or you reasonably expect it will), you must register for GST. Key points:

- GST is 10% on most goods and services
- You must include GST in your displayed prices (Australian Consumer Law requirement)
- You need to lodge Business Activity Statements (BAS) quarterly or monthly
- Digital products sold to Australian customers also attract GST

### Configuring GST in Shopify

1. Navigate to **Settings > Taxes and duties**
2. Click on **Australia**
3. Enable **"Charge tax on this product"** (this should be on by default)
4. Check **"All prices include tax"** — this is critical for Australian compliance
5. Set the tax rate to 10%

### Tax-Inclusive Pricing

Australian Consumer Law requires that prices displayed to consumers include GST. In Shopify:

1. Go to **Settings > Taxes and duties**
2. Enable **"All prices are tax-inclusive"**
3. This ensures the price your customer sees is the price they pay

### ABN and Tax Invoice Setup

Configure your ABN in your store settings so it appears on invoices:

1. Go to **Settings > Billing**
2. Add your ABN under business information
3. Customise your order confirmation emails to include your ABN and GST amount

For dropshippers specifically, understanding how GST interacts with your profit margins is essential. Our breakdown of [realistic dropshipping profit margins in Australia](/blog/dropshipping-profit-margins-australia) includes GST calculations in every example.

## Step 3: Payment Gateway Setup

Australian shoppers expect local payment options. Here's how to configure the most important ones.

### Shopify Payments (Recommended)

Shopify Payments is available in Australia and should be your primary payment gateway:

1. Go to **Settings > Payments**
2. Click **"Complete Shopify Payments setup"**
3. Enter your Australian business details, including ABN
4. Add your Australian bank account (BSB and account number)
5. Verify your identity

**Fees**: 1.75% + $0.30 AUD per transaction on the Basic plan, dropping to 1.4% + $0.30 on Advanced.

The major advantage: when using Shopify Payments, you pay zero additional transaction fees to Shopify on top of the credit card processing fees.

### Stripe AU

If you prefer Stripe or need it as a backup:

1. Create a Stripe account at stripe.com/au
2. In Shopify, go to **Settings > Payments > Third-party providers**
3. Search for and select Stripe
4. Connect your Stripe AU account

Stripe's Australian rates are competitive at 1.75% + $0.30 AUD for domestic cards.

### PayPal

Still widely used in Australia:

1. Go to **Settings > Payments**
2. Under PayPal, click **"Activate"**
3. Connect your Australian PayPal Business account

**Note**: PayPal charges 2.6% + $0.30 AUD, which is higher than Shopify Payments. Many sellers offer it as a secondary option for customers who prefer it.

## Step 4: Afterpay and Zip Integration

Buy Now, Pay Later (BNPL) services are massive in Australia. Over 30% of Australian online shoppers have used Afterpay, and offering it can significantly increase your conversion rate and average order value.

### Setting Up Afterpay

Afterpay (now part of Square) is Australia's most popular BNPL service:

1. **Apply for an Afterpay merchant account** at afterpay.com/en-AU/for-merchants
2. Approval typically takes 3-5 business days
3. Once approved, go to **Settings > Payments** in Shopify
4. Under **Alternative payment methods**, search for Afterpay
5. Enter your Afterpay merchant credentials

**Afterpay merchant fees**: Approximately 4-6% + $0.30 per transaction. While higher than card processing, the increased conversion rate and higher AOV typically offset this cost.

For a deeper look at how Afterpay impacts dropshipping economics, read our guide on [Afterpay for dropshipping in Australia](/blog/afterpay-dropshipping-australia).

### Setting Up Zip (formerly Zip Pay/Zip Money)

Zip is Afterpay's main competitor in Australia:

1. Apply for a Zip merchant account at zip.co/au/business
2. Once approved, install the Zip app from the Shopify App Store
3. Configure the Zip payment widget on your product pages
4. Enable Zip as a payment method in checkout

### Displaying BNPL Options on Product Pages

Simply enabling Afterpay at checkout isn't enough. You need to show the instalment breakdown on product pages:

1. Install the **Afterpay/Clearpay Messaging** app from Shopify App Store
2. This adds "or 4 interest-free payments of $X with Afterpay" messaging beneath your product prices
3. Do the same for Zip if you're offering both

## Step 5: Australia Post Shipping Setup

Shipping is one of the biggest operational challenges for Australian ecommerce. Australia Post remains the most trusted and widely used carrier.

### Connecting Australia Post to Shopify

1. Go to **Settings > Shipping and delivery**
2. Under **Carrier accounts**, click **"Connect carrier account"**
3. Select **Australia Post**
4. Enter your Australia Post eParcel credentials (you'll need a business account)

### Configuring Shipping Zones

Set up your Australian shipping zones:

**Domestic Zones:**
- Metro (major capital cities): Fastest delivery, lowest cost
- Regional: 1-2 days longer than metro
- Rural/Remote: Longest delivery times, highest cost

**Typical shipping rate structure:**

| Zone | Estimated Delivery | Suggested Rate |
|------|-------------------|----------------|
| Metro | 2-4 business days | $8.95 - Free over $100 |
| Regional | 4-7 business days | $9.95 - $12.95 |
| Rural/Remote | 7-14 business days | $12.95 - $19.95 |

### Free Shipping Thresholds

Free shipping is a powerful conversion tool. Most successful Australian stores offer free shipping over a threshold:

- **Under $50 AOV stores**: Free shipping over $75
- **$50-100 AOV stores**: Free shipping over $100-$150
- **$100+ AOV stores**: Free shipping over $150-$200

To set this up in Shopify, create a shipping rate with a price-based condition and set the rate to $0.00.

### Express Shipping with StarTrack and Aramex

Consider offering express shipping options alongside Australia Post:

- **StarTrack Express**: 1-3 business days nationally
- **Aramex (formerly Fastway)**: Competitive rates for lighter parcels

For a comprehensive look at carrier options and strategies, see our [Australia Post dropshipping guide](/blog/australia-post-dropshipping-guide).

## Step 6: Store Design and Localisation

### Choosing a Theme

Select a theme that works well for the Australian market:

- **Dawn** (free): Clean, fast, and works brilliantly for most stores
- **Sense** (free): Great for health and beauty products
- **Impulse** ($350 USD): Excellent for stores with large catalogues

### Australian Localisation Checklist

Go through your entire store and ensure:

- [ ] All prices display in AUD with the $ symbol
- [ ] Spelling uses Australian English (colour, favourite, organisation)
- [ ] Phone numbers use Australian format (+61 or 04xx xxx xxx)
- [ ] Address fields include Australian states and postcodes
- [ ] Return policy references Australian Consumer Law
- [ ] Privacy policy complies with the Australian Privacy Act

### Legal Pages

Every Australian Shopify store needs:

1. **Terms and Conditions**: Include references to ACL
2. **Privacy Policy**: Must comply with the Privacy Act 1988
3. **Refund Policy**: Under ACL, consumers have automatic rights regardless of your policy
4. **Shipping Policy**: Clear delivery timeframes and costs

## Step 7: Essential Apps for Australian Shopify Stores

### Must-Have Apps

- **Afterpay/Clearpay Messaging**: Display instalment pricing on product pages
- **Australia Post Shipping**: Real-time shipping calculations
- **Appy Reviews**: Product review collection (AU-based company)
- **Klaviyo**: Email marketing with strong AU integration

### Analytics and Optimisation

- **Google Analytics 4**: Track your AU traffic and conversions
- **Hotjar**: Understand how Australian shoppers interact with your store
- **[Majorka AI](https://manus-majorka.vercel.app)**: The all-in-one AI-powered ecommerce operating system built specifically for Australian sellers, with 20+ tools spanning Research, Validate, Build, Launch, and Optimize stages

Majorka's suite includes everything from product research and validation tools to profit calculators and ad copy generators — all calibrated for the Australian market with AUD pricing and local supplier data.

## Step 8: Pre-Launch Checklist

Before going live, work through this checklist:

### Technical
- [ ] Test checkout process end-to-end with a real transaction
- [ ] Verify GST is calculating correctly on all products
- [ ] Confirm Afterpay and Zip are working at checkout
- [ ] Test shipping rate calculations for metro, regional, and rural postcodes
- [ ] Check mobile responsiveness across devices
- [ ] Verify page load speed (aim for under 3 seconds)

### Legal and Compliance
- [ ] ABN displayed on the site
- [ ] GST-inclusive pricing on all products
- [ ] Privacy policy published and linked in footer
- [ ] Terms and conditions published
- [ ] Refund policy compliant with Australian Consumer Law

### Marketing Readiness
- [ ] Google Analytics 4 connected
- [ ] Facebook Pixel installed
- [ ] Email capture pop-up configured
- [ ] Social media accounts linked
- [ ] Initial product reviews added (if possible)

## Common Mistakes to Avoid

**1. Displaying prices excluding GST**: This is a legal requirement in Australia. Always show tax-inclusive prices to consumers.

**2. Ignoring BNPL options**: With Afterpay penetration so high in Australia, not offering it is leaving money on the table.

**3. Flat-rate shipping nationwide**: Australia's geography makes flat-rate shipping expensive. Use zone-based rates or build the average cost into your product pricing.

**4. Not accounting for remote surcharges**: Shipping to places like Alice Springs or Broome costs significantly more. Factor this into your shipping strategy.

**5. Forgetting mobile**: Over 65% of Australian ecommerce traffic comes from mobile devices. Test everything on mobile first.

## Next Steps After Setup

Once your Shopify store is live, the real work begins. Here's your roadmap:

1. **Find winning products** — Use Majorka's Product Research tools to identify high-potential products for the Australian market
2. **Validate before scaling** — Test products with small ad budgets before committing inventory or large ad spend
3. **Optimise your margins** — Factor in all costs (product, shipping, GST, platform fees, ad spend) to ensure profitability

For detailed guidance on each of these steps, explore our guides on [how to start dropshipping in Australia](/blog/how-to-start-dropshipping-australia) and [Afterpay for dropshipping](/blog/afterpay-dropshipping-australia).

## Start Building Your Shopify Store with Majorka

Setting up a Shopify store for the Australian market doesn't have to be overwhelming. With the right configuration from day one — proper GST settings, local payment options, and smart shipping — you'll be positioned for success.

**[Majorka AI](https://manus-majorka.vercel.app)** helps Australian sellers at every stage, from finding products to optimising your store post-launch. With 20+ AI-powered tools built specifically for the Australian ecommerce market, you can move faster and make smarter decisions.

[Get started free at manus-majorka.vercel.app](https://manus-majorka.vercel.app) — no credit card required. Upgrade to Pro ($49 AUD/month) or Scale ($149 AUD/month) when you're ready to accelerate.
