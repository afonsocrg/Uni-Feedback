import { isMobile as _isMobile } from '@utils/mobile'
import { useState } from 'react'

export function useIsMobile() {
  const [isMobile] = useState(_isMobile())
  // useEffect(() => {
  //   const handleResize = () => {
  //     setIsMobile(_isMobile())
  //   }
  //   window.addEventListener('resize', handleResize)
  //   return () => window.removeEventListener('resize', handleResize)
  // }, [])
  return isMobile
}
