-- Create a table for public profiles methods
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text check (role in ('client', 'freelancer')) default 'freelancer',
  headline text,
  bio text,
  skills text[], -- Array of strings
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create a table for Jobs
create table jobs (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references profiles(id) not null,
  title text not null,
  description text not null,
  budget numeric not null,
  deadline timestamp with time zone,
  status text check (status in ('open', 'in_progress', 'completed', 'cancelled')) default 'open',
  skills_required text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table jobs enable row level security;

create policy "Jobs are viewable by everyone." on jobs
  for select using (true);

create policy "Clients can insert jobs." on jobs
  for insert with check (auth.uid() = client_id);

create policy "Clients can update own jobs." on jobs
  for update using (auth.uid() = client_id);

-- Create a table for Proposals
create table proposals (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references jobs(id) not null,
  freelancer_id uuid references profiles(id) not null,
  cover_letter text not null,
  bid_amount numeric not null,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table proposals enable row level security;

create policy "Proposals are viewable by the client of the job or the freelancer." on proposals
  for select using (
    auth.uid() = freelancer_id or 
    exists (select 1 from jobs where jobs.id = proposals.job_id and jobs.client_id = auth.uid())
  );

create policy "Freelancers can insert proposals." on proposals
  for insert with check (auth.uid() = freelancer_id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', COALESCE(new.raw_user_meta_data->>'role', 'freelancer'));
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
