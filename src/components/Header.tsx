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
          <Link href="/" className="flex items-center gap-2 font-medium tracking-wide text-zinc-800 hover:text-zinc-950 transition-colors">
            <Sparkles className="w-5 h-5 text-zinc-500" />
            <span className="font-semibold text-zinc-900">THE COLLECTION</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className={`text-sm font-medium transition-colors ${pathname === "/" ? "text-zinc-950 font-semibold" : "text-zinc-500 hover:text-zinc-800"}`}
            >
              Rút Thẻ
            </Link>
            <Link 
              href="/album" 
              className={`text-sm font-medium transition-colors ${pathname === "/album" ? "text-zinc-950 font-semibold" : "text-zinc-500 hover:text-zinc-800"}`}
            >
              Bộ Sưu Tập
            </Link>
            <Link 
              href="/missions" 
              className={`text-sm font-medium transition-colors ${pathname === "/missions" ? "text-zinc-950 font-semibold" : "text-zinc-500 hover:text-zinc-800"}`}
            >
              Nhiệm Vụ
            </Link>
            <Link 
              href="/redeem" 
              className={`text-sm font-medium transition-colors ${pathname === "/redeem" ? "text-zinc-950 font-semibold" : "text-zinc-500 hover:text-zinc-800"}`}
            >
              Quy Đổi
            </Link>
            {user?.role === "ADMIN" && (
              <Link 
                href="/admin" 
                className={`text-sm font-medium flex items-center gap-1 transition-colors ${pathname === "/admin" ? "text-amber-600 font-semibold" : "text-amber-600/80 hover:text-amber-700"}`}
              >
                <ShieldAlert className="w-4 h-4" /> Admin
              </Link>
            )}
          </nav>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs sm:text-sm bg-zinc-50 border border-border px-3 py-1.5 rounded-md">
              <div className="flex items-center gap-1">
                <span className="text-zinc-400 font-medium">Lượt:</span>
                <span className="text-zinc-800 font-bold">{user.role === "ADMIN" ? "Vô hạn" : user.rollsLeft}</span>
              </div>
              <div className="h-3 w-[1px] bg-zinc-200" />
              <div className="flex items-center gap-1">
                <span className="text-zinc-400 font-medium">Pity:</span>
                <span className="text-zinc-800 font-bold">{user.pityCounter}/60</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm font-medium text-zinc-600 mr-1">
                {user.displayName}
              </span>
              <button 
                onClick={handleLogout}
                className="text-zinc-500 hover:text-zinc-900 transition-colors p-2 hover:bg-zinc-100 rounded-md"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-zinc-500 hover:text-zinc-900 transition-colors p-2 hover:bg-zinc-100 rounded-md"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile nav menu */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-b border-border bg-card px-4 py-3 flex flex-col gap-2">
          <Link 
            href="/" 
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm py-2 px-3 rounded-md transition-colors ${pathname === "/" ? "bg-zinc-100 text-zinc-900 font-medium" : "text-zinc-500 hover:bg-zinc-50"}`}
          >
            Rút Thẻ
          </Link>
          <Link 
            href="/album" 
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm py-2 px-3 rounded-md transition-colors ${pathname === "/album" ? "bg-zinc-100 text-zinc-900 font-medium" : "text-zinc-500 hover:bg-zinc-50"}`}
          >
            Bộ Sưu Tập
          </Link>
          <Link 
            href="/missions" 
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm py-2 px-3 rounded-md transition-colors ${pathname === "/missions" ? "bg-zinc-100 text-zinc-900 font-medium" : "text-zinc-500 hover:bg-zinc-50"}`}
          >
            Nhiệm Vụ
          </Link>
          <Link 
            href="/redeem" 
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm py-2 px-3 rounded-md transition-colors ${pathname === "/redeem" ? "bg-zinc-100 text-zinc-900 font-medium" : "text-zinc-500 hover:bg-zinc-50"}`}
          >
            Quy Đổi
          </Link>
          {user.role === "ADMIN" && (
            <Link 
              href="/admin" 
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm py-2 px-3 rounded-md text-amber-600 hover:bg-zinc-50 transition-colors flex items-center gap-1`}
            >
              <ShieldAlert className="w-4 h-4" /> Admin Panel
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
