import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User, UserCard, Redemption } from "@/lib/models";
import { updateMissionProgress } from "@/lib/missions";

const GIFT_SHOP = [
  { id: "2k", name: "2,000đ Tiền Mặt", points: 10000, description: "Quy đổi ra 2,000đ tiền mặt trực tiếp" },
  { id: "hao_hao", name: "Gói Mì Hảo Hảo", points: 15000, description: "Mì ăn liền Hảo Hảo chua cay quốc dân" },
  { id: "sting", name: "Chai Sting Dâu", points: 30000, description: "Một chai nước tăng lực Sting dâu mát lạnh" },
  { id: "banh_trang", name: "Bánh Tráng Trộn", points: 40000, description: "Bánh tráng trộn siêu ngon nhiều topping" },
  { id: "tra_sua", name: "Ly Trà Sữa", points: 60000, description: "Một ly trà sữa trân châu full topping cực ngon" },
  { id: "com_tam", name: "Combo Cơm Tấm", points: 100000, description: "Đĩa cơm tấm sườn bì chả chất lượng kèm nước ngọt" },
];

const RECYCLE_VALUES = {
  COMMON: 10,
  RARE: 30,
  EPIC: 100,
  LEGENDARY: 400,
  MYTHIC: 1500,
  SECRET: 10000,
};

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const adminMode = searchParams.get("admin") === "true";

    await connectToDatabase();

    if (adminMode) {
      if (user.role !== "ADMIN") {
        return NextResponse.json({ success: false, error: "Không có quyền truy cập" }, { status: 403 });
      }

      // Fetch all redemptions with user details
      const redemptions = await Redemption.find({})
        .populate("userId", "username displayName")
        .sort({ createdAt: -1 });

      return NextResponse.json({ success: true, redemptions });
    }

    // Normal User Mode
    // Fetch all user cards with quantity >= 1
    const rawUserCards = await UserCard.find({ userId: user._id, quantity: { $gt: 0 } })
      .populate("cardId")
      .lean();

    // Filter out user cards whose linked cardId was deleted or is missing
    const userCards = rawUserCards.filter((uc: any) => uc.cardId !== null && uc.cardId !== undefined);

    const redemptions = await Redemption.find({ userId: user._id }).sort({ createdAt: -1 });

    // Refresh user points from DB
    const dbUser = await User.findById(user._id);

    return NextResponse.json({
      success: true,
      points: dbUser?.points || 0,
      userCards,
      redemptions,
      shop: GIFT_SHOP,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Chưa đăng nhập" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    await connectToDatabase();

    // 1. RECYCLE CARD FOR POINTS
    if (action === "recycle") {
      const { cardId, quantity = 1 } = body;
      if (!cardId || quantity <= 0) {
        return NextResponse.json({ success: false, error: "Thẻ bài hoặc số lượng không hợp lệ" }, { status: 400 });
      }

      const userCard = await UserCard.findOne({ userId: user._id, cardId }).populate("cardId");
      if (!userCard || userCard.quantity < quantity) {
        return NextResponse.json({ success: false, error: "Bạn không sở hữu đủ số lượng thẻ bài này" }, { status: 400 });
      }

      const card = userCard.cardId as any;
      if (!card) {
        // Cleanup orphaned inventory record
        await UserCard.findByIdAndDelete(userCard._id);
        return NextResponse.json({ success: false, error: "Thẻ bài này đã bị xóa khỏi hệ thống" }, { status: 400 });
      }
      const pointsPerCard = RECYCLE_VALUES[card.rarity as keyof typeof RECYCLE_VALUES] || 10;
      const totalPointsEarned = pointsPerCard * quantity;

      // Update inventory quantity
      userCard.quantity -= quantity;
      if (userCard.quantity === 0) {
        await UserCard.findByIdAndDelete(userCard._id);
      } else {
        await userCard.save();
      }

      // Add points to user account
      await User.findByIdAndUpdate(user._id, { $inc: { points: totalPointsEarned } });

      // Update daily recycle mission progress
      await updateMissionProgress(user._id, "daily_recycle_1", 1);

      return NextResponse.json({
        success: true,
        message: `Đã đổi thành công ${quantity} thẻ "${card.title}" lấy +${totalPointsEarned} điểm!`,
      });
    }

    // 2. EXCHANGE POINTS FOR GIFT
    if (action === "exchange") {
      const { giftId } = body;
      const gift = GIFT_SHOP.find((g) => g.id === giftId);
      if (!gift) {
        return NextResponse.json({ success: false, error: "Phần thưởng không tồn tại" }, { status: 400 });
      }

      const dbUser = await User.findById(user._id);
      if (!dbUser || dbUser.points < gift.points) {
        return NextResponse.json({ success: false, error: "Bạn không đủ điểm quy đổi" }, { status: 400 });
      }

      // Deduct points
      dbUser.points -= gift.points;
      await dbUser.save();

      // Create redemption request
      const redemption = await Redemption.create({
        userId: user._id,
        giftId: gift.id,
        giftName: gift.name,
        pointsSpent: gift.points,
        status: "PENDING",
      });

      return NextResponse.json({
        success: true,
        message: `Đổi quà "${gift.name}" thành công! Vui lòng liên hệ Admin để nhận quà trực tiếp.`,
        redemption,
      });
    }

    // 3. ADMIN MARK GIVEN (COMPLETE)
    if (action === "complete") {
      if (user.role !== "ADMIN") {
        return NextResponse.json({ success: false, error: "Không có quyền thực hiện" }, { status: 403 });
      }

      const { redemptionId } = body;
      const redemption = await Redemption.findById(redemptionId);
      if (!redemption) {
        return NextResponse.json({ success: false, error: "Đơn đổi quà không tồn tại" }, { status: 400 });
      }

      redemption.status = "COMPLETED";
      await redemption.save();

      return NextResponse.json({
        success: true,
        message: `Đã xác nhận trao quà thành công!`,
      });
    }

    return NextResponse.json({ success: false, error: "Hành động không hợp lệ" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
