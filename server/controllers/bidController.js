const {
  createBid,
  getBidsByProject,
  getBidByProjectAndFreelancer,
  getBidsByFreelancer,
  getBidById,
  updateBidById,
} = require('../models/bidModel');
const { getProjectById, updateProjectById } = require('../models/projectModel');

const createBidHandler = async (req, res, next) => {
  try {
    const { project_id, bid_amount, estimated_timeline, proposal_message } = req.body;

    if (!project_id || !bid_amount || !estimated_timeline || !proposal_message) {
      return res.status(400).json({ message: 'Missing required bid fields.' });
    }

    const project = await getProjectById(project_id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (project.status !== 'open') {
      return res.status(400).json({ message: 'Bids are closed for this project.' });
    }

    const existing = await getBidByProjectAndFreelancer(project_id, req.user.id);
    if (existing) {
      return res.status(409).json({ message: 'You have already placed a bid for this project.' });
    }

    const bid = await createBid({
      project_id,
      freelancer_id: req.user.id,
      bid_amount,
      timeline: estimated_timeline,
      proposal: proposal_message,
      status: 'pending',
    });

    return res.status(201).json(bid);
  } catch (error) {
    return next(error);
  }
};

const getBidsByProjectHandler = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const project = await getProjectById(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const bids = await getBidsByProject(projectId);
    return res.status(200).json(bids);
  } catch (error) {
    return next(error);
  }
};

const getMyBidsHandler = async (req, res, next) => {
  try {
    const bids = await getBidsByFreelancer(req.user.id);
    return res.status(200).json(bids);
  } catch (error) {
    return next(error);
  }
};

const selectBidForProjectHandler = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const bidId = req.body.bid_id || req.body.bidId;

    if (!bidId) {
      return res.status(400).json({ message: 'bid_id is required.' });
    }

    const bid = await getBidById(bidId);
    if (!bid || bid.project_id !== projectId) {
      return res.status(404).json({ message: 'Bid not found for this project.' });
    }

    const project = await getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (project.client_id !== req.user.id) {
      return res.status(403).json({ message: 'Only project owner can select bids.' });
    }

    const acceptedBid = await updateBidById(bidId, { status: 'accepted', work_status: 'in_progress' });

    const projectUpdate = await updateProjectById(project.id, {
      status: 'in_progress',
    });

    const allBids = await getBidsByProject(project.id);
    await Promise.all(
      allBids
        .filter((currentBid) => currentBid.id !== acceptedBid.id && currentBid.status !== 'accepted')
        .map((currentBid) => updateBidById(currentBid.id, { status: 'rejected' }))
    );

    return res.status(200).json({
      message: 'Bid selected successfully.',
      project: projectUpdate,
      acceptedBid,
    });
  } catch (error) {
    return next(error);
  }
};

const acceptBidHandler = async (req, res, next) => {
  try {
    const bidId = req.params.id;
    const bid = await getBidById(bidId);

    if (!bid) {
      return res.status(404).json({ message: 'Bid not found.' });
    }

    const project = await getProjectById(bid.project_id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (project.client_id !== req.user.id) {
      return res.status(403).json({ message: 'Only project owner can accept bids.' });
    }

    const acceptedBid = await updateBidById(bidId, { status: 'accepted', work_status: 'in_progress' });

    const projectUpdate = await updateProjectById(project.id, {
      status: 'in_progress',
    });

    const allBids = await getBidsByProject(project.id);
    await Promise.all(
      allBids
        .filter((currentBid) => currentBid.id !== acceptedBid.id && currentBid.status !== 'accepted')
        .map((currentBid) => updateBidById(currentBid.id, { status: 'rejected' }))
    );

    return res.status(200).json({
      message: 'Freelancer assigned successfully.',
      project: projectUpdate,
      acceptedBid,
    });
  } catch (error) {
    return next(error);
  }
};

const rejectBidHandler = async (req, res, next) => {
  try {
    const bidId = req.params.id;
    const bid = await getBidById(bidId);

    if (!bid) {
      return res.status(404).json({ message: 'Bid not found.' });
    }

    const project = await getProjectById(bid.project_id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (project.client_id !== req.user.id) {
      return res.status(403).json({ message: 'Only project owner can reject bids.' });
    }

    const updated = await updateBidById(bidId, { status: 'rejected' });
    return res.status(200).json({ message: 'Bid rejected successfully.', bid: updated });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createBidHandler,
  getBidsByProjectHandler,
  getMyBidsHandler,
  selectBidForProjectHandler,
  acceptBidHandler,
  rejectBidHandler,
};
