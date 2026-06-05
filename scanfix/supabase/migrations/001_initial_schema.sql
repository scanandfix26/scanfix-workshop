-- ============================================================
-- SCAN & FIX — Supabase PostgreSQL Schema
-- Run this in your Supabase project: SQL Editor → New Query
-- ============================================================

-- ── Enable UUID extension ────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. PROFILES (extends Supabase auth.users) ────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name      TEXT NOT NULL DEFAULT '',
  role      TEXT NOT NULL DEFAULT 'worker'
              CHECK (role IN ('admin', 'mechanic', 'worker')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'worker')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 2. JOBS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.jobs (
  id               TEXT PRIMARY KEY,
  job_number       TEXT NOT NULL DEFAULT '',
  bike_number      TEXT NOT NULL,
  bike_model       TEXT NOT NULL DEFAULT '',
  customer_phone   TEXT NOT NULL,
  customer_name    TEXT NOT NULL DEFAULT '',
  complaint        TEXT NOT NULL DEFAULT '',
  problems         JSONB NOT NULL DEFAULT '[]',
  repair_notes     TEXT NOT NULL DEFAULT '',
  spare_parts      JSONB NOT NULL DEFAULT '[]',
  bill             JSONB NOT NULL DEFAULT '{"labour":0,"parts":0,"other":0,"total":0}',
  final_work_done  TEXT NOT NULL DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','in-progress','completed','delivered')),
  assigned_mechanic TEXT,
  device_id        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,
  delivered_at     TIMESTAMPTZ,
  deleted_at       TIMESTAMPTZ
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS jobs_bike_number_idx    ON public.jobs (bike_number);
CREATE INDEX IF NOT EXISTS jobs_customer_phone_idx ON public.jobs (customer_phone);
CREATE INDEX IF NOT EXISTS jobs_status_idx         ON public.jobs (status);
CREATE INDEX IF NOT EXISTS jobs_updated_at_idx     ON public.jobs (updated_at DESC);
CREATE INDEX IF NOT EXISTS jobs_completed_at_idx   ON public.jobs (completed_at DESC);
CREATE INDEX IF NOT EXISTS jobs_job_number_idx     ON public.jobs (job_number);

-- ── 3. ROW LEVEL SECURITY ─────────────────────────────────────

-- Profiles: users can read all, update own
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles: anyone authenticated can read"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Profiles: users can update own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Jobs: authenticated users can do everything (team-based workshop)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jobs: authenticated users can read all"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Jobs: authenticated users can insert"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Jobs: authenticated users can update"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Jobs: admin can delete"
  ON public.jobs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── 4. REALTIME ──────────────────────────────────────────────
-- Enable realtime for the jobs table so all devices sync instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;

-- ── 5. SEED DEMO USERS ───────────────────────────────────────
-- After running this migration, create users in Supabase Auth → Users:
--
--   Email: admin@workshop.com     Password: workshop123  (then set role='admin')
--   Email: mechanic@workshop.com  Password: workshop123  (then set role='mechanic')
--   Email: worker@workshop.com    Password: workshop123  (then set role='worker')
--
-- Or use the Supabase SQL Editor to manually set roles:
--   UPDATE public.profiles SET role='admin'    WHERE id = '<user-uuid>';
--   UPDATE public.profiles SET role='mechanic' WHERE id = '<user-uuid>';

-- ── 6. HELPER: update updated_at automatically ────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
