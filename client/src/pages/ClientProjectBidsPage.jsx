import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { getProjectBids, selectBidForProject, rejectBid } from '../services/bidService';
import { formatRupees } from '../utils/formatCurrency';

export default function ClientProjectBidsPage() {
  const { projectId } = useParams();
  const [bids, setBids] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadBids = async () => {
      try {
        const data = await getProjectBids(projectId);
        if (!cancelled) {
          setBids(data);
        }
      } catch (apiError) {
        if (!cancelled) {
          setError(apiError.response?.data?.message || 'Could not load bids.');
        }
      }
    };

    loadBids();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const refreshBids = async () => {
    const data = await getProjectBids(projectId);
    setBids(data);
  };

  const onAccept = async (bidId) => {
    try {
      await selectBidForProject(projectId, bidId);
      await refreshBids();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Could not accept bid.');
    }
  };

  const onReject = async (bidId) => {
    try {
      await rejectBid(bidId);
      await refreshBids();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Could not reject bid.');
    }
  };

  return (
    <section className="worksy-section">
      <div className="mx-auto w-full max-w-[1000px] px-5 sm:px-8">
        <div className="mb-6">
          <p className="worksy-kicker">Client</p>
          <h1 className="worksy-title">Project Bids</h1>
        </div>

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        <div className="space-y-4">
          {bids.map((bid) => (
            <Card key={bid.id} className="space-y-3">
              <p className="worksy-kicker">{bid.status}</p>
              <p className="text-sm font-semibold text-[color:var(--primary-green)]">Bid Amount: {formatRupees(bid.bid_amount)}</p>
              <p className="text-xs text-[color:var(--text-muted)]">Timeline: {bid.timeline}</p>
              <p className="text-sm text-[color:var(--text-muted)]">{bid.proposal}</p>

              <div className="flex flex-wrap gap-2">
                <PrimaryButton onClick={() => onAccept(bid.id)} disabled={bid.status === 'accepted'}>
                  Accept Bid
                </PrimaryButton>
                <button className="worksy-secondary-btn" onClick={() => onReject(bid.id)} disabled={bid.status === 'accepted'}>
                  Reject Bid
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
