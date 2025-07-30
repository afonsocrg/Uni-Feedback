import { useAuth } from '@hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@uni-feedback/ui'
import { BookOpen, Building2, GraduationCap, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ActionCard {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  route: string
  gradient: string
}

const actionCards: ActionCard[] = [
  {
    title: 'Manage Faculties',
    description: 'Add, edit, and organize university faculties',
    icon: Building2,
    route: '/faculties',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    title: 'Manage Degrees',
    description: 'Configure degree programs and requirements',
    icon: GraduationCap,
    route: '/degrees',
    gradient: 'from-green-500 to-green-600'
  },
  {
    title: 'Manage Courses',
    description: 'Create and update course information',
    icon: BookOpen,
    route: '/courses',
    gradient: 'from-purple-500 to-purple-600'
  },
  {
    title: 'Manage Feedback',
    description: 'Review and moderate student feedback',
    icon: MessageSquare,
    route: '/feedback',
    gradient: 'from-orange-500 to-orange-600'
  }
]

export function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Welcome back, {user?.username}!!
        </h1>
        <p className="text-xl text-muted-foreground">
          What would you like to do today?
        </p>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {actionCards.map((card) => {
          const Icon = card.icon
          return (
            <Card
              key={card.route}
              className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-border/50 hover:border-border"
              onClick={() => navigate(card.route)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-lg bg-gradient-to-r ${card.gradient} text-white`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-foreground">
                      {card.title}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
