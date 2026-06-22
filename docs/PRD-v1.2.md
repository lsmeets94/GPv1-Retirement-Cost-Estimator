# GPv1 to GPv2 Cost Estimator

## Product Requirements Document (PRD)

### Version

1.2

### Status

Implemented on `master` as part of the current GPv1 to GPv2 Billing Impact Estimator release.

### Depends On

Successful completion of Version 1.1

### Theme

Customer Data Ingestion and Migration Planning

---

# 1. Executive Summary

Version 1.0 established a functional GPv1 to GPv2 cost estimator.

Version 1.1 improved trust, transparency, explainability, and customer-facing reporting.

Version 1.2 reduced customer effort by adding structured CSV ingestion, classification, migration readiness, workload templates, scenario comparison, save/load, and customer-ready exports.

The implemented application is a migration assessment tool for Blob Storage GPv1 account-kind `Storage` to GPv2 account-kind `StorageV2` estimation. It does not authenticate to Azure, discover subscriptions, or retrieve private customer billing data.

---

# 2. Goals

## Primary Goals

Reduce manual input requirements. **Implemented through manual entry defaults, workload templates, and CSV upload.**

Support real customer usage exports. **Partially implemented through CSV parsing with aliases for common Azure Cost Management export headers.**

Improve estimate accuracy. **Implemented through server-side Azure Retail Prices API matching, confidence labels, region/currency filters, redundancy/tier availability filtering, and explicit assumptions.**

Accelerate migration conversations. **Implemented through automatic pricing after usage creation, migration readiness, charts, reports, and scenario comparison.**

Provide migration planning guidance. **Implemented through readiness scoring, recommendations, assumptions, and scenario comparison.**

---

## Secondary Goals

Reduce onboarding time. **Implemented through pre-defined workload templates and sample CSV download.**

Improve customer confidence. **Implemented through visible pricing source, pricing refresh timestamp, matched meters, list/discounted prices, and unmatched row visibility.**

Support larger environments. **Partially implemented. CSV import can process many rows, but there is no multi-file import or background job processing.**

Prepare for future portfolio analysis. **Implemented and extended in Version 1.3.**

---

# 3. Non-Goals

The following remain out of scope:

* Azure authentication
* Subscription discovery
* Direct Azure API access beyond unauthenticated Azure Retail Prices API pricing lookup
* Invoice OCR
* PDF invoice parsing
* Multi-tenant analysis
* Cost forecasting
* Reserved instance modeling
* Private pricing retrieval
* Taxes, credits, support plans, marketplace charges, or negotiated pricing retrieval

---

# 4. Feature Area 1

## Azure Cost Management Export Support

### Problem Statement

Manual entry does not scale.

Customers already have usage exports available.

---

## Implemented Behavior

The application supports:

* Manual entry.
* Structured CSV upload.
* A downloadable sample CSV.
* Header aliases for app template columns and common Azure Cost Management export headers, including `ProductName`, `MeterName`, `ResourceLocation`, `UnitOfMeasure`, `EffectivePrice`, and `CostInBillingCurrency`.
* Inline validation for missing required columns and CSV parse errors.
* Usage row preview with include/exclude controls.
* Automatic price matching after usage rows are created.

Supported format:

* CSV only.

Not implemented:

* Direct connection to Azure Cost Management.
* Multi-file import.
* Native Azure portal export job configuration.
* PDF invoice parsing.

---

### Import Workflow

Step 1: Choose Manual entry or CSV upload.

Step 2: Upload or paste CSV content.

Step 3: Validate schema and parse rows.

Step 4: Preview imported rows.

Step 5: Identify Blob Storage workloads and unsupported rows.

Step 6: Automatically match public pricing and generate results.

---

## Acceptance Criteria

A customer can generate an estimate from a supported CSV export without manually entering usage values. **Implemented for CSV files with supported headers.**

---

# 5. Feature Area 2

## Intelligent Usage Classification

### Problem Statement

Customer exports contain many storage-related rows.

Not all rows are relevant.

---

## Implemented Behavior

The application automatically classifies usage rows into modeled and excluded rows.

Modeled Blob Storage categories include:

* Capacity
* Read operations
* Write operations
* List/create container operations
* Retrieval
* Data write
* Geo-replication data transfer
* Early deletion for non-Hot target tiers
* Selected StorageV2-only Blob Features meters when represented in the CSV

Excluded or unmodeled categories include:

* Azure Files
* Managed Disks
* Tables
* Queues
* Backup services
* Third-party marketplace
* Premium/file/queue/table/page blob products that are outside the standard block blob model
* SFTP and other capabilities that are not relevant to GPv1-to-GPv2 conversion cost estimation

Classification output displays whether a row is included, excluded, requires review, or unmatched. Needs review and unmatched pricing rows are excluded from totals unless the user explicitly includes them.

---

## Acceptance Criteria

The application automatically identifies migration-relevant usage categories. **Implemented for Blob Storage-focused rows using keyword-based classification and pricing-match confidence.**

---

# 6. Feature Area 3

## Migration Readiness Assessment

### Problem Statement

Customers need more than pricing.

They need migration guidance.

---

## Implemented Behavior

The Results page includes a Migration Readiness section.

Displayed outputs:

* Migration complexity: Low, Medium, or High.
* Readiness score out of 100.
* Notes.
* Recommended actions.
* Recommendations.

Signals considered:

* Storage volume.
* Redundancy.
* Target tier.
* Transaction volume.
* Retrieval/write signals.
* Unsupported rows.
* Input completeness.
* Confidence and unmatched/review rows.

---

## Acceptance Criteria

Every estimate includes a migration readiness summary. **Implemented.**

---

# 7. Feature Area 4

## Migration Recommendations

### Problem Statement

The tool explains cost impact and should also guide migration planning.

---

## Implemented Behavior

The application generates recommendations from modeled usage patterns and migration readiness signals.

Implemented recommendation examples include:

* Compare Cool conversion economics for low-access data.
* Validate replication requirements for geo-redundant workloads.
* Review unsupported or unmodeled rows before customer-facing use.
* Review low-confidence or unmatched rows before using totals.
* Treat large capacity and high transaction workloads as higher-complexity migrations.

---

## Acceptance Criteria

Every estimate contains usage-based recommendations. **Implemented.**

---

# 8. Feature Area 5

## Multi-Scenario Comparison

### Problem Statement

Customers often ask:

"What if I use Cool?"

"What if I change redundancy?"

---

## Implemented Behavior

Scenario Comparison is available on the Results page for manual-entry estimates.

Implemented scenarios:

* Current recommendation.
* Alternate Hot/Cool tier.
* One alternate redundancy option when another redundancy is available in the selected region.

Compared metrics:

* Monthly GPv2 cost.
* Annual GPv2 cost.
* Monthly delta.
* Replication impact.
* Early deletion impact.

Current limitations:

* Scenario comparison is manual-entry only.
* Cold and Archive are not direct conversion target tiers. They are treated as optimization concepts, not account-conversion targets.
* One-time tier-change costs are not yet modeled.
* Average blob size is not inferred because current inputs do not capture blob count. Object count or average blob size should be added before modeling minimum billable object size and tiering operation charges.

---

## Acceptance Criteria

Users can compare at least three scenarios simultaneously when enough regional redundancy options are available. **Partially implemented; some configurations compare two scenarios if only one alternate scenario is available.**

---

# 9. Feature Area 6

## Workload Templates

### Implemented Behavior

The application includes reusable workload templates presented as selectable cards and in a dropdown:

* Backup repository
* Media archive
* Analytics platform
* Enterprise file repository
* Data lake

Template behavior:

* Pre-populates calculator values.
* Applies simple or advanced estimate mode.
* Allows modification after selection.
* Supports export through the standard CSV/PDF/JSON result actions.

---

# 10. Feature Area 7

## Migration Assessment Report

### Problem Statement

Customers need more than a cost report.

They need a migration discussion artifact.

---

## Implemented Behavior

The application generates a client-side PDF estimate report.

Included:

* Generated timestamp.
* Pricing refresh timestamp.
* Azure-aligned pricing estimate disclaimer.
* Currency.
* GPv1 and GPv2 list/discounted costs.
* Monthly and annualized delta.
* Migration readiness score.
* Recommendations.
* Assumptions.
* Meter appendix excerpt.

Not implemented:

* A fully designed multi-page executive report.
* Editable report narrative.
* Server-side report rendering.

---

## Acceptance Criteria

A generated report can be used in a customer migration discussion. **Implemented as a lightweight client-side PDF summary.**

---

# 11. Feature Area 8

## Historical Estimate Management

### Implemented Behavior

The application supports local estimate management.

Supported:

* Save current estimate as JSON.
* Load estimate JSON.
* Export customer-ready CSV.
* Export customer-ready PDF.
* Browser session metadata for pricing refresh timestamp.

Extended in Version 1.3:

* Named portfolio assessments.
* Portfolio JSON import/export.
* Portfolio CSV/PDF export.
* Portfolio repository persisted in browser local storage.

---

### Supported Format

JSON for save/load portability.

CSV and PDF for reporting/export.

---

### Use Cases

Customer follow-up.

Scenario reviews.

Pre-sales engagements.

---

# 12. Product Status and Known Limitations

Current release status:

* Implemented in a React + TypeScript frontend, shared TypeScript core package, and Node/TypeScript Azure Functions-compatible pricing API.
* Designed for Azure Static Web Apps with managed API functions.
* Uses public Azure Retail Prices API pricing only.
* No database. Estimate and portfolio persistence are browser-local unless exported as JSON.

Known limitations:

* CSV import is schema-based and does not connect to Azure Cost Management directly.
* Scenario comparison does not yet model one-time tiering operation charges or 128 KiB minimum billable object size effects.
* Average blob size cannot be derived from current inputs because blob count is not captured.
* Large Vite bundle warning remains a technical debt item.

---

# 13. Success Metrics

80% reduction in manual data entry. **Supported through templates and CSV import, not instrumented.**

90% of customer exports processed successfully. **Not measured. CSV alias support improves compatibility.**

95% of estimates generated without requiring manual reclassification. **Not measured.**

90% of users identify the migration readiness score as useful. **Not measured.**

---

# 14. Acceptance Criteria

Version 1.2 is complete when:

* Azure Cost Management-style CSV support implemented. **Complete, CSV only.**
* Intelligent classification implemented. **Complete for Blob Storage-focused scope.**
* Migration readiness assessment implemented. **Complete.**
* Recommendation engine implemented. **Complete.**
* Multi-scenario comparison implemented. **Partially complete, manual-entry scenario comparison only.**
* Expanded workload templates implemented. **Complete.**
* Migration assessment reporting implemented. **Complete as lightweight PDF export.**
* Estimate save/load functionality implemented. **Complete for JSON.**

The application evolved from a migration justification tool into a migration assessment platform capable of analyzing structured customer usage and producing actionable GPv1-to-GPv2 migration guidance.
