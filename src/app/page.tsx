"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Dices, Layers, RefreshCw } from "lucide-react";

interface CardInfo {
  _id: string;
  title: string;
  imageUrl: string;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC" | "SECRET";
  description: string;
  album: string;
}

interface UserInfo {
  username: string;
  displayName: string;
  role: "USER" | "ADMIN";
  rollsLeft: number;
  pityCounter: number;
}

export default function HomePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolling, setRolling] = useState(false);
  const [rolledCards, setRolledCards] = useState<CardInfo[] | null>(null);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [error, setError] = useState("");
  
  // Gacha animation and replay state
  const [animationPhase, setAnimationPhase] = useState<"idle" | "pulling" | "revealing">("idle");
  const [rollAmount, setRollAmount] = useState<number>(1);
  const [revealRarityEffect, setRevealRarityEffect] = useState<{ rarity: string; index: number } | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleRoll = async (amount: number) => {
    if (rolling || !user) return;
    if (user.role !== "ADMIN" && user.rollsLeft < amount) return;
    setError("");
    setRolling(true);
    setRollAmount(amount);
    setAnimationPhase("pulling");
    setRolledCards(null);
    setRevealed({});

    try {
      const res = await fetch("/api/gacha/roll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data.success) {
        // Wait for the pull animation to build suspense (0.4 seconds)
        setTimeout(() => {
          setRolledCards(data.pulledCards);
          setUser(data.user);
          setAnimationPhase("revealing");
          // Trigger header sync
          window.dispatchEvent(new Event("user-balance-updated"));
        }, 400);
      } else {
        setError(data.error || "Rút thẻ thất bại");
        setAnimationPhase("idle");
      }
    } catch {
      setError("Đã xảy ra lỗi khi rút thẻ");
      setAnimationPhase("idle");
    } finally {
      setRolling(false);
    }
  };

  const handleFlip = (index: number) => {
    if (revealed[index]) return;
    setRevealed((prev) => ({ ...prev, [index]: true }));

    if (rolledCards && rolledCards[index]) {
      const card = rolledCards[index];
      setRevealRarityEffect({ rarity: card.rarity, index });
      setTimeout(() => {
        setRevealRarityEffect(null);
      }, 1000);
    }
  };

  const handleRevealAll = () => {
    if (!rolledCards) return;
    const allRevealed: Record<number, boolean> = {};
    rolledCards.forEach((_, idx) => {
      allRevealed[idx] = true;
    });
    setRevealed(allRevealed);
  };

  const handleGoBack = () => {
    setRolledCards(null);
    setAnimationPhase("idle");
    setRevealed({});
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "COMMON": return "border-zinc-400 text-zinc-650 bg-zinc-50/90";
      case "RARE": return "border-blue-500 text-blue-650 bg-blue-50/60";
      case "EPIC": return "border-purple-500 text-purple-650 bg-purple-50/60";
      case "LEGENDARY": return "border-amber-500 text-amber-650 bg-amber-50/60 shadow-sm";
      case "MYTHIC": return "border-red-550 text-red-650 bg-red-50/60 shadow-sm";
      case "SECRET": return "card-secret-front text-pink-600 shadow-md";
      default: return "border-zinc-300 text-zinc-400";
    }
  };

  const getRarityGlowClass = (rarity: string) => {
    switch (rarity) {
      case "COMMON": return "glow-common";
      case "RARE": return "glow-rare";
      case "EPIC": return "glow-epic";
      case "LEGENDARY": return "glow-legendary";
      case "MYTHIC": return "glow-mythic";
      case "SECRET": return "glow-secret";
      default: return "";
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

  const getRarityTextColor = (rarity: string) => {
    switch (rarity) {
      case "COMMON": return "text-zinc-400 font-bold";
      case "RARE": return "text-blue-400 font-bold";
      case "EPIC": return "text-purple-400 font-bold";
      case "LEGENDARY": return "text-rarity-legendary";
      case "MYTHIC": return "text-rarity-mythic";
      case "SECRET": return "text-rarity-secret";
      default: return "text-zinc-500 font-bold";
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
        <RefreshCw className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
      {error && (
        <div className="w-full max-w-md p-3 mb-6 bg-red-50 border border-red-200 text-red-600 text-xs rounded-md text-center font-medium">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {animationPhase === "idle" && (
          /* ROLL HUB VIEW */
          <motion.div
            key="roll-hub"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col items-center text-center max-w-lg"
          >
            {/* Elegant minimalistic card pack mockup */}
            <div className="relative group w-64 h-96 mb-8 rounded-lg border border-border bg-card flex flex-col items-center justify-between p-6 shadow-md transition-all duration-300 hover:border-zinc-300 hover:-translate-y-1">
              <div className="absolute inset-0.5 rounded-[7px] border border-zinc-100 pointer-events-none" />
              <div className="text-zinc-400 text-[10px] tracking-widest uppercase font-mono mt-2">Pack Phiên Bản Đặc Biệt</div>
              
              <div className="flex flex-col items-center py-4">
                <div className="w-16 h-16 rounded-full bg-zinc-900/50 border border-zinc-800 flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-zinc-400" />
                </div>
                <h2 className="text-lg font-medium text-zinc-100 tracking-wide">FRIENDS GACHA</h2>
                <p className="text-xs text-zinc-400 mt-2 max-w-[180px] leading-relaxed">
                  Rút thẻ ngẫu nhiên. Tích luỹ pity để chắc chắn sở hữu Mythic trở lên!
                </p>
              </div>
 
              <div className="text-zinc-400 text-[10px] font-mono mb-2">Thẻ bảo hiểm: 60 lượt</div>
            </div>
 
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <button
                disabled={rolling || (user.role !== "ADMIN" && user.rollsLeft < 1)}
                onClick={() => handleRoll(1)}
                className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 font-medium py-3 px-6 rounded-md text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed min-w-[160px]"
              >
                <Dices className="w-4 h-4 text-zinc-400" />
                Rút 1 Lượt
              </button>
              <button
                disabled={rolling || (user.role !== "ADMIN" && user.rollsLeft < 10)}
                onClick={() => handleRoll(10)}
                className="flex items-center justify-center gap-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-950 font-bold py-3 px-6 rounded-md text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed min-w-[160px] shadow-sm"
              >
                <Layers className="w-4 h-4" />
                Rút 10 Lượt
              </button>
            </div>

            {user.role !== "ADMIN" && user.rollsLeft === 0 && (
              <p className="text-xs text-amber-500/80 mt-4">
                Bạn đã hết lượt rút bài! Hãy làm nhiệm vụ để nhận thêm lượt miễn phí.
              </p>
            )}
          </motion.div>
        )}

        {animationPhase === "pulling" && (
          /* GACHA PACK PULLING ANIMATION OVERLAY */
          <motion.div
            key="opening-pack"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-lg flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden"
          >
            {/* Rotating colorful ambient light rays background */}
            <div className="absolute w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-amber-400/10 via-purple-500/10 to-blue-500/15 blur-3xl animate-rotate-slow pointer-events-none" />

            {/* Glowing floating card pack container */}
            <div className="relative w-56 h-80 sm:w-64 sm:h-96 rounded-lg border border-zinc-200 bg-card flex flex-col items-center justify-between p-6 shadow-2xl animate-pack-float animate-pack-shake">
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-100/30 to-transparent pointer-events-none rounded-lg" />
              <div className="absolute inset-0.5 rounded-[7px] border border-zinc-200/50 pointer-events-none" />
              
              <div className="text-zinc-400 text-[10px] tracking-widest uppercase font-mono mt-2">Pack Phiên Bản Đặc Biệt</div>

              {/* Suspense center light ray */}
              <div className="relative my-auto flex items-center justify-center">
                <div className="absolute w-28 h-28 rounded-full bg-amber-400/20 blur-2xl animate-pulse" />
                <Sparkles className="w-16 h-16 text-amber-500 animate-pulse relative z-10" />
              </div>

              <div className="text-zinc-600 text-xs font-bold tracking-wider animate-pulse uppercase">Đang mở thẻ bài...</div>
            </div>
          </motion.div>
        )}

        {animationPhase === "revealing" && rolledCards && (
          /* GACHA OPENING ROOM VIEW */
          <motion.div
            key="gacha-room"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex flex-col items-center py-4"
          >
            <div className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
              <h2 className="text-sm font-mono text-zinc-400 font-semibold">
                KẾT QUẢ RÚT THẺ ({rolledCards.length} THẺ)
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <button
                  onClick={handleRevealAll}
                  className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors font-medium mr-2"
                >
                  Lật tất cả
                </button>
                <button
                  onClick={handleGoBack}
                  className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-200 py-1.5 px-3.5 rounded-md hover:bg-zinc-850 transition-colors font-semibold shadow-sm"
                >
                  Trở lại
                </button>
                <button
                  disabled={rolling || (user.role !== "ADMIN" && user.rollsLeft < rollAmount)}
                  onClick={() => handleRoll(rollAmount)}
                  className="text-xs bg-zinc-900 border border-zinc-950 text-white py-1.5 px-4 rounded-md hover:bg-zinc-950 transition-colors font-semibold shadow-sm flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${rolling ? "animate-spin" : ""}`} />
                  Rút tiếp ({rollAmount} lượt)
                </button>
              </div>
            </div>

            {/* Grid display for results */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-6 justify-center w-full max-w-6xl">
              {rolledCards.map((card, idx) => {
                const isFlipped = revealed[idx] || false;
                const rarityColorClass = getRarityColor(card.rarity);
                const glowClass = getRarityGlowClass(card.rarity);

                return (
                  <div
                    key={`${card._id}-${idx}`}
                    className="aspect-[2/3] w-full max-w-[210px] mx-auto perspective-1000 relative"
                    onClick={() => handleFlip(idx)}
                  >
                    {/* Particle explosion effect based on rarity when flipped */}
                    {revealRarityEffect && revealRarityEffect.index === idx && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
                        {/* High rarity explosion white flashes */}
                        {["LEGENDARY", "MYTHIC", "SECRET"].includes(card.rarity) && (
                          <div className="absolute inset-[-20px] bg-white/45 animate-flash-burst rounded-lg" />
                        )}
                        
                        {/* Particles array */}
                        {Array.from({ length: 12 }).map((_, pIdx) => {
                          const angle = (pIdx * 30 * Math.PI) / 180;
                          const velocity = 80 + Math.random() * 80;
                          const x = Math.cos(angle) * velocity;
                          const y = Math.sin(angle) * velocity;

                          let pColor = "bg-blue-400";
                          if (card.rarity === "EPIC") pColor = "bg-purple-500 shadow-purple-500/50 shadow";
                          else if (card.rarity === "LEGENDARY") pColor = "bg-amber-400 shadow-amber-400/50 shadow-md";
                          else if (card.rarity === "MYTHIC") pColor = "bg-red-500 shadow-red-500/50 shadow-lg";
                          else if (card.rarity === "SECRET") pColor = "bg-pink-500 shadow-pink-500/50 shadow-xl animate-pulse";

                          return (
                            <span
                              key={pIdx}
                              className={`absolute w-1.5 h-1.5 rounded-full animate-particle ${pColor}`}
                              style={{
                                "--tw-particle-x": `${x}px`,
                                "--tw-particle-y": `${y}px`,
                              } as React.CSSProperties}
                            />
                          );
                        })}
                      </div>
                    )}

                    <motion.div
                      className="w-full h-full relative cursor-pointer transform-style-3d duration-500"
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                    >
                      {/* CARD BACK */}
                      <div className="absolute inset-0 bg-zinc-50 border border-zinc-200 rounded-lg flex flex-col items-center justify-between p-4 backface-hidden shadow hover:border-zinc-350 transition-colors">
                        <div className="w-full text-left text-[9px] font-mono text-zinc-400 tracking-wider">GACHA</div>
                        <div className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div className="w-full text-right text-[9px] font-mono text-zinc-400 tracking-wider">TAP TO FLIP</div>
                      </div>

                      {/* CARD FRONT */}
                      <div
                        className={`absolute inset-0 bg-card border-2 ${rarityColorClass} ${isFlipped ? glowClass : ""} rounded-lg overflow-hidden backface-hidden rotate-y-180 flex flex-col p-3 justify-between shadow-lg`}
                      >
                        <div className="flex justify-between items-center text-[9px] font-semibold">
                          <span className="truncate max-w-[80px] uppercase tracking-wider text-zinc-500">{card.album}</span>
                          <span className={`uppercase tracking-widest ${getRarityTextColor(card.rarity)}`}>{getRarityLabel(card.rarity)}</span>
                        </div>
 
                        <div className="my-2 flex-grow flex items-center justify-center bg-zinc-950/40 border border-zinc-800/80 rounded overflow-hidden aspect-video">
                          <img
                            src={card.imageUrl || "/placeholder.png"}
                            alt={card.title}
                            className="w-full h-full object-cover animate-fade-in"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="100%" height="100%" fill="%2318181b"/><circle cx="100" cy="75" r="16" fill="none" stroke="%2327272a" stroke-width="1.5"/><path d="M92,75 L108,75 M100,67 L100,83" stroke="%2327272a" stroke-width="1.5"/></svg>`;
                            }}
                          />
                        </div>
 
                        <div>
                          <h3 className="text-sm font-semibold text-zinc-100 truncate leading-snug">{card.title}</h3>
                          <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed font-light">
                            {card.description || "Không có mô tả chi tiết."}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
