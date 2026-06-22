# Calculation Methodology

## Scope

V1 models Azure Blob Storage usage affected by converting Azure Storage account kind `Storage` to account kind `StorageV2`. Non-Blob services are displayed as not modeled and excluded from totals by default.

Out of scope:

- Azure Files, Azure Disks, Azure Tables, Azure Queues.
- Taxes, credits, reservations, support plans, marketplace charges.
- EA/MCA billing account APIs and private negotiated pricing.

## Pricing

The app queries the public Azure Retail Prices API with:

- `api-version=2023-01-01-preview`
- `serviceFamily eq 'Storage'`
- `priceType eq 'Consumption'`
- `armRegionName`
- `currencyCode`
- optional product, SKU, and meter hints

All result rows preserve the public meter metadata used for the estimate: meter ID, meter name, SKU name, product name, region, unit of measure, and unit price.

## Matching

Each usage row is scored against public price meter candidates using:

- region
- currency
- unit of measure
- redundancy
- access tier
- meter name
- GPv1/GPv2 product hints
- Blob Storage product hints

GPv1 accounts are Azure account kind `Storage`; GPv2 accounts are account kind `StorageV2`. `Storage` accounts do not have an access tier concept. The estimator therefore matches current Blob Storage capacity and transaction usage against `General Block Blob` meters. The conversion target tier is limited to Hot or Cool and is applied only to the `StorageV2` target estimate. Cold and Archive are optimization analysis candidates, not direct account conversion targets in the current app.

For `GRS`, `RA-GRS`, `GZRS`, and `RA-GZRS`, the estimator automatically adds geo-replication data transfer using monthly Data Write GB as the replicated quantity, because Azure bills bandwidth used to replicate written data to the secondary region.

For early deletion, Hot tier has no minimum retention charge in this model. Cool uses Azure's published minimum retention period of 30 days for the conversion estimate. The customer enters deleted GB and the average days retained before deletion; the estimator prorates remaining retention as:

```text
earlyDeletionBillableGb = deletedGb * max(0, minimumRetentionDays - averageDaysRetained) / 30
```

Confidence labels:

- Exact match: one very high-scoring candidate.
- Strong match: high-scoring candidate suitable for default totals.
- Needs review: plausible candidate, excluded from totals by default.
- Unmatched: no reliable candidate, excluded from totals by default.

## Discounts

Discounts are user-entered percentages. The app does not infer private pricing.

```text
discountedUnitPrice = listUnitPrice * (1 - discountPercent / 100)
monthlyCost = quantity * discountedUnitPrice
delta = GPv2 monthly cost - GPv1 monthly cost
annualizedDelta = monthly delta * 12
```

The app shows list-price and discount-adjusted comparisons separately.

## Portfolio Assessment

Version 1.3 adds a browser-local portfolio repository for saved estimates. Portfolio totals are calculated from active assessments only; archived assessments remain available in the repository but are excluded from portfolio totals.

Each assessment receives:

- migration priority
- risk level
- complexity level
- confidence score
- recommendations
- risk indicators

Priority considers annual impact, capacity, confidence, risk, and complexity. Risk considers large capacity, cost increases, low confidence, unmatched rows, review rows, unsupported rows, retrieval signals, and replication dependence.

Portfolio JSON export/import is the portable record for the assessment repository. No Azure sign-in, database, subscription discovery, Azure Resource Graph, or automated migration execution is used in v1.3.
