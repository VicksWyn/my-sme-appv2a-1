-- Verify the role was updated
SELECT id, full_name, role, email, created_at, updated_at
FROM profiles
WHERE id = '9eac8a23-dfe3-4104-b378-51e48c498c0f';
