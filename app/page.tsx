"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROLE_HOME } from "@/lib/nav";
import { useStore } from "@/lib/store";

export default function Home() {
  const { currentUser } = useStore();
  const router = useRouter();
  useEffect(() => {
    router.replace(currentUser ? ROLE_HOME[currentUser.role] : "/login");
  }, [currentUser, router]);
  return <div className="min-h-screen bg-bg" />;
}
