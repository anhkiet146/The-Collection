import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { connectToDatabase } from "./db";
import { User, IUser } from "./models";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-gacha-key-for-friends-group-12345";

export function signToken(payload: { userId: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<IUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    await connectToDatabase();
    const user = await User.findById(payload.userId);
    return user;
  } catch (error) {
    console.error("Session verification error:", error);
    return null;
  }
}
