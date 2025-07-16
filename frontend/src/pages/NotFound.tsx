import { ErrorPanel } from '@components'
import { motion } from 'framer-motion'
import { Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <motion.main
      className="container mx-auto px-4 py-8 min-h-[60vh] flex flex-col justify-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <ErrorPanel
        headline="Lost in space?"
        message="We couldn't find the page you were looking for. But don't worry, you can always go back home!"
      >
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primaryBlue text-white rounded-lg hover:bg-primaryBlue/90 transition-colors cursor-pointer"
        >
          <Home className="h-5 w-5" />
          <span>Take me home!</span>
        </button>
      </ErrorPanel>
    </motion.main>
  )
}
