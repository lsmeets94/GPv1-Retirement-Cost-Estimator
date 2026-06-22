# GPv1 to GPv2 Billing Impact Estimator

## Production Hardening PRD

### Version

1.0

### Status

Proposed production-readiness plan. This document describes the minimum hardening work recommended before broadly publishing the application on the public web.

### Current Product Baseline

The current application is a React + TypeScript frontend with a shared TypeScript core package and a lightweight Node/TypeScript Azure Functions API. It is deployable through Azure Static Web Apps and uses the unauthenticated Azure Retail Prices API for public list-price lookup.

The application currently stores estimate and customer workspace data in browser local storage. It does not use Azure sign-in, subscription discovery, private pricing APIs, a database, or server-side customer data persistence.

### Hardening Position

The current release is suitable for limited internal preview or controlled customer demos.

It is not yet hardened enough for broad public customer-facing release.

---

# 1. Executive Summary

Production hardening should focus on reducing public exposure risk, dependency risk, abuse risk, data-handling ambiguity, and operational blind spots.

The core application design is relatively low-risk because the API only brokers public Azure Retail Prices API calls and the app does not store customer data on a server. However, a public deployment still needs security headers, dependency remediation, input validation, rate limiting or abuse controls, privacy clarity, and CI security gates.

The goal of this PRD is to define a concrete path from "preview-ready" to "production-ready for public web use."

---

# 2. Goals

## Primary Goals

Reduce dependency vulnerability exposure.

Harden browser and HTTP response behavior.

Protect the anonymous pricing API from accidental or abusive traffic.

Validate all customer-controlled imports before use.

Make local data persistence transparent to users.

Add release gates that prevent known vulnerable builds from shipping.

Create an operations posture for monitoring and incident response.

---

## Secondary Goals

Improve customer trust.

Reduce support burden.

Prepare for future authentication and customer-specific features.

Document the app's security model clearly.

---

# 3. Non-Goals

This hardening release will not introduce:

* Azure subscription discovery
* Customer billing account integration
* EA/MCA private pricing retrieval
* Server-side customer portfolio storage
* Multi-user collaboration
* Automated migration execution
* Enterprise identity lifecycle management
* A full compliance certification process

---

# 4. Release Gates

The application should not be promoted as broadly public until all P0 and P1 items are complete.

## P0 Launch Blockers

* Resolve production dependency vulnerabilities, including the current `jspdf <=4.2.0` critical advisory reported by `npm audit --omit=dev`.
* Add security headers in `staticwebapp.config.json`.
* Add API query validation and response hardening.
* Add JSON import schema validation and file-size limits.
* Add CI checks for test, typecheck, lint, build, and production dependency audit.
* Add visible privacy and local-storage disclosure.

## P1 Public Release Requirements

* Add API throttling or abuse controls.
* Add Application Insights monitoring.
* Add error boundaries and safe user-facing error messages.
* Add dependency update automation.
* Add documented incident response and rollback steps.
* Add a production deployment checklist.

## P2 Follow-Up Hardening

* Optional access gate for private customer previews.
* CodeQL or equivalent static analysis.
* End-to-end smoke tests against the deployed Static Web App.
* CSP tightening with nonce/hash strategy if needed.
* Formal threat model review.

---

# 5. Feature Area 1

## Dependency and Supply Chain Hardening

### Problem Statement

The current production dependency audit reports a critical vulnerability in `jspdf <=4.2.0`. The tool uses jsPDF for client-side PDF generation, so this dependency is part of the production attack surface.

### Requirements

Upgrade jsPDF to a non-vulnerable version.

Regression-test estimate PDF export and portfolio PDF export after upgrade.

Run `npm audit --omit=dev` in CI.

Fail production builds when high or critical production vulnerabilities are present, unless a documented temporary exception exists.

Pin dependency versions through `package-lock.json`.

Enable Dependabot or equivalent dependency update automation for npm and GitHub Actions.

### Acceptance Criteria

`npm audit --omit=dev` returns no high or critical vulnerabilities.

Estimate PDF export still works.

Portfolio PDF export still works.

CI fails if high or critical production vulnerabilities are introduced.

---

# 6. Feature Area 2

## Static Web App Security Headers

### Problem Statement

The current `staticwebapp.config.json` does not set security headers. Public browsers should receive explicit protections against clickjacking, MIME sniffing, overbroad referrer leakage, unnecessary browser permissions, and avoidable script injection risk.

### Requirements

Add global response headers:

* `Content-Security-Policy`
* `X-Content-Type-Options: nosniff`
* `X-Frame-Options: DENY`
* `Referrer-Policy: strict-origin-when-cross-origin`
* `Permissions-Policy` denying camera, microphone, geolocation, payment, and other unused browser features
* `Strict-Transport-Security` if supported by the hosting path and custom domain configuration

Initial CSP should allow:

* Same-origin scripts and styles required by the bundled app.
* Calls to the same-origin `/api/*` endpoint.
* No framing.
* No object/embed content.

The CSP should be tested against the deployed build to avoid breaking Vite bundles, Fluent UI styles, chart rendering, downloads, or PDF export.

### Acceptance Criteria

Production responses include security headers.

The app loads successfully with CSP enabled.

PDF, CSV, and JSON downloads still work.

No browser console CSP violations appear during normal workflows.

---

# 7. Feature Area 3

## API Abuse and Validation Controls

### Problem Statement

The `/api/prices/search` endpoint is anonymous. It does not process secrets or customer data, but it can be abused to generate excessive Azure Retail Prices API traffic or degrade app reliability.

### Requirements

Validate all query parameters:

* Region must match a known Azure ARM region from the app region list.
* Currency must match a supported ISO currency from the app currency list.
* Redundancy must be one of the supported redundancy values.
* Access tier must be one of the supported tier values.
* Query string values must have maximum lengths.
* Unsupported parameters should be ignored or rejected consistently.

Add response hardening:

* Return generic error messages to clients.
* Log detailed errors server-side only.
* Include consistent status codes for validation failures, upstream failures, and cache fallback.

Add abuse controls:

* Prefer Azure Static Web Apps or Azure Functions platform throttling if available.
* Add simple in-memory per-IP or per-query throttling if platform throttling is not enough.
* Cap pagination and candidate counts defensively.
* Cache successful lookups and deduplicate equivalent requests.

### Acceptance Criteria

Invalid query parameters return `400`.

Known-good pricing requests still succeed.

Repeated equivalent requests use cache.

Abusive traffic is rate-limited or otherwise constrained.

Client-facing errors do not expose stack traces or implementation details.

---

# 8. Feature Area 4

## Import Validation and File Safety

### Problem Statement

CSV and JSON imports are customer-controlled inputs. The current implementation parses files in the browser but needs stronger file-size, schema, and error-handling controls before broad public release.

### Requirements

CSV import:

* Enforce a maximum file size.
* Enforce a maximum row count.
* Validate required headers.
* Reject or warn on unsupported schemas.
* Continue showing row-level validation errors inline.

JSON import:

* Enforce a maximum file size.
* Validate shape before applying data to state.
* Support only known `SavedEstimate` and `SavedPortfolio` versions.
* Reject unknown or oversized payloads with a safe user-facing message.
* Ignore unexpected properties.
* Validate imported assessment arrays, result rows, customer profile fields, and dates.

Output safety:

* Escape CSV cells that begin with formula-control characters such as `=`, `+`, `-`, or `@` to reduce spreadsheet formula injection risk.
* Keep React rendering data as text, not HTML.

### Acceptance Criteria

Malformed JSON does not crash the app.

Oversized imports are rejected.

Unexpected JSON shapes are rejected.

CSV export mitigates spreadsheet formula injection.

User-facing errors are clear and non-technical.

---

# 9. Feature Area 5

## Privacy, Data Handling, and Customer Trust

### Problem Statement

The app stores customer profile fields, opportunity IDs, account team notes, and assessment data in browser local storage. This is privacy-positive because data is not sent to an application database, but it must be made explicit.

### Requirements

Add a visible privacy and persistence note in the Customer Engagement Workspace:

* Customer workspace data is stored in this browser only.
* Data persists after refresh.
* Data is not uploaded to an app database.
* Exported JSON is the portable record.
* Users can clear portfolio data or clear the entire workspace.

Add a shorter note near JSON import/export:

* JSON files may contain customer-identifying data and should be handled accordingly.

Update documentation:

* Deployment guide.
* Methodology page.
* PRD status docs if needed.

### Acceptance Criteria

Users can understand where customer data is stored before entering customer details.

Clear portfolio and clear workspace actions remain available.

Exported JSON privacy implications are visible.

---

# 10. Feature Area 6

## Authentication and Access Control Options

### Problem Statement

If published publicly, anyone can access the app and anonymous pricing API. That may be acceptable for a public calculator, but not for private customer previews or internal-only Microsoft usage.

### Requirements

Define supported deployment modes:

* Public calculator mode: anonymous access, hardened API, no server-side customer data.
* Private preview mode: Azure Static Web Apps authentication required.
* Internal mode: restrict access to approved identities or organization accounts.

For private/internal modes:

* Configure route authorization in `staticwebapp.config.json`.
* Document identity provider setup.
* Ensure API routes inherit the intended authorization posture.

### Acceptance Criteria

Deployment docs clearly describe public, private preview, and internal modes.

Public mode has no customer-data server storage.

Private/internal modes require authentication before app access.

---

# 11. Feature Area 7

## Observability and Operations

### Problem Statement

Production deployments need visibility into failures, performance, pricing API availability, and unusual traffic patterns.

### Requirements

Enable Application Insights for the Azure Static Web Apps managed API where supported.

Log:

* Pricing API failures.
* Cache fallback use.
* Validation failures.
* Upstream Azure Retail Prices API latency.
* Request counts and error rates.

Do not log:

* Customer notes.
* Full imported CSV or JSON content.
* Opportunity IDs unless explicitly approved.
* Any local-storage contents.

Create alerting guidance for:

* API error spike.
* Retail Prices API repeated failure.
* Excessive request volume.
* Deployment failure.

### Acceptance Criteria

Production operators can see API health and failures.

Logs do not contain customer-entered estimate or workspace data.

Basic alerts are documented.

---

# 12. Feature Area 8

## CI/CD Security Gates

### Problem Statement

The current GitHub Actions workflow builds and deploys, but it does not enforce security or quality checks before deployment.

### Requirements

Update CI to run:

* `npm ci`
* `npm run test`
* `npm run typecheck`
* `npm run lint`
* `npm run build`
* `npm audit --omit=dev`

Add GitHub-native security:

* Dependabot for npm and GitHub Actions.
* CodeQL scanning for JavaScript/TypeScript.
* Secret scanning if available for the repository.
* Branch protection requiring CI success before merge.

### Acceptance Criteria

Pull requests cannot merge if tests, typecheck, lint, build, or production audit fail.

Deployment uses a known-good build.

Dependency update PRs are opened automatically.

---

# 13. Feature Area 9

## Error Handling and Resilience

### Problem Statement

Public users should not encounter raw runtime failures or ambiguous broken states when pricing, imports, or exports fail.

### Requirements

Add a React error boundary around the app shell.

Add safe import error handling for CSV and JSON flows.

Show retry guidance for pricing lookup failures.

Differentiate:

* User input validation errors.
* Pricing API unavailable.
* Cached pricing fallback.
* Export generation failure.

Ensure the app never loses existing entered data because a pricing lookup failed.

### Acceptance Criteria

Malformed imports show safe errors.

Pricing API failures preserve usage rows and current results.

Cached fallback warnings remain visible.

Unexpected UI errors show a friendly recovery message.

---

# 14. Feature Area 10

## Production Documentation

### Requirements

Create or update:

* Production deployment checklist.
* Security model.
* Data handling and privacy note.
* Incident response and rollback guide.
* Dependency update process.
* Known limitations.

The documentation should clearly state:

* The app uses public Azure list pricing only.
* It is an estimate, not a billing oracle.
* It does not retrieve customer private pricing.
* Customer workspace data is browser-local.
* JSON exports may contain customer-identifying information.

### Acceptance Criteria

A new maintainer can deploy, monitor, roll back, and explain the app's data handling posture using repo documentation.

---

# 15. Threat Model Summary

## Primary Assets

* Customer-entered workspace data in browser local storage.
* Imported CSV and JSON files in browser memory.
* Generated estimate and portfolio exports.
* Static Web Apps deployment token in GitHub Secrets.
* Availability of the anonymous pricing API.

## Primary Trust Boundaries

* Browser to Static Web App.
* Browser to managed Azure Functions API.
* Managed API to Azure Retail Prices API.
* Local file import into browser state.
* Browser local storage persistence.
* GitHub Actions to Azure deployment.

## Key Threats

* Dependency vulnerability exploitation.
* Cross-site scripting or script injection.
* Clickjacking.
* Spreadsheet formula injection through CSV export.
* Malformed JSON import causing crashes or state pollution.
* Anonymous API abuse.
* Accidental customer data persistence on shared machines.
* Leaking sensitive deployment tokens through CI misconfiguration.

## Mitigations

* Dependency audit and updates.
* Security headers and CSP.
* React text rendering only.
* Import schema validation and size limits.
* CSV formula escaping.
* API input validation and throttling.
* Privacy disclosure and clear workspace controls.
* GitHub secret storage and branch protection.

---

# 16. Implementation Phases

## Phase 1: Public Release Blockers

* Upgrade jsPDF and verify PDF exports.
* Add security headers.
* Add API query validation.
* Add import size/schema validation.
* Add CSV formula injection mitigation.
* Add local-storage privacy disclosure.
* Add CI quality and audit gates.

## Phase 2: Operational Readiness

* Add Application Insights guidance/configuration.
* Add alerting recommendations.
* Add error boundary and improved failure states.
* Add production deployment checklist.
* Add incident response and rollback guide.

## Phase 3: Advanced Hardening

* Add optional authentication deployment mode.
* Add CodeQL.
* Add deployed smoke tests.
* Add formal threat model review.
* Add accessibility and privacy review.

---

# 17. Acceptance Criteria

The application is production-ready for broad public release when:

* P0 launch blockers are complete.
* No high or critical production dependency vulnerabilities remain.
* Security headers are deployed and verified.
* Anonymous API inputs are validated and abuse controls exist.
* CSV and JSON imports are bounded and schema-validated.
* Customer-local data persistence is clearly disclosed.
* CI blocks insecure or broken builds.
* Production monitoring and rollback guidance exist.

Until then, the recommended release posture is limited preview or internal demo.
