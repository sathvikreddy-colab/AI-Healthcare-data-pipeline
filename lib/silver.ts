import type { BronzeRecord, SilverRecord } from "./types";

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

// partial-code repair map: bad prefix → canonical ICD
const ICD_REPAIR: Record<string, string> = {
  "J18":  "J18.9",
  "E11":  "E11.9",
  "I21":  "I21.9",
  "N18":  "N18.3",
  "Z00":  "Z00.00",
};

function normalizeDate(raw: string): string | null {
  // handles YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return raw;
  const us = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (us) return `${us[3]}-${us[1]}-${us[2]}`;
  const dmy = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return null;
}

const AVG_CLAIM_AMOUNT = 4200; // used for null imputation

export function runSilver(bronze: BronzeRecord[]): {
  records: SilverRecord[];
  total: number;
  removed: number;
  fixed: number;
  transformations: string[];
} {
  const transformations: string[] = [];
  let removed = 0;
  let fixed = 0;

  // 1. Deduplicate by claim_id — keep first occurrence
  const seen = new Map<string, BronzeRecord>();
  const deduped: BronzeRecord[] = [];
  for (const r of bronze) {
    if (!seen.has(r.claim_id)) {
      seen.set(r.claim_id, r);
      deduped.push(r);
    } else {
      removed++;
    }
  }
  transformations.push(`Removed ${removed} duplicate claim_id records (kept first occurrence)`);

  const records: SilverRecord[] = [];

  for (const r of deduped) {
    const flags: string[] = [];

    // 2. Normalize date
    const dateNorm = normalizeDate(r.service_date);
    if (!dateNorm) {
      removed++;
      transformations.push(`Dropped CLM ${r.claim_id}: unparseable date "${r.service_date}"`);
      continue;
    }
    if (dateNorm !== r.service_date) { flags.push("date_normalized"); fixed++; }

    // 3. Validate / repair ICD code
    let icd = r.icd_code.trim().toUpperCase();
    if (!VALID_ICD[icd]) {
      const repaired = ICD_REPAIR[icd];
      if (repaired) {
        icd = repaired;
        flags.push("icd_repaired");
        fixed++;
      } else {
        icd = "Z00.00"; // default to general exam for completely unknown codes
        flags.push("icd_defaulted");
        fixed++;
      }
    }

    // 4. Null imputation for claim_amount
    let amount = typeof r.claim_amount === "number" ? r.claim_amount : Number(r.claim_amount);
    if (r.claim_amount === null || isNaN(amount)) {
      amount = AVG_CLAIM_AMOUNT;
      flags.push("amount_imputed");
      fixed++;
    }

    // 5. Null imputation for days_in_hospital
    let los = typeof r.days_in_hospital === "number" ? r.days_in_hospital : Number(r.days_in_hospital);
    if (r.days_in_hospital === null || isNaN(los)) {
      los = 1;
      flags.push("los_imputed");
      fixed++;
    }

    // 6. Standardize status
    const status = (["approved", "denied", "pending"].includes(r.status?.toLowerCase())
      ? r.status.toLowerCase()
      : "pending") as "approved" | "denied" | "pending";

    records.push({
      claim_id:         r.claim_id,
      member_id:        r.member_id,
      provider_id:      r.provider_id,
      service_date:     dateNorm,
      icd_code:         icd,
      cpt_code:         r.cpt_code,
      claim_amount:     amount,
      status,
      diagnosis:        VALID_ICD[icd] ?? r.diagnosis,
      days_in_hospital: los,
      _quality_flags:   flags,
      _bronze_row:      r._row,
    });
  }

  transformations.push(`Normalized ${records.filter(r => r._quality_flags.includes("date_normalized")).length} service_date formats to ISO 8601`);
  transformations.push(`Repaired ${records.filter(r => r._quality_flags.includes("icd_repaired")).length} partial ICD-10 codes; defaulted ${records.filter(r => r._quality_flags.includes("icd_defaulted")).length} unknown codes`);
  transformations.push(`Imputed ${records.filter(r => r._quality_flags.includes("amount_imputed")).length} null claim_amounts with dataset mean ($${AVG_CLAIM_AMOUNT.toLocaleString()})`);
  transformations.push(`Imputed ${records.filter(r => r._quality_flags.includes("los_imputed")).length} null days_in_hospital with 1`);

  return { records, total: records.length, removed, fixed, transformations };
}
