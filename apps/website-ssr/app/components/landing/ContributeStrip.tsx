export function ContributeStrip() {
  return (
    <div className="relative flex items-center justify-center py-6">
      <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
      <a
        href="/feedback/new"
        className="relative bg-background border rounded-full px-5 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors shadow-sm"
      >
        Already taken a course?{' '}
        <span className="text-primary font-medium">
          Share your experience →
        </span>
      </a>
    </div>
  )
}
