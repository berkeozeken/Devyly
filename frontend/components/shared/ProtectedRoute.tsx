"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import api from "@/lib/api";
import { clearTokens, getAccessToken, getUser } from "@/lib/auth";
import type { UserRole } from "@/types";

interface Props {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const check = async () => {
      const token = getAccessToken();

      if (!token) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      try {
        await api.get("/auth/me/");

        if (allowedRoles) {
          const user = getUser();
          if (!user || !allowedRoles.includes(user.role)) {
            router.replace("/feed");
            return;
          }
        }

        setVerified(true);
      } catch {
        clearTokens();
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    };

    check();
  }, [router, pathname, allowedRoles]);

  if (!verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Yükleniyor...</p>
      </div>
    );
  }

  return <>{children}</>;
}
