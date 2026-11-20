"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, User, Eye, ArrowLeft, Calendar, FileText, ChevronRight, Play } from "lucide-react";

interface StoryDetail {
  _id: string;
  title: string;
  author: string;
  description: string;
  coverImage: string;
  category: string;
  status: "ONGOING" | "COMPLETED";
  views: number;
  totalChapters: number;
  createdAt: string;
  updatedAt: string;
}

interface ChapterItem {
  _id: string;
  chapterNumber: number;
  title: string;
  wordCount: number;
  createdAt: string;
}

export default function StoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [story, setStory] = useState<StoryDetail | null>(null);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchStory();
  }, [id]);

  const fetchStory = async () => {
    try {
      const res = await fetch(`/api/stories/${id}`);
      const data = await res.json();
      if (data.success) {
        setStory(data.story);
        setChapters(data.chapters || []);
      } else {
        setError(data.error || "Không tìm thấy truyện");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <BookOpen className="w-8 h-8 text-zinc-400 animate-pulse" />
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-red-500 font-medium mb-4">{error || "Truyện không tồn tại"}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
        >
          <ArrowLeft className="w-4 h-4" /> Về Thư Viện Truyện
        </Link>
      </div>
    );
  }

  const firstChapter = chapters[0];
  const latestChapter = chapters[chapters.length - 1];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại thư viện truyện
        </Link>
      </div>

      {/* Main Story Overview Card */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm mb-10">
        <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
          {/* Cover image */}
          <div className="w-44 sm:w-56 mx-auto md:mx-0 shrink-0 aspect-[3/4] rounded-xl overflow-hidden shadow-md border border-border relative bg-zinc-100">
            <img
              src={
                story.coverImage ||
                "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"
              }
              alt={story.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80";
              }}
            />
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between flex-grow">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                  {story.category}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    story.status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {story.status === "COMPLETED" ? "Đã hoàn thành" : "Đang tiến hành"}
                </span>
              </div>

              <h1 className="text-xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight leading-snug">
                {story.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 mt-3 font-medium">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Tác giả: <strong className="text-zinc-800">{story.author}</strong></span>
                </div>
                <div className="h-3 w-[1px] bg-zinc-200" />
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{story.totalChapters} Chương</span>
                </div>
                <div className="h-3 w-[1px] bg-zinc-200" />
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{story.views} Lượt đọc</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-border">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 font-mono">
                  Giới thiệu tác phẩm
                </h3>
                <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-light whitespace-pre-line text-justify">
                  {story.description || "Chưa có lời giới thiệu cho tác phẩm này."}
                </p>
              </div>
            </div>

            {/* Read actions */}
            <div className="mt-6 pt-4 flex flex-wrap gap-3">
              {firstChapter && (
                <Link
                  href={`/stories/${story._id}/chapter/${firstChapter._id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-950 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm"
                >
                  <Play className="w-4 h-4 fill-white" /> Đọc từ đầu (Chương 1)
                </Link>
              )}
              {latestChapter && latestChapter._id !== firstChapter?._id && (
                <Link
                  href={`/stories/${story._id}/chapter/${latestChapter._id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 font-semibold text-xs sm:text-sm transition-all"
                >
                  Đọc chương mới nhất (Chương {latestChapter.chapterNumber})
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chapter List Section */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-zinc-600" />
            <h2 className="text-base sm:text-lg font-bold text-zinc-900">
              Danh Sách Chương ({chapters.length})
            </h2>
          </div>
          <span className="text-xs text-zinc-500 font-mono">Cập nhật: {new Date(story.updatedAt).toLocaleDateString("vi-VN")}</span>
        </div>

        {chapters.length === 0 ? (
          <div className="py-12 text-center text-zinc-400">
            <p className="text-xs">Chưa có chương nào được đăng tải cho truyện này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {chapters.map((ch) => (
              <Link
                key={ch._id}
                href={`/stories/${story._id}/chapter/${ch._id}`}
                className="group flex items-center justify-between p-3.5 rounded-lg border border-border hover:border-zinc-400 hover:bg-zinc-50/70 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="text-xs font-mono font-bold text-amber-600 shrink-0">
                    #{ch.chapterNumber}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-zinc-850 group-hover:text-zinc-950 truncate">
                    {ch.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-zinc-400">
                  <span className="text-[10px] font-mono hidden sm:inline">
                    {ch.wordCount ? `${ch.wordCount} từ` : ""}
                  </span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
