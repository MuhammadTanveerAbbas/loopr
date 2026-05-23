-- =============================================================================
-- Loopr CRM — Complete Database Schema
-- One file. Clean. Secure. Production-ready.
-- Apply with: psql -f supabase/schema.sql
-- =============================================================================

-- 1. Drop existing objects (safe re-runs)
DROP TRIGGER IF EXISTS trg_leads_updated ON public.leads;
DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
DROP TRIGGER IF EXISTS trg_drafts_updated ON public.drafts;
DROP TRIGGER IF EXISTS trg_leads_stage_change ON public.leads;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS public.set_updated_at();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.track_stage_change();
DROP FUNCTION IF EXISTS public.recompute_signal_score(UUID);
DROP FUNCTION IF EXISTS public.recompute_all_signal_scores();
DROP FUNCTION IF EXISTS public.restore_lead(UUID);
DROP FUNCTION IF EXISTS public.bulk_update_leads_stage(UUID[], TEXT, UUID);
DROP FUNCTION IF EXISTS public.cleanup_old_deleted_leads();

DROP TABLE IF EXISTS public.drafts CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.ai_logs CASCADE;
DROP TABLE IF EXISTS public.stage_history CASCADE;
DROP TABLE IF EXISTS public.lead_touches CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- =============================================================================
-- 3. TABLES
-- =============================================================================

-- 3a. Profiles (created by trigger on auth.users signup)
CREATE TABLE public.profiles (
  id         UUID        NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT,
  email      TEXT,
  icp_text   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3b. Leads
CREATE TABLE public.leads (
  id               UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  company          TEXT,
  email            TEXT,
  niche            TEXT,
  stage            TEXT        NOT NULL DEFAULT 'Contacted',
  deal_value       NUMERIC    NOT NULL DEFAULT 0,
  signal_score     INTEGER    NOT NULL DEFAULT 50,
  next_action      TEXT,
  notes            TEXT,
  owner            TEXT,
  last_contact     TIMESTAMPTZ,
  has_reply        BOOLEAN    NOT NULL DEFAULT false,
  last_sentiment   TEXT,
  tags             TEXT[]      DEFAULT '{}',
  source           TEXT,
  starred          BOOLEAN    NOT NULL DEFAULT false,
  stage_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3c. Lead Touches (interaction log)
CREATE TABLE public.lead_touches (
  id         UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    UUID        NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL,
  note       TEXT,
  sentiment  TEXT,
  touched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3d. Stage History (auto-logged on stage changes)
CREATE TABLE public.stage_history (
  id          UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID        NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_stage  TEXT,
  to_stage    TEXT        NOT NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3e. AI Logs (tracks every AI call for audit + rate limiting)
CREATE TABLE public.ai_logs (
  id         UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id    UUID        REFERENCES public.leads(id) ON DELETE SET NULL,
  type       TEXT        NOT NULL,
  input      TEXT,
  output     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3f. Audit Logs (sensitive operations tracking)
CREATE TABLE public.audit_logs (
  id         UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action     TEXT        NOT NULL,
  table_name TEXT        NOT NULL,
  record_id  UUID,
  old_data   JSONB,
  new_data   JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3g. Saved Drafts (AI-generated or user-written email drafts)
CREATE TABLE public.drafts (
  id         UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id    UUID        REFERENCES public.leads(id) ON DELETE CASCADE,
  subject    TEXT,
  body       TEXT        NOT NULL,
  type       TEXT        NOT NULL DEFAULT 'email',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 4. ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_touches  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drafts        ENABLE ROW LEVEL SECURITY;

-- Profiles: users see only their own
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Leads: users see only their own
CREATE POLICY "leads_select_own" ON public.leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "leads_insert_own" ON public.leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "leads_update_own" ON public.leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "leads_delete_own" ON public.leads FOR DELETE USING (auth.uid() = user_id);

-- Lead Touches: users see only their own
CREATE POLICY "touches_select_own" ON public.lead_touches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "touches_insert_own" ON public.lead_touches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "touches_update_own" ON public.lead_touches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "touches_delete_own" ON public.lead_touches FOR DELETE USING (auth.uid() = user_id);

-- Stage History: users see only their own
CREATE POLICY "stage_history_select_own" ON public.stage_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "stage_history_insert_own" ON public.stage_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI Logs: users see only their own
CREATE POLICY "ai_logs_select_own" ON public.ai_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_logs_insert_own" ON public.ai_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Audit Logs: users see only their own (insert is handled by server-side functions)
CREATE POLICY "audit_logs_select_own" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);

-- Drafts: users see only their own
CREATE POLICY "drafts_select_own" ON public.drafts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "drafts_insert_own" ON public.drafts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "drafts_update_own" ON public.drafts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "drafts_delete_own" ON public.drafts FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- 5. INDEXES
-- =============================================================================

-- Leads
CREATE INDEX idx_leads_user_id        ON public.leads(user_id);
CREATE INDEX idx_leads_stage          ON public.leads(stage);
CREATE INDEX idx_leads_signal_score   ON public.leads(signal_score);
CREATE INDEX idx_leads_created_at     ON public.leads(created_at DESC);
CREATE INDEX idx_leads_stage_created  ON public.leads(stage, created_at DESC);
CREATE INDEX idx_leads_last_contact   ON public.leads(last_contact DESC);
CREATE INDEX idx_leads_user_stage     ON public.leads(user_id, stage);
CREATE INDEX idx_leads_deleted_at     ON public.leads(deleted_at);
CREATE UNIQUE INDEX idx_leads_email_dedup ON public.leads(user_id, LOWER(email)) WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_leads_active         ON public.leads(user_id, stage, created_at DESC) WHERE stage NOT IN ('Won', 'Lost');
CREATE INDEX idx_leads_user_signal    ON public.leads(user_id, signal_score DESC) WHERE signal_score < 50;

-- Full-text search index for name + company
CREATE INDEX idx_leads_search         ON public.leads USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(company, '')));

-- Lead Touches
CREATE INDEX idx_lead_touches_lead_id       ON public.lead_touches(lead_id);
CREATE INDEX idx_lead_touches_touched_at    ON public.lead_touches(touched_at DESC);
CREATE INDEX idx_lead_touches_user_touched  ON public.lead_touches(user_id, touched_at DESC);

-- Stage History
CREATE INDEX idx_stage_history_lead_id      ON public.stage_history(lead_id);
CREATE INDEX idx_stage_history_changed_at   ON public.stage_history(changed_at DESC);
CREATE INDEX idx_stage_history_lead_changed ON public.stage_history(lead_id, changed_at DESC);

-- AI Logs
CREATE INDEX idx_ai_logs_user_id            ON public.ai_logs(user_id);
CREATE INDEX idx_ai_logs_created_at         ON public.ai_logs(created_at DESC);
CREATE INDEX idx_ai_logs_lead_created       ON public.ai_logs(lead_id, created_at DESC);

-- Audit Logs
CREATE INDEX idx_audit_logs_user_action     ON public.audit_logs(user_id, created_at DESC);

-- Drafts
CREATE INDEX idx_drafts_user_lead           ON public.drafts(user_id, lead_id);

-- =============================================================================
-- 6. FUNCTIONS
-- =============================================================================

-- 6a. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 6b. Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- 6c. Track stage changes in history
CREATE OR REPLACE FUNCTION public.track_stage_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO public.stage_history (lead_id, user_id, from_stage, to_stage)
    VALUES (NEW.id, NEW.user_id, OLD.stage, NEW.stage);
  END IF;
  RETURN NEW;
END;
$$;

-- 6d. Recompute signal score for a single lead
CREATE OR REPLACE FUNCTION public.recompute_signal_score(lead_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  l public.leads%ROWTYPE;
  score INTEGER := 50;
  days_silent INTEGER;
  latest_touch_note_at TIMESTAMPTZ;
  stage_stale_days INTEGER;
BEGIN
  SELECT * INTO l FROM public.leads WHERE id = lead_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Engagement stage bonus
  IF l.stage IN ('Replied', 'Call Booked', 'Negotiating') THEN score := score + 15; END IF;

  -- Deal value bonus
  IF l.deal_value > 2000 THEN score := score + 10; END IF;

  days_silent := ABS(EXTRACT(DAY FROM (COALESCE(l.last_contact, l.created_at) - now())));

  -- Reply freshness bonus
  IF l.has_reply AND days_silent <= 7 THEN score := score + 10; END IF;

  -- Recent touch bonus
  SELECT MAX(touched_at) INTO latest_touch_note_at FROM public.lead_touches
    WHERE lead_id = l.id AND note IS NOT NULL;
  IF latest_touch_note_at IS NOT NULL
     AND EXTRACT(DAY FROM (now() - latest_touch_note_at)) <= 3
  THEN
    score := score + 5;
  END IF;

  -- Silence penalties
  IF days_silent >= 15 THEN score := score - 30;
  ELSIF days_silent >= 8 THEN score := score - 20;
  ELSIF days_silent >= 5 THEN score := score - 10;
  END IF;

  -- Sentiment modifiers
  IF l.last_sentiment = 'negative' THEN score := score - 15; END IF;
  IF l.last_sentiment = 'positive' THEN score := score + 5; END IF;

  -- Stale stage penalty
  stage_stale_days := EXTRACT(DAY FROM (now() - l.stage_changed_at));
  IF stage_stale_days >= 14 THEN score := score - 5; END IF;

  score := GREATEST(0, LEAST(100, score));
  UPDATE public.leads SET signal_score = score WHERE id = lead_id;
  RETURN score;
END;
$$;

-- 6e. Recompute all signal scores
CREATE OR REPLACE FUNCTION public.recompute_all_signal_scores()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  updated_count INTEGER := 0;
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.leads WHERE deleted_at IS NULL LOOP
    PERFORM public.recompute_signal_score(r.id);
    updated_count := updated_count + 1;
  END LOOP;
  RETURN updated_count;
END;
$$;

-- 6f. Restore a soft-deleted lead (scoped to auth user)
CREATE OR REPLACE FUNCTION public.restore_lead(lead_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.leads SET deleted_at = NULL WHERE id = lead_id AND user_id = auth.uid();
END;
$$;

-- 6g. Bulk update leads stage (user-scoped for security)
CREATE OR REPLACE FUNCTION public.bulk_update_leads_stage(
  lead_ids  UUID[],
  new_stage TEXT,
  p_user_id UUID
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.leads
  SET stage = new_stage, stage_changed_at = now(), updated_at = now()
  WHERE id = ANY(lead_ids) AND user_id = p_user_id AND deleted_at IS NULL;
END;
$$;

-- 6h. Purge leads soft-deleted more than 30 days ago
CREATE OR REPLACE FUNCTION public.cleanup_old_deleted_leads()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.leads
  WHERE deleted_at IS NOT NULL AND deleted_at < now() - INTERVAL '30 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- =============================================================================
-- 7. TRIGGERS
-- =============================================================================

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_leads_updated
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_drafts_updated
  BEFORE UPDATE ON public.drafts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_leads_stage_change
  AFTER UPDATE OF stage ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.track_stage_change();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7b. Audit log trigger for leads
CREATE OR REPLACE FUNCTION public.log_lead_changes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id, auth.uid()),
    TG_OP,
    'leads',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_leads_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_lead_changes();

-- =============================================================================
-- 8. COMMENTS
-- =============================================================================

COMMENT ON TABLE  public.leads         IS 'Core lead/pipeline records. Supports soft-delete via deleted_at.';
COMMENT ON TABLE  public.lead_touches  IS 'Every interaction logged against a lead (email, call, note, etc.).';
COMMENT ON TABLE  public.stage_history IS 'Immutable audit trail of every stage change.';
COMMENT ON TABLE  public.ai_logs       IS 'All AI gateway requests for billing, debugging, and rate limiting.';
COMMENT ON TABLE  public.audit_logs    IS 'Sensitive CRUD operations on customer-identifying data.';
COMMENT ON TABLE  public.drafts        IS 'AI-generated or user-written email drafts persisted per lead.';
COMMENT ON TABLE  public.profiles      IS 'User profile data (name, ICP text). Auto-created on signup.';
COMMENT ON FUNCTION public.recompute_signal_score(UUID) IS 'Calculates 0-100 engagement score for one lead.';
COMMENT ON FUNCTION public.cleanup_old_deleted_leads()   IS 'Hard-deletes leads trashed more than 30 days ago. Call via pg_cron or manual.';
