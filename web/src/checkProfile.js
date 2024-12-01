import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  'https://vinzbtfqiubwgbevywkm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbnpidGZxaXVid2diZXZ5d2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4NTg0NjEsImV4cCI6MjAyMjQzNDQ2MX0.SZQKEZqDI-6JZuM2yBZM3QCl7FPBYvPxw0Sn3nVQeJc'
);

async function checkProfile(userId) {
  try {
    // First check if user exists
    console.log('Checking user:', userId);

    // Check user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        businesses (
          id,
          name,
          associate_slots
        )
      `)
      .eq('id', userId)
      .single();

    if (profileError) {
      console.log('\nProfile Status: ❌ Not found');
      console.log('Error:', profileError.message);
      
      // Create profile and business
      console.log('\nCreating business and profile...');
      
      // 1. Create business
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert([
          {
            name: 'My Business',
            associate_slots: 2
          }
        ])
        .select()
        .single();

      if (businessError) {
        console.error('Error creating business:', businessError);
        return;
      }

      console.log('Business created:', business);

      // 2. Create profile
      const { data: newProfile, error: newProfileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            email: 'user@example.com', // This will be updated on first login
            business_id: business.id,
            role: 'boss'
          }
        ])
        .select()
        .single();

      if (newProfileError) {
        console.error('Error creating profile:', newProfileError);
        return;
      }

      console.log('Profile created:', newProfile);
      return;
    }

    console.log('\nProfile Status: ✅ Found');
    console.log('Profile:', {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      business: profile.businesses ? {
        id: profile.businesses.id,
        name: profile.businesses.name,
        associate_slots: profile.businesses.associate_slots
      } : null
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

// Check profile for the specified user
const userId = '9eac8a23-dfe3-4104-b378-51e48c498c0f';
checkProfile(userId);
