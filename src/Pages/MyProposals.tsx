import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Proposal } from "../types";
import "./Proposals.css"; // We'll add some styles specifically for the new status selects

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
            .eq('freelancer_id', user.id)
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching proposals:', error);
        else setProposals(data as Proposal[]);
        setLoading(false);
    };

    const handleUpdateWorkStatus = async (proposalId: string, newStatus: string) => {
        const { error } = await supabase
            .from('proposals')
            .update({ work_status: newStatus })
            .eq('id', proposalId);
            
        if (error) {
            console.error('Error updating work status:', error);
            alert("Failed to update status. Have you added the work_status column to the proposals table yet?");
        } else {
            // Optimistically update the local state
            setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, work_status: newStatus } : p));
        }
    };

    return (
        <div className="dash-container">
            <section className="dash-hero">
                <h1>My Proposals</h1>
                <p>Track your job applications.</p>
            </section>

            <div className="proposals-list">
                {loading ? <p>Loading...</p> : proposals.map((p: any) => (
                    <div key={p.id} className="proposal-card">
                        <div className="proposal-header">
                            <h4>{p.job ? p.job.title : 'Unknown Job'}</h4>
                            <span className={`status-badge ${p.status}`}>{p.status}</span>
                        </div>
                        
                        <div className="proposal-details">
                            <p><strong>Bid:</strong> ${p.bid_amount}</p>
                            <p><strong>Budget:</strong> ${p.job?.budget || 'N/A'}</p>
                            <small>Applied: {new Date(p.created_at).toLocaleDateString()}</small>
                        </div>
                        
                        {/* Only show work status dropdown if proposal is accepted */}
                        {p.status === 'accepted' && (
                            <div className="work-status-section">
                                <label>Work Status:</label>
                                <select 
                                    value={p.work_status || 'not_started'} 
                                    onChange={(e) => handleUpdateWorkStatus(p.id, e.target.value)}
                                    className={`status-select ${p.work_status || 'not_started'}`}
                                >
                                    <option value="not_started">Not Started</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="submitted">Submitted</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        )}
                        
                    </div>
                ))}
                {!loading && proposals.length === 0 && <p>No proposals found.</p>}
            </div>
        </div>
    );
}
