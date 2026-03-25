-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- IDEAS
create table ideas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  notes text default '',
  rating integer default 3,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table ideas enable row level security;
create policy "Users manage own ideas" on ideas for all using (auth.uid() = user_id);

-- WIP
create table wip (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Untitled',
  content text default '',
  status text default 'drafting',
  target_date text default '',
  series text default '',
  linked_idea_id uuid default null,
  linked_idea_title text default '',
  linked_idea_notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table wip enable row level security;
create policy "Users manage own wip" on wip for all using (auth.uid() = user_id);

-- READY TO RECORD
create table ready (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Untitled',
  content text default '',
  series text default '',
  source_wip_id uuid default null,
  created_at timestamptz default now()
);
alter table ready enable row level security;
create policy "Users manage own ready" on ready for all using (auth.uid() = user_id);

-- RECORDED
create table recorded (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Untitled',
  content text default '',
  series text default '',
  video_length text default '',
  word_count integer default 0,
  recorded_at timestamptz default now()
);
alter table recorded enable row level security;
create policy "Users manage own recorded" on recorded for all using (auth.uid() = user_id);

-- SETTINGS
create table settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  return_on_save boolean default true
);
alter table settings enable row level security;
create policy "Users manage own settings" on settings for all using (auth.uid() = user_id);
