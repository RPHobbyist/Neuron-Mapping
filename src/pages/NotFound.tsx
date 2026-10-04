/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useDocumentSEO } from "@/hooks/useDocumentSEO";

const NotFound = () => {
  const location = useLocation();

  useDocumentSEO({
    title: "Page Not Found | Neuron Mapping",
    description: "The requested page was not found.",
    robots: "noindex, nofollow"
  });

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-2 text-2xl font-bold">There's no page here</h1>
        <p className="mb-4 text-muted-foreground">The link may be old, or the address mistyped.</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          Go to the home page
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
 