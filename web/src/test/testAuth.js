import supabase from '../lib/supabase';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const testAuth = async () => {
  try {
    console.log('Starting authentication tests...');

    // Test 1: Sign up a new boss user
    const testEmail = `testboss_${Date.now()}@example.com`;
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpassword123',
      options: {
        data: {
          full_name: 'Test Boss',
          role: 'boss'
        }
      }
    });

    if (signUpError) {
      throw new Error(`Sign up failed: ${signUpError.message}`);
    }
    
    console.log('Boss sign up successful:', signUpData);
    
    // Wait for profile creation
    await delay(2000);

    // Test 2: Create SME details
    if (signUpData?.user?.id) {
      const smeDetails = {
        owner_id: signUpData.user.id,
        business_name: 'Test Business',
        business_type: 'retail',
        status: 'active'
      };

      console.log('Attempting to create SME details:', smeDetails);

      const { data: smeData, error: smeError } = await supabase
        .from('sme_details')
        .insert([smeDetails])
        .select();

      if (smeError) {
        console.error('SME details creation failed:', smeError);
      } else {
        console.log('SME details created successfully:', smeData);
      }

      // Wait before next operation
      await delay(2000);

      // Test 3: Sign up an associate
      const associateEmail = `testassociate_${Date.now()}@example.com`;
      const { data: associateData, error: associateError } = await supabase.auth.signUp({
        email: associateEmail,
        password: 'testpassword123',
        options: {
          data: {
            full_name: 'Test Associate',
            role: 'associate',
            boss_id: signUpData.user.id
          }
        }
      });

      if (associateError) {
        console.error('Associate sign up failed:', associateError);
      } else {
        console.log('Associate sign up successful:', associateData);
      }

      // Wait before next operation
      await delay(2000);

      // Test 4: Try to fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error('Profiles fetch failed:', profilesError);
      } else {
        console.log('Profiles fetched successfully:', profiles);
      }

      // Test 5: Try to fetch SME details
      const { data: allSmeDetails, error: smeDetailsError } = await supabase
        .from('sme_details')
        .select('*');

      if (smeDetailsError) {
        console.error('SME details fetch failed:', smeDetailsError);
      } else {
        console.log('SME details fetched successfully:', allSmeDetails);
      }

      // Test 6: Try to fetch specific SME detail
      const { data: specificSme, error: specificSmeError } = await supabase
        .from('sme_details')
        .select('*')
        .eq('owner_id', signUpData.user.id)
        .single();

      if (specificSmeError) {
        console.error('Specific SME detail fetch failed:', specificSmeError);
      } else {
        console.log('Specific SME detail fetched successfully:', specificSme);
      }
    } else {
      console.error('No user ID available for further tests');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
    throw error;
  }
};

export default testAuth;
