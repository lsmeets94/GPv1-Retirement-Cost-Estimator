# GPv1 to GPv2 Cost Estimator

## Version 1.1 Enhancement PRD

### Status

Enhancement Release

### Current Production Version

Version 1.0

### Target Release

Version 1.1

---

# Executive Summary

The current GPv1 to GPv2 Cost Estimator successfully provides customers with a mechanism to estimate the financial impact of upgrading Azure Storage GPv1 accounts to GPv2 using public Azure pricing.

User testing has identified several opportunities to improve usability, transparency, trustworthiness, and customer readiness.

Version 1.1 focuses on improving the user experience, increasing pricing transparency, reducing user input complexity, and producing customer-ready outputs suitable for migration discussions.

No fundamental pricing methodology changes are planned for Version 1.1.

---

# Objectives

## Primary Objectives

Improve customer confidence in results.

Reduce time-to-estimate.

Improve export capabilities.

Increase transparency of pricing calculations.

Provide clearer separation between list pricing and discounted pricing.

---

# Non-Goals

The following remain out of scope:

* Azure Authentication
* Azure Cost Management integration
* Enterprise Agreement pricing retrieval
* MCA billing integration
* PDF invoice parsing
* Subscription discovery
* Cost forecasting
* Tax calculations

---

# Current State Assessment

The existing application provides:

* Manual data entry
* GPv1 to GPv2 estimation
* Azure pricing retrieval
* Discount support
* Cost comparison

Areas for improvement:

* Workflow feels calculator-oriented rather than guided
* Limited visibility into pricing sources
* Limited explanation of assumptions
* No confidence scoring
* No customer-facing report output
* Advanced inputs exposed too early

---

# Functional Requirements

## FR-101 Guided Workflow Experience

Replace the current single-page experience with a guided workflow.

### Step 1 – Workload Definition

Collect:

* Region
* Redundancy
* Capacity
* Capacity Unit
* Access Tier

Supported Units:

* GB
* TB
* TiB

Supported Tiers:

* Hot
* Cool
* Cold
* Archive

---

### Step 2 – Pricing Configuration

Collect:

* GPv1 Discount %
* GPv2 Discount %

OR

* Global Discount %

Display:

* Pricing source
* Pricing refresh date
* Currency

---

### Step 3 – Pricing Review

Display all pricing matches.

For every pricing match display:

* Region
* Product Name
* Meter Name
* SKU Name
* Unit Price
* Unit Type

Users must be able to review all assumptions before calculation.

---

### Step 4 – Results

Display:

* Current GPv1 Monthly Cost
* Estimated GPv2 Monthly Cost
* Monthly Delta
* Annual Delta
* Percentage Change

---

# FR-102 Simple Mode

Simple Mode shall be the default experience.

Required Inputs:

* Region
* Redundancy
* Capacity
* Access Tier
* Discount

No transaction information required.

Target completion time:

Less than 60 seconds.

---

# FR-103 Advanced Mode

Advanced Mode shall be optional.

Advanced fields:

* Read Operations
* Write Operations
* List Operations
* Retrieval Volume
* Write Volume
* Replication Volume

Advanced mode shall be hidden by default.

---

# FR-104 Pricing Transparency

The application must expose all pricing information used in calculations.

Display:

* Pricing source
* Pricing retrieval timestamp
* Meter Name
* Product Name
* SKU Name
* Unit Price
* Currency

No pricing assumption shall be hidden.

---

# FR-105 Confidence Scoring

Every GPv1 to GPv2 mapping must receive a confidence score.

### Exact Match

Definition:

Identical region, redundancy, meter type, and unit.

Score:

100

Display:

Green

---

### Strong Match

Definition:

Equivalent pricing meter identified with minor assumptions.

Score:

90-99

Display:

Blue

---

### Needs Review

Definition:

Multiple potential mappings exist.

Score:

50-89

Display:

Amber

---

### Unmatched

Definition:

No valid mapping found.

Score:

0-49

Display:

Red

---

# FR-106 Assumption Management

A dedicated Assumptions section shall be added.

Examples:

* GPv1 storage mapped to GPv2 Hot Storage
* GPv1 transactions mapped to GPv2 transaction meters
* Missing transaction data excluded

Every assumption must be visible.

---

# FR-107 Cost Comparison Views

Provide two result modes.

## List Pricing View

Uses Azure public pricing only.

Display:

* GPv1 Total
* GPv2 Total
* Difference

---

## Discounted View

Uses customer-entered discounts.

Display:

* GPv1 Total
* GPv2 Total
* Difference

---

# FR-108 Visualization Improvements

Add charts.

### Monthly Cost Comparison

Bar Chart

Compare:

* GPv1
* GPv2

---

### Cost Breakdown

Stacked Bar

Categories:

* Capacity
* Transactions
* Retrieval
* Replication

---

### Annual Savings Impact

Display:

* Monthly Savings
* Annual Savings

---

# FR-109 Export Capability

Add customer-ready export.

---

## PDF Export

Include:

Executive Summary

Calculation Date

Pricing Date

Current Cost

Estimated Cost

Annualized Impact

Assumptions

Methodology

---

## CSV Export

Include:

All line-item calculations.

---

# FR-110 Landing Page Improvements

Add introduction section.

Display:

Purpose of tool.

Example text:

"This tool estimates the financial impact of upgrading Azure Storage GPv1 accounts to GPv2 using publicly available Azure list pricing."

---

# FR-111 Disclaimer

Display on every calculation page:

"Prices are estimates only and are not intended as actual price quotes. Actual pricing may vary depending on the type of agreement entered with Microsoft, date of purchase, and the currency exchange rate. Prices are calculated based on US dollars and converted using London closing spot rates that are captured in the two business days prior to the last business day of the previous month end. If the two business days prior to the end of the month fall on a bank holiday in major markets, the rate setting day is generally the day immediately preceding the two business days. This rate applies to all transactions during the upcoming month. Sign in to the Azure pricing calculator to see pricing based on your current program/offer with Microsoft. Contact an Azure sales specialist for more information on pricing or to request a price quote. See frequently asked questions about Azure pricing."

---

# UX Requirements

The user should be able to complete a basic estimate in under one minute.

The application should require no Azure knowledge beyond:

* Region
* Capacity
* Redundancy

The application should feel visually consistent with the Azure Portal.

---

# Technical Requirements

Continue using:

* React
* TypeScript
* Fluent UI
* Azure Static Web Apps

Maintain existing architecture.

Do not introduce new backend dependencies unless required.

---

# Success Metrics

95% of users complete a simple estimate without assistance.

Simple mode completion time under 60 seconds.

100% of calculations show pricing source information.

100% of calculations show assumptions.

100% of exports contain methodology and pricing dates.

No hidden pricing assumptions.

---

# Acceptance Criteria

Version 1.1 is complete when:

* Guided workflow implemented
* Simple Mode implemented
* Advanced Mode implemented
* Pricing transparency implemented
* Confidence scoring implemented
* Assumptions page implemented
* PDF export implemented
* CSV export implemented
* Customer disclaimer implemented
* Charts implemented
* Azure-style UI improvements completed
