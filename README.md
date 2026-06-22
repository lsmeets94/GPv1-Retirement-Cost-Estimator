# GPv1 to GPv2 Billing Impact Estimator

Azure-hostable web app for estimating the billing impact of upgrading Azure Storage GPv1 accounts to GPv2 using public Azure list pricing.

## What It Does

- Accepts manual GPv1 Blob Storage usage or structured CSV billing line items.
- Detects Blob Storage rows and excludes Azure Files, Disks, Tables, and Queues by default.
- Looks up public prices through the Azure Retail Prices API.
- Shows GPv1 vs GPv2 list-price and discount-adjusted cost comparisons.
- Flags matches as Exact match, Strong match, Needs review, or Unmatched.
- Exports a customer-ready CSV and PDF summary.

## Repository Layout

- `apps/web` - React + TypeScript + Vite frontend.
- `apps/api` - Azure Functions-compatible TypeScript API.
- `packages/core` - shared CSV parsing, pricing URL construction, matching, calculations, and exports.
- `docs` - deployment and calculation methodology.
- `apps/web/public/sample-usage.csv` - sample CSV template and test data.

## Local Development

```powershell
npm install
npm run build
npm run test
npm run dev
```

For live Retail Prices API lookups during local development, run the API in a separate terminal:

```powershell
npm run build -w @gpv2-estimator/core
npm run build -w @gpv2-estimator/api
npm run start -w @gpv2-estimator/api
```

Then open the Vite URL shown by `npm run dev`.

## Environment Variables

No secrets are required.

For Azure Functions local development, copy `apps/api/local.settings.example.json` to `apps/api/local.settings.json`.

## Pricing Source

The API uses the unauthenticated Azure Retail Prices API:

`https://prices.azure.com/api/retail/prices?api-version=2023-01-01-preview`

Prices are filtered by Storage service family, Consumption price type, region, currency, and available meter hints. The response keeps meter IDs and public meter details visible in the UI.

## Important Limits

This app is an estimator. It does not model taxes, credits, reservations, support plans, marketplace charges, private negotiated pricing, or customer-specific billing APIs. Discounts are modeled only when entered by the user.
