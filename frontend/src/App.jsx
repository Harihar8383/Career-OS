import React from 'react'; 
import { Routes, Route, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, ClerkLoading } from '@clerk/clerk-react';
import LandingPage from './pages/LandingPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
// import ProfileReviewPage from './pages/ProfileReviewPage'; // <-- No longer needed
import ProfileCompletePage from './pages/ProfileCompletePage';

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <ClerkLoading />
            <SignedIn>
              <RedirectToDashboard />
            </SignedIn>
            <SignedOut>
              <LandingPage />
            </SignedOut>
          </>
        }
      />

      {/* Sign-in and Sign-up routes */}
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />

      <Route
        path="/onboarding/complete"
        element={
          <>
            <ClerkLoading />
            <SignedIn>
              <ProfileCompletePage />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      />

      {/* Protected Dashboard route now catches all sub-paths */}
      <Route
        path="/dashboard/*" 
        element={
          <>
            <ClerkLoading />
            <SignedIn>
              <DashboardPage />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      />
    </Routes>
  );
}

// A helper component to redirect logged-out users
function RedirectToSignIn() {
  const navigate = useNavigate();
  React.useEffect(() => {
    navigate('/sign-in');
  }, [navigate]);
  return null;
}

// A new helper component to redirect logged-in users
function RedirectToDashboard() {
  const navigate = useNavigate();
  React.useEffect(() => {
    navigate('/dashboard');
  }, [navigate]);
  return null;
}

export default App;