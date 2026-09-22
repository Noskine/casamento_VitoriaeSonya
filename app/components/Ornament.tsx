export default function Ornament({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <span className="h-px w-14 bg-gradient-to-r from-transparent to-gold/70" />
      <span className="h-1.5 w-1.5 rotate-45 bg-gold/70" />
      <span className="h-px w-14 bg-gradient-to-l from-transparent to-gold/70" />
    </div>
  );
}