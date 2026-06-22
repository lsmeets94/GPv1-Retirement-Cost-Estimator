import { isStorageV2OnlyUsage } from "./mapping";
import type { Confidence, CostSummary, DiscountSettings, MeterMatch, ResultLineItem, UsageLineItem } from "./types";

const confidenceRank: Record<Confidence, number> = {
  "Exact match": 4,
  "Strong match": 3,
  "Needs review": 2,
  Unmatched: 1
};

export function applyDiscount(unitPrice: number, discountPercent: number): number {
  const bounded = Math.min(100, Math.max(0, discountPercent || 0));
  return unitPrice * (1 - bounded / 100);
}

export function resolveDiscounts(settings: DiscountSettings): { gpV1: number; gpV2: number } {
  if (settings.sameDiscountForBoth) {
    return { gpV1: settings.globalDiscountPercent, gpV2: settings.globalDiscountPercent };
  }
  return { gpV1: settings.gpV1DiscountPercent, gpV2: settings.gpV2DiscountPercent };
}

export function calculateTieredListCost(quantity: number, match: MeterMatch): number {
  if (!match.meter) return 0;
  const tiers = match.candidates
    .filter((candidate) => candidate.meterId === match.meter?.meterId && candidate.unitOfMeasure === match.meter?.unitOfMeasure)
    .sort((a, b) => a.tierMinimumUnits - b.tierMinimumUnits);

  if (tiers.length <= 1) {
    return quantity * match.meter.unitPrice;
  }

  let cost = 0;
  for (let index = 0; index < tiers.length; index += 1) {
    const tier = tiers[index];
    const nextTier = tiers[index + 1];
    const tierStart = tier.tierMinimumUnits;
    const tierEnd = nextTier?.tierMinimumUnits ?? Number.POSITIVE_INFINITY;
    const billableQuantity = Math.max(0, Math.min(quantity, tierEnd) - tierStart);
    cost += billableQuantity * tier.unitPrice;
  }

  return cost;
}

function effectiveUnitPrice(quantity: number, listCost: number, fallbackUnitPrice: number): number {
  return quantity > 0 ? listCost / quantity : fallbackUnitPrice;
}

function combinedConfidence(gpV1: MeterMatch, gpV2: MeterMatch): Confidence {
  return confidenceRank[gpV1.confidence] < confidenceRank[gpV2.confidence] ? gpV1.confidence : gpV2.confidence;
}

function finiteNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function calculateResultLine(item: UsageLineItem, gpV1: MeterMatch, gpV2: MeterMatch, settings: DiscountSettings): ResultLineItem {
  const discounts = resolveDiscounts(settings);
  const storageV2Only = isStorageV2OnlyUsage(item) && !gpV1.meter && Boolean(gpV2.meter);
  const confidence = storageV2Only ? gpV2.confidence : combinedConfidence(gpV1, gpV2);
  const includeInTotals = item.included && item.modeled && confidenceRank[confidence] >= confidenceRank["Strong match"];
  const gpV1ListCost = storageV2Only ? 0 : gpV1.meter ? calculateTieredListCost(item.quantity, gpV1) : item.quantity * (item.unitPrice ?? 0);
  const gpV2ListCost = calculateTieredListCost(item.quantity, gpV2);
  const gpV1ListUnitPrice = effectiveUnitPrice(item.quantity, gpV1ListCost, gpV1.meter?.unitPrice ?? item.unitPrice ?? 0);
  const gpV2ListUnitPrice = effectiveUnitPrice(item.quantity, gpV2ListCost, gpV2.meter?.unitPrice ?? 0);
  const gpV1DiscountedUnitPrice = applyDiscount(gpV1ListUnitPrice, discounts.gpV1);
  const gpV2DiscountedUnitPrice = applyDiscount(gpV2ListUnitPrice, discounts.gpV2);

  return {
    usage: item,
    gpV1,
    gpV2,
    includeInTotals,
    quantity: item.quantity,
    gpV1ListUnitPrice,
    gpV1DiscountedUnitPrice,
    gpV2ListUnitPrice,
    gpV2DiscountedUnitPrice,
    gpV1ListCost,
    gpV2ListCost,
    gpV1DiscountedCost: item.quantity * gpV1DiscountedUnitPrice,
    gpV2DiscountedCost: item.quantity * gpV2DiscountedUnitPrice,
    delta: item.quantity * gpV2DiscountedUnitPrice - item.quantity * gpV1DiscountedUnitPrice,
    confidence,
    notes: [
      ...item.notes,
      ...(storageV2Only ? ["Included as a StorageV2-only meter with GPv1 cost set to $0."] : []),
      ...gpV1.notes,
      ...gpV2.notes
    ]
  };
}

export function summarizeCosts(rows: ResultLineItem[]): CostSummary {
  const included = rows.filter((row) => row.includeInTotals);
  const total = (selector: (row: ResultLineItem) => number) => included.reduce((sum, row) => sum + finiteNumber(selector(row)), 0);
  const gpV1ListTotal = total((row) => row.gpV1ListCost);
  const gpV2ListTotal = total((row) => row.gpV2ListCost);
  const gpV1DiscountedTotal = total((row) => row.gpV1DiscountedCost);
  const gpV2DiscountedTotal = total((row) => row.gpV2DiscountedCost);
  const listDelta = gpV2ListTotal - gpV1ListTotal;
  const discountedDelta = gpV2DiscountedTotal - gpV1DiscountedTotal;

  return {
    gpV1ListTotal,
    gpV2ListTotal,
    listDelta,
    listDeltaPercent: gpV1ListTotal === 0 ? 0 : (listDelta / gpV1ListTotal) * 100,
    gpV1DiscountedTotal,
    gpV2DiscountedTotal,
    discountedDelta,
    discountedDeltaPercent: gpV1DiscountedTotal === 0 ? 0 : (discountedDelta / gpV1DiscountedTotal) * 100,
    annualizedDelta: discountedDelta * 12
  };
}
