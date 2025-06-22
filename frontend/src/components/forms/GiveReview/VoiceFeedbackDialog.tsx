import { useIsMobile } from '@/hooks'
import { Button, Dialog, DialogContent, DialogTitle } from '@ui'
import {
  CheckCircle,
  FileText,
  Mic,
  Monitor,
  Smartphone,
  Volume2
} from 'lucide-react'
import { useState } from 'react'
import { FaTelegram, FaWhatsapp } from 'react-icons/fa'
import QRCode from 'react-qr-code'

interface VoiceFeedbackDialogProps {
  isOpen: boolean
  onClose: () => void
}
export function VoiceFeedbackDialog({
  isOpen,
  onClose
}: VoiceFeedbackDialogProps) {
  const isMobile = useIsMobile()
  const [selectedPlatform, setSelectedPlatform] = useState<
    'whatsapp' | 'telegram'
  >('whatsapp')
  const telegramBotUrl = 'https://t.me/istfeedback_bot'
  const whatsappUrl = `https://wa.me/${import.meta.env.VITE_WHATSAPP_BOT_NUMBER}`

  const whatsappWarningMessage =
    'WhatsApp messages go directly to our team (no bot yet) - may take longer to process'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="hidden">
        <DialogTitle>Voice Feedback Feature</DialogTitle>
      </div>
      <DialogContent className="!max-w-[600px] max-h-[80vh] flex flex-col">
        <div className="space-y-4 sm:space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-istBlue/10 rounded-full">
                <Mic className="w-6 h-6 text-istBlue" />
              </div>
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Submit Feedback with1 a Voice Message!
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Send us a voice message and we'll create your feedback
              automatically!
            </p>
          </div>

          {/* How It Works */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="font-medium text-gray-900 text-xs sm:text-sm">
              How it works:
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2 sm:gap-3">
                <Volume2 className="w-4 h-4 sm:w-4 sm:h-4 text-istBlue mt-0.5 flex-shrink-0" />
                <div className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium">Record:</span> Send us a voice
                  message telling us about a course you took
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <FileText className="w-4 h-4 sm:w-4 sm:h-4 text-istBlue mt-0.5 flex-shrink-0" />
                <div className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium">Process:</span> We'll create a
                  feedback draft based on your audio
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <CheckCircle className="w-4 h-4 sm:w-4 sm:h-4 text-istBlue mt-0.5 flex-shrink-0" />
                <div className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium">Submit:</span> We'll send you a
                  link for you to validate and submit your feedback
                </div>
              </div>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="border-t pt-3 sm:pt-4">
            <h4 className="font-medium text-gray-900 text-sm mb-3 text-center">
              Choose your preferred platform:
            </h4>

            {isMobile ? (
              /* Mobile: Side-by-side buttons */
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      window.open(whatsappUrl, '_blank')
                      onClose()
                    }}
                    className="bg-istBlue hover:bg-istBlue/90 text-white text-xs flex-1"
                    size="sm"
                  >
                    <FaWhatsapp className="w-3 h-3 mr-1" />
                    WhatsApp
                    <span className="text-xs bg-white/20 px-1 py-0.5 rounded-full ml-1">
                      Beta
                    </span>
                  </Button>

                  <Button
                    onClick={() => {
                      window.open(telegramBotUrl, '_blank')
                      onClose()
                    }}
                    className="bg-istBlue hover:bg-istBlue/90 text-white text-xs flex-1"
                    size="sm"
                  >
                    <FaTelegram className="w-3 h-3 mr-1" />
                    Telegram
                  </Button>
                </div>
                <p className="text-xs text-gray-500 italic text-center">
                  {whatsappWarningMessage}
                </p>
              </div>
            ) : (
              /* Desktop: Tabs */
              <>
                {/* Platform Tabs */}
                <div className="flex border border-gray-200 rounded-lg mb-4 overflow-hidden">
                  <button
                    onClick={() => setSelectedPlatform('whatsapp')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                      selectedPlatform === 'whatsapp'
                        ? 'bg-istBlue text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FaWhatsapp className="w-4 h-4" />
                    WhatsApp
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full ml-1">
                      Beta
                    </span>
                  </button>
                  <button
                    onClick={() => setSelectedPlatform('telegram')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                      selectedPlatform === 'telegram'
                        ? 'bg-istBlue text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FaTelegram className="w-4 h-4" />
                    Telegram
                  </button>
                </div>

                {/* Platform Content */}
                {selectedPlatform === 'whatsapp' ? (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-3 rounded-lg border-2 border-gray-300">
                        <QRCode
                          value={whatsappUrl}
                          size={100}
                          style={{
                            height: 'auto',
                            maxWidth: '100%',
                            width: '100%'
                          }}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          <Smartphone className="w-4 h-4 inline mr-1" />
                          Scan to send from your phone via WhatsApp
                        </p>
                        <button
                          onClick={() => {
                            window.open(whatsappUrl, '_blank')
                            onClose()
                          }}
                          className="text-xs text-gray-500 hover:text-gray-700 underline block mb-2"
                        >
                          <Monitor className="w-3 h-3 inline mr-1" />
                          Or continue on this computer
                        </button>
                        <p className="text-xs text-gray-500 italic">
                          {whatsappWarningMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-3 rounded-lg border-2 border-gray-300">
                        <QRCode
                          value={telegramBotUrl}
                          size={100}
                          style={{
                            height: 'auto',
                            maxWidth: '100%',
                            width: '100%'
                          }}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          <Smartphone className="w-4 h-4 inline mr-1" />
                          Scan to send from your phone via Telegram
                        </p>
                        <button
                          onClick={() => {
                            window.open(telegramBotUrl, '_blank')
                            onClose()
                          }}
                          className="text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          <Monitor className="w-3 h-3 inline mr-1" />
                          Or continue on this computer
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
