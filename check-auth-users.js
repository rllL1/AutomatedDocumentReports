const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xfdfsvqzblaxeymspfll.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZGZzdnF6YmxheGV5bXNwZmxsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQzNDc1NiwiZXhwIjoyMDgyMDEwNzU2fQ.f1djAJshIQ9XPs2Hz7URtQsq-y3uczTZcjrcoaEn8E8'
);

async function checkUsers() {
  console.log('🔍 Checking Supabase Authentication vs Users Table...\n');
  
  // Get users from auth.users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.log('❌ Error reading auth users:', authError.message);
    return;
  }
  
  console.log('📧 Users in Supabase Auth (auth.users):');
  authUsers.users.forEach(user => {
    console.log(`   - ${user.email} (ID: ${user.id})`);
  });
  
  // Get users from custom users table
  const { data: tableUsers, error: tableError } = await supabase.from('users').select('*');
  
  if (tableError) {
    console.log('\n❌ Error reading users table:', tableError.message);
    return;
  }
  
  console.log('\n👥 Users in Users Table:');
  tableUsers.forEach(user => {
    console.log(`   - ${user.email} (ID: ${user.id}) - Role: ${user.role}`);
  });
  
  // Find mismatches
  console.log('\n🔍 Analysis:');
  const authEmails = authUsers.users.map(u => u.email);
  const tableEmails = tableUsers.map(u => u.email);
  
  const missingInTable = authUsers.users.filter(authUser => 
    !tableUsers.find(tableUser => tableUser.id === authUser.id)
  );
  
  if (missingInTable.length > 0) {
    console.log('\n⚠️  These users exist in Auth but NOT in users table:');
    missingInTable.forEach(user => {
      console.log(`\n   Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   \n   📝 Run this SQL to fix:`);
      console.log(`   INSERT INTO users (id, email, full_name, role)`);
      console.log(`   VALUES ('${user.id}', '${user.email}', '${user.email.split('@')[0]}', 'admin');`);
    });
  } else {
    console.log('✅ All auth users are properly linked to users table!');
  }
}

checkUsers().catch(console.error);
