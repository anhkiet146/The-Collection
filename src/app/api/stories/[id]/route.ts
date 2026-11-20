import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Story, Chapter } from "@/lib/models";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const story = await Story.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).lean();
    if (!story) {
      return NextResponse.json({ success: false, error: "Không tìm thấy truyện" }, { status: 404 });
    }

    const chapters = await Chapter.find({ storyId: id })
      .select("chapterNumber title wordCount createdAt")
      .sort({ chapterNumber: 1 })
      .lean();

    return NextResponse.json({ success: true, story, chapters });
  } catch (error: any) {
    console.error("GET /api/stories/[id] error:", error);
    return NextResponse.json({ success: false, error: "Lỗi tải thông tin truyện" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Bạn không có quyền thực hiện thao tác này" }, { status: 403 });
    }

    const { id } = await params;
    await connectToDatabase();
    const body = await req.json();
    const { title, author, description, coverImage, category, status } = body;

    const updated = await Story.findByIdAndUpdate(
      id,
      {
        title: title?.trim(),
        author: author?.trim(),
        description: description?.trim(),
        coverImage: coverImage?.trim(),
        category: category?.trim(),
        status: status === "COMPLETED" ? "COMPLETED" : "ONGOING",
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Không tìm thấy truyện" }, { status: 404 });
    }

    return NextResponse.json({ success: true, story: updated, message: "Cập nhật thành công" });
  } catch (error: any) {
    console.error("PUT /api/stories/[id] error:", error);
    return NextResponse.json({ success: false, error: "Lỗi cập nhật truyện" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Bạn không có quyền thực hiện thao tác này" }, { status: 403 });
    }

    const { id } = await params;
    await connectToDatabase();

    await Story.findByIdAndDelete(id);
    await Chapter.deleteMany({ storyId: id });

    return NextResponse.json({ success: true, message: "Đã xóa truyện thành công" });
  } catch (error: any) {
    console.error("DELETE /api/stories/[id] error:", error);
    return NextResponse.json({ success: false, error: "Lỗi xóa truyện" }, { status: 500 });
  }
}
