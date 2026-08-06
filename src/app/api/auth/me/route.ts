import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Chưa đăng nhập" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        rollsLeft: user.rollsLeft,
        totalRolls: user.totalRolls,
        pityCounter: user.pityCounter,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
