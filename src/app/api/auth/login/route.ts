import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Thiếu thông tin đăng nhập" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ success: false, error: "Tên đăng nhập hoặc mật khẩu không đúng" }, { status: 400 });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: "Tên đăng nhập hoặc mật khẩu không đúng" }, { status: 400 });
    }

    const token = signToken({ userId: user._id.toString(), role: user.role });

    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "Đăng nhập thành công!",
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
