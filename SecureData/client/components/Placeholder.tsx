import { useLocation } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";
import { UserLayout } from "./UserLayout";

export function PlaceholderPage() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const pathName = location.pathname.split("/").pop();
  const displayName = pathName?.replace(/-/g, " ").toUpperCase() || "Page";

  const Layout = isAdmin ? AdminLayout : UserLayout;

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{displayName}</h2>
          <p className="text-muted-foreground mb-6">This page is coming soon!</p>
          <p className="text-sm text-muted-foreground max-w-md">
            Continue with your requests to have this page built out with full functionality and features.
          </p>
        </div>
      </div>
    </Layout>
  );
}
