const { MongoClient } = require('mongodb');

// Kết nối trực tiếp qua các Server Shard để bỏ qua phân giải SRV DNS
const atlasUri = "mongodb://anhkiet:anhkiet123@ac-jmusal9-shard-00-00.jnsczo9.mongodb.net:27017,ac-jmusal9-shard-00-01.jnsczo9.mongodb.net:27017,ac-jmusal9-shard-00-02.jnsczo9.mongodb.net:27017/gacha?ssl=true&authSource=admin&retryWrites=true&w=majority";
const localUri = "mongodb://127.0.0.1:27017/gacha";

async function run() {
  const localClient = new MongoClient(localUri);
  const atlasClient = new MongoClient(atlasUri);

  try {
    console.log("1. Đang kết nối tới MongoDB Localhost...");
    await localClient.connect();
    const localDb = localClient.db();

    console.log("2. Đang kết nối trực tiếp tới MongoDB Atlas (Bỏ qua DNS SRV)...");
    await atlasClient.connect();
    const atlasDb = atlasClient.db();

    const cards = await localDb.collection('cards').find({}).toArray();
    console.log(`=> Lấy thành công ${cards.length} thẻ từ Localhost.`);

    if (cards.length > 0) {
      console.log("3. Đang dọn dẹp các thẻ bài cũ trên Atlas...");
      await atlasDb.collection('cards').deleteMany({});
      
      console.log("4. Đang đồng bộ 58 thẻ bài lên Atlas...");
      await atlasDb.collection('cards').insertMany(cards);
      console.log("=> Đồng bộ thẻ bài thành công!");
    }

    const missions = await localDb.collection('missions').find({}).toArray();
    if (missions.length > 0) {
      console.log("5. Đang đồng bộ nhiệm vụ...");
      await atlasDb.collection('missions').deleteMany({});
      await atlasDb.collection('missions').insertMany(missions);
      console.log("=> Đồng bộ nhiệm vụ thành công!");
    }

    console.log("\n=============================================");
    console.log("🎉 ĐỒNG BỘ TRỰC TIẾP LÊN ATLAS THÀNH CÔNG!");
    console.log("=============================================");
  } catch (err) {
    console.log("\n=============================================");
    console.log("❌ KẾT NỐI THẤT BẠI!");
    console.error("Chi tiết lỗi:", err.message);
    console.log("=============================================");
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}
run();
