import { Award, Medal, Star, TrendingUp, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getAssetUrl } from '~/utils'

const facultyStats = [
  {
    name: 'IST',
    logo: 'faculties/ist/logo.png',
    points: 4109,
    feedbacks: 491,
    contributors: 140
  },
  {
    name: 'Nova SBE',
    logo: 'faculties/nova_sbe/logo.png',
    points: 3044,
    feedbacks: 400,
    contributors: 100
  },
  {
    name: 'Nova FCT',
    logo: 'faculties/nova_fct/logo.png',
    points: 1223,
    feedbacks: 125,
    contributors: 13
  }
]

const topDegrees = [
  {
    name: "Bachelor's in Management",
    acronym: 'BM',
    faculty: 'Nova SBE',
    points: 1723,
    feedbacks: 216,
    contributors: 38
  },
  {
    name: 'Mestrado em Engenharia Eletrotécnica e de Computadores',
    acronym: 'MEEC',
    faculty: 'IST',
    points: 1191,
    feedbacks: 161,
    contributors: 42
  },
  {
    name: "Master's in Management",
    acronym: 'MM',
    faculty: 'Nova SBE',
    points: 868,
    feedbacks: 76,
    contributors: 26
  },
  {
    name: 'Mestrado em Engenharia Informática e de Computadores',
    acronym: 'MEIC',
    faculty: 'IST',
    points: 856,
    feedbacks: 96,
    contributors: 29
  },
  {
    name: 'Licenciatura em Engenharia Biológica',
    acronym: 'LEBiol',
    faculty: 'IST',
    points: 430,
    feedbacks: 28,
    contributors: 7
  }
]

const facultyColors: Record<string, string> = {
  'Nova SBE': 'bg-tint-orange text-tint-orange-fg border-tint-orange-border',
  IST: 'bg-tint-blue text-tint-blue-fg border-tint-blue-border',
  'Nova FCT': 'bg-tint-purple text-tint-purple-fg border-tint-purple-border'
}

export function GiveawayRecapCommunity() {
  const { t } = useTranslation('legal')

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-12">
            {t('giveaway_recap.community_title')}
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Power Users */}
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Award className="size-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  {t('giveaway_recap.power_users_title')}
                </h3>
                <p className="text-muted-foreground">
                  <span className="font-bold text-primary">98</span>{' '}
                  {t('giveaway_recap.power_users_suffix')}
                </p>
              </div>
            </div>

            {/* Top Contributor */}
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Star className="size-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  {t('giveaway_recap.top_contributor_title')}
                </h3>
                <p className="text-muted-foreground">
                  {t('giveaway_recap.top_contributor_prefix')}{' '}
                  <span className="font-bold text-primary">37</span>{' '}
                  {t('giveaway_recap.top_contributor_suffix')}
                </p>
              </div>
            </div>

            {/* Peak Activity */}
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                <TrendingUp className="size-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  {t('giveaway_recap.peak_activity_title')}
                </h3>
                <p className="text-muted-foreground">
                  {t('giveaway_recap.peak_activity_prefix')}{' '}
                  <span className="font-bold text-primary">117</span>{' '}
                  {t('giveaway_recap.peak_activity_suffix')}
                </p>
              </div>
            </div>
          </div>

          {/* Faculty Breakdown */}
          <div className="mt-12 mx-auto max-w-4xl">
            <h3 className="text-lg font-semibold mb-6 text-center text-muted-foreground">
              {t('giveaway_recap.participation_by_faculty')}
            </h3>

            <div className="grid md:grid-cols-3 gap-6 relative">
              {facultyStats.map((faculty) => (
                <div
                  key={faculty.name}
                  className="bg-background border rounded-lg p-6 text-center"
                >
                  <div className="flex justify-center mb-3">
                    <span className="inline-flex items-center rounded-lg border border-border bg-white px-4 py-3">
                      <img
                        src={getAssetUrl(faculty.logo)}
                        alt={faculty.name}
                        className="h-12 w-auto object-contain"
                      />
                    </span>
                  </div>
                  <h4 className="font-semibold text-lg mb-3">{faculty.name}</h4>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-primary">
                      {faculty.points.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('giveaway_recap.points_label')}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      {faculty.feedbacks} {t('giveaway_recap.feedbacks_label')}{' '}
                      • {faculty.contributors}{' '}
                      {t('giveaway_recap.contributors_label')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Most Active Degrees */}
          <div className="mt-12 mx-auto max-w-3xl">
            <h3 className="text-lg font-semibold mb-6 text-center text-muted-foreground">
              {t('giveaway_recap.most_active_degrees')}
            </h3>

            <div className="bg-background border rounded-lg divide-y">
              {topDegrees.map((degree, index) => (
                <div key={degree.acronym} className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <div className="flex-shrink-0">
                      <div
                        className={`flex items-center justify-center size-8 rounded-lg ${
                          index === 0
                            ? 'bg-yellow-500 text-white'
                            : index === 1
                              ? 'bg-muted text-foreground'
                              : index === 2
                                ? 'bg-tint-amber text-tint-amber-fg'
                                : 'bg-muted text-muted-foreground font-bold text-sm'
                        }`}
                      >
                        {index === 0 ? (
                          <Trophy className="size-5" />
                        ) : index === 1 || index === 2 ? (
                          <Medal className="size-5" />
                        ) : (
                          index + 1
                        )}
                      </div>
                    </div>

                    {/* Degree Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm mb-1 break-words">
                            {degree.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-muted-foreground">
                              {degree.acronym}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span
                              className={`px-2 py-0.5 rounded-full border ${facultyColors[degree.faculty] || 'bg-muted text-muted-foreground'}`}
                            >
                              {degree.faculty}
                            </span>
                          </div>
                        </div>

                        {/* Points & Stats */}
                        <div className="flex-shrink-0 flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">
                              {degree.points.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t('giveaway_recap.points_label')}
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-xs text-muted-foreground">
                              {degree.feedbacks}{' '}
                              {t('giveaway_recap.feedbacks_label')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {degree.contributors}{' '}
                              {t('giveaway_recap.contributors_label')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
