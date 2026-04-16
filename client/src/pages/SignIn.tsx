import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { useDocumentTitle } from '@/_core/hooks/useDocumentTitle';
import { SEO } from '@/components/SEO';
import { SignInPage } from '@/components/ui/sign-in-flow';

export default function SignIn() {
  useDocumentTitle('Sign In');
  const { isAuthenticated, loading } = useAuth();
  const [location, navigate] = useLocation();

  // Determine if this is a signup route
  const isSignup = location === '/signup' || location === '/sign-up' || location === '/register';

  // If already authenticated, check if onboarding is complete
  useEffect(() => {
    if (!loading && isAuthenticated) {
      const onboarded = localStorage.getItem('majorka_onboarded');
      if (onboarded) {
        navigate('/app');
      } else {
        navigate('/onboarding');
      }
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <>
      <SEO
        title="Login — Majorka AI Ecommerce OS"
        description="Sign in to your Majorka account. Access 50+ AI-powered ecommerce tools built for Australian dropshippers and online sellers."
        path="/login"
      />
      <SignInPage
        mode={isSignup ? 'signup' : 'signin'}
        onSuccess={() => {
          const onboarded = localStorage.getItem('majorka_onboarded');
          navigate(onboarded ? '/app' : '/onboarding');
        }}
      />
    </>
  );
}
