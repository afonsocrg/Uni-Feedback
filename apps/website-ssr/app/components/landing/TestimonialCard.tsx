import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  CardContent,
  StarRating
} from '@uni-feedback/ui'

interface TestimonialProps {
  rating: number
  testimonial: string
  name: string
  course: string
  avatarUrl?: string
}

export function TestimonialCard({
  rating,
  testimonial,
  name,
  course,
  avatarUrl
}: TestimonialProps) {
  // Generate initials from name
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return (
    <Card className="h-full">
      <CardContent className="flex flex-col h-full space-y-4">
        <StarRating value={rating} size="sm" />
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
          "{testimonial}"
        </p>
        <div className="flex items-center gap-3 pt-2">
          <Avatar>
            {avatarUrl && <AvatarImage src={avatarUrl} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-muted-foreground">{course}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
