"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StoryCover from "@/components/StoryCover";
import { useIsAdmin } from "@/components/Header";
import { BookOpen, Search, Eye, Filter, Plus, User as UserIcon } from "lucide-react";

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

const CATEGORIES = [
  "ALL",
  "Huyền Huyễn",
  "Tiên Hiệp",
  "Kiếm Hiệp",
  "Ngôn Tình",
  "Đô Thị",
  "Khoa Huyễn",
  "Phiêu Lưu",
  "Khác",
];

export default function StoriesHomePage() {
  const isAdmin = useIsAdmin();
  const [stories, setStories] = useState<StoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  useEffect(() => {
    fetchStories();
  }, [selectedCategory, selectedStatus]);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (selectedCategory !== "ALL") params.append("category", selectedCategory);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);

      const res = await fetch(`/api/stories?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStories(data.stories);
      }
    } catch (err) {
      console.error("Fetch stories failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStories();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <section className="mb-8 flex flex-wrap items-end justify-between gap-5 border-y border-zinc-900 py-8 sm:py-12">
        <h1 className="editorial-title text-5xl sm:text-7xl lg:text-8xl">Thư viện truyện</h1>
        {isAdmin && (
          <Link href="/admin#story-editor" className="editorial-action editorial-action-filled">
            <Plus className="size-4" /> Thêm truyện
          </Link>
        )}
      </section>

      {/* Search & Filter Bar */}
      <div id="story-list" className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Tìm theo tên truyện hoặc tác giả"
              placeholder="Tìm theo tên truyện hoặc tác giả…"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-800"
            />
          </form>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto self-end">
            <span className="text-xs text-zinc-500 shrink-0 flex items-center gap-1 font-medium">
              <Filter className="w-3.5 h-3.5" /> Trạng thái:
            </span>
            <select
              aria-label="Trạng thái truyện"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-card text-xs font-medium text-zinc-800 focus:outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ONGOING">Đang ra</option>
              <option value="COMPLETED">Đã hoàn thành</option>
            </select>
          </div>
        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                aria-pressed={active}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all shrink-0 ${
                  active
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
                }`}
              >
                {cat === "ALL" ? "Tất Cả Thể Loại" : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stories Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-zinc-400">
          <BookOpen className="w-8 h-8 animate-pulse mb-3 text-zinc-500" />
          <p className="text-xs">Đang tải danh sách truyện...</p>
        </div>
      ) : stories.length === 0 ? (
        <div className="py-20 text-center bg-card border border-border rounded-xl p-8 shadow-sm">
          <BookOpen className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-800">Không tìm thấy truyện phù hợp</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Hãy thử tìm kiếm với từ khóa khác hoặc chuyển sang thể loại khác.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {stories.map((story) => (
            <Link
              key={story._id}
              href={`/stories/${story._id}`}
              className="group bg-card border border-border overflow-hidden hover:border-zinc-900 transition-all flex flex-col"
            >
              {/* Cover Image */}
              <div className="relative aspect-[3/4] bg-zinc-100 overflow-hidden">
                <StoryCover src={story.coverImage} loading="lazy" />
                {/* Status Badge */}
                <span
                  className={`absolute top-2.5 left-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-md shadow-sm ${
                    story.status === "COMPLETED"
                      ? "bg-white text-zinc-950"
                      : "bg-zinc-950 text-white"
                  }`}
                >
                  {story.status === "COMPLETED" ? "Hoàn thành" : "Đang ra"}
                </span>

                {/* Category Badge */}
                <span className="absolute bottom-2.5 right-2.5 text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-900/80 text-zinc-200 backdrop-blur-md">
                  {story.category}
                </span>
              </div>

              {/* Story Details */}
              <div className="p-4 flex flex-col flex-grow justify-between">
                <div>
                  <h3 className="editorial-title text-xl text-zinc-950 line-clamp-2 leading-snug">
                    {story.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="truncate">{story.author || "Tác giả"}</span>
                  </div>

                  <p className="text-xs text-zinc-600 mt-2 line-clamp-2 leading-relaxed font-light">
                    {story.description || "Chưa có mô tả cho tác phẩm này."}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-dashed border-border flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span className="font-semibold text-zinc-700">
                    {story.totalChapters || 0} chương
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-zinc-400" />
                    {story.views || 0}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
