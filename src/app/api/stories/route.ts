import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Story, Chapter } from "@/lib/models";
import { getSessionUser } from "@/lib/auth";
import { normalizeStoryFields, normalizeStoryText } from "@/lib/story-text";

// Default seed story if collection is empty
const defaultStory = {
  title: "Huyền Thoại Thẻ Bài: Thức Tỉnh Đại Lục",
  author: "Kỳ Ảo Các",
  category: "Huyền Huyễn",
  status: "ONGOING",
  coverImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
  description: "Tại đại lục Aethelgard cổ xưa, những thẻ bài ma thuật không chỉ là vật phẩm sưu tập mà chứa đựng linh hồn của các vị thần và quái thú thời thượng cổ. Cậu thiếu niên Lạc Phong vô tình khai mở một tấm thẻ rỉ sét mang cấp độ Secret, từ đó bước chân vào con đường nghịch thiên cải mệnh, tìm kiếm bí mật đằng sau nguồn gốc của vạn vật.",
};

const defaultChapters = [
  {
    chapterNumber: 1,
    title: "Chương 1: Tấm Thẻ Rỉ Sét Nơi Phế Tích",
    content: `Đại lục Aethelgard trải dài muôn dặm, nơi đây tôn sùng ma pháp thẻ bài như một biểu tượng tối cao của quyền lực. Mỗi một con người khi tròn mười sáu tuổi đều phải trải qua nghi thức Thức Tỉnh, dùng linh hồn câu thông với thiên địa để ngưng tụ ra tấm thẻ bổn mệnh đầu tiên.

Gió lạnh rít gào qua những bức tường đổ nát của phế tích Lạc Hà. Lạc Phong siết chặt tấm áo choàng mỏng manh, ánh mắt chăm chú nhìn vào chiếc hòm đá phủ đầy rêu phong trước mặt. Hắn là một thiếu niên mồ côi sinh sống tại trấn biên thùy, trong khi những đồng trang lứa đều may mắn thức tỉnh thẻ bài cấp Rare thậm chí Epic, thì thức hải của hắn lại trống rỗng như một đầm lầy chết.

"Nếu lần này vẫn không tìm thấy gì, có lẽ số phận ta định sẵn chỉ là một kẻ phàm nhân..." Lạc Phong thở dài, vươn bàn tay thô ráp gạt đi lớp bụi dày hàng trăm năm trên nắp hòm.

Một tiếng "cạch" khô khốc vang lên. Bên trong không có vàng bạc châu báu, cũng chẳng có linh đan diệu dược, mà chỉ có duy nhất một tấm kim loại hình chữ nhật đã rỉ sét loang lổ. 

Khi ngón tay Lạc Phong vừa chạm vào bề mặt gồ ghề của nó, một luồng xung điện kỳ lạ bất chợt bùng nổ! Không gian xung quanh dường như ngưng đọng lại trong khoảnh khắc. Những đường hoa văn màu tím hoàng kim bắt đầu rực sáng, len lỏi qua từng vết rỉ sét, tựa như một con rồng lửa đang thức giấc sau giấc ngủ ngàn năm.

Một thanh âm uy nghiêm, vang vọng từ tận đáy linh hồn hắn:
"Kẻ hữu duyên... Ngươi đã sẵn sàng gánh vác định mệnh của Thần Bài chưa?"`,
  },
  {
    chapterNumber: 2,
    title: "Chương 2: Sức Mạnh Bí Ẩn Xuất Hiện",
    content: `Cơn đau nhức nhối như muốn xé toạc thức hải của Lạc Phong. Luồng quang mang màu tím không ngừng lưu chuyển, thấm sâu vào từng kinh mạch và hòa quyện với dòng máu đang cuồn cuộn chảy trong cơ thể hắn.

Tấm thẻ rỉ sét trong tay dần lột xác. Lớp vỏ kim loại hoen ố vỡ vụn từng mảnh, để lộ ra một thân thẻ lấp lánh như được rèn từ tinh tú trên trời cao. Trên viền thẻ, những dải sáng bảy màu luân chuyển không ngừng, tản mát ra một áp lực nghẹt thở.

"Đây là... Secret? Thẻ bài cấp bậc cấm kỵ trong truyền thuyết?!"

Lạc Phong run rẩy đọc từng dòng chữ cổ xưa hiện lên bề mặt thẻ bài:
[Bổn Mệnh Thần Bài: Vô Tận Tinh Thần]
[Phẩm cấp: Cấp độ Thần Thoại - Secret]
[Năng lực: Có thể dung hợp và tinh luyện mọi quy tắc thẻ bài trong thiên hạ, nhìn thấu tỉ lệ xuất hiện của các kỳ trân dị bảo.]

Chưa kịp để hắn định thần, từ phía bìa rừng xa xa bỗng vang lên những tiếng gầm rú dữ dội. Một đàn Huyết Lang mắt đỏ ngầu đang đánh hơi thấy mùi linh lực tinh thuần toát ra từ phế tích. Chúng nhe những chiếc răng nanh sắc nhọn, từng bước áp sát thiếu niên.

Nếu là trước đây, đối mặt với ma thú cấp thấp này, Lạc Phong chỉ có con đường bỏ mạng. Nhưng giờ phút này, nhìn tấm thẻ bài đang phát ra ánh hào quang chói lọi trong lòng bàn tay, trong mắt thiếu niên bỗng bừng lên ngọn lửa kiên định chưa từng có.

"Muốn coi ta là con mồi sao? Hãy để ta thử xem uy lực của thần bài rốt cuộc mạnh đến nhường nào!"`,
  },
  {
    chapterNumber: 3,
    title: "Chương 3: Bước Chân Ra Thế Giới Rộng Lớn",
    content: `Trận chiến kết thúc nhanh chóng hơn bất kỳ ai có thể tưởng tượng. Chỉ với một ý niệm câu thông của Lạc Phong, luồng kiếm khí tinh tú phát ra từ tấm thẻ bài đã quét sạch bầy sói dữ, biến mối hiểm nguy chí mạng thành mây khói trong chớp mắt.

Nhìn bãi chiến trường hoang tàn, Lạc Phong ngồi thụp xuống thở dốc. Đây là lần đầu tiên trong đời hắn cảm nhận được sức mạnh chân chính. Không còn là sự tự ti, không còn là những ánh mắt coi thường từ những kẻ quý tộc trong thị trấn.

"Thế giới này rộng lớn vô biên, có cửu đại đế quốc, vô số tông môn thánh địa thẻ bài hùng mạnh. Tấm thẻ này là phúc duyên tột cùng, nhưng cũng có thể mang lại tai họa ngập đầu nếu bị những cường giả biết được."

Lạc Phong hiểu rõ đạo lý "ôm ngọc có tội". Hắn cẩn thận thu liễm khí tức của thẻ bài, giấu nó sâu trong tầng không gian bí mật của thức hải. 

Ánh bình minh từ phương đông bắt đầu ló rạng, dát vàng lên phế tích hoang tàn. Hắn thu dọn hành trang đơn sơ, quay đầu nhìn lại thị trấn nhỏ nơi mình đã gắn bó suốt mười sáu năm qua lần cuối, rồi cất bước hướng về phía đế đô phồn hoa ngút ngàn.

Cuộc hành trình vĩ đại của người nắm giữ Thần Thẻ huyền thoại chính thức mở ra từ đây.`,
  },
];

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Auto-seed if empty
    const count = await Story.countDocuments();
    if (count === 0) {
      const createdStory = await Story.create({
        ...defaultStory,
        totalChapters: defaultChapters.length,
      });

      for (const ch of defaultChapters) {
        const words = ch.content.trim().split(/\s+/).length;
        await Chapter.create({
          storyId: createdStory._id,
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          content: ch.content,
          wordCount: words,
        });
      }
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";

    const query: any = {};
    if (search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { author: { $regex: search.trim(), $options: "i" } },
      ];
    }
    if (category && category !== "ALL") {
      query.category = category;
    }
    if (status && status !== "ALL") {
      query.status = status;
    }

    const stories = await Story.find(query).sort({ updatedAt: -1 }).lean();

    return NextResponse.json({ success: true, stories: stories.map(normalizeStoryFields) });
  } catch (error: any) {
    console.error("GET /api/stories error:", error);
    return NextResponse.json({ success: false, error: "Lỗi tải danh sách truyện" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Bạn không có quyền thực hiện thao tác này" }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { title, author, description, coverImage, category, status } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Vui lòng nhập tên truyện" }, { status: 400 });
    }

    const newStory = await Story.create({
      title: normalizeStoryText(title.trim()),
      author: normalizeStoryText(author?.trim() || user.displayName || "Admin"),
      description: normalizeStoryText(description?.trim() || ""),
      coverImage: coverImage?.trim() || "",
      category: category?.trim() || "Huyền Huyễn",
      status: status === "COMPLETED" ? "COMPLETED" : "ONGOING",
      views: 0,
      totalChapters: 0,
    });

    return NextResponse.json({ success: true, story: newStory, message: "Tạo truyện thành công" });
  } catch (error: any) {
    console.error("POST /api/stories error:", error);
    return NextResponse.json({ success: false, error: "Lỗi tạo truyện mới" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Bạn không có quyền thực hiện thao tác này" }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { id, title, author, description, coverImage, category, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID truyện" }, { status: 400 });
    }

    const updatedStory = await Story.findByIdAndUpdate(
      id,
      {
        title: title == null ? undefined : normalizeStoryText(title.trim()),
        author: author == null ? undefined : normalizeStoryText(author.trim()),
        description: description == null ? undefined : normalizeStoryText(description.trim()),
        coverImage: coverImage?.trim(),
        category: category?.trim(),
        status: status === "COMPLETED" ? "COMPLETED" : "ONGOING",
      },
      { new: true }
    );

    if (!updatedStory) {
      return NextResponse.json({ success: false, error: "Không tìm thấy truyện" }, { status: 404 });
    }

    return NextResponse.json({ success: true, story: updatedStory, message: "Cập nhật truyện thành công" });
  } catch (error: any) {
    console.error("PUT /api/stories error:", error);
    return NextResponse.json({ success: false, error: "Lỗi cập nhật truyện" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Bạn không có quyền thực hiện thao tác này" }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID truyện" }, { status: 400 });
    }

    await Story.findByIdAndDelete(id);
    await Chapter.deleteMany({ storyId: id });

    return NextResponse.json({ success: true, message: "Xóa truyện và các chương thành công" });
  } catch (error: any) {
    console.error("DELETE /api/stories error:", error);
    return NextResponse.json({ success: false, error: "Lỗi xóa truyện" }, { status: 500 });
  }
}
