import { Providers } from '@components'
import {
  CourseDetail,
  DegreePage,
  FacultyPage,
  GiveReview,
  Home,
  NotFound,
  PrivacyPage,
  TermsPage
} from '@pages'
import { getReviewPath } from '@utils/routes'
import { Route, Routes } from 'react-router-dom'

function App() {
  return (
    <Providers>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path={getReviewPath()} element={<GiveReview />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

        {/* URL-driven university/degree routes */}
        <Route path="/:faculty" element={<FacultyPage />} />
        <Route path="/:faculty/:degree" element={<DegreePage />} />

        {/* Shortcut route for courses */}
        {/* <Route path="/c/:degree/:course" element={<ShortcutRedirect />} /> */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Providers>
  )
}

export default App
