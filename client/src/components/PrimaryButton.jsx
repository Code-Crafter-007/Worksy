export default function PrimaryButton({
  type = 'button',
  children,
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`worksy-btn ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
