CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_user_id text NOT NULL,
  discord_username text,
  locale text NOT NULL DEFAULT 'it',
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewer_discord_id text,
  reviewed_at timestamp with time zone,
  reject_reason text,
  public_message_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX reviews_one_pending_per_user
  ON public.reviews (discord_user_id) WHERE status = 'pending';

CREATE UNIQUE INDEX reviews_one_approved_per_user
  ON public.reviews (discord_user_id) WHERE status = 'approved';

CREATE TRIGGER trg_reviews_updated
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();