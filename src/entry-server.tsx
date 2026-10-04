/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { Suspense } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter, Routes, Route } from "react-router-dom";

import { AppFrame, RouteFallback } from "./AppFrame";
import Landing from "./pages/Landing";
import TemplatesIndex from "./pages/TemplatesIndex";
import TemplateDetail from "./pages/TemplateDetail";

export function render(url: string): string {
  return renderToString(
    <AppFrame>
      <StaticRouter location={url}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/templates" element={<TemplatesIndex />} />
            <Route path="/templates/:templateId" element={<TemplateDetail />} />
          </Routes>
        </Suspense>
      </StaticRouter>
    </AppFrame>
  );
}
