export type Lang = 'pt' | 'en'

export const routeMap = {
  home: {
    paths: { pt: '/', en: '/en' },
    file: 'routes/landing.tsx',
    index: true
  },
  login: { paths: { pt: '/login', en: '/en/login' }, file: 'routes/login.tsx' },
  'login-token': {
    paths: { pt: '/login/:token', en: '/en/login/:token' },
    file: 'routes/login.$token.tsx'
  },
  unsubscribe: {
    paths: { pt: '/cancelar-subscricao', en: '/en/unsubscribe' },
    file: 'routes/unsubscribe.tsx'
  },
  browse: {
    paths: { pt: '/procurar', en: '/en/browse' },
    file: 'routes/browse.tsx'
  },
  giveaway: {
    paths: { pt: '/sorteio', en: '/en/giveaway' },
    file: 'routes/giveaway.tsx'
  },
  'giveaway-rules': {
    paths: { pt: '/sorteio/regras', en: '/en/giveaway/rules' },
    file: 'routes/giveaway.rules.tsx'
  },
  'feedback-new': {
    paths: { pt: '/feedback/novo', en: '/en/feedback/new' },
    file: 'routes/feedback.new.tsx'
  },
  supporters: {
    paths: { pt: '/apoiadores', en: '/en/supporters' },
    file: 'routes/supporters.tsx'
  },
  terms: {
    paths: { pt: '/termos', en: '/en/terms' },
    file: 'routes/terms.tsx'
  },
  privacy: {
    paths: { pt: '/privacidade', en: '/en/privacy' },
    file: 'routes/privacy.tsx'
  },
  guidelines: {
    paths: { pt: '/guidelines', en: '/en/guidelines' },
    file: 'routes/guidelines.tsx'
  },
  'guidelines-full': {
    paths: { pt: '/guidelines/completo', en: '/en/guidelines/full' },
    file: 'routes/guidelines.full.tsx'
  },
  points: {
    paths: { pt: '/pontos', en: '/en/points' },
    file: 'routes/points.tsx'
  },
  contact: {
    paths: { pt: '/contacto', en: '/en/contact' },
    file: 'routes/contact.tsx'
  },
  profile: {
    paths: { pt: '/perfil', en: '/en/profile' },
    file: 'routes/profile.tsx'
  },
  'feedback-edit': {
    paths: { pt: '/feedback/:id/editar', en: '/en/feedback/:id/edit' },
    file: 'routes/feedback.$id.edit.tsx'
  }
} satisfies Record<
  string,
  { paths: { pt: string; en: string }; file: string; index?: true }
>

export type RouteKey = keyof typeof routeMap
