// Simple database connection test script
// Run with: node test-db.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testDatabaseConnection() {
  const url = process.env.POSTGRES_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.POSTGRES_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, serviceRole);

  try {
    console.log('🔍 Testing Supabase connection...');
    // Ping a table
    const { error: pingError } = await supabase.from('projects').select('id').limit(1);
    if (pingError) throw pingError;

    const { count: projectCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
    const { count: chatCount } = await supabase.from('chat_history').select('*', { count: 'exact', head: true });
    const { count: apiKeyCount } = await supabase.from('user_api_keys').select('*', { count: 'exact', head: true });

    console.log('📊 Database Statistics:');
    console.log(`   Projects: ${projectCount ?? 0}`);
    console.log(`   Chat History: ${chatCount ?? 0}`);
    console.log(`   API Keys: ${apiKeyCount ?? 0}`);

    console.log('\n🎉 Supabase setup is working correctly!');
  } catch (error) {
    console.error('❌ Supabase connection failed:');
    console.error(error.message);
  }
}

// Check if required environment variables are set
function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...');
  
  const required = [
    'POSTGRES_SUPABASE_URL',
    'POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'POSTGRES_SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.log('\n📝 Please add these to your .env file');
    return false;
  }
  
  console.log('✅ All required environment variables are set');
  return true;
}

async function main() {
  console.log('🚀 GrokTalk Database Test\n');
  
  if (checkEnvironmentVariables()) {
    await testDatabaseConnection();
  }
}

main().catch(console.error);