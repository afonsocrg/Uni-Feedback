import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  Separator
} from '@uni-feedback/ui'
import {
  GraduationCap,
  Book,
  Pen,
  Star,
  ArrowRight,
  Search,
  FileText,
  PenSquare,
  ShieldCheck,
  UserX,
  CheckCircle,
  Lock,
  BookOpen,
  Users
} from 'lucide-react'

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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-8 text-primary" />
            <span className="text-xl font-semibold text-foreground">
              Uni Feedback
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </a>
            <a
              href="#testimonials"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Testimonials
            </a>
            <a
              href="#faq"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost">
              Browse Feedback
            </Button>
            <Button
              size="sm"
              className="shadow-lg shadow-primary/20 bg-gradient-to-br from-primary to-primary/90"
            >
              Give Feedback!
            </Button>
          </div>
        </div>
      </header>
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground">
            Honest, anonymous student feedback
            <br />
            to help you{' '}
            <span className="text-primary">find the right courses</span>
          </h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
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
          </div>
          <div className="pt-8">
            <p className="text-sm text-muted-foreground mb-4">Powered by</p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
              <img
                alt="Partner logo"
                src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/placeholder/landscape.png"
                className="h-8 grayscale"
              />
              <img
                alt="Partner logo"
                src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/placeholder/landscape.png"
                className="h-8 grayscale"
              />
              <img
                alt="Partner logo"
                src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/placeholder/landscape.png"
                className="h-8 grayscale"
              />
              <img
                alt="Partner logo"
                src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/placeholder/landscape.png"
                className="h-8 grayscale"
              />
            </div>
          </div>
        </div>
      </section>
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-12">
              Real Feedback from Real Students
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <Star className="size-5 text-yellow-500 fill-yellow-500" />
                      <Star className="size-5 text-yellow-500 fill-yellow-500" />
                      <Star className="size-5 text-yellow-500 fill-yellow-500" />
                      <Star className="size-5 text-yellow-500 fill-yellow-500" />
                      <Star className="size-5 text-yellow-500" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Very Light
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                    ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <Star className="size-5 text-yellow-500 fill-yellow-500" />
                      <Star className="size-5 text-yellow-500 fill-yellow-500" />
                      <Star className="size-5 text-yellow-500 fill-yellow-500" />
                      <Star className="size-5 text-yellow-500 fill-yellow-500" />
                      <Star className="size-5 text-yellow-500" />
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-xs bg-orange-100 text-orange-700"
                    >
                      Heavy
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                    ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <Star className="size-5 text-yellow-500 fill-yellow-500" />
                      <Star className="size-5 text-yellow-500 fill-yellow-500" />
                      <Star className="size-5 text-yellow-500 fill-yellow-500" />
                      <Star className="size-5 text-yellow-500 fill-yellow-500" />
                      <Star className="size-5 text-yellow-500" />
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-xs bg-yellow-100 text-yellow-700"
                    >
                      Moderate
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                    ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="text-center mt-8">
              <Button size="lg" variant="outline">
                View More Feedback
                <ArrowRight className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>
      <section id="how-it-works" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-4">
              How It Works
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Getting started is simple. Join thousands of students making
              informed decisions about their courses.
            </p>
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              <div className="text-center space-y-4">
                <div className="mx-auto size-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Search className="size-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Browse Courses</h3>
                <p className="text-muted-foreground text-sm">
                  Search through hundreds of courses and explore honest feedback
                  from students who have taken them
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="mx-auto size-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="size-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Read Reviews</h3>
                <p className="text-muted-foreground text-sm">
                  Get insights on workload, teaching quality, assessment
                  methods, and overall experience
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="mx-auto size-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <PenSquare className="size-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Share Feedback</h3>
                <p className="text-muted-foreground text-sm">
                  Help future students by sharing your honest, anonymous
                  feedback about courses you've completed
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <ShieldCheck className="size-4" />
                  Trusted & Secure
                </div>
                <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
                  100% Anonymous, 100% Authentic
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Your privacy matters. Share honest feedback without revealing
                  your identity, while we ensure every review is legitimate and
                  helpful.
                </p>
                <div className="space-y-4 pt-4">
                  <div className="flex gap-4">
                    <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <UserX className="size-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Complete Anonymity</h3>
                      <p className="text-sm text-muted-foreground">
                        Your identity is always protected. Share honest opinions
                        without concerns.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="size-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Verified Reviews</h3>
                      <p className="text-sm text-muted-foreground">
                        Every review is authenticated to ensure quality and
                        relevance.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Lock className="size-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Data Protection</h3>
                      <p className="text-sm text-muted-foreground">
                        Your data is never shared with third parties.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-2xl" />
                <img
                  alt="Students collaborating"
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                  className="rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
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
                  <div className="text-4xl font-bold text-primary">5,000+</div>
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
                  <div className="text-4xl font-bold text-primary">1,200+</div>
                  <div className="text-sm text-muted-foreground">
                    Active Contributors
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      <section id="testimonials" className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-4">
              What Students Say
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Hear from students who have used Uni Feedback to make better
              course decisions
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="space-y-4">
                  <div className="flex gap-1">
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "This platform saved me from taking a course that would have
                    been a disaster. The honest reviews helped me choose classes
                    that aligned with my learning style."
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <Avatar>
                      <AvatarImage src="https://randomuser.me/api/portraits/women/23.jpg" />
                      <AvatarFallback>SM</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">Sarah M.</div>
                      <div className="text-xs text-muted-foreground">
                        Computer Science, 3rd Year
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-4">
                  <div className="flex gap-1">
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "I love that I can contribute anonymously. It's liberating
                    to share honest feedback without worrying about
                    consequences. This platform is exactly what students need."
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <Avatar>
                      <AvatarImage src="https://randomuser.me/api/portraits/men/42.jpg" />
                      <AvatarFallback>JL</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">James L.</div>
                      <div className="text-xs text-muted-foreground">
                        Business, 2nd Year
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-4">
                  <div className="flex gap-1">
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "Reading real student experiences helped me plan my entire
                    semester. I knew exactly what to expect from each course and
                    could balance my workload accordingly."
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <Avatar>
                      <AvatarImage src="https://randomuser.me/api/portraits/women/67.jpg" />
                      <AvatarFallback>EP</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">Emma P.</div>
                      <div className="text-xs text-muted-foreground">
                        Engineering, 4th Year
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
              Loved by Students at
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-12 pt-4">
              <img
                alt="University logo"
                src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/placeholder/landscape.png"
                className="h-12 opacity-60 hover:opacity-100 transition-opacity"
              />
              <img
                alt="University logo"
                src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/placeholder/landscape.png"
                className="h-12 opacity-60 hover:opacity-100 transition-opacity"
              />
              <img
                alt="University logo"
                src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/placeholder/landscape.png"
                className="h-12 opacity-60 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        </div>
      </section>
      <section id="faq" className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              Everything you need to know about Uni Feedback
            </p>
            <Accordion type="single" className="space-y-4" collapsible>
              <AccordionItem
                value="item-1"
                className="bg-background rounded-lg px-6 border"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  How does Uni Feedback ensure reviews are authentic?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  We verify that all reviewers are enrolled students through a
                  secure authentication process. While feedback remains
                  anonymous, we ensure only legitimate students can contribute
                  reviews.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="item-2"
                className="bg-background rounded-lg px-6 border"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  Is my feedback really anonymous?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes, absolutely. Your identity is never revealed to anyone,
                  including professors, administrators, or other students. We
                  take privacy seriously and use encryption to protect all user
                  data.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="item-3"
                className="bg-background rounded-lg px-6 border"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  Can I review any course from any university?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Currently, we support courses from partner universities. If
                  your university isn't listed, you can request to add it, and
                  we'll work on expanding our coverage.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="item-4"
                className="bg-background rounded-lg px-6 border"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  How can I trust the reviews are honest?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Anonymity encourages honesty. Students can share their genuine
                  experiences without fear of repercussions. We also moderate
                  reviews to ensure they meet our quality standards and aren't
                  spam or abusive.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="item-5"
                className="bg-background rounded-lg px-6 border"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  Is Uni Feedback free to use?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes, Uni Feedback is completely free for all students. Our
                  mission is to help students make better academic decisions,
                  and we believe this information should be accessible to
                  everyone.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
              Ready to Make Informed Decisions?
            </h2>
            <p className="text-lg text-primary-foreground/90">
              Join thousands of students using Uni Feedback to choose the right
              courses for their academic journey
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
      <footer className="bg-muted/30 border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-6 text-primary" />
                <span className="text-lg font-semibold">Uni Feedback</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Helping students make better academic decisions through honest,
                anonymous course feedback.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Browse Courses
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Give Feedback
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Open Source
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Partners
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Get in Touch
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Sponsors
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Terms and Conditions
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <Separator className="my-8" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>Built with love by @afonsocpg</p>
            <p>© 2024 Uni Feedback. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
