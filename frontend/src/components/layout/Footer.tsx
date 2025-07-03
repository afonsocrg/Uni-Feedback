export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-600 text-sm">
            {/* Made with{' '}
            <span className="text-red-500" role="img" aria-label="love">
              ❤️
            </span>{' '}
            by the{' '}
            <a
              href="https://github.com/afonsocrg/meic-feedback"
              target="_blank"
              rel="noopener noreferrer"
              className="text-istBlue hover:text-istBlue/80 font-medium transition-colors"
            >
              IST community
            </a> */}
          </div>
          <div className="flex gap-6">
            <a
              href="https://github.com/afonsocrg/meic-feedback/issues/new?template=feature_request.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-istBlue hover:text-istBlue/80 text-sm font-medium transition-colors"
            >
              Request a feature
            </a>
            <a
              href="https://github.com/afonsocrg/meic-feedback/issues/new?template=bug_report.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-istBlue hover:text-istBlue/80 text-sm font-medium transition-colors"
            >
              Report a bug
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
