# Deployment

## Provision with the ARM Template

The repository includes an ARM template at [`infra/azuredeploy.json`](../infra/azuredeploy.json) that creates an Azure Static Web App resource.

### Option A — Deploy to Azure button (public repository)

Click the **Deploy to Azure** badge in the README. Azure Portal downloads the template directly from the raw GitHub URL and opens the deployment wizard.

### Option B — Manual paste (private repository or CORS error)

If the button shows a download or CORS error, the repository may not yet be publicly accessible. Deploy manually:

1. Open [`infra/azuredeploy.json`](../infra/azuredeploy.json) in GitHub and copy the raw JSON content (click **Raw**, then select all and copy).
2. Go to the [Azure Portal custom deployment editor](https://portal.azure.com/#create/Microsoft.Template).
3. Click **Build your own template in the editor**.
4. Paste the copied JSON, then click **Save**.
5. Fill in the parameters (`staticWebAppName`, `location`, `sku`) and deploy.

After provisioning, copy the Static Web App **deployment token** from the portal and store it as the `AZURE_STATIC_WEB_APPS_API_TOKEN` repository secret to enable the Deploy GitHub Actions workflow.

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
