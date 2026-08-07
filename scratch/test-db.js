const { MongoClient } = require("mongodb");

// DÁN CHUỖI KẾT NỐI MONGODB ATLAS CỦA BẠN VÀO ĐÂY ĐỂ KIỂM TRA
const uri =
  "mongodb+srv://anhkiet:anhkiet123@cluster0.jnsczo9.mongodb.net/gacha?retryWrites=true&w=majority";

console.log("Đang kiểm tra kết nối tới MongoDB Atlas...");
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("\n=============================================");
    console.log("🎉 KẾT NỐI THÀNH CÔNG!");
    console.log("Tài khoản và mật khẩu của bạn hoàn toàn chính xác.");
    console.log("=============================================");
    const dbs = await client.db().admin().listDatabases();
    console.log(
      "Danh sách Database hiện có:",
      dbs.databases.map((d) => d.name),
    );
  } catch (err) {
    console.log("\n=============================================");
    console.log("❌ KẾT NỐI THẤT BẠI!");
    console.log("Chi tiết lỗi:", err.message);
    console.log("=============================================");

    if (
      err.message.includes("Authentication failed") ||
      err.message.includes("auth failed")
    ) {
      console.log("\n👉 HƯỚNG DẪN KHẮC PHỤC:");
      console.log(
        "1. Hãy chắc chắn bạn đã vào mục 'Database Access' (Security) trên MongoDB Atlas và tạo một User.",
      );
      console.log(
        "2. Bạn có thể đã dùng mật khẩu đăng nhập tài khoản Atlas (email) thay vì mật khẩu Database User.",
      );
      console.log(
        "3. Đảm bảo bạn đã loại bỏ các dấu ngoặc nhọn '<' và '>' khỏi chuỗi kết nối.",
      );
      console.log("   - Sai:  mongodb+srv://anhkiet:<matkhau123>@...");
      console.log("   - Đúng: mongodb+srv://anhkiet:matkhau123@...");
      console.log(
        "4. Nếu mật khẩu Database User của bạn có chứa các ký tự đặc biệt như @, #, $, %, +, /, ... hãy đổi mật khẩu chỉ gồm CHỮ CÁI và CHỮ SỐ (ví dụ: anhkiet2026) rồi thử lại.",
      );
    } else if (
      err.message.includes("querySrv ENOTFOUND") ||
      err.message.includes("Server selection timed out")
    ) {
      console.log("\n👉 HƯỚNG DẪN KHẮC PHỤC:");
      console.log(
        "1. Kiểm tra lại tên miền cluster trong chuỗi kết nối xem có bị gõ sai chính tả không.",
      );
      console.log(
        "2. Đảm bảo bạn đã cấu hình IP Whitelist thành 0.0.0.0/0 (cho phép mọi IP truy cập) trong mục 'Network Access' trên Atlas.",
      );
    }
  } finally {
    await client.close();
  }
}

run();
