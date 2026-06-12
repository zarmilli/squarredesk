import { Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/AuthContext"

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth()

  if (loading) return null
  if (!session) return <Navigate to="/login" replace />

  return children
}
