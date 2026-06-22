# Deployment

## Azure Static Web Apps

Recommended v1 hosting target:

1. Build the repository from the root with `npm run build`.
2. Configure Azure Static Web Apps with:
   - App location: `apps/web`
   - API location: `apps/api`
   - Output location: `dist`
3. Use Node.js 20 or later.
4. No application secrets are required.

The included `staticwebapp.config.json` allows anonymous `/api/*` calls and falls back SPA routes to `index.html`.

## Azure App Service Alternative

For App Service, deploy the web build output from `apps/web/dist` behind a Node or static-file host, and deploy the API as a separate Azure Functions app. Configure the frontend host to proxy `/api/*` to the Functions app, or set the same origin through Azure Front Door/Application Gateway.

## Local Verification Before Deployment

Run:

```powershell
npm install
npm run test
npm run build
```

Acceptance checks:

- Manual entry creates usage rows in under five minutes.
- Sample CSV identifies one Blob Storage row and one excluded Azure Files row.
- Pricing lookup shows a refresh timestamp.
- Results show GPv1/GPv2 totals, deltas, confidence labels, notes, and exports.
