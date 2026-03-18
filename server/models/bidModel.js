const supabase = require('../config/supabase');

const encodeProposal = ({ estimated_timeline, proposal_message }) =>
  `[Timeline] ${estimated_timeline}\n${proposal_message}`;

const decodeProposal = (coverLetter = '') => {
  const match = coverLetter.match(/^\[Timeline\]\s*(.*)\n([\s\S]*)$/);

  if (!match) {
    return { timeline: 'Not specified', proposal: coverLetter };
  }

  return {
    timeline: match[1] || 'Not specified',
    proposal: match[2] || '',
  };
};

const mapProposalToBid = (proposalRecord) => {
  const decoded = decodeProposal(proposalRecord.cover_letter);

  return {
    id: proposalRecord.id,
    project_id: proposalRecord.job_id,
    freelancer_id: proposalRecord.freelancer_id,
    bid_amount: proposalRecord.bid_amount,
    timeline: decoded.timeline,
    proposal: decoded.proposal,
    status: proposalRecord.status,
    created_at: proposalRecord.created_at,
  };
};

const createBid = async (bid) => {
  const { data, error } = await supabase
    .from('proposals')
    .insert([
      {
        job_id: bid.project_id,
        freelancer_id: bid.freelancer_id,
        bid_amount: bid.bid_amount,
        cover_letter: encodeProposal({
          estimated_timeline: bid.timeline,
          proposal_message: bid.proposal,
        }),
        status: bid.status,
      },
    ])
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapProposalToBid(data);
};

const getBidsByProject = async (projectId) => {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('job_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapProposalToBid);
};

const getBidByProjectAndFreelancer = async (projectId, freelancerId) => {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('job_id', projectId)
    .eq('freelancer_id', freelancerId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapProposalToBid(data) : null;
};

const getBidsByFreelancer = async (freelancerId) => {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('freelancer_id', freelancerId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapProposalToBid);
};

const getBidById = async (id) => {
  const { data, error } = await supabase.from('proposals').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapProposalToBid(data) : null;
};

const updateBidById = async (id, updates) => {
  const { data, error } = await supabase.from('proposals').update(updates).eq('id', id).select('*').single();
  if (error) throw new Error(error.message);
  return mapProposalToBid(data);
};

module.exports = {
  createBid,
  getBidsByProject,
  getBidByProjectAndFreelancer,
  getBidsByFreelancer,
  getBidById,
  updateBidById,
};
