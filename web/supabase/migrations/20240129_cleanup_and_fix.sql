-- First, let's check and clean up any orphaned records
DELETE FROM public.sme_details
WHERE owner_id NOT IN (SELECT id FROM public.profiles);

-- Drop all existing foreign key constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_boss_id_fkey;
ALTER TABLE public.sme_details DROP CONSTRAINT IF EXISTS sme_details_owner_id_fkey;

-- Temporarily disable RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sme_details DISABLE ROW LEVEL SECURITY;

-- Clean up any orphaned profiles
DELETE FROM public.profiles
WHERE id NOT IN (SELECT id FROM auth.users);

-- Create a specific profile if it doesn't exist
INSERT INTO public.profiles (id, email, full_name, role)
SELECT '0216afeb-f99f-4c97-ac87-882aa7b07712', 
       (SELECT email FROM auth.users WHERE id = '0216afeb-f99f-4c97-ac87-882aa7b07712'),
       (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = '0216afeb-f99f-4c97-ac87-882aa7b07712'),
       'boss'
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = '0216afeb-f99f-4c97-ac87-882aa7b07712'
);

-- Re-add foreign key constraints
ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_boss_id_fkey 
    FOREIGN KEY (boss_id) 
    REFERENCES public.profiles(id) 
    ON DELETE SET NULL;

ALTER TABLE public.sme_details 
    ADD CONSTRAINT sme_details_owner_id_fkey 
    FOREIGN KEY (owner_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sme_details ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own sme details" ON public.sme_details;
CREATE POLICY "Users can view own sme details"
    ON public.sme_details FOR SELECT
    USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own sme details" ON public.sme_details;
CREATE POLICY "Users can insert own sme details"
    ON public.sme_details FOR INSERT
    WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own sme details" ON public.sme_details;
CREATE POLICY "Users can update own sme details"
    ON public.sme_details FOR UPDATE
    USING (owner_id = auth.uid());
