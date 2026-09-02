CREATE POLICY "reviews_no_public_access" ON public.reviews
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);