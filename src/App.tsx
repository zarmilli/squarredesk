import { HashRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import HeaderRight from "@/components/layout/header-right";
import { ThemeConfigurator } from "@/components/theme-configurator";
import { Menu } from "lucide-react";
import { useState } from "react";

import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Tables from "@/pages/tables";
import Notifications from "@/pages/notifications";
import Subscriptions from "@/pages/subscriptions";
import Documentation from "@/pages/documentation";
import CreateSite from "@/pages/create-site";
import TemplatePicker from "@/pages/template-picker";
import Editor from "@/pages/editor";
import SignIn from "@/pages/auth/sign-in";
import SignUp from "@/pages/auth/sign-up";
import NotFound from "@/pages/not-found";
import Onboarding from "@/pages/onboarding";

import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function Layout({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeConfigOpen, setThemeConfigOpen] = useState(false);

  return (
    <div className="flex h-screen bg-stone-50 grain-texture">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 lg:z-10 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto p-3 lg:p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="lg:hidden">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>

          <div className="ml-auto">
            <HeaderRight />
          </div>
        </div>

        <Card className="flex-1 border border-stone-200 bg-white">
          {title && (
            <div className="pt-6 px-6 pb-4">
              <h1 className="text-xl font-semibold">{title}</h1>
              {description && <p className="text-sm text-stone-600">{description}</p>}
              <div className="border-b mt-4" />
            </div>
          )}

          {children}
        </Card>

        <Footer />
      </main>

      <ThemeConfigurator isOpen={themeConfigOpen} onClose={() => setThemeConfigOpen(false)} />
    </div>
  );
}

function Router() {
  return (
    <Routes>
      {/* Dashboard routes */}
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout title="Profile"><Profile /></Layout></ProtectedRoute>} />
      <Route path="/tables" element={<ProtectedRoute><Layout title="Tables"><Tables /></Layout></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Layout title="Notifications"><Notifications /></Layout></ProtectedRoute>} />
      <Route path="/subscriptions" element={<ProtectedRoute><Layout title="Subscriptions"><Subscriptions /></Layout></ProtectedRoute>} />
      <Route path="/documentation" element={<ProtectedRoute><Layout title="Documentation"><Documentation /></Layout></ProtectedRoute>} />

      {/* FULLSCREEN onboarding */}
      <Route path="/create-site" element={<ProtectedRoute><CreateSite /></ProtectedRoute>} />
      <Route path="/template-picker" element={<ProtectedRoute><TemplatePicker /></ProtectedRoute>} />
      <Route path="/editor" element={<ProtectedRoute><Editor /></ProtectedRoute>} />

      <Route path="/auth/sign-in" element={<SignIn />} />
      <Route path="/auth/sign-up" element={<SignUp />} />
      <Route path="/onboarding" element={<Onboarding />} />

      <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </HashRouter>
  );
}
