-- Create roles enum type
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'associate');

-- Add role column to profiles
ALTER TABLE public.profiles 
ADD COLUMN role user_role NOT NULL DEFAULT 'associate';

-- Create permissions table
CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role user_role NOT NULL,
    permission TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(role, permission)
);

-- Add RLS policies
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to role_permissions for authenticated users"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (true);

-- Insert default permissions
INSERT INTO public.role_permissions (role, permission) VALUES
    -- Owner permissions
    ('owner', 'view_dashboard'),
    ('owner', 'manage_inventory'),
    ('owner', 'manage_sales'),
    ('owner', 'manage_customers'),
    ('owner', 'manage_staff'),
    ('owner', 'view_reports'),
    ('owner', 'manage_settings'),
    
    -- Manager permissions
    ('manager', 'view_dashboard'),
    ('manager', 'manage_inventory'),
    ('manager', 'manage_sales'),
    ('manager', 'manage_customers'),
    ('manager', 'view_reports'),
    
    -- Associate permissions
    ('associate', 'view_dashboard_limited'),
    ('associate', 'record_sales'),
    ('associate', 'view_inventory'),
    ('associate', 'view_customers');

-- Update existing owner profiles
UPDATE public.profiles
SET role = 'owner'
WHERE id IN (
    SELECT owner_id 
    FROM public.sme_details
);

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION public.has_permission(user_id UUID, required_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role user_role;
BEGIN
    -- Get user's role
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = user_id;

    -- Check if user has the required permission
    RETURN EXISTS (
        SELECT 1
        FROM public.role_permissions
        WHERE role = user_role
        AND permission = required_permission
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
