-- Add INSERT policy for user_profiles
CREATE POLICY "Users can insert their own profile"
    ON user_profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Add INSERT policy for sme_details
CREATE POLICY "Users can insert their SME details"
    ON sme_details FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());
