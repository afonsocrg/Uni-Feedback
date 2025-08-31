import { type RouteConfig, index } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx')
  // route("/courses/:id", "routes/courses.$id.tsx"),
  // route("/terms", "routes/terms.tsx"),
  // route("/privacy", "routes/privacy.tsx"),
  // route("/:faculty", "routes/$faculty.tsx"),
  // route("/:faculty/:degree", "routes/$faculty.$degree.tsx"),
] satisfies RouteConfig
