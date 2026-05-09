/*
When I was in university, me and many colleagues would ask other
students for their opinions about the courses we were going to take.
Workload, professors, exams... Any tip that might make our semester
easier.

We'd ask in a group chat, but answers got buried fast. Whenever
someone asked again, or we just wanted to re-read something, we had
to search through hundreds of messages.

We needed a single place where we could find all the feedback for
any course.
*/

/*
When I was in university, me and many colleagues would ask other
students for their opinions about the courses we were going to take.
Workload, professors, exams... Any tip that might make our semester
easier.

We'd ask in a group chat, but answers got buried fast. And soon,
we'd have to search through hundreds of messages to find that
feedback again...

We needed a single place where we could find all the feedback for
any course...
So I built this.
*/

/*
In university, we’d always ask other students about courses (workload, professors, exams, tips, etc.).
But the answers got buried in group chats.

So I built a single place for all that feedback.
*/
export function FounderSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-4">
        <div
          className="max-w-[680px] mx-auto space-y-6 text-muted-foreground"
          style={{ fontSize: '18px', lineHeight: '1.8' }}
        >
          <p>
            In university, my friends and I would often ask other students about
            courses (workload, professors, exams, tips, etc.). But the answers
            would get lost in group chats.
          </p>
          <p>So I built a place for all that feedback.</p>
          <p className="text-foreground italic font-medium mt-10">— Afonso</p>
        </div>
      </div>
    </section>
  )
}
