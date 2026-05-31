"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import api from "@/lib/api";
import { clearTokens, getAccessToken } from "@/lib/auth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const check = async () => {
      const token = getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        await api.get("/auth/me/");
        setVerified(true);
      } catch {
        clearTokens();
        router.replace("/login");
      }
    };

    check();
  }, [router]);

  if (!verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Yükleniyor...</p>
      </div>
    );
  }

  return <>{children}</>;
}
