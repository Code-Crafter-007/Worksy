import { useEffect, useState } from 'react';
import Card from '../components/Card';
import { getMyBids } from '../services/bidService';
import { formatRupees } from '../utils/formatCurrency';

export default function FreelancerBidsPage() {
  const [bids, setBids] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadBids = async () => {
      try {
        const data = await getMyBids();
        setBids(data);
      } catch (apiError) {
        setError(apiError.response?.data?.message || 'Could not load your bids.');
      }
    };

    loadBids();
  }, []);

  return (
    <section className="worksy-section">
      <div className="mx-auto w-full max-w-[1000px] px-5 sm:px-8">
        <div className="mb-6">
          <p className="worksy-kicker">Freelancer</p>
          <h1 className="worksy-title">My Bids</h1>
        </div>

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        <div className="space-y-4">
          {bids.map((bid) => (
            <Card key={bid.id} className="space-y-2">
              <p className="worksy-kicker">{bid.status}</p>
              <h2 className="text-lg font-semibold text-[color:var(--primary-green)]">Project: {bid.project_title || 'Untitled'}</h2>
              <p className="text-sm font-semibold text-[color:var(--primary-green)]">Bid Amount: {formatRupees(bid.bid_amount)}</p>
              <p className="text-xs text-[color:var(--text-muted)]">Timeline: {bid.timeline}</p>
              <p className="text-sm text-[color:var(--text-muted)]">{bid.proposal}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
