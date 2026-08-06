"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Upload, Sparkles, RefreshCw, Layers, Gift } from "lucide-react";

interface CardInfo {
  id: string;
  title: string;
  imageUrl: string;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC" | "SECRET";
  description: string;
  album: string;
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<CardInfo[]>([]);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  // Album states: dropdown, new text input, toggle
  const [selectedAlbum, setSelectedAlbum] = useState("");
  const [newAlbumName, setNewAlbumName] = useState("");
  const [isNewAlbum, setIsNewAlbum] = useState(false);
  
  const [rarity, setRarity] = useState<CardInfo["rarity"]>("COMMON");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingCard, setSubmittingCard] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  
  // Album renaming states
  const [renamingAlbum, setRenamingAlbum] = useState<string | null>(null);
  const [newAlbumValue, setNewAlbumValue] = useState("");
  const [albumMessage, setAlbumMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  
  // Admin Redemption states
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [redemptionMessage, setRedemptionMessage] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    checkAdminAndFetchCards();
  }, []);

  const checkAdminAndFetchCards = async () => {
    try {
      const meRes = await fetch(`/api/auth/me?t=${Date.now()}`);
      const meData = await meRes.json();
      
      if (meData.success && meData.user.role === "ADMIN") {
        setIsAdmin(true);
        // Fetch all cards
        const cardsRes = await fetch(`/api/cards?t=${Date.now()}`);
        const cardsData = await cardsRes.json();
        if (cardsData.success) {
          setCards(cardsData.cards);
        }
        // Fetch all redemptions
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setUploadingImage(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/cards/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setImageUrl(data.imageUrl);
      } else {
        setMessage({ text: data.error || "Tải ảnh lên thất bại", type: "error" });
      }
    } catch {
      setMessage({ text: "Lỗi kết nối tải tệp", type: "error" });
    } finally {
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

    const isEdit = editingCardId !== null;

    try {
      const res = await fetch("/api/cards", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCardId,
          title,
          description,
          album: finalAlbum,
          rarity,
          imageUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ 
          text: isEdit ? "Cập nhật thẻ bài thành công!" : "Tạo và xuất bản thẻ bài thành công!", 
          type: "success" 
        });
        
        // Reset Form
        setTitle("");
        setDescription("");
        setSelectedAlbum("");
        setNewAlbumName("");
        setIsNewAlbum(false);
        setRarity("COMMON");
        setImageFile(null);
        setImageUrl("");
        setEditingCardId(null);
        
        // Reload cards list
        checkAdminAndFetchCards();
      } else {
        setMessage({ text: data.error || (isEdit ? "Cập nhật thẻ bài thất bại" : "Tạo thẻ bài thất bại"), type: "error" });
      }
    } catch {
      setMessage({ text: isEdit ? "Lỗi kết nối cập nhật thẻ" : "Lỗi kết nối tạo thẻ", type: "error" });
    } finally {
      setSubmittingCard(false);
    }
  };

  const handleEditClick = (card: CardInfo) => {
    setEditingCardId(card.id);
    setTitle(card.title);
    setDescription(card.description || "");
    setRarity(card.rarity);
    setImageUrl(card.imageUrl);
    
    // Check if card's album exists in current list
    const albums = Array.from(new Set(cards.map((c) => c.album))).filter(Boolean);
    if (albums.includes(card.album)) {
      setSelectedAlbum(card.album);
      setIsNewAlbum(false);
    } else {
      setSelectedAlbum("new");
      setNewAlbumName(card.album);
      setIsNewAlbum(true);
    }
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingCardId(null);
    setTitle("");
    setDescription("");
    setRarity("COMMON");
    setImageUrl("");
    setImageFile(null);
    setSelectedAlbum("");
    setNewAlbumName("");
    setIsNewAlbum(false);
    setMessage(null);
  };

  const handleDeleteClick = async (cardId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thẻ bài này? Thẻ này cũng sẽ bị xóa khỏi kho đồ của người chơi.")) {
      return;
    }
    
    try {
      const res = await fetch(`/api/cards?id=${cardId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: "Xóa thẻ bài thành công!", type: "success" });
        checkAdminAndFetchCards();
      } else {
        setMessage({ text: data.error || "Xóa thẻ bài thất bại", type: "error" });
      }
    } catch {
      setMessage({ text: "Lỗi kết nối máy chủ khi xóa thẻ", type: "error" });
    }
  };

  const handleRenameAlbum = async (oldName: string, newName: string) => {
    if (!newName.trim()) {
      setAlbumMessage({ text: "Tên album không được để trống", type: "error" });
      return;
    }

    try {
      const res = await fetch("/api/albums/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName, newName }),
      });
      const data = await res.json();
      if (data.success) {
        setAlbumMessage({ text: data.message, type: "success" });
        setRenamingAlbum(null);
        // Refresh cards list to update album lists
        checkAdminAndFetchCards();
      } else {
        setAlbumMessage({ text: data.error || "Đổi tên thất bại", type: "error" });
      }
    } catch {
      setAlbumMessage({ text: "Lỗi kết nối máy chủ khi đổi tên", type: "error" });
    }
  };

  const handleCompleteRedemption = async (redemptionId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xác nhận đã trao quà cho đơn quy đổi này?")) return;

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", redemptionId }),
      });
      const data = await res.json();
      if (data.success) {
        setRedemptionMessage("Xác nhận trao quà thành công!");
        // Refresh redemptions list
        const redRes = await fetch(`/api/redeem?admin=true&t=${Date.now()}`);
        const redData = await redRes.json();
        if (redData.success) {
          setRedemptions(redData.redemptions);
        }
      } else {
        setRedemptionMessage(data.error || "Xác nhận thất bại");
      }
    } catch {
      setRedemptionMessage("Lỗi kết nối máy chủ");
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case "COMMON": return "Common";
      case "RARE": return "Rare";
      case "EPIC": return "Epic";
      case "LEGENDARY": return "Legendary";
      case "MYTHIC": return "Mythic";
      case "SECRET": return "Secret";
      default: return rarity;
    }
  };

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case "COMMON": return "text-zinc-550 bg-zinc-50 border-zinc-200";
      case "RARE": return "text-blue-600 bg-blue-50 border-blue-150";
      case "EPIC": return "text-purple-600 bg-purple-50 border-purple-150";
      case "LEGENDARY": return "text-amber-600 bg-amber-50 border-amber-200";
      case "MYTHIC": return "text-red-600 bg-red-50 border-red-200";
      case "SECRET": return "text-pink-600 bg-pink-50 border-pink-200";
      default: return "text-zinc-550 bg-zinc-50 border-zinc-200";
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-amber-600" /> BẢNG ĐIỀU KHIỂN QUẢN TRỊ
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Đăng tải thẻ bài mới, quản lý bộ sưu tập và cấu hình hệ thống
        </p>
      </div>

      {message && (
        <div
          className={`p-3 mb-6 border text-xs rounded-md text-center font-medium ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-205/50 text-emerald-600"
              : "bg-red-50 border-red-200 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form & Album Management Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
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
                      setSelectedAlbum("new");
                    } else {
                      setIsNewAlbum(false);
                      setSelectedAlbum(val);
                    }
                  }}
                  className="w-full bg-zinc-50/50 border border-border rounded-md px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:border-zinc-350 transition-colors cursor-pointer mb-2"
                >
                  <option value="select">--- Chọn Album ---</option>
                  {existingAlbums.map((alb) => (
                    <option key={alb} value={alb}>
                      {alb}
                    </option>
                  ))}
                  <option value="new">+ Tạo album mới...</option>
                </select>

                {isNewAlbum && (
                  <input
                    type="text"
                    required
                    value={newAlbumName}
                    onChange={(e) => setNewAlbumName(e.target.value)}
                    placeholder="Nhập tên album mới..."
                    className="w-full bg-zinc-50/50 border border-border rounded-md px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:border-zinc-350 transition-colors animate-fade-in"
                  />
                )}
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-555 uppercase tracking-wider mb-1.5">
                  Độ hiếm *
                </label>
                <select
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value as any)}
                  className="w-full bg-zinc-50/50 border border-border rounded-md px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:border-zinc-350 transition-colors cursor-pointer"
                >
                  <option value="COMMON" className="bg-card">Common (60.9%)</option>
                  <option value="RARE" className="bg-card">Rare (24%)</option>
                  <option value="EPIC" className="bg-card">Epic (10%)</option>
                  <option value="LEGENDARY" className="bg-card">Legendary (4%)</option>
                  <option value="MYTHIC" className="bg-card">Mythic (1%)</option>
                  <option value="SECRET" className="bg-card">Secret (0.1%)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-555 uppercase tracking-wider mb-1.5">
                  Ảnh thẻ bài *
                </label>
                <div className="relative border border-dashed border-zinc-200 rounded-md p-4 flex flex-col items-center justify-center bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    required={!imageUrl}
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  
                  {uploadingImage ? (
                    <RefreshCw className="w-5 h-5 text-zinc-400 animate-spin" />
                  ) : imageUrl ? (
                    <div className="w-full flex flex-col items-center">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-32 h-20 object-cover rounded border border-zinc-200 mb-2"
                      />
                      <span className="text-[10px] text-emerald-600 font-medium">Tải ảnh thành công</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-5 h-5 text-zinc-400 mb-2" />
                      <span className="text-xs text-zinc-500 font-medium">Kéo thả hoặc click chọn ảnh</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                {editingCardId !== null && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-zinc-100 hover:bg-zinc-200 border border-zinc-250 text-zinc-800 font-semibold py-2.5 px-4 rounded-md text-sm transition-all focus:outline-none"
                  >
                    Hủy
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submittingCard || uploadingImage}
                  className={`bg-zinc-900 hover:bg-zinc-950 text-white font-semibold py-2.5 px-4 rounded-md text-sm transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm ${
                    editingCardId !== null ? "flex-1" : "w-full"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  {submittingCard ? (editingCardId !== null ? "Đang lưu..." : "Đang đăng...") : (editingCardId !== null ? "Cập nhật" : "Phát hành thẻ mới")}
                </button>
              </div>
            </form>
          </div>

          {/* Album Management Card */}
          <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider mb-4 pb-2 border-b border-border">
              Quản lý Album ({existingAlbums.length})
            </h2>

            {albumMessage && (
              <div
                className={`p-2 mb-4 border text-[11px] rounded text-center font-medium ${
                  albumMessage.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                    : "bg-red-50 border-red-200 text-red-600"
                }`}
              >
                {albumMessage.text}
              </div>
            )}

            {existingAlbums.length === 0 ? (
              <p className="text-xs text-zinc-400">Chưa có album nào được tạo.</p>
            ) : (
              <div className="divide-y divide-border">
                {existingAlbums.map((albumName) => {
                  const isRenaming = renamingAlbum === albumName;
                  return (
                    <div key={albumName} className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                      {isRenaming ? (
                        <div className="flex flex-col gap-2 w-full">
                          <input
                            type="text"
                            value={newAlbumValue}
                            onChange={(e) => setNewAlbumValue(e.target.value)}
                            className="w-full bg-zinc-50 border border-border rounded px-2.5 py-1 text-xs text-zinc-800 focus:outline-none focus:border-zinc-350"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setRenamingAlbum(null)}
                              className="text-[10px] text-zinc-500 hover:text-zinc-800 font-medium px-2 py-0.5"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRenameAlbum(albumName, newAlbumValue)}
                              className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold px-2.5 py-0.5 bg-emerald-50 border border-emerald-150 rounded"
                            >
                              Lưu
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="text-xs font-medium text-zinc-800 truncate max-w-[170px]">
                            {albumName}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setRenamingAlbum(albumName);
                              setNewAlbumValue(albumName);
                              setAlbumMessage(null);
                            }}
                            className="text-[10px] text-zinc-500 hover:text-zinc-950 font-semibold px-2 py-1 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded transition-colors"
                          >
                            Đổi tên
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Existing Cards List */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider mb-4 pb-2 border-b border-border flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-500" /> Thẻ bài trong hệ thống ({cards.length} thẻ)
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase text-zinc-455 font-mono tracking-wider">
                    <th className="py-3 px-2">Ảnh</th>
                    <th className="py-3 px-4">Tên thẻ</th>
                    <th className="py-3 px-4">Album</th>
                    <th className="py-3 px-4">Độ hiếm</th>
                    <th className="py-3 px-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs text-zinc-650">
                  {cards.map((card) => (
                    <tr key={card.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3 px-2">
                        <img
                          src={card.imageUrl}
                          alt={card.title}
                          className="w-12 h-8 object-cover rounded border border-zinc-200 bg-zinc-50"
                        />
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-800 truncate max-w-[150px]">{card.title}</td>
                      <td className="py-3 px-4 text-zinc-500 truncate max-w-[120px]">{card.album}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${getRarityBadgeColor(card.rarity)}`}>
                          {getRarityLabel(card.rarity)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleEditClick(card)}
                          className="text-[11px] text-zinc-600 hover:text-zinc-950 font-semibold px-2 py-1 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded transition-colors shadow-sm"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteClick(card.id)}
                          className="text-[11px] text-red-600 hover:text-red-700 font-semibold px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors shadow-sm"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {cards.length === 0 && (
                <div className="text-center py-12 text-zinc-400">
                  Chưa có thẻ bài nào được xuất bản.
                </div>
              )}
            </div>
          </div>

          {/* Redemption Requests Management Card */}
          <div className="bg-card border border-border p-6 rounded-lg shadow-sm mt-6">
            <h2 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider mb-4 pb-2 border-b border-border flex items-center gap-2">
              <Gift className="w-4 h-4 text-zinc-500" /> Quản lý Đơn đổi quà ({redemptions.length} đơn)
            </h2>

            {redemptionMessage && (
              <div className="p-2 mb-4 border text-[11px] bg-emerald-50 border-emerald-200 text-emerald-600 rounded text-center font-medium">
                {redemptionMessage}
              </div>
            )}

            {redemptions.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">Chưa có yêu cầu đổi quà nào trong hệ thống.</p>
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
                        <td className="py-3 px-3 text-amber-600 font-medium">{r.pointsSpent}</td>
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
                              className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors shadow-sm"
                            >
                              Xác nhận đã trao
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                              Đã hoàn thành
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
        </div>
      </div>
    </div>
  );
}
