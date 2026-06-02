"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import DeveloperProfileForm from "@/components/profile/DeveloperProfileForm";
import RecruiterProfileForm from "@/components/profile/RecruiterProfileForm";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { setUser as storeUser } from "@/lib/auth";
import type { DeveloperProfile, RecruiterProfile, User } from "@/types";

function getAvatarColor(gender?: string | null) {
  const g = gender?.toUpperCase();
  if (g === "MALE") return "bg-blue-100 text-blue-700";
  if (g === "FEMALE") return "bg-pink-100 text-pink-700";
  return "bg-gray-200 text-gray-600";
}

const GENDER_OPTIONS = [
  { value: "MALE", label: "Erkek" },
  { value: "FEMALE", label: "Kadın" },
  { value: "OTHER", label: "Diğer" },
  { value: "PREFER_NOT_TO_SAY", label: "Belirtmek istemiyorum" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const MEDIA_BASE_URL = API_URL.replace(/\/api\/?$/, "");

function getPhotoUrl(photo: string | null | undefined): string | null {
  if (!photo) return null;
  if (photo.startsWith("http")) return photo;
  return `${MEDIA_BASE_URL}${photo}`;
}

function UserInfoSection({ user, onUpdated }: { user: User; onUpdated: (u: User) => void }) {
  const [gender, setGender] = useState(user.gender ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setGender(user.gender ?? "");
  }, [user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["jpg", "jpeg", "png"].includes(ext ?? "")) {
        toast.error("Sadece JPG ve PNG görseller yüklenebilir.");
        e.target.value = "";
        return;
      }
    }
    setPhotoFile(file);
    if (file) setRemovePhoto(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      if (photoFile) formData.append("profile_photo", photoFile);
      if (removePhoto) formData.append("remove_profile_photo", "true");
      formData.append("gender", gender);

      const res = await api.patch<User>("/auth/me/", formData);
      onUpdated(res.data);
      setPhotoFile(null);
      setRemovePhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      const rememberMe = typeof window !== "undefined" && !!localStorage.getItem("access_token");
      storeUser(res.data, rememberMe);
      toast.success("Profil bilgileri güncellendi.");
    } catch {
      toast.error("Güncelleme başarısız.");
    } finally {
      setSaving(false);
    }
  };

  const currentPhoto = getPhotoUrl(user.profile_photo);

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-white">
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Kullanıcı Bilgileri</h3>

      {/* Profile photo */}
      <div className="space-y-2">
        <Label className="text-sm">Profil Fotoğrafı</Label>
        <div className="flex items-center gap-4">
          {currentPhoto && !removePhoto ? (
            <img
              src={currentPhoto}
              alt="Profil"
              className="w-16 h-16 rounded-full object-cover border"
            />
          ) : (
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold ${getAvatarColor(gender)}`}>
              {user.first_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="space-y-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
              onChange={handlePhotoChange}
            />
            {currentPhoto && !removePhoto && (
              <button
                type="button"
                className="text-xs text-red-500 hover:text-red-700"
                onClick={() => {
                  setRemovePhoto(true);
                  setPhotoFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Fotoğrafı Kaldır
              </button>
            )}
            {removePhoto && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Fotoğraf kaldırılacak.</span>
                <button
                  type="button"
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                  onClick={() => setRemovePhoto(false)}
                >
                  Geri Al
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gender */}
      <div className="space-y-1">
        <Label className="text-sm">Cinsiyet (opsiyonel)</Label>
        <Select value={gender} onValueChange={(v) => setGender(v ?? "")}>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Seçiniz..." />
          </SelectTrigger>
          <SelectContent>
            {GENDER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {gender && (
          <button
            type="button"
            className="text-xs text-gray-400 hover:text-gray-600"
            onClick={() => setGender("")}
          >
            Seçimi Temizle
          </button>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving} size="sm">
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </div>
  );
}

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
        ) : user ? (
          <>
            <UserInfoSection user={user} onUpdated={setUser} />

            {user.role === "DEVELOPER" && developerProfile ? (
              <DeveloperProfileForm
                profile={developerProfile}
                onSaved={setDeveloperProfile}
              />
            ) : user.role === "RECRUITER" && recruiterProfile ? (
              <RecruiterProfileForm
                profile={recruiterProfile}
                onSaved={setRecruiterProfile}
              />
            ) : (
              <p className="text-sm text-red-400">Rol profili yüklenemedi.</p>
            )}
          </>
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
