const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xfdfsvqzblaxeymspfll.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZGZzdnF6YmxheGV5bXNwZmxsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQzNDc1NiwiZXhwIjoyMDgyMDEwNzU2fQ.f1djAJshIQ9XPs2Hz7URtQsq-y3uczTZcjrcoaEn8E8'
);

async function testConnection() {
  console.log('Testing Supabase connection...\n');
  
  // Test users table
  const { data, error } = await supabase.from('users').select('*');
  
  if (error) {
    console.log('❌ Database Error:', error.message);
    console.log('\n⚠️  You need to run the database schema!');
    console.log('📝 Go to: https://supabase.com/dashboard/project/xfdfsvqzblaxeymspfll/sql/new');
    console.log('📋 Run the schema from: backend/database/schema.sql');
  } else {
    console.log('✅ Database Connected!');
    console.log('📊 Users table exists');
    console.log('👥 Total users:', data.length);
    
    if (data.length === 0) {
      console.log('\n⚠️  No users found. You need to:');
      console.log('1. Create user in Supabase Auth: https://supabase.com/dashboard/project/xfdfsvqzblaxeymspfll/auth/users');
      console.log('2. Add to users table with SQL');
    } else {
      console.log('\n👤 Users:');
      data.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });
    }
  }
  
  // Test other tables
  const tables = ['documents', 'document_reports', 'notifications', 'audit_logs'];
  console.log('\n📋 Checking tables:');
  
  for (const table of tables) {
    const { error: tableError } = await supabase.from(table).select('count').limit(1);
    console.log(`   ${table}: ${tableError ? '❌ Missing' : '✅ Exists'}`);
  }
}

testConnection().catch(console.error);
