import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../hooks/useAuth';
import { createBid, getProjectBids, acceptBid } from '../services/bidService';
import { getProjectById } from '../services/projectService';
import { formatDisplayDate } from '../utils/formatDate';
import { formatRupees } from '../utils/formatCurrency';

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bidForm, setBidForm] = useState({ bid_amount: '', estimated_timeline: '', proposal_message: '' });
  const [submittingBid, setSubmittingBid] = useState(false);

  const isClientOwner = user?.role === 'client' && user?.id === project?.client_id;
  const isFreelancer = user?.role === 'freelancer';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const projectData = await getProjectById(projectId);
      setProject(projectData);

      if (user) {
        const bidData = await getProjectBids(projectId);
        setBids(bidData);
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to load project details.');
    } finally {
      setLoading(false);
    }
  }, [projectId, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBidChange = (event) => {
    setBidForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmitBid = async (event) => {
    event.preventDefault();
    setSubmittingBid(true);
    setError('');

    try {
      await createBid({
        project_id: projectId,
        bid_amount: Number(bidForm.bid_amount),
        estimated_timeline: bidForm.estimated_timeline,
        proposal_message: bidForm.proposal_message,
      });
      setBidForm({ bid_amount: '', estimated_timeline: '', proposal_message: '' });
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Could not submit bid.');
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleAcceptBid = async (bidId) => {
    try {
      await acceptBid(bidId);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Could not accept bid.');
    }
  };

  if (loading) return <div className="py-24 text-center text-sm text-[color:var(--text-muted)]">Loading project...</div>;
  if (!project) return <div className="py-24 text-center text-sm text-[color:var(--text-muted)]">Project not found.</div>;

  return (
    <section className="worksy-section">
      <div className="mx-auto grid w-full max-w-[1200px] gap-6 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <p className="worksy-kicker">Project Detail</p>
          <h1 className="worksy-title">{project.title}</h1>
          <p className="mt-4 text-sm text-[color:var(--text-muted)]">{project.description}</p>

          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-[color:var(--dark-green)]">
            {(project.required_skills || []).map((skill) => (
              <span key={skill} className="rounded-full bg-[color:var(--bg-light)] px-3 py-1">
                {skill}
              </span>
            ))}
          </div>

          <div className="mt-6 grid gap-3 text-sm text-[color:var(--text-muted)] sm:grid-cols-2">
            <p>Budget: {formatRupees(project.budget)}</p>
            <p>Deadline: {formatDisplayDate(project.deadline)}</p>
            <p>Status: {project.status}</p>
            <p>Client ID: {project.client_id}</p>
          </div>
        </Card>

        <div className="space-y-6">
          {isFreelancer ? (
            <Card>
              <p className="worksy-kicker">Place Bid</p>
              <form className="mt-4 space-y-4" onSubmit={handleSubmitBid}>
                <label className="worksy-label">
                  Bid amount
                  <input className="worksy-input" type="number" min="1" name="bid_amount" value={bidForm.bid_amount} onChange={handleBidChange} required />
                </label>
                <label className="worksy-label">
                  Estimated timeline
                  <input className="worksy-input" name="estimated_timeline" value={bidForm.estimated_timeline} onChange={handleBidChange} placeholder="e.g. 6 weeks" required />
                </label>
                <label className="worksy-label">
                  Proposal message
                  <textarea className="worksy-input min-h-28" name="proposal_message" value={bidForm.proposal_message} onChange={handleBidChange} required />
                </label>
                <PrimaryButton type="submit" disabled={submittingBid} className="w-full justify-center">
                  {submittingBid ? 'Submitting...' : 'Place Bid'}
                </PrimaryButton>
              </form>
            </Card>
          ) : null}

          <Card>
            <p className="worksy-kicker">Bids</p>
            <div className="mt-4 space-y-3">
              {bids.length === 0 ? <p className="text-sm text-[color:var(--text-muted)]">No bids yet.</p> : null}
              {bids.map((bid) => (
                <div key={bid.id} className="rounded-xl border border-[color:var(--dark-green)]/10 p-4">
                  <p className="text-sm font-semibold text-[color:var(--primary-green)]">Amount: {formatRupees(bid.bid_amount)}</p>
                  <p className="text-xs text-[color:var(--text-muted)]">Timeline: {bid.timeline}</p>
                  <p className="mt-2 text-sm text-[color:var(--text-muted)]">{bid.proposal}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.1em] text-[color:var(--text-muted)]">{bid.status}</p>

                  {isClientOwner && bid.status === 'pending' ? (
                    <PrimaryButton className="mt-3" onClick={() => handleAcceptBid(bid.id)}>
                      Accept Freelancer
                    </PrimaryButton>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
