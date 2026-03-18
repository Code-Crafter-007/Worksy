import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { getProjectById } from '../services/projectService';
import { createBid } from '../services/bidService';
import { formatDisplayDate } from '../utils/formatDate';
import { formatRupees } from '../utils/formatCurrency';

export default function FreelancerProjectDetailPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [timeline, setTimeline] = useState('');
  const [proposal, setProposal] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProject = async () => {
      try {
        const data = await getProjectById(projectId);
        setProject(data);
      } catch (apiError) {
        setError(apiError.response?.data?.message || 'Could not load project.');
      }
    };

    loadProject();
  }, [projectId]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await createBid(projectId, { bid_amount: Number(bidAmount), timeline, proposal });
      setMessage('Proposal submitted successfully.');
      setBidAmount('');
      setTimeline('');
      setProposal('');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Could not submit proposal.');
    }
  };

  if (!project) {
    return (
      <section className="worksy-section">
        <div className="mx-auto w-full max-w-[900px] px-5 sm:px-8">
          <p className="text-sm text-[color:var(--text-muted)]">Loading project...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="worksy-section">
      <div className="mx-auto grid w-full max-w-[1000px] gap-5 px-5 sm:px-8 lg:grid-cols-2">
        <Card className="space-y-3">
          <p className="worksy-kicker">Freelancer Project View</p>
          <h1 className="worksy-title">{project.title}</h1>
          <p className="text-sm text-[color:var(--text-muted)]">{project.description}</p>
          <div className="grid gap-2 text-sm">
            <p className="font-semibold text-[color:var(--primary-green)]">Budget: {formatRupees(project.budget)}</p>
            <p className="font-semibold text-[color:var(--primary-green)]">Deadline: {formatDisplayDate(project.deadline)}</p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-[color:var(--primary-green)]">Submit Proposal</h2>
          {message ? <p className="mt-2 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

          <form className="mt-4 space-y-4" onSubmit={onSubmit}>
            <label className="worksy-label" htmlFor="bidAmount">
              Bid Amount
            </label>
            <input
              id="bidAmount"
              className="worksy-input"
              type="number"
              min="1"
              required
              value={bidAmount}
              onChange={(event) => setBidAmount(event.target.value)}
            />

            <label className="worksy-label" htmlFor="timeline">
              Timeline
            </label>
            <input
              id="timeline"
              className="worksy-input"
              type="text"
              required
              value={timeline}
              onChange={(event) => setTimeline(event.target.value)}
            />

            <label className="worksy-label" htmlFor="proposal">
              Proposal
            </label>
            <textarea
              id="proposal"
              className="worksy-input min-h-[130px]"
              required
              value={proposal}
              onChange={(event) => setProposal(event.target.value)}
            />

            <PrimaryButton type="submit">Submit Proposal</PrimaryButton>
          </form>
        </Card>
      </div>
    </section>
  );
}
