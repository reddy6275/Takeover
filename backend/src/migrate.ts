/**
 * migrate.ts
 * 
 * Applies schema.sql to the live Supabase database.
 * 
 * HOW IT WORKS:
 * - The Supabase REST API does not support raw SQL execution.
 * - Instead, we use the Supabase "pg_catalog" schema to bootstrap
 *   a temporary `exec_sql` Postgres function, then call it via RPC.
 * 
 * REQUIREMENTS:
 * - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env
 * - The service role key must have permission to create functions and tables.
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'apikey': serviceRoleKey,
  'Authorization': `Bearer ${serviceRoleKey}`,
  'Prefer': 'return=minimal'
};

async function fetchJson(url: string, options: RequestInit = {}): Promise<any> {
  const resp = await fetch(url, { ...options, headers: { ...headers, ...options.headers as any } });
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}: ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

/**
 * Execute a SQL statement by calling the "exec_sql" RPC function.
 * We first create this helper function if it doesn't exist.
 */
async function execSQL(sql: string): Promise<void> {
  const resp = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql })
  });
  
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`exec_sql failed: ${body}`);
  }
}

/**
 * Create the exec_sql helper function using the Supabase query endpoint.
 * This is a bootstrapping step - we need a way to run SQL first.
 */
async function bootstrapExecSqlFunction(): Promise<void> {
  console.log('📦 Bootstrapping exec_sql helper function...');
  
  const createFnSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `;
  
  // Try using the Supabase query endpoint (works with service role)
  const queryResp = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sql: 'SELECT 1' })
  });
  
  if (queryResp.ok) {
    console.log('✅ exec_sql function already exists');
    return;
  }
  
  // Function doesn't exist yet, need to create it via pg_catalog
  // Use the Supabase Edge Runtime SQL endpoint
  const createResp = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'HEAD',
    headers
  });
  
  console.log('ℹ️  exec_sql function not found. Trying alternate bootstrap...');
  
  // Try the Supabase admin endpoint
  const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
  const adminUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  
  const adminResp = await fetch(adminUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`
    },
    body: JSON.stringify({ query: createFnSQL })
  });
  
  if (adminResp.ok) {
    console.log('✅ exec_sql function created via admin API');
    return;
  }
  
  const adminBody = await adminResp.text();
  throw new Error(
    `Cannot create exec_sql helper. Please run this SQL manually in your Supabase SQL Editor:\n\n${createFnSQL}\n\nAdmin API error: ${adminBody}`
  );
}

/**
 * Parse SQL file into individual statements, skipping comments
 */
function parseSQLStatements(sql: string): string[] {
  // Remove single-line comments
  const noComments = sql.replace(/--[^\n]*/g, '');
  
  // Split by semicolons but handle function bodies with $$ ... $$
  const statements: string[] = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';
  
  const lines = noComments.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    current += line + '\n';
    
    // Check for dollar-quote start/end
    const dollarMatches = line.match(/\$\w*\$/g) || [];
    for (const match of dollarMatches) {
      if (!inDollarQuote) {
        inDollarQuote = true;
        dollarTag = match;
      } else if (match === dollarTag) {
        inDollarQuote = false;
        dollarTag = '';
      }
    }
    
    // Split on semicolons only when not in dollar-quote
    if (!inDollarQuote && current.trim().endsWith(';')) {
      const stmt = current.trim();
      if (stmt.length > 1) {
        statements.push(stmt);
      }
      current = '';
    }
  }
  
  if (current.trim().length > 1) {
    statements.push(current.trim());
  }
  
  return statements.filter(s => s.length > 5);
}

async function runMigration() {
  console.log('\n🚀 SupportAI Database Migration');
  console.log('================================');
  console.log('Supabase URL:', supabaseUrl);
  
  // Step 1: Check connectivity
  console.log('\n1️⃣  Checking Supabase connectivity...');
  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/`, { headers });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    console.log('✅ Supabase REST API is reachable');
  } catch (err: any) {
    console.error('❌ Cannot reach Supabase:', err.message);
    process.exit(1);
  }
  
  // Step 2: Load schema.sql
  console.log('\n2️⃣  Loading schema.sql...');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const schemaPath = path.resolve(__dirname, '../../schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ schema.sql not found at: ${schemaPath}`);
    process.exit(1);
  }
  
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  const statements = parseSQLStatements(schemaSql);
  console.log(`✅ Loaded ${statements.length} SQL statements`);
  
  // Step 3: Try to bootstrap exec_sql function
  console.log('\n3️⃣  Setting up SQL executor...');
  try {
    await bootstrapExecSqlFunction();
  } catch (err: any) {
    console.error('❌', err.message);
    console.log('\n📋 MANUAL STEP REQUIRED:');
    console.log('Please go to your Supabase Dashboard > SQL Editor and run the schema.sql file.');
    console.log(`\nFile location: ${schemaPath}`);
    process.exit(1);
  }
  
  // Step 4: Execute each SQL statement
  console.log('\n4️⃣  Applying schema statements...');
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 60).replace(/\n/g, ' ');
    
    try {
      await execSQL(stmt);
      console.log(`  ✅ [${i + 1}/${statements.length}] ${preview}...`);
      successCount++;
    } catch (err: any) {
      if (err.message.includes('already exists')) {
        console.log(`  ⏭️  [${i + 1}/${statements.length}] Already exists: ${preview}...`);
        successCount++;
      } else {
        console.error(`  ❌ [${i + 1}/${statements.length}] FAILED: ${preview}`);
        console.error(`     Error: ${err.message.substring(0, 200)}`);
        errorCount++;
      }
    }
  }
  
  console.log(`\n================================`);
  console.log(`✅ Migration complete: ${successCount} succeeded, ${errorCount} failed`);
  
  if (errorCount === 0) {
    console.log('\n🎉 Database schema is ready! You can now start the backend server.');
  } else {
    console.log('\n⚠️  Some statements failed. Please check the errors above.');
    console.log('You may need to run schema.sql manually via the Supabase SQL Editor.');
  }
}

runMigration().catch(err => {
  console.error('Migration crashed:', err);
  process.exit(1);
});
