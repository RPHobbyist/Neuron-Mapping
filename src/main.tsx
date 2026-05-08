import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Safer way to load fonts without inline event handlers
const fontLink = document.getElementById("google-fonts-link") as HTMLLinkElement | null;
if (fontLink) {
  fontLink.media = "all";
}

createRoot(document.getElementById("root")!).render(<App />);
