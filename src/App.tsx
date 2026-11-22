
import { useState } from "react";
import { HashRouter, Routes, Route, Outlet } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "@/context/AuthContext";
import { AppDataProvider } from "@/context/AppDataContext";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/sidebar";
import HeaderRight from "@/components/layout/header-right";
import { ThemeConfigurator } from "@/components/theme-configurator";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import FullscreenPrompt from "@/components/FullscreenPrompt";

import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Tables from "@/pages/tables";
import Notifications from "@/pages/notifications";
import Members from "@/pages/members";
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
import Traffic from "@/pages/traffic";
import Orders from "@/pages/orders";
import Stats from "@/pages/stats";
import Overview from "@/pages/overview";
import AccountOpen from "@/pages/accountOpen";
import Messages from "@/pages/messages";
import TasksPage from "@/pages/tasks";

import ConfirmEmail from "./pages/auth/confirmation";
import PaymentSuccess from "./pages/payment/success";
import PaymentCancelled from "./pages/payment/cancelled";

// Dashboard layout
function Layout({
  children,
  showSidebar = true,
  showCard = true,
}: {
  children: React.ReactNode;
  showSidebar?: boolean;
  showCard?: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeConfigOpen, setThemeConfigOpen] = useState(false);

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
            className={`fixed bottom-0 left-0 top-16 z-40 transform ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } transition-transform lg:static lg:z-10 lg:translate-x-0`}
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        )}

        <main
          className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto ${
            showCard ? "p-3 lg:p-6" : "p-0"
          }`}
        >
          {showCard ? (
            <Card className="flex min-h-0 flex-1 flex-col border border-border bg-card text-card-foreground">
              {children}
            </Card>
          ) : (
            <div className="flex-1">{children}</div>
          )}

        </main>
      </div>

      <ThemeConfigurator
        isOpen={themeConfigOpen}
        onClose={() => setThemeConfigOpen(false)}
      />
    </div>
  );
}

// Persistent authenticated application container
function ProtectedApp() {
  return (
    <ProtectedRoute>
      <AppDataProvider>
        <Outlet />
      </AppDataProvider>
    </ProtectedRoute>
  );
}

// Application routes
function Router() {
  return (
    <Routes>
      {/* Authenticated application */}
      <Route path="/" element={<ProtectedApp />}>
        <Route path="onboarding" element={<Onboarding />} />

        <Route
          index
          element={
            <Layout showSidebar={false} showCard={false}>
              <Dashboard />
            </Layout>
          }
        />

        <Route
          path="profile"
          element={
            <Layout>
              <Profile />
            </Layout>
          }
        />

        <Route
          path="messages"
          element={
            <Layout>
              <Messages />
            </Layout>
          }
        />

        <Route
          path="tasks"
          element={
            <Layout>
              <TasksPage />
            </Layout>
          }
        />

        <Route
          path="tables"
          element={
            <Layout>
              <Tables />
            </Layout>
          }
        />

        <Route
          path="notifications"
          element={
            <Layout>
              <Notifications />
            </Layout>
          }
        />

        <Route
          path="members"
          element={
            <Layout>
              <Members />
            </Layout>
          }
        />

        <Route
          path="subscriptions"
          element={
            <Layout>
              <Subscriptions />
            </Layout>
          }
        />

        <Route
          path="overview"
          element={
            <Layout>
              <Overview />
            </Layout>
          }
        />

        <Route
          path="documentation"
          element={
            <Layout>
              <Documentation />
            </Layout>
          }
        />

        <Route
          path="marketplace"
          element={
            <Layout>
              <Marketplace />
            </Layout>
          }
        />

        <Route
          path="marketplace/:id"
          element={
            <Layout>
              <MarketplaceProduct />
            </Layout>
          }
        />

        <Route
          path="analytics"
          element={
            <Layout>
              <Analytics />
            </Layout>
          }
        />

        <Route
          path="traffic"
          element={
            <Layout>
              <Traffic />
            </Layout>
          }
        />

        <Route
          path="orders"
          element={
            <Layout>
              <Orders />
            </Layout>
          }
        />

        <Route
          path="stats/:id"
          element={
            <Layout>
              <Stats />
            </Layout>
          }
        />

        {/* Fullscreen application pages */}
        <Route path="create-site" element={<CreateSite />} />
        <Route path="template-picker" element={<TemplatePicker />} />
        <Route path="editor" element={<Editor />} />
        <Route path="blog" element={<Blog />} />

        <Route
          path="seo/:siteId"
          element={
            <Layout>
              <Seo />
            </Layout>
          }
        />

        <Route
          path="inventory/:siteId"
          element={
            <Layout>
              <Inventory />
            </Layout>
          }
        />

        <Route path="accountOpen" element={<AccountOpen />} />

        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Public routes */}
      <Route path="/auth/sign-in" element={<SignIn />} />
      <Route path="/auth/sign-up" element={<SignUp />} />
      <Route path="/auth/confirmation" element={<ConfirmEmail />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/cancelled" element={<PaymentCancelled />} />
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
            <FullscreenPrompt />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </HashRouter>
  );
}
