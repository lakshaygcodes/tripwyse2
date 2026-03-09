
-- Create trips table
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  currency TEXT NOT NULL DEFAULT 'INR',
  join_code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trip members table
CREATE TABLE public.trip_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trip_id, name)
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  paid_by TEXT NOT NULL,
  split_between TEXT[] NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  date TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create settlements table (for mid-trip settlements)
CREATE TABLE public.settlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  from_name TEXT NOT NULL,
  to_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  settled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on all tables
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- Trips: authenticated users can view (needed for join code lookup)
CREATE POLICY "Authenticated users can view trips" ON public.trips
  FOR SELECT TO authenticated
  USING (true);

-- Trips: authenticated users can create
CREATE POLICY "Authenticated users can create trips" ON public.trips
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Trips: creator can update
CREATE POLICY "Trip creator can update" ON public.trips
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

-- Trip members: authenticated can view
CREATE POLICY "Authenticated can view trip members" ON public.trip_members
  FOR SELECT TO authenticated
  USING (true);

-- Trip members: authenticated can insert
CREATE POLICY "Authenticated can add trip members" ON public.trip_members
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Expenses: authenticated can view
CREATE POLICY "Authenticated can view expenses" ON public.expenses
  FOR SELECT TO authenticated
  USING (true);

-- Expenses: authenticated can add
CREATE POLICY "Authenticated can add expenses" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Expenses: authenticated can delete
CREATE POLICY "Authenticated can delete expenses" ON public.expenses
  FOR DELETE TO authenticated
  USING (true);

-- Settlements: authenticated can view
CREATE POLICY "Authenticated can view settlements" ON public.settlements
  FOR SELECT TO authenticated
  USING (true);

-- Settlements: authenticated can add
CREATE POLICY "Authenticated can add settlements" ON public.settlements
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Function to generate a 5-digit join code
CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TEXT
LANGUAGE plpgsql
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
