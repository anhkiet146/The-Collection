import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Story, Chapter } from "@/lib/models";
import { getSessionUser } from "@/lib/auth";
import { normalizeStoryFields, normalizeStoryText } from "@/lib/story-text";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const { id, chapterId } = await params;
    await connectToDatabase();

    const chapter = await Chapter.findOne({ _id: chapterId, storyId: id }).lean();
    if (!chapter) {
      return NextResponse.json({ success: false, error: "Không tìm thấy chương" }, { status: 404 });
    }

    const story = await Story.findById(id).select("title author coverImage").lean();

    // Find previous and next chapters
    const prevChapter = await Chapter.findOne({
      storyId: id,
      chapterNumber: { $lt: chapter.chapterNumber },
    })
      .sort({ chapterNumber: -1 })
      .select("_id chapterNumber title")
      .lean();

    const nextChapter = await Chapter.findOne({
      storyId: id,
      chapterNumber: { $gt: chapter.chapterNumber },
    })
      .sort({ chapterNumber: 1 })
      .select("_id chapterNumber title")
      .lean();

    // All chapters for quick navigation dropdown
    const allChapters = await Chapter.find({ storyId: id })
      .select("_id chapterNumber title")
      .sort({ chapterNumber: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      chapter: normalizeStoryFields(chapter),
      story: story && normalizeStoryFields(story),
      prevChapter: prevChapter && normalizeStoryFields(prevChapter),
      nextChapter: nextChapter && normalizeStoryFields(nextChapter),
      allChapters: allChapters.map(normalizeStoryFields),
    });
  } catch (error: any) {
    console.error("GET chapter error:", error);
    return NextResponse.json({ success: false, error: "Lỗi tải nội dung chương" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Bạn không có quyền thực hiện thao tác này" }, { status: 403 });
    }

    const { id, chapterId } = await params;
    await connectToDatabase();
    const body = await req.json();
    const { chapterNumber, title, content } = body;

    const words = content ? content.trim().split(/\s+/).length : undefined;

    const updated = await Chapter.findOneAndUpdate(
      { _id: chapterId, storyId: id },
      {
        ...(chapterNumber ? { chapterNumber: Number(chapterNumber) } : {}),
        ...(title ? { title: normalizeStoryText(title.trim()) } : {}),
        ...(content ? { content: normalizeStoryText(content.trim()), wordCount: words } : {}),
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Không tìm thấy chương để cập nhật" }, { status: 404 });
    }

    await Story.findByIdAndUpdate(id, { updatedAt: new Date() });

    return NextResponse.json({ success: true, chapter: updated, message: "Cập nhật chương thành công" });
  } catch (error: any) {
    console.error("PUT chapter error:", error);
    return NextResponse.json({ success: false, error: "Lỗi cập nhật chương" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Bạn không có quyền thực hiện thao tác này" }, { status: 403 });
    }

    const { id, chapterId } = await params;
    await connectToDatabase();

    await Chapter.findOneAndDelete({ _id: chapterId, storyId: id });
    const totalChapters = await Chapter.countDocuments({ storyId: id });
    await Story.findByIdAndUpdate(id, { totalChapters, updatedAt: new Date() });

    return NextResponse.json({ success: true, message: "Đã xóa chương thành công" });
  } catch (error: any) {
    console.error("DELETE chapter error:", error);
    return NextResponse.json({ success: false, error: "Lỗi xóa chương" }, { status: 500 });
  }
}
