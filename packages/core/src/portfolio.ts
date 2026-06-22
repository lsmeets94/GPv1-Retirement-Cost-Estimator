import { summarizeCosts } from "./calculations";
import type {
  Confidence,
  MigrationComplexity,
  PortfolioAssessmentInput,
  PortfolioAssessmentSummary,
  PortfolioPriority,
  PortfolioRisk,
  PortfolioSummary,
  ResultLineItem
} from "./types";

const confidenceRank: Record<Confidence, number> = {
  "Exact match": 100,
  "Strong match": 85,
  "Needs review": 55,
  Unmatched: 15
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));
}

function confidenceScore(rows: ResultLineItem[]): number {
  const modeled = rows.filter((row) => row.usage.modeled);
  if (modeled.length === 0) return 0;
  return Math.round(modeled.reduce((sum, row) => sum + confidenceRank[row.confidence], 0) / modeled.length);
}

function categoryFromScore<T extends string>(score: number, high: T, medium: T, low: T): T {
  if (score >= 70) return high;
  if (score >= 40) return medium;
  return low;
}

function complexityScore(input: PortfolioAssessmentInput): number {
  const unsupportedRows = input.results.filter((row) => !row.usage.modeled).length;
  const needsReviewRows = input.results.filter((row) => row.confidence === "Needs review" || row.confidence === "Unmatched").length;
  const replicationRows = input.results.filter((row) => /replication|replicated/i.test(row.usage.meterName));
  let score = 15;
  if (input.capacityGb > 50_000) score += 15;
  if (input.capacityGb > 100_000) score += 15;
  if (["GRS", "RA-GRS", "GZRS", "RA-GZRS"].includes(input.redundancy || "")) score += 15;
  if (replicationRows.length > 0) score += 10;
  if (unsupportedRows > 0) score += Math.min(20, unsupportedRows * 5);
  if (needsReviewRows > 0) score += Math.min(20, needsReviewRows * 4);
  return clamp(score);
}

function riskIndicators(input: PortfolioAssessmentInput, confidence: number, monthlyDelta: number): string[] {
  const indicators: string[] = [];
  const unmatched = input.results.filter((row) => row.confidence === "Unmatched").length;
  const needsReview = input.results.filter((row) => row.confidence === "Needs review").length;
  const replicationCost = input.results
    .filter((row) => row.includeInTotals && /replication|replicated/i.test(row.usage.meterName))
    .reduce((sum, row) => sum + row.gpV2DiscountedCost, 0);
  const retrievalCost = input.results
    .filter((row) => row.includeInTotals && /retrieval/i.test(row.usage.meterName))
    .reduce((sum, row) => sum + row.gpV2DiscountedCost, 0);

  if (input.capacityGb > 100_000) indicators.push("Very large capacity footprint.");
  if (replicationCost > 0) indicators.push("Replication-dependent workload.");
  if (retrievalCost > 0 && input.accessTier === "Cool") indicators.push("Cool tier with retrieval activity.");
  if (monthlyDelta > 1000) indicators.push("Large monthly cost increase.");
  if (confidence < 70) indicators.push("Low pricing match confidence.");
  if (unmatched > 0) indicators.push(`${unmatched} unmatched row${unmatched === 1 ? "" : "s"}.`);
  if (needsReview > 0) indicators.push(`${needsReview} row${needsReview === 1 ? "" : "s"} need pricing review.`);
  return indicators.length > 0 ? indicators : ["No major risk indicators detected."];
}

function riskScore(input: PortfolioAssessmentInput, confidence: number, monthlyDelta: number): number {
  let score = 10;
  if (input.capacityGb > 50_000) score += 10;
  if (input.capacityGb > 100_000) score += 15;
  if (monthlyDelta > 0) score += Math.min(25, monthlyDelta / 100);
  if (confidence < 80) score += 15;
  if (confidence < 60) score += 15;
  score += Math.min(20, input.results.filter((row) => row.confidence === "Needs review" || row.confidence === "Unmatched").length * 4);
  score += Math.min(15, input.results.filter((row) => !row.usage.modeled).length * 5);
  return clamp(score);
}

function priorityScore(input: PortfolioAssessmentInput, annualImpact: number, complexity: number, confidence: number, risk: number): number {
  const savingsSignal = annualImpact < 0 ? Math.min(35, Math.abs(annualImpact) / 1000) : 0;
  const costIncreaseSignal = annualImpact > 0 ? Math.min(20, annualImpact / 2000) : 0;
  const capacitySignal = Math.min(20, input.capacityGb / 5000);
  const confidenceSignal = Math.min(20, confidence / 5);
  const riskPenalty = Math.min(20, risk / 5);
  const complexityPenalty = Math.min(15, complexity / 7);
  return clamp(20 + savingsSignal + costIncreaseSignal + capacitySignal + confidenceSignal - riskPenalty - complexityPenalty);
}

function recommendations(input: PortfolioAssessmentInput, priority: PortfolioPriority, risk: PortfolioRisk, annualImpact: number, confidence: number): string[] {
  const output: string[] = [];
  if (priority === "High" && annualImpact < 0) output.push("Prioritize migration due to high annual savings potential.");
  if (priority === "High" && annualImpact >= 0) output.push("Prioritize validation because the estimate shows material cost increase.");
  if (risk === "High") output.push("Review risk indicators with the customer before committing to the migration wave.");
  if (confidence < 75) output.push("Validate unmatched and needs-review rows before sharing externally.");
  if (["GRS", "RA-GRS", "GZRS", "RA-GZRS"].includes(input.redundancy || "")) output.push("Confirm geo-redundancy and replication requirements.");
  if (input.accessTier === "Hot" && input.capacityGb > 10_000) output.push("Compare Cool conversion economics for low-access data.");
  if (output.length === 0) output.push("Good candidate for standard migration planning.");
  return output;
}

export function summarizePortfolioAssessment(input: PortfolioAssessmentInput): PortfolioAssessmentSummary {
  const summary = summarizeCosts(input.results);
  const confidence = confidenceScore(input.results);
  const complexityValue = complexityScore(input);
  const complexity = categoryFromScore<MigrationComplexity>(complexityValue, "High", "Medium", "Low");
  const riskValue = riskScore(input, confidence, summary.discountedDelta);
  const risk = categoryFromScore<PortfolioRisk>(riskValue, "High", "Medium", "Low");
  const priorityValue = priorityScore(input, summary.annualizedDelta, complexityValue, confidence, riskValue);
  const priority = categoryFromScore<PortfolioPriority>(priorityValue, "High", "Medium", "Low");

  return {
    ...input,
    gpV1MonthlyCost: summary.gpV1DiscountedTotal,
    gpV2MonthlyCost: summary.gpV2DiscountedTotal,
    monthlyDelta: summary.discountedDelta,
    annualImpact: summary.annualizedDelta,
    confidenceScore: confidence,
    complexityScore: complexityValue,
    complexity,
    priorityScore: priorityValue,
    priority,
    riskScore: riskValue,
    risk,
    recommendations: recommendations(input, priority, risk, summary.annualizedDelta, confidence),
    riskIndicators: riskIndicators(input, confidence, summary.discountedDelta)
  };
}

function distribution<T extends string>(items: PortfolioAssessmentSummary[], values: T[], selector: (item: PortfolioAssessmentSummary) => T): Record<T, number> {
  return Object.fromEntries(values.map((value) => [value, items.filter((item) => selector(item) === value).length])) as Record<T, number>;
}

function confidenceBand(score: number): "High" | "Medium" | "Low" {
  if (score >= 85) return "High";
  if (score >= 65) return "Medium";
  return "Low";
}

export function summarizePortfolio(inputs: PortfolioAssessmentInput[]): PortfolioSummary {
  const assessments = inputs.map(summarizePortfolioAssessment);
  const activeAssessments = assessments.filter((item) => item.status !== "Archived");
  const archivedAssessments = assessments.filter((item) => item.status === "Archived");
  const total = (selector: (item: PortfolioAssessmentSummary) => number) => activeAssessments.reduce((sum, item) => sum + selector(item), 0);

  return {
    assessments,
    activeAssessments,
    archivedAssessments,
    totalAccounts: assessments.length,
    activeAccounts: activeAssessments.length,
    totalCapacityGb: total((item) => item.capacityGb),
    gpV1MonthlyCost: total((item) => item.gpV1MonthlyCost),
    gpV2MonthlyCost: total((item) => item.gpV2MonthlyCost),
    monthlyDelta: total((item) => item.monthlyDelta),
    annualImpact: total((item) => item.annualImpact),
    highPriorityCount: activeAssessments.filter((item) => item.priority === "High").length,
    highRiskCount: activeAssessments.filter((item) => item.risk === "High").length,
    averageConfidence: activeAssessments.length === 0 ? 0 : Math.round(total((item) => item.confidenceScore) / activeAssessments.length),
    complexityDistribution: distribution(activeAssessments, ["Low", "Medium", "High"], (item) => item.complexity),
    confidenceDistribution: distribution(activeAssessments, ["Low", "Medium", "High"], (item) => confidenceBand(item.confidenceScore)),
    priorityDistribution: distribution(activeAssessments, ["Low", "Medium", "High"], (item) => item.priority),
    riskDistribution: distribution(activeAssessments, ["Low", "Medium", "High"], (item) => item.risk)
  };
}
