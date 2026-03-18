const supabase = require('../config/supabase');

const mapJobToProject = (job) => ({
  id: job.id,
  client_id: job.client_id,
  title: job.title,
  description: job.description,
  budget: job.budget,
  deadline: job.deadline,
  status: job.status,
  required_skills: job.skills_required || [],
  assigned_freelancer_id: null,
  created_at: job.created_at,
});

const createProject = async (project) => {
  const insertPayload = {
    client_id: project.client_id,
    title: project.title,
    description: project.description,
    budget: project.budget,
    deadline: project.deadline,
    status: project.status,
    skills_required: project.required_skills || [],
  };

  const { data, error } = await supabase.from('jobs').insert([insertPayload]).select('*').single();
  if (error) throw new Error(error.message);
  return mapJobToProject(data);
};

const getProjects = async ({ search, status }) => {
  let query = supabase.from('jobs').select('*').order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const records = (data || []).map(mapJobToProject);

  if (search) {
    const normalized = search.toLowerCase();
    return records.filter(
      (project) =>
        project.title.toLowerCase().includes(normalized) ||
        project.description.toLowerCase().includes(normalized)
    );
  }

  return records;
};

const getProjectById = async (id) => {
  const { data, error } = await supabase.from('jobs').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapJobToProject(data) : null;
};

const getProjectsByClient = async (clientId) => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapJobToProject);
};

const updateProjectById = async (id, updates) => {
  const patch = { ...updates };

  if (patch.required_skills !== undefined) {
    patch.skills_required = patch.required_skills;
    delete patch.required_skills;
  }

  delete patch.assigned_freelancer_id;

  const { data, error } = await supabase.from('jobs').update(patch).eq('id', id).select('*').single();
  if (error) throw new Error(error.message);
  return mapJobToProject(data);
};

const deleteProjectById = async (id) => {
  const { error } = await supabase.from('jobs').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  getProjectsByClient,
  updateProjectById,
  deleteProjectById,
};
