import type { RawClaim } from "./types";

const PROVIDERS = ["PRV-001", "PRV-002", "PRV-003", "PRV-004", "PRV-005"];
const MEMBERS   = Array.from({ length: 20 }, (_, i) => `MBR-${String(i + 1).padStart(4, "0")}`);

const VALID_ICD: Record<string, string> = {
  "J18.9":  "Pneumonia, unspecified",
  "I21.9":  "Acute MI, unspecified",
  "E11.9":  "Type 2 Diabetes",
  "J44.1":  "COPD with acute exacerbation",
  "N18.3":  "Chronic kidney disease, stage 3",
  "I50.9":  "Heart failure, unspecified",
  "M54.5":  "Low back pain",
  "Z00.00": "General adult medical exam",
  "K92.1":  "Melena",
  "F32.1":  "Major depressive disorder",
};

const BAD_ICD = ["J18", "E11", "I21", "N18", "ABC123", "99999", "Z00"];

const CPT_CODES = ["99213", "99214", "99232", "99233", "93000", "71046", "80053", "36415", "99285", "27447"];

const STATUSES = ["approved", "approved", "approved", "denied", "pending"];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randDate(): string {
  const y = 2024;
  const m = String(randInt(1, 12)).padStart(2, "0");
  const d = String(randInt(1, 28)).padStart(2, "0");
  // sometimes return badly formatted dates
  const formats = [`${y}-${m}-${d}`, `${m}/${d}/${y}`, `${d}-${m}-${y}`];
  return rand(formats);
}

let _seed = 42;
function seededRand() { _seed = (_seed * 1664525 + 1013904223) & 0xffffffff; return ((_seed >>> 0) / 0xffffffff); }

export function generateRawClaims(n = 60): RawClaim[] {
  _seed = 42; // reset for deterministic output
  const records: RawClaim[] = [];
  const icdKeys = Object.keys(VALID_ICD);

  for (let i = 0; i < n; i++) {
    const useValidIcd = seededRand() > 0.25;
    const icdKey = icdKeys[Math.floor(seededRand() * icdKeys.length)];
    const icd = useValidIcd ? icdKey : BAD_ICD[Math.floor(seededRand() * BAD_ICD.length)];
    const hasNullAmount = seededRand() < 0.12;
    const hasNullDays = seededRand() < 0.10;

    records.push({
      claim_id:         `CLM-${String(i + 1).padStart(5, "0")}`,
      member_id:        MEMBERS[Math.floor(seededRand() * MEMBERS.length)],
      provider_id:      PROVIDERS[Math.floor(seededRand() * PROVIDERS.length)],
      service_date:     (() => {
        const m = String(Math.floor(seededRand() * 12) + 1).padStart(2, "0");
        const d = String(Math.floor(seededRand() * 28) + 1).padStart(2, "0");
        const formats = [`2024-${m}-${d}`, `${m}/${d}/2024`, `${d}-${m}-2024`];
        return formats[Math.floor(seededRand() * formats.length)];
      })(),
      icd_code:         icd,
      cpt_code:         CPT_CODES[Math.floor(seededRand() * CPT_CODES.length)],
      claim_amount:     hasNullAmount ? null : Math.round(seededRand() * 18000 + 200),
      status:           STATUSES[Math.floor(seededRand() * STATUSES.length)],
      diagnosis:        VALID_ICD[icdKey] ?? "Unknown",
      days_in_hospital: hasNullDays ? null : Math.floor(seededRand() * 10),
    });
  }

  // inject 8 duplicate claim_ids to simulate source system duplication
  for (let i = 0; i < 8; i++) {
    const original = records[Math.floor(seededRand() * 30)];
    records.push({ ...original, service_date: records[Math.floor(seededRand() * 30)].service_date });
  }

  return records;
}
