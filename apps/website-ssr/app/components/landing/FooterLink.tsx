interface FooterLinkProps {
  href: string
  children: React.ReactNode
}

export function FooterLink({ href, children }: FooterLinkProps) {
  return (
    <a href={href} className="hover:text-foreground transition-colors">
      {children}
    </a>
  )
}
