import { cn } from '@/utils'
import { SelectionCard } from '@components'
import { Degree } from '@services/meicFeedbackAPI'
import { motion } from 'framer-motion'

interface DegreeCardProps {
  degree: Degree
  onClick: () => void
  className?: string
}

export function DegreeCard({ degree, onClick, className }: DegreeCardProps) {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300 }
    }
  }

  return (
    <motion.div variants={itemVariants} className={className}>
      <SelectionCard
        title={degree.acronym}
        subtitle={degree.name}
        description={degree.type}
        onClick={onClick}
      />
    </motion.div>
  )
}
