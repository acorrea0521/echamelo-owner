# Cron Jobs Setup — Payment Order Sweep

## Overview

The app includes a periodic payment order sweep (`/api/cron/sweep-orders`) that charges any orders left in `pending_payment` state. This handles auctions that were closed by `pg_cron` (the database's background job that closes expired auctions) when no active viewers were present to trigger the HTTP close route.

**Why this matters:** Without the sweep, those orders would never be charged, and sellers would never get paid.

## How it works

1. **Database trigger:** `pg_cron` runs `sweep_expired_auctions()` every 10s, closing any auction past its expiration time. This creates a `pending_payment` order if a bid exists.
2. **Normal flow:** A connected viewer's client-side countdown hits 0 and calls `/api/auctions/[listingId]/close`, which immediately charges the order.
3. **Fallback flow:** If no viewer is present, the order sits in `pending_payment` until the periodic sweep charges it.

## Setup for Railway (current deployment)

Railway does not have native cron support, so use an external cron service:

### Option A: EasyCron (free tier available)

1. Go to [easycron.com](https://easycron.com)
2. Sign up (free tier: 100 jobs/month, run every 10 minutes)
3. Create a new Cron Job:
   - **Cron Expression:** `*/10 * * * *` (every 10 minutes)
   - **URL:** `https://echamelo-production.up.railway.app/api/cron/sweep-orders`
   - **Method:** GET
   - **Authentication:** Add a custom header:
     - Key: `Authorization`
     - Value: `Bearer <CRON_SECRET>` (use the value you set in Railway env vars)
4. Save and enable

### Option B: Uptime Robot (also free)

1. Go to [uptimerobot.com](https://uptimerobot.com) (you likely already use this for monitoring)
2. Click "Add New Monitor" → "Cron Job"
3. Set:
   - **Cron Expression:** `*/10 * * * *`
   - **URL:** `https://echamelo-production.up.railway.app/api/cron/sweep-orders`
   - **Custom Headers:**
     ```
     Authorization: Bearer <CRON_SECRET>
     ```
4. Save and enable

### Option C: Manual via curl (development only)

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" \
  https://echamelo-production.up.railway.app/api/cron/sweep-orders
```

## Setup for Vercel deployment (future)

If you migrate to Vercel, create `vercel.json` in the project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/sweep-orders",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

Vercel automatically passes the `Authorization: Bearer <CRON_SECRET>` header if you set `CRON_SECRET` in Vercel's environment variables.

## Environment Variables

### Railway

Set in the Railway dashboard under your project's "Variables":

```
CRON_SECRET=your-secret-here
```

Generate a strong random value:

```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString())) | Select-Object -First 32
```

### Vercel

Set in Vercel Project Settings → Environment Variables:

```
CRON_SECRET=your-secret-here
```

## Monitoring

### Check the logs

**Railway:**
- Go to your Railway project → Deployments → pick the latest → Logs tab
- Search for `sweep-orders`

**Vercel:**
- Vercel Cron logs appear in your project's "Functions" dashboard

### Sample successful response

```json
{
  "total": 3,
  "charged": 3,
  "failed": 0,
  "details": [
    {
      "listing_id": "abc123",
      "order_id": "order_001",
      "status": "paid"
    }
  ]
}
```

### Sample with failures

```json
{
  "total": 5,
  "charged": 3,
  "failed": 2,
  "details": [
    {
      "listing_id": "abc123",
      "order_id": "order_001",
      "status": "paid"
    },
    {
      "listing_id": "def456",
      "order_id": "order_002",
      "status": "failed"
    }
  ]
}
```

Failed orders stay in `pending_payment` and will be retried on the next sweep run. Common causes:
- Buyer's card expired since the hold was authorized
- Hold expired past Stripe's 7-day window
- Buyer requested a chargeback

## Testing locally

Start your dev server, then:

```bash
CRON_SECRET=test-secret npm run dev

# In another terminal
curl -H "Authorization: Bearer test-secret" \
  http://localhost:3000/api/cron/sweep-orders
```

You should see a response with `total`, `charged`, `failed`, and `details` keys.

## Troubleshooting

**"Unauthorized" response:**
- Check the `Authorization` header matches `Bearer <CRON_SECRET>` exactly
- Verify `CRON_SECRET` is set in your environment (not just `.env.local`)

**"Failed to fetch pending orders":**
- Check Supabase connectivity and that `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check the app logs for the full error

**Orders stuck in `pending_payment`:**
- Run the sweep manually via curl (see above)
- Check individual order failures in the details response
- Check buyer's Stripe account — their card may be declined or expired

**Too many failed orders:**
- This likely indicates a payment method issue (expired cards, chargebacks)
- You may need to notify buyers to update their cards and resubmit
- This is not yet built as a buyer-facing feature (out of Phase 1 scope)
