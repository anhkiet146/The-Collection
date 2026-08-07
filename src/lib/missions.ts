import { connectToDatabase } from "./db";
import { User, Mission, UserMission, UserCard } from "./models";
import mongoose from "mongoose";

export async function updateMissionProgress(
  userId: string | mongoose.Types.ObjectId,
  key: string,
  increment: number = 1,
  setAbsolute: number | null = null
) {
  try {
    await connectToDatabase();
    
    const mission = await Mission.findOne({ key });
    if (!mission) return;

    let userMission = await UserMission.findOne({ userId, missionId: mission._id });
    if (!userMission) {
      userMission = new UserMission({
        userId,
        missionId: mission._id,
        progress: 0,
        completed: false,
        claimed: false,
      });
    }

    if (userMission.claimed) return;

    if (setAbsolute !== null) {
      userMission.progress = setAbsolute;
    } else {
      userMission.progress += increment;
    }

    if (userMission.progress >= mission.target) {
      userMission.progress = mission.target;
      userMission.completed = true;
    }

    userMission.lastUpdated = new Date();
    await userMission.save();
  } catch (error) {
    console.error(`Error updating mission progress for ${key}:`, error);
  }
}

export async function updateCollectionAchievement(userId: string | mongoose.Types.ObjectId) {
  try {
    await connectToDatabase();
    const distinctCount = await UserCard.countDocuments({ userId, quantity: { $gt: 0 } });
    await updateMissionProgress(userId, "collect_20", 0, distinctCount);
    await updateMissionProgress(userId, "collect_40", 0, distinctCount);
  } catch (error) {
    console.error("Error updating collection achievement:", error);
  }
}
