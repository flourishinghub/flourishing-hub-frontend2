interface LogoProps {
  // Full size + radius classes, e.g. "w-8 h-8 rounded-xl" — matches whatever
  // the call site previously used for its gradient-mark placeholder.
  className?: string;
}

// The brand mark — sits on a white chip since the logo art itself is a
// transparent-background black glyph that disappears against the app's
// dark navy surfaces without one.
export default function Logo({ className = 'w-8 h-8 rounded-xl' }: LogoProps) {
  return (
    <div className={`${className} bg-white border border-primary/30 flex items-center justify-center shrink-0 shadow-glow-sm p-1`}>
      <img src="/logo.png" alt="Flourishing Hub" className="w-full h-full object-contain" />
    </div>
  );
}
