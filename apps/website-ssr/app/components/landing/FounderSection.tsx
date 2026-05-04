export function FounderSection() {
  return (
    <section className="py-24 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div
          className="max-w-[680px] mx-auto space-y-6 text-muted-foreground"
          style={{ fontSize: '18px', lineHeight: '1.8' }}
        >
          <p>
            When I was in university, me and many colleagues would ask what
            other students thought about the courses we were going to take.
            Workload, professors, exams... Any tip that might make our semester
            easier.
          </p>
          <p>
            We'd ask in a group chat, but answers got buried fast. Whenever
            someone asked again, or we just wanted to re-read something, it
            meant searching through hundreds of messages.
          </p>
          <p>
            We needed a single place where we could find all the feedback for
            any course.
          </p>
          <p className="text-foreground">
            So I built this. Today, thousands of students use it before signing
            up for courses every semester.
          </p>
          <p className="text-foreground italic font-medium mt-10">— Afonso</p>
        </div>
      </div>
    </section>
  )
}
