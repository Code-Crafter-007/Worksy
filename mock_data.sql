-- Insert Mock Profiles
-- Note: UUIDs are hardcoded to ensure relationships work. 
-- In a real scenario, these would be actual Auth User IDs. 
-- Since we can't easily insert into auth.users from here without admin privileges in some setups, 
-- we will assume some users exist or we will just insert into profiles/jobs for display purposes 
-- (Note: This might fail foreign key constraints if the user doesn't exist in auth.users. 
--  The best way to test this is to Sign Up real users, then manually add jobs. 
--  However, I will provide a script to insert Jobs/Proposals assuming you are logged in as a specific user 
--  OR we can disable RLS/Foreign Keys strictly for testing, but that's bad practice.)

-- BETTER APPROACH: Data for YOU to run after you sign up.
-- 1. Sign up as a 'Client' (e.g., client@test.com)
-- 2. Sign up as a 'Freelancer' (e.g., freelancer@test.com)
-- 3. Run the following to insert Jobs for the Client (Replace CLIENT_UUID with the actual ID from your profiles table)

-- Example Jobs Data (You can run this part if you disable the foreign key check temporarily OR put valid UUIDs)

INSERT INTO public.jobs (client_id, title, description, budget, status, skills_required)
VALUES 
  ((SELECT id FROM public.profiles WHERE role = 'client' LIMIT 1), 'E-commerce Website Overhaul', 'We need a complete redesign of our Shopify store using Liquid and React.', 3000, 'open', ARRAY['React', 'Shopify', 'CSS']),
  ((SELECT id FROM public.profiles WHERE role = 'client' LIMIT 1), 'Mobile App Authentication Fix', 'Fixing login issues on our React Native app.', 500, 'open', ARRAY['React Native', 'Firebase']),
  ((SELECT id FROM public.profiles WHERE role = 'client' LIMIT 1), 'SEO Content Writer', 'Need 10 blog posts about AI trends.', 200, 'open', ARRAY['Writing', 'SEO']);

-- Example Proposals (Replace FREELANCER_UUID and JOB_UUID)
-- INSERT INTO public.proposals (job_id, freelancer_id, cover_letter, bid_amount, status)
-- VALUES
--   ((SELECT id FROM public.jobs LIMIT 1), (SELECT id FROM public.profiles WHERE role = 'freelancer' LIMIT 1), 'I am perfect for this!', 2800, 'pending');
