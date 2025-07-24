import * as React from 'react'
import { cn } from '../../utils/cn'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface SidebarGroupLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface SidebarGroupContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface SidebarMenuProps extends React.HTMLAttributes<HTMLUListElement> {
  children: React.ReactNode
}

interface SidebarMenuItemProps extends React.HTMLAttributes<HTMLLIElement> {
  children: React.ReactNode
}

interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  isActive?: boolean
  asChild?: boolean
}

function Sidebar({ className, children, ...props }: SidebarProps) {
  return (
    <div
      className={cn(
        'flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function SidebarContent({
  className,
  children,
  ...props
}: SidebarContentProps) {
  return (
    <div
      className={cn('flex flex-1 flex-col gap-2 overflow-auto p-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}

function SidebarGroup({ className, children, ...props }: SidebarGroupProps) {
  return (
    <div className={cn('space-y-1', className)} {...props}>
      {children}
    </div>
  )
}

function SidebarGroupLabel({
  className,
  children,
  ...props
}: SidebarGroupLabelProps) {
  return (
    <div
      className={cn(
        'px-2 py-1.5 text-xs font-medium text-sidebar-foreground/70',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function SidebarGroupContent({
  className,
  children,
  ...props
}: SidebarGroupContentProps) {
  return (
    <div className={cn('space-y-1', className)} {...props}>
      {children}
    </div>
  )
}

function SidebarMenu({ className, children, ...props }: SidebarMenuProps) {
  return (
    <ul className={cn('space-y-1', className)} {...props}>
      {children}
    </ul>
  )
}

function SidebarMenuItem({
  className,
  children,
  ...props
}: SidebarMenuItemProps) {
  return (
    <li className={className} {...props}>
      {children}
    </li>
  )
}

function SidebarMenuButton({
  className,
  children,
  isActive = false,
  asChild = false,
  ...props
}: SidebarMenuButtonProps) {
  if (asChild) {
    return (
      <div
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring',
          isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
          className
        )}
      >
        {children}
      </div>
    )
  }

  return (
    <button
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring',
        isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
}
