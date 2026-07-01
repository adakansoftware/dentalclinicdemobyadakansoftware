# Production Hardening Runbook

This runbook is the minimum production checklist for this repository after the backend hardening work.

## 1. Database activation

Apply schema changes before traffic goes live:

```bash
npm run db:push
npm run db:hardening
```

## 2. Required secrets

Set strong values for:

- `SESSION_SECRET`
- `CRON_SECRET`
- `HEALTHCHECK_SECRET`
- `ADMIN_PASSWORD`

If forms are public in production, also set:

- `TURNSTILE_SECRET_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

## 3. Edge protection

Apply the Cloudflare steps from [cloudflare-waf-rules.md](./cloudflare-waf-rules.md).

Minimum expectation:

- proxy enabled
- `Full (strict)` SSL
- managed WAF rules on
- admin and `/api/*` challenge rules on
- rate limits for `/admin/login`, `/api/slots`, and form-heavy pages
- direct-to-origin access blocked where hosting allows

## 4. Deployment checks

After deploy:

1. Verify `/api/health` with the bearer secret.
2. Verify `/api/slots` returns successfully from an allowed same-site origin.
3. Verify admin login works with the production credentials.
4. Create a test booking and confirm the booking flow succeeds.
5. Confirm cron reminders can authenticate with `CRON_SECRET`.

## 5. Ongoing maintenance

Recommended cadence:

- after each deployment
- after unusual traffic spikes
- during weekly ops review

Review:

- health endpoint status
- Cloudflare Security Events
- 429 and 403 trends
- unusual admin login pressure

## 6. What is now protected

The app now includes:

- centralized replay protection for critical actions
- distributed rate-limit state for server-side guarded flows
- distributed suspicion scoring and temporary blocking
- middleware-level fast rejection for abusive traffic
- origin validation and admin step-up protection
- resilience guards for busy or failing endpoints

## 7. Remaining infra ceiling

The next major security jump is no longer app code first. It is infrastructure:

- CDN/WAF tuning
- origin lockdown
- external metrics/alerts
- optional Redis or managed edge KV
- optional real queue worker for SMS/background jobs
