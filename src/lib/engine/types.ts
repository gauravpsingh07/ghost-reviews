/** Result of a single detection signal (engine-internal). */
export interface SignalResult {
  score: number; // 0..1 (1 = most suspicious)
  detail: string; // human-readable summary for the UI / hauntings
  evidenceReviewIds: string[];
}
