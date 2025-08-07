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
              className="text-primaryBlue hover:text-primaryBlue/80 font-medium transition-colors"
            >
              IST community
            </a> */}
          </div>
          <div className="flex gap-6">
            <a
              href="/terms"
              className="text-primaryBlue hover:text-primaryBlue/80 text-sm font-medium transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="/privacy"
              className="text-primaryBlue hover:text-primaryBlue/80 text-sm font-medium transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="https://github.com/afonsocrg/meic-feedback/issues/new?template=feature_request.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primaryBlue hover:text-primaryBlue/80 text-sm font-medium transition-colors"
            >
              Request a feature
            </a>
            <a
              href="https://github.com/afonsocrg/meic-feedback/issues/new?template=bug_report.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primaryBlue hover:text-primaryBlue/80 text-sm font-medium transition-colors"
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
