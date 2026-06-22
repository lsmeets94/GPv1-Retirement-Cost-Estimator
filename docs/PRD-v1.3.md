# GPv1 to GPv2 Cost Estimator

## Product Requirements Document (PRD)

### Version

1.3

### Status

Implemented on `master` as the current portfolio assessment release.

### Depends On

Successful completion of Version 1.2

### Theme

Portfolio Assessment and Customer Engagement

---

# 1. Executive Summary

Version 1.0 introduced GPv1 to GPv2 cost estimation.

Version 1.1 improved transparency, explainability, and reporting.

Version 1.2 introduced customer data ingestion, migration planning, scenario comparison, and recommendation capabilities.

Version 1.3 expands the platform from individual storage account assessments to portfolio-level migration analysis.

The implemented release enables Microsoft specialists, account teams, and customers to save multiple completed estimates into a browser-local portfolio, prioritize migration opportunities, identify risk areas, compare assessments, manage a customer engagement workspace, and export executive-ready portfolio summaries.

Version 1.3 transforms the solution from a single-assessment migration planning tool into a browser-local portfolio assessment workspace.

---

# 2. Goals

## Primary Goals

Support multi-account assessments. **Implemented through named portfolio assessments saved from completed estimates.**

Support customer portfolio analysis. **Implemented through a dedicated Portfolio tab, summary metrics, cost distribution, portfolio signals, and comparison table.**

Identify migration priorities. **Implemented through priority scoring for every saved assessment.**

Provide executive-level reporting. **Implemented through portfolio PDF, CSV, and JSON exports.**

Enable account teams to engage large customers efficiently. **Implemented through customer profile fields, local persistence, and reusable portfolio exports.**

---

## Secondary Goals

Reduce repetitive analysis. **Implemented through save/load, clone, rename, archive, remove, clear portfolio, and clear workspace actions.**

Standardize customer migration assessments. **Implemented through shared scoring, consistent exports, and stored assumptions.**

Improve scalability of migration engagements. **Partially implemented through browser-local portfolios. There is no shared database or Azure tenant discovery.**

Support portfolio-wide planning conversations. **Implemented through aggregate metrics, priority/risk distributions, and executive summary export.**

---

# 3. Non-Goals

The following remain out of scope:

* Azure authentication
* Subscription discovery
* Azure Resource Graph
* Cost forecasting
* Enterprise Agreement pricing retrieval
* Invoice OCR
* PDF invoice parsing
* Automated migration execution
* Shared multi-user persistence
* Server-side portfolio storage
* Automated Azure resource inventory

---

# 4. Feature Area 1

## Portfolio Import

### Problem Statement

Customers rarely have a single GPv1 account.

Most customers have multiple storage accounts.

---

## Implemented Behavior

Users can build a portfolio by:

* Creating or importing an estimate.
* Naming the estimate when adding it to the portfolio.
* Saving the current estimate into the portfolio from the Results next-step panel.
* Saving the current estimate from the Portfolio workspace.
* Importing a portfolio JSON file.
* Loading a saved estimate JSON and then adding it to the portfolio.
* Cloning existing portfolio assessments.

The application stores the portfolio in browser local storage and persists it after page refresh until the user clears it or browser storage is removed.

Supported sources:

* Current completed estimate.
* Estimate JSON.
* Portfolio JSON.
* CSV-derived estimates.
* Manual-entry estimates.

Not implemented:

* Multi-file bulk portfolio import.
* Direct Azure account discovery.
* Server-side customer portfolio storage.

---

### Portfolio View

Displayed:

* Storage accounts assessed.
* Archived assessment count.
* Total capacity.
* Portfolio GPv1 monthly cost.
* Portfolio GPv2 monthly cost.
* Monthly and annual impact.
* Cost distribution chart.
* Priority, risk, complexity, and confidence distributions.

---

## Acceptance Criteria

Users can assess multiple storage accounts in a single analysis. **Implemented through saved portfolio assessments.**

---

# 5. Feature Area 2

## Portfolio Dashboard

### Implemented Behavior

The Portfolio tab displays:

* Total active storage accounts assessed.
* Archived assessment count.
* Total active capacity.
* Total GPv1 monthly cost.
* Total GPv2 monthly cost.
* Annual impact.
* High priority count.
* High risk count.
* Average confidence.
* Medium/high complexity count.
* Priority distribution.
* Risk distribution.
* Complexity distribution.
* Confidence distribution.
* Cost distribution chart for top accounts.

### Visualizations

Implemented:

* Cost distribution.
* Priority/risk/complexity/confidence distribution chips.
* Portfolio signals.

Not implemented:

* Dedicated capacity distribution chart.
* Separate top cost-driver chart at portfolio level beyond account-level cost distribution.

---

## Acceptance Criteria

Users can understand overall portfolio impact without reviewing individual assessments. **Implemented.**

---

# 6. Feature Area 3

## Migration Prioritization

### Problem Statement

Customers need to know where to focus first.

---

## Implemented Behavior

Every assessment receives migration priority scoring.

Factors:

* Cost impact.
* Storage volume.
* Migration complexity.
* Confidence.
* Risk.

Priority categories:

* High
* Medium
* Low

The Migration Priorities and Risk table shows assessment name, storage account, status, capacity, costs, annual impact, priority score, risk score, complexity, confidence, recommendations, and row actions.

---

## Acceptance Criteria

Every assessment receives a migration priority score. **Implemented.**

---

# 7. Feature Area 4

## Executive Portfolio Reporting

### Implemented Behavior

The application generates portfolio exports.

Supported:

* Portfolio PDF.
* Portfolio CSV.
* Portfolio JSON.

Portfolio PDF includes:

* Generated timestamp.
* Customer name.
* Opportunity ID.
* Assessment owner.
* Azure-aligned pricing estimate disclaimer.
* Active accounts assessed.
* Total capacity.
* GPv1 monthly cost.
* GPv2 monthly cost.
* Annual impact.
* High priority and high risk counts.
* Top migration priorities.
* Assumptions.

Portfolio CSV includes assessment-level summary rows.

Portfolio JSON is the portable record for customer workspace and assessment data.

Not implemented:

* Fully branded multi-page executive report template.
* Editable narrative report sections.
* PowerPoint export.

---

## Acceptance Criteria

Reports can be shared directly with customer leadership. **Implemented as lightweight PDF/CSV/JSON exports.**

---

# 8. Feature Area 5

## Estimate Comparison

### Implemented Behavior

Users can select portfolio assessments and compare them side-by-side.

Compared metrics:

* Assessment name.
* Capacity.
* GPv1 monthly cost.
* GPv2 monthly cost.
* Monthly delta.
* Annual impact.
* Redundancy.
* Tier.
* Complexity.
* Risk.
* Priority.
* Recommendations.

The table appears when one or more assessments are selected. The empty state prompts users to select two or more assessments for a more useful comparison.

---

## Acceptance Criteria

Users can compare migration scenarios side-by-side. **Implemented.**

---

# 9. Feature Area 6

## Customer Engagement Workspace

### Implemented Behavior

The Portfolio tab includes customer profile support.

Fields:

* Customer name.
* Industry.
* Opportunity ID.
* Account team notes.
* Engagement status.
* Assessment owner.

Workspace controls:

* Export CSV.
* Export PDF.
* Export JSON.
* Import JSON.
* Clear portfolio.
* Clear workspace.

The customer workspace is saved in browser local storage. The Clear workspace action clears customer details and saved portfolio assessments after confirmation. Clear portfolio removes saved assessments while leaving customer profile fields intact.

---

## Acceptance Criteria

Users can organize assessments by customer. **Implemented.**

---

# 10. Feature Area 7

## Risk Assessment Engine

### Implemented Behavior

Every saved assessment receives a risk profile.

Risk indicators consider:

* Large capacity footprint.
* High retrieval activity.
* Heavy replication dependence.
* Low confidence estimates.
* Large cost variance.
* Unmatched or review-needed rows.
* Unsupported/unmodeled rows.

Risk levels:

* Low
* Medium
* High

The Portfolio Signals panel summarizes high-risk count and risk distribution.

---

## Acceptance Criteria

Every assessment contains a risk profile. **Implemented.**

---

# 11. Feature Area 8

## Recommendations Engine v2

### Implemented Behavior

Recommendations are portfolio-aware through the saved assessment summaries and prioritization output.

Recommendations consider:

* Portfolio impact.
* Migration priority.
* Cost impact.
* Risk.
* Complexity.
* Confidence.
* Replication dependence.
* Cool-tier opportunity.

Example recommendations:

* Prioritize high annual-impact assessments.
* Review low-confidence or unmatched rows before customer-facing use.
* Validate replication requirements on geo-redundant workloads.
* Compare Cool conversion economics for low-access data.

---

## Acceptance Criteria

Recommendations become portfolio-aware. **Implemented through portfolio scoring and assessment-level recommendations.**

---

# 12. Feature Area 9

## Assessment Repository

### Implemented Behavior

The application includes a browser-local assessment repository.

Supported actions:

* Add current estimate to portfolio.
* Name estimate before adding.
* Load.
* Clone.
* Rename.
* Archive.
* Restore archived assessment.
* Remove individual assessment.
* Clear portfolio.
* Clear workspace.
* Export portfolio JSON.
* Import portfolio JSON.
* Export portfolio CSV.
* Export portfolio PDF.

UX refinements implemented after initial v1.3:

* A top Results-page next-step panel prompts users to add the current estimate to the portfolio.
* If the current estimate is already saved, the action changes to View in portfolio.
* An empty portfolio state prompts users to add the current estimate or create a new estimate.
* The portfolio row action set includes Rename so saved estimates are distinguishable after the fact.

### Supported Formats

* JSON for portable save/load.
* CSV for tabular export.
* PDF for customer-facing summary export.

### Persistence

* Portfolio and customer workspace data persist in browser local storage.
* No backend database is used.
* Exported JSON is the portable record for sharing or moving between machines.

---

## Acceptance Criteria

Users can manage assessment history. **Implemented.**

---

# 13. Product Status and Known Limitations

Current release status:

* v1.3 is implemented and merged to `master`.
* The app is deployable through Azure Static Web Apps with managed Azure Functions.
* Pricing lookup uses the unauthenticated Azure Retail Prices API through the server-side API.
* Pricing lookup is cached in memory/session and deduplicated per calculation run for better performance.
* Portfolio storage is browser-local.

Supported scenarios:

* Blob Storage GPv1 account-kind `Storage` to GPv2 account-kind `StorageV2` cost assessment.
* Manual and CSV-based input.
* Hot/Cool account conversion target tier modeling where available in the selected region/redundancy.
* Cold/Archive as optimization concepts only, not direct account-conversion targets.
* Customer-ready result and portfolio exports.

Known limitations:

* No Azure sign-in or subscription discovery.
* No server-side portfolio persistence.
* No multi-user collaboration.
* No direct Azure Cost Management export job integration.
* No object count or average blob size input yet, so scenario comparison does not model 128 KiB minimum billable object size effects or one-time tiering operation charges.
* Portfolio success metrics are not instrumented.

---

# 14. Success Metrics

90% reduction in repeated manual assessments. **Supported by portfolio reuse, not instrumented.**

95% of portfolio reports generated without manual editing. **Not measured.**

100% of storage accounts assigned migration priority. **Implemented for saved assessments.**

100% of assessments assigned risk level. **Implemented for saved assessments.**

90% of account teams find portfolio reporting useful. **Not measured.**

---

# 15. Acceptance Criteria

Version 1.3 is complete when:

* Portfolio import implemented. **Complete through current estimate, estimate JSON, and portfolio JSON.**
* Portfolio Dashboard implemented. **Complete.**
* Migration Prioritization implemented. **Complete.**
* Executive Portfolio Reporting implemented. **Complete as lightweight PDF/CSV/JSON exports.**
* Estimate Comparison implemented. **Complete.**
* Customer Engagement Workspace implemented. **Complete.**
* Risk Assessment Engine implemented. **Complete.**
* Recommendations Engine v2 implemented. **Complete.**
* Assessment Repository implemented. **Complete, including save, load, clone, rename, archive, remove, clear, export, and import.**

The platform evolved from a migration planning tool into a portfolio assessment workspace capable of supporting GPv1 retirement planning conversations across multiple saved storage account assessments.
