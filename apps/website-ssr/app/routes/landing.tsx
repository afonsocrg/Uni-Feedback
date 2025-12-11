import { Button, Card, CardContent } from '@uni-feedback/ui'
import {
  ArrowRight,
  Book,
  BookOpen,
  FileText,
  Pen,
  PenSquare,
  Search,
  Users
} from 'lucide-react'

import { database } from '@uni-feedback/db'
import { LandingFeedbackCard } from '../components/feedback/LandingFeedbackCard'
import {
  FAQ,
  LandingFooter,
  LandingHeader,
  TestimonialsSection,
  TrustedSection
} from '../components/landing'
import { getAssetUrl } from '../utils'

import type { Route } from './+types/landing'

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Uni Feedback - Landing Page' },
    {
      name: 'description',
      content:
        'Honest, anonymous student feedback to help you find the right courses.'
    }
  ]
}

export async function loader() {
  const db = database()

  const studentClubs = await db.query.studentClubs.findMany({
    where: (clubs, { eq }) => eq(clubs.isActive, true),
    orderBy: (clubs) => [clubs.sortOrder]
  })

  const faculties = await db.query.faculties.findMany({
    orderBy: (faculties, { asc }) => [asc(faculties.id)]
  })

  // Fetch 3 most recent approved feedbacks with comments
  const recentFeedbacks = await db.query.feedback.findMany({
    where: (feedback, { and, isNotNull, ne }) =>
      and(
        isNotNull(feedback.approvedAt),
        isNotNull(feedback.comment),
        ne(feedback.comment, '')
      ),
    orderBy: (feedbacks, { desc }) => [desc(feedbacks.approvedAt)],
    limit: 3
    // with: {
    //   degree: true
    // }
  })

  return { studentClubs, faculties, recentFeedbacks }
}

export default function LandingPage({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .carousel-container:hover .animate-scroll {
          animation-play-state: paused;
        }

        .animate-scroll {
          animation: scroll 40s linear infinite;
          display: flex;
          gap: 2rem;
          width: max-content;
        }
      `}</style>
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground mb-2">
              Honest, anonymous student feedback
              <br />
              to help you{' '}
              <span className="text-primary">find the right courses</span>
            </h1>
            <div className="">
              <p className="text-xs text-muted-foreground mb-4">Powered by</p>
              <div className="relative overflow-hidden w-full carousel-container">
                <div className="animate-scroll">
                  {/* First set of logos */}
                  {loaderData.studentClubs.map((club) => {
                    const logoUrl = getAssetUrl(club.logoHorizontal)
                    if (!logoUrl) return null

                    return (
                      <img
                        key={club.id}
                        alt={`${club.name} logo`}
                        src={logoUrl}
                        className="h-8 flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                      />
                    )
                  })}
                  {/* Duplicate set for seamless loop */}
                  {loaderData.studentClubs.map((club) => {
                    const logoUrl = getAssetUrl(club.logoHorizontal)
                    if (!logoUrl) return null

                    return (
                      <img
                        key={`duplicate-${club.id}`}
                        alt={`${club.name} logo`}
                        src={logoUrl}
                        className="h-8 flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                      />
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loaderData.recentFeedbacks.map((feedback) => (
                    <LandingFeedbackCard
                      key={feedback.id}
                      feedback={feedback}
                    />
                  ))}
                </div>
                <div className="text-center mt-8">
                  <Button size="lg" variant="outline">
                    View More Feedback
                    <ArrowRight className="size-5" />
                  </Button>
                </div>
              </div>
            </div>
            {/* <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              className="shadow-lg shadow-primary/20 bg-gradient-to-br from-primary to-primary/90 text-lg px-8"
            >
              <Book className="size-5" />
              Browse Courses
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              <Pen className="size-5" />
              Share Your Experience
            </Button>
          </div> */}
          </div>
        </section>
        <section id="how-it-works" className="bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-12">
                How It Works
              </h2>
              {/* <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Getting started is simple. Join thousands of students making
              informed decisions about their courses.
            </p> */}
              <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                <div className="text-center space-y-4">
                  <div className="mx-auto size-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Search className="size-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Browse Courses</h3>
                  <p className="text-muted-foreground text-sm">
                    Search and filter hundreds of courses to find the ones that
                    fit your interests and criteria.
                  </p>
                </div>
                <div className="text-center space-y-4">
                  <div className="mx-auto size-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="size-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Read Feedback</h3>
                  <p className="text-muted-foreground text-sm">
                    See what past students say about the course, its contents,
                    workload, teaching style, etc.
                  </p>
                </div>
                <div className="text-center space-y-4">
                  <div className="mx-auto size-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <PenSquare className="size-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">
                    Enroll With Confidence
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Use what you learned to choose the right courses for you.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <TrustedSection />
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto text-center">
              <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight mb-4">
                Our Impact
              </h2>
              <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
                Join a growing community of students making better academic
                decisions
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                <Card>
                  <CardContent className="text-center space-y-2">
                    <div className="size-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <BookOpen className="size-8 text-primary" />
                    </div>
                    <div className="text-4xl font-bold text-primary">502+</div>
                    <div className="text-sm text-muted-foreground">
                      Courses Reviewed
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="text-center space-y-2">
                    <div className="size-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Users className="size-8 text-primary" />
                    </div>
                    <div className="text-4xl font-bold text-primary">
                      5,000+
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Students Helped
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="text-center space-y-2">
                    <div className="size-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Pen className="size-8 text-primary" />
                    </div>
                    <div className="text-4xl font-bold text-primary">
                      1,200+
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Active Contributors
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
        <TestimonialsSection />
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
                Loved by Students at
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-8">
                {loaderData.faculties.map((faculty) => {
                  const logoUrl = getAssetUrl(faculty.logoHorizontal)
                  if (!logoUrl) return null

                  return (
                    <img
                      key={faculty.id}
                      alt={`${faculty.name} logo`}
                      src={logoUrl}
                      className="h-12 opacity-50 hover:opacity-100 transition-opacity"
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </section>
        <FAQ />
        <section className="py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
                Ready to Make Informed Decisions?
              </h2>
              <p className="text-lg text-primary-foreground/90">
                Join thousands of students using Uni Feedback to choose the
                right courses for their academic journey
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-lg px-8 shadow-xl"
                >
                  <Book className="size-5" />
                  Browse Courses Now
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Pen className="size-5" />
                  Share Your Feedback
                </Button>
              </div>
            </div>
          </div>
        </section>
        <LandingFooter />
      </div>
    </>
  )
}
