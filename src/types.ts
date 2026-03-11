export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: 'client' | 'freelancer';
    headline: string | null;
    bio: string | null;
    skills: string[] | null;
    created_at: string;
}

export interface Job {
    id: string;
    client_id: string;
    title: string;
    description: string;
    budget: number;
    deadline: string | null;
    status: 'open' | 'in_progress' | 'completed' | 'cancelled';
    skills_required: string[] | null;
    created_at: string;
    client?: Profile; // Joined
}

export interface Proposal {
    id: string;
    job_id: string;
    freelancer_id: string;
    cover_letter: string;
    bid_amount: number;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    freelancer?: Profile; // Joined
}
