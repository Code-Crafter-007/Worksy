import { supabase } from "./supabase";

export const seedMockData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("Please log in first to seed data.");
        return;
    }

    const jobs = [
        {
            client_id: user.id,
            title: 'E-commerce Website Overhaul',
            description: 'We need a complete redesign of our Shopify store using Liquid and React.',
            budget: 3000,
            status: 'open',
            skills_required: ['React', 'Shopify', 'CSS'],
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            client_id: user.id,
            title: 'Mobile App Authentication Fix',
            description: 'Fixing login issues on our React Native app.',
            budget: 500,
            status: 'open',
            skills_required: ['React Native', 'Firebase'],
            deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            client_id: user.id,
            title: 'SEO Content Writer',
            description: 'Need 10 blog posts about AI trends.',
            budget: 200,
            status: 'open',
            skills_required: ['Writing', 'SEO'],
            deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];

    const { error } = await supabase.from('jobs').insert(jobs);

    if (error) {
        console.error("Error seeding data:", error);
        alert("Error seeding data: " + error.message);
    } else {
        alert("Mock jobs added successfully! Refresh the 'Find Work' page.");
    }
};
