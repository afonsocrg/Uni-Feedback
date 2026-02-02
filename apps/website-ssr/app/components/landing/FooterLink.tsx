interface FooterLinkProps {
  href: string
  children: React.ReactNode
  onClick?: () => void
}

export function FooterLink({ href, children, onClick }: FooterLinkProps) {
  return (
    <a
      href={href}
      className="hover:text-foreground transition-colors"
      onClick={onClick}
    >
      {children}
    </a>
  )
}
