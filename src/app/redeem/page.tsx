"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Coins, Gift, RefreshCw, AlertTriangle, ArrowRight, CheckCircle, Clock } from "lucide-react";

interface CardInfo {
  _id: string;
  title: string;
  imageUrl: string;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC" | "SECRET";
  album: string;
}

interface UserCard {
  _id: string;
  cardId: CardInfo;
  quantity: number;
}

interface RedemptionRequest {
  _id: string;
  giftId: string;
  giftName: string;
  pointsSpent: number;
  status: "PENDING" | "COMPLETED";
  createdAt: string;
}

interface GiftItem {
  id: string;
  name: string;
  points: number;
  description: string;
}

export default function RedeemPage() {
  const [points, setPoints] = useState<number>(0);
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionRequest[]>([]);
  const [shop, setShop] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const router = useRouter();

  // Recycle selections
  const [recycleQuantities, setRecycleQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchRedeemData();
  }, []);

  const fetchRedeemData = async () => {
    try {
      const res = await fetch("/api/redeem");
      const data = await res.json();
      if (data.success) {
        setPoints(data.points);
        setUserCards(data.userCards);
        setRedemptions(data.redemptions);
        setShop(data.shop);
        
        // Initialize recycle quantities to 1
        const initialQuantities: Record<string, number> = {};
        data.userCards.forEach((uc: UserCard) => {
          initialQuantities[uc.cardId._id] = 1;
        });
        setRecycleQuantities(initialQuantities);
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleRecycle = async (cardId: string, maxQty: number) => {
    const qtyToRecycle = recycleQuantities[cardId] || 1;
    if (qtyToRecycle <= 0 || qtyToRecycle > maxQty) {
      setMessage({ text: "Số lượng quy đổi không hợp lệ", type: "error" });
      return;
    }

    const cardTitle = userCards.find(uc => uc.cardId._id === cardId)?.cardId.title || "thẻ bài";
    const isLastCopy = maxQty === qtyToRecycle;

    const confirmMsg = isLastCopy 
      ? `Bạn đang quy đổi bản sao CUỐI CÙNG của "${cardTitle}". Thẻ này sẽ biến mất khỏi bộ sưu tập Album của bạn. Bạn vẫn muốn tiếp tục?`
      : `Bạn có chắc chắn muốn quy đổi ${qtyToRecycle} thẻ "${cardTitle}" lấy điểm không?`;

    if (!confirm(confirmMsg)) return;

    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recycle", cardId, quantity: qtyToRecycle }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: data.message, type: "success" });
        window.dispatchEvent(new Event("user-balance-updated"));
        await fetchRedeemData();
      } else {
        setMessage({ text: data.error || "Quy đổi thất bại", type: "error" });
      }
    } catch {
      setMessage({ text: "Lỗi kết nối máy chủ", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExchange = async (giftId: string) => {
    const gift = shop.find(g => g.id === giftId);
    if (!gift) return;

    if (points < gift.points) {
      setMessage({ text: "Bạn không đủ điểm để đổi phần thưởng này", type: "error" });
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn dùng ${gift.points} điểm để đổi quà "${gift.name}"?`)) {
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "exchange", giftId }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: data.message, type: "success" });
        window.dispatchEvent(new Event("user-balance-updated"));
        await fetchRedeemData();
      } else {
        setMessage({ text: data.error || "Đổi quà thất bại", type: "error" });
      }
    } catch {
      setMessage({ text: "Lỗi kết nối máy chủ", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleQtyChange = (cardId: string, val: number, max: number) => {
    const cleaned = Math.max(1, Math.min(max, val));
    setRecycleQuantities(prev => ({ ...prev, [cardId]: cleaned }));
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

  const getRarityPoints = (rarity: string) => {
    switch (rarity) {
      case "COMMON": return 10;
      case "RARE": return 30;
      case "EPIC": return 100;
      case "LEGENDARY": return 400;
      case "MYTHIC": return 1500;
      case "SECRET": return 10000;
      default: return 10;
    }
  };

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case "COMMON": return "bg-zinc-100 text-zinc-600 border-zinc-200";
      case "RARE": return "bg-blue-50 text-blue-600 border-blue-200";
      case "EPIC": return "bg-purple-50 text-purple-600 border-purple-200";
      case "LEGENDARY": return "bg-amber-50 text-amber-600 border-amber-200";
      case "MYTHIC": return "bg-red-50 text-red-600 border-red-200";
      case "SECRET": return "bg-pink-50 text-pink-600 border-pink-200";
      default: return "bg-zinc-100 text-zinc-600 border-zinc-200";
    }
  };

  const getGiftIcon = (giftId: string) => {
    switch (giftId) {
      case "sting": return "🥤";
      case "banh_trang": return "🥙";
      case "2k": return "💵";
      case "hao_hao": return "🍜";
      case "tra_sua": return "🧋";
      case "com_tam": return "🍛";
      default: return "🎁";
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
        <RefreshCw className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-950 flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-500" /> Cửa Hàng Quy Đổi
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Đổi thẻ dư thừa thành Điểm quy đổi để đổi lấy nước ngọt, đồ ăn vặt hoặc tiền mặt!
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shadow-inner">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-amber-600 font-semibold">Số điểm hiện có</div>
            <div className="text-lg font-bold text-amber-800">{points.toLocaleString()} Điểm</div>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 mb-6 border rounded-lg text-sm text-center font-medium ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Grid: Left column (Shop & Logs), Right column (Card Recycle) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SHOP & LOGS (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* GIFT ITEMS */}
          <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider mb-6 pb-2 border-b border-border flex items-center gap-2">
              <Gift className="w-4 h-4 text-zinc-500" /> Quà tặng quy đổi
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shop.map((gift) => (
                <div key={gift.id} className="border border-border rounded-lg p-4 flex flex-col justify-between hover:border-zinc-300 transition-all bg-zinc-50/50">
                  <div className="text-center mb-4">
                    <span className="text-4xl filter drop-shadow-sm block mb-2">{getGiftIcon(gift.id)}</span>
                    <h3 className="font-semibold text-zinc-900 text-sm">{gift.name}</h3>
                    <p className="text-xs text-zinc-500 mt-1 min-h-[32px] leading-relaxed font-light">{gift.description}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-semibold py-1.5 border-t border-dashed border-zinc-200">
                      <span className="text-zinc-500">Giá quy đổi:</span>
                      <span className="text-amber-600 font-bold">{gift.points} Điểm</span>
                    </div>

                    <button
                      disabled={actionLoading || points < gift.points}
                      onClick={() => handleExchange(gift.id)}
                      className="w-full text-xs font-semibold py-2 px-3 bg-zinc-900 hover:bg-zinc-950 text-white rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    >
                      Đổi Quà
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HISTORICAL LOG */}
          <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider mb-4 pb-2 border-b border-border flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-500" /> Lịch sử đổi quà
            </h2>

            {redemptions.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">Bạn chưa có giao dịch đổi quà nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase text-zinc-450 tracking-wider font-mono">
                      <th className="py-2.5 px-3">Phần thưởng</th>
                      <th className="py-2.5 px-3">Điểm dùng</th>
                      <th className="py-2.5 px-3">Thời gian</th>
                      <th className="py-2.5 px-3 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs text-zinc-650">
                    {redemptions.map((r) => (
                      <tr key={r._id} className="hover:bg-zinc-50/50">
                        <td className="py-3 px-3 font-semibold text-zinc-800">
                          {getGiftIcon(r.giftId)} {r.giftName}
                        </td>
                        <td className="py-3 px-3 text-amber-600 font-medium">-{r.pointsSpent}</td>
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
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                              <Clock className="w-3 h-3" /> Chờ nhận
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                              <CheckCircle className="w-3 h-3" /> Đã trao
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

        {/* CARD RECYCLING GRID (1 col) */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border p-6 rounded-lg shadow-sm sticky top-24">
            <h2 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider mb-3 pb-2 border-b border-border flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-zinc-500" /> Đổi thẻ lấy điểm
            </h2>
            
            <div className="bg-zinc-50 border border-zinc-200 rounded p-3 mb-4 text-xs text-zinc-600 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-zinc-800">Lưu ý:</span> Bạn có thể đổi bất kỳ thẻ nào. Tuy nhiên, quy đổi thẻ duy nhất sẽ khiến nó biến mất khỏi Album sưu tập của bạn. Khuyên dùng đổi thẻ có số lượng trùng lặp (&gt;1).
              </div>
            </div>

            {userCards.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">Bạn không sở hữu bất kỳ thẻ bài nào.</p>
            ) : (
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                {userCards.map((uc) => {
                  const card = uc.cardId;
                  const maxQty = uc.quantity;
                  const qty = recycleQuantities[card._id] || 1;
                  const ptsPer = getRarityPoints(card.rarity);
                  const totalGained = ptsPer * qty;

                  return (
                    <div key={uc._id} className="border border-border rounded-lg p-3 hover:border-zinc-300 transition-colors bg-zinc-50/20">
                      <div className="flex gap-3">
                        <img
                          src={card.imageUrl}
                          alt={card.title}
                          className="w-16 h-20 object-cover rounded border border-zinc-200 bg-zinc-50 flex-shrink-0"
                        />
                        <div className="flex-grow min-w-0">
                          <h4 className="text-xs font-semibold text-zinc-900 truncate leading-snug">{card.title}</h4>
                          <div className="flex gap-2 items-center mt-1">
                            <span className={`px-1.5 py-0.5 rounded border text-[8px] font-semibold uppercase ${getRarityBadgeColor(card.rarity)}`}>
                              {getRarityLabel(card.rarity)}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              Sở hữu: <strong className="text-zinc-800">{maxQty}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center border border-zinc-200 rounded overflow-hidden h-7 bg-white">
                              <button
                                type="button"
                                onClick={() => handleQtyChange(card._id, qty - 1, maxQty)}
                                className="px-2 text-xs font-mono text-zinc-500 hover:bg-zinc-50 border-r border-zinc-200 h-full flex items-center justify-center"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={qty}
                                onChange={(e) => handleQtyChange(card._id, parseInt(e.target.value) || 1, maxQty)}
                                className="w-8 text-center text-xs font-bold text-zinc-800 focus:outline-none h-full"
                              />
                              <button
                                type="button"
                                onClick={() => handleQtyChange(card._id, qty + 1, maxQty)}
                                className="px-2 text-xs font-mono text-zinc-500 hover:bg-zinc-50 border-l border-zinc-200 h-full flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>

                            <button
                              disabled={actionLoading}
                              onClick={() => handleRecycle(card._id, maxQty)}
                              className="flex-grow h-7 text-[10px] font-semibold bg-zinc-100 hover:bg-zinc-200 border border-zinc-250 text-zinc-700 rounded flex items-center justify-center gap-1 transition-all"
                            >
                              Nhận +{totalGained} Điểm
                              <ArrowRight className="w-3 h-3 text-zinc-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
