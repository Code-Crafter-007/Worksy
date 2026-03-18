import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./DashboardStyles.css";

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const diffHours = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60));
  if (diffHours < 24 && diffHours >= 0) {
    if (diffHours === 0) return 'Just now';
    return `${diffHours} hrs ago`;
  }
  if (diffHours < 48) return 'Yesterday';
  return new Date(dateString).toLocaleDateString();
}

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  
  // Overview Stats
  const [totalBids, setTotalBids] = useState(0);
  const [acceptedBids, setAcceptedBids] = useState(0);
  const [inProgressBids, setInProgressBids] = useState(0);
  const [earned, setEarned] = useState(0);

  // Active Project Data
  const [activeProject, setActiveProject] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);

  // Bid Tracker Data
  const [recentProposals, setRecentProposals] = useState<any[]>([]);

  // Activity Log
  const [activities, setActivities] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Phase C Modals
  const [isUpdateProgressOpen, setIsUpdateProgressOpen] = useState(false);
  const [isSubmitWorkOpen, setIsSubmitWorkOpen] = useState(false);
  
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [deliverableLink, setDeliverableLink] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch Profile
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (prof) setProfile(prof);

    // Fetch Proposals for stats & bid tracker
    const { data: allProposals } = await supabase
      .from('proposals')
      .select('*, job:jobs(*)')
      .eq('freelancer_id', user.id)
      .order('created_at', { ascending: false });

    if (allProposals) {
      setTotalBids(allProposals.length);
      
      const accepted = allProposals.filter(p => p.status === 'accepted');
      setAcceptedBids(accepted.length);
      
      const inProg = allProposals.filter(p => p.work_status === 'in_progress');
      setInProgressBids(inProg.length);

      const completed = allProposals.filter(p => p.work_status === 'completed');
      const totalEarned = completed.reduce((sum, p) => sum + p.bid_amount, 0);
      setEarned(totalEarned || accepted.reduce((sum, p) => sum + p.bid_amount, 0));

      setRecentProposals(allProposals.slice(0, 3)); // top 3 for tracker

      // Get latest active project for the left column
      const latestActive = allProposals.find(p => p.status === 'accepted' && p.work_status !== 'completed');
      if (latestActive) {
        setActiveProject(latestActive);
        // Fetch specific milestones for this proposal
        const { data: mData } = await supabase.from('milestones').select('*').eq('proposal_id', latestActive.id).order('created_at', { ascending: true });
        setMilestones(mData || []);
      }
    }

    // Fetch Activity Log
    const { data: actData } = await supabase.from('activity_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4);
    if (actData) setActivities(actData);

    setLoading(false);
  };

  const calculateProgress = () => {
    if (!milestones || milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.status === 'completed').length;
    return Math.round((completed / milestones.length) * 100);
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !newMilestoneTitle) return;
    
    // Add to supabase
    const { error } = await supabase.from('milestones').insert([{
      proposal_id: activeProject.id,
      title: newMilestoneTitle,
      status: 'not_started' // 'not_started', 'in_progress', 'completed'
    }]);

    if (error) alert("Could not add milestone: " + error.message);
    else {
      setNewMilestoneTitle("");
      // Refetch just milestones
      const { data } = await supabase.from('milestones').select('*').eq('proposal_id', activeProject.id).order('created_at', { ascending: true });
      if(data) setMilestones(data);
    }
  };

  const handleToggleMilestone = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'not_started' ? 'in_progress' : currentStatus === 'in_progress' ? 'completed' : 'not_started';
    
    const { error } = await supabase.from('milestones').update({ status: nextStatus }).eq('id', id);
    if (!error) {
      setMilestones(milestones.map(m => m.id === id ? { ...m, status: nextStatus } : m));
    }
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !deliverableLink) return;
    
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('proposals')
      .update({ work_status: 'submitted' })
      .eq('id', activeProject.id);

    if (error) alert("Error submitting work: " + error.message);
    else {
        if(user) {
            await supabase.from('activity_logs').insert([{
                user_id: user.id,
                action_type: 'work_submitted',
                description: `You submitted deliverables to ${activeProject.job?.title}`
            }]);
        }
        alert("Work submitted successfully for client review!");
        setIsSubmitWorkOpen(false);
        setDeliverableLink("");
        fetchDashboardData();
    }
  };

  if (loading) return <div className="dashboard"><p style={{padding: '40px'}}>Loading layout...</p></div>;

  return (
    <div className="dashboard-grid-page">
      <div className="dash-header-profile">
        <h2>{profile?.full_name || 'Freelancer'}</h2>
      </div>

      <p className="section-label">OVERVIEW</p>
      
      <div className="overview-stats">
        <div className="stat-card">
          <span className="stat-label">Total bids</span>
          <span className="stat-value">{totalBids}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Accepted</span>
          <span className="stat-value text-green">{acceptedBids}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">In progress</span>
          <span className="stat-value text-blue">{inProgressBids}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Earned (₹)</span>
          <span className="stat-value">{earned.toLocaleString()}</span>
        </div>
      </div>

      <div className="dashboard-two-cols">
        {/* LEFT COLUMN: ACTIVE PROJECT */}
        <div className="dash-column">
          <p className="section-label">ACTIVE PROJECT</p>
          <div className="panel-card active-project-panel">
            {activeProject ? (
              <>
                <div className="panel-header">
                  <h3>{activeProject.job?.title || 'Unknown Project'}</h3>
                  <span className="badge badge-active">{activeProject.work_status === 'submitted' ? 'Waiting Review' : 'Active'}</span>
                </div>
                <p className="client-due">Due {activeProject.job?.deadline ? new Date(activeProject.job.deadline).toLocaleDateString() : 'Flexible'}</p>
                
                <div className="progress-section">
                  <div className="progress-labels">
                    <span>Overall progress</span>
                    <span>{calculateProgress()}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${calculateProgress()}%` }}></div>
                  </div>
                </div>

                <div className="milestones-section">
                  <p className="milestones-subtitle">Milestones</p>
                  <ul className="milestone-list">
                    {milestones.length > 0 ? milestones.map(m => (
                      <li key={m.id}>
                        <div className="milestone-item">
                          <span className={`dot bg-${m.status === 'completed' ? 'green' : m.status === 'in_progress' ? 'blue' : 'gray'}`}></span>
                          <span>{m.title}</span>
                        </div>
                        <span className={`ms-status text-${m.status === 'completed' ? 'green' : m.status === 'in_progress' ? 'blue' : 'gray'}`}>
                          {m.status === 'completed' ? 'Done' : m.status === 'in_progress' ? 'In progress' : 'To do'}
                        </span>
                      </li>
                    )) : (
                      <li><span style={{ color: '#888', fontSize: '13px' }}>No milestones created yet.</span></li>
                    )}
                  </ul>
                </div>

                <div className="panel-actions">
                  <button className="btn-outline" onClick={() => setIsUpdateProgressOpen(true)}>Update progress</button>
                  <button className="btn-outline" onClick={() => setIsSubmitWorkOpen(true)}>Submit work ↗</button>
                </div>
              </>
            ) : (
              <p style={{ color: '#888', padding: '20px 0' }}>No active projects at the moment.</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: BID TRACKER */}
        <div className="dash-column">
          <p className="section-label">BID TRACKER</p>
          <div className="bid-tracker-list">
            {recentProposals.map(p => (
              <div key={p.id} className="panel-card bid-card">
                <div className="panel-header">
                  <h3>{p.job?.title || 'Project'}</h3>
                  <span className={`badge badge-${p.status}`}>{p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span>
                </div>
                <p className="bid-meta">Bid ₹{p.bid_amount} · Budget ₹{p.job?.budget || 0}</p>
                
                {p.status === 'pending' && <p className="bid-desc">Applied {new Date(p.created_at).toLocaleDateString()} · Waiting for response</p>}
                {p.status === 'accepted' && <p className="bid-desc text-green">Client hired you!</p>}
                
                {p.status === 'rejected' && (
                  <button className="btn-outline mt-12 w-full">Revise & rebid ↗</button>
                )}
              </div>
            ))}
            {recentProposals.length === 0 && <p style={{ color: '#888' }}>No recent bids.</p>}
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <p className="section-label mt-40">RECENT ACTIVITY</p>
      <div className="panel-card activity-panel">
        <ul className="activity-list">
          {activities.map((act, i) => {
             let colorClass = 'gray'; // default
             if (act.action_type.includes('accepted') || act.action_type.includes('submitted')) colorClass = 'green';
             else if (act.action_type.includes('progress') || act.action_type.includes('updated')) colorClass = 'blue';
             else if (act.action_type.includes('bid') && !act.action_type.includes('rejected')) colorClass = 'orange'; // for placed bids
             else if (act.action_type.includes('reject')) colorClass = 'red';

             return (
               <li key={act.id || i}>
                 <div className="activity-item">
                   <span className={`dot bg-${colorClass}`}></span>
                   <span>{act.description}</span>
                 </div>
                 <span className="activity-time">{timeAgo(act.created_at)}</span>
               </li>
             );
          })}
          {activities.length === 0 && <li style={{color: '#888'}}>No recent activity.</li>}
        </ul>
      </div>

      {/* MODALS */}
      {isUpdateProgressOpen && (
        <div className="modal-overlay" onClick={() => setIsUpdateProgressOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '400px'}}>
             <button className="close-btn" onClick={() => setIsUpdateProgressOpen(false)}>×</button>
             <h2 style={{fontSize:'20px', marginBottom: '20px'}}>Update Milestones</h2>
             
             <ul className="milestone-list" style={{marginBottom: '20px'}}>
                {milestones.map(m => (
                  <li key={m.id} style={{padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', cursor: 'pointer'}} onClick={() => handleToggleMilestone(m.id, m.status)}>
                    <div className="milestone-item">
                      <span className={`dot bg-${m.status === 'completed' ? 'green' : m.status === 'in_progress' ? 'blue' : 'gray'}`}></span>
                      <span style={{textDecoration: m.status === 'completed' ? 'line-through' : 'none', color: m.status === 'completed' ? '#888' : '#fff'}}>{m.title}</span>
                    </div>
                    <span className="ms-status" style={{fontSize: '11px', color: '#aaa'}}>(Click to shift state)</span>
                  </li>
                ))}
             </ul>

             <form onSubmit={handleAddMilestone} style={{display: 'flex', gap: '10px'}}>
               <input 
                 type="text" 
                 value={newMilestoneTitle} 
                 onChange={e => setNewMilestoneTitle(e.target.value)} 
                 placeholder="e.g. Wireframes..." 
                 className="filter-input" 
                 style={{flex: 1}} 
                 required 
               />
               <button type="submit" className="submit-bid-btn" style={{width: 'auto', padding: '10px 16px'}}>+ Add</button>
             </form>
          </div>
        </div>
      )}

      {isSubmitWorkOpen && (
        <div className="modal-overlay" onClick={() => setIsSubmitWorkOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '400px'}}>
             <button className="close-btn" onClick={() => setIsSubmitWorkOpen(false)}>×</button>
             <h2 style={{fontSize:'20px', marginBottom: '20px'}}>Submit Deliverables</h2>
             <p style={{color:'#aaa', fontSize:'14px', marginBottom:'20px'}}>Hand off your final work files to the client. This will mark the project as 'Waiting Review'.</p>
             <form onSubmit={handleSubmitWork} className="bid-form">
               <div className="form-group">
                 <label>Figma / GitHub / Drive Link</label>
                 <input type="url" required placeholder="https://..." value={deliverableLink} onChange={e => setDeliverableLink(e.target.value)} />
               </div>
               <button type="submit" className="submit-bid-btn">Submit Work</button>
             </form>
          </div>
        </div>
      )}

    </div>
  );
}
