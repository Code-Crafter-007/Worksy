const {
  createProject,
  getProjects,
  getProjectById,
  getProjectsByClient,
  updateProjectById,
  deleteProjectById,
} = require('../models/projectModel');
const { getBidsByProject } = require('../models/bidModel');

const createProjectHandler = async (req, res, next) => {
  try {
    const { title, description, required_skills, budget, deadline } = req.body;

    if (!title || !description || !budget || !deadline) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const project = await createProject({
      client_id: req.user.id,
      title,
      description,
      required_skills: Array.isArray(required_skills) ? required_skills : [],
      budget,
      deadline,
      status: 'open',
      assigned_freelancer_id: null,
    });

    return res.status(201).json(project);
  } catch (error) {
    return next(error);
  }
};

const getProjectsHandler = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const projects = await getProjects({ search, status });
    return res.status(200).json(projects);
  } catch (error) {
    return next(error);
  }
};

const getProjectByIdHandler = async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    return res.status(200).json(project);
  } catch (error) {
    return next(error);
  }
};

const getClientProjectsHandler = async (req, res, next) => {
  try {
    const projects = await getProjectsByClient(req.user.id);
    return res.status(200).json(projects);
  } catch (error) {
    return next(error);
  }
};

const updateProjectHandler = async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (project.client_id !== req.user.id) {
      return res.status(403).json({ message: 'Only project owner can edit this project.' });
    }

    const allowedFields = ['title', 'description', 'required_skills', 'budget', 'deadline', 'status'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updated = await updateProjectById(req.params.id, updates);
    return res.status(200).json(updated);
  } catch (error) {
    return next(error);
  }
};

const deleteProjectHandler = async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (project.client_id !== req.user.id) {
      return res.status(403).json({ message: 'Only project owner can delete this project.' });
    }

    const bids = await getBidsByProject(project.id);
    if (bids.length > 0) {
      return res.status(400).json({ message: 'Project cannot be deleted after receiving bids.' });
    }

    await deleteProjectById(project.id);
    return res.status(200).json({ message: 'Project deleted successfully.' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createProjectHandler,
  getProjectsHandler,
  getProjectByIdHandler,
  getClientProjectsHandler,
  updateProjectHandler,
  deleteProjectHandler,
};
