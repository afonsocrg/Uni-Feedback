import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Providers, ProtectedRoute, DashboardLayout } from '@components'
import {
  HomePage,
  UsersPage,
  FacultiesPage,
  DegreesPage,
  CoursesPage,
  FeedbackPage,
  ProfilePage,
  LoginPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  CreateAccountPage
} from '@pages'

function App() {
  return (
    <Providers>
      <Router future={{ v7_startTransition: true }}>
        <div className="min-h-screen bg-background">
          <Routes>
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
              <Route path="degrees" element={<DegreesPage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/create-account" element={<CreateAccountPage />} />
          </Routes>
        </div>
      </Router>
    </Providers>
  )
}

export default App
