"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, ShieldAlert, Sparkles, Menu, X } from "lucide-react";

interface UserInfo {
  username: string;
  displayName: string;
  role: "USER" | "ADMIN";
  rollsLeft: number;
  pityCounter: number;
}

export default function Header() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchUser();

    // Periodically refetch user balance to show regeneration in real-time (every 30 seconds)
    const interval = setInterval(fetchUser, 30000);

    // Listen to custom balance update events to sync instantly
    window.addEventListener("user-balance-updated", fetchUser);
    return () => {
      clearInterval(interval);
      window.removeEventListener("user-balance-updated", fetchUser);
    };
  }, [pathname]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/auth/me?t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      } else {
        if (pathname !== "/login" && pathname !== "/register") {
          router.push("/login");
        }
      }
    } catch {
      if (pathname !== "/login" && pathname !== "/register") {
        router.push("/login");
      }
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        router.push("/login");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user && (pathname === "/login" || pathname === "/register")) {
    return null;
  }

  return (
    <header className="border-b border-border bg-card/85 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-medium tracking-wide text-zinc-200 hover:text-zinc-50 transition-colors">
            <Sparkles className="w-5 h-5 text-zinc-400" />
            <span className="font-semibold text-zinc-100">THE COLLECTION</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className={`text-sm font-medium transition-colors ${pathname === "/" ? "text-zinc-100 font-semibold" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              Rút Thẻ
            </Link>
            <Link 
              href="/album" 
              className={`text-sm font-medium transition-colors ${pathname === "/album" ? "text-zinc-100 font-semibold" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              Bộ Sưu Tập
            </Link>
            <Link 
              href="/missions" 
              className={`text-sm font-medium transition-colors ${pathname === "/missions" ? "text-zinc-100 font-semibold" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              Nhiệm Vụ
            </Link>
            <Link 
              href="/redeem" 
              className={`text-sm font-medium transition-colors ${pathname === "/redeem" ? "text-zinc-100 font-semibold" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              Quy Đổi
            </Link>
            {user?.role === "ADMIN" && (
              <Link 
                href="/admin" 
                className={`text-sm font-medium flex items-center gap-1 transition-colors ${pathname === "/admin" ? "text-amber-500 font-semibold" : "text-amber-500/80 hover:text-amber-600"}`}
              >
                <ShieldAlert className="w-4 h-4" /> Admin
              </Link>
            )}
          </nav>
        </div>

        {user && (
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs bg-zinc-900/80 border border-zinc-800 px-2 py-1 rounded-md sm:px-3 sm:py-1.5 animate-fade-in">
              <div className="flex items-center gap-0.5">
                <span className="text-zinc-500 font-medium">Lượt:</span>
                <span className="text-zinc-100 font-bold">{user.role === "ADMIN" ? "∞" : user.rollsLeft}</span>
              </div>
              <div className="h-2.5 w-[1px] bg-zinc-800" />
              <div className="flex items-center gap-0.5">
                <span className="text-zinc-500 font-medium">Pity:</span>
                <span className="text-zinc-100 font-bold">{user.pityCounter}/60</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm font-medium text-zinc-300 mr-1">
                {user.displayName}
              </span>
              <button 
                onClick={handleLogout}
                className="text-zinc-400 hover:text-zinc-100 transition-colors p-2 hover:bg-zinc-900 rounded-md"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-zinc-400 hover:text-zinc-100 transition-colors p-2 hover:bg-zinc-900 rounded-md"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile nav menu */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-b border-border bg-card px-4 py-3 flex flex-col gap-2 animate-fade-in">
          {/* Mobile Stats Dashboard */}
          <div className="flex justify-between items-center bg-zinc-900/50 border border-zinc-800 rounded-md p-3 mb-1 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-zinc-500 font-medium">Lượt quay</span>
              <span className="text-zinc-100 font-bold text-sm">{user.role === "ADMIN" ? "Vô hạn (Admin)" : `${user.rollsLeft} lượt`}</span>
            </div>
            <div className="h-8 w-[1px] bg-zinc-800" />
            <div className="flex flex-col gap-0.5">
              <span className="text-zinc-500 font-medium">Bộ đếm Pity</span>
              <span className="text-zinc-100 font-bold text-sm">{user.pityCounter}/60 lượt</span>
            </div>
          </div>
          <Link 
            href="/" 
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm py-2 px-3 rounded-md transition-colors ${pathname === "/" ? "bg-zinc-900 text-zinc-50 font-medium" : "text-zinc-400 hover:bg-zinc-900/40"}`}
          >
            Rút Thẻ
          </Link>
          <Link 
            href="/album" 
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm py-2 px-3 rounded-md transition-colors ${pathname === "/album" ? "bg-zinc-900 text-zinc-50 font-medium" : "text-zinc-400 hover:bg-zinc-900/40"}`}
          >
            Bộ Sưu Tập
          </Link>
          <Link 
            href="/missions" 
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm py-2 px-3 rounded-md transition-colors ${pathname === "/missions" ? "bg-zinc-900 text-zinc-50 font-medium" : "text-zinc-400 hover:bg-zinc-900/40"}`}
          >
            Nhiệm Vụ
          </Link>
          <Link 
            href="/redeem" 
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm py-2 px-3 rounded-md transition-colors ${pathname === "/redeem" ? "bg-zinc-900 text-zinc-50 font-medium" : "text-zinc-400 hover:bg-zinc-900/40"}`}
          >
            Quy Đổi
          </Link>
          {user.role === "ADMIN" && (
            <Link 
              href="/admin" 
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm py-2 px-3 rounded-md text-amber-500 hover:bg-zinc-900/40 transition-colors flex items-center gap-1`}
            >
              <ShieldAlert className="w-4 h-4" /> Admin Panel
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
