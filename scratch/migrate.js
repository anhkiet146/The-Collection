const { MongoClient } = require('mongodb');

const localUri = "mongodb://127.0.0.1:27017/gacha";
const atlasUri = "mongodb+srv://anhkiet:anhkiet123@cluster0.jnsczo9.mongodb.net/gacha?retryWrites=true&w=majority";

async function migrate() {
  const localClient = new MongoClient(localUri);
  const atlasClient = new MongoClient(atlasUri);

  try {
    console.log("1. Đang kết nối tới MongoDB Localhost...");
    await localClient.connect();
    const localDb = localClient.db();
    
    console.log("2. Đang kết nối tới MongoDB Atlas (Cloud)...");
    await atlasClient.connect();
    const atlasDb = atlasClient.db();

    // 1. Di chuyển Thẻ Bài (Cards)
    const localCards = await localDb.collection('cards').find({}).toArray();
    console.log(`=> Tìm thấy ${localCards.length} thẻ bài ở Localhost.`);

    if (localCards.length === 0) {
      console.log("Không có thẻ bài nào ở Local để di chuyển.");
    } else {
      console.log("3. Đang dọn dẹp các thẻ bài cũ trên Atlas...");
      await atlasDb.collection('cards').deleteMany({});

      console.log("4. Đang sao chép thẻ bài lên Atlas...");
      const result = await atlasDb.collection('cards').insertMany(localCards);
      console.log(`=> Đã sao chép thành công ${result.insertedCount} thẻ bài lên MongoDB Atlas!`);
    }

    // 2. Di chuyển Nhiệm vụ (Missions)
    const localMissions = await localDb.collection('missions').find({}).toArray();
    if (localMissions.length > 0) {
      console.log(`\n=> Tìm thấy ${localMissions.length} nhiệm vụ ở Localhost. Đang sao chép...`);
      await atlasDb.collection('missions').deleteMany({});
      await atlasDb.collection('missions').insertMany(localMissions);
      console.log("=> Đã sao chép thành công nhiệm vụ lên MongoDB Atlas!");
    }

    console.log("\n=============================================");
    console.log("🎉 ĐỒNG BỘ DỮ LIỆU THÀNH CÔNG!");
    console.log("Bây giờ bạn có thể F5 trang Vercel để kiểm tra các thẻ bài của mình.");
    console.log("=============================================");

  } catch (error) {
    console.log("\n❌ LỖI KHI ĐỒNG BỘ DỮ LIỆU!");
    console.error("Chi tiết lỗi:", error.message);
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}

migrate();
