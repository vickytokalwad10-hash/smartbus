-- 00_init_supabase.sql
-- Run this script in the Supabase SQL Editor to initialize the JD College SmartBus database.

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. CREATE TABLES

-- USERS
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null unique,
  role text not null check (role in ('student', 'teacher', 'customer', 'driver', 'admin')),
  phone text,
  college_name text default 'JD College of Engineering & Technology',
  student_id text,
  employee_id text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ROUTES
create table if not exists public.routes (
  id uuid default uuid_generate_v4() primary key,
  route_number text not null unique,
  name text not null,
  stops jsonb default '[]'::jsonb, -- Array of objects: { name, order, lat, lng }
  frequency text default 'Every 15 mins',
  start_time text default '06:00',
  end_time text default '22:00',
  base_fare numeric default 20,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- BUSES
create table if not exists public.buses (
  id uuid default uuid_generate_v4() primary key,
  bus_number text not null unique,
  registration_plate text,
  capacity integer default 50,
  type text default 'Diesel' check (type in ('Electric', 'Diesel', 'Hybrid')),
  route_id uuid references public.routes(id),
  driver_id uuid references public.profiles(id),
  status text default 'idle' check (status in ('active', 'idle', 'maintenance', 'offline')),
  current_occupancy integer default 0,
  last_location jsonb, -- { lat, lng, updated_at }
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- PASSES
create table if not exists public.passes (
  id uuid default uuid_generate_v4() primary key,
  pass_id text unique not null,
  user_id uuid references public.profiles(id) not null,
  route_id uuid references public.routes(id) not null,
  boarding_point text not null,
  destination_stop text not null,
  duration text not null check (duration in ('daily', 'weekly', 'monthly', 'semester', 'annual')),
  pass_type text default 'general' check (pass_type in ('student', 'teacher', 'general')),
  amount numeric not null,
  status text default 'pending' check (status in ('active', 'pending', 'expired', 'rejected')),
  valid_from timestamp with time zone default timezone('utc'::text, now()),
  valid_until timestamp with time zone not null,
  id_card_url text,
  payment_method text,
  qr_data text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- PAYMENTS
create table if not exists public.payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  pass_id uuid references public.passes(id),
  route_id uuid references public.routes(id),
  amount numeric not null,
  method text default 'UPI' check (method in ('UPI', 'Card', 'Wallet', 'Cash')),
  status text default 'success' check (status in ('success', 'pending', 'failed')),
  description text,
  transaction_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- TRIPS
create table if not exists public.trips (
  id uuid default uuid_generate_v4() primary key,
  bus_id uuid references public.buses(id) not null,
  driver_id uuid references public.profiles(id) not null,
  route_id uuid references public.routes(id) not null,
  date date default CURRENT_DATE,
  hour_of_day integer,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  status text default 'scheduled' check (status in ('scheduled', 'in-progress', 'completed', 'cancelled')),
  passenger_count integer default 0,
  current_stop integer default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- COMPLAINTS
create table if not exists public.complaints (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  bus_id uuid references public.buses(id),
  route_id uuid references public.routes(id),
  type text default 'complaint' check (type in ('complaint', 'incident', 'delay')),
  reason text,
  description text not null,
  status text default 'open' check (status in ('open', 'in-progress', 'resolved')),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);


-- 3. ROW LEVEL SECURITY (RLS)
-- To get started quickly without blocking reads/writes during development, we'll enable RLS but set completely open policies for now.
-- In production, you should restrict these based on auth.uid() and user roles.

alter table public.profiles enable row level security;
create policy "Allow public read profiles" on public.profiles for select using (true);
create policy "Allow public insert profiles" on public.profiles for insert with check (true);
create policy "Allow public update profiles" on public.profiles for update using (true);

alter table public.routes enable row level security;
create policy "Allow public all routes" on public.routes for all using (true);

alter table public.buses enable row level security;
create policy "Allow public all buses" on public.buses for all using (true);

alter table public.passes enable row level security;
create policy "Allow public all passes" on public.passes for all using (true);

alter table public.payments enable row level security;
create policy "Allow public all payments" on public.payments for all using (true);

alter table public.trips enable row level security;
create policy "Allow public all trips" on public.trips for all using (true);

alter table public.complaints enable row level security;
create policy "Allow public all complaints" on public.complaints for all using (true);

-- 4. TRIGGERS
-- Create a trigger that automatically creates a profile when a user signs up via Supabase Auth
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'name', 'New User'),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. INITIAL DATA SEEDING (Optional)
insert into public.routes (route_number, name, base_fare, stops) values
('42A', 'JD Campus Express', 20, '[{"lat": 21.1458, "lng": 79.0882, "name": "Sitabuldi", "order": 1}, {"lat": 21.1350, "lng": 79.0550, "name": "Dharampeth", "order": 2}, {"lat": 21.1230, "lng": 79.0510, "name": "JD College", "order": 3}]'::jsonb),
('101', 'Nagpur Metro Circular', 30, '[{"lat": 21.1458, "lng": 79.0882, "name": "Sitabuldi", "order": 1}, {"lat": 21.1110, "lng": 79.0660, "name": "Rahate Colony", "order": 2}]'::jsonb);
