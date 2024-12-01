-- Combined migration file that represents the current state of the database

-- Create auth tables and functions
\i '20240127_create_auth_tables_v2.sql'

-- Initialize database with base tables
\i '20240128_init_database.sql'

-- Set up profiles and SME details
\i '20240129_cleanup_and_fix.sql'

-- Create functions for stock management
\i '20240327_add_stock_summary_function.sql'
\i '20240327_create_sme_profile_function.sql'
\i '20240327_fix_stock_items_constraints.sql'
