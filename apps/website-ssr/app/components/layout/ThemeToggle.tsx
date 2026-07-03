import { Button } from '@uni-feedback/ui'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '~/providers/ThemeProvider'

export function ThemeToggle() {
  const { resolved, toggle } = useTheme()
  const isDark = resolved === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={isDark ? 'Modo claro' : 'Modo escuro'}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
