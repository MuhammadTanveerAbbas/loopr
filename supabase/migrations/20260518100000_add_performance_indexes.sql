-- Performance indexes for leads, touches, and stage_history tables
-- Add indexes for commonly used filter and sort columns

-- Leads table indexes
CREATE INDEX IF NOT EXISTS idx_leads_signal_score ON public.leads(signal_score);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_stage_created ON public.leads(stage, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_last_contact ON public.leads(last_contact DESC);
CREATE INDEX IF NOT EXISTS idx_leads_user_stage ON public.leads(user_id, stage);

-- Lead touches table indexes
CREATE INDEX IF NOT EXISTS idx_lead_touches_touched_at ON public.lead_touches(touched_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_touches_user_touched ON public.lead_touches(user_id, touched_at DESC);

-- Stage history table indexes
CREATE INDEX IF NOT EXISTS idx_stage_history_changed_at ON public.stage_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_stage_history_lead_changed ON public.stage_history(lead_id, changed_at DESC);

-- AI logs table indexes
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON public.ai_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_lead_created ON public.ai_logs(lead_id, created_at DESC);

-- Partial index for active leads (not won or lost)
CREATE INDEX IF NOT EXISTS idx_leads_active ON public.leads(user_id, stage, created_at DESC)
  WHERE stage NOT IN ('Won', 'Lost');

-- Composite index for lead signal score filtering
CREATE INDEX IF NOT EXISTS idx_leads_user_signal ON public.leads(user_id, signal_score DESC)
  WHERE signal_score < 50;