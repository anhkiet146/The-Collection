"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, ArrowUpDown, RefreshCw, EyeOff, Check } from "lucide-react";

interface CardInfo {
  id: string;
  title: string;
  imageUrl: string;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC" | "SECRET";
  description: string;
  album: string;
  quantity: number;
}

const RARITIES = ["ALL", "COMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC", "SECRET"] as const;
type RarityFilter = typeof RARITIES[number];

export default function AlbumPage() {
  const [cards, setCards] = useState<CardInfo[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "title" | "rarity">("newest");
  const [showLocked, setShowLocked] = useState<"all" | "unlocked" | "locked">("all");
  const router = useRouter();

  useEffect(() => {
    fetchUserRole();
    fetchCards();
  }, []);

  const fetchUserRole = async () => {
    try {
      const res = await fetch(`/api/auth/me?t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setUserRole(data.user.role);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCards = async () => {
    try {
      const res = await fetch(`/api/cards?t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setCards(data.cards);
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const getRarityWeight = (rarity: string) => {
    switch (rarity) {
      case "COMMON": return 1;
      case "RARE": return 2;
      case "EPIC": return 3;
      case "LEGENDARY": return 4;
      case "MYTHIC": return 5;
      case "SECRET": return 6;
      default: return 0;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "COMMON": return "border-zinc-300 text-zinc-550 bg-zinc-50";
      case "RARE": return "border-blue-400 text-blue-700 bg-blue-50/70";
      case "EPIC": return "border-purple-400 text-purple-700 bg-purple-50/70";
      case "LEGENDARY": return "border-amber-400 text-amber-700 bg-amber-50/70";
      case "MYTHIC": return "border-red-500 text-red-700 bg-red-50/70";
      case "SECRET": return "card-secret-front text-pink-700 shadow-md";
      default: return "border-zinc-200 text-zinc-400";
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

  // 1. Filter cards
  const filteredCards = cards.filter((card) => {
    const matchesSearch = card.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          card.album.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRarity = rarityFilter === "ALL" || card.rarity === rarityFilter;
    
    let matchesLockState = true;
    if (showLocked === "unlocked") matchesLockState = card.quantity > 0;
    if (showLocked === "locked") matchesLockState = card.quantity === 0;

    return matchesSearch && matchesRarity && matchesLockState;
  });

  // 2. Sort cards
  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortBy === "title") {
      return a.title.localeCompare(b.title, "vi");
    }
    if (sortBy === "rarity") {
      return getRarityWeight(b.rarity) - getRarityWeight(a.rarity);
    }
    // newest (default)
    return 1; // Array fetched sorted by newest already
  });

  // 3. Collection Stats
  const totalCardsCount = cards.length;
  const unlockedCardsCount = cards.filter((c) => c.quantity > 0).length;
  const completionPercentage = totalCardsCount > 0 ? Math.round((unlockedCardsCount / totalCardsCount) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
        <RefreshCw className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Board */}
      <div className="bg-card border border-border p-6 rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">BỘ SƯU TẬP ALBUM</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Mở khóa các thẻ bài độc đáo để nhận được các danh hiệu và phần thưởng
          </p>
        </div>
        <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
          <div className="text-center">
            <span className="block text-[10px] uppercase text-zinc-400 font-mono tracking-wider">Tiến độ</span>
            <span className="text-2xl font-bold text-zinc-800 mt-1 block">
              {unlockedCardsCount}/{totalCardsCount}
            </span>
          </div>
          <div className="h-10 w-[1px] bg-zinc-200" />
          <div className="text-center">
            <span className="block text-[10px] uppercase text-zinc-400 font-mono tracking-wider">Hoàn thành</span>
            <span className="text-2xl font-bold text-zinc-800 mt-1 block">
              {completionPercentage}%
            </span>
          </div>
          <div className="h-10 w-[1px] bg-zinc-200" />
          {/* Progress ring/bar indicator */}
          <div className="w-16 h-2 bg-zinc-100 border border-zinc-200 rounded-full overflow-hidden">
            <div 
              className="bg-zinc-800 h-full transition-all duration-500" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filters & Control Panel */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm thẻ bài hoặc album..."
              className="w-full bg-card border border-border rounded-md pl-9 pr-4 py-2 text-sm text-zinc-800 focus:outline-none focus:border-zinc-350 placeholder-zinc-400 transition-colors shadow-sm"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Lock State Filter */}
            <div className="flex bg-zinc-100 border border-zinc-200 rounded-md p-0.5 text-xs text-zinc-500">
              <button
                onClick={() => setShowLocked("all")}
                className={`px-3 py-1.5 rounded-sm transition-all ${showLocked === "all" ? "bg-white text-zinc-950 font-semibold shadow-sm border border-zinc-200/50" : "hover:text-zinc-800"}`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setShowLocked("unlocked")}
                className={`px-3 py-1.5 rounded-sm transition-all ${showLocked === "unlocked" ? "bg-white text-zinc-950 font-semibold shadow-sm border border-zinc-200/50" : "hover:text-zinc-800"}`}
              >
                Đã sở hữu
              </button>
              <button
                onClick={() => setShowLocked("locked")}
                className={`px-3 py-1.5 rounded-sm transition-all ${showLocked === "locked" ? "bg-white text-zinc-950 font-semibold shadow-sm border border-zinc-200/50" : "hover:text-zinc-800"}`}
              >
                Chưa sở hữu
              </button>
            </div>

            {/* Sort Selection */}
            <div className="flex items-center bg-card border border-border rounded-md px-3 py-1 text-xs gap-2 shadow-sm">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-zinc-700 focus:outline-none border-none cursor-pointer"
              >
                <option value="newest" className="bg-card text-zinc-800">Mới nhất</option>
                <option value="title" className="bg-card text-zinc-800">Tên thẻ (A-Z)</option>
                <option value="rarity" className="bg-card text-zinc-800">Độ hiếm</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rarity Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-4">
          {RARITIES.map((rarity) => (
            <button
              key={rarity}
              onClick={() => setRarityFilter(rarity)}
              className={`px-3 py-1 text-xs rounded-full border transition-all ${
                rarityFilter === rarity
                  ? "bg-zinc-900 border-zinc-900 text-white font-medium shadow-sm"
                  : "bg-transparent border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-800"
              }`}
            >
              {rarity === "ALL" ? "Tất cả độ hiếm" : getRarityLabel(rarity)}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      {sortedCards.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-lg">
          <p className="text-sm text-zinc-450">Không tìm thấy thẻ bài nào khớp với bộ lọc.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(
            sortedCards.reduce<Record<string, CardInfo[]>>((acc, card) => {
              if (!acc[card.album]) acc[card.album] = [];
              acc[card.album].push(card);
              return acc;
            }, {})
          ).map(([albumName, albumCards]) => {
            const albumTotal = albumCards.length;
            const albumUnlocked = albumCards.filter((c) => c.quantity > 0).length;
            const albumPct = Math.round((albumUnlocked / albumTotal) * 100);

            return (
              <div key={albumName} className="space-y-4">
                {/* Album Group Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-2 gap-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-bold text-zinc-900 tracking-wide uppercase">
                      Bộ sưu tập: {albumName}
                    </h2>
                    <span className="text-[10px] bg-zinc-100 border border-border text-zinc-500 font-medium px-2 py-0.5 rounded-full">
                      {albumUnlocked}/{albumTotal} thẻ
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 font-mono">Hoàn thành: {albumPct}%</span>
                    <div className="w-20 h-1.5 bg-zinc-100 border border-zinc-200 rounded-full overflow-hidden">
                      <div
                        className="bg-zinc-800 h-full transition-all duration-300"
                        style={{ width: `${albumPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Cards grid for this album */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {albumCards.map((card) => {
                    const isUnlocked = card.quantity > 0;
                    const canSeeCard = true;
                    const rarityColorClass = getRarityColor(card.rarity);

                    return (
                      <div
                        key={card.id}
                        className={`relative group bg-card border ${rarityColorClass} rounded-lg overflow-hidden flex flex-col p-3 justify-between transition-all duration-300 ${
                          isUnlocked
                            ? "opacity-100 hover:scale-[1.02] shadow shadow-zinc-200"
                            : "opacity-45 grayscale hover:grayscale-[50%] hover:opacity-60"
                        }`}
                      >
                        {/* Rarity */}
                        <div className="flex justify-between items-center text-[9px] font-semibold text-zinc-400 mb-2">
                          <span className="truncate max-w-[85px] uppercase tracking-wider">{card.album}</span>
                          <span className="font-semibold uppercase tracking-widest">
                            {getRarityLabel(card.rarity)}
                          </span>
                        </div>

                        {/* Image */}
                        <div className="flex items-center justify-center bg-zinc-50 border border-zinc-150 rounded overflow-hidden aspect-[3/4] relative mb-3">
                          <img
                            src={canSeeCard ? (card.imageUrl || "/placeholder.png") : `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="267" viewBox="0 0 200 267"><rect width="100%" height="100%" fill="%23f4f4f5"/><circle cx="100" cy="133" r="20" fill="none" stroke="%23e4e4e7" stroke-width="1.5"/><path d="M90,133 L110,133 M100,123 L100,143" stroke="%23e4e4e7" stroke-width="1.5"/></svg>`}
                            alt={card.title}
                            className="w-full h-full object-cover animate-fade-in"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="267" viewBox="0 0 200 267"><rect width="100%" height="100%" fill="%23f4f4f5"/><circle cx="100" cy="133" r="20" fill="none" stroke="%23e4e4e7" stroke-width="1.5"/><path d="M90,133 L110,133 M100,123 L100,143" stroke="%23e4e4e7" stroke-width="1.5"/></svg>`;
                            }}
                          />

                          {isUnlocked && card.quantity > 1 && (
                            <div className="absolute top-2 right-2 bg-zinc-900/90 border border-zinc-950 text-[10px] text-white font-semibold px-2 py-0.5 rounded-full select-none">
                              x{card.quantity}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex flex-col gap-1.5">
                          <h3 className="text-sm font-semibold text-zinc-900 truncate">{card.title}</h3>
                          <p className="text-[10px] text-zinc-550 line-clamp-2 leading-relaxed font-light">
                            {canSeeCard
                              ? card.description || "Không có mô tả chi tiết."
                              : "Khóa: Rút thẻ để mở khóa thông tin."}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
