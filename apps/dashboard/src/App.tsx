import { DashboardLayout, ProtectedRoute } from '@components'
import { HomePage, LoginPage, ForgotPasswordPage, ResetPasswordPage, CreateAccountPage } from '@pages'
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
              {/* <Route path="users" element={<UsersPage />} />
              <Route path="faculties" element={<FacultiesPage />} />
              <Route path="degrees" element={<DegreesPage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="profile" element={<ProfilePage />} /> */}
            </Route>
          </Routes>
        </div>
      </Router>
    </Providers>
  )
}

export default App
