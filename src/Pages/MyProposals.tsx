import { type JSX } from "react";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./Proposals.css";
import ShinyText from "../Components/ShinyText";
import BlurText from "../Components/BlurText";

export default function MyProposals(): JSX.Element {
    const [proposals, setProposals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Revise Modal
    const [revisingProposal, setRevisingProposal] = useState<any>(null);
    const [bidAmount, setBidAmount] = useState("");
    const [coverNote, setCoverNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Reviews Modal
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewTarget, setReviewTarget] = useState<any>(null);
    const [rating, setRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");

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
        else setProposals(data || []);
        setLoading(false);
    };

    const handleRevise = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!revisingProposal) return;
        setSubmitting(true);
        
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from('proposals')
            .update({ 
                bid_amount: Number(bidAmount), 
                cover_letter: coverNote,
                status: 'pending' // Send it back to review
            })
            .eq('id', revisingProposal.id);
            
        if (error) {
            alert("Error updating proposal: " + error.message);
        } else {
            if (user) {
                await supabase.from('activity_logs').insert([{
                    user_id: user.id,
                    action_type: 'bid_updated',
                    description: `You revised your bid on ${revisingProposal.job?.title} to ₹${bidAmount}`,
                }]);
            }
            alert("Bid revised and sent back for review!");
            setRevisingProposal(null);
            fetchProposals();
        }
        setSubmitting(false);
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!reviewTarget) return;
        setSubmitting(true);
        const { data: { user } } = await supabase.auth.getUser();

        // reviewTarget is the proposal. Wait, job.client_id missing in some setups. Let's assume job object has it.
        const revieweeId = reviewTarget.job?.client_id || reviewTarget.job?.posted_by; 

        if(!user || !revieweeId) { alert("Missing client data to review."); setSubmitting(false); return; }

        const { error } = await supabase.from('reviews').insert([{
            reviewer_id: user.id,
            reviewee_id: revieweeId,
            job_id: reviewTarget.job_id,
            rating,
            comment: reviewComment
        }]);

        if (error) alert("Error submitting review: " + error.message);
        else {
            alert("Review submitted successfully!");
            setReviewModalOpen(false);
        }
        setSubmitting(false);
    };

    const pending = proposals.filter(p => p.status === 'pending');
    const accepted = proposals.filter(p => p.status === 'accepted');
    const rejected = proposals.filter(p => p.status === 'rejected');

    return (
        <div className="dash-container proposals-page" style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
            <div className="dash-hero" style={{ marginBottom: "50px", textAlign: 'center' }}>
                <h1 style={{ fontSize: '38px', fontWeight: 'bold' }}>
                    <ShinyText text="My Bids & Proposals" speed={3} />
                </h1>
                <p style={{ marginTop: '12px' }}>
                    <BlurText text="Monitor all your ongoing proposals, track accepted projects, and revise rejected bids." delay={0.2} />
                </p>
            </div>

            {loading ? <p style={{textAlign: 'center', color: '#888'}}>Loading tracker...</p> : (
                <div className="kanban-board">
                    {/* PENDING COLUMN */}
                    <div className="kanban-col">
                        <div className="col-header">
                            <h3>Pending Review <span className="count-badge">{pending.length}</span></h3>
                        </div>
                        <div className="col-content">
                            {pending.map(p => (
                                <div key={p.id} className="prop-card">
                                    <h4>{p.job?.title || 'Unknown Project'}</h4>
                                    <p className="prop-meta">Bid: ₹{p.bid_amount} | Budget: ₹{p.job?.budget}</p>
                                    <p className="prop-date">Applied: {new Date(p.created_at).toLocaleDateString()}</p>
                                    <span className="badge badge-pending">Waiting for response</span>
                                </div>
                            ))}
                            {pending.length === 0 && <p className="empty-col">No pending bids</p>}
                        </div>
                    </div>

                    {/* ACCEPTED COLUMN */}
                    <div className="kanban-col">
                        <div className="col-header">
                            <h3>Accepted <span className="count-badge">{accepted.length}</span></h3>
                        </div>
                        <div className="col-content">
                            {accepted.map(p => (
                                <div key={p.id} className="prop-card border-green">
                                    <h4>{p.job?.title || 'Unknown Project'}</h4>
                                    <p className="prop-meta">Winning Bid: ₹{p.bid_amount}</p>
                                    <span className="badge badge-accepted">Client hired you</span>
                                    
                                    {p.work_status === 'completed' && (
                                       <button 
                                          className="btn-outline-green w-full mt-12"
                                          onClick={() => { setReviewTarget(p); setReviewModalOpen(true); }}
                                       >
                                          Rate Client ⭐️
                                       </button>
                                    )}
                                </div>
                            ))}
                            {accepted.length === 0 && <p className="empty-col">No accepted bids yet</p>}
                        </div>
                    </div>

                    {/* REJECTED COLUMN */}
                    <div className="kanban-col">
                        <div className="col-header">
                            <h3>Rejected <span className="count-badge">{rejected.length}</span></h3>
                        </div>
                        <div className="col-content">
                            {rejected.map(p => (
                                <div key={p.id} className="prop-card border-red">
                                    <h4>{p.job?.title || 'Unknown Project'}</h4>
                                    <p className="prop-meta">Bid: ₹{p.bid_amount}</p>
                                    <span className="badge badge-rejected mb-3">Not selected</span>
                                    <button 
                                      className="btn-outline-red w-full"
                                      onClick={() => {
                                        setRevisingProposal(p);
                                        setBidAmount(p.bid_amount.toString());
                                        setCoverNote(p.cover_letter || "");
                                      }}
                                    >
                                      Revise & rebid ↗
                                    </button>
                                </div>
                            ))}
                            {rejected.length === 0 && <p className="empty-col">No rejected bids</p>}
                        </div>
                    </div>
                </div>
            )}

            {revisingProposal && (
                <div className="modal-overlay" onClick={() => setRevisingProposal(null)}>
                  <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <button className="close-btn" onClick={() => setRevisingProposal(null)}>×</button>
                    <h2>Revise Bid for {revisingProposal.job?.title}</h2>
                    <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px', marginTop: '10px' }}>
                      Update your proposal to stand a better chance. It will be sent back to the client for review.
                    </p>
                    <form onSubmit={handleRevise} className="bid-form">
                      <div className="form-group">
                        <label>Updated Bid Amount (₹)</label>
                        <input type="number" required value={bidAmount} onChange={e => setBidAmount(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Updated Cover Note / Timeline</label>
                        <textarea required rows={5} value={coverNote} onChange={e => setCoverNote(e.target.value)} />
                      </div>
                      <button type="submit" className="submit-bid-btn" disabled={submitting}>
                        {submitting ? "Updating..." : "Resubmit Bid"}
                      </button>
                    </form>
                  </div>
                </div>
            )}

            {reviewModalOpen && reviewTarget && (
                <div className="modal-overlay" onClick={() => setReviewModalOpen(false)}>
                  <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <button className="close-btn" onClick={() => setReviewModalOpen(false)}>×</button>
                    <h2>Rate the Client</h2>
                    <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px' }}>
                      Leave a public review for this client. Let others know your experience!
                    </p>
                    <form onSubmit={handleReviewSubmit} className="bid-form">
                      <div className="form-group">
                        <label>Rating (1-5)</label>
                        <select value={rating} onChange={e => setRating(Number(e.target.value))} style={{background: 'rgba(255,255,255,0.05)', color: 'white', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)'}}>
                           <option value="5">⭐⭐⭐⭐⭐ Excellent (5)</option>
                           <option value="4">⭐⭐⭐⭐ Good (4)</option>
                           <option value="3">⭐⭐⭐ Neutral (3)</option>
                           <option value="2">⭐⭐ Poor (2)</option>
                           <option value="1">⭐ Terrible (1)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Public Review Comment</label>
                        <textarea required rows={4} value={reviewComment} onChange={e => setReviewComment(e.target.value)} />
                      </div>
                      <button type="submit" className="submit-bid-btn" disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit Review"}
                      </button>
                    </form>
                  </div>
                </div>
            )}
        </div>
    );
}
