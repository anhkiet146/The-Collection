import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Card, UserCard } from "@/lib/models";
import { calculateRollRarity, RarityType } from "@/lib/gacha";
import { updateMissionProgress, updateCollectionAchievement } from "@/lib/missions";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { amount = 1 } = await req.json();
    if (amount !== 1 && amount !== 10) {
      return NextResponse.json({ success: false, error: "Số lượt rút không hợp lệ (chỉ rút 1 hoặc 10)" }, { status: 400 });
    }

    const isAdmin = user.role === "ADMIN";
    if (!isAdmin && user.rollsLeft < amount) {
      return NextResponse.json({ success: false, error: "Bạn không đủ lượt rút bài!" }, { status: 400 });
    }

    await connectToDatabase();

    const allCards = await Card.find({});
    if (allCards.length === 0) {
      return NextResponse.json({ success: false, error: "Hệ thống chưa có thẻ bài nào. Vui lòng liên hệ Admin!" }, { status: 500 });
    }

    const cardsByRarity: Record<string, any[]> = {
      COMMON: [],
      RARE: [],
      EPIC: [],
      LEGENDARY: [],
      MYTHIC: [],
      SECRET: [],
    };
    
    allCards.forEach((card) => {
      if (cardsByRarity[card.rarity]) {
        cardsByRarity[card.rarity].push(card);
      }
    });

    const pulledCards = [];
    let currentPity = user.pityCounter;
    let containsLegendaryOrBetter = false;
    let containsMythic = false;
    let containsSecret = false;
 
    for (let i = 0; i < amount; i++) {
      const roll = calculateRollRarity(currentPity);
      let rarityToUse: RarityType = roll.rarity;
      currentPity = roll.newPityCounter;
 
      let cardPool = cardsByRarity[rarityToUse];
      if (cardPool.length === 0) {
        const fallbackRarities: RarityType[] = ["COMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC", "SECRET"];
        for (const fallbackRarity of fallbackRarities) {
          if (cardsByRarity[fallbackRarity] && cardsByRarity[fallbackRarity].length > 0) {
            rarityToUse = fallbackRarity;
            cardPool = cardsByRarity[fallbackRarity];
            if (["LEGENDARY", "MYTHIC", "SECRET"].includes(fallbackRarity)) {
              currentPity = 0;
            }
            break;
          }
        }
      }
 
      if (cardPool.length === 0) {
        return NextResponse.json({ success: false, error: "Không tìm thấy thẻ bài hợp lệ để rút" }, { status: 500 });
      }
 
      const randomIndex = Math.floor(Math.random() * cardPool.length);
      const selectedCard = cardPool[randomIndex];
 
      pulledCards.push(selectedCard);
 
      if (["LEGENDARY", "MYTHIC", "SECRET"].includes(selectedCard.rarity)) {
        containsLegendaryOrBetter = true;
      }
      if (selectedCard.rarity === "MYTHIC") {
        containsMythic = true;
      }
      if (selectedCard.rarity === "SECRET") {
        containsSecret = true;
      }
 
      await UserCard.findOneAndUpdate(
        { userId: user._id, cardId: selectedCard._id },
        { $inc: { quantity: 1 } },
        { upsert: true, new: true }
      );
    }
 
    if (!isAdmin) {
      user.rollsLeft -= amount;
    }
    user.totalRolls += amount;
    user.pityCounter = currentPity;
    await user.save();
 
    await updateMissionProgress(user._id, "daily_roll_5", amount);
    await updateMissionProgress(user._id, "daily_roll_10", amount);
 
    if (containsLegendaryOrBetter) {
      await updateMissionProgress(user._id, "first_legendary", 1);
    }
    if (containsMythic) {
      await updateMissionProgress(user._id, "collect_mythic", 1);
    }
    if (containsSecret) {
      await updateMissionProgress(user._id, "collect_secret", 1);
    }
 
    await updateCollectionAchievement(user._id);

    return NextResponse.json({
      success: true,
      pulledCards,
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
    console.error("Gacha roll error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
