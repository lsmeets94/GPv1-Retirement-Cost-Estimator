import { isBlobStorageLine } from "./mapping";
import type { UsageClassification, UsageLineItem } from "./types";

function textFor(item: Pick<UsageLineItem, "serviceName" | "product" | "meterCategory" | "meterSubcategory" | "meterName" | "skuName">): string {
  return `${item.serviceName} ${item.product} ${item.meterCategory} ${item.meterSubcategory || ""} ${item.meterName} ${item.skuName}`.toLowerCase();
}

export function classifyUsage(item: Pick<UsageLineItem, "serviceName" | "product" | "meterCategory" | "meterSubcategory" | "meterName" | "skuName" | "quantity" | "modeled">): UsageClassification {
  const text = textFor(item);

  if (!isBlobStorageLine(item)) {
    return { status: "Excluded", category: "Unsupported", reason: "Not modeled in v1.2: non-Blob Storage or unsupported storage-adjacent service." };
  }

  if (text.includes("data stored") || text.includes("gb/month")) {
    return { status: "Included", category: "Blob Capacity", reason: "Blob capacity is migration-relevant usage." };
  }

  if (text.includes("read") && text.includes("operation")) {
    return { status: "Included", category: "Read Operations", reason: "Read operation usage is migration-relevant." };
  }

  if (text.includes("write") && text.includes("operation")) {
    return { status: "Included", category: "Write Operations", reason: "Write operation usage is migration-relevant." };
  }

  if ((text.includes("list") || text.includes("create container")) && text.includes("operation")) {
    return { status: "Included", category: "List Operations", reason: "List/create operation usage is migration-relevant." };
  }

  if (text.includes("retrieval")) {
    return { status: "Included", category: "Retrieval", reason: "Retrieval usage affects tier economics." };
  }

  if (text.includes("replication") || text.includes("replicated")) {
    return { status: "Included", category: "Replication", reason: "Replication usage can be StorageV2-only billing impact." };
  }

  if (text.includes("early delete")) {
    return { status: "Included", category: "Early Deletion", reason: "Early deletion is tier-dependent migration impact." };
  }

  return { status: "Requires Review", category: "Other", reason: "Blob-related row detected, but the usage category is not confidently classified." };
}
