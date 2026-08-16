/*
 * Neuron Mapping
 * Copyright (C) 2026 Rp Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useEffect } from "react";

interface TrustedTypePolicy {
  name: string;
  createScript: (input: string) => string;
}

interface TrustedTypes {
  createPolicy: (name: string, rules: { createScript?: (s: string) => string }) => TrustedTypePolicy;
  defaultPolicy?: TrustedTypePolicy;
  getPolicies?: () => TrustedTypePolicy[];
}

// Deliberately NOT `extends Window`: modern lib.dom.d.ts already types
// `Window.trustedTypes` as the full spec `TrustedTypePolicyFactory`, which
// this file's minimal, hand-rolled `TrustedTypes` shape doesn't satisfy —
// extending would fail to compile. This is only ever reached via
// `window as unknown as WindowWithTrustedTypes`, so no inheritance is needed.
interface WindowWithTrustedTypes {
  trustedTypes?: TrustedTypes;
}

interface SEOConfig {
  /** Page title - will be appended with " | Neuron Mapping" */
  title: string;
  /** Meta description for this page (optional, updates <meta name="description">) */
  description?: string;
  /** Canonical URL for this page (optional, updates <link rel="canonical">) */
  canonical?: string;
  /** Open Graph title (optional, defaults to title) */
  ogTitle?: string;
  /** Open Graph description (optional, defaults to description) */
  ogDescription?: string;
  /** Open Graph image URL (optional) */
  ogImage?: string;
  /** Robots directive (optional, e.g. "noindex, nofollow") */
  robots?: string;
  /** JSON-LD Structured Data objects (optional) */
  jsonLd?: object | object[];
}

const BRAND_SUFFIX = " | Neuron Mapping";
const BASE_URL = import.meta.env.VITE_BASE_URL || window.location.origin;

/**
 * Lightweight SEO hook that updates document.title, meta tags, and canonical links.
 * No external library needed.
 */
export function useDocumentSEO({ 
  title, 
  description, 
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  robots,
  jsonLd
}: SEOConfig) {
  useEffect(() => {
    // 1. Set page title
    const fullTitle = title.includes("Neuron Mapping")
      ? title
      : `${title}${BRAND_SUFFIX}`;
    document.title = fullTitle;

    // 2. Helper to get or create meta tags
    const updateMetaTag = (nameOrProperty: string, content: string, isProperty = false) => {
      const selector = isProperty 
        ? `meta[property="${nameOrProperty}"]` 
        : `meta[name="${nameOrProperty}"]`;
      
      let element = document.querySelector<HTMLMetaElement>(selector);
      if (element) {
        element.setAttribute("content", content);
      } else {
        element = document.createElement("meta");
        if (isProperty) {
          element.setAttribute("property", nameOrProperty);
        } else {
          element.name = nameOrProperty;
        }
        element.content = content;
        document.head.appendChild(element);
      }
    };

    // 3. Update standard meta tags
    if (description) updateMetaTag("description", description);
    if (robots) {
      updateMetaTag("robots", robots);
    } else {
      updateMetaTag("robots", "index, follow");
    }
    
    // 4. Update Canonical Link
    const fullCanonical = canonical 
      ? (canonical.startsWith("http") ? canonical : `${BASE_URL}${canonical}`)
      : window.location.origin + window.location.pathname;
    
    let linkCanonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (linkCanonical) {
      linkCanonical.setAttribute("href", fullCanonical);
    } else {
      linkCanonical = document.createElement("link");
      linkCanonical.rel = "canonical";
      linkCanonical.href = fullCanonical;
      document.head.appendChild(linkCanonical);
    }

    // 5. Update Open Graph Tags
    updateMetaTag("og:title", ogTitle || title, true);
    if (ogDescription || description) {
      updateMetaTag("og:description", ogDescription || description || "", true);
    }
    if (ogImage) {
      updateMetaTag("og:image", ogImage.startsWith("http") ? ogImage : `${BASE_URL}${ogImage}`, true);
    }
    updateMetaTag("og:url", fullCanonical, true);

    // 6. Update Twitter Tags
    updateMetaTag("twitter:title", ogTitle || title);
    if (ogDescription || description) {
      updateMetaTag("twitter:description", ogDescription || description || "");
    }
    if (ogImage) {
      updateMetaTag("twitter:image", ogImage.startsWith("http") ? ogImage : `${BASE_URL}${ogImage}`);
    }

    // 7. Inject JSON-LD Structured Data
    const scriptId = "structured-data-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (jsonLd) {
      const payload = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      const jsonString = JSON.stringify(payload);
      const win = window as unknown as WindowWithTrustedTypes;
      if (win.trustedTypes && win.trustedTypes.createPolicy) {
        try {
          let policy = win.trustedTypes.defaultPolicy;
          if (!policy) {
            try {
              policy = win.trustedTypes.createPolicy("seo-jsonld", {
                createScript: (s: string) => s
              });
            } catch (err) {
              if (win.trustedTypes.getPolicies) {
                policy = win.trustedTypes.getPolicies().find((p) => p.name === "seo-jsonld");
              }
            }
          }
          if (policy) {
            script.text = policy.createScript(jsonString);
          } else {
            script.text = jsonString;
          }
        } catch (e) {
          script.text = jsonString;
        }
      } else {
        script.text = jsonString;
      }
    } else if (script) {
      script.remove();
    }
  }, [title, description, canonical, ogTitle, ogDescription, ogImage, robots, jsonLd]);
}
