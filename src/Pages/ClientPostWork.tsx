import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import "./ClientWorkspace.css";

export default function ClientPostWork() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [clientId, setClientId] = useState<string | null>(null);
    const [jobs, setJobs] = useState<any[]>([]);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [budget, setBudget] = useState("");
    const [deadline, setDeadline] = useState("");
    const [skills, setSkills] = useState("");

    const channelRef = useRef<any>(null);

    useEffect(() => {
        initPage();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, []);

    const initPage = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        setClientId(user.id);
        await fetchMyJobs(user.id);

        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        channelRef.current = supabase
            .channel(`client-post-work:${user.id}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => {
                fetchMyJobs(user.id);
            })
            .subscribe();

        setLoading(false);
    };

    const fetchMyJobs = async (userId: string) => {
        const { data } = await supabase
            .from("jobs")
            .select("id, title, description, budget, status, skills_required, created_at")
            .eq("client_id", userId)
            .order("created_at", { ascending: false });

        setJobs(data || []);
    };

    const handlePostWork = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId) return;

        setSubmitting(true);

        const skillsArray = skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean);

        const { error } = await supabase.from("jobs").insert([
            {
                client_id: clientId,
                title: title.trim(),
                description: description.trim(),
                budget: Number(budget),
                deadline: deadline || null,
                status: "open",
                skills_required: skillsArray.length > 0 ? skillsArray : null,
            },
        ]);

        if (error) {
            alert(`Error posting work: ${error.message}`);
            setSubmitting(false);
            return;
        }

        setTitle("");
        setDescription("");
        setBudget("");
        setDeadline("");
        setSkills("");

        await fetchMyJobs(clientId);
        setSubmitting(false);
    };

    if (loading) {
        return (
            <div className="dashboard-grid-page client-workspace">
                <p style={{ padding: "40px" }}>Loading page...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-grid-page client-workspace">
            <div className="dash-header-profile">
                <h2>Post New Work</h2>
                <p className="text-gray">Create jobs that instantly become visible to all freelancers.</p>
            </div>

            <div className="panel-card client-form-card">
                <form onSubmit={handlePostWork} className="client-work-form">
                    <div className="form-group">
                        <label>Project Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Build responsive landing page"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            required
                            rows={5}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe project goals, stack, and deliverables"
                        />
                    </div>

                    <div className="grid-3">
                        <div className="form-group">
                            <label>Budget (INR)</label>
                            <input
                                type="number"
                                min={1}
                                required
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                placeholder="5000"
                            />
                        </div>
                        <div className="form-group">
                            <label>Deadline</label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Skills (comma-separated)</label>
                            <input
                                type="text"
                                value={skills}
                                onChange={(e) => setSkills(e.target.value)}
                                placeholder="React, TypeScript, CSS"
                            />
                        </div>
                    </div>

                    <button className="client-action-btn" type="submit" disabled={submitting}>
                        {submitting ? "Posting..." : "Post Work"}
                    </button>
                </form>
            </div>

            <p className="section-label mt-40">YOUR POSTED WORK</p>
            <div className="client-jobs-grid">
                {jobs.length === 0 ? (
                    <div className="panel-card">
                        <p className="text-gray">No jobs posted yet.</p>
                    </div>
                ) : (
                    jobs.map((job) => (
                        <div key={job.id} className="panel-card client-job-card">
                            <div className="panel-header">
                                <h3>{job.title}</h3>
                                <span className={`badge badge-${job.status === "open" ? "pending" : "accepted"}`}>
                                    {job.status}
                                </span>
                            </div>
                            <p className="client-job-desc">{job.description}</p>
                            <div className="job-card-meta">
                                <span>Budget: INR {job.budget}</span>
                                <span>Posted: {new Date(job.created_at).toLocaleDateString()}</span>
                            </div>
                            {Array.isArray(job.skills_required) && job.skills_required.length > 0 && (
                                <div className="job-tags">
                                    {job.skills_required.map((skill: string) => (
                                        <span key={skill} className="skill-tag">{skill}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
