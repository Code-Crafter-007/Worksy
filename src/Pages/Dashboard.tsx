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

  // New states for Todos and Notes
  const [todos, setTodos] = useState<any[]>([])
  const [newTodo, setNewTodo] = useState("")
  const [notes, setNotes] = useState<any[]>([])
  const [newNote, setNewNote] = useState("")

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    if (profile) {
      fetchTodos(profile.id)
      fetchNotes(profile.id)
    }
  }, [profile])

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

  // --- Fetch Data ---
  const fetchTodos = async (userId: string) => {
    const { data } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setTodos(data)
  }

  const fetchNotes = async (userId: string) => {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setNotes(data)
  }

  // --- Submit Data ---
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim() || !profile) return

    const { error } = await supabase
      .from('todos')
      .insert([{ user_id: profile.id, task: newTodo }])

    if (!error) {
      setNewTodo("")
      fetchTodos(profile.id)
    }
  }

  const handleToggleTodo = async (todoId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('todos')
      .update({ is_completed: !currentStatus })
      .eq('id', todoId)
    
    if (!error && profile) {
      fetchTodos(profile.id)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim() || !profile) return

    const { error } = await supabase
      .from('notes')
      .insert([{ user_id: profile.id, content: newNote }])

    if (!error) {
      setNewNote("")
      fetchNotes(profile.id)
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

          {/* Main List Area - Todos & Notes */}
          <div className="dash-main-content">
            
            {/* Todos Section */}
            <div className="dash-card">
              <h3>My Todos</h3>
              <form onSubmit={handleAddTodo} className="input-form">
                <input 
                  type="text" 
                  placeholder="What needs to be done?" 
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  className="dash-input"
                />
                <button type="submit" className="dash-submit-btn">Add</button>
              </form>
              <ul className="todo-list">
                {todos.map(todo => (
                  <li key={todo.id} className="todo-item">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={todo.is_completed}
                        onChange={() => handleToggleTodo(todo.id, todo.is_completed)}
                      />
                      <span className={todo.is_completed ? 'completed' : ''}>{todo.task}</span>
                    </label>
                  </li>
                ))}
                {todos.length === 0 && <li className="empty-state">No todos yet.</li>}
              </ul>
            </div>

            {/* Notes Section */}
            <div className="dash-card" style={{ marginTop: '24px' }}>
              <h3>Quick Notes</h3>
              <form onSubmit={handleAddNote} className="input-form">
                <textarea 
                  placeholder="Jot down a quick note..." 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="dash-textarea"
                  rows={3}
                />
                <button type="submit" className="dash-submit-btn">Save Note</button>
              </form>
              <div className="notes-list">
                {notes.map(note => (
                  <div key={note.id} className="note-card">
                    <p>{note.content}</p>
                    <small>{new Date(note.created_at).toLocaleDateString()}</small>
                  </div>
                ))}
                {notes.length === 0 && <p className="empty-state">No notes yet.</p>}
              </div>
            </div>

          </div>

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
