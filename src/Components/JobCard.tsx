import type { Job } from "../types";
import "./JobCard.css";

interface JobCardProps {
    job: Job;
    onApply?: (job: Job) => void;
}

export default function JobCard({ job, onApply }: JobCardProps): JSX.Element {
    return (
        <div className="job-card">
            <div className="job-header">
                <h3 className="job-title">{job.title}</h3>
                <span className={`job-status ${job.status}`}>{job.status}</span>
            </div>
            <p className="job-description">{job.description}</p>
            <div className="job-meta">
                <span className="job-budget">Budget: ${job.budget}</span>
                {job.deadline && (
                    <span className="job-deadline">
                        Deadline: {new Date(job.deadline).toLocaleDateString()}
                    </span>
                )}
            </div>
            <div className="job-skills">
                {job.skills_required?.map((skill) => (
                    <span key={skill} className="skill-tag">
                        {skill}
                    </span>
                ))}
            </div>
            {onApply && (
                <button onClick={() => onApply(job)} className="apply-btn">
                    Apply Now
                </button>
            )}
        </div>
    );
}
