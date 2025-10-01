export interface ErrorPanelProps {
  headline: string
  message: string
  children?: React.ReactNode
}
export function ErrorPanel({ headline, message, children }: ErrorPanelProps) {
  return (
    <div className="flex flex-col items-center bg-white rounded-lg shadow p-8 min-w-[400px] max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">{headline}</h2>
      <p className="text-gray-600 mb-6 text-center">{message}</p>
      {children}
    </div>
  )
}
