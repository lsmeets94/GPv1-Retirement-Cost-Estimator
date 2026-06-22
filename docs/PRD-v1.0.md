# GPv1 to GPv2 Cost Estimator

## Product Requirements Document (PRD)

### Version

1.0

### Author

George Trossell

### Status

Current Implementation Baseline

### Last Updated

June 12, 2026

### Source of Truth

The implemented application is the source of truth for this PRD. Requirements below describe the current Version 1.0 product unless explicitly marked as partially implemented, not implemented, or future.

---

# 1. Executive Summary

Azure General Purpose v1 (GPv1) storage accounts are being retired and customers must migrate to General Purpose v2 (GPv2).

Many customers do not understand the financial impact of this migration. While GPv2 generally offers lower storage pricing and additional functionality, customers frequently ask:

* What will my monthly bill look like after migration?
* Which charges will change?
* Which charges remain unchanged?
* How does my negotiated Azure discount affect the outcome?
* How can I justify the migration financially?

The GPv1 to GPv2 Cost Estimator provides a simple web-based experience that enables customers, account teams, and Microsoft specialists to estimate the monthly and annual financial impact of migrating from GPv1 to GPv2 using public Azure list pricing.

The current application is a deployed Version 1.0 estimator focused on Azure Blob Storage usage for account kind `Storage` to account kind `StorageV2` conversions. It uses the unauthenticated Azure Retail Prices API through a lightweight Azure Functions backend, exposes matched meters and confidence labels, supports manual entry and structured CSV usage input, and exports customer-ready CSV and PDF summaries.

The application is an estimator, not a billing oracle. It does not ingest Azure Cost Management data, customer contracts, taxes, reservations, credits, or private prices.

---

# 1A. Product Status

## Current Release

Version 1.0 is implemented and deployed through Azure Static Web Apps with a managed Azure Functions API.

## Deployment Model

Implemented:

* React + TypeScript + Vite frontend in `apps/web`.
* Azure Functions-compatible Node.js/TypeScript API in `apps/api`.
* Shared TypeScript domain logic in `packages/core`.
* Azure Static Web Apps GitHub Actions deployment.
* Anonymous `/api/*` access through `staticwebapp.config.json`.
* No application secrets required.

Supported alternative:

* Azure App Service plus a separate Azure Functions app is documented as an alternative deployment pattern, but the repository is optimized for Azure Static Web Apps.

## Supported Scenarios

Implemented:

* Manual estimation for Blob Storage GPv1 to GPv2 conversion.
* Structured CSV upload of billing-like usage rows.
* Public Azure list price lookup by region and currency.
* Region-aware redundancy and target tier dropdown filtering based on public StorageV2 Blob capacity meters.
* GPv1 modeling from `General Block Blob` public meters.
* GPv2 modeling from `General Block Blob v2`, `Blob Storage`, and supported `Blob Features` meters.
* List-price and user-discount-adjusted comparisons.
* Customer-ready result table, chart, CSV export, and PDF summary.

Known limitations:

* Blob Storage only. Azure Files, Disks, Tables, Queues, Data Lake/HNS, premium, page blob, backup, and non-standard storage products are excluded or not modeled.
* No Azure sign-in or tenant/subscription discovery.
* No Cost Management, EA, MCA, CSP, invoice, or PDF ingestion.
* No persistent database.
* No taxes, reservations, credits, support plans, marketplace charges, or negotiated private pricing.
* Manual mode covers common conversion-relevant Blob meters; it does not expose every possible Blob feature meter.
* CSV parsing is structured and column-based; it does not normalize arbitrary billing exports.
* Pricing availability depends on the public Azure Retail Prices API being reachable.

Technical dependencies:

* Node.js 20 or later for build/runtime.
* Azure Retail Prices API.
* Azure Static Web Apps and Azure Functions for the deployed architecture.
* React, Fluent UI, Recharts, Papa Parse, jsPDF, TypeScript, Vite, and esbuild.

---

# 2. Goals

## Primary Goal

Provide a reliable estimate of monthly and annual cost differences between GPv1 and GPv2.

## Secondary Goals

* Reduce customer uncertainty.
* Accelerate migration discussions.
* Create a repeatable tool for Azure specialists.
* Eliminate spreadsheet-based calculations.
* Provide customer-ready exportable reports.

---

# 3. Non-Goals

The following capabilities are explicitly out of scope:

### Billing Integration

* Azure Cost Management API
* EA Billing API
* MCA Billing API
* CSP Billing API

### Contract Pricing

* Custom enterprise agreements
* Private pricing
* Microsoft internal pricing

### Tax Modeling

* VAT
* Sales tax
* Local taxes

### Marketplace

* Marketplace services
* Third-party charges

### FinOps Features

* Forecasting
* Budget planning
* Trend analysis

### Invoice and PDF Parsing

* PDF invoice parsing
* Unstructured invoice ingestion
* Automatic billing export discovery

### Non-Blob Storage Modeling

* Azure Files modeling
* Azure Managed Disks or unmanaged disk modeling
* Azure Tables or Queues modeling
* Data Lake Storage Gen2/HNS modeling
* Premium/page blob conversion modeling

---

# 4. Target Users

## Primary Users

### Azure Customers

Need to estimate migration costs.

### Microsoft Specialists

Need a repeatable customer-facing tool.

### Cloud Solution Architects

Need migration justification data.

### Account Teams

Need executive-level migration summaries.

---

# 5. User Stories

## Story 1

As a customer

I want to enter my storage usage

So that I can estimate my GPv2 costs.

---

## Story 2

As a storage specialist

I want to upload usage information

So that I do not manually enter every value.

---

## Story 3

As an account executive

I want a PDF report

So that I can share results with a customer.

---

## Story 4

As a customer

I want to apply my negotiated discount

So that the estimate better reflects reality.

---

# 6. Functional Requirements

---

## FR-1 Manual Calculator Mode

Status: Implemented.

Users can manually enter Blob Storage usage for a GPv1 `Storage` account and estimate a target GPv2 `StorageV2` account.

### Required Fields

Region:

Implemented as an Azure ARM region dropdown populated from `packages/core/src/regions.ts`.

Currency:

Implemented as a text input. Default is `USD`.

Redundancy:

* LRS
* ZRS
* GRS
* RA-GRS
* GZRS
* RA-GZRS

The redundancy dropdown is filtered by selected region/currency using public StorageV2 Blob Data Stored meters. If availability cannot be determined, all redundancy options are shown with a visible warning.

Target GPv2 Access Tier:

* Hot
* Cool
* Cold
* Archive

The target tier dropdown is filtered by selected region and redundancy using public StorageV2 Blob Data Stored meters. GPv1 has no access tier concept; the selected tier applies only to the GPv2 estimate.

Storage Capacity:

* Monthly capacity GB.

Monthly Transactions

* Read Operations
* Write Operations
* List/Create Container Operations
* All Other Operations
* Delete Operations

Data Retrieval

* GB/month

Data Writes

* GB/month

Early Deletion:

Implemented for Cool, Cold, and Archive only. Users enter StorageV2 deleted GB and the average number of days retained before deletion. Hot tier does not show early deletion fields.

Geo-replication Transfer:

Implemented automatically for GRS, RA-GRS, GZRS, and RA-GZRS. The estimator derives replicated data from monthly Data Write GB and creates a StorageV2-only replication transfer row.

Planned but not implemented in manual mode:

* Manual entry for every optional Blob feature meter.
* Manual SFTP, index tag, blob inventory, named encryption scope, point-in-time restore, smart tier, or object replication inputs. These were intentionally removed from Version 1.0 manual mode because they are not core GPv1 to GPv2 conversion inputs for most customers.

---

## FR-2 Discount Modeling

Status: Implemented.

Users must be able to apply:

### Global Discount

Single percentage applied to both GPv1 and GPv2.

### Independent Discounts

GPv1 Discount %

GPv2 Discount %

Implemented behavior:

* Discounts are user-entered percentages.
* Percentages are sanitized in the UI.
* Discounted unit price is calculated as `listUnitPrice * (1 - discountPercent / 100)`.
* The results show both list and discounted prices/costs so the user can see whether the discount is affecting the output.

---

## FR-3 Pricing Retrieval

Status: Implemented.

Pricing must come from Azure public pricing sources.

### Primary Source

Azure Retail Pricing API

### Requirements

Retrieve pricing dynamically. Implemented.

Cache pricing. Implemented with in-memory API cache.

Store refresh timestamps. Implemented in API responses and displayed in the UI.

Allow manual refresh. Implemented from the Pricing Match Review screen.

Implemented API endpoint:

`GET /api/prices/search`

Query behavior:

* Uses `api-version=2023-01-01-preview`.
* Filters `serviceFamily eq 'Storage'`.
* Filters `priceType eq 'Consumption'`.
* Filters by `armRegionName`.
* Filters by `currencyCode`.
* Applies optional product, SKU, and meter hints.
* Follows `NextPageLink` pagination.
* Returns candidates rather than silently choosing when multiple meters are plausible.

---

## FR-4 Pricing Transparency

Status: Implemented with known limitations.

Every calculated value must display:

* Meter Name
* Product Name
* SKU Name
* Region
* Unit Price
* Pricing refresh timestamp

Current UI behavior:

* The pricing review and result table show matched meter names, list unit prices, discounted unit prices, list costs, discounted costs, confidence, and notes.
* CSV export includes list and discounted fields.
* The API returns the full candidate meter objects, including meter ID, product name, SKU name, region, unit of measure, and price.

Known limitation:

* The visible table does not currently show every meter metadata field in separate columns. Some metadata remains available in the underlying API response and export/domain model but is not fully surfaced in the customer-facing table.

No hidden assumptions.

---

## FR-5 GPv1 Mapping Engine

Status: Implemented.

The application must contain a mapping engine that converts GPv1 billing concepts into GPv2 pricing concepts.

### Matching Criteria

Region

Redundancy

Tier

Unit Type

Meter Category

Implemented behavior:

* GPv1 is matched against `General Block Blob` public meters.
* GPv2 is matched against `General Block Blob v2`, `Blob Storage`, or supported `Blob Features` meters.
* GPv1 account kind is modeled as `Storage`.
* GPv2 account kind is modeled as `StorageV2`.
* GPv1 has no tier concept; GPv1 matching is modeled from General Block Blob meters and notes this assumption.
* Tier-specific StorageV2 usage does not borrow meters from another tier. For example, Hot usage does not match Cool or Cold retrieval/write meters.
* Hot data retrieval, data write, or early-delete rows with no Hot public meter are modeled as zero rather than borrowing a Cool/Cold/Archive meter.
* StorageV2-only meters can be included with GPv1 cost set to zero when a GPv2 meter exists and no GPv1 meter is expected.

---

## FR-6 Confidence Scoring

Status: Implemented.

Every mapping must receive a confidence score.

### Exact Match

Implemented as a high-scoring single-candidate match.

### Strong Match

Implemented as a high-confidence match included in totals by default.

### Needs Review

Implemented as a plausible match excluded from totals by default unless the user includes it.

### Unmatched

Implemented when no reliable candidate is available. Excluded from totals by default unless the user includes it.

Current implementation uses score thresholds rather than displaying numeric percentages:

* Exact match: score >= 95 and one distinct close candidate.
* Strong match: score >= 75.
* Needs review: score >= 45.
* Unmatched: score below 45 or no candidates.

---

## FR-7 Results Dashboard

Status: Implemented.

Display:

### Current Monthly Cost

GPv1

### Estimated Monthly Cost

GPv2

### Monthly Delta

Dollar amount

### Annual Delta

Dollar amount

### Percent Difference

Increase or decrease

Implemented dashboard components:

* Current GPv1 monthly cost, showing discounted total with list total below.
* Estimated GPv2 monthly cost, showing discounted total with list total below.
* Monthly discounted delta and percent delta, with list delta shown beneath.
* Discount impact card showing GPv2 and GPv1 discount impact.
* Annualized discounted delta.
* Monthly cost-driver chart using included rows only.
* Customer-ready breakdown table with list and discounted unit prices/costs.

---

# 7. CSV Upload Mode

---

## Purpose

Reduce manual entry.

---

## Supported Format

Status: Implemented.

CSV only for Version 1. CSV parsing uses Papa Parse in `packages/core`.

No PDF parsing.

No invoice parsing.

---

## Required Columns

The current implementation requires these exact headers:

* Billing period
* Service name
* Product
* Meter category
* Meter subcategory
* Meter name
* SKU name
* Region
* Quantity
* Unit
* Unit price
* Cost
* Currency
* Tags or storage account name

Rows should use Azure ARM region names such as `eastus`, `westus2`, or `westeurope`.

---

## Import Flow

Implemented flow:

Select CSV Upload

↓

Upload a `.csv` file or edit/paste CSV text in the text area

↓

Validate required columns and parse rows

↓

Normalize rows into shared `UsageLineItem` records

↓

Detect Blob Storage rows

↓

Show Usage Review with include/exclude controls

↓

Run public price matching

↓

Review pricing matches and confidence

↓

View results and export

Implemented validation:

* Missing required columns are shown as inline errors.
* CSV parse errors include the row number when available.
* Non-Blob rows are marked not modeled and excluded by default.

Planned but not implemented:

* Automatic recognition of arbitrary Azure Cost Management export schemas.
* Automatic invoice parsing.
* PDF parsing.
* Persistent upload history.

---

# 7A. Current User Workflow

## Manual Workflow

1. User opens the app.
2. User selects Manual mode.
3. User selects region, currency, redundancy, and target GPv2 access tier.
4. Region-aware availability lookup filters redundancy and tier options when public StorageV2 Blob meters are available.
5. User enters monthly Blob Storage usage quantities.
6. User optionally enters a global discount or separate GPv1/GPv2 discounts.
7. User clicks Review usage.
8. App normalizes manual inputs into usage rows.
9. User reviews included and excluded usage rows.
10. User clicks Match public prices.
11. App queries the API for GPv1 and GPv2 candidate meters and scores matches.
12. User reviews exact, strong, needs review, and unmatched rows.
13. User can include or exclude ambiguous/unmatched rows from totals.
14. User views results, chart, assumptions, and customer-ready breakdown.
15. User exports CSV or PDF.

## CSV Workflow

1. User selects CSV Upload mode.
2. User uploads or pastes CSV data using the documented template.
3. App validates headers and parses rows.
4. App detects Blob Storage rows and excludes non-Blob rows by default.
5. User reviews usage rows and toggles inclusion where allowed.
6. User runs price matching.
7. User reviews matched meters, confidence labels, notes, and totals.
8. User exports CSV or PDF.

## Methodology Workflow

Implemented as an in-app Methodology tab that explains assumptions, public pricing source, Blob Storage-only scope, GPv1/GPv2 account kind modeling, discount formula, and excluded billing factors.

---

# 8. Reporting

---

## PDF Export

Status: Implemented.

Executive Summary

Monthly Cost Comparison

Annual Cost Comparison

Assumptions

Pricing Sources

Calculation Date

Implemented PDF output:

* Generated client-side with jsPDF.
* Includes generated timestamp.
* Includes pricing refresh timestamp.
* Includes Azure-aligned pricing estimate disclaimer.
* Includes GPv1 monthly list and discounted total.
* Includes GPv2 monthly list and discounted total.
* Includes monthly discounted delta and percent.
* Includes annualized discounted delta.
* Includes up to 12 result rows with confidence and delta.

Known limitation:

* PDF output is summary-oriented and does not currently reproduce the full visual chart or every table column.

---

## CSV Export

Status: Implemented.

Line-by-line calculations include:

* Usage category
* Quantity
* Unit
* GPv1 meter
* GPv1 list unit price
* GPv1 discounted price
* GPv2 meter
* GPv2 list unit price
* GPv2 discounted price
* Monthly GPv1 list cost
* Monthly GPv1 discounted cost
* Monthly GPv2 list cost
* Monthly GPv2 discounted cost
* Delta
* Confidence
* Included in totals
* Notes

---

# 9. User Experience Requirements

---

## Design Language

Azure Portal inspired.

Use:

* Fluent UI
* Azure color palette
* Azure typography

Status: Implemented with custom CSS and Fluent UI controls.

---

## Layout

Implemented navigation tabs:

* Input
* Usage Review
* Pricing Match
* Results
* Methodology

Implemented first screen:

* Actual calculator input surface, not a marketing landing page.

Implemented controls:

* Segmented Manual/CSV selection.
* Region dropdown.
* Redundancy dropdown.
* Target GPv2 tier dropdown.
* Number inputs for usage and discount values.
* Include/exclude checkboxes.
* Export buttons.

Implemented results visualization:

* Summary cards.
* Monthly cost-driver chart.
* Customer-ready breakdown table.

---

## Usability Goals

First-time user completion:

Less than 5 minutes

Clicks to results:

Less than 10

Status: Partially implemented. The workflow is short, but completion time and click count have not been formally measured with user testing.

---

# 10. Technical Requirements

---

## Frontend

React

TypeScript

Fluent UI

Implemented architecture:

* `apps/web`
* Vite build
* React 19
* Fluent UI React components
* Recharts for the cost-driver chart
* jsPDF for client-side PDF generation
* Browser/session storage only for lightweight metadata such as pricing refresh timestamp

---

## Backend

Node.js

TypeScript

REST API

Implemented architecture:

* `apps/api`
* Azure Functions v4 programming model
* Anonymous HTTP function at `/api/prices/search`
* Bundled with esbuild for Azure Static Web Apps compatibility
* Server-side Retail Prices API lookup, pagination, and in-memory caching
* No secrets or authenticated Azure APIs

---

## Hosting

Azure Static Web Apps

Implemented and recommended:

* Azure Static Web Apps for frontend and managed API.
* GitHub Actions CI/CD.
* `staticwebapp.config.json` allows anonymous API access and SPA route fallback.

Alternative:

Azure App Service

* App Service plus separate Azure Functions app is documented, but not the primary deployment target.

---

## Authentication

Version 1

No authentication required

Status: Implemented.

---

## Storage

Session Storage

Optional Azure Storage for future persistence

Status: Implemented only for browser/session metadata and API memory cache. No persistent database exists in Version 1.0.

---

# 11. Calculation Methodology

---

## Pricing Source

The authoritative pricing source is the public Azure Retail Prices API:

`https://prices.azure.com/api/retail/prices?api-version=2023-01-01-preview`

The backend filters by:

* `serviceFamily eq 'Storage'`
* `priceType eq 'Consumption'`
* `armRegionName`
* `currencyCode`
* optional product, SKU, and meter hints

The backend follows `NextPageLink` pagination and returns candidate meters to the frontend for scoring.

## Account Kind Assumptions

* GPv1 is Azure Storage account kind `Storage`.
* GPv2 is Azure Storage account kind `StorageV2`.
* GPv1 has no Hot/Cool/Cold/Archive access tier concept.
* GPv1 usage is matched against `General Block Blob` public meters.
* GPv2 usage is matched against `General Block Blob v2`, `Blob Storage`, or supported `Blob Features` public meters.
* Target access tier applies only to the GPv2 estimate.

## Usage Normalization

Manual inputs are converted into shared usage rows:

* Capacity: `GB/Month`
* Operations: divided by 10,000 because Azure operation meters are priced per `10K`
* Data retrieval/write: `GB`
* Geo-replication transfer: automatically created for GRS, RA-GRS, GZRS, and RA-GZRS using Data Write GB
* Early deletion: created only for Cool, Cold, and Archive when deleted GB produces billable retained-month quantity

CSV rows are parsed into the same shared usage row model.

## Storage Cost

Storage Cost

=

Consumed Capacity

×

List Price

×

Discount Factor

---

## Transaction Cost

Transaction Cost

=

Transaction Count in pricing units

×

Transaction Unit Price

---

## Total Cost

Total Cost

=

Storage Cost

+

Transaction Cost

+

Retrieval Cost

+

Replication Cost

+

Early Deletion Cost

+

Other included modeled rows

---

## Delta

Delta

=

GPv2 Total

−

GPv1 Total

## Discount Formula

```text
discountedUnitPrice = listUnitPrice * (1 - discountPercent / 100)
discountedCost = quantity * discountedUnitPrice
monthlyDelta = GPv2 discounted monthly cost - GPv1 discounted monthly cost
annualizedDelta = monthlyDelta * 12
```

Discount percentages are bounded in calculation logic to 0-100%.

## Tiered Pricing

If multiple public price tiers share the same meter ID and unit of measure, the calculation applies tier minimum units to calculate list cost across tiers.

## Early Deletion Formula

Hot tier has no early deletion charge in Version 1.0.

Cool, Cold, and Archive use these minimum retention periods:

* Cool: 30 days
* Cold: 90 days
* Archive: 180 days

```text
earlyDeletionBillableGb = deletedGb * max(0, minimumRetentionDays - averageDaysRetained) / 30
```

## Inclusion Rules

Included in totals by default:

* Exact match
* Strong match
* StorageV2-only rows where GPv2 has a strong/exact meter and GPv1 cost is expected to be zero

Excluded from totals by default:

* Needs review
* Unmatched
* Non-modeled rows
* Non-Blob Storage rows

---

# 12. Error Handling

---

## Missing Pricing

Display:

"Pricing unavailable for selected region."

Current behavior:

* If lookup fails for a row, the row is marked unmatched with a pricing lookup failure note.
* If cached pricing exists and the Retail Prices API fails, the API can return cached candidates with a warning.
* Unmatched rows are visible and excluded from totals by default.

---

## Ambiguous Mapping

Display:

"Review required."

Exclude from totals by default.

---

## Invalid CSV

Display validation errors.

Allow correction.

Implemented:

* Missing headers are listed.
* Papa Parse row errors are listed.
* User can edit the CSV text area and re-run usage review.

---

# 13. Performance Requirements

Initial page load:

< 3 seconds

Calculation:

< 2 seconds

CSV upload:

< 10 seconds

Export generation:

< 15 seconds

Status: Partially implemented and not formally benchmarked.

Observed design choices supporting performance:

* Vite production build.
* Server-side Retail Prices API cache.
* In-memory calculation model.
* Client-side CSV and PDF generation.

Known risk:

* Pricing lookup latency depends on public Azure Retail Prices API response time and pagination volume.
* The web bundle currently emits a Vite large chunk warning due to UI, charting, and PDF dependencies.

---

# 14. Security Requirements

No customer billing data persisted without consent.

No Azure credentials stored.

No external data sharing.

HTTPS only.

Implemented:

* No Azure credentials are requested or stored.
* No application secrets are required.
* Deployed Static Web Apps traffic uses HTTPS.
* Pricing API is anonymous and only calls public pricing data.

Known limitation:

* Uploaded/pasted CSV data is processed in the browser and held in application state for the session; there is no persistent server-side storage.

---

# 15. Gap Analysis

This section identifies differences between the original PRD intent and the current implementation.

## Implemented as Planned

* Manual usage entry.
* CSV usage input.
* Public Azure Retail Prices API as pricing source.
* No Azure authentication.
* GPv1 vs GPv2 monthly and annual comparison.
* Discount modeling.
* Pricing confidence labels.
* Export to CSV and PDF.
* Azure Static Web Apps deployment.

## Implemented Differently

* The original PRD listed broad storage-account concepts. The implementation intentionally narrows Version 1.0 to Blob Storage usage only.
* Confidence labels are categorical and threshold-based; the UI does not display numeric confidence percentages.
* Region options are a fixed Azure ARM region list, while redundancy/tier options are dynamically filtered from public StorageV2 capacity meters.
* PDF export is a compact customer summary, not a full report rendering of the entire results screen.
* Manual mode removed optional feature inputs such as SFTP and object replication to keep Version 1.0 focused on normal GPv1 conversion modeling.
* Missing pricing does not block the whole estimate; affected rows are visible, marked unmatched, and excluded by default.

## Planned but Not Built

* PDF invoice parsing.
* Direct Azure Cost Management export ingestion.
* Azure authentication or subscription discovery.
* Persistent project storage.
* Multi-account portfolio reporting.
* Full meter metadata columns visible in the UI for every result row.
* Formal performance telemetry.
* Formal user testing for the five-minute completion goal.
* Full accessibility audit.
* App Service deployment automation.
* Server-side PDF generation.

## Removed or No Longer Relevant for Version 1.0

* Manual SFTP entry.
* Manual named encryption scope entry.
* Manual blob inventory entry.
* Manual point-in-time restore entry.
* Manual smart tier monitoring entry.
* Manual priority object replication entry.

These may still appear if supplied in CSV data, but they are not first-class manual inputs for the Version 1.0 conversion workflow.

---

# 16. Technical Debt

## Pricing and Matching

* Matching logic is heuristic and should eventually be backed by a curated meter taxonomy.
* Region/redundancy/tier availability is inferred from Data Stored meters and may not capture every edge case.
* The API cache is process-memory only and resets when the Functions host restarts.
* Local development requires separate web/API processes for live API behavior.
* Candidate selection is transparent but still requires better explainability for multiple plausible meters.

## UI and Reporting

* Result table is wide and can require horizontal scrolling.
* PDF export is summary-only and does not include the full chart/table layout.
* The chart shows included rows only and top cost drivers only.
* Large JavaScript chunks should be split, especially charting and PDF dependencies.
* Numeric inputs sanitize invalid values but do not yet provide richer inline validation states.

## Testing

* Core logic has unit tests.
* UI tests are not currently implemented.
* End-to-end tests against deployed Azure Static Web Apps are not currently implemented.
* Retail Prices API integration tests are not isolated with recorded fixtures.

## Operations

* No telemetry or analytics.
* No central logging dashboard documented.
* No automated smoke test after deployment.
* No persistent audit trail of pricing refreshes or exported estimates.

---

# 17. Version 1.1 Recommendations

The separate `docs/PRD-v1.1.md` file is not modified by this Version 1.0 PRD update. The recommendations below summarize future enhancement themes for planning only.

## Usability

* Add guided examples for common GPv1 usage patterns.
* Add inline validation messages for percentage, quantity, and currency fields.
* Add a reset/sample scenario button.
* Add clearer empty states for pricing review and results.
* Add a compact/mobile-friendly result table view.

## Transparency

* Add expandable meter details for every row, including meter ID, product, SKU, region, unit, tier minimum, and refresh timestamp.
* Add side-by-side “why matched” explanations showing which criteria matched and which did not.
* Add warnings when a selected region/redundancy/tier combination is inferred from limited candidate meters.
* Add public documentation links directly inside the Methodology tab.

## Reporting

* Improve PDF export to include the cost-driver chart and full line-item appendix.
* Add an executive one-page summary mode.
* Add a assumptions and exclusions appendix.
* Add branding/configurable customer name fields.

## Azure UX Enhancements

* Add a more Azure Portal-like region picker with search.
* Add ARM region display names alongside API region names in result outputs.
* Add Azure Static Web Apps environment/version display.
* Add deployment smoke test documentation.

---

# 18. Future Roadmap

## Version 2

Azure Cost Management export ingestion.

## Version 3

Azure authentication.

Automatic subscription discovery.

## Version 4

Multi-account analysis.

Portfolio reporting.

## Version 5

Direct migration recommendations.

Automated GPv1 retirement readiness assessment.

---

# 19. Acceptance Criteria

The application shall be considered complete when:

* User can manually enter GPv1 usage.
* User can upload supported CSV files.
* Pricing is sourced from Azure public pricing APIs.
* Discounts are supported.
* GPv1 and GPv2 costs are compared.
* Results can be exported to PDF.
* All calculations are fully traceable.
* No hidden assumptions exist.
* Application can be deployed to Azure Static Web Apps or Azure App Service.
* A first-time user can complete an estimate in under five minutes.

Current status:

* Manual entry: implemented.
* CSV upload: implemented for documented structured CSV template.
* Public pricing API: implemented.
* Discounts: implemented.
* GPv1/GPv2 comparison: implemented.
* PDF export: implemented as summary PDF.
* Traceability: implemented through meters, confidence, notes, list/discounted prices, and exports; still has room for richer meter metadata display.
* Azure Static Web Apps deployment: implemented.
* App Service: documented as an alternative but not automated.
* First-time user completion under five minutes: plausible but not formally validated.
