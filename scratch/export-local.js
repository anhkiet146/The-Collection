const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const localUri = "mongodb://127.0.0.1:27017/gacha";

async function exportLocalData() {
  const client = new MongoClient(localUri);

  try {
    console.log("1. Đang kết nối tới MongoDB Localhost...");
    await client.connect();
    const db = client.db();

    // 1. Xuất thẻ bài (Cards)
    const cards = await db.collection('cards').find({}).toArray();
    console.log(`=> Tìm thấy ${cards.length} thẻ bài ở Localhost.`);

    // Làm sạch trường _id và ghi tệp
    const cleanCards = cards.map(c => {
      const { _id, createdAt, updatedAt, __v, ...data } = c;
      return data;
    });

    const cardsPath = path.join(__dirname, '../src/lib/seeded-cards.json');
    fs.writeFileSync(cardsPath, JSON.stringify(cleanCards, null, 2), 'utf8');
    console.log(`=> Đã ghi danh sách thẻ bài vào: src/lib/seeded-cards.json`);

    // 2. Xuất nhiệm vụ (Missions)
    const missions = await db.collection('missions').find({}).toArray();
    console.log(`=> Tìm thấy ${missions.length} nhiệm vụ ở Localhost.`);

    const cleanMissions = missions.map(m => {
      const { _id, createdAt, updatedAt, __v, ...data } = m;
      return data;
    });

    const missionsPath = path.join(__dirname, '../src/lib/seeded-missions.json');
    fs.writeFileSync(missionsPath, JSON.stringify(cleanMissions, null, 2), 'utf8');
    console.log(`=> Đã ghi danh sách nhiệm vụ vào: src/lib/seeded-missions.json`);

    console.log("\n=============================================");
    console.log("🎉 XUẤT DỮ LIỆU CỤC BỘ THÀNH CÔNG!");
    console.log("=============================================");

  } catch (error) {
    console.error("❌ Lỗi khi xuất dữ liệu:", error.message);
  } finally {
    await client.close();
  }
}

exportLocalData();
