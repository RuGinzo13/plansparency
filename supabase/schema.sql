CREATE TABLE IF NOT EXISTS plans (
  plan_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_token UUID NOT NULL,
  employer_name TEXT,
  plan_name     TEXT,
  ein           TEXT,
  plan_number   TEXT,
  plandata_json JSONB,
  initial_summary  TEXT NOT NULL DEFAULT '',
  pdf_storage_path TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plan_sessions (
  session_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id       UUID REFERENCES plans(plan_id) ON DELETE CASCADE,
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  question_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_plans_advisor_token ON plans(advisor_token);
CREATE INDEX IF NOT EXISTS idx_sessions_plan_id    ON plan_sessions(plan_id);
