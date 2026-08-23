import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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
  }
}

const fontLink = document.getElementById("google-fonts-link") as HTMLLinkElement | null;
if (fontLink) {
  fontLink.media = "all";
}

createRoot(document.getElementById("root")!).render(<App />);
 