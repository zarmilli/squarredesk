import { HashRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import HeaderRight from "@/components/layout/header-right";
import { ThemeConfigurator } from "@/components/theme-configurator";
import { useState } from "react";
import FullscreenPrompt from "@/components/FullscreenPrompt";

import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Tables from "@/pages/tables";
import Notifications from "@/pages/notifications";
import Subscriptions from "@/pages/subscriptions";
import Documentation from "@/pages/documentation";
import CreateSite from "@/pages/create-site";
import TemplatePicker from "@/pages/template-picker";
import Editor from "@/pages/editor";
import Blog from "@/pages/blog";
import Seo from "@/pages/seo";
import Inventory from "@/pages/inventory";
import SignIn from "@/pages/auth/sign-in";
import SignUp from "@/pages/auth/sign-up";
import NotFound from "@/pages/not-found";
import Onboarding from "@/pages/onboarding";
import Marketplace from "@/pages/Marketplace";
import MarketplaceProduct from "@/pages/MarketplaceProduct";
import Analytics from "@/pages/analytics";
import Stats from "@/pages/stats";
import Overview from "@/pages/overview";
import AccountOpen from "@/pages/accountOpen";
import Messages from "@/pages/messages";
import TasksPage from "@/pages/tasks";

import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import ConfirmEmail from "./pages/auth/confirmation";
import PaymentSuccess from "./pages/payment/success";
import PaymentCancelled from "./pages/payment/cancelled";

function Layout({
  children,
  title,
  description,
  showSidebar = true,
  showCard = true,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showSidebar?: boolean;
  showCard?: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeConfigOpen, setThemeConfigOpen] = useState(false);

  const pageContent = (
    <>
      {title && (
        <div className="pt-6 px-6 pb-4">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          <div className="border-b border-border mt-4" />
        </div>
      )}
      {children}
    </>
  );

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <HeaderRight
        onOpenSettings={() => setThemeConfigOpen(true)}
        onOpenSidebar={showSidebar ? () => setSidebarOpen(true) : undefined}
      />

      {showSidebar && sidebarOpen && (
        <div
          className="fixed inset-x-0 bottom-0 top-16 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-0 flex-1">
        {showSidebar && (
          <div
            className={`fixed top-16 bottom-0 left-0 z-40 transform ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } transition-transform lg:static lg:z-10 lg:translate-x-0`}
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        )}

        <main
          className={`flex min-w-0 flex-1 flex-col overflow-y-auto ${
            showCard ? "p-3 lg:p-6" : "p-0"
          }`}
        >
          {showCard ? (
            <Card className="flex-1 border border-border bg-card text-card-foreground">
              {pageContent}
            </Card>
          ) : (
            <div className="flex-1">{pageContent}</div>
          )}

          <Footer />
        </main>
      </div>

      <ThemeConfigurator isOpen={themeConfigOpen} onClose={() => setThemeConfigOpen(false)} />
    </div>
  );
}

function Router() {
  return (
    <Routes>
      {/* Dashboard routes */}
      <Route path="/" element={<ProtectedRoute><Layout showSidebar={false} showCard={false}><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout title="Profile"><Profile /></Layout></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Layout title="Messages"><Messages /></Layout></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><Layout title="Tasks"><TasksPage /></Layout></ProtectedRoute>} />
      <Route path="/tables" element={<ProtectedRoute><Layout title="My Sites"><Tables /></Layout></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Layout title="Notifications"><Notifications /></Layout></ProtectedRoute>} />
      <Route path="/subscriptions" element={<ProtectedRoute><Layout title="Subscriptions"><Subscriptions /></Layout></ProtectedRoute>} />
      <Route path="/overview" element={<ProtectedRoute><Layout title="Overview"><Overview /></Layout></ProtectedRoute>} />
      <Route path="/documentation" element={<ProtectedRoute><Layout title="Documentation"><Documentation /></Layout></ProtectedRoute>} />
      <Route path="/marketplace" element={<ProtectedRoute><Layout title="Marketplace"><Marketplace /></Layout></ProtectedRoute>} />
      <Route path="/marketplace/:id" element={<ProtectedRoute><Layout title="Marketplace"><MarketplaceProduct /></Layout></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Layout title="Site Analytics"><Analytics /></Layout></ProtectedRoute>} />
      <Route path="/stats/:id" element={<ProtectedRoute><Layout title="Site Traffic"><Stats /></Layout></ProtectedRoute>} />

      {/* FULLSCREEN onboarding */}
      <Route path="/create-site" element={<ProtectedRoute><CreateSite /></ProtectedRoute>} />
      <Route path="/template-picker" element={<ProtectedRoute><TemplatePicker /></ProtectedRoute>} />
      <Route path="/editor" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
      <Route path="/blog" element={<ProtectedRoute><Blog /></ProtectedRoute>} />
      <Route path="/seo/:siteId" element={<ProtectedRoute><Layout title="SEO"><Seo /></Layout></ProtectedRoute>} />
      <Route path="/inventory/:siteId" element={<ProtectedRoute><Layout title="Inventory"><Inventory /></Layout></ProtectedRoute>} />
      <Route path="/accountOpen" element={<ProtectedRoute><AccountOpen /></ProtectedRoute>} />
      <Route path="/auth/sign-in" element={<SignIn />} />
      <Route path="/auth/sign-up" element={<SignUp />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/auth/confirmation" element={<ConfirmEmail />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/cancelled" element={<PaymentCancelled />} />

      <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <FullscreenPrompt />
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
