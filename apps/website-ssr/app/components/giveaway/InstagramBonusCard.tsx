import { useQueryClient } from '@tanstack/react-query'
import {
  deleteInstagramHandle,
  setInstagramHandle
} from '@uni-feedback/api-client'
import { Button } from '@uni-feedback/ui'
import { normalizeInstagramHandle } from '@uni-feedback/utils'
import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SiInstagram } from 'react-icons/si'
import { toast } from 'sonner'
import { InfoPopover } from '~/components/common'
import { useProfile } from '~/hooks/queries'
import { INSTAGRAM_URL } from '~/utils/constants'

const PANEL = 'flex flex-col rounded-xl border bg-card p-6 shadow-sm'

/**
 * Self-contained Instagram-link card for the giveaway dashboard. Owns the link
 * / edit / remove flow (moved here from the profile header) and shows a green
 * check once linked.
 */
export function InstagramBonusCard() {
  const { t } = useTranslation('feedback')
  const queryClient = useQueryClient()
  const { data: profileData } = useProfile()
  const instagramHandle = profileData?.user.instagramHandle ?? null

  const [isEditing, setIsEditing] = useState(false)
  const [input, setInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] }),
      queryClient.invalidateQueries({ queryKey: ['user', 'stats'] }),
      queryClient.invalidateQueries({ queryKey: ['user', 'giveaway'] })
    ])

  const startEditing = () => {
    setInput(instagramHandle ?? '')
    setIsEditing(true)
  }

  const handleSave = async () => {
    const normalized = normalizeInstagramHandle(input)
    if (!normalized) {
      toast.error(t('profile.instagram_invalid'))
      return
    }
    setIsSaving(true)
    try {
      const wasLinked = instagramHandle !== null
      await setInstagramHandle(normalized)
      await refresh()
      setIsEditing(false)
      toast.success(
        wasLinked
          ? t('profile.toast_instagram_updated')
          : t('profile.toast_instagram_linked')
      )
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('profile.toast_instagram_failed')
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = async () => {
    setIsSaving(true)
    try {
      await deleteInstagramHandle()
      await refresh()
      setIsEditing(false)
      toast.success(t('profile.toast_instagram_removed'))
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('profile.toast_instagram_failed')
      )
    } finally {
      setIsSaving(false)
    }
  }

  const linked = instagramHandle !== null

  return (
    <div className={PANEL}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex min-w-0 items-center gap-1.5 font-medium transition-colors hover:text-primary"
          >
            <SiInstagram className="size-4 flex-shrink-0" />
            {t('profile.giveaway.instagram_title')}
            <ExternalLink className="size-3.5 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          </a>
          <InfoPopover
            content={t('profile.giveaway.instagram_verify_note')}
            label={t('profile.giveaway.instagram_verify_note')}
            className="flex-shrink-0"
          />
        </div>
        {linked && !isEditing && (
          <CheckCircle2 className="size-5 text-success flex-shrink-0" />
        )}
      </div>

      {linked && !isEditing ? (
        <>
          <p className="text-sm text-success mb-4">
            {t('profile.giveaway.instagram_linked')}
          </p>
          <div className="flex items-center gap-2">
            <span className="flex-1 text-sm font-medium truncate">
              @{instagramHandle}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={startEditing}
              disabled={isSaving}
            >
              {t('profile.instagram_edit_btn')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t('profile.instagram_remove_btn')
              )}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {t('profile.giveaway.instagram_desc')}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSave()
            }}
            className="flex overflow-hidden rounded-lg border bg-background transition-shadow focus-within:ring-2 focus-within:ring-primary/40"
          >
            <span className="flex items-center pl-3 text-muted-foreground">
              <SiInstagram className="size-4" />
            </span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('profile.instagram_placeholder')}
              disabled={isSaving}
              className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={isSaving || input.trim() === ''}
              className="flex items-center gap-1.5 bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t('profile.instagram_link_btn')
              )}
            </button>
          </form>
          {isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="mt-2 self-start text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('profile.instagram_cancel_btn')}
            </button>
          )}
        </>
      )}
    </div>
  )
}
