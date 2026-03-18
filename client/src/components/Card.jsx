export default function Card({ className = '', children }) {
  return <article className={`worksy-card ${className}`}>{children}</article>;
}
