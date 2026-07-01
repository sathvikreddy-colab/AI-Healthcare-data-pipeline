import type { RawClaim, BronzeRecord } from "./types";
import { generateRawClaims } from "./generator";

const VALID_ICD_CODES = new Set([
  "J18.9","I21.9","E11.9","J44.1","N18.3","I50.9","M54.5","Z00.00","K92.1","F32.1",
]);

export function runBronze(): {
  records: BronzeRecord[];
  total: number;
  issues: { duplicates: number; nulls: number; bad_codes: number };
} {
  const raw: RawClaim[] = generateRawClaims(60);
  const ingestedAt = new Date().toISOString();

  const records: BronzeRecord[] = raw.map((r, idx) => ({
    ...r,
    _ingested_at: ingestedAt,
    _source: "claims_feed_v2",
    _row: idx + 1,
  }));

  // count issues (don't fix yet — Bronze is raw fidelity)
  const seen = new Set<string>();
  let duplicates = 0;
  for (const r of records) {
    if (seen.has(r.claim_id)) duplicates++;
    else seen.add(r.claim_id);
  }

  const nulls = records.filter(
    (r) => r.claim_amount === null || r.days_in_hospital === null
  ).length;

  const bad_codes = records.filter((r) => !VALID_ICD_CODES.has(r.icd_code)).length;

  return { records, total: records.length, issues: { duplicates, nulls, bad_codes } };
}
