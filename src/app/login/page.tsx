"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Đăng nhập thất bại");
      }
    } catch {
      setError("Đã xảy ra lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm bg-card border border-border p-8 rounded-lg shadow-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-zinc-100 rounded-md mb-3">
            <Sparkles className="w-6 h-6 text-zinc-700" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">THE COLLECTION</h1>
          <p className="text-xs text-zinc-555 mt-1.5 text-center px-4">
            Nhập tên của bạn để bắt đầu quay thẻ gacha
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-md text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-444 uppercase tracking-widest mb-2">
              Tên của bạn
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-50/50 border border-zinc-200 rounded-md px-3 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
              placeholder="Ví dụ: Kiet, Huy, admin..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 hover:bg-zinc-950 text-white font-semibold py-2.5 px-4 rounded-md text-sm transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-sm"
          >
            {loading ? "Đang vào game..." : "Bắt đầu"}
          </button>
        </form>
      </div>
    </main>
  );
}
