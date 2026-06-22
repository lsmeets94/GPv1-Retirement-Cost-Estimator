import type { ResultLineItem } from "./types";

function escapeCsv(value: unknown): string {
  const rawText = String(value ?? "");
  const text = /^[=+\-@\t\r]/.test(rawText) ? `'${rawText}` : rawText;
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function resultsToCsv(rows: ResultLineItem[]): string {
  const headers = [
    "Usage category",
    "Quantity",
    "Unit",
    "GPv1 meter",
    "GPv1 meter ID",
    "GPv1 product",
    "GPv1 SKU",
    "GPv1 region",
    "GPv1 unit type",
    "GPv1 list unit price",
    "GPv1 discounted price",
    "GPv2 meter",
    "GPv2 meter ID",
    "GPv2 product",
    "GPv2 SKU",
    "GPv2 region",
    "GPv2 unit type",
    "GPv2 list unit price",
    "GPv2 discounted price",
    "Monthly GPv1 list cost",
    "Monthly GPv1 discounted cost",
    "Monthly GPv2 list cost",
    "Monthly GPv2 discounted cost",
    "Delta",
    "Confidence",
    "Included in totals",
    "Notes"
  ];

  const body = rows.map((row) => [
    row.usage.meterName,
    row.quantity,
    row.usage.unit,
    row.gpV1.meter?.meterName || "Unmatched",
    row.gpV1.meter?.meterId || "",
    row.gpV1.meter?.productName || "",
    row.gpV1.meter?.skuName || "",
    row.gpV1.meter?.armRegionName || "",
    row.gpV1.meter?.unitOfMeasure || "",
    row.gpV1ListUnitPrice,
    row.gpV1DiscountedUnitPrice,
    row.gpV2.meter?.meterName || "Unmatched",
    row.gpV2.meter?.meterId || "",
    row.gpV2.meter?.productName || "",
    row.gpV2.meter?.skuName || "",
    row.gpV2.meter?.armRegionName || "",
    row.gpV2.meter?.unitOfMeasure || "",
    row.gpV2ListUnitPrice,
    row.gpV2DiscountedUnitPrice,
    row.gpV1ListCost,
    row.gpV1DiscountedCost,
    row.gpV2ListCost,
    row.gpV2DiscountedCost,
    row.delta,
    row.confidence,
    row.includeInTotals,
    row.notes.join("; ")
  ]);

  return [headers, ...body].map((line) => line.map(escapeCsv).join(",")).join("\n");
}
