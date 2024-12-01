import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';

const DatabaseCheck = () => {
  const { user } = useAuth();
  const [tables, setTables] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const expectedTables = [
    'businesses',
    'profiles',
    'stock_items',
    'sales',
    'sale_items',
    'charts'
  ];

  useEffect(() => {
    const checkDatabase = async () => {
      if (!user) {
        setError('Please log in to view database status');
        setLoading(false);
        return;
      }

      try {
        const tableStatus = {};
        
        // First check auth user
        const { data: authUser, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        // Check for user's profile
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.user.id)
          .single();

        tableStatus['auth.users'] = {
          exists: true,
          count: 1,
          error: null,
          userDetails: {
            id: authUser.user.id,
            email: authUser.user.email,
            hasProfile: !profileError && userProfile !== null
          }
        };
        
        for (const table of expectedTables) {
          // Check if table exists and get row count
          const { count, error: countError } = await supabase
            .from(table)
            .select('*', { count: 'exact' });
          
          // Check table policies
          const { data: policiesData } = await supabase
            .rpc('get_policies_for_table', { table_name: table });

          tableStatus[table] = {
            exists: !countError || countError.code !== '42P01',
            count: count || 0,
            error: countError?.message,
            policies: policiesData || []
          };
        }
        
        setTables(tableStatus);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkDatabase();
  }, [user]);

  if (!user) {
    return <div className="p-6 text-red-600">Please log in to view database status</div>;
  }

  if (loading) {
    return <div className="p-6">Checking database tables...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Database Status</h2>
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Table Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Row Count
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Policies
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.keys(tables).map(table => (
              <tr key={table}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {table}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {tables[table]?.exists ? (
                    <span className="text-green-600">✓ Exists</span>
                  ) : (
                    <span className="text-red-600">✗ Missing</span>
                  )}
                  {tables[table]?.error && (
                    <div className="text-xs text-red-500 mt-1">
                      {tables[table].error}
                    </div>
                  )}
                  {table === 'auth.users' && (
                    <div className="text-xs text-gray-500 mt-1">
                      User ID: {tables[table].userDetails.id}
                    </div>
                  )}
                  {table === 'auth.users' && (
                    <div className="text-xs text-gray-500 mt-1">
                      Email: {tables[table].userDetails.email}
                    </div>
                  )}
                  {table === 'auth.users' && (
                    <div className="text-xs text-gray-500 mt-1">
                      Has Profile: {tables[table].userDetails.hasProfile ? 'Yes' : 'No'}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {tables[table]?.exists ? tables[table]?.count : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {tables[table]?.policies?.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {tables[table].policies.map((policy, idx) => (
                        <li key={idx} className="text-xs">
                          {policy.policyname}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-yellow-600">No policies</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DatabaseCheck;
