import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./PublicProfile.css";

export default function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchPublicData();
  }, [id]);

  const fetchPublicData = async () => {
    setLoading(true);
    
    // Fetch Profile
    const { data: profData } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (profData) setProfile(profData);

    // Fetch Reviews (manually resolving reviewer profiles)
    const { data: revData } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', id)
      .order('created_at', { ascending: false });
      
    if (revData && revData.length > 0) {
       const reviewerIds = revData.map(r => r.reviewer_id);
       const { data: rProfiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', reviewerIds);
       
       const enrichedReviews = revData.map(r => ({
           ...r,
           reviewer_profile: rProfiles?.find(p => p.id === r.reviewer_id)
       }));
       setReviews(enrichedReviews);
    } else {
       setReviews([]);
    }

    setLoading(false);
  };

  if (loading) return <div className="pub-profile-page"><p style={{padding: '40px', textAlign: 'center'}}>Loading profile...</p></div>;
  if (!profile) return <div className="pub-profile-page"><p style={{padding: '40px', textAlign: 'center'}}>Profile not found.</p></div>;

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : "New";

  return (
    <div className="pub-profile-page">
      <div className="pub-header-card">
        <div className="pub-avatar">
          {profile.avatar_url ? <img src={profile.avatar_url} alt="Avatar" /> : <span>{profile.full_name?.charAt(0) || 'U'}</span>}
        </div>
        <div className="pub-info">
          <h1>{profile.full_name}</h1>
          <h3 className="pub-headline">{profile.headline || 'Freelancer'}</h3>
          <div className="pub-meta">
            <span className="rating-badge">★ {averageRating} ({reviews.length} reviews)</span>
            {profile.hourly_rate > 0 && <span className="rate-badge">₹{profile.hourly_rate} / hr</span>}
          </div>
          <button className="btn-primary-purple mt-4" onClick={() => navigate(`/messages?to=${profile.id}`)}>Message User</button>
        </div>
      </div>

      <div className="pub-content-grid">
        <div className="pub-left-col">
          <div className="pub-panel">
            <h2>About</h2>
            <p className="pub-bio">{profile.bio || "This user hasn't written a bio yet."}</p>
          </div>

          <div className="pub-panel">
            <h2>Skills</h2>
            <div className="pub-skills">
              {profile.skills && profile.skills.length > 0 ? profile.skills.map((s: string, i: number) => (
                <span key={i} className="pub-skill-tag">{s}</span>
              )) : <p style={{color: '#888', fontSize: '14px'}}>No skills listed</p>}
            </div>
          </div>
        </div>

        <div className="pub-right-col">
          <div className="pub-panel">
             <h2>Reviews and Testimonials</h2>
             <div className="reviews-list">
               {reviews.length > 0 ? reviews.map(r => (
                 <div key={r.id} className="review-card">
                    <div className="review-header">
                       <strong>{r.reviewer_profile?.full_name || 'Anonymous User'}</strong>
                       <span className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
                    </div>
                    <p className="review-comment">{r.comment}</p>
                    <span className="review-date">{new Date(r.created_at).toLocaleDateString()}</span>
                 </div>
               )) : (
                 <p style={{color: '#888', fontSize: '14px'}}>No reviews yet.</p>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
