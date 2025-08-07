import { DashboardLayout, ProtectedRoute } from '@components'
import {
  HomePage,
  LoginPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  CreateAccountPage,
  NotFoundPage,
  UsersPage,
  FacultiesPage,
  FacultyDetailPage,
  DegreesPage,
  DegreeDetailPage,
  CoursesPage,
  CourseDetailPage,
  FeedbackPage,
  FeedbackDetailPage
} from '@pages'
import { TermsPage } from './pages/TermsPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { Providers } from '@providers'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'

function App() {
  return (
    <Providers>
      <Router future={{ v7_startTransition: true }}>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/create-account" element={<CreateAccountPage />} />

            {/* Public Routes */}
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* Protected Dashboard Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HomePage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="faculties" element={<FacultiesPage />} />
              <Route path="faculties/:id" element={<FacultyDetailPage />} />
              <Route path="degrees" element={<DegreesPage />} />
              <Route path="degrees/:id" element={<DegreeDetailPage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="courses/:id" element={<CourseDetailPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="feedback/:id" element={<FeedbackDetailPage />} />
              {/* <Route path="profile" element={<ProfilePage />} /> */}
            </Route>

            {/* 404 Not Found - Outside of DashboardLayout */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </Router>
    </Providers>
  )
}

export default App
