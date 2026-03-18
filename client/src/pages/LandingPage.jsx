import { Link } from 'react-router-dom';
import PrimaryButton from '../components/PrimaryButton';
import Card from '../components/Card';
import freelancerHeroImage from '../assets/freelancer-hero.svg';

const features = [
  {
    title: 'Smart Job Posting',
    copy: 'Clients publish freelance opportunities with budget, scope, and deadlines in minutes.',
  },
  {
    title: 'Clear Proposals',
    copy: 'Freelancers submit confident proposals with pricing, timelines, and a clear plan.',
  },
  {
    title: 'Trustworthy Workflow',
    copy: 'Every project is structured for transparent communication and dependable delivery.',
  },
];

const testimonials = [
  {
    name: 'Damas Collective',
    quote:
      'Worksy made it simple to evaluate freelancer talent and hire confidently. The bidding flow is fast and focused.',
  },
  {
    name: 'Pixel Foundry',
    quote:
      'The platform keeps delivery quality high by making expectations and deliverables crystal clear.',
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="hero-shell">
        <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-5 py-24 sm:px-8 md:grid-cols-[1.08fr_0.92fr] md:items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
              Worksy Platform
            </p>
            <h1 className="worksy-hero text-[clamp(3.4rem,8vw,6rem)] text-[color:var(--primary-green)]">
              HIRE TOP FREELANCERS FOR ANY PROJECT.
            </h1>
            <p className="max-w-xl text-lg text-[color:var(--text-muted)]">
              Worksy connects clients and freelancers across design, writing, marketing, development, and more. Post work, compare proposals, and hire with confidence.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <PrimaryButton>Get Started</PrimaryButton>
              </Link>
              <Link to="/marketplace" className="worksy-secondary-btn">
                Browse Jobs
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-card">
              <img
                src={freelancerHeroImage}
                alt="Freelancers collaborating across multiple services"
                className="hero-image"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="worksy-section">
        <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
          <p className="worksy-kicker">Features</p>
          <h2 className="worksy-title">How Worksy Powers Better Freelancing</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map((item) => (
              <Card key={item.title}>
                <h3 className="text-4xl leading-none text-[color:var(--primary-green)] worksy-heading">{item.title}</h3>
                <p className="mt-4 text-sm text-[color:var(--text-muted)]">{item.copy}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="worksy-section dark-panel">
        <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
          <p className="worksy-kicker text-[color:var(--accent-yellow)]">Testimonials</p>
          <h2 className="worksy-title text-white">Trusted By Growing Businesses</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {testimonials.map((item) => (
              <Card key={item.name} className="bg-white/95">
                <p className="text-sm uppercase tracking-[0.12em] text-[color:var(--text-muted)]">{item.name}</p>
                <p className="mt-4 text-lg text-[color:var(--text-dark)]">"{item.quote}"</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="worksy-section">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-start justify-between gap-6 px-5 sm:px-8 md:flex-row md:items-center">
          <div>
            <p className="worksy-kicker">Start Today</p>
            <h2 className="worksy-title">Ready to launch your next freelance project?</h2>
          </div>
          <Link to="/register">
            <PrimaryButton>Post A Job</PrimaryButton>
          </Link>
        </div>
      </section>
    </>
  );
}
