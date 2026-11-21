"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeStoryText } from "@/lib/story-text";
import {
  Shield,
  Upload,
  Sparkles,
  RefreshCw,
  Layers,
  Gift,
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  FileText,
  Eye,
  CheckCircle,
  ArrowLeft,
  Calendar,
} from "lucide-react";

interface CardInfo {
  id: string;
  title: string;
  imageUrl: string;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC" | "SECRET";
  description: string;
  album: string;
}

interface StoryInfo {
  _id: string;
  title: string;
  author: string;
  description: string;
  coverImage: string;
  category: string;
  status: "ONGOING" | "COMPLETED";
  views: number;
  totalChapters: number;
  updatedAt: string;
}

interface ChapterInfo {
  _id: string;
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  createdAt: string;
}

const compressImage = (file: File, maxWidth = 800, quality = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas toBlob returned null"));
          },
          "image/webp",
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Top level admin tabs
  const [adminTab, setAdminTab] = useState<"stories" | "cards" | "redemptions">("stories");

  // ================= STORIES & CHAPTERS STATE =================
  const [stories, setStories] = useState<StoryInfo[]>([]);
  const [selectedStory, setSelectedStory] = useState<StoryInfo | null>(null);
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);

  // Story Form
  const [storyTitle, setStoryTitle] = useState("");
  const [storyAuthor, setStoryAuthor] = useState("");
  const [storyCategory, setStoryCategory] = useState("Huyền Huyễn");
  const [storyStatus, setStoryStatus] = useState<"ONGOING" | "COMPLETED">("ONGOING");
  const [storyCoverImage, setStoryCoverImage] = useState("");
  const [storyDescription, setStoryDescription] = useState("");
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [storySubmitting, setStorySubmitting] = useState(false);

  // Chapter Form
  const [chapterNumber, setChapterNumber] = useState<number | string>(1);
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterContent, setChapterContent] = useState("");
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterSubmitting, setChapterSubmitting] = useState(false);
  const [previewChapter, setPreviewChapter] = useState(false);

  // General messages
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // ================= CARDS STATE =================
  const [cards, setCards] = useState<CardInfo[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState("");
  const [newAlbumName, setNewAlbumName] = useState("");
  const [isNewAlbum, setIsNewAlbum] = useState(false);
  const [rarity, setRarity] = useState<CardInfo["rarity"]>("COMMON");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingCard, setSubmittingCard] = useState(false);

  // Album renaming
  const [renamingAlbum, setRenamingAlbum] = useState<string | null>(null);
  const [newAlbumValue, setNewAlbumValue] = useState("");
  const [albumMessage, setAlbumMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Redemptions
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [redemptionMessage, setRedemptionMessage] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    checkAdminAndFetchData();
  }, []);

  useEffect(() => {
    if (loading || !isAdmin) return;
    const section = window.location.hash.slice(1);
    if (section === "story-editor" || section === "chapter-editor") {
      document.getElementById(section)?.scrollIntoView();
    }
  }, [loading, isAdmin]);

  const checkAdminAndFetchData = async () => {
    try {
      const meRes = await fetch(`/api/auth/me?t=${Date.now()}`);
      const meData = await meRes.json();

      if (meData.success && meData.user.role === "ADMIN") {
        setIsAdmin(true);

        const query = new URLSearchParams(window.location.search);
        const storyId = query.get("story");
        const chapterId = query.get("chapter");
        const story = (await fetchStoriesList()).find((entry) => entry._id === storyId);
        if (story && query.get("action") === "edit") {
          handleEditStory(story, false);
        } else if (story) {
          setSelectedStory(story);
          const storyChapters = await fetchChaptersForStory(story._id);
          if (chapterId) {
            const chapter = storyChapters.find((entry) => entry._id === chapterId);
            if (chapter) handleEditChapter(chapter, false);
            else setMessage({ text: "Không tìm thấy chương cần sửa.", type: "error" });
          }
        } else if (storyId) {
          setMessage({ text: "Không tìm thấy truyện cần quản trị.", type: "error" });
        }

        // Fetch Cards
        const cardsRes = await fetch(`/api/cards?t=${Date.now()}`);
        const cardsData = await cardsRes.json();
        if (cardsData.success) {
          setCards(cardsData.cards);
        }

        // Fetch Redemptions
        const redRes = await fetch(`/api/redeem?admin=true&t=${Date.now()}`);
        const redData = await redRes.json();
        if (redData.success) {
          setRedemptions(redData.redemptions);
        }
      } else {
        router.push("/");
      }
    } catch {
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchStoriesList = async (): Promise<StoryInfo[]> => {
    try {
      const res = await fetch(`/api/stories?t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setStories(data.stories);
        return data.stories;
      }
    } catch (err) {
      console.error(err);
    }
    return [];
  };

  const fetchChaptersForStory = async (storyId: string): Promise<ChapterInfo[]> => {
    setLoadingChapters(true);
    try {
      const res = await fetch(`/api/stories/${storyId}/chapters?t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setChapters(data.chapters || []);
        // Suggest next chapter number
        if (data.chapters && data.chapters.length > 0) {
          const maxNum = Math.max(...data.chapters.map((c: any) => c.chapterNumber || 0));
          setChapterNumber(maxNum + 1);
        } else {
          setChapterNumber(1);
        }
        return data.chapters || [];
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChapters(false);
    }
    return [];
  };

  // ================= STORY FORM HANDLERS =================
  const handleStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyTitle.trim()) {
      setMessage({ text: "Vui lòng nhập tên truyện", type: "error" });
      return;
    }

    setStorySubmitting(true);
    setMessage(null);

    try {
      const isEdit = editingStoryId !== null;
      const url = isEdit ? "/api/stories" : "/api/stories";
      const method = isEdit ? "PUT" : "POST";
      const payload: any = {
        title: storyTitle.trim(),
        author: storyAuthor.trim(),
        category: storyCategory,
        status: storyStatus,
        coverImage: storyCoverImage.trim(),
        description: storyDescription.trim(),
      };
      if (isEdit) payload.id = editingStoryId;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ text: data.message || "Lưu truyện thành công", type: "success" });
        resetStoryForm();
        await fetchStoriesList();
      } else {
        setMessage({ text: data.error || "Lỗi lưu truyện", type: "error" });
      }
    } catch {
      setMessage({ text: "Lỗi kết nối máy chủ", type: "error" });
    } finally {
      setStorySubmitting(false);
    }
  };

  const handleEditStory = (story: StoryInfo, scroll = true) => {
    setEditingStoryId(story._id);
    setStoryTitle(story.title);
    setStoryAuthor(story.author);
    setStoryCategory(story.category);
    setStoryStatus(story.status);
    setStoryCoverImage(story.coverImage || "");
    setStoryDescription(story.description || "");
    if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tác phẩm này và TOÀN BỘ các chương bên trong?")) {
      return;
    }

    try {
      const res = await fetch(`/api/stories?id=${storyId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: data.message, type: "success" });
        if (selectedStory?._id === storyId) {
          setSelectedStory(null);
          setChapters([]);
        }
        await fetchStoriesList();
      } else {
        setMessage({ text: data.error || "Xóa thất bại", type: "error" });
      }
    } catch {
      setMessage({ text: "Lỗi kết nối", type: "error" });
    }
  };

  const resetStoryForm = () => {
    setEditingStoryId(null);
    setStoryTitle("");
    setStoryAuthor("");
    setStoryCategory("Huyền Huyễn");
    setStoryStatus("ONGOING");
    setStoryCoverImage("");
    setStoryDescription("");
  };

  const handleStoryCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBlob = await compressImage(file, 800, 0.8);
      const reader = new FileReader();
      reader.readAsDataURL(compressedBlob);
      reader.onloadend = () => {
        setStoryCoverImage(reader.result as string);
      };
    } catch {
      setMessage({ text: "Lỗi nén ảnh bìa", type: "error" });
    }
  };

  // ================= CHAPTER FORM HANDLERS =================
  const handleSelectStoryForChapters = (story: StoryInfo) => {
    setSelectedStory(story);
    resetChapterForm();
    fetchChaptersForStory(story._id);
  };

  const handleChapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStory) return;

    if (!chapterTitle.trim() || !chapterContent.trim()) {
      setMessage({ text: "Vui lòng nhập đầy đủ tiêu đề và nội dung chương", type: "error" });
      return;
    }

    setChapterSubmitting(true);
    setMessage(null);

    try {
      const isEdit = editingChapterId !== null;
      const url = isEdit
        ? `/api/stories/${selectedStory._id}/chapters/${editingChapterId}`
        : `/api/stories/${selectedStory._id}/chapters`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterNumber: Number(chapterNumber),
          title: chapterTitle.trim(),
          content: chapterContent.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ text: data.message || "Lưu chương thành công", type: "success" });
        resetChapterForm();
        await fetchChaptersForStory(selectedStory._id);
        await fetchStoriesList();
      } else {
        setMessage({ text: data.error || "Lỗi lưu chương", type: "error" });
      }
    } catch {
      setMessage({ text: "Lỗi kết nối", type: "error" });
    } finally {
      setChapterSubmitting(false);
    }
  };

  const handleEditChapter = (ch: ChapterInfo, scroll = true) => {
    setEditingChapterId(ch._id);
    setChapterNumber(ch.chapterNumber);
    setChapterTitle(ch.title);
    setChapterContent(ch.content);
    setPreviewChapter(false);
    if (scroll) window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const handleDeleteChapter = async (chId: string) => {
    if (!selectedStory) return;
    if (!confirm("Bạn có chắc chắn muốn xóa chương này?")) return;

    try {
      const res = await fetch(`/api/stories/${selectedStory._id}/chapters/${chId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: data.message, type: "success" });
        await fetchChaptersForStory(selectedStory._id);
        await fetchStoriesList();
      } else {
        setMessage({ text: data.error || "Xóa chương thất bại", type: "error" });
      }
    } catch {
      setMessage({ text: "Lỗi kết nối", type: "error" });
    }
  };

  const resetChapterForm = () => {
    setEditingChapterId(null);
    setChapterTitle("");
    setChapterContent("");
    setPreviewChapter(false);
    if (chapters.length > 0) {
      const maxNum = Math.max(...chapters.map((c) => c.chapterNumber || 0));
      setChapterNumber(maxNum + 1);
    } else {
      setChapterNumber(1);
    }
  };

  // ================= CARDS HANDLERS =================
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setMessage(null);

    try {
      const compressedBlob = await compressImage(file, 800, 0.75);
      const reader = new FileReader();
      reader.readAsDataURL(compressedBlob);
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        setImageFile(null);
        setUploadingImage(false);
      };
    } catch {
      setMessage({ text: "Lỗi xử lý nén ảnh cục bộ", type: "error" });
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAlbum = isNewAlbum ? newAlbumName.trim() : selectedAlbum;

    if (!title || !imageUrl || !finalAlbum || finalAlbum === "select") {
      setMessage({ text: "Vui lòng nhập đầy đủ thông tin bắt buộc, chọn album và tải ảnh lên", type: "error" });
      return;
    }

    setSubmittingCard(true);
    setMessage(null);

    try {
      const isEditing = editingCardId !== null;
      const endpoint = isEditing ? `/api/cards` : `/api/cards`;
      const method = isEditing ? "PUT" : "POST";
      const payload: any = {
        title,
        description,
        album: finalAlbum,
        rarity,
        imageUrl,
      };
      if (isEditing) payload.id = editingCardId;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({
          text: isEditing ? "Cập nhật thẻ bài thành công!" : "Đăng tải thẻ bài mới thành công!",
          type: "success",
        });
        resetForm();
        const cardsRes = await fetch(`/api/cards?t=${Date.now()}`);
        const cardsData = await cardsRes.json();
        if (cardsData.success) setCards(cardsData.cards);
      } else {
        setMessage({ text: data.error || "Lỗi lưu thẻ bài", type: "error" });
      }
    } catch {
      setMessage({ text: "Đã xảy ra lỗi kết nối", type: "error" });
    } finally {
      setSubmittingCard(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedAlbum("");
    setNewAlbumName("");
    setIsNewAlbum(false);
    setRarity("COMMON");
    setImageUrl("");
    setImageFile(null);
    setEditingCardId(null);
  };

  const handleEditClick = (card: CardInfo) => {
    setEditingCardId(card.id);
    setTitle(card.title);
    setDescription(card.description);
    setSelectedAlbum(card.album);
    setIsNewAlbum(false);
    setRarity(card.rarity);
    setImageUrl(card.imageUrl);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = async (cardId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thẻ bài này khỏi hệ thống?")) return;
    try {
      const res = await fetch(`/api/cards?id=${cardId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: "Đã xóa thẻ bài thành công", type: "success" });
        setCards((prev) => prev.filter((c) => c.id !== cardId));
        if (editingCardId === cardId) resetForm();
      } else {
        setMessage({ text: data.error || "Lỗi xóa thẻ bài", type: "error" });
      }
    } catch {
      setMessage({ text: "Lỗi kết nối máy chủ", type: "error" });
    }
  };

  const handleRenameAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingAlbum || !newAlbumValue.trim()) return;
    setAlbumMessage(null);
    try {
      const res = await fetch("/api/albums/rename", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldAlbum: renamingAlbum, newAlbum: newAlbumValue.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setAlbumMessage({ text: data.message, type: "success" });
        setRenamingAlbum(null);
        setNewAlbumValue("");
        const cardsRes = await fetch(`/api/cards?t=${Date.now()}`);
        const cardsData = await cardsRes.json();
        if (cardsData.success) setCards(cardsData.cards);
      } else {
        setAlbumMessage({ text: data.error || "Đổi tên album thất bại", type: "error" });
      }
    } catch {
      setAlbumMessage({ text: "Lỗi kết nối máy chủ", type: "error" });
    }
  };

  const handleCompleteRedemption = async (redemptionId: string) => {
    setRedemptionMessage(null);
    try {
      const res = await fetch("/api/redeem", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redemptionId, status: "COMPLETED" }),
      });
      const data = await res.json();
      if (data.success) {
        setRedemptionMessage("Đã duyệt hoàn tất trao quà!");
        setRedemptions((prev) =>
          prev.map((r) => (r._id === redemptionId ? { ...r, status: "COMPLETED" } : r))
        );
      } else {
        setRedemptionMessage(data.error || "Thất bại");
      }
    } catch {
      setRedemptionMessage("Lỗi kết nối máy chủ");
    }
  };

  const getRarityBadgeColor = (rar: string) => {
    switch (rar) {
      case "COMMON": return "text-zinc-550 bg-zinc-50 border-zinc-200";
      case "RARE": return "text-blue-600 bg-blue-50 border-blue-150";
      case "EPIC": return "text-purple-600 bg-purple-50 border-purple-150";
      case "LEGENDARY": return "text-amber-600 bg-amber-50 border-amber-200";
      case "MYTHIC": return "text-red-600 bg-red-50 border-red-200";
      case "SECRET": return "text-pink-600 bg-pink-50 border-pink-200";
      default: return "text-zinc-550 bg-zinc-50 border-zinc-200";
    }
  };

  const getRarityLabel = (rar: string) => {
    switch (rar) {
      case "COMMON": return "Common";
      case "RARE": return "Rare";
      case "EPIC": return "Epic";
      case "LEGENDARY": return "Legendary";
      case "MYTHIC": return "Mythic";
      case "SECRET": return "Secret";
      default: return rar;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
        <RefreshCw className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const existingAlbums = Array.from(new Set(cards.map((c) => c.album))).filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="editorial-title text-3xl sm:text-4xl text-zinc-950 flex items-center gap-2">
            <Shield className="w-6 h-6 text-zinc-600" /> Quản trị
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Viết truyện, đăng tải chương, quản lý bộ sưu tập thẻ bài và duyệt đơn đổi thưởng
          </p>
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-3 mb-8 overflow-x-auto">
        <button
          onClick={() => setAdminTab("stories")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            adminTab === "stories"
              ? "bg-zinc-900 text-white shadow-sm"
              : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
          }`}
        >
          <BookOpen className="w-4 h-4 text-zinc-500" /> Truyện ({stories.length})
        </button>
        <button
          onClick={() => setAdminTab("cards")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            adminTab === "cards"
              ? "bg-zinc-900 text-white shadow-sm"
              : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
          }`}
        >
          <Layers className="w-4 h-4 text-zinc-500" /> Thẻ và album ({cards.length})
        </button>
        <button
          onClick={() => setAdminTab("redemptions")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            adminTab === "redemptions"
              ? "bg-zinc-900 text-white shadow-sm"
              : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
          }`}
        >
          <Gift className="w-4 h-4 text-zinc-500" /> Đơn đổi quà ({redemptions.length})
        </button>
      </div>

      {message && (
        <div
          className={`p-3.5 mb-6 border text-xs rounded-lg text-center font-medium ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: VIẾT & ĐĂNG TẢI TRUYỆN (STORIES & CHAPTERS)                         */}
      {/* ========================================================================= */}
      {adminTab === "stories" && (
        <div id={selectedStory ? "chapter-editor" : "story-editor"} className="scroll-mt-24 space-y-8 animate-fade-in">
          {/* Sub Navigation if managing chapters */}
          {selectedStory && (
            <div className="bg-zinc-50/80 border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedStory(null)}
                  className="p-1.5 rounded-lg bg-white border border-zinc-300 text-zinc-800 hover:bg-zinc-100 transition-colors"
                  title="Quay lại danh sách truyện"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="text-[10px] uppercase font-mono font-bold text-zinc-700">Đang soạn thảo chương cho tác phẩm:</div>
                  <h3 className="text-base font-bold text-zinc-900">{selectedStory.title}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedStory(null)}
                className="text-xs font-semibold px-3 py-1.5 rounded-md bg-white border border-zinc-300 text-zinc-900 hover:bg-zinc-100"
              >
                Đổi Tác Phẩm Khác
              </button>
            </div>
          )}

          {/* VIEW A: CHAPTER EDITOR (If a story is selected) */}
          {selectedStory ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Write chapter form (2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                    <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-zinc-600" />
                      {editingChapterId ? `Chỉnh sửa nội dung chương #${chapterNumber}` : "Viết & Đăng Tải Chương Mới"}
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewChapter(!previewChapter)}
                        className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors flex items-center gap-1 ${
                          previewChapter ? "bg-zinc-100 border-zinc-300 text-zinc-900" : "bg-zinc-100 border-zinc-200 text-zinc-700"
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {previewChapter ? "Quay lại Editor" : "Xem trước căn đều"}
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleChapterSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">
                          Số thứ tự *
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={chapterNumber}
                          onChange={(e) => setChapterNumber(e.target.value)}
                          className="w-full bg-zinc-50 border border-border rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-800"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">
                          Tiêu đề chương (Tiếng Việt) *
                        </label>
                        <input
                          type="text"
                          required
                          value={chapterTitle}
                          onChange={(e) => setChapterTitle(e.target.value)}
                          placeholder="ví dụ: Chương 1: Bắt Đầu Hành Trình Mới"
                          className="w-full bg-zinc-50 border border-border rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-800"
                        />
                      </div>
                    </div>

                    {/* Content editor or justified live preview */}
                    {previewChapter ? (
                      <div className="bg-zinc-50/80 border border-zinc-200 rounded-lg p-5 min-h-[300px]">
                        <div className="text-[10px] font-mono text-zinc-700 uppercase mb-2 font-bold">
                          [Chế độ xem trước - Hiển thị căn đều như độc giả xem]
                        </div>
                        <h3 className="font-bold text-center text-base text-zinc-900 mb-4">{chapterTitle || "Tiêu đề chương"}</h3>
                        <div
                          className="text-sm font-serif leading-loose text-zinc-850 space-y-4 text-justify"
                          style={{ textAlign: "justify", textJustify: "inter-word" }}
                        >
                          {chapterContent
                            ? normalizeStoryText(chapterContent).split(/\n\s*\n/).map((p, idx) => (
                                <p key={idx} className="indent-6" style={{ textAlign: "justify", textJustify: "inter-word" }}>
                                  {p}
                                </p>
                              ))
                            : <p className="text-zinc-400 italic text-center">Chưa có nội dung để xem trước.</p>}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-semibold text-zinc-700">
                            Nội dung chương *
                          </label>
                          <span className="text-[11px] font-mono text-zinc-400">
                            {chapterContent.trim() ? chapterContent.trim().split(/\s+/).length : 0} từ | {chapterContent.length} ký tự
                          </span>
                        </div>
                        <textarea
                          required
                          rows={14}
                          value={chapterContent}
                          onChange={(e) => setChapterContent(e.target.value)}
                          placeholder="Nhấn Enter hai lần để bắt đầu đoạn mới."
                          className="w-full bg-zinc-50 border border-border rounded-lg p-3 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-800 font-sans leading-relaxed"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={chapterSubmitting}
                        className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-950 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40 shadow-sm"
                      >
                        {chapterSubmitting
                          ? "Đang lưu..."
                          : editingChapterId
                          ? "Cập Nhật Nội Dung Chương"
                          : "Đăng Tải Chương Này"}
                      </button>

                      {editingChapterId && (
                        <button
                          type="button"
                          onClick={resetChapterForm}
                          className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold"
                        >
                          Hủy Chỉnh Sửa
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* Chapter list for selected story (1 col) */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5 font-mono">
                      <FileText className="w-4 h-4 text-zinc-500" /> Danh sách chương ({chapters.length})
                    </h3>
                    <button
                      onClick={resetChapterForm}
                      className="text-[11px] text-zinc-700 font-semibold hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Viết mới
                    </button>
                  </div>

                  {loadingChapters ? (
                    <div className="py-8 text-center text-zinc-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                      <p className="text-xs">Đang tải danh sách chương...</p>
                    </div>
                  ) : chapters.length === 0 ? (
                    <p className="text-xs text-zinc-400 py-6 text-center">Truyện này chưa có chương nào.</p>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                      {chapters.map((ch) => (
                        <div
                          key={ch._id}
                          className={`p-3 rounded-lg border transition-all flex items-start justify-between gap-2 ${
                            editingChapterId === ch._id
                              ? "bg-zinc-50/70 border-zinc-300"
                              : "border-border hover:border-zinc-350 bg-zinc-50/30"
                          }`}
                        >
                          <div className="min-w-0 flex-grow">
                            <div className="text-xs font-bold text-zinc-900 truncate">
                              #{ch.chapterNumber}: {ch.title}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                              {ch.wordCount || 0} từ • {new Date(ch.createdAt).toLocaleDateString("vi-VN")}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleEditChapter(ch)}
                              className="p-1 rounded text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200"
                              title="Sửa chương"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteChapter(ch._id)}
                              className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Xóa chương"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* VIEW B: STORY CREATION & STORY LIST (When no specific story is chosen for chapter editing) */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Create/Edit Story Form (1 col) */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                  <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 pb-2 border-b border-border flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-zinc-600" />
                    {editingStoryId ? "Chỉnh Sửa Thông Tin Truyện" : "Tạo Truyện Mới"}
                  </h2>

                  <form onSubmit={handleStorySubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Tên truyện (Tiếng Việt) *
                      </label>
                      <input
                        type="text"
                        required
                        value={storyTitle}
                        onChange={(e) => setStoryTitle(e.target.value)}
                        placeholder="ví dụ: Tu Chân Giới Bí Sử"
                        className="w-full bg-zinc-50 border border-border rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Tác giả
                      </label>
                      <input
                        type="text"
                        value={storyAuthor}
                        onChange={(e) => setStoryAuthor(e.target.value)}
                        placeholder="ví dụ: Cố Mạn hoặc Bút danh của bạn"
                        className="w-full bg-zinc-50 border border-border rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-800"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">
                          Thể loại
                        </label>
                        <select
                          value={storyCategory}
                          onChange={(e) => setStoryCategory(e.target.value)}
                          className="w-full bg-zinc-50 border border-border rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none"
                        >
                          <option value="Huyền Huyễn">Huyền Huyễn</option>
                          <option value="Tiên Hiệp">Tiên Hiệp</option>
                          <option value="Kiếm Hiệp">Kiếm Hiệp</option>
                          <option value="Ngôn Tình">Ngôn Tình</option>
                          <option value="Đô Thị">Đô Thị</option>
                          <option value="Khoa Huyễn">Khoa Huyễn</option>
                          <option value="Phiêu Lưu">Phiêu Lưu</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">
                          Trạng thái
                        </label>
                        <select
                          value={storyStatus}
                          onChange={(e) => setStoryStatus(e.target.value as any)}
                          className="w-full bg-zinc-50 border border-border rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none"
                        >
                          <option value="ONGOING">Đang ra</option>
                          <option value="COMPLETED">Đã hoàn thành</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Ảnh bìa truyện
                      </label>
                      <input
                        type="text"
                        value={storyCoverImage}
                        onChange={(e) => setStoryCoverImage(e.target.value)}
                        placeholder="Dán link ảnh bìa (URL) hoặc tải ảnh bên dưới..."
                        className="w-full bg-zinc-50 border border-border rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none mb-2"
                      />
                      <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-border rounded-lg text-xs text-zinc-600 hover:bg-zinc-50 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" /> Chọn tệp ảnh tải lên
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleStoryCoverFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {storyCoverImage && (
                      <div className="w-24 h-32 rounded-lg overflow-hidden border border-border mx-auto bg-zinc-100">
                        <img
                          src={storyCoverImage}
                          alt="Bìa truyện preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Tóm tắt giới thiệu truyện
                      </label>
                      <textarea
                        rows={4}
                        value={storyDescription}
                        onChange={(e) => setStoryDescription(e.target.value)}
                        placeholder="Giới thiệu nội dung, cốt truyện tóm tắt..."
                        className="w-full bg-zinc-50 border border-border rounded-lg p-3 text-xs text-zinc-900 focus:outline-none leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={storySubmitting}
                        className="flex-grow py-2.5 bg-zinc-900 hover:bg-zinc-950 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40 shadow-sm"
                      >
                        {storySubmitting ? "Đang xử lý..." : editingStoryId ? "Lưu Cập Nhật Truyện" : "Tạo Truyện Mới"}
                      </button>

                      {editingStoryId && (
                        <button
                          type="button"
                          onClick={resetStoryForm}
                          className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold"
                        >
                          Hủy
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* Story list table (2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                    <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-zinc-500" /> Danh Sách Tác Phẩm ({stories.length})
                    </h2>
                  </div>

                  {stories.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400 text-xs">
                      Chưa có truyện nào trong hệ thống. Hãy tạo truyện đầu tiên ở form bên trái!
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border text-[10px] uppercase text-zinc-450 tracking-wider font-mono">
                            <th className="py-2.5 px-3">Bìa</th>
                            <th className="py-2.5 px-3">Tên tác phẩm</th>
                            <th className="py-2.5 px-3">Thể loại</th>
                            <th className="py-2.5 px-3">Số chương</th>
                            <th className="py-2.5 px-3 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-xs text-zinc-700">
                          {stories.map((st) => (
                            <tr key={st._id} className="hover:bg-zinc-50/50">
                              <td className="py-3 px-3">
                                <img
                                  src={
                                    st.coverImage ||
                                    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop&q=80"
                                  }
                                  alt={st.title}
                                  className="w-10 h-14 object-cover rounded border border-border bg-zinc-100 shrink-0"
                                />
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-bold text-zinc-900 line-clamp-1">{st.title}</div>
                                <div className="text-[10px] text-zinc-500 mt-0.5">Tác giả: {st.author}</div>
                              </td>
                              <td className="py-3 px-3">
                                <span className="text-[10px] bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded font-medium">
                                  {st.category}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-zinc-700">
                                {st.totalChapters || 0} chương
                              </td>
                              <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => handleSelectStoryForChapters(st)}
                                  className="text-[11px] bg-zinc-900 hover:bg-zinc-950 text-white font-semibold px-2.5 py-1 rounded transition-colors shadow-sm inline-flex items-center gap-1"
                                >
                                  <Edit3 className="w-3 h-3" /> Quản lý chương
                                </button>
                                <button
                                  onClick={() => handleEditStory(st)}
                                  className="text-[11px] text-zinc-700 hover:text-zinc-950 font-semibold px-2 py-1 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded transition-colors"
                                >
                                  Sửa
                                </button>
                                <button
                                  onClick={() => handleDeleteStory(st._id)}
                                  className="text-[11px] text-red-600 hover:text-red-700 font-semibold px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors"
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: QUẢN LÝ THẺ BÀI & ALBUM (CARDS & ALBUMS)                           */}
      {/* ========================================================================= */}
      {adminTab === "cards" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Form & Album Management Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
              <h2 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider mb-4 pb-2 border-b border-border">
                {editingCardId !== null ? "Chỉnh sửa thẻ bài" : "Đăng tải thẻ bài mới"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-555 uppercase tracking-wider mb-1.5">
                    Tên thẻ bài *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ví dụ: Rồng Thần Lam Ngọc"
                    className="w-full bg-zinc-50/50 border border-border rounded-md px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:border-zinc-350 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-555 uppercase tracking-wider mb-1.5">
                    Mô tả thẻ bài
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả cốt truyện hoặc sức mạnh..."
                    rows={3}
                    className="w-full bg-zinc-50/50 border border-border rounded-md px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:border-zinc-350 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-555 uppercase tracking-wider mb-1.5">
                    Bộ Album *
                  </label>
                  <select
                    value={isNewAlbum ? "new" : selectedAlbum}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "new") {
                        setIsNewAlbum(true);
                        setSelectedAlbum("");
                      } else {
                        setIsNewAlbum(false);
                        setSelectedAlbum(val);
                      }
                    }}
                    className="w-full bg-zinc-50/50 border border-border rounded-md px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:border-zinc-350 transition-colors mb-2"
                  >
                    <option value="" disabled>-- Chọn Album hiện có --</option>
                    {existingAlbums.map((alb) => (
                      <option key={alb} value={alb}>{alb}</option>
                    ))}
                    <option value="new">+ Thêm Album mới</option>
                  </select>

                  {isNewAlbum && (
                    <input
                      type="text"
                      required
                      value={newAlbumName}
                      onChange={(e) => setNewAlbumName(e.target.value)}
                      placeholder="Nhập tên Album mới..."
                      className="w-full bg-zinc-50/50 border border-border rounded-md px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:border-zinc-350 transition-colors"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-555 uppercase tracking-wider mb-1.5">
                    Độ hiếm *
                  </label>
                  <select
                    value={rarity}
                    onChange={(e) => setRarity(e.target.value as CardInfo["rarity"])}
                    className="w-full bg-zinc-50/50 border border-border rounded-md px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:border-zinc-350 transition-colors"
                  >
                    <option value="COMMON">Common (Phổ thông)</option>
                    <option value="RARE">Rare (Hiếm)</option>
                    <option value="EPIC">Epic (Sử thi)</option>
                    <option value="LEGENDARY">Legendary (Huyền thoại)</option>
                    <option value="MYTHIC">Mythic (Thần thoại)</option>
                    <option value="SECRET">Secret (Tuyệt mật)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-555 uppercase tracking-wider mb-1.5">
                    Ảnh thẻ bài *
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Dán link ảnh hoặc tải tệp bên dưới..."
                    className="w-full bg-zinc-50/50 border border-border rounded-md px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-zinc-350 transition-colors mb-2"
                  />
                  <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-border rounded-md text-xs text-zinc-600 hover:bg-zinc-50 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Tải ảnh từ thiết bị
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {imageUrl && (
                  <div className="w-24 h-32 rounded-lg overflow-hidden border border-border mx-auto bg-zinc-50">
                    <img src={imageUrl} alt="Card preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={submittingCard || uploadingImage}
                    className="flex-grow py-2.5 bg-zinc-900 hover:bg-zinc-950 text-white rounded-md text-xs font-bold transition-all disabled:opacity-40 shadow-sm"
                  >
                    {submittingCard ? "Đang xử lý..." : editingCardId !== null ? "Lưu thay đổi" : "Xuất bản thẻ bài"}
                  </button>
                  {editingCardId !== null && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-3 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md text-xs font-semibold"
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Album Rename Section */}
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 mb-3 pb-1 border-b border-border">
                Đổi Tên Album Hàng Loạt
              </h3>
              {albumMessage && (
                <div className={`p-2 mb-3 text-xs rounded border text-center ${
                  albumMessage.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
                }`}>
                  {albumMessage.text}
                </div>
              )}
              <form onSubmit={handleRenameAlbum} className="space-y-3">
                <select
                  value={renamingAlbum || ""}
                  onChange={(e) => {
                    setRenamingAlbum(e.target.value);
                    setNewAlbumValue(e.target.value);
                  }}
                  className="w-full bg-zinc-50/50 border border-border rounded-md px-3 py-2 text-xs text-zinc-800 focus:outline-none"
                >
                  <option value="">-- Chọn Album cần đổi tên --</option>
                  {existingAlbums.map((alb) => (
                    <option key={alb} value={alb}>{alb}</option>
                  ))}
                </select>
                {renamingAlbum && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newAlbumValue}
                      onChange={(e) => setNewAlbumValue(e.target.value)}
                      placeholder="Tên mới..."
                      className="flex-grow bg-zinc-50 border border-border rounded-md px-3 py-1.5 text-xs text-zinc-800 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-zinc-900 text-white rounded-md text-xs font-semibold hover:bg-zinc-950"
                    >
                      Đổi Tên
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Cards Table (2 cols) */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
              <h2 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider mb-4 pb-2 border-b border-border flex items-center gap-2">
                <Layers className="w-4 h-4 text-zinc-500" /> Tất cả thẻ bài ({cards.length})
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase text-zinc-450 tracking-wider font-mono">
                      <th className="py-2.5 px-2">Ảnh</th>
                      <th className="py-2.5 px-4">Tên</th>
                      <th className="py-2.5 px-4">Album</th>
                      <th className="py-2.5 px-4">Độ hiếm</th>
                      <th className="py-2.5 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs text-zinc-650">
                    {cards.map((c) => (
                      <tr key={c.id} className="hover:bg-zinc-50/50">
                        <td className="py-2.5 px-2">
                          <img
                            src={c.imageUrl}
                            alt={c.title}
                            className="w-10 h-12 object-cover rounded border border-border bg-zinc-50"
                          />
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-zinc-900 truncate max-w-[150px]">{c.title}</td>
                        <td className="py-2.5 px-4 text-zinc-500 truncate max-w-[120px]">{c.album}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${getRarityBadgeColor(c.rarity)}`}>
                            {getRarityLabel(c.rarity)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleEditClick(c)}
                            className="text-[11px] text-zinc-700 hover:text-zinc-950 font-semibold px-2 py-1 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteClick(c.id)}
                            className="text-[11px] text-red-600 hover:text-red-700 font-semibold px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DUYỆT ĐỔI QUÀ (REDEMPTIONS)                                         */}
      {/* ========================================================================= */}
      {adminTab === "redemptions" && (
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm animate-fade-in">
          <h2 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider mb-4 pb-2 border-b border-border flex items-center gap-2">
            <Gift className="w-4 h-4 text-zinc-500" /> Quản lý Đơn đổi quà ({redemptions.length} đơn)
          </h2>

          {redemptionMessage && (
            <div className="p-2.5 mb-4 border text-xs bg-emerald-50 border-emerald-200 text-emerald-700 rounded-lg text-center font-medium">
              {redemptionMessage}
            </div>
          )}

          {redemptions.length === 0 ? (
            <p className="text-xs text-zinc-400 py-8 text-center">Chưa có yêu cầu đổi quà nào trong hệ thống.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase text-zinc-450 tracking-wider font-mono">
                    <th className="py-2.5 px-3">Người chơi</th>
                    <th className="py-2.5 px-3">Phần thưởng</th>
                    <th className="py-2.5 px-3">Điểm trừ</th>
                    <th className="py-2.5 px-3">Thời gian</th>
                    <th className="py-2.5 px-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs text-zinc-650">
                  {redemptions.map((r) => (
                    <tr key={r._id} className="hover:bg-zinc-50/50">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-zinc-800">{r.userId?.displayName || "N/A"}</div>
                        <div className="text-[10px] text-zinc-400">@{r.userId?.username || "deleted"}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-zinc-900">{r.giftName}</td>
                      <td className="py-3 px-3 text-zinc-600 font-medium">-{r.pointsSpent}</td>
                      <td className="py-3 px-3 text-zinc-500">
                        {new Date(r.createdAt).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {r.status === "PENDING" ? (
                          <button
                            onClick={() => handleCompleteRedemption(r._id)}
                            className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors shadow-sm"
                          >
                            Xác nhận đã trao
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                            <CheckCircle className="w-3 h-3" /> Đã hoàn thành
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
