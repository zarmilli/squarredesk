import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (!session) return <Navigate to="/auth/sign-in" replace />;

  return children;
}
