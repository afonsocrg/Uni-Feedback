export function MoreThanYourNetworkSection() {
  return (
    <section className="py-28 md:py-36 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-[720px] mx-auto text-center space-y-10">
          <p className="text-3xl md:text-5xl leading-[1.45] font-medium tracking-tight">
            Sometimes the{' '}
            <span className="text-primary">most useful feedback</span> comes
            from a student we've <span className="text-primary">never met</span>
            .
          </p>
          <p className="text-sm text-muted-foreground max-w-[560px] mx-auto">
            Here we have feedback from all students across all years. Not just
            the ones you happen to know.
          </p>
        </div>
      </div>
    </section>
  )
}
