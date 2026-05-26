-- Run this in the Supabase SQL editor for your project.

CREATE TABLE IF NOT EXISTS public.leads (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text        NOT NULL DEFAULT '',
  email        text        NOT NULL DEFAULT '',
  country      text        NOT NULL DEFAULT '',
  source       text        NOT NULL DEFAULT '',
  website      text        NOT NULL DEFAULT '',
  founders     text        NOT NULL DEFAULT '',
  status       text        NOT NULL DEFAULT 'new'
                            CHECK (status IN ('new','contacted','outreach_complete','responded','closed')),
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow the anon key full access (no auth in this app).
CREATE POLICY "allow_all" ON public.leads
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- Optional: enable realtime updates.
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
