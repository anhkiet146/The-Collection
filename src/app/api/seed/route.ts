import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User, Card, Mission, UserCard, UserMission } from "@/lib/models";
import bcrypt from "bcryptjs";
import seededCards from "@/lib/seeded-cards.json";
import seededMissions from "@/lib/seeded-missions.json";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Clear database
    await User.deleteMany({});
    await Card.deleteMany({});
    await Mission.deleteMany({});
    await UserCard.deleteMany({});
    await UserMission.deleteMany({});

    // 2. Create Admin Users
    const adminPasswordHash = bcrypt.hashSync("admin123", 10);
    await User.create({
      username: "admin",
      passwordHash: adminPasswordHash,
      displayName: "Quản Trị Viên",
      role: "ADMIN",
      rollsLeft: 100,
      totalRolls: 0,
      pityCounter: 0,
    });

    const admin2PasswordHash = bcrypt.hashSync("adminpassword123", 10);
    await User.create({
      username: "admin2",
      passwordHash: admin2PasswordHash,
      displayName: "Quản Trị Viên 2",
      role: "ADMIN",
      rollsLeft: 100,
      totalRolls: 0,
      pityCounter: 0,
    });

    // 3. Create Regular User
    const userPasswordHash = bcrypt.hashSync("user123", 10);
    await User.create({
      username: "user",
      passwordHash: userPasswordHash,
      displayName: "Người Chơi Gacha",
      role: "USER",
      rollsLeft: 15,
      totalRolls: 0,
      pityCounter: 0,
    });

    // 4. Create Standard Missions
    await Mission.insertMany(seededMissions);

    // 5. Create Seed Cards
    await Card.insertMany(seededCards);

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      users: {
        admin: "admin / admin123",
        admin2: "admin2 / adminpassword123",
        user: "user / user123",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
