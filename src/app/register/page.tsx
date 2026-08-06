"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, displayName }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess("Đăng ký thành công! Đang chuyển hướng đăng nhập...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        setError(data.error || "Đăng ký thất bại");
      }
    } catch {
      setError("Đã xảy ra lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md bg-card border border-border p-8 rounded-lg shadow-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-zinc-100 rounded-md mb-3">
            <Sparkles className="w-6 h-6 text-zinc-700" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">TẠO TÀI KHOẢN</h1>
          <p className="text-xs text-zinc-500 mt-1">Đăng ký tham gia hội sưu tập</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-md text-center font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs rounded-md text-center font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-555 uppercase tracking-wider mb-1.5">
              Tên đăng nhập
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-50/50 border border-border rounded-md px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-350 transition-colors"
              placeholder="vietlienkhongdau"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-555 uppercase tracking-wider mb-1.5">
              Tên hiển thị
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-zinc-50/50 border border-border rounded-md px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-350 transition-colors"
              placeholder="Hiệp Sĩ Gacha"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-555 uppercase tracking-wider mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-50/50 border border-border rounded-md pl-3 pr-10 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-350 transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 hover:bg-zinc-950 text-white font-medium py-2 px-4 rounded-md text-sm transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-sm"
          >
            {loading ? "Đang xử lý..." : "Đăng ký tài khoản"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-500">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-zinc-850 hover:underline font-semibold transition-colors">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </main>
  );
}
