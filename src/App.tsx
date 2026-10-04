/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AppFrame, RouteFallback } from "./AppFrame";

import Landing from "./pages/Landing";

const Index = lazy(() => import("./pages/Index"));
const TemplatesIndex = lazy(() => import("./pages/TemplatesIndex"));
const TemplateDetail = lazy(() => import("./pages/TemplateDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <AppFrame>
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/templates" element={<TemplatesIndex />} />
          <Route path="/templates/:templateId" element={<TemplateDetail />} />
          <Route path="/workspace" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </AppFrame>
);

export default App;
