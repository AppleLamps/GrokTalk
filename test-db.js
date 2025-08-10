// Simple database connection test script
// Run with: node test-db.js

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testDatabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test if tables exist by trying to count records
    const userCount = await prisma.user.count();
    const projectCount = await prisma.project.count();
    const chatCount = await prisma.chatHistory.count();
    const apiKeyCount = await prisma.userApiKey.count();
    
    console.log('📊 Database Statistics:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Projects: ${projectCount}`);
    console.log(`   Chat History: ${chatCount}`);
    console.log(`   API Keys: ${apiKeyCount}`);
    
    console.log('\n🎉 Database setup is working correctly!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start the frontend: npm run dev');
    console.log('   2. Start the API server: npm run server:dev');
    console.log('   3. Open http://localhost:8081 in your browser');
    console.log('   4. Register a new account to test the system');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error.message);
    
    if (error.code === 'P1001') {
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Check your DATABASE_URL in .env file');
      console.log('   2. Ensure your Vercel Postgres database is running');
      console.log('   3. Verify the connection string format');
      console.log('   4. Run: npm run db:push to create tables');
    } else if (error.code === 'P2021') {
      console.log('\n🔧 Tables not found. Run: npm run db:push');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Check if required environment variables are set
function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...');
  
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'NEXTAUTH_SECRET'
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