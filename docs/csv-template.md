# CSV Template

Use `apps/web/public/sample-usage.csv` as the template and smoke-test fixture. It includes modeled Blob capacity and transaction rows, a StorageV2-only replication row, a Blob-related row that should require review, and excluded Azure Files/Queues/Tables rows.

Required columns:

- Billing period
- Service name
- Product
- Meter category
- Meter subcategory
- Meter name
- SKU name
- Region
- Quantity
- Unit
- Unit price
- Cost
- Currency
- Tags or storage account name

Rows should use Azure Retail Prices API-style region names such as `eastus`, `westus2`, or `westeurope`. Quantity must already be expressed in the same unit used by the row, for example `1 GB/Month` or `10K`.
