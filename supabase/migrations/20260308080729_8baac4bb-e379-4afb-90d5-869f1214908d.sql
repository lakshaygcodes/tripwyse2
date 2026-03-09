
-- Fix function search path
CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    code := LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    SELECT EXISTS(SELECT 1 FROM public.trips WHERE join_code = code) INTO exists_already;
    IF NOT exists_already THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Tighten RLS policies: restrict insert/delete to trip members
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated can add trip members" ON public.trip_members;
DROP POLICY IF EXISTS "Authenticated can add expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated can delete expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated can add settlements" ON public.settlements;

-- Trip members: only trip creator or joining user can add
CREATE POLICY "Trip creator or self can add members" ON public.trip_members
  FOR INSERT TO authenticated
  WITH CHECK (
    trip_id IN (SELECT id FROM public.trips WHERE created_by = auth.uid())
    OR user_id = auth.uid()
  );

-- Expenses: only trip members can add
CREATE POLICY "Trip members can add expenses" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (
    trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid())
  );

-- Expenses: only trip members can delete
CREATE POLICY "Trip members can delete expenses" ON public.expenses
  FOR DELETE TO authenticated
  USING (
    trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid())
  );

-- Settlements: only trip members can add
CREATE POLICY "Trip members can add settlements" ON public.settlements
  FOR INSERT TO authenticated
  WITH CHECK (
    trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid())
  );
