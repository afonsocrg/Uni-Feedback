import {
  getFaculties,
  requestChatAccess,
  type Faculty
} from '@uni-feedback/api-client'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Textarea,
  cn
} from '@uni-feedback/ui'
import { Check, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useLang, useLocalStorage } from '~/hooks'
import { analytics } from '~/utils/analytics'
import { STORAGE_KEYS } from '~/utils/constants'

interface ChatAccessRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Which surface opened it, so the two doors can be told apart. */
  source: string
  /**
   * The question they already typed, if any.
   *
   * When we have this we do NOT ask why they want access: their own words beat
   * any survey answer they would write, and every field removed is completion
   * rate gained.
   */
  question?: string | null
}

/**
 * Who is waiting, as a multi-select.
 *
 * Every single-select version of this list was broken, and always in the same
 * way: someone had two true answers and had to discard one. In school *and*
 * applying. At university *and* switching for a master's. Finished a degree
 * *and* enrolling again. The options are not on one axis, so no ordering of them
 * can be exclusive, and picking an axis to sacrifice loses the segment that made
 * the question worth asking.
 *
 * Letting people pick several dissolves that, and the combinations carry more
 * than the chips do alone. `bachelor` + `want_masters` is a switcher in
 * progress; `finished` + `want_masters` is someone coming back; `high_school`
 * alone is a tenth-grader while `high_school` + `applying` is a twelfth-grader
 * in the middle of it. None of that survives a forced choice.
 *
 * `university_not_listed` is the one that is actionable the same day: it names a
 * domain to whitelist. `studying_abroad` refines it, since a foreign university
 * is a different decision from a Portuguese one we have simply not added.
 */
const ROLES = [
  'high_school',
  'bachelor',
  'masters',
  'finished',
  'applying',
  'want_masters',
  'changing_university',
  'university_not_listed',
  'studying_abroad',
  'other'
] as const

/**
 * The door for people who cannot sign up at all.
 *
 * Login needs a university email from a whitelisted domain, so school students,
 * graduates and anyone at a university we have not added yet have no way in.
 * This captures them: an email we can write to when we open up, plus enough
 * about who they are to know which universities to prioritise.
 *
 * Three fields, and that is the ceiling. The only job here is capturing an
 * address, so anything that does not change what we would do next does not earn
 * a row. That is why there is no longer a "when do you need this": it was only
 * meaningful for one of the four roles (a blocked student and a graduate both
 * need it now by definition), it was free to answer so nearly everyone said
 * "this year", and onboarding is timed against each university's enrolment
 * calendar regardless of what any one person tells us.
 *
 * Native rather than the Google Form used for missing course data. Those are
 * different intents, merging them makes both sets of answers unusable, and a
 * form off-site would put these addresses somewhere the privacy policy would
 * have to name as a processor.
 */
export function ChatAccessRequestDialog({
  open,
  onOpenChange,
  source,
  question
}: ChatAccessRequestDialogProps) {
  const { t } = useTranslation('chat')
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [email, setEmail] = useState('')
  const [roles, setRoles] = useState<(typeof ROLES)[number][]>([])
  /**
   * Chips are not a native control, so `required` cannot reach them. Raised on a
   * submit attempt rather than by disabling the button: a dead button next to an
   * untouched chip row gives no reason, and the reason is the whole point.
   */
  const [rolesMissing, setRolesMissing] = useState(false)
  const [other, setOther] = useState('')
  /** Only used when they did not arrive from a question of their own. */
  const [typedQuestion, setTypedQuestion] = useState('')
  const lang = useLang()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  /**
   * The address they already sent, or '' for nobody yet.
   *
   * The guard is here rather than in the API on purpose. The endpoint now keeps
   * every submission, so a duplicate is a real row rather than an error to
   * return, and the only thing worth preventing is a person filling the same
   * form twice without realising the first one landed. This is a convenience,
   * so a cleared browser simply showing the form again is the correct failure.
   */
  const [requestedEmail, setRequestedEmail] = useLocalStorage(
    STORAGE_KEYS.CHAT_ACCESS_REQUEST_EMAIL,
    ''
  )
  const alreadyRequested = Boolean(requestedEmail) && !done

  useEffect(() => {
    if (!open) return
    analytics.chat.accessRequestOpened({ source })
    if (alreadyRequested) {
      analytics.chat.accessRequestAlreadySent({ source })
      return
    }
    getFaculties()
      .then(setFaculties)
      .catch(() => undefined)
  }, [open, source, alreadyRequested])

  const toggle = (id: number) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    )

  const toggleRole = (option: (typeof ROLES)[number]) => {
    setRoles((prev) =>
      prev.includes(option)
        ? prev.filter((value) => value !== option)
        : [...prev, option]
    )
    setRolesMissing(false)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || submitting || alreadyRequested) return
    if (roles.length === 0) {
      setRolesMissing(true)
      return
    }

    setSubmitting(true)
    try {
      await requestChatAccess({
        email: email.trim(),
        facultyIds: selected,
        otherUniversities: other.trim() || undefined,
        roles,
        question: question ?? typedQuestion.trim() ?? undefined,
        // Not asked, just recorded: which language they were reading the site in
        // is a free signal about international students, and one fewer field.
        locale: lang,
        source
      })
      analytics.chat.accessRequestSubmitted({
        source,
        facultyCount: selected.length,
        hasQuestion: Boolean(question ?? typedQuestion.trim())
      })
      setDone(true)
      setRequestedEmail(email.trim().toLowerCase())
    } catch {
      toast.error(t('access.error'))
    }
    setSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {done || alreadyRequested ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Check className="size-6 text-primaryBlue" />
            <DialogTitle>
              {t(
                alreadyRequested ? 'access.already_title' : 'access.done_title'
              )}
            </DialogTitle>
            <DialogDescription>
              {alreadyRequested
                ? t('access.already_body', { email: requestedEmail })
                : t('access.done_body')}
            </DialogDescription>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('access.close')}
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{t('access.title')}</DialogTitle>
              <DialogDescription>{t('access.subtitle')}</DialogDescription>
            </DialogHeader>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">
                {t('access.email')}
                <span className="text-destructive">*</span>
              </span>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('access.email_placeholder')}
              />
            </label>

            <fieldset className="flex flex-col gap-1.5">
              <legend className="text-sm font-medium">
                {t('access.role')}
                <span className="text-destructive">*</span>
              </legend>
              {/* Says outright that more than one is allowed. Chips look the
                  same whether they are radios or checkboxes, and a person who
                  assumes radios stops at the first true answer, which is the
                  behaviour this whole field exists to avoid. */}
              <p className="text-xs text-muted-foreground">
                {t('access.role_hint')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ROLES.map((option) => (
                  <Chip
                    key={option}
                    active={roles.includes(option)}
                    onClick={() => toggleRole(option)}
                  >
                    {t(`access.roles.${option}`)}
                  </Chip>
                ))}
              </div>
              {rolesMissing && (
                <p role="alert" className="text-xs text-destructive">
                  {t('access.role_required')}
                </p>
              )}
            </fieldset>

            <fieldset className="flex flex-col gap-1.5">
              <legend className="text-sm font-medium">
                {t('access.universities')}
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {faculties.map((faculty) => (
                  <Chip
                    key={faculty.id}
                    active={selected.includes(faculty.id)}
                    onClick={() => toggle(faculty.id)}
                  >
                    {faculty.shortName}
                  </Chip>
                ))}
              </div>
              <Input
                value={other}
                onChange={(e) => setOther(e.target.value)}
                placeholder={t('access.other_placeholder')}
              />
            </fieldset>

            {/* Only when they did not arrive from a question. If they did, we
                already have something better than anything this box collects. */}
            {!question && (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">
                  {t('access.question')}
                </span>
                <Textarea
                  rows={2}
                  maxLength={2000}
                  value={typedQuestion}
                  onChange={(e) => setTypedQuestion(e.target.value)}
                  placeholder={t('access.question_placeholder')}
                />
              </label>
            )}

            {/* Above the button, not below it. Submitting the form IS the
                consent, so what we will do with the address has to be readable
                before the click rather than after it. */}
            <p className="text-xs text-muted-foreground">
              {t('access.privacy')}
            </p>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {t('access.submit')}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Chip({
  active,
  onClick,
  children
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors',
        active
          ? 'border-primaryBlue bg-primaryBlue text-white'
          : 'border-border bg-card text-foreground hover:border-primaryBlue'
      )}
    >
      {children}
    </button>
  )
}
