interface NavLinkProps {
  href: string
  children: React.ReactNode
}

export function NavLink({ href, children }: NavLinkProps) {
  return (
    <a
      href={href}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </a>
  )
}
