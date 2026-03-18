import api from './api';

export const createBid = async (projectOrPayload, payload) => {
  const rawPayload =
    typeof projectOrPayload === 'object' && projectOrPayload !== null
      ? projectOrPayload
      : { ...payload, project_id: projectOrPayload };

  const normalizedPayload = {
    ...rawPayload,
    estimated_timeline: rawPayload.estimated_timeline ?? rawPayload.timeline,
    proposal_message: rawPayload.proposal_message ?? rawPayload.proposal,
  };

  const { data } = await api.post('/bids', normalizedPayload);
  return data;
};

export const getProjectBids = async (projectId) => {
  const { data } = await api.get(`/projects/${projectId}/bids`);
  return data;
};

export const acceptBid = async (bidId) => {
  const { data } = await api.patch(`/bids/${bidId}/accept`);
  return data;
};

export const selectBidForProject = async (projectId, bidId) => {
  const { data } = await api.post(`/projects/${projectId}/select-bid`, { bid_id: bidId });
  return data;
};

export const rejectBid = async (bidId) => {
  const { data } = await api.patch(`/bids/${bidId}/reject`);
  return data;
};

export const getMyBids = async () => {
  const { data } = await api.get('/bids/me');
  return data;
};
