# AirSlate — Bảng Vẽ & Chuột Cảm Ứng Không Dây (PC & Phone Cross-Device Workspace)

Ứng dụng web thời gian thực giúp biến điện thoại thông minh thành bảng vẽ/viết kỹ thuật số (graphics tablet) hỗ trợ cảm ứng lực, bàn rê chuột đa điểm (trackpad) và bộ điều khiển lật trang PDF từ xa cho máy tính với độ trễ siêu thấp thông qua mạng nội bộ (WebRTC DataChannel & WebSocket relay).

## User Review & Critical Decisions

> [!IMPORTANT]
> Dựa trên phản hồi từ bước khảo sát, hệ thống được thiết lập theo các quyết định trọng tâm sau:

- **Confirmed Decision 1 (Phương thức kết nối)**: Kết nối tức thì bằng mã QR code hiển thị trên máy tính hoặc nhập mã PIN 6 số tiện lợi, tự động thiết lập kênh truyền dữ liệu siêu tốc P2P qua mạng nội bộ.
- **Confirmed Decision 2 (Giao diện hiển thị PC)**: Chế độ bảng vẽ vô cực toàn màn hình (Full-screen Infinite Whiteboard) tích hợp chế độ chuột ảo (Virtual Laser Pointer / Crosshair Cursor) và khay đọc/lướt trang tài liệu PDF / Slides.
- **Confirmed Decision 3 (Trải nghiệm bảng vẽ trên điện thoại)**: Tập trung tối đa vào bảng vẽ di động với khả năng nhận diện cảm ứng lực (Touch / Stylus Pressure), nét vẽ mượt mà chống rung (Smooth Bezier Spline), thanh công cụ đổi màu, độ dày nét và nút tẩy xóa / hoàn tác thao tác một chạm nhanh chóng ngay tầm ngón tay cái.

---

## 1. Overview & Core Concept

- **What It Does**: 
  - **Màn hình Máy tính (Receiver / Host Display)**: Hiển thị bảng vẽ tương tác toàn màn hình, tiếp nhận nét vẽ từ điện thoại với độ trễ cực thấp (<16ms 60fps), hiển thị con trỏ chuột ảo / tia laser trình chiếu theo thời gian thực, đồng thời cho phép tải lên và trình chiếu tài liệu PDF để vẽ chú thích trực tiếp lên trang tài liệu.
  - **Màn hình Điện thoại (Transmitter / Digital Stylus & Trackpad)**: Đóng vai trò là một bảng vẽ chuyên nghiệp (tương tự Wacom). Hỗ trợ chế độ **Bút vẽ cảm ứng lực** (với thước đo độ dày theo lực nhấn, bút highlight, tẩy xóa) và chế độ **Bàn di chuột Trackpad** (di chuột, nhấp chạm, cuộn trang 2 ngón, lật trang PDF).
- **Target Audience / Persona**: Giáo viên, giảng viên trực tuyến, học sinh, thuyết trình viên, lập trình viên và nhà thiết kế cần bảng viết vẽ tay hoặc chuột điều khiển từ xa mà không cần mua thiết bị phần cứng đắt tiền.
- **Key Value**: Không cần cài đặt phần mềm phức tạp (chạy 100% trên trình duyệt web), kết nối không dây nội bộ tức thì qua QR Code, tối ưu độ mượt của nét chữ và thao tác di chuột.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Khởi tạo kết nối (Pairing Flow)**:
   - Người dùng mở ứng dụng trên Máy tính: Ứng dụng tự động tạo mã phòng 6 số cùng mã QR Code rõ nét kèm đường dẫn truy cập nhanh.
   - Người dùng mở camera hoặc trình duyệt điện thoại quét mã QR (hoặc nhập 6 số): Điện thoại tự động bắt tay qua WebRTC DataChannel (kèm dự phòng WebSocket nội bộ).
   - Màn hình máy tính phát tín hiệu xác nhận kết nối thành công với hiệu ứng êm dịu, chuyển ngay sang không gian làm việc.

2. **Chế độ Viết / Vẽ Chuyên Nghiệp (Stylus & Drawing Mode)**:
   - Trên điện thoại: Toàn bộ màn hình trở thành bề mặt số hóa (Digitizer Pad) với tỷ lệ khung hình đồng bộ màn hình PC. Hỗ trợ thao tác chạm ngón tay hoặc bút cảm ứng (Apple Pencil, Samsung S-Pen, bút Stylus phổ thông).
   - Thanh công cụ ngón tay cái ở cạnh dưới: Chuyển nhanh giữa Bút mực (Pen), Bút dạ quang (Highlighter), Tẩy (Eraser), Chọn màu (Black, Red, Blue, Emerald, White), Độ dày nét và nút Xóa toàn bộ / Undo.
   - Nét vẽ trên PC xuất hiện đồng thời theo thời gian thực với giải thuật làm mượt nét đường cong Bezier.

3. **Chế độ Chuột & Trình Chiếu / PDF (Trackpad & Presentation Mode)**:
   - Trên điện thoại: Bề mặt chuyển thành bàn rê chuột mịn màng: rê ngón tay để di chuyển con trỏ laser trên PC, chạm 1 ngón để click, rê 2 ngón để cuộn trang.
   - Thanh điều hướng PDF: Nút chuyển trang Trước / Sau (Previous / Next Page), hiển thị chỉ số trang hiện tại (ví dụ: Trang 3 / 12) và nút phóng to thu nhỏ.
   - Trên máy tính: Tài liệu PDF hoặc trang thuyết trình được mở ra, người dùng vừa điều khiển trang từ điện thoại vừa có thể khoanh vùng nhấn mạnh bằng bút vẽ.

### Visual Identity & Theme

- **Aesthetic Direction**: Phong cách công cụ năng suất chuyên nghiệp (Sleek Modern Studio Workspace), giao diện tối giản hiện đại với chế độ Dark Mode mặc định cho màn hình máy tính giúp nổi bật tài liệu và nét vẽ, kết hợp tông màu Slate/Zinc thanh lịch.
- **Color Palette**:
  - Nền máy tính: Canvas Slate tối (`#090d16` / `#0f172a`) với lưới điểm nhẹ chống mỏi mắt.
  - Nền điện thoại: Mềm mại, tương phản cao để ngón tay dễ định vị khu vực vẽ (`#0f172a` và vùng vẽ `#1e293b`).
  - Điểm nhấn hành động: Xanh Electric Indigo (`#6366f1`) và Cyan phát quang (`#06b6d4`) cho con trỏ laser và đường kết nối.
  - Bảng màu bút: Đen/Trắng, Đỏ tươi (`#ef4444`), Xanh dương (`#3b82f6`), Xanh lá (`#10b981`), Vàng chanh dạ quang (`#facc15`).
- **Typography & Ergonomics**:
  - Phông chữ hiển thị: *Plus Jakarta Sans* kết hợp *DM Sans* cho chữ số trang và nhãn công cụ rõ ràng.
  - Công thái học điện thoại tuân thủ vùng với ngón tay cái: Toàn bộ nút công cụ có chiều cao tối thiểu 48px, cách mép dưới vừa tầm tay cầm một tay.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Kênh truyền thông tin thời gian thực kép (WebRTC DataChannel + WebSocket Relay)**:
  - *Chosen Approach*: Sử dụng WebRTC DataChannel truyền tải gói tin UDP nhị phân/JSON trực tiếp P2P giữa hai trình duyệt trong mạng LAN để có độ trễ cực thấp (<15ms). WebSocket gắn liền máy chủ Express đóng vai trò thiết lập báo hiệu (Signaling) và kênh dự phòng tức thì nếu mạng chặn WebRTC.
  - *Why*: Thao tác viết chữ và di chuột đòi hỏi độ trễ gần như zero. Nếu truyền qua server trung gian xa xôi sẽ bị giật khựng; WebRTC DataChannel nội bộ cho cảm giác mượt như cắm dây.
  - *Alternatives Considered*: Chỉ dùng WebSocket truyền thống (dễ bị tăng độ trễ khi băng thông mạng chập chờn).
- **Decision 2: Giải thuật làm mượt nét vẽ và xử lý áp lực (Stroke Smoothing & Pressure Curve)**:
  - *Chosen Approach*: Tích hợp giải thuật nội suy đường cong Bezier bậc hai (Quadratic Bézier Spline) kết hợp đọc thuộc tính `PointerEvent.pressure` (nếu thiết bị hỗ trợ cảm ứng lực, tự động điều biến bán kính nét từ 0.5x đến 2x).
  - *Why*: Khi viết trên màn hình cảm ứng điện thoại, tốc độ lấy mẫu chạm thường tạo ra nét vẽ góc cạnh; giải thuật nội suy giúp chữ viết tay uyển chuyển tự nhiên như viết trên giấy thật.
- **Decision 3: Xử lý hiển thị tài liệu PDF trực tiếp trên Canvas**:
  - *Chosen Approach*: Tích hợp trình xem tài liệu và PDF thông minh kết hợp tính năng vẽ phủ lớp (Overlay Annotation Canvas). Cho phép kéo thả tệp PDF trực tiếp từ máy tính, đồng thời tích hợp sẵn tài liệu mẫu để dùng ngay lập tức.
  - *Why*: Người dùng có thể giảng bài, họp đồ án hoặc duyệt tài liệu ngay tức khắc mà không cần cài thêm phần mềm thứ 3.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PHONE (TRANSMITTER)                             │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │ Touch / Stylus Pad    │  │ Thumb Tool Dock                       │  │
│  │ (Pointer Events,      │  │ • Mode: Pen / Trackpad / PDF Remote   │  │
│  │ Pressure, Coordinates)│  │ • Tools: Colors, Size, Eraser, Clear  │  │
│  └───────────┬───────────┘  └──────────────────┬────────────────────┘  │
│              │                                 │                       │
│              ▼                                 ▼                       │
│     ┌──────────────────────────────────────────────────────────┐       │
│     │   Event Dispatcher (Throttle & Normalize 0.0 -> 1.0)     │       │
│     └──────────────────────────┬───────────────────────────────┘       │
└────────────────────────────────┼───────────────────────────────────────┘
                                 │
           ┌─────────────────────┴─────────────────────┐
           │                                           │
           │  [LAN / Local Peer Connection]            │
           ▼ (Ultra-low latency <15ms)                 ▼ (Signaling / Backup)
    ┌───────────────┐                           ┌───────────────┐
    │ WebRTC DataCh │                           │ WebSocket /   │
    │ (P2P Packets) │                           │ Express API   │
    └───────┬───────┘                           └───────┬───────┘
            │                                           │
            └─────────────────────┬─────────────────────┘
                                  │
┌─────────────────────────────────┼──────────────────────────────────────┐
│                                 ▼                                      │
│                         PC (HOST RECEIVER)                             │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ QR Code & PIN Pairing Hub (Auto room generation)                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │ PDF / Document Viewer   │  │ Real-time Annotation & Mouse Layer  │  │
│  │ • PDF Render Canvas     │  │ • Quadratic Bezier Stroke Engine    │  │
│  │ • Slide / Page Stepper  │  │ • Virtual Mouse / Laser Dot Pointer │  │
│  └─────────────────────────┘  └─────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Workspace Toolbar (Export PNG/PDF, Clear, Fullscreen, Grid Mode) │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Protocol & Message Payloads

- `stroke:start` `{ id, x, y, pressure, color, size, tool }` (Tọa độ chuẩn hóa `0.0` - `1.0` độc lập độ phân giải)
- `stroke:move` `{ id, x, y, pressure }` (Dòng điểm liên tục 60fps)
- `stroke:end` `{ id }`
- `mouse:move` `{ dx, dy, x, y }` (Di chuyển con trỏ chuột ảo trên PC)
- `mouse:click` `{ type: 'left' | 'right' }`
- `pdf:page` `{ direction: 'next' | 'prev' | 'goto', pageNumber }`
- `canvas:clear` `{}`
- `canvas:undo` `{}`

### Key Interactive Components

1. **Host Pairing View (`HostPairing.tsx`)**: Tạo phòng, hiển thị mã PIN to rõ, mã QR tương tác, hiển thị trạng thái kết nối máy tính - điện thoại.
2. **Host Canvas & PDF Presenter (`HostWorkspace.tsx`)**: Bảng vẽ canvas phản hồi mượt mà, bộ đọc PDF tích hợp, con trỏ laser phát sáng, thanh công cụ xuất ảnh và điều khiển trang.
3. **Phone Mobile Controller (`PhoneController.tsx`)**:
   - Vùng bàn vẽ cảm ứng đa điểm hỗ trợ bút stylus và cảm ứng ngón tay.
   - Bộ chọn công cụ ngón tay cái (Pen, Eraser, Highlighter, Trackpad mode).
   - Nút lật trang tài liệu và điều khiển nhanh.
4. **Signaling & State Engine (`usePeerConnection.ts`)**: Tự động chuyển đổi giữa WebRTC DataChannel tốc độ cao và WebSocket nội bộ để luôn duy trì kết nối liền mạch.
