# iFixOrlando Backend Plan

This app replaces Glide while keeping Zapier in the workflow.

## Free-Tier Stack

- Frontend/admin app: React, TanStack Start, TanStack Router
- API hosting: Cloudflare Workers through TanStack Start server routes
- Database: Cloudflare D1
- File storage: Cloudflare R2
- Validation: Zod
- Automation: Zapier webhooks

## Data Flow

```txt
ifixorlando.com booking popup
  -> Zapier
  -> POST /api/webhooks/zapier/booking
  -> Cloudflare D1
  -> Admin dashboard
```

The frontend should not post directly to Zapier. Zapier feeds the backend, and
the backend is the source of truth.

## Cloudflare Setup

Create the D1 database:

```bash
npx wrangler d1 create ifixorlando
```

Copy the returned `database_id` into `wrangler.jsonc`, then apply the schema:

```bash
npx wrangler d1 execute ifixorlando --file=db/schema.sql
```

Create the R2 bucket for repair photos:

```bash
npx wrangler r2 bucket create ifixorlando-photos
```

Set a webhook secret so only Zapier can create bookings:

```bash
npx wrangler secret put ZAPIER_WEBHOOK_SECRET
```

Set admin login secrets:

```bash
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put AUTH_SECRET
```

`AUTH_SECRET` should be a random signing key. Generate one with:

```bash
openssl rand -hex 32
```

Zapier should POST JSON to:

```txt
https://<deployment-host>/api/webhooks/zapier/booking
```

Include the secret as either:

```txt
x-zapier-secret: <secret>
```

or:

```txt
?secret=<secret>
```

The header is preferred.

## Current Backend Endpoints

```txt
GET /api/repair-data
PUT /api/repair-data
POST /api/webhooks/zapier/booking
```

`/api/repair-data` exists to let the current Lovable-generated dashboard move
off `localStorage` without a full screen-by-screen rewrite. Later, this should
be split into narrower endpoints:

```txt
GET /api/appointments
POST /api/appointments
PATCH /api/appointments/:id
GET /api/customers
GET /api/stocks
PATCH /api/stocks/:id
GET /api/pricing
PATCH /api/pricing/:id
```

## Zapier Payload Mapping

```txt
Services Title                    -> appointment.iPhoneModel
Services Descriptions             -> appointment.description
Services Cost                     -> appointment.cost
Services Charge                   -> appointment.charge
Start                             -> appointment.scheduledDate
Consumers Name                    -> customer.name
Consumers Email                   -> customer.email
Consumers Mobile                  -> customer.phone
Consumers Address Line 1          -> customer.address
Consumers Address Zip             -> appointment.notes
Consumers Unit Floor              -> appointment.notes
Consumers Additional Fields Coupon -> appointment.coupon
Add Ons                           -> appointment.addOns
```
