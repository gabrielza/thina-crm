---
description: "Use when working with South African real estate domain logic: commissions, VAT, FICA, POPIA, mandates, OTP stages, property portals, or ZAR currency formatting."
---
# South African Real Estate Domain

## Currency
- South African Rand (ZAR) — always use `formatCurrency()` from `@/lib/utils`
- VAT rate: 15% (as of 2024)
- VAT registration threshold: R1,000,000 rolling 12-month turnover

## Commission
- Standard commission: negotiated percentage of sale price (typically 5-7.5%)
- Commission splits: agent, franchise, referral parties
- Calculate: salePrice × rate% → gross → minus VAT (if registered) → minus splits → agent net
- Commission is paid on transfer registration (not OTP signing)

## Transaction Pipeline (OTP Stages)
1. `otp_signed` — Offer to Purchase signed by buyer and seller
2. `fica_submitted` — FICA documents submitted for both parties
3. `fica_verified` — FICA verification complete
4. `bond_applied` — Bond application submitted (if applicable)
5. `bond_approved` — Bond approved by financial institution
6. `transfer_lodged` — Transfer lodged with Deeds Office
7. `transfer_registered` — Transfer registered at Deeds Office
8. `commission_paid` — Commission paid to agency
9. `fallen_through` — Deal collapsed at any stage

## FICA (Financial Intelligence Centre Act)
- Required documents: certified ID, proof of residence, bank statement
- Both buyer and seller must be FICA-verified before transfer
- Track per-party: `ficaBuyer` and `ficaSeller` boolean flags on Transaction

## POPIA (Protection of Personal Information Act)
- Must record consent: given (bool), date, method (verbal/written/electronic/opt-in-form)
- Granular opt-in: email, SMS, phone, WhatsApp
- Must support consent revocation with date tracking
- Stored on Contact model as `popiaConsent` object

## Mandates
- Types: sole, dual, open, expired
- Track: mandateType, mandateStart, mandateEnd, mandateNumber
- Alert when mandate approaching expiry

## Property Portals
- Property24 and Private Property are the two major SA portals
- Leads arrive via email from portals → parse with regex → create InboundLead
- Email templates vary — parser extracts: Name, Phone, Email, Property Ref, Message

## Lead Sources
Common SA sources: Property24, Private Property, Show Day, Referral, Website, Walk-in, Social Media, Print Ad
