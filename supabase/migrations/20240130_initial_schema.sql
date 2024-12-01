-- Create profiles table for user details
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('boss', 'associate')),
    full_name TEXT,
    phone_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create businesses table (renamed from sme_details for clarity)
CREATE TABLE businesses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_name TEXT NOT NULL,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    registration_number TEXT,
    business_phone TEXT,
    business_email TEXT,
    business_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_business_per_owner UNIQUE (owner_id, business_name)
);

-- Create business_associates table to link associates with businesses
CREATE TABLE business_associates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    associate_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_associate_per_business UNIQUE (business_id, associate_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_associates ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Create policies for businesses
CREATE POLICY "Business owners can view their businesses"
    ON businesses FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY "Business owners can update their businesses"
    ON businesses FOR UPDATE
    USING (owner_id = auth.uid());

CREATE POLICY "Business owners can delete their businesses"
    ON businesses FOR DELETE
    USING (owner_id = auth.uid());

CREATE POLICY "Business owners can insert businesses"
    ON businesses FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- Create policies for business_associates
CREATE POLICY "Business owners can manage associates"
    ON business_associates FOR ALL
    USING (EXISTS (
        SELECT 1 FROM businesses 
        WHERE businesses.id = business_associates.business_id 
        AND businesses.owner_id = auth.uid()
    ));

CREATE POLICY "Associates can view their associations"
    ON business_associates FOR SELECT
    USING (associate_id = auth.uid());

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'associate')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_associates_updated_at
    BEFORE UPDATE ON business_associates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
