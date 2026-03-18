const express = require('express');
const {
  createProjectHandler,
  getProjectsHandler,
  getProjectByIdHandler,
  getClientProjectsHandler,
  updateProjectHandler,
  deleteProjectHandler,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles, requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', getProjectsHandler);
router.get('/client', protect, requireRole('client'), getClientProjectsHandler);
router.get('/mine', protect, authorizeRoles('client'), getClientProjectsHandler);
router.get('/:id', getProjectByIdHandler);
router.post('/', protect, authorizeRoles('client'), createProjectHandler);
router.put('/:id', protect, authorizeRoles('client'), updateProjectHandler);
router.patch('/:id', protect, authorizeRoles('client'), updateProjectHandler);
router.delete('/:id', protect, authorizeRoles('client'), deleteProjectHandler);

module.exports = router;
