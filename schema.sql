-- Enable pgvector extension
create extension if not exists vector;

-- Companies Table
create table if not exists companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  domain text,
  brand_colors jsonb default '{"primary": "#8B5CF6", "secondary": "#3B82F6", "background": "#0B0F19"}'::jsonb,
  ai_tone text default 'helpful',
  business_hours jsonb,
  support_email text,
  industry text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Users Table (linked with Clerk)
create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  clerk_id text unique not null,
  email text unique not null,
  role text default 'employee' check (role in ('admin', 'employee', 'customer')),
  company_id uuid references companies(id) on delete cascade,
  name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Knowledge Documents Table
create table if not exists knowledge_documents (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  filename text not null,
  file_url text not null,
  file_type text not null,
  char_count integer,
  industry text,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Document Chunks Table (with vector embeddings)
create table if not exists document_chunks (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references knowledge_documents(id) on delete cascade not null,
  content text not null,
  embedding vector(768), -- text-embedding-004 has 768 dimensions
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Conversations Table
create table if not exists conversations (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  customer_email text not null,
  customer_name text,
  status text default 'open' check (status in ('open', 'pending', 'resolved', 'closed')),
  industry text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages Table
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender text not null check (sender in ('customer', 'ai', 'agent')),
  content text not null,
  sentiment text check (sentiment in ('happy', 'neutral', 'angry', 'frustrated', 'urgent')),
  citations jsonb, -- Array of source references [{document_id, filename, chunk_id}]
  feedback text check (feedback in ('thumb_up', 'thumb_down')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tickets Table
create table if not exists tickets (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade not null,
  title text not null,
  description text,
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  status text default 'open' check (status in ('open', 'pending', 'resolved', 'closed')),
  assigned_to_user_id uuid references users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Analytics Logs/Events
create table if not exists analytics_events (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  event_type text not null, -- 'chat_started', 'ticket_created', 'feedback_received', etc.
  metadata jsonb,
  industry text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Vector similarity search helper function
create or replace function match_document_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_company_id uuid,
  p_industry text
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float,
  metadata jsonb,
  filename text
)
language plpgsql
as $$
begin
  return query
  select
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity,
    dc.metadata,
    kd.filename
  from document_chunks dc
  join knowledge_documents kd on dc.document_id = kd.id
  where kd.company_id = p_company_id
    and kd.industry = p_industry
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;
