import { Outlet } from 'react-router'

// Structural wrapper for all /en/* routes.
// Language detection happens in root.tsx based on URL prefix.
export default function EnLayout() {
  return <Outlet />
}
