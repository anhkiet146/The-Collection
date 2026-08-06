import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Mission, UserMission } from "@/lib/models";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Chưa đăng nhập" }, { status: 401 });
    }

    await connectToDatabase();

    const missions = await Mission.find({});
    
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    
    const dailyMissions = missions.filter((m) => m.type === "DAILY");
    const dailyIds = dailyMissions.map((m) => m._id);

    const oneDailyUserMission = await UserMission.findOne({
      userId: user._id,
      missionId: { $in: dailyIds },
    });

    let needReset = false;
    if (oneDailyUserMission) {
      const lastUpdate = new Date(oneDailyUserMission.lastUpdated);
      const lastUpdateStr = `${lastUpdate.getFullYear()}-${lastUpdate.getMonth()}-${lastUpdate.getDate()}`;
      if (todayStr !== lastUpdateStr) {
        needReset = true;
      }
    } else {
      needReset = true;
    }

    if (needReset) {
      for (const dm of dailyMissions) {
        let progress = 0;
        let completed = false;
        
        if (dm.key === "daily_login") {
          progress = 1;
          completed = true;
        }

        await UserMission.findOneAndUpdate(
          { userId: user._id, missionId: dm._id },
          {
            progress,
            completed,
            claimed: false,
            lastUpdated: new Date(),
          },
          { upsert: true }
        );
      }
    } else {
      const loginMission = dailyMissions.find((m) => m.key === "daily_login");
      if (loginMission) {
        await UserMission.findOneAndUpdate(
          { userId: user._id, missionId: loginMission._id },
          {
            $setOnInsert: {
              progress: 1,
              completed: true,
              claimed: false,
              lastUpdated: new Date(),
            },
          },
          { upsert: true }
        );
      }
    }

    const userMissions = await UserMission.find({ userId: user._id });
    const userMissionsMap = new Map(
      userMissions.map((um) => [um.missionId.toString(), um])
    );

    const formattedMissions = missions.map((m) => {
      const um = userMissionsMap.get(m._id.toString());
      return {
        id: m._id,
        title: m.title,
        description: m.description,
        type: m.type,
        target: m.target,
        rewardRolls: m.rewardRolls,
        key: m.key,
        progress: um ? um.progress : 0,
        completed: um ? um.completed : false,
        claimed: um ? um.claimed : false,
      };
    });

    return NextResponse.json({ success: true, missions: formattedMissions });
  } catch (error: any) {
    console.error("Missions API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
