import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { username, password, displayName } = await req.json();

    if (!username || !password || !displayName) {
      return NextResponse.json({ success: false, error: "Thiếu thông tin đăng ký" }, { status: 400 });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json({ success: false, error: "Tên đăng nhập đã tồn tại" }, { status: 400 });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser = await User.create({
      username,
      passwordHash,
      displayName,
      role: "USER",
      rollsLeft: 15,
      totalRolls: 0,
      pityCounter: 0,
    });

    return NextResponse.json({
      success: true,
      message: "Đăng ký tài khoản thành công!",
      userId: newUser._id,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
