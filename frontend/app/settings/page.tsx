"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";

function SettingsContent() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const applyTheme = (t: "light" | "dark") => {
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    localStorage.setItem("theme", t);
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Ayarlar</h1>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Görünüm</h2>
            <p className="text-sm text-muted-foreground mt-1">Uygulama temasını buradan değiştirebilirsiniz.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => applyTheme("light")}
              className={[
                "flex-1 flex items-center justify-center gap-2.5 h-11 px-4 rounded-xl text-sm font-medium border transition-all duration-150",
                theme === "light"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-border-strong hover:text-foreground",
              ].join(" ")}
            >
              <Sun size={15} />
              Açık Tema
            </button>
            <button
              onClick={() => applyTheme("dark")}
              className={[
                "flex-1 flex items-center justify-center gap-2.5 h-11 px-4 rounded-xl text-sm font-medium border transition-all duration-150",
                theme === "dark"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-border-strong hover:text-foreground",
              ].join(" ")}
            >
              <Moon size={15} />
              Koyu Tema
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
