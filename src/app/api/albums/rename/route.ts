import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Card } from "@/lib/models";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Không có quyền truy cập" }, { status: 403 });
    }

    const { oldName, newName } = await req.json();

    if (!oldName || !newName) {
      return NextResponse.json({ success: false, error: "Thiếu tên album cũ hoặc mới" }, { status: 400 });
    }

    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();

    if (trimmedOld === trimmedNew) {
      return NextResponse.json({ success: false, error: "Tên mới trùng với tên cũ" }, { status: 400 });
    }

    await connectToDatabase();

    // Update all cards matching the old album string value
    const result = await Card.updateMany(
      { album: trimmedOld },
      { $set: { album: trimmedNew } }
    );

    return NextResponse.json({
      success: true,
      message: `Đổi tên album từ "${trimmedOld}" sang "${trimmedNew}" thành công! Cập nhật ${result.modifiedCount} thẻ bài.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
