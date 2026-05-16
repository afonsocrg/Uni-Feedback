import { Trans, useTranslation } from 'react-i18next'

export function MoreThanYourNetworkSection() {
  const { t } = useTranslation('landing')

  return (
    <section className="py-28 md:py-36 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-[720px] mx-auto text-center space-y-10">
          <p className="text-3xl md:text-5xl leading-[1.45] font-medium tracking-tight text-balance">
            <Trans
              i18nKey="more_than_network.quote"
              ns="landing"
              components={{ highlight: <span className="text-primary" /> }}
            />
          </p>
          <p className="text-md text-muted-foreground max-w-[560px] mx-auto">
            {t('more_than_network.desc')}
          </p>
        </div>
      </div>
    </section>
  )
}
