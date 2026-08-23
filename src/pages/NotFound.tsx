import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useDocumentSEO } from "@/hooks/useDocumentSEO";

const NotFound = () => {
  const location = useLocation();

  useDocumentSEO({
    title: "Page Not Found | Neuron Mapping",
    description: "The requested page was not found.",
    robots: "noindex, nofollow",
    canonical: "/404"
  });

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
 