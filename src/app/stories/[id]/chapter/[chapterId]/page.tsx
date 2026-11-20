"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Settings2,
  Type,
  Sun,
  Moon,
  List,
} from "lucide-react";

interface ChapterData {
  _id: string;
  storyId: string;
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  createdAt: string;
}

interface StorySummary {
  _id: string;
  title: string;
  author: string;
  coverImage: string;
}

interface ChapterNav {
  _id: string;
  chapterNumber: number;
  title: string;
}

export default function ChapterReaderPage({
  params,
}: {
  params: Promise<{ id: string; chapterId: string }>;
}) {
  const { id, chapterId } = use(params);
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [story, setStory] = useState<StorySummary | null>(null);
  const [prevChapter, setPrevChapter] = useState<ChapterNav | null>(null);
  const [nextChapter, setNextChapter] = useState<ChapterNav | null>(null);
  const [allChapters, setAllChapters] = useState<ChapterNav[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  // Reading settings state
  const [fontSize, setFontSize] = useState<number>(18);
  const [themeMode, setThemeMode] = useState<"light" | "sepia" | "dark">("light");
  const [fontFamily, setFontFamily] = useState<"serif" | "sans">("serif");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchChapter();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id, chapterId]);

  const fetchChapter = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stories/${id}/chapters/${chapterId}`);
      const data = await res.json();
      if (data.success) {
        setChapter(data.chapter);
        setStory(data.story);
        setPrevChapter(data.prevChapter);
        setNextChapter(data.nextChapter);
        setAllChapters(data.allChapters || []);
      } else {
        setError(data.error || "Không tìm thấy chương");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  const getThemeStyles = () => {
    switch (themeMode) {
      case "sepia":
        return {
          wrapper: "bg-[#fbf4e6] text-[#4a3b2c]",
          card: "bg-[#f5ebd7] border-[#e8dac0]",
          toolbar: "bg-[#f5ebd7]/90 border-[#e8dac0] text-[#4a3b2c]",
          meta: "text-[#7a6752]",
        };
      case "dark":
        return {
          wrapper: "bg-zinc-950 text-zinc-200",
          card: "bg-zinc-900 border-zinc-800",
          toolbar: "bg-zinc-900/90 border-zinc-800 text-zinc-200",
          meta: "text-zinc-400",
        };
      default:
        return {
          wrapper: "bg-zinc-50/60 text-zinc-900",
          card: "bg-white border-border shadow-sm",
          toolbar: "bg-white/95 border-border text-zinc-800",
          meta: "text-zinc-500",
        };
    }
  };

  const themeStyles = getThemeStyles();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
        <BookOpen className="w-8 h-8 text-zinc-400 animate-pulse mb-3" />
        <p className="text-xs text-zinc-500">Đang tải nội dung chương...</p>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-red-500 text-sm font-medium mb-4">{error || "Chương không tồn tại"}</p>
        <Link
          href={`/stories/${id}`}
          className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
        >
          <ArrowLeft className="w-4 h-4" /> Trở lại thông tin truyện
        </Link>
      </div>
    );
  }

  // Format paragraphs from plain text with indentation and clean breaks
  const paragraphs = chapter.content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeStyles.wrapper}`}>
      {/* Sticky Top Reading Toolbar */}
      <div className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${themeStyles.toolbar}`}>
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={`/stories/${id}`}
            className="flex items-center gap-2 text-xs font-medium hover:opacity-80 transition-opacity truncate max-w-[200px] sm:max-w-xs"
            title={story?.title}
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="truncate">{story?.title || "Truyện"}</span>
          </Link>

          {/* Quick Chapter Selector & Settings */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Chapter Select Dropdown */}
            <select
              value={chapter._id}
              onChange={(e) => router.push(`/stories/${id}/chapter/${e.target.value}`)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-border bg-card font-medium focus:outline-none max-w-[130px] sm:max-w-[190px] truncate"
            >
              {allChapters.map((ch) => (
                <option key={ch._id} value={ch._id}>
                  Chương {ch.chapterNumber}: {ch.title}
                </option>
              ))}
            </select>

            {/* Reading preferences button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-lg hover:bg-zinc-200/50 transition-colors"
              title="Tùy chỉnh đọc truyện"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible settings panel */}
        {showSettings && (
          <div className="border-t border-border p-4 max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4 animate-fade-in text-xs">
            {/* Font size */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-500">Cỡ chữ:</span>
              <button
                onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                className="px-2.5 py-1 rounded border border-border hover:bg-zinc-200/40 font-mono font-bold"
              >
                A-
              </button>
              <span className="font-mono w-6 text-center font-bold">{fontSize}</span>
              <button
                onClick={() => setFontSize(Math.min(28, fontSize + 2))}
                className="px-2.5 py-1 rounded border border-border hover:bg-zinc-200/40 font-mono font-bold"
              >
                A+
              </button>
            </div>

            {/* Font family */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-500">Phông chữ:</span>
              <button
                onClick={() => setFontFamily("serif")}
                className={`px-3 py-1 rounded border font-serif ${
                  fontFamily === "serif" ? "bg-zinc-900 text-white" : "border-border"
                }`}
              >
                Serif (Có chân)
              </button>
              <button
                onClick={() => setFontFamily("sans")}
                className={`px-3 py-1 rounded border font-sans ${
                  fontFamily === "sans" ? "bg-zinc-900 text-white" : "border-border"
                }`}
              >
                Sans (Hiện đại)
              </button>
            </div>

            {/* Theme mode */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-500">Màu nền:</span>
              <button
                onClick={() => setThemeMode("light")}
                className={`px-2.5 py-1 rounded border flex items-center gap-1 bg-white text-zinc-900 ${
                  themeMode === "light" ? "ring-2 ring-zinc-900 font-bold" : "border-zinc-300"
                }`}
              >
                <Sun className="w-3 h-3" /> Sáng
              </button>
              <button
                onClick={() => setThemeMode("sepia")}
                className={`px-2.5 py-1 rounded border flex items-center gap-1 bg-[#fbf4e6] text-[#4a3b2c] ${
                  themeMode === "sepia" ? "ring-2 ring-amber-700 font-bold" : "border-[#e0d3bc]"
                }`}
              >
                Sepia
              </button>
              <button
                onClick={() => setThemeMode("dark")}
                className={`px-2.5 py-1 rounded border flex items-center gap-1 bg-zinc-900 text-white ${
                  themeMode === "dark" ? "ring-2 ring-zinc-400 font-bold" : "border-zinc-700"
                }`}
              >
                <Moon className="w-3 h-3" /> Tối
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Chapter Content Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Story & Chapter Titles Header */}
        <div className="text-center mb-10 pb-6 border-b border-dashed border-border/70">
          <Link
            href={`/stories/${id}`}
            className="text-xs uppercase tracking-widest font-semibold text-amber-600 hover:underline mb-2 inline-block"
          >
            {story?.title}
          </Link>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight mt-1 mb-3">
            {chapter.title}
          </h1>
          <div className={`text-xs ${themeStyles.meta} flex items-center justify-center gap-4 font-mono`}>
            <span>Chương {chapter.chapterNumber}</span>
            <span>•</span>
            <span>{chapter.wordCount || 0} từ</span>
            <span>•</span>
            <span>{new Date(chapter.createdAt).toLocaleDateString("vi-VN")}</span>
          </div>
        </div>

        {/* JUSTIFIED CHAPTER CONTENT - NỘI DUNG CHƯƠNG CĂN ĐỀU */}
        <article
          className={`leading-loose sm:leading-loose tracking-normal ${
            fontFamily === "serif" ? "font-serif" : "font-sans"
          }`}
          style={{
            fontSize: `${fontSize}px`,
            textAlign: "justify",
            textJustify: "inter-word",
          }}
        >
          {paragraphs.map((p, idx) => (
            <p
              key={idx}
              className="mb-6 indent-6 sm:indent-8 text-justify leading-relaxed"
              style={{ textAlign: "justify", textJustify: "inter-word" }}
            >
              {p}
            </p>
          ))}
        </article>

        {/* Bottom Chapter Navigation Controls */}
        <div className="mt-14 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          {prevChapter ? (
            <Link
              href={`/stories/${id}/chapter/${prevChapter._id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border hover:bg-zinc-200/40 text-xs sm:text-sm font-semibold transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Chương trước ({prevChapter.chapterNumber})
            </Link>
          ) : (
            <div className="w-full sm:w-auto text-xs text-zinc-400 py-2.5 px-4 rounded-lg border border-border/40 text-center select-none">
              Đây là chương đầu tiên
            </div>
          )}

          <Link
            href={`/stories/${id}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-border hover:bg-zinc-200/40 text-xs font-semibold"
          >
            <List className="w-4 h-4" /> Mục lục
          </Link>

          {nextChapter ? (
            <Link
              href={`/stories/${id}/chapter/${nextChapter._id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-950 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm"
            >
              Chương tiếp ({nextChapter.chapterNumber}) <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="w-full sm:w-auto text-xs text-zinc-400 py-2.5 px-4 rounded-lg border border-border/40 text-center select-none">
              Đã đến chương mới nhất
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
