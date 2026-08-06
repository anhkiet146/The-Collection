import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Mission, UserMission } from "@/lib/models";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { missionId } = await req.json();
    if (!missionId) {
      return NextResponse.json({ success: false, error: "Thiếu ID nhiệm vụ" }, { status: 400 });
    }

    await connectToDatabase();

    const mission = await Mission.findById(missionId);
    if (!mission) {
      return NextResponse.json({ success: false, error: "Không tìm thấy nhiệm vụ" }, { status: 404 });
    }

    const userMission = await UserMission.findOne({ userId: user._id, missionId });
    if (!userMission) {
      return NextResponse.json({ success: false, error: "Bạn chưa bắt đầu nhiệm vụ này" }, { status: 400 });
    }

    if (!userMission.completed) {
      return NextResponse.json({ success: false, error: "Nhiệm vụ chưa hoàn thành" }, { status: 400 });
    }

    if (userMission.claimed) {
      return NextResponse.json({ success: false, error: "Nhiệm vụ này đã nhận thưởng rồi" }, { status: 400 });
    }

    userMission.claimed = true;
    await userMission.save();

    user.rollsLeft += mission.rewardRolls;
    await user.save();

    return NextResponse.json({
      success: true,
      message: `Nhận thưởng thành công! +${mission.rewardRolls} lượt rút`,
      rollsLeft: user.rollsLeft,
    });
  } catch (error: any) {
    console.error("Claim reward error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
