import { useEffect } from "react";
import { useLocation } from "wouter";
import { SignInPage } from "@/components/ui/sign-in-flow";
import { useAuth } from "@/_core/hooks/useAuth";
import { useDocumentTitle } from "@/_core/hooks/useDocumentTitle";

export default function SignIn() {
  useDocumentTitle("Sign In");
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  // If already authenticated, redirect to app
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/app");
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <SignInPage
      onSuccess={() => navigate("/app")}
    />
  );
}
