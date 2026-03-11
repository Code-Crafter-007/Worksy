import { useState } from "react";
import { supabase } from "../lib/supabase";
import "./PostJobModal.css";

interface PostJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onJobPosted: () => void;
    clientId: string;
}

export default function PostJobModal({
    isOpen,
    onClose,
    onJobPosted,
    clientId,
}: PostJobModalProps): JSX.Element | null {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [budget, setBudget] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.from("jobs").insert({
                client_id: clientId,
                title,
                description,
                budget: parseFloat(budget),
                status: "open",
            });

            if (error) throw error;

            onJobPosted();
            onClose();
            setTitle("");
            setDescription("");
            setBudget("");
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Post a New Job</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Job Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. React Frontend Developer"
                        />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the project details..."
                            rows={4}
                        />
                    </div>
                    <div className="form-group">
                        <label>Budget ($)</label>
                        <input
                            type="number"
                            required
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            placeholder="1000"
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="cancel-btn">
                            Cancel
                        </button>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? "Posting..." : "Post Job"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
