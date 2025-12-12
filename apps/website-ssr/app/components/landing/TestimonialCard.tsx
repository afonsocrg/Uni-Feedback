import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  CardContent
} from '@uni-feedback/ui'

interface TestimonialProps {
  testimonial: string
  name: string
  course: string
  avatarUrl?: string
  url?: string
}

export function TestimonialCard({
  testimonial,
  name,
  course,
  avatarUrl,
  url
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
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
          "{testimonial}"
        </p>
        <div className="flex items-center gap-3 pt-2">
          <Avatar>
            {avatarUrl && <AvatarImage src={avatarUrl} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:underline"
              >
                {name}
              </a>
            ) : (
              <div className="text-sm font-medium">{name}</div>
            )}
            <div className="text-xs text-muted-foreground">{course}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
