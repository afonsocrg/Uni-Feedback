import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Chip
} from '@uni-feedback/ui'
import { useAuth } from '@providers'
import {
  Users,
  Building2,
  GraduationCap,
  BookOpen,
  MessageSquare
} from 'lucide-react'

export function HomePage() {
  const { user } = useAuth()

  const statsCards = [
    {
      title: 'Total Users',
      value: '24',
      icon: Users,
      description: 'Active admin users',
      color: 'bg-blue-500'
    },
    {
      title: 'Faculties',
      value: '5',
      icon: Building2,
      description: 'University faculties',
      color: 'bg-green-500'
    },
    {
      title: 'Degrees',
      value: '18',
      icon: GraduationCap,
      description: 'Degree programs',
      color: 'bg-purple-500'
    },
    {
      title: 'Courses',
      value: '156',
      icon: BookOpen,
      description: 'Available courses',
      color: 'bg-orange-500'
    },
    {
      title: 'Feedback',
      value: '1,247',
      icon: MessageSquare,
      description: 'Student reviews',
      color: 'bg-cyan-500'
    }
  ]

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          Welcome back, {user?.username}! Here's what's happening with your
          platform.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-primaryBlue bg-gradient-to-r from-primaryBlue/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Account Status
            </CardTitle>
            <div className="p-2 bg-primaryBlue/10 rounded-full">
              <Users className="h-4 w-4 text-primaryBlue" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.username}</div>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <div className="mt-2">
              {user?.superuser && (
                <Chip label="Superuser" color="blue" className="text-xs" />
              )}
            </div>
          </CardContent>
        </Card>

        {statsCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 ${stat.color} rounded-full`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
            <div
              className={`absolute bottom-0 left-0 right-0 h-1 ${stat.color}`}
            ></div>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-muted/30 to-transparent border-t-4 border-t-cyan-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-1.5 bg-cyan-500 rounded-lg">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common administrative tasks you can perform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-medium">
                Review pending feedback
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium">Add new courses</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-medium">
                Manage course relationships
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors cursor-pointer">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">
                Update degree information
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 transition-colors cursor-pointer">
              <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
              <span className="text-sm font-medium">Monitor user activity</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span className="text-sm font-medium">Export analytics data</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
