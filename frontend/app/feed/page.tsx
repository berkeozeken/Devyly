"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Heart, MessageCircle, Repeat2, Send } from "lucide-react";

import Link from "next/link";

import AppLayout from "@/components/layout/AppLayout";
import PublicLayout from "@/components/layout/PublicLayout";
import SendPostModal from "@/components/feed/SendPostModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { getUser, isAuthenticated } from "@/lib/auth";
import type { FeedPost, PostComment, User } from "@/types";

function relativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Az önce";
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  return new Date(dateStr).toLocaleDateString("tr-TR");
}

function PostAvatar({
  name, photo, gender, size = "w-8 h-8",
}: {
  name: string; photo?: string | null; gender?: string | null; size?: string;
}) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={`${size} rounded-full object-cover shrink-0`}
      />
    );
  }
  const initial = name.charAt(0).toUpperCase() || "?";
  const normalizedGender = gender?.toUpperCase();
  const bgClass =
    normalizedGender === "MALE"
      ? "bg-blue-200 text-blue-800"
      : normalizedGender === "FEMALE"
      ? "bg-pink-200 text-pink-800"
      : "bg-gray-200 text-gray-600";
  return (
    <div className={`${size} rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${bgClass}`}>
      {initial}
    </div>
  );
}

const ROLE_BADGE: Record<string, string> = {
  DEVELOPER: "bg-blue-100 text-blue-600",
  RECRUITER: "bg-purple-100 text-purple-600",
};

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const MEDIA_BASE_URL = API_URL.replace(/\/api\/?$/, "");

function getImageUrl(image: string | null | undefined): string | null {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  return `${MEDIA_BASE_URL}${image}`;
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: Record<string, unknown> } })?.response?.data;
  if (!data) return fallback;
  return (
    (data.detail as string) ||
    (data.non_field_errors as string[])?.[0] ||
    (data.content as string[])?.[0] ||
    (data.image as string[])?.[0] ||
    fallback
  );
}

function validateImageFile(file: File | null, onError: (msg: string) => void): boolean {
  if (!file) return true;
  if (!ALLOWED_TYPES.includes(file.type)) {
    onError("Sadece JPG ve PNG görseller yüklenebilir.");
    return false;
  }
  return true;
}

export default function FeedPage() {
  const [auth, setAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Compose state
  const [newContent, setNewContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<FeedPost | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [undoPost, setUndoPost] = useState<FeedPost | null>(null);
  const [undoFading, setUndoFading] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Image preview state
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Interaction state
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [commentsMap, setCommentsMap] = useState<Record<number, PostComment[]>>({});
  const [commentsLoading, setCommentsLoading] = useState<Set<number>>(new Set());
  const [newCommentText, setNewCommentText] = useState<Record<number, string>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<Set<number>>(new Set());
  const [sendDmPostId, setSendDmPostId] = useState<number | null>(null);

  // Comment edit state
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [commentEditSubmitting, setCommentEditSubmitting] = useState(false);

  useEffect(() => {
    const user = isAuthenticated() ? getUser() : null;
    setCurrentUser(user);
    setAuth(!!user);
    setReady(true);

    api
      .get<FeedPost[]>("/feed-posts/")
      .then((res) => setPosts(res.data))
      .catch(() => toast.error("Gönderiler yüklenemedi."))
      .finally(() => setLoadingPosts(false));
  }, []);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      if (undoFadeTimerRef.current) clearTimeout(undoFadeTimerRef.current);
    };
  }, []);

  /* ---------- Compose ---------- */

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!validateImageFile(file, toast.error)) {
      e.target.value = "";
      return;
    }
    setImageFile(file);
  };

  const handlePost = async () => {
    if (!newContent.trim() && !imageFile) {
      toast.error("Gönderi içeriği veya görsel zorunludur.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (newContent.trim()) formData.append("content", newContent.trim());
      if (imageFile) formData.append("image", imageFile);

      const res = await api.post<FeedPost>("/feed-posts/", formData);
      setPosts((prev) => [res.data, ...prev]);
      setNewContent("");
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Gönderi paylaşıldı.");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Gönderi paylaşılamadı."));
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Delete ---------- */

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/feed-posts/${deleteTarget.id}/`);
      const removed = deleteTarget;
      setPosts((prev) => prev.filter((p) => p.id !== removed.id));
      setDeleteTarget(null);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      if (undoFadeTimerRef.current) clearTimeout(undoFadeTimerRef.current);
      setUndoPost(removed);
      setUndoFading(false);
      undoTimerRef.current = setTimeout(() => {
        setUndoFading(true);
        undoFadeTimerRef.current = setTimeout(() => {
          setUndoPost(null);
          setUndoFading(false);
          undoFadeTimerRef.current = null;
        }, 400);
        undoTimerRef.current = null;
      }, 5000);
    } catch {
      toast.error("Gönderi silinemedi.");
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async () => {
    if (!undoPost) return;
    if (undoTimerRef.current) { clearTimeout(undoTimerRef.current); undoTimerRef.current = null; }
    if (undoFadeTimerRef.current) { clearTimeout(undoFadeTimerRef.current); undoFadeTimerRef.current = null; }
    const toRestore = undoPost;
    setUndoPost(null);
    setUndoFading(false);
    try {
      const res = await api.post<FeedPost>(`/feed-posts/${toRestore.id}/restore/`);
      setPosts((prev) =>
        [...prev, res.data].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
      toast.success("Gönderi geri alındı.");
    } catch {
      toast.error("Gönderi geri alınamadı.");
    }
  };

  /* ---------- Edit ---------- */

  const startEdit = (post: FeedPost) => {
    setEditingId(post.id);
    setEditContent(post.content ?? "");
    setEditImageFile(null);
    setRemoveImage(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
    setEditImageFile(null);
    setRemoveImage(false);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!validateImageFile(file, toast.error)) {
      e.target.value = "";
      return;
    }
    setEditImageFile(file);
    if (file) setRemoveImage(false);
  };

  const handleEdit = async (post: FeedPost) => {
    const trimmedContent = editContent.trim();
    const hasExistingImage = Boolean(post.image) && !removeImage;
    const hasNewImage = Boolean(editImageFile);

    if (!trimmedContent && !hasExistingImage && !hasNewImage) {
      toast.error("Gönderi içeriği veya görsel zorunludur.");
      return;
    }

    const contentUnchanged = trimmedContent === (post.content ?? "").trim();
    if (contentUnchanged && !editImageFile && !removeImage) {
      cancelEdit();
      return;
    }

    try {
      const formData = new FormData();
      formData.append("content", trimmedContent);
      if (editImageFile) formData.append("image", editImageFile);
      if (removeImage) formData.append("remove_image", "true");

      const res = await api.patch<FeedPost>(`/feed-posts/${post.id}/`, formData);
      setPosts((prev) => prev.map((p) => (p.id === post.id ? res.data : p)));
      cancelEdit();
      toast.success("Gönderi güncellendi.");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Gönderi güncellenemedi."));
    }
  };

  /* ---------- Like ---------- */

  const handleLike = async (post: FeedPost) => {
    if (!auth) { toast.error("Beğenmek için giriş yapmalısınız."); return; }
    const wasLiked = post.is_liked_by_me;
    const prevCount = post.likes_count;
    // Optimistic update
    setPosts((prev) => prev.map((p) => p.id === post.id
      ? { ...p, is_liked_by_me: !wasLiked, likes_count: wasLiked ? prevCount - 1 : prevCount + 1 }
      : p));
    try {
      const res = await api.post<{ likes_count: number; is_liked_by_me: boolean }>(
        `/feed-posts/${post.id}/like/`
      );
      setPosts((prev) => prev.map((p) => p.id === post.id
        ? { ...p, likes_count: res.data.likes_count, is_liked_by_me: res.data.is_liked_by_me }
        : p));
    } catch {
      // Rollback
      setPosts((prev) => prev.map((p) => p.id === post.id
        ? { ...p, is_liked_by_me: wasLiked, likes_count: prevCount }
        : p));
      toast.error("Beğeni işlemi başarısız.");
    }
  };

  /* ---------- Repost ---------- */

  const handleRepost = async (post: FeedPost) => {
    if (!auth) { toast.error("Repost için giriş yapmalısınız."); return; }
    const wasReposted = post.is_reposted_by_me;
    const prevCount = post.reposts_count;
    // Optimistic update
    setPosts((prev) => prev.map((p) => p.id === post.id
      ? { ...p, is_reposted_by_me: !wasReposted, reposts_count: wasReposted ? prevCount - 1 : prevCount + 1 }
      : p));
    try {
      const res = await api.post<{ reposts_count: number; is_reposted_by_me: boolean }>(
        `/feed-posts/${post.id}/repost/`
      );
      setPosts((prev) => prev.map((p) => p.id === post.id
        ? { ...p, reposts_count: res.data.reposts_count, is_reposted_by_me: res.data.is_reposted_by_me }
        : p));
    } catch {
      // Rollback
      setPosts((prev) => prev.map((p) => p.id === post.id
        ? { ...p, is_reposted_by_me: wasReposted, reposts_count: prevCount }
        : p));
      toast.error("Repost işlemi başarısız.");
    }
  };

  /* ---------- Comments ---------- */

  const toggleComments = async (postId: number) => {
    const isExpanded = expandedComments.has(postId);
    if (isExpanded) {
      setExpandedComments((prev) => { const s = new Set(prev); s.delete(postId); return s; });
      return;
    }
    setExpandedComments((prev) => new Set(prev).add(postId));
    if (commentsMap[postId] !== undefined) return;
    setCommentsLoading((prev) => new Set(prev).add(postId));
    try {
      const res = await api.get<PostComment[]>(`/feed-posts/${postId}/comments/`);
      setCommentsMap((prev) => ({ ...prev, [postId]: res.data }));
    } catch {
      toast.error("Yorumlar yüklenemedi.");
    } finally {
      setCommentsLoading((prev) => { const s = new Set(prev); s.delete(postId); return s; });
    }
  };

  const handleAddComment = async (postId: number) => {
    if (!auth) { toast.error("Yorum yapmak için giriş yapmalısınız."); return; }
    const content = (newCommentText[postId] || "").trim();
    if (!content) return;
    setCommentSubmitting((prev) => new Set(prev).add(postId));
    try {
      const res = await api.post<PostComment>(`/feed-posts/${postId}/comments/`, { content });
      setCommentsMap((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), res.data] }));
      setNewCommentText((prev) => ({ ...prev, [postId]: "" }));
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
    } catch {
      toast.error("Yorum gönderilemedi.");
    } finally {
      setCommentSubmitting((prev) => { const s = new Set(prev); s.delete(postId); return s; });
    }
  };

  /* ---------- Delete Comment ---------- */

  const handleDeleteComment = async (postId: number, commentId: number) => {
    try {
      const res = await api.delete<{ deleted_comment_id: number; comments_count: number }>(
        `/feed-posts/${postId}/comments/${commentId}/`
      );
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c.id !== res.data.deleted_comment_id),
      }));
      setPosts((prev) => prev.map((p) =>
        p.id === postId ? { ...p, comments_count: res.data.comments_count } : p
      ));
    } catch {
      toast.error("Yorum silinemedi.");
    }
  };

  /* ---------- Edit Comment ---------- */

  const startEditComment = (comment: PostComment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.content);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentText("");
  };

  const handleUpdateComment = async (postId: number, commentId: number) => {
    const content = editCommentText.trim();
    if (!content) { toast.error("Yorum içeriği boş olamaz."); return; }
    setCommentEditSubmitting(true);
    try {
      const res = await api.patch<PostComment>(
        `/feed-posts/${postId}/comments/${commentId}/`,
        { content },
      );
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((c) => c.id === commentId ? res.data : c),
      }));
      cancelEditComment();
    } catch {
      toast.error("Yorum güncellenemedi.");
    } finally {
      setCommentEditSubmitting(false);
    }
  };

  /* ---------- Render ---------- */

  if (!ready) return null;

  const body = (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-5">

      {/* Compose — authenticated only */}
      {auth && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
          <Textarea
            rows={3}
            placeholder="Bir şeyler paylaşın..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <div className="flex items-center justify-between gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-muted file:text-muted-foreground hover:file:bg-muted/80 cursor-pointer"
              onChange={handleImageChange}
            />
            <Button
              onClick={handlePost}
              disabled={submitting || (!newContent.trim() && !imageFile)}
            >
              {submitting ? "Paylaşılıyor..." : "Paylaş"}
            </Button>
          </div>
        </div>
      )}

      {/* Post list */}
      {loadingPosts ? (
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz gönderi yok.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isOwner = currentUser?.id === post.author;
            const isEditing = editingId === post.id;
            const badgeClass = ROLE_BADGE[post.author_role] ?? "bg-gray-100 text-gray-500";
            const commentsOpen = expandedComments.has(post.id);

            return (
              <div key={post.id} className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(15,23,42,0.07)]">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Link href={`/users/${post.author}`} className="shrink-0">
                      <PostAvatar
                        name={post.author_name}
                        photo={post.author_profile_photo}
                        gender={post.author_gender}
                      />
                    </Link>
                    <Link
                      href={`/users/${post.author}`}
                      className="text-sm font-medium text-foreground truncate hover:text-blue-500 hover:underline"
                    >
                      {post.author_name}
                    </Link>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${badgeClass}`}>
                      {post.author_role}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(post.created_at).toLocaleString("tr-TR")}
                  </span>
                </div>

                {/* Content / Edit mode */}
                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      rows={3}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />

                    {post.image && !removeImage && (
                      <div className="space-y-1">
                        <img
                          src={getImageUrl(post.image) ?? ""}
                          alt="Mevcut görsel"
                          className="rounded-md border w-full object-cover max-h-48"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => setRemoveImage(true)}
                        >
                          Görseli Kaldır
                        </Button>
                      </div>
                    )}
                    {post.image && removeImage && (
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-400">Mevcut görsel kaldırılacak.</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-6 px-2"
                          onClick={() => setRemoveImage(false)}
                        >
                          Geri Al
                        </Button>
                      </div>
                    )}

                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      className="text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-muted file:text-muted-foreground hover:file:bg-muted/80 cursor-pointer"
                      onChange={handleEditImageChange}
                    />

                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleEdit(post)}>Kaydet</Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>İptal</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {post.content && (
                      <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>
                    )}
                    {post.image && (
                      <img
                        src={getImageUrl(post.image) ?? ""}
                        alt="Gönderi görseli"
                        className="rounded-md border w-full object-cover max-h-96 cursor-pointer"
                        onClick={() => setPreviewImageUrl(getImageUrl(post.image))}
                      />
                    )}
                  </>
                )}

                {/* Action bar */}
                {!isEditing && (
                  <div className="flex items-center gap-0 pt-1 border-t border-border">
                    {/* Like */}
                    <button
                      onClick={() => handleLike(post)}
                      className={[
                        "flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-colors",
                        post.is_liked_by_me
                          ? "text-red-500 hover:text-red-600"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      ].join(" ")}
                    >
                      <Heart
                        size={13}
                        className={post.is_liked_by_me ? "fill-red-500" : ""}
                      />
                      <span>{post.likes_count}</span>
                    </button>

                    {/* Comment */}
                    <button
                      onClick={() => toggleComments(post.id)}
                      className={[
                        "flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-colors",
                        commentsOpen
                          ? "text-brand"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      ].join(" ")}
                    >
                      <MessageCircle size={13} />
                      <span>{post.comments_count}</span>
                    </button>

                    {/* Repost */}
                    <button
                      onClick={() => handleRepost(post)}
                      className={[
                        "flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-colors",
                        post.is_reposted_by_me
                          ? "text-green-500 hover:text-green-600"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      ].join(" ")}
                    >
                      <Repeat2 size={13} />
                      <span>{post.reposts_count}</span>
                    </button>

                    {/* Send via DM — only for authenticated users */}
                    {auth && (
                      <button
                        onClick={() => setSendDmPostId(post.id)}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        title="DM ile gönder"
                      >
                        <Send size={13} />
                      </button>
                    )}

                    {/* Owner actions pushed to right */}
                    {isOwner && (
                      <div className="flex gap-1.5 ml-auto">
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => startEdit(post)}>
                          Düzenle
                        </Button>
                        <Button size="sm" variant="destructive" className="h-7 px-2.5 text-xs" onClick={() => setDeleteTarget(post)}>
                          Sil
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Comments section */}
                {!isEditing && commentsOpen && (
                  <div className="border-t border-border pt-3 space-y-3">
                    {commentsLoading.has(post.id) ? (
                      <p className="text-xs text-muted-foreground">Yorumlar yükleniyor...</p>
                    ) : (commentsMap[post.id] || []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">Henüz yorum yok.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {(commentsMap[post.id] || []).map((comment) => {
                          const canDelete = currentUser?.id === comment.user || currentUser?.id === post.author;
                          const canEdit = currentUser?.id === comment.user;
                          const isEditingThis = editingCommentId === comment.id;
                          return (
                          <div key={comment.id} className="flex gap-2">
                            <PostAvatar
                              name={comment.user_name}
                              photo={comment.user_profile_photo}
                              gender={comment.user_gender}
                              size="w-6 h-6"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-semibold text-foreground">{comment.user_name}</span>
                                <span className="text-xs text-muted-foreground">{relativeTime(comment.created_at)}</span>
                                {(canEdit || canDelete) && !isEditingThis && (
                                  <div className="flex items-center gap-0.5 ml-auto">
                                    {canEdit && (
                                      <button
                                        onClick={() => startEditComment(comment)}
                                        className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded transition-colors"
                                      >
                                        Düzenle
                                      </button>
                                    )}
                                    {canDelete && (
                                      <button
                                        onClick={() => handleDeleteComment(post.id, comment.id)}
                                        className="text-[10px] text-muted-foreground hover:text-red-500 px-1.5 py-0.5 rounded transition-colors"
                                      >
                                        Sil
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                              {isEditingThis ? (
                                <div className="flex gap-1.5 mt-1.5">
                                  <input
                                    type="text"
                                    value={editCommentText}
                                    onChange={(e) => setEditCommentText(e.target.value)}
                                    className="flex-1 h-7 px-2.5 rounded-xl border border-input bg-muted/40 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") { e.preventDefault(); handleUpdateComment(post.id, comment.id); }
                                      if (e.key === "Escape") cancelEditComment();
                                    }}
                                  />
                                  <button
                                    onClick={() => handleUpdateComment(post.id, comment.id)}
                                    disabled={commentEditSubmitting || !editCommentText.trim()}
                                    className="h-7 px-2.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-medium disabled:opacity-50 transition-all"
                                  >
                                    {commentEditSubmitting ? "..." : "Kaydet"}
                                  </button>
                                  <button
                                    onClick={cancelEditComment}
                                    className="h-7 px-2.5 rounded-xl border border-border text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    İptal
                                  </button>
                                </div>
                              ) : (
                                <p className="text-xs text-foreground mt-0.5 leading-relaxed">{comment.content}</p>
                              )}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}

                    {auth && (
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={newCommentText[post.id] || ""}
                          onChange={(e) =>
                            setNewCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment(post.id);
                            }
                          }}
                          placeholder="Yorum yaz..."
                          className="flex-1 h-8 px-3 rounded-xl border border-input bg-muted/40 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          disabled={
                            commentSubmitting.has(post.id) ||
                            !(newCommentText[post.id] || "").trim()
                          }
                          className="h-8 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50 transition-all"
                        >
                          {commentSubmitting.has(post.id) ? "..." : "Gönder"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <>
      {auth ? <AppLayout>{body}</AppLayout> : <PublicLayout>{body}</PublicLayout>}

      {/* Undo bar */}
      {undoPost && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm whitespace-nowrap transition-all duration-500 ease-out ${undoFading ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"}`}>
          <span>Bu gönderiyi sildiniz.</span>
          <button
            onClick={handleRestore}
            className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2"
          >
            Geri Al
          </button>
        </div>
      )}

      {/* Delete confirm dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Gönderi silinsin mi?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Siliniyor..." : "Evet, Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image preview dialog */}
      <Dialog open={Boolean(previewImageUrl)} onOpenChange={(open) => !open && setPreviewImageUrl(null)}>
        <DialogContent className="sm:max-w-[90vw] max-w-[95vw] w-auto p-2 bg-gray-900 ring-0 shadow-2xl">
          <DialogTitle className="sr-only">Gönderi Görseli</DialogTitle>
          {previewImageUrl && (
            <img
              src={previewImageUrl}
              alt="Gönderi görseli"
              className="max-h-[90vh] max-w-full object-contain rounded block mx-auto"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Send DM modal */}
      {sendDmPostId !== null && (
        <SendPostModal
          postId={sendDmPostId}
          onClose={() => setSendDmPostId(null)}
        />
      )}
    </>
  );
}
