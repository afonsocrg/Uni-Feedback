import { Home } from 'lucide-react'
import { MessagePage } from './MessagePage'

interface PermissionErrorProps {
  message?: string
  onBackToProfile?: () => void
}

const playfulHeadlines = [
  'Hey, not so fast!',
  'Hold your horses! 🐴',
  'Whoa there, partner!',
  'Easy tiger! 🐯',
  'Slow down, speed racer!',
  'Not today, my friend!'
]

export function PermissionError({
  message = 'Oops! You can only edit your feedback',
  onBackToProfile
}: PermissionErrorProps) {
  // Pick a headline based on the current hour (0-23)
  // This makes it deterministic but varies throughout the day
  const currentHour = new Date().getMinutes()
  const headlineIndex = currentHour % playfulHeadlines.length
  const headline = playfulHeadlines[headlineIndex]

  return (
    <MessagePage
      heading={headline}
      buttons={
        onBackToProfile
          ? [
              {
                label: 'Back to Profile',
                onClick: onBackToProfile,
                icon: Home
              }
            ]
          : []
      }
    >
      <p className="text-base">{message}</p>
    </MessagePage>
  )
}
