import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Chip
} from '@uni-feedback/ui'
import { MessageSquare, CheckCircle, XCircle } from 'lucide-react'

export function FeedbackPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
          <p className="text-muted-foreground">
            Review and moderate student feedback
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip label="47 Pending" color="orange" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Feedback
            </CardTitle>
            <div className="p-2 bg-blue-500 rounded-full">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">1,247</div>
            <p className="text-xs text-muted-foreground">
              All time submissions
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <div className="p-2 bg-green-500 rounded-full">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">1,200</div>
            <p className="text-xs text-muted-foreground">Published feedback</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <div className="p-2 bg-orange-500 rounded-full">
              <XCircle className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">47</div>
            <p className="text-xs text-muted-foreground">Awaiting moderation</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback Management
          </CardTitle>
          <CardDescription>
            Review and moderate student course feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Feedback management functionality will be implemented here. This
            will include:
          </p>
          <ul className="mt-4 list-disc list-inside text-muted-foreground space-y-1">
            <li>List all feedback with filtering options</li>
            <li>Approve or reject pending feedback</li>
            <li>Edit feedback content if needed</li>
            <li>View detailed feedback statistics</li>
            <li>Export feedback data for analysis</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
