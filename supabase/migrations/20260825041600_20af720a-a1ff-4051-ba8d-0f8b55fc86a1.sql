ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'it' CHECK (locale IN ('it','en'));

CREATE TABLE IF NOT EXISTS public.discord_tickets (
  channel_id text PRIMARY KEY,
  discord_user_id text NOT NULL,
  locale text NOT NULL DEFAULT 'it' CHECK (locale IN ('it','en')),
  panel_message_id text,
  summary_message_id text,
  selected_plan text CHECK (selected_plan IN ('base','plus')),
  selected_days integer CHECK (selected_days IN (15,30)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.discord_tickets TO service_role;
ALTER TABLE public.discord_tickets ENABLE ROW LEVEL SECURITY;