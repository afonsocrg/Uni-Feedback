import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipTrigger
} from '@ui/tooltip'
import React from 'react'

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
}

export function Tooltip({ children, content }: TooltipProps) {
  return (
    <ShadcnTooltip>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </ShadcnTooltip>
  )
}
