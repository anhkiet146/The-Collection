import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { username } = await req.json();

    if (!username || !username.trim()) {
      return NextResponse.json({ success: false, error: "Vui lòng nhập tên của bạn" }, { status: 400 });
    }

    const cleanUsername = username.trim();

    await connectToDatabase();

    // Look up username case-insensitively
    let user = await User.findOne({ username: { $regex: new RegExp(`^${cleanUsername}$`, "i") } });

    if (!user) {
      // Automatic passwordless registration
      // If the username contains "admin", grant admin role; otherwise normal user
      const role = cleanUsername.toLowerCase().includes("admin") ? "ADMIN" : "USER";
      const dummyPasswordHash = bcrypt.hashSync("passwordless-dummy-key-" + cleanUsername, 10);
      
      user = await User.create({
        username: cleanUsername,
        passwordHash: dummyPasswordHash,
        displayName: cleanUsername,
        role: role,
        rollsLeft: 50,
        totalRolls: 0,
        pityCounter: 0,
        lastRollRegenTime: new Date(),
      });
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
