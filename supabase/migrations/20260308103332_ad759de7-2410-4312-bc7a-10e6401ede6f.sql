
-- Drop all restrictive policies and recreate as permissive

-- TRIPS
DROP POLICY IF EXISTS "Authenticated users can view trips" ON public.trips;
DROP POLICY IF EXISTS "Authenticated users can create trips" ON public.trips;
DROP POLICY IF EXISTS "Trip creator can update" ON public.trips;

CREATE POLICY "Authenticated users can view trips" ON public.trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create trips" ON public.trips FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Trip creator can update" ON public.trips FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- TRIP_MEMBERS
DROP POLICY IF EXISTS "Authenticated can view trip members" ON public.trip_members;
DROP POLICY IF EXISTS "Trip creator or self can add members" ON public.trip_members;

CREATE POLICY "Authenticated can view trip members" ON public.trip_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Trip creator or self can add members" ON public.trip_members FOR INSERT TO authenticated WITH CHECK (
  (trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())) OR (user_id = auth.uid())
);

-- EXPENSES
DROP POLICY IF EXISTS "Authenticated can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Trip members can add expenses" ON public.expenses;
DROP POLICY IF EXISTS "Trip members can delete expenses" ON public.expenses;

CREATE POLICY "Authenticated can view expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Trip members can add expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (
  trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
);
CREATE POLICY "Trip members can delete expenses" ON public.expenses FOR DELETE TO authenticated USING (
  trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
);

-- SETTLEMENTS
DROP POLICY IF EXISTS "Authenticated can view settlements" ON public.settlements;
DROP POLICY IF EXISTS "Trip members can add settlements" ON public.settlements;

CREATE POLICY "Authenticated can view settlements" ON public.settlements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Trip members can add settlements" ON public.settlements FOR INSERT TO authenticated WITH CHECK (
  trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
);
