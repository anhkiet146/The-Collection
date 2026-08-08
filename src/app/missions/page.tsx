"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle2, Gift, Award, Calendar } from "lucide-react";

interface MissionInfo {
  id: string;
  title: string;
  description: string;
  type: "DAILY" | "ACHIEVEMENT";
  target: number;
  rewardRolls: number;
  key: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<MissionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      const res = await fetch(`/api/missions?t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setMissions(data.missions);
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (missionId: string) => {
    if (claimingId) return;
    setClaimingId(missionId);
    setMessage(null);

    try {
      const res = await fetch("/api/missions/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: data.message, type: "success" });
        // Trigger header sync
        window.dispatchEvent(new Event("user-balance-updated"));
        // Refresh page/user balance
        router.refresh();
        await fetchMissions();
      } else {
        setMessage({ text: data.error || "Nhận thưởng thất bại", type: "error" });
      }
    } catch {
      setMessage({ text: "Lỗi kết nối máy chủ", type: "error" });
    } finally {
      setClaimingId(null);
    }
  };

  const dailyMissions = missions.filter((m) => m.type === "DAILY");
  const achievementMissions = missions.filter((m) => m.type === "ACHIEVEMENT");

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
        <RefreshCw className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          <Award className="w-6 h-6 text-zinc-400" /> HỆ THỐNG NHIỆM VỤ
        </h1>
        <p className="text-xs text-zinc-450 mt-1">
          Hoàn thành nhiệm vụ mỗi ngày và tích lũy thành tựu để nhận lượt rút bài miễn phí
        </p>
      </div>

      {message && (
        <div
          className={`p-3 mb-6 border text-xs rounded-md text-center font-medium ${
            message.type === "success"
              ? "bg-emerald-950/20 border-emerald-800 text-emerald-400"
              : "bg-red-950/20 border-red-800 text-red-450"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Daily Missions Section */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-border pb-2">
          <Calendar className="w-4 h-4 text-zinc-500" /> Nhiệm vụ hàng ngày (Tự làm mới mỗi ngày)
        </h2>
        
        <div className="space-y-4">
          {dailyMissions.map((mission) => (
            <div
              key={mission.id}
              className="bg-card border border-border p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-zinc-700 shadow-sm"
            >
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-zinc-100">{mission.title}</h3>
                  <span className="text-[10px] bg-zinc-900 text-zinc-300 border border-zinc-800 px-2 py-0.5 rounded-full font-mono font-medium">
                    +{mission.rewardRolls} lượt
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">{mission.description}</p>
                
                {/* Progress bar */}
                <div className="mt-3 flex items-center gap-3 max-w-md">
                  <div className="h-1.5 bg-zinc-900 border border-zinc-800 rounded-full flex-grow overflow-hidden">
                    <div
                      className="bg-zinc-100 h-full transition-all duration-300"
                      style={{ width: `${(mission.progress / mission.target) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-450 font-semibold shrink-0">
                    {mission.progress}/{mission.target}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0">
                {mission.claimed ? (
                  <div className="flex items-center gap-1.5 text-zinc-500 border border-zinc-800/80 bg-zinc-950 px-3 py-1.5 rounded-md text-xs font-medium cursor-default select-none">
                    <CheckCircle2 className="w-4 h-4 text-zinc-500" /> Đã nhận
                  </div>
                ) : mission.completed ? (
                  <button
                    disabled={claimingId === mission.id}
                    onClick={() => handleClaimReward(mission.id)}
                    className="flex items-center gap-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-950 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    {claimingId === mission.id ? "Đang nhận..." : "Nhận thưởng"}
                  </button>
                ) : (
                  <div className="text-zinc-500 border border-zinc-800/80 bg-zinc-950 px-3 py-1.5 rounded-md text-xs font-medium cursor-default select-none">
                    Chưa hoàn thành
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Achievement Missions Section */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-border pb-2">
          <Award className="w-4 h-4 text-zinc-500" /> Thành tựu (Một lần duy nhất)
        </h2>
        
        <div className="space-y-4">
          {achievementMissions.map((mission) => (
            <div
              key={mission.id}
              className="bg-card border border-border p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-zinc-700 shadow-sm"
            >
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-zinc-100">{mission.title}</h3>
                  <span className="text-[10px] bg-zinc-900 text-zinc-300 border border-zinc-800 px-2 py-0.5 rounded-full font-mono font-medium">
                    +{mission.rewardRolls} lượt
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">{mission.description}</p>
                
                {/* Progress bar */}
                <div className="mt-3 flex items-center gap-3 max-w-md">
                  <div className="h-1.5 bg-zinc-900 border border-zinc-800 rounded-full flex-grow overflow-hidden">
                    <div
                      className="bg-zinc-100 h-full transition-all duration-300"
                      style={{ width: `${(mission.progress / mission.target) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-450 font-semibold shrink-0">
                    {mission.progress}/{mission.target}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0">
                {mission.claimed ? (
                  <div className="flex items-center gap-1.5 text-zinc-500 border border-zinc-800/80 bg-zinc-950 px-3 py-1.5 rounded-md text-xs font-medium cursor-default select-none">
                    <CheckCircle2 className="w-4 h-4 text-zinc-500" /> Đã mở
                  </div>
                ) : mission.completed ? (
                  <button
                    disabled={claimingId === mission.id}
                    onClick={() => handleClaimReward(mission.id)}
                    className="flex items-center gap-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-950 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    {claimingId === mission.id ? "Đang nhận..." : "Nhận giải"}
                  </button>
                ) : (
                  <div className="text-zinc-500 border border-zinc-800/80 bg-zinc-950 px-3 py-1.5 rounded-md text-xs font-medium cursor-default select-none">
                    Đang thực hiện
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
