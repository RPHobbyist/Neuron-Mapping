import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// The CSP sends `require-trusted-types-for 'script'`, which blocks any raw
// string assignment to `.innerHTML`/`.text`/script `src` unless a Trusted
// Types policy vouches for it. React itself relies on raw innerHTML writes to
// set the text content of `<style>` elements (e.g. Radix UI's ScrollArea
// injects one for scrollbar CSS), so without a registered policy those
// writes throw and take down the whole tree via the ErrorBoundary.
// Registering the special 'default' policy makes the browser route every
// unpoliced write through it — this doesn't reopen the XSS vector Trusted
// Types guards against, since script-src is still locked to 'self' plus a
// fixed hash, so no injected string here can execute as script regardless of
// this policy. All three sinks are covered (not just createHTML) because
// `window.trustedTypes.defaultPolicy` becomes non-null the moment any one of
// them is registered, and useDocumentSEO.ts (src/hooks/useDocumentSEO.ts)
// already assumes that non-null defaultPolicy exposes createScript — leaving
// it out here would make that assumption throw instead.
type TrustedTypesLike = {
  createPolicy: (
    name: string,
    rules: {
      createHTML?: (s: string) => string;
      createScript?: (s: string) => string;
      createScriptURL?: (s: string) => string;
    }
  ) => unknown;
};
const win = window as unknown as { trustedTypes?: TrustedTypesLike };
if (win.trustedTypes && win.trustedTypes.createPolicy) {
  try {
    win.trustedTypes.createPolicy("default", {
      createHTML: (s: string) => s,
      createScript: (s: string) => s,
      createScriptURL: (s: string) => s,
    });
  } catch {
    // Another script already registered the 'default' policy — nothing to do.
  }
}

// Safer way to load fonts without inline event handlers
const fontLink = document.getElementById("google-fonts-link") as HTMLLinkElement | null;
if (fontLink) {
  fontLink.media = "all";
}

createRoot(document.getElementById("root")!).render(<App />);
