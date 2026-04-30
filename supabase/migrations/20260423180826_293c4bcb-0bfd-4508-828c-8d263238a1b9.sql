
-- profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  icp_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- leads
CREATE TABLE public.leads (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  niche TEXT,
  stage TEXT NOT NULL DEFAULT 'Contacted',
  deal_value NUMERIC NOT NULL DEFAULT 0,
  signal_score INTEGER NOT NULL DEFAULT 50,
  next_action TEXT,
  notes TEXT,
  owner TEXT,
  last_contact TIMESTAMPTZ,
  has_reply BOOLEAN NOT NULL DEFAULT false,
  last_sentiment TEXT,
  stage_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own leads" ON public.leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own leads" ON public.leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own leads" ON public.leads FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX leads_user_id_idx ON public.leads(user_id);
CREATE INDEX leads_stage_idx ON public.leads(stage);

-- lead_touches
CREATE TABLE public.lead_touches (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  note TEXT,
  sentiment TEXT,
  touched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_touches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own touches" ON public.lead_touches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own touches" ON public.lead_touches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own touches" ON public.lead_touches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own touches" ON public.lead_touches FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX lead_touches_lead_id_idx ON public.lead_touches(lead_id);

-- stage_history
CREATE TABLE public.stage_history (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stage_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own stage history" ON public.stage_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own stage history" ON public.stage_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX stage_history_lead_id_idx ON public.stage_history(lead_id);

-- ai_logs
CREATE TABLE public.ai_logs (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  input TEXT,
  output TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own ai logs" ON public.ai_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own ai logs" ON public.ai_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX ai_logs_user_id_idx ON public.ai_logs(user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
