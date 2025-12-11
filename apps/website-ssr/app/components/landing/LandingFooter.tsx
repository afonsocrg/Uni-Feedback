import { Separator } from '@uni-feedback/ui'
import { GraduationCap } from 'lucide-react'

export function LandingFooter() {
  return (
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
                <a href="#" className="hover:text-foreground transition-colors">
                  Browse Courses
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Give Feedback
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Open Source
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Partners
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Get in Touch
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Sponsors
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms and Conditions
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>Built with ❤️ by @afonsocrg</p>
          <p>© 2025 Uni Feedback. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
