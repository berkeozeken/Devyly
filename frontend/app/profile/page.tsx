"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import DeveloperProfileForm from "@/components/profile/DeveloperProfileForm";
import RecruiterProfileForm from "@/components/profile/RecruiterProfileForm";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import api from "@/lib/api";
import type { DeveloperProfile, RecruiterProfile, User } from "@/types";

function ProfileContent() {
  const [user, setUser] = useState<User | null>(null);
  const [developerProfile, setDeveloperProfile] = useState<DeveloperProfile | null>(null);
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await api.get<User>("/auth/me/");
        const currentUser = userRes.data;
        setUser(currentUser);

        if (currentUser.role === "DEVELOPER") {
          const profileRes = await api.get<DeveloperProfile>("/developer-profile/me/");
          setDeveloperProfile(profileRes.data);
        } else {
          const profileRes = await api.get<RecruiterProfile>("/recruiter-profile/me/");
          setRecruiterProfile(profileRes.data);
        }
      } catch {
        toast.error("Profil yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-700">Profile</h2>
          {user && (
            <p className="text-sm text-gray-400 mt-1">
              {user.first_name} {user.last_name} ·{" "}
              <span className="font-medium text-gray-500">{user.role}</span>
            </p>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Yükleniyor...</p>
        ) : user?.role === "DEVELOPER" && developerProfile ? (
          <DeveloperProfileForm
            profile={developerProfile}
            onSaved={setDeveloperProfile}
          />
        ) : user?.role === "RECRUITER" && recruiterProfile ? (
          <RecruiterProfileForm
            profile={recruiterProfile}
            onSaved={setRecruiterProfile}
          />
        ) : (
          <p className="text-sm text-red-400">Profil yüklenemedi.</p>
        )}
      </div>
    </AppLayout>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
