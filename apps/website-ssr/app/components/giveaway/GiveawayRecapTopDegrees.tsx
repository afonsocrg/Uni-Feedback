const topDegrees = [
  {
    name: "Bachelor's in Management",
    acronym: 'BM',
    faculty: 'Nova SBE',
    count: 216
  },
  {
    name: 'Mestrado em Engenharia Eletrotécnica e de Computadores',
    acronym: 'MEEC',
    faculty: 'IST',
    count: 161
  },
  {
    name: 'Mestrado em Engenharia Informática e de Computadores',
    acronym: 'MEIC',
    faculty: 'IST',
    count: 96
  },
  {
    name: 'Licenciatura em Engenharia Mecânica',
    acronym: 'LEMec',
    faculty: 'IST',
    count: 81
  },
  {
    name: "Master's in Management",
    acronym: 'MM',
    faculty: 'Nova SBE',
    count: 74
  }
]

const facultyColors: Record<string, string> = {
  'Nova SBE': 'bg-orange-500/10 text-orange-700 border-orange-200',
  IST: 'bg-blue-500/10 text-blue-700 border-blue-200',
  'Nova FCT': 'bg-purple-500/10 text-purple-700 border-purple-200'
}

export function GiveawayRecapTopDegrees() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Most Discussed Degrees
            </h2>
            <p className="text-muted-foreground">
              Programs where students had the most to share
            </p>
          </div>

          <div className="space-y-4">
            {topDegrees.map((degree, index) => (
              <div
                key={degree.acronym}
                className="bg-card border rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Rank Badge */}
                  <div className="flex-shrink-0">
                    <div
                      className={`flex items-center justify-center size-12 rounded-lg font-bold text-lg ${
                        index === 0
                          ? 'bg-yellow-500 text-white'
                          : index === 1
                            ? 'bg-gray-300 text-gray-700'
                            : index === 2
                              ? 'bg-orange-300 text-orange-900'
                              : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {index + 1}
                    </div>
                  </div>

                  {/* Degree Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 break-words">
                          {degree.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {degree.acronym}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full border ${facultyColors[degree.faculty] || 'bg-muted text-muted-foreground'}`}
                          >
                            {degree.faculty}
                          </span>
                        </div>
                      </div>

                      {/* Review Count */}
                      <div className="flex-shrink-0 text-right">
                        <div className="text-2xl font-bold text-primary">
                          {degree.count}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          reviews
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              These degrees generated the most discussion and feedback from
              students
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
