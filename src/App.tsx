import { lazy, Suspense } from "react";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";

import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { LicenseUpdateAnnouncement } from "@/components/feedback/LicenseUpdateAnnouncement";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import Landing from "./pages/Landing";

const Index = lazy(() => import("./pages/Index"));
const TemplatesIndex = lazy(() => import("./pages/TemplatesIndex"));
const TemplateDetail = lazy(() => import("./pages/TemplateDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

const isElectron = 
  typeof window !== "undefined" && 
  (window.navigator.userAgent.toLowerCase().includes("electron") || 
   window.location.protocol === "file:");

const RouterComponent = isElectron ? HashRouter : BrowserRouter;

const App = () => (
  <ErrorBoundary>
    <TooltipProvider>
      <Sonner />
      <LicenseUpdateAnnouncement />
      <RouterComponent>
        <Suspense fallback={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        }>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/templates" element={<TemplatesIndex />} />
            <Route path="/templates/:templateId" element={<TemplateDetail />} />
            <Route path="/workspace" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </RouterComponent>
    </TooltipProvider>
  </ErrorBoundary>
);

export default App;
 