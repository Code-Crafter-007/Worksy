# Worksy 🚀

Worksy is a modern, full-stack freelance marketplace built to effortlessly connect talented freelancers with clients. Inspired by platforms like Fiverr and Upwork, Worksy elevates the freelance experience with a stunning UI, real-time messaging, and a highly secure Razorpay Escrow payment system to protect both parties.

## ✨ Key Features

- **Dual-Sided Marketplace:** Seamlessly onboard as either a **Freelancer** looking for work, or a **Client** looking to hire.
- **Interactive Job Board & Proposals:** 
  - Clients can post detailed project listings.
  - Freelancers can submit highly customized bids with proposed timelines and cover notes.
  - Kanban-style dashboards allow freelancers to naturally track their bids (Pending, Accepted, Rejected).
- **Secure Escrow Payments (via Razorpay):** 
  - Protects both clients and freelancers.
  - **Fund Escrow:** Clients deposit funds into escrow when accepting a bid.
  - **Deliver Work:** Freelancers upload their final deliverables and notes when finished.
  - **Release Payment:** Clients review the submitted work and formally authorize the release of the escrowed funds directly to the freelancer's account.
- **Real-Time Collaboration:** 
  - Integrated 1-on-1 chat using Supabase Realtime.
  - Features include online presence, "is typing..." indicators, and read receipts.
  - Privacy-first: Direct messaging is strictly restricted until a freelancer officially bids on a client's project.
- **Elegant UI/UX:** 
  - Glassmorphic components with dynamic hover states.
  - Lightning-fast SPA architecture powered by Vite.
  - System-wide Light/Dark mode toggles.

## 🛠 Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** Vanilla CSS (CSS Modules & Global Variables)
- **Backend / Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (JWT, Magic Links)
- **Realtime Services:** Supabase Realtime (WebSockets)
- **Serverless Compute:** Supabase Edge Functions (Deno)
- **Payment Processing:** Razorpay API (Test Mode Integration)

## 📦 Setup & Installation

**1. Clone the repository**
```bash
git clone https://github.com/code-crafter-007/worksy.git
cd worksy
```

**2. Install Frontend Dependencies**
```bash
npm install
```

**3. Configure Environment Variables**
Create a `.env` in the root directory and add your Supabase and Razorpay keys:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

**4. Database Initialization**
Run the SQL migration files provided in the repository directly in your Supabase SQL Editor:
- `project_bidding_backend_migration.sql`
- `escrow_migration.sql`
- `deliverables_migration.sql`

**5. Deploy Edge Functions**
To enable the backend payment processing logic, deploy the Edge Functions to your Supabase instance:
```bash
npx supabase functions deploy create-escrow-order --no-verify-jwt
npx supabase functions deploy confirm-escrow-payment --no-verify-jwt
npx supabase functions deploy release-escrow --no-verify-jwt
```

**6. Start the Development Server**
```bash
npm run dev
```

## 🔐 Security & Database Triggers

Worksy heavily utilizes **Supabase Row Level Security (RLS)** to physically isolate data at the Postgres level. We ensure that:
- Clients cannot snoop on proposals belonging to other people's jobs.
- Freelancers can only revise/update bids that they own.
- Chat logs are completely locked down to the matching `client_id` and `freelancer_id`.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](#) if you want to contribute.

## 📝 License
This project is [MIT](https://choosealicense.com/licenses/mit/) licensed.