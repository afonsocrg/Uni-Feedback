import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { InfoPopover } from '~/components/common'
import { useLang } from '~/hooks'
import { getLocalePath } from '~/utils/i18n-routes'

export function GiveawayPointsSection() {
  const lang = useLang()
  const { t } = useTranslation('legal')

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-4">
            {t('giveaway_page.points_title')}
          </h2>
          <p className="text-center text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            {t('giveaway_page.points_subtitle')}
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border p-6 md:p-8 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">
                {t('giveaway_page.points_normal_title')}
              </h3>
              <ul className="space-y-4">
                <li>
                  <p className="font-medium">
                    {t('giveaway_page.points_normal_feedback_label')}{' '}
                    <span className="text-primary">
                      {t('giveaway_page.points_normal_feedback_value')}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('giveaway_page.points_normal_feedback_desc')}
                  </p>
                </li>
                <li>
                  <p className="font-medium">
                    {t('giveaway_page.points_normal_referral_label')}{' '}
                    <span className="text-primary">
                      {t('giveaway_page.points_normal_referral_value')}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <Trans
                      i18nKey="giveaway_page.points_normal_referral_desc"
                      ns="legal"
                      components={[
                        <Link
                          to={getLocalePath('profile', lang)}
                          className="font-medium text-foreground underline hover:text-primary"
                        />
                      ]}
                    />
                  </p>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-2xl border p-6 md:p-8 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">
                {t('giveaway_page.points_bonus_title')}
              </h3>
              <ul className="space-y-4">
                <li>
                  <p className="flex items-center gap-1.5 font-medium">
                    <span>
                      {t('giveaway_page.points_bonus_instagram_label')}{' '}
                      <span className="text-primary">
                        {t('giveaway_page.points_bonus_instagram_value')}
                      </span>
                    </span>
                    <InfoPopover
                      content={t(
                        'giveaway_page.points_bonus_instagram_privacy'
                      )}
                      label={t('giveaway_page.points_bonus_instagram_privacy')}
                    />
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <Trans
                      i18nKey="giveaway_page.points_bonus_instagram_desc"
                      ns="legal"
                      components={[
                        <a
                          href="https://www.instagram.com/unifeedback/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-foreground underline hover:text-primary"
                        />,
                        <Link
                          to={getLocalePath('profile', lang)}
                          className="font-medium text-foreground underline hover:text-primary"
                        />
                      ]}
                    />
                  </p>
                </li>
                <li>
                  <p className="font-medium">
                    {t('giveaway_page.points_bonus_quality_label')}{' '}
                    <span className="text-primary">
                      {t('giveaway_page.points_bonus_quality_value')}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('giveaway_page.points_bonus_quality_desc')}
                  </p>
                </li>
              </ul>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            <Trans
              i18nKey="giveaway_page.points_normal_details"
              ns="legal"
              components={[
                <Link
                  to={getLocalePath('points', lang)}
                  className="font-medium text-foreground underline hover:text-primary"
                />
              ]}
            />
          </p>
        </div>
      </div>
    </section>
  )
}
