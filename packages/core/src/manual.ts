import type { ManualUsageInput, UsageLineItem } from "./types";

const unitByCategory = {
  capacity: "1 GB/Month",
  operations: "10K",
  data: "1 GB",
};

function makeItem(input: ManualUsageInput, id: string, meterName: string, quantity: number, unit: string, product = "General Purpose v1 Blob Storage"): UsageLineItem {
  return {
    id,
    source: "manual",
    serviceName: "Storage",
    product,
    meterCategory: "Storage",
    meterSubcategory: "Blob Storage",
    meterName,
    skuName: input.redundancy,
    region: input.region,
    quantity,
    unit,
    currency: input.currency,
    redundancy: input.redundancy,
    accessTier: input.accessTier,
    sourceAccountKind: "Storage",
    targetAccountKind: "StorageV2",
    included: quantity > 0,
    modeled: true,
    notes: quantity > 0 ? [] : ["Zero quantity row."]
  };
}

function isGeoRedundant(redundancy: ManualUsageInput["redundancy"]): boolean {
  return ["GRS", "RA-GRS", "GZRS", "RA-GZRS"].includes(redundancy);
}

function minimumRetentionDays(tier: ManualUsageInput["accessTier"]): number {
  if (tier === "Cool") return 30;
  if (tier === "Cold") return 90;
  if (tier === "Archive") return 180;
  return 0;
}

function earlyDeletionBillableGb(input: ManualUsageInput): number {
  const minimumDays = minimumRetentionDays(input.accessTier);
  if (minimumDays === 0 || input.deletedDataGb <= 0) return 0;
  const retainedDays = Math.max(0, input.averageDaysRetainedBeforeDelete || 0);
  const remainingDays = Math.max(0, minimumDays - retainedDays);
  return input.deletedDataGb * (remainingDays / 30);
}

export function manualInputToUsage(input: ManualUsageInput): UsageLineItem[] {
  const replicatedWriteGb = isGeoRedundant(input.redundancy)
    ? Math.max(input.writeGb, input.geoReplicationGb, input.dataGeoPriorityReplicationGb)
    : 0;

  return [
    makeItem(input, "manual-capacity", `${input.redundancy} Data Stored`, input.capacityGb, unitByCategory.capacity),
    makeItem(input, "manual-write-ops", "Write Operations", input.writeOperations / 10000, unitByCategory.operations),
    makeItem(input, "manual-read-ops", "Read Operations", input.readOperations / 10000, unitByCategory.operations),
    makeItem(input, "manual-list-ops", "List and Create Container Operations", input.listContainerOperations / 10000, unitByCategory.operations),
    makeItem(input, "manual-retrieval", "Data Retrieval", input.retrievalGb, unitByCategory.data),
    makeItem(input, "manual-write-data", "Data Write", input.writeGb, unitByCategory.data),
    makeItem(input, "manual-geo-transfer", `Data Geo Priority Replication ${input.redundancy} Data Replicated`, replicatedWriteGb, unitByCategory.data, "Blob Features"),
    makeItem(input, "manual-all-other-ops", "All Other Operations", input.allOtherOperations / 10000, unitByCategory.operations),
    makeItem(input, "manual-delete-ops", "Delete Operations", input.deleteOperations / 10000, unitByCategory.operations),
    makeItem(input, "manual-early-delete", `${input.accessTier} ${input.redundancy} Early Delete`, earlyDeletionBillableGb(input), unitByCategory.data)
  ].filter((item) => item.quantity > 0);
}
