import { AdminFeedbackDetail } from '@uni-feedback/api-client'
import { Button, Markdown } from '@uni-feedback/ui'
import { Edit3 } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { EditCommentDialog } from './EditCommentDialog'

interface CommentTabContentProps {
  feedback: AdminFeedbackDetail
}

export function CommentTabContent({ feedback }: CommentTabContentProps) {
  const { id } = useParams<{ id: string }>()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const feedbackId = id ? parseInt(id, 10) : 0

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Student Comment</h3>
          {feedback.comment && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Comment
            </Button>
          )}
        </div>

        <div className="min-h-32 p-4 border rounded-md bg-muted/50">
          {feedback.comment ? (
            <div className="prose prose-sm max-w-none">
              <Markdown>{feedback.comment}</Markdown>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No comment was left for this feedback.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Add Comment
              </Button>
            </div>
          )}
        </div>
      </div>

      <EditCommentDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        feedbackId={feedbackId}
        initialComment={feedback.comment}
      />
    </>
  )
}
