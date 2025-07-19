export interface ActionButtonProps {
  label: string
  description?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}
export function ActionButton({
  label,
  description,
  onClick,
  variant = 'primary'
}: ActionButtonProps) {
  const buttonClasses =
    variant === 'primary'
      ? 'bg-primaryBlue hover:bg-primaryBlue/80 text-white'
      : 'bg-white border-2 border-primaryBlue text-primaryBlue hover:bg-primaryBlue hover:text-white'

  const commonClasses =
    'font-semibold py-2 md:py-3 w-full max-w-[180px] rounded-lg shadow transition-all text-lg focus:outline-none focus:ring-2 focus:ring-primaryBlue focus:ring-offset-2 cursor-pointer'

  return (
    <div className="flex flex-col items-center w-full max-w-[180px]">
      <button onClick={onClick} className={`${buttonClasses} ${commonClasses}`}>
        {label}
      </button>
      {description && (
        <span className="hidden md:inline text-gray-400 text-xs md:text-sm font-medium w-full max-w-[180px] text-center mt-2 break-words">
          {description}
        </span>
      )}
    </div>
  )
}
