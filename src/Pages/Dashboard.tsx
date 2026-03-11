import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import type { Profile } from "../types"
import PostJobModal from "../Components/PostJobModal"
import "./dashboard.css"

export default function Dashboard(): JSX.Element {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isPostJobOpen, setIsPostJobOpen] = useState(false)
  const [activeJobsCount, setActiveJobsCount] = useState(0)
  const [proposalsCount, setProposalsCount] = useState(0)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      navigate("/")
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
    } else {
      setProfile(data as Profile)
      fetchStats(user.id, data.role)
    }
  }

  const fetchStats = async (userId: string, role: string) => {
    if (role === 'client') {
      const { count } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('client_id', userId)
      setActiveJobsCount(count || 0)
    } else {
      const { count } = await supabase.from('proposals').select('*', { count: 'exact', head: true }).eq('freelancer_id', userId)
      setProposalsCount(count || 0)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/")
  }

  return (
    <div className="dashboard">

      {/* Header */}
      <header className="dash-header">
        <h2 className="dash-brand">Worksy</h2>
        <div className="nav-center">
          {/* Navigation buttons removed */}
        </div>

        <div className="dash-user-actions">
          {profile && <span className="user-name">{profile.full_name} ({profile.role})</span>}
          <button
            className="dash-login-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="dash-container">

        {/* Dynamic Hero / Status */}
        <section className="dash-hero">
          <h1>Welcome back, {profile?.full_name?.split(' ')[0]}</h1>
          <p>
            {profile?.role === 'client'
              ? `You have posted ${activeJobsCount} jobs.`
              : `You have submitted ${proposalsCount} proposals.`}
          </p>

          {profile?.role === 'client' && (
            <button className="post-job-btn" onClick={() => setIsPostJobOpen(true)}>
              + Post a New Job
            </button>
          )}
        </section>

        <div className="dash-grid">

          {/* Main List Area - Removed */}

          {/* Sidebar */}
          <div className="dash-sidebar">
            <div className="dash-card">
              <h3>Stats</h3>
              <div className="stat-row">
                <span>Role:</span>
                <strong>{profile?.role}</strong>
              </div>
              <div className="stat-row">
                <span>Earnings:</span>
                <strong>$0.00</strong>
              </div>
            </div>
          </div>

        </div>
      </div>

      {profile && (
        <PostJobModal
          isOpen={isPostJobOpen}
          onClose={() => setIsPostJobOpen(false)}
          onJobPosted={() => fetchStats(profile.id, profile.role)}
          clientId={profile.id}
        />
      )}
    </div>
  )
}
