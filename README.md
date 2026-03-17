# Dental Clinic White-Label System

Production-ready Next.js 15 white-label dental clinic booking & admin system built for Turkish dental clinics.

## Tech Stack

- **Next.js 15** (App Router, Server Actions, TypeScript strict)
- **PostgreSQL + Prisma ORM** (Neon recommended)
- **Tailwind CSS**
- **Vercel** deployment + Cron Jobs

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 3. Database setup
```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:seed       # Seed with demo data
```

### 4. Run development server
```bash
npm run dev
```

## Default Admin Credentials
- **URL**: `/admin/login`
- **Email**: `admin@klinik.com`
- **Password**: `Admin123!`

⚠️ **Change this immediately after first login via Settings → Admin password**

## Features

### Public Pages
| Route | Description |
|-------|-------------|
| `/` | Homepage (hero, services, specialists, reviews, CTA) |
| `/about` | About us page |
| `/services` | Service list |
| `/services/[slug]` | Service detail |
| `/specialists` | Specialist list |
| `/specialists/[slug]` | Specialist detail |
| `/reviews` | Patient reviews + submit form |
| `/faq` | FAQ accordion |
| `/contact` | Contact form + map + working hours |
| `/appointment` | 4-step appointment booking |

### Admin Panel (`/admin`)
| Route | Description |
|-------|-------------|
| `/admin` | Dashboard with stats |
| `/admin/appointments` | Appointment list, filter, status update |
| `/admin/services` | Service CRUD |
| `/admin/specialists` | Specialist CRUD + service assignment |
| `/admin/working-hours` | Per-specialist working hours |
| `/admin/blocked-slots` | Block specific time slots |
| `/admin/faq` | FAQ management |
| `/admin/reviews` | Review moderation |
| `/admin/contact-requests` | Inbox |
| `/admin/settings` | All site settings (colors, texts, SEO, etc.) |

### Bilingual Support
- TR / EN toggle in navbar
- Stored in `localStorage`
- All UI strings in `src/lib/translations.ts`
- Service/specialist names stored bilingual in DB

### SMS (Netgsm)
- Set `SMS_ENABLED=true` in `.env.local` to activate
- Confirmation SMS on new appointment
- Cancellation SMS when appointment is cancelled
- **Reminder cron**: runs daily at 06:00 UTC for next-day confirmed appointments

## Deployment (Vercel + Neon)

1. Create a [Neon](https://neon.tech) PostgreSQL database
2. Push to GitHub
3. Import in [Vercel](https://vercel.com)
4. Add environment variables (see `.env.example`)
5. After deploy: `npx prisma db push && npx prisma db seed`
6. Cron jobs are automatically configured via `vercel.json`

## Customization

Everything is configurable from the admin panel:
- Clinic name (TR + EN)
- Phone, WhatsApp, email, address
- Primary & accent colors (live preview)
- Logo & favicon URLs
- Hero section text
- About page content
- SEO meta titles & descriptions
- Social media links
- Google Maps embed URL

## Environment Variables

| Variable | Description | Required |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `SESSION_SECRET` | Min 32-char secret for sessions | ✅ |
| `SMS_ENABLED` | `true` or `false` | ✅ |
| `NETGSM_USERNAME` | Netgsm account username | SMS only |
| `NETGSM_PASSWORD` | Netgsm account password | SMS only |
| `NETGSM_HEADER` | SMS sender header (max 11 chars) | SMS only |
| `CRON_SECRET` | Bearer token for cron endpoint | Recommended |
| `NEXT_PUBLIC_APP_URL` | Full production URL | Recommended |

## License

MIT — free to use, modify and deploy for any dental clinic.
