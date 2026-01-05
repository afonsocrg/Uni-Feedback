import { Input } from '@uni-feedback/ui'

interface DatePickerProps {
  selected?: Date
  onSelect: (date: Date | undefined) => void
  placeholder?: string
}

export function DatePicker({
  selected,
  onSelect,
  placeholder
}: DatePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      onSelect(new Date(e.target.value))
    } else {
      onSelect(undefined)
    }
  }

  const value = selected ? selected.toISOString().split('T')[0] : ''

  return (
    <Input
      type="date"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className="w-full"
    />
  )
}
