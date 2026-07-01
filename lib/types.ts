export interface RawClaim {
  claim_id: string;
  member_id: string;
  provider_id: string;
  service_date: string;
  icd_code: string;
  cpt_code: string;
  claim_amount: string | number | null;
  status: string;
  diagnosis: string;
  days_in_hospital: string | number | null;
}

export interface BronzeRecord extends RawClaim {
  _ingested_at: string;
  _source: string;
  _row: number;
}

export interface SilverRecord {
  claim_id: string;
  member_id: string;
  provider_id: string;
  service_date: string;        // normalized YYYY-MM-DD
  icd_code: string;            // validated ICD-10
  cpt_code: string;
  claim_amount: number;        // numeric, nulls filled
  status: "approved" | "denied" | "pending";
  diagnosis: string;
  days_in_hospital: number;
  _quality_flags: string[];
  _bronze_row: number;
}

export interface GoldKPIs {
  total_claims: number;
  total_payout: number;
  avg_claim_amount: number;
  approval_rate: number;
  avg_los: number;             // length of stay
  top_diagnoses: { diagnosis: string; count: number; avg_amount: number }[];
  provider_performance: { provider_id: string; claims: number; avg_amount: number; approval_rate: number }[];
  monthly_trend: { month: string; claims: number; total: number }[];
}

export interface PipelineResult {
  bronze: {
    records: BronzeRecord[];
    total: number;
    issues: { duplicates: number; nulls: number; bad_codes: number };
  };
  silver: {
    records: SilverRecord[];
    total: number;
    removed: number;
    fixed: number;
    transformations: string[];
  };
  gold: GoldKPIs;
}
