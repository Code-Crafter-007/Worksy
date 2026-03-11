import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Proposal } from "../types";

export default function MyProposals(): JSX.Element {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProposals();
    }, []);

    const fetchProposals = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('proposals')
            .select('*, job:jobs(*)')
            .eq('freelancer_id', user.id);

        if (error) console.error('Error fetching proposals:', error);
        else setProposals(data as Proposal[]);
        setLoading(false);
    };

    return (
        <div className="dash-container">
            <section className="dash-hero">
                <h1>My Proposals</h1>
                <p>Track your job applications.</p>
            </section>

            <div className="proposals-list">
                {loading ? <p>Loading...</p> : proposals.map((p) => (
                    <div key={p.id} className="proposal-card">
                        <h4>{p.job ? (p.job as any).title : 'Unknown Job'}</h4>
                        <p><strong>Status:</strong> <span className={`status-${p.status}`}>{p.status}</span></p>
                        <p><strong>Bid Amount:</strong> ${p.bid_amount}</p>
                        <p><strong>Cover Letter:</strong> {p.cover_letter}</p>
                        <small>Applied on: {new Date(p.created_at).toLocaleDateString()}</small>
                    </div>
                ))}
                {!loading && proposals.length === 0 && <p>No proposals found.</p>}
            </div>
        </div>
    );
}
