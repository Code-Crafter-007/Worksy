import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./Findwork.css";

interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  created_at: string;
}

export default function FindWork() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching jobs:", error.message);
    } else {
      setJobs(data || []);
    }

    setLoading(false);
  };

  return (
    <div className="dash-container">
      <div className="dash-hero">
        <h1>Find Work</h1>
        <p>Browse available projects and apply.</p>
      </div>

      {loading && <p>Loading...</p>}

      {!loading && jobs.length === 0 && (
        <p>No jobs found.</p>
      )}

      <div className="jobs-list">
        {!loading &&
          jobs.map((job) => (
            <div className="job-card" key={job.id}>
              <h3 className="job-title">{job.title}</h3>
              <p className="job-description">{job.description}</p>
              <p className="job-budget">Budget: ₹{job.budget}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
