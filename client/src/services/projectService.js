import api from './api';

export const getProjects = async (params = {}) => {
  const { data } = await api.get('/projects', { params });
  return data;
};

export const getAllProjects = async () => getProjects();

export const getProjectById = async (projectId) => {
  const { data } = await api.get(`/projects/${projectId}`);
  return data;
};

export const getClientProjects = async () => {
  const { data } = await api.get('/projects/client');
  return data;
};

export const createProject = async (payload) => {
  const { data } = await api.post('/projects', payload);
  return data;
};

export const updateProject = async (projectId, payload) => {
  const { data } = await api.put(`/projects/${projectId}`, payload);
  return data;
};

export const patchProject = async (projectId, payload) => {
  const { data } = await api.patch(`/projects/${projectId}`, payload);
  return data;
};

export const deleteProject = async (projectId) => {
  const { data } = await api.delete(`/projects/${projectId}`);
  return data;
};
