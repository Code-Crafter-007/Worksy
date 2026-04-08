import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import "./Findwork.css";
import ShinyText from "../Components/ShinyText";
import BlurText from "../Components/BlurText";

export default function FindWork(): JSX.Element {
    const [jobs, setJobs] = useState<any[]>([]);
    const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
    const [userSkills, setUserSkills] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [minBudget, setMinBudget] = useState("");
    const [maxBudget, setMaxBudget] = useState("");
    const [skillFilter, setSkillFilter] = useState("");
    const [activeTab, setActiveTab] = useState<'all' | 'recommended' | 'saved'>('all');

    // Modals
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [bidAmount, setBidAmount] = useState("");
    const [timeline, setTimeline] = useState("");
    const [coverLetter, setCoverLetter] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const channelRef = useRef<any>(null);

    useEffect(() => {
        fetchJobsAndProfile(true);

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, []);

    const fetchJobsAndProfile = async (setupRealtime = false) => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id ?? null);
        
        // Fetch Profile for Recommendations
        if (user) {
            const { data: profData } = await supabase.from('profiles').select('skills').eq('id', user.id).single();
            if (profData?.skills) setUserSkills(profData.skills);
            
            // Fetch Saved Jobs
            const { data: savedData } = await supabase.from('saved_jobs').select('job_id').eq('freelancer_id', user.id);
            if (savedData) setSavedJobIds(savedData.map(s => s.job_id));
        }

        // Fetch Jobs + nested bids + client profiles (if possible)
        const { data, error } = await supabase
            .from('jobs')
            .select(`
              *,
              proposals (id),
              client:profiles!client_id(full_name, avatar_url)
            `)
            .eq('status', 'open')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setJobs(data);
        }

        if (user && setupRealtime) {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }

            channelRef.current = supabase
                .channel(`find-work:${user.id}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
                    fetchJobsAndProfile(false);
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'proposals' }, () => {
                    fetchJobsAndProfile(false);
                })
                .subscribe();
        }

        setLoading(false);
    };

    const toggleSaveJob = async (e: React.MouseEvent, jobId: string) => {
        e.stopPropagation();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return alert("Must be logged in");

        if (savedJobIds.includes(jobId)) {
            // Unsave
            await supabase.from('saved_jobs').delete().match({ freelancer_id: user.id, job_id: jobId });
            setSavedJobIds(savedJobIds.filter(id => id !== jobId));
        } else {
            // Save
            await supabase.from('saved_jobs').insert([{ freelancer_id: user.id, job_id: jobId }]);
            setSavedJobIds([...savedJobIds, jobId]);
        }
    };

    const handleBidSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !selectedJob) return;

        const { data: existingProposal } = await supabase
            .from('proposals')
            .select('id')
            .eq('job_id', selectedJob.id)
            .eq('freelancer_id', user.id)
            .maybeSingle();

        if (existingProposal) {
            alert("You already placed a bid for this project.");
            setSubmitting(false);
            return;
        }

        const combinedCoverLetter = timeline.trim()
            ? `Timeline: ${timeline.trim()}\n\n${coverLetter.trim()}`
            : coverLetter.trim();

        const { error } = await supabase.from('proposals').insert([{
            job_id: selectedJob.id,
            freelancer_id: user.id,
            bid_amount: Number(bidAmount),
            cover_letter: combinedCoverLetter,
            status: 'pending'
        }]);

        if (error) {
            alert("Error submitting bid: " + error.message);
        } else {
            await supabase.from('activity_logs').insert([{
                user_id: user.id,
                action_type: 'bid_placed',
                description: `You placed a ₹${bidAmount} bid on ${selectedJob.title}`,
            }]);
            
            alert("Bid submitted successfully!");
            setSelectedJob(null);
            setBidAmount(""); setTimeline(""); setCoverLetter("");
            fetchJobsAndProfile();
        }
        setSubmitting(false);
    };

    const calculateScore = (jobSkills: string[] | string) => {
        if (!jobSkills) return 0;
        const jobSkillArr = Array.isArray(jobSkills) ? jobSkills : jobSkills.split(',').map(s=>s.trim());
        const matchCount = jobSkillArr.filter(s => userSkills.map(us=>us.toLowerCase()).includes(s.toLowerCase())).length;
        return matchCount;
    };

    // Derived Lists
    let filteredJobs = jobs.filter(j => {
        if (searchTerm && !j.title.toLowerCase().includes(searchTerm.toLowerCase()) && !j.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (minBudget && j.budget < Number(minBudget)) return false;
        if (maxBudget && j.budget > Number(maxBudget)) return false;
        if (skillFilter) {
            const reqSkills = Array.isArray(j.skills_required) ? j.skills_required.join(' ') : (j.skills_required || "");
            if (!reqSkills.toLowerCase().includes(skillFilter.toLowerCase())) return false;
        }
        return true;
    });

    if (activeTab === 'saved') {
        filteredJobs = filteredJobs.filter(j => savedJobIds.includes(j.id));
    } else if (activeTab === 'recommended') {
        filteredJobs = filteredJobs.filter(j => calculateScore(j.skills_required) > 0).sort((a,b) => calculateScore(b.skills_required) - calculateScore(a.skills_required));
    }

    const timeAgo = (dateString: string) => {
        const hours = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60));
        if (hours < 24) return `${hours || 1} hrs ago`;
        return `${Math.floor(hours/24)} days ago`;
    };

    return (
        <div className="dash-container find-work-container">
            <div className="dash-hero" style={{marginBottom: "30px"}}>
                <h1><ShinyText text="Find Work" speed={3} /></h1>
                <p><BlurText text="Discover opportunities, apply your skills, and grow your freelance career." delay={0.1} /></p>
            </div>

            <div className="filters-section panel-card">
                <div className="search-bar">
                    <input type="text" placeholder="Search for jobs (e.g. React Developer)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="filter-row">
                    <input type="number" placeholder="Min Budget (₹)" value={minBudget} onChange={e => setMinBudget(e.target.value)} className="filter-input" />
                    <input type="number" placeholder="Max Budget (₹)" value={maxBudget} onChange={e => setMaxBudget(e.target.value)} className="filter-input" />
                    <input type="text" placeholder="Filter by Skill" value={skillFilter} onChange={e => setSkillFilter(e.target.value)} className="filter-input" />
                </div>
                
                <div className="fw-tabs mt-4">
                    <button className={activeTab === 'all' ? 'fw-tab active' : 'fw-tab'} onClick={() => setActiveTab('all')}>All Projects</button>
                    <button className={activeTab === 'recommended' ? 'fw-tab active' : 'fw-tab'} onClick={() => setActiveTab('recommended')}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        Recommended
                    </button>
                    <button className={activeTab === 'saved' ? 'fw-tab active' : 'fw-tab'} onClick={() => setActiveTab('saved')}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                        Saved Jobs
                    </button>
                </div>
            </div>

            <div className="jobs-list">
                {loading ? (
                    <div className="fw-loading">
                        <div className="fw-spinner" />
                        <span>Fetching jobs…</span>
                    </div>
                ) : filteredJobs.map(job => {
                    const skillList = Array.isArray(job.skills_required) ? job.skills_required : (job.skills_required || "").split(',');
                    const bidCount = job.proposals ? job.proposals.length : 0;
                    const isSaved = savedJobIds.includes(job.id);
                    const clientName = job.client?.full_name || 'Client';

                    return (
                        <div key={job.id} className="job-card panel-card fade-in" onClick={() => setSelectedJob(job)}>
                            <div className="job-card-header">
                                <div className="client-avatar-lockup">
                                    <div className="c-avatar">{clientName.charAt(0)}</div>
                                    <div className="c-info">
                                        <h4>{job.title}</h4>
                                        <p className="posted-time">Posted {timeAgo(job.created_at)} by {clientName}</p>
                                    </div>
                                </div>
                                <div className="job-top-actions">
                                    <button className="heart-btn" onClick={(e) => toggleSaveJob(e, job.id)} title={isSaved ? 'Unsave job' : 'Save job'}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: isSaved ? '#ef4444' : 'var(--text-muted)'}}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                                    </button>
                                </div>
                            </div>
                            
                            <p className="job-desc">{job.description}</p>
                            
                            <div className="job-tags">
                                {skillList.map((tag: string, i: number) => tag.trim() && (
                                    <span key={i} className="skill-tag">{tag.trim()}</span>
                                ))}
                            </div>
                            
                            <div className="job-meta-footer">
                                <div className="jm-left">
                                    <span className="budget-pill">₹{job.budget}</span>
                                    <span className="bid-count-pill">{bidCount} Bids so far</span>
                                    {activeTab === 'recommended' && calculateScore(job.skills_required) > 0 && (
                                        <span className="match-pill text-green">⭐ Top Match</span>
                                    )}
                                </div>
                                <button className="btn-primary-purple" onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }} disabled={currentUserId === job.client_id}>Place bid</button>
                            </div>
                        </div>
                    );
                })}
                {!loading && filteredJobs.length === 0 && <p className="text-gray text-center w-full">No jobs found matching your criteria.</p>}
            </div>

            {/* Bid Modal */}
            {selectedJob && (
                <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
                    <div className="modal-content large-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedJob(null)}>×</button>
                        <h2 style={{fontSize: '24px', marginBottom: '10px'}}>{selectedJob.title}</h2>
                        
                        <div className="modal-job-body">
                            <p className="modal-desc">{selectedJob.description}</p>
                            <div className="grid-2 mt-4 mb-4">
                                <div className="detail-box"><strong>Client Budget:</strong> ₹{selectedJob.budget}</div>
                                <div className="detail-box"><strong>Current Bids:</strong> {selectedJob.proposals?.length || 0}</div>
                            </div>
                            
                            <form onSubmit={handleBidSubmit} className="bid-form">
                                <h3>Submit your Proposal</h3>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label>Your Bid Amount (₹)</label>
                                        <input type="number" required value={bidAmount} onChange={e => setBidAmount(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Estimated Timeline</label>
                                        <input type="text" required placeholder="e.g. 2 weeks" value={timeline} onChange={e => setTimeline(e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Cover Letter</label>
                                    <textarea rows={5} required placeholder="Why are you the best fit?" value={coverLetter} onChange={e => setCoverLetter(e.target.value)}></textarea>
                                </div>
                                <button type="submit" className="submit-bid-btn" disabled={submitting}>
                                    {submitting ? "Submitting..." : `Submit Bid for ₹${bidAmount || 0}`}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
