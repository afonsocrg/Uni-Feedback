import { FileText, PenSquare, Search } from 'lucide-react'

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6 md:gap-12">
            <div className="flex items-start gap-4 md:flex-col md:items-center md:text-center md:gap-4">
              <div className="shrink-0 size-12 md:size-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="size-6 md:size-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-semibold">
                  Browse Courses
                </h3>
                <p className="text-muted-foreground text-sm mt-1 md:mt-2">
                  Search and filter hundreds of courses to find the ones that
                  fit your interests and criteria.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 md:flex-col md:items-center md:text-center md:gap-4">
              <div className="shrink-0 size-12 md:size-16 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="size-6 md:size-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-semibold">
                  Read Feedback
                </h3>
                <p className="text-muted-foreground text-sm mt-1 md:mt-2">
                  See what past students say about the course, its contents,
                  workload, teaching style, etc.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 md:flex-col md:items-center md:text-center md:gap-4">
              <div className="shrink-0 size-12 md:size-16 rounded-full bg-primary/10 flex items-center justify-center">
                <PenSquare className="size-6 md:size-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-semibold">
                  Enroll With Confidence
                </h3>
                <p className="text-muted-foreground text-sm mt-1 md:mt-2">
                  Use what you learned to choose the right courses for you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
