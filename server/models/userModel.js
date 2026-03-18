const supabase = require('../config/supabase');

const throwSupabaseError = (error, fallbackMessage) => {
  const wrapped = new Error(error?.message || fallbackMessage || 'Supabase request failed.');
  wrapped.statusCode = Number(error?.status) || 500;
  wrapped.code = error?.code;
  wrapped.name = error?.name || 'SupabaseError';
  throw wrapped;
};

const signUpWithEmail = async ({ email, password }) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${frontendUrl}/login?confirmed=1`,
    },
  });
  if (error) throwSupabaseError(error, 'Could not sign up user.');
  return data;
};

const signInWithEmail = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throwSupabaseError(error, 'Could not sign in user.');
  return data;
};

const findProfileByEmail = async (email) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
  if (error) throwSupabaseError(error, 'Could not look up profile by email.');
  return data;
};

const findProfileById = async (id) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throwSupabaseError(error, 'Could not look up profile by id.');
  return data;
};

const createProfile = async ({ id, name, email, role }) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert([{ id, full_name: name, email, role }])
    .select('id, full_name, email, role, created_at')
    .single();

  if (error) throwSupabaseError(error, 'Could not create profile.');
  return data;
};

module.exports = {
  signUpWithEmail,
  signInWithEmail,
  findProfileByEmail,
  findProfileById,
  createProfile,
};
