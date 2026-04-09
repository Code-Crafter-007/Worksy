begin;

-- Create escrow_payments table
create table if not exists public.escrow_payments (
    id uuid default uuid_generate_v4() primary key,
    project_id uuid references public.jobs(id) not null,
    client_id uuid references public.profiles(id) not null,
    freelancer_id uuid references public.profiles(id) not null,
    amount numeric not null,
    platform_fee numeric not null,
    freelancer_amount numeric not null,
    status text check (status in ('pending', 'held', 'released', 'refunded')) default 'pending',
    razorpay_order_id text,
    razorpay_payment_id text,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    released_at timestamp with time zone
);

-- Enable RLS
alter table public.escrow_payments enable row level security;

-- Policies
create policy "Users can view their own escrow payments" on public.escrow_payments
  for select using (auth.uid() = client_id or auth.uid() = freelancer_id);

create policy "Clients can insert escrow payments" on public.escrow_payments
  for insert with check (auth.uid() = client_id);

create policy "Clients can update escrow payments" on public.escrow_payments
  for update using (auth.uid() = client_id);

commit;
