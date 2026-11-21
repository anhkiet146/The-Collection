import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Story, Chapter } from "@/lib/models";
import { getSessionUser } from "@/lib/auth";
import { normalizeStoryFields, normalizeStoryText } from "@/lib/story-text";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const chapters = await Chapter.find({ storyId: id }).sort({ chapterNumber: 1 }).lean();
    return NextResponse.json({ success: true, chapters: chapters.map(normalizeStoryFields) });
  } catch (error: any) {
    console.error("GET /api/stories/[id]/chapters error:", error);
    return NextResponse.json({ success: false, error: "Lỗi tải danh sách chương" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Bạn không có quyền thực hiện thao tác này" }, { status: 403 });
    }

    const { id } = await params;
    await connectToDatabase();
    const body = await req.json();
    const { chapterNumber, title, content } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Vui lòng nhập tiêu đề chương" }, { status: 400 });
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: "Vui lòng nhập nội dung chương" }, { status: 400 });
    }

    const num = Number(chapterNumber);
    if (!num || num < 1) {
      return NextResponse.json({ success: false, error: "Số thứ tự chương không hợp lệ" }, { status: 400 });
    }

    // Check if chapter number already exists for this story
    const existing = await Chapter.findOne({ storyId: id, chapterNumber: num });
    if (existing) {
      return NextResponse.json({ success: false, error: `Chương ${num} đã tồn tại trong truyện này` }, { status: 400 });
    }

    const words = content.trim().split(/\s+/).length;
    const chapter = await Chapter.create({
      storyId: id,
      chapterNumber: num,
      title: normalizeStoryText(title.trim()),
      content: normalizeStoryText(content.trim()),
      wordCount: words,
    });

    // Update story total chapters
    const totalChapters = await Chapter.countDocuments({ storyId: id });
    await Story.findByIdAndUpdate(id, { totalChapters, updatedAt: new Date() });

    return NextResponse.json({ success: true, chapter, message: "Đăng tải chương mới thành công" });
  } catch (error: any) {
    console.error("POST /api/stories/[id]/chapters error:", error);
    return NextResponse.json({ success: false, error: "Lỗi đăng tải chương" }, { status: 500 });
  }
}
