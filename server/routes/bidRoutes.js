const express = require('express');
const {
  createBidHandler,
  getBidsByProjectHandler,
  getMyBidsHandler,
  selectBidForProjectHandler,
  acceptBidHandler,
  rejectBidHandler,
} = require('../controllers/bidController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles, requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/bids', protect, requireRole('freelancer'), createBidHandler);
router.get('/bids/me', protect, requireRole('freelancer'), getMyBidsHandler);
router.get('/projects/:id/bids', protect, getBidsByProjectHandler);
router.post('/projects/:id/select-bid', protect, requireRole('client'), selectBidForProjectHandler);
router.patch('/bids/:id/accept', protect, authorizeRoles('client'), acceptBidHandler);
router.patch('/bids/:id/reject', protect, authorizeRoles('client'), rejectBidHandler);

module.exports = router;
