// ghost.reviews detection engine — pure, unit-tested. See BUILD_PLAN.md §3.
export * from "./normalize";
export * from "./score";
export * from "./verdict";
export * from "./hauntings";
export * from "./analyze";
export { burstiness } from "./signals/burstiness";
export { duplication } from "./signals/duplication";
export { ratingAnomaly } from "./signals/ratingAnomaly";
export { incentivized } from "./signals/incentivized";
export { sentimentMismatch } from "./signals/sentimentMismatch";
export type { SignalResult } from "./types";
export { clamp01, median, mean } from "./math";
