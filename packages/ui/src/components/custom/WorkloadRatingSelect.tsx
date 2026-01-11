import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '../shadcn/select'
import { WorkloadRatingDisplay } from './WorkloadRatingDisplay'

interface WorkloadRatingSelectProps {
  value: number | null
  onChange: (value: number | null) => void
  placeholder?: string
  className?: string
}

export function WorkloadRatingSelect({
  value,
  onChange,
  placeholder = 'Select workload rating',
  className = ''
}: WorkloadRatingSelectProps) {
  return (
    <Select
      onValueChange={(val) => onChange(val === 'none' ? null : Number(val))}
      value={value?.toString() || 'none'}
    >
      <SelectTrigger className={`bg-white min-h-[40px] ${className}`}>
        <SelectValue placeholder={placeholder}>
          {value ? <WorkloadRatingDisplay rating={value} /> : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Workload Rating</SelectLabel>
          <SelectItem value="none">No rating</SelectItem>
          {[5, 4, 3, 2, 1].map((rating) => (
            <SelectItem key={rating} value={rating.toString()}>
              <WorkloadRatingDisplay rating={rating} />
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
