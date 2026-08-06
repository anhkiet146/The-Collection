import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User, Card, Mission, UserCard, UserMission } from "@/lib/models";
import bcrypt from "bcryptjs";

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

    // 2. Create Admin User
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
    const missions = [
      {
        title: "Đăng nhập hàng ngày",
        description: "Đăng nhập vào hệ thống mỗi ngày để nhận lượt rút",
        type: "DAILY",
        target: 1,
        rewardRolls: 3,
        key: "daily_login",
      },
      {
        title: "Kẻ cuồng rút bài",
        description: "Rút bài 3 lần trong ngày",
        type: "DAILY",
        target: 3,
        rewardRolls: 5,
        key: "daily_roll_3",
      },
      {
        title: "Khoe bộ sưu tập",
        description: "Chia sẻ album của bạn với bạn bè",
        type: "DAILY",
        target: 1,
        rewardRolls: 2,
        key: "daily_share",
      },
      {
        title: "Nhà sưu tầm nghiệp dư",
        description: "Sưu tập được 20 thẻ bài khác nhau",
        type: "ACHIEVEMENT",
        target: 20,
        rewardRolls: 15,
        key: "collect_20",
      },
      {
        title: "Khoảnh khắc lịch sử",
        description: "Sở hữu thẻ Legendary đầu tiên",
        type: "ACHIEVEMENT",
        target: 1,
        rewardRolls: 10,
        key: "first_legendary",
      },
    ];
    await Mission.insertMany(missions);

    // 5. Create Seed Cards
    const cards = [
      {
        title: "Thỏ Ngọc Tinh Nghịch",
        imageUrl: "/api/uploads/rabbit.png",
        rarity: "COMMON",
        description: "Một chú thỏ đáng yêu chạy nhảy trên mặt trăng.",
        album: "3 Con Gà",
      },
      {
        title: "Sói Xám Cô Độc",
        imageUrl: "/api/uploads/wolf.png",
        rarity: "COMMON",
        description: "Kẻ săn mồi lặng lẽ dưới ánh trăng rằm.",
        album: "3 Con Gà",
      },
      {
        title: "Gà Con Hiếu Kỳ",
        imageUrl: "/api/uploads/chicken.png",
        rarity: "COMMON",
        description: "Mới nở và muốn khám phá toàn bộ thế giới bao la.",
        album: "3 Con Gà",
      },
      {
        title: "Kiếm Sĩ Tập Sự",
        imageUrl: "/api/uploads/swordsman.png",
        rarity: "RARE",
        description: "Rèn luyện chăm chỉ ngày đêm để bảo vệ vương quốc.",
        album: "Hội Báo Thủ",
      },
      {
        title: "Phù Thủy Học Việc",
        imageUrl: "/api/uploads/mage.png",
        rarity: "RARE",
        description: "Đôi khi phép thuật vẫn phát nổ ngoài ý muốn.",
        album: "Hội Báo Thủ",
      },
      {
        title: "Phượng Hoàng Lửa",
        imageUrl: "/api/uploads/phoenix.png",
        rarity: "EPIC",
        description: "Hồi sinh từ đống tro tàn với sức mạnh thiêu rụi mọi thứ.",
        album: "Dân Chơi Hệ Đỏ",
      },
      {
        title: "Chiến Binh Rồng Thép",
        imageUrl: "/api/uploads/dragon.png",
        rarity: "EPIC",
        description: "Mang bộ giáp rồng không thể phá hủy.",
        album: "Hội Báo Thủ",
      },
      {
        title: "Thần Sấm Zeus",
        imageUrl: "/api/uploads/zeus.png",
        rarity: "LEGENDARY",
        description: "Chúa tể đỉnh Olympus với lưỡi thiên lôi hủy diệt.",
        album: "Trùm Gacha",
      },
      {
        title: "Nữ Thần Athena",
        imageUrl: "/api/uploads/athena.png",
        rarity: "LEGENDARY",
        description: "Nữ thần chiến tranh chính nghĩa và trí tuệ vô song.",
        album: "Trùm Gacha",
      },
      {
        title: "Chúa Tể Hỗn Mang",
        imageUrl: "/api/uploads/chaos.png",
        rarity: "MYTHIC",
        description: "Sinh vật cổ đại thống trị bóng tối và sự hư vô.",
        album: "Dân Chơi Hệ Đỏ",
      },
      {
        title: "Tinh Vân Vô Cực",
        imageUrl: "/api/uploads/nebula.png",
        rarity: "SECRET",
        description: "Bí mật tối cao của vũ trụ, được kết tinh từ ngàn vì sao.",
        album: "Trùm Gacha",
      },
    ];
    await Card.insertMany(cards);

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      users: {
        admin: "admin / admin123",
        user: "user / user123",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
