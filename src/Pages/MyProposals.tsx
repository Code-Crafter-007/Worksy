import { useEffect, useRef, useState } from "react";
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

    // Submit Work Modal
    const [submitTarget, setSubmitTarget] = useState<any>(null);
    const [workUrl, setWorkUrl] = useState("");
    const [workNotes, setWorkNotes] = useState("");
    const channelRef = useRef<any>(null);
    const pollingRef = useRef<number | null>(null);
    const userIdRef = useRef<string | null>(null);
    const focusHandlerRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        initProposals();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }

            if (pollingRef.current) {
                window.clearInterval(pollingRef.current);
                pollingRef.current = null;
            }

            if (focusHandlerRef.current) {
                window.removeEventListener('focus', focusHandlerRef.current);
                focusHandlerRef.current = null;
            }
        };
    }, []);

    const initProposals = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        userIdRef.current = user.id;

        await fetchProposals(user.id);

        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        channelRef.current = supabase
            .channel(`my-proposals:${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'proposals' }, () => {
                fetchProposals(user.id, true);
            })
            .subscribe();

        // Fallback refresh in case Realtime for proposals is not configured.
        pollingRef.current = window.setInterval(() => {
            if (userIdRef.current) {
                fetchProposals(userIdRef.current, true);
            }
        }, 3500);

        const onWindowFocus = () => {
            if (userIdRef.current) {
                fetchProposals(userIdRef.current, true);
            }
        };
        if (focusHandlerRef.current) {
            window.removeEventListener('focus', focusHandlerRef.current);
        }
        focusHandlerRef.current = onWindowFocus;
        window.addEventListener('focus', onWindowFocus);
    };

    const fetchProposals = async (userId?: string, silent = false) => {
        if (!silent) setLoading(true);
        const resolvedUserId = userId || (await supabase.auth.getUser()).data.user?.id;
        if (!resolvedUserId) {
            if (!silent) setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('proposals')
            .select('*, job:jobs(*)')
            .eq('freelancer_id', resolvedUserId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching proposals:', error);
            if (!silent) setLoading(false);
            return;
        }
        
        if (data && data.length > 0) {
            const jobIds = data.map((d: any) => d.job_id);
            const { data: escrows } = await supabase.from('escrow_payments').select('project_id, status').in('project_id', jobIds).eq('freelancer_id', resolvedUserId);
            
            const enhancedData = data.map((d: any) => {
                const escrow = escrows?.find((e: any) => e.project_id === d.job_id);
                return { ...d, escrow_status: escrow?.status || 'none' };
            });
            setProposals(enhancedData);
        } else {
            setProposals([]);
        }

        if (!silent) setLoading(false);
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

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!submitTarget) return;

        setSubmitting(true);
        setProposals(prev => prev.map(p => p.id === submitTarget.id ? { ...p, work_status: 'submitted' } : p)); // Optimistic UI Update

        const { error } = await supabase
            .from('proposals')
            .update({ 
                work_status: 'submitted',
                delivered_work_url: workUrl,
                delivered_work_notes: workNotes
            })
            .eq('id', submitTarget.id)
            .select()
            .single();

        if (error) {
            alert("Database Error submitting work: " + error.message);
            fetchProposals(); // Revert optimistic changes
        } else {
            alert("Work officially submitted! The client can now review your deliverables and release the payment.");
            setSubmitTarget(null);
            setWorkUrl("");
            setWorkNotes("");
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

    const getTimelineFromCoverLetter = (coverLetter: string) => {
        const firstLine = (coverLetter || "").split("\n")[0]?.trim();
        if (firstLine?.toLowerCase().startsWith("timeline:")) {
            return firstLine.slice(9).trim();
        }
        return "";
    };

    const getWorkStatusLabel = (workStatus: string | null | undefined) => {
        if (workStatus === 'completed') return 'Completed';
        if (workStatus === 'submitted') return 'Submitted for review';
        if (workStatus === 'in_progress') return 'In progress';
        if (workStatus === 'not_started') return 'Not started';
        return 'Not started';
    };

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
                        <div className="col-header col-header--pending">
                            <h3>Pending Review <span className="count-badge count-badge--pending">{pending.length}</span></h3>
                        </div>
                        <div className="col-content">
                            {pending.map(p => (
                                <div key={p.id} className="prop-card prop-card-pending">
                                    <h4>{p.job?.title || 'Unknown Project'}</h4>
                                    <p className="prop-meta">Bid: ₹{p.bid_amount} | Budget: ₹{p.job?.budget}</p>
                                    {getTimelineFromCoverLetter(p.cover_letter) && <p className="prop-date">Timeline proposed: {getTimelineFromCoverLetter(p.cover_letter)}</p>}
                                    <p className="prop-date">Applied: {new Date(p.created_at).toLocaleDateString()}</p>
                                    <span className="badge badge-pending">Waiting for response</span>
                                </div>
                            ))}
                            {pending.length === 0 && <p className="empty-col">No pending bids</p>}
                        </div>
                    </div>

                    {/* ACCEPTED COLUMN */}
                    <div className="kanban-col">
                        <div className="col-header col-header--accepted">
                            <h3>Accepted <span className="count-badge count-badge--accepted">{accepted.length}</span></h3>
                        </div>
                        <div className="col-content">
                            {accepted.map(p => (
                                <div key={p.id} className="prop-card prop-card-accepted">
                                    <h4>{p.job?.title || 'Unknown Project'}</h4>
                                    <p className="prop-meta">Winning Bid: ₹{p.bid_amount}</p>
                                    {getTimelineFromCoverLetter(p.cover_letter) && <p className="prop-date">Agreed timeline: {getTimelineFromCoverLetter(p.cover_letter)}</p>}
                                    <span className="badge badge-accepted">Client hired you</span>
                                    <p className="prop-date text-green" style={{ marginTop: '8px' }}>Client action: Accepted</p>
                                    <p className="prop-date" style={{ marginTop: '8px' }}>Project status: {getWorkStatusLabel(p.work_status)}</p>
                                    
                                    <div style={{ marginTop: '12px' }}>
                                        {(p.escrow_status === 'none' || p.escrow_status === 'pending') && <span className="badge" style={{background: '#ffebee', color: '#c62828', display: 'inline-block'}}>Payment Pending</span>}
                                        {p.escrow_status === 'held' && <span className="badge" style={{background: '#e8f5e9', color: '#2e7d32', display: 'inline-block'}}>Payment Secured 🔒</span>}
                                        {p.escrow_status === 'released' && <span className="badge" style={{background: '#e0f7fa', color: '#006064', display: 'inline-block'}}>Payment Released ✓</span>}
                                    </div>
                                    
                                    {p.escrow_status === 'held' && p.work_status !== 'submitted' && p.work_status !== 'completed' && (
                                        <button onClick={() => setSubmitTarget(p)} className="btn-primary-purple" style={{width: '100%', marginTop: '15px', padding: '10px', fontSize: '14px', borderRadius: '8px'}}>
                                            Deliver Work 🚀
                                        </button>
                                    )}
                                    {p.work_status === 'submitted' && p.escrow_status !== 'released' && (
                                        <div style={{marginTop: '15px', padding: '8px', background: '#fff9c4', color: '#f57f17', textAlign: 'center', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold'}}>
                                            Under Client Review
                                        </div>
                                    )}
                                    
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
                        <div className="col-header col-header--rejected">
                            <h3>Rejected <span className="count-badge count-badge--rejected">{rejected.length}</span></h3>
                        </div>
                        <div className="col-content">
                            {rejected.map(p => (
                                <div key={p.id} className="prop-card prop-card-rejected">
                                    <h4>{p.job?.title || 'Unknown Project'}</h4>
                                    <p className="prop-meta">Bid: ₹{p.bid_amount}</p>
                                    {getTimelineFromCoverLetter(p.cover_letter) && <p className="prop-date">Your proposed timeline: {getTimelineFromCoverLetter(p.cover_letter)}</p>}
                                    <span className="badge badge-rejected mb-3">Not selected</span>
                                                                        <p className="prop-date text-red" style={{ marginBottom: '10px' }}>Client action: Rejected</p>
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
                    <button className="close-btn" onClick={() => setRevisingProposal(null)}>Ã—</button>
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
                    <button className="close-btn" onClick={() => setReviewModalOpen(false)}>Ã—</button>
                    <h2>Rate the Client</h2>
                    <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px' }}>
                      Leave a public review for this client. Let others know your experience!
                    </p>
                    <form onSubmit={handleReviewSubmit} className="bid-form">
                      <div className="form-group">
                        <label>Rating (1-5)</label>
                        <select value={rating} onChange={e => setRating(Number(e.target.value))} style={{background: 'rgba(255,255,255,0.05)', color: 'white', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)'}}>
                           <option value="5">â­â­â­â­â­ Excellent (5)</option>
                           <option value="4">â­â­â­â­ Good (4)</option>
                           <option value="3">â­â­â­ Neutral (3)</option>
                           <option value="2">â­â­ Poor (2)</option>
                           <option value="1">â­ Terrible (1)</option>
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

            {submitTarget && (
                <div className="modal-overlay" onClick={() => setSubmitTarget(null)}>
                  <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <button className="close-btn" onClick={() => setSubmitTarget(null)}>Ã—</button>
                    <h2>Deliver Work: {submitTarget.job?.title}</h2>
                    <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px', marginTop: '10px' }}>
                      Submit your final deliverables here. The client will review your work before releasing the escrow payment.
                    </p>
                    <form onSubmit={handleFinalSubmit} className="bid-form">
                      <div className="form-group">
                        <label>Deliverable URL (Google Drive, GitHub, Figma, etc.)</label>
                        <input type="url" placeholder="https://..." required value={workUrl} onChange={e => setWorkUrl(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Final Notes for Client</label>
                        <textarea required rows={4} placeholder="Hey! I have finished the wireframes..." value={workNotes} onChange={e => setWorkNotes(e.target.value)} />
                      </div>
                      <button type="submit" className="submit-bid-btn" disabled={submitting} style={{background: '#8A2BE2'}}>
                        {submitting ? "Submitting..." : "Submit Final Work"}
                      </button>
                    </form>
                  </div>
                </div>
            )}
        </div>
    );
}
