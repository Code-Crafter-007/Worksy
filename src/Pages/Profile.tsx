import { type JSX } from "react";
import React from "react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Profile } from "../types";
import "./Profile.css";
import ShinyText from "../Components/ShinyText";
import BlurText from "../Components/BlurText";

export default function ProfilePage(): JSX.Element {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [hourlyRate, setHourlyRate] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setProfile(data as Profile);
      setFullName(data.full_name || "");
      setHeadline(data.headline || "");
      setBio(data.bio || "");
      setHourlyRate(data.hourly_rate || 0);
      setAvatarUrl(data.avatar_url || "");
      setSkills(data.skills || []);
    }
    setLoading(false);
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      e.preventDefault();
      if (!skills.includes(newSkill.trim())) {
        setSkills([...skills, newSkill.trim()]);
      }
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        headline,
        bio,
        hourly_rate: Number(hourlyRate),
        avatar_url: avatarUrl,
        skills
      })
      .eq('id', profile.id);

    if (error) {
      alert("Error saving profile: " + error.message);
    } else {
      alert("Profile saved successfully!");
      fetchProfile(); // refresh
    }
    setSaving(false);
  };

  const getInitials = (name: string) => {
    if (!name) return "AN";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  if (loading) return <div className="dash-container"><p style={{padding: '40px', color: '#888', textAlign: 'center'}}>Loading profile...</p></div>;

  return (
    <div className="dash-container profile-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
      <div className="dash-hero" style={{ marginBottom: "40px", textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold' }}>
          <ShinyText text="Profile & Settings" speed={3} />
        </h1>
        <p style={{ marginTop: '10px' }}>
          <BlurText text="Manage your identity, technical skills, and how clients see your profile." delay={0.2} />
        </p>
      </div>

      <div className="profile-card panel-card">
        <div className="profile-header-preview">
          <div className="profile-avatar-large">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" />
            ) : (
              <span>{getInitials(fullName)}</span>
            )}
          </div>
          <div className="profile-titles">
            <h2>{fullName || 'Your Name'}</h2>
            <p className="text-blue">{profile?.role === 'freelancer' ? 'Freelancer' : 'Client'}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="bid-form profile-form">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Professional Headline</label>
            <input type="text" placeholder="e.g. Senior React Developer" value={headline} onChange={e => setHeadline(e.target.value)} />
          </div>

          <div className="form-group">
            <label>About You (Bio)</label>
            <textarea rows={4} placeholder="Describe your experience and what you excel at..." value={bio} onChange={e => setBio(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Avatar Image URL (Optional)</label>
            <input type="url" placeholder="https://..." value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Hourly Rate (₹) [Publicly Visible]</label>
            <input type="number" placeholder="e.g. 50" value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value))} />
          </div>

          {profile?.role === 'freelancer' && (
            <div className="form-group">
              <label>Your Skills</label>
              <div className="skills-input-container">
                <div className="job-skills-tags" style={{ marginBottom: '12px' }}>
                  {skills.map((s, i) => (
                    <span key={i} className="skill-tag flex-tag" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
                      {s} <button type="button" onClick={() => handleRemoveSkill(s)} className="remove-skill-btn">×</button>
                    </span>
                  ))}
                  {skills.length === 0 && <span style={{ color: '#888', fontSize: '13px' }}>No skills added.</span>}
                </div>
                <input 
                  type="text" 
                  placeholder="Type a skill and press Enter (e.g. UI/UX)" 
                  value={newSkill} 
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={handleAddSkill}
                />
              </div>
            </div>
          )}

          <div className="pt-4 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
            <button type="submit" className="submit-bid-btn" disabled={saving}>
              {saving ? "Saving Changes..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
