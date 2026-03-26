# Innara -- Launch Checklist

## Pre-Launch

### Infrastructure
- [ ] Supabase project created and configured
- [ ] Vercel deployment set up (preview + production)
- [ ] Custom domain configured (DNS + SSL)
- [ ] Environment variables set in Vercel
- [ ] Stripe account configured (products, prices, webhooks)
- [ ] Resend domain verified and API key set
- [ ] Sentry project created and DSN configured
- [ ] Upstash Redis configured for rate limiting

### Security
- [ ] RLS policies on ALL tables verified
- [ ] API routes require authentication where needed
- [ ] Rate limiting on public endpoints
- [ ] Input validation on all forms and API routes
- [ ] CORS configured correctly
- [ ] Secrets encrypted (no plaintext in code or env)
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified

### Testing
- [ ] Unit tests passing (Vitest)
- [ ] Integration tests passing
- [ ] E2E tests passing (Playwright)
- [ ] Multi-tenant isolation verified
- [ ] Auth flows tested (all 4 roles)
- [ ] Billing flows tested (subscription, cancel, upgrade)
- [ ] AI concierge tested with various inputs
- [ ] Mobile responsiveness verified (guest portal)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Load testing completed

### Performance
- [ ] Lighthouse score > 90 (guest portal)
- [ ] Core Web Vitals passing
- [ ] Images optimized
- [ ] Bundle size acceptable
- [ ] Database queries indexed
- [ ] CDN caching configured

### Content & Legal
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie consent implemented
- [ ] GDPR compliance verified
- [ ] Data processing agreements ready
- [ ] Support email configured

### Monitoring
- [ ] Sentry error tracking active
- [ ] Uptime monitoring configured
- [ ] Analytics tracking set up
- [ ] Alerting rules configured (error rate, latency)

## Launch Day
- [ ] Final smoke tests on production
- [ ] Monitoring dashboards open
- [ ] Rollback plan documented
- [ ] On-call schedule set
- [ ] DNS propagation confirmed

## Post-Launch
- [ ] Monitor error rates for 24 hours
- [ ] Check performance metrics
- [ ] Gather initial user feedback
- [ ] Address critical bugs immediately
- [ ] Schedule retrospective
