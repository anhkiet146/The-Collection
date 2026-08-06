import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Card, UserCard } from "@/lib/models";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    await connectToDatabase();
    const cards = await Card.find({}).sort({ createdAt: -1 });

    const user = await getSessionUser();
    if (!user) {
      const formatted = cards.map((c) => ({
        id: c._id,
        title: c.title,
        imageUrl: c.imageUrl,
        rarity: c.rarity,
        description: c.description,
        album: c.album,
        quantity: 0,
      }));
      return NextResponse.json({ success: true, cards: formatted });
    }

    const userCards = await UserCard.find({ userId: user._id });
    const userCardsMap = new Map(userCards.map((uc) => [uc.cardId.toString(), uc.quantity]));

    const formatted = cards.map((c) => ({
      id: c._id,
      title: c.title,
      imageUrl: c.imageUrl,
      rarity: c.rarity,
      description: c.description,
      album: c.album,
      quantity: userCardsMap.get(c._id.toString()) || 0,
    }));

    return NextResponse.json({ success: true, cards: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Không có quyền truy cập" }, { status: 403 });
    }

    const { title, imageUrl, rarity, description, album } = await req.json();

    if (!title || !imageUrl || !rarity || !album) {
      return NextResponse.json({ success: false, error: "Thiếu trường thông tin bắt buộc" }, { status: 400 });
    }

    await connectToDatabase();

    const newCard = await Card.create({
      title,
      imageUrl,
      rarity,
      description,
      album,
    });

    return NextResponse.json({
      success: true,
      message: "Thẻ bài đã được tạo thành công!",
      card: newCard,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Không có quyền truy cập" }, { status: 403 });
    }

    const { id, title, imageUrl, rarity, description, album } = await req.json();

    if (!id || !title || !imageUrl || !rarity || !album) {
      return NextResponse.json({ success: false, error: "Thiếu trường thông tin bắt buộc" }, { status: 400 });
    }

    await connectToDatabase();

    const updatedCard = await Card.findByIdAndUpdate(
      id,
      { title, imageUrl, rarity, description, album },
      { new: true }
    );

    if (!updatedCard) {
      return NextResponse.json({ success: false, error: "Không tìm thấy thẻ bài để cập nhật" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Cập nhật thẻ bài thành công!",
      card: updatedCard,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Không có quyền truy cập" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu mã định danh thẻ bài" }, { status: 400 });
    }

    await connectToDatabase();

    const deletedCard = await Card.findByIdAndDelete(id);

    if (!deletedCard) {
      return NextResponse.json({ success: false, error: "Không tìm thấy thẻ bài để xóa" }, { status: 404 });
    }

    // Clean up ownership mappings for this card
    await UserCard.deleteMany({ cardId: id });

    return NextResponse.json({
      success: true,
      message: "Xóa thẻ bài thành công!",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
