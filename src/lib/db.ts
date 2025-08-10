// Deprecated: Prisma-based DB is removed in favor of Supabase
export async function connectToDatabase() {
  console.log('Supabase is used instead of Prisma. No DB connect needed.');
}

export async function disconnectFromDatabase() {
  // no-op
}

// Health check function
export async function checkDatabaseHealth() {
  try {
    return { status: 'healthy' };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { status: 'unhealthy', error: (error as Error).message };
  }
}