import { useQueryClient } from '@tanstack/react-query'
import {
  deleteInstagramHandle,
  setInstagramHandle
} from '@uni-feedback/api-client'
import { Button } from '@uni-feedback/ui'
import { normalizeInstagramHandle } from '@uni-feedback/utils'
import { CheckCircle2, Loader2, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SiInstagram } from 'react-icons/si'
import { toast } from 'sonner'
import { useProfile } from '~/hooks/queries'
import { INSTAGRAM_URL } from '~/utils/constants'

/** One-time bonus for linking Instagram (mirrors INSTAGRAM_BONUS_POINTS on the API). */
const INSTAGRAM_BONUS_POINTS = 20

/**
 * Instagram bonus rendered as a single row inside the "Boost your points"
 * panel. The reward (+20) leads the right side; a "Link" button reveals the
 * handle form inline, and once linked the row shows the handle with edit /
 * remove icon buttons and a green check. Owns its own link / edit / remove flow.
 */
export function InstagramBonusRow() {
  const { t } = useTranslation('feedback')
  const queryClient = useQueryClient()
  const { data: profileData } = useProfile()
  const instagramHandle = profileData?.user.instagramHandle ?? null

  const [isEditing, setIsEditing] = useState(false)
  const [showForm, setShowForm] = useState(false)
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

  const closeForm = () => {
    setIsEditing(false)
    setShowForm(false)
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
      closeForm()
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
      closeForm()
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
  const showLinked = linked && !isEditing
  const expanded = isEditing || (!linked && showForm)

  return (
    <div className="p-4">
      {/* On mobile the reward + action wrap to their own full-width row so the
          title and description keep the full width and stay readable. */}
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-3">
        <div className="flex size-9 flex-none items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <SiInstagram className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-primary"
            >
              {t('profile.giveaway.instagram_title')}
            </a>
            {showLinked && (
              <CheckCircle2 className="size-4 flex-none text-success" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {showLinked
              ? `@${instagramHandle}`
              : t('profile.giveaway.instagram_desc')}
          </p>
        </div>

        <div className="flex w-full items-center gap-3 sm:w-auto">
          <span
            className={`text-lg font-extrabold tabular-nums ${
              showLinked ? 'text-success' : 'text-amber-500'
            }`}
          >
            +{INSTAGRAM_BONUS_POINTS}
          </span>
          {showLinked ? (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={startEditing}
                disabled={isSaving}
                aria-label={t('profile.instagram_edit_btn')}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemove}
                disabled={isSaving}
                aria-label={t('profile.instagram_remove_btn')}
              >
                {isSaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </div>
          ) : (
            !expanded && (
              <Button size="sm" onClick={() => setShowForm(true)}>
                {t('profile.instagram_link_btn')}
              </Button>
            )
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3">
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
          {/* Verify note lives here (shown only while linking) instead of a
              persistent "?" in the row, which crowded the row on mobile. */}
          <p className="mt-2 text-xs text-muted-foreground">
            {t('profile.giveaway.instagram_verify_note')}
          </p>
          <button
            type="button"
            onClick={closeForm}
            disabled={isSaving}
            className="mt-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('profile.instagram_cancel_btn')}
          </button>
        </div>
      )}
    </div>
  )
}
