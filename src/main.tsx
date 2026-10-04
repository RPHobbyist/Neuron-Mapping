/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import "@fontsource-variable/inter";
import "./index.css";

const container = document.getElementById("root")!;
const normalizePath = (p: string) => (p.endsWith("/") ? p : `${p}/`);
const prerenderedFor = container.dataset.prerendered;

if (prerenderedFor && normalizePath(prerenderedFor) === normalizePath(window.location.pathname)) {
  hydrateRoot(container, <App />);
} else {
  container.replaceChildren();
  createRoot(container).render(<App />);
}
 