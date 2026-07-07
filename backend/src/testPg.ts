import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function testPassword(password: string) {
  console.log(`Testing password: ${password}...`);
  const client = new Client({
    host: 'aws-0-ap-northeast-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.ivwpxpysvsjyiiybrist',
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log('SUCCESS! Connected with password:', password);
    await client.end();
    return true;
  } catch (err: any) {
    console.log('Failed:', err.message);
    return false;
  }
}

async function run() {
  await testPassword('ivwpxpysvsjyiiybrist');
}

run();
