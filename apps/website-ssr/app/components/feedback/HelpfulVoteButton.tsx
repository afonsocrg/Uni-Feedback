import { addHelpfulVote, removeHelpfulVote } from '@uni-feedback/api-client'
import { cn } from '@uni-feedback/ui/utils'
import { ThumbsUp } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AuthenticatedButton } from '~/components'

interface HelpfulVoteButtonProps {
  feedbackId: number
  initialVoteCount?: number
  initialHasVoted?: boolean
  className?: string
}

export function HelpfulVoteButton({
  feedbackId,
  initialVoteCount = 0,
  initialHasVoted = false,
  className
}: HelpfulVoteButtonProps) {
  const [hasVoted, setHasVoted] = useState(initialHasVoted)
  const [voteCount, setVoteCount] = useState(initialVoteCount)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleVote = async () => {
    if (isLoading) return

    // Optimistic update
    const wasVoted = hasVoted
    const prevCount = voteCount
    setHasVoted(!wasVoted)
    setVoteCount(wasVoted ? prevCount - 1 : prevCount + 1)
    setIsLoading(true)

    try {
      if (wasVoted) {
        await removeHelpfulVote(feedbackId)
      } else {
        await addHelpfulVote(feedbackId)
      }
    } catch (error) {
      // Revert on error
      setHasVoted(wasVoted)
      setVoteCount(prevCount)
      toast.error(
        error instanceof Error ? error.message : 'Failed to update vote'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthenticatedButton
      variant="ghost"
      size="sm"
      onClick={handleToggleVote}
      disabled={isLoading}
      className={cn(
        'h-8 px-2 text-gray-500 hover:text-gray-700',
        hasVoted && 'text-primaryBlue hover:text-primaryBlue/80',
        className
      )}
    >
      <ThumbsUp className={cn('size-4', hasVoted && 'fill-current')} />
      <span className="ml-1 text-xs font-medium">
        Helpful{voteCount > 0 && ` (${voteCount})`}
      </span>
    </AuthenticatedButton>
  )
}
