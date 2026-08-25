"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { StoreProvider, useStore } from "@/lib/store";
import { ThemeProvider } from "@/lib/theme";
import { canAccess } from "@/lib/nav";
import { AppShell } from "./AppShell";

function Gate({ children }: { children: React.ReactNode }) {
  const { currentUser, role, ready } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (!ready) return;
    if (!currentUser && !isLogin) router.replace("/login");
    else if (currentUser && role && !isLogin && !canAccess(role, pathname) && pathname !== "/403") {
      router.replace("/403");
    }
  }, [currentUser, isLogin, router, role, pathname, ready]);

  if (isLogin) return <>{children}</>;
  if (!ready || !currentUser || !role) return <div className="min-h-screen bg-bg" />;
  return <AppShell>{children}</AppShell>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <StoreProvider>
        <Gate>{children}</Gate>
      </StoreProvider>
    </ThemeProvider>
  );
}
