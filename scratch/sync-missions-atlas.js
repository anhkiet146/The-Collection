const { MongoClient } = require('mongodb');
const seededMissions = require('../src/lib/seeded-missions.json');

const atlasUri = "mongodb://anhkiet:anhkiet123@ac-jmusal9-shard-00-00.jnsczo9.mongodb.net:27017,ac-jmusal9-shard-00-01.jnsczo9.mongodb.net:27017,ac-jmusal9-shard-00-02.jnsczo9.mongodb.net:27017/gacha?ssl=true&authSource=admin&retryWrites=true&w=majority";

async function sync() {
  const client = new MongoClient(atlasUri);
  try {
    console.log("1. Đang kết nối trực tiếp tới MongoDB Atlas...");
    await client.connect();
    const db = client.db();

    console.log("2. Đang làm sạch danh mục nhiệm vụ cũ trên Atlas...");
    await db.collection('missions').deleteMany({});

    console.log(`3. Đang đồng bộ ${seededMissions.length} nhiệm vụ mới lên Atlas...`);
    await db.collection('missions').insertMany(seededMissions);

    console.log("\n=============================================");
    console.log("🎉 ĐỒNG BỘ DANH MỤC NHIỆM VỤ LÊN ATLAS THÀNH CÔNG!");
    console.log("=============================================");
  } catch (err) {
    console.log("\n=============================================");
    console.log("❌ KẾT NỐI THẤT BẠI!");
    console.error("Chi tiết lỗi:", err.message);
    console.log("=============================================");
  } finally {
    await client.close();
  }
}
sync();
