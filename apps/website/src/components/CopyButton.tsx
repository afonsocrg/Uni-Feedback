import { Button, type ButtonProps } from '@ui/button'
import { Check, Copy } from 'lucide-react'
import { useCallback, useState } from 'react'

export function CopyButton({ onClick, ...props }: ButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    },
    [onClick, setCopied]
  )

  return (
    <Button {...props} onClick={handleCopy}>
      {copied ? (
        <Check className="size-4 text-green-500" />
      ) : (
        <Copy className="size-4" />
      )}
      {copied ? 'Copied!' : 'Copy URL'}
    </Button>
  )
}
