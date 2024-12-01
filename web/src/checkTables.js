import supabase from './lib/supabase';

const expectedTables = [
  'businesses',
  'profiles',
  'stock_items',
  'sales',
  'sale_items',
  'charts'
];

const checkTables = async () => {
  try {
    console.log('Checking database tables...\n');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    if (user) {
      console.log('Current User:', {
        id: user.id,
        email: user.email
      });

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
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.log('\nProfile Status: ❌ Not found');
        console.log('Error:', profileError.message);
      } else {
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
      }
    } else {
      console.log('No user logged in');
    }

    console.log('\nChecking all tables...');
    for (const table of expectedTables) {
      try {
        // Check if table exists and get row count
        const { count, error: countError } = await supabase
          .from(table)
          .select('*', { count: 'exact' });
        
        if (countError && countError.code === '42P01') {
          console.log(`${table}: ❌ Table does not exist`);
          continue;
        }
        
        // Get table policies
        const { data: policiesData } = await supabase
          .from('pg_policies')
          .select('policyname')
          .eq('tablename', table)
          .eq('schemaname', 'public');

        console.log(`${table}: ✅ exists (${count} rows, ${policiesData?.length || 0} policies)`);
      } catch (error) {
        console.log(`${table}: ❌ Error: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run the check
checkTables();
