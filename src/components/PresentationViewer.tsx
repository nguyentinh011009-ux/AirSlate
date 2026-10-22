import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Upload, FileText, CheckCircle2 } from 'lucide-react';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  content: {
    heading: string;
    description: string;
    points: string[];
    diagramLabel?: string;
  };
}

const DEFAULT_SLIDES: Slide[] = [
  {
    id: 1,
    title: 'Kiến Trúc AirSlate: Bảng Vẽ Không Dây',
    subtitle: 'Giải pháp biến smartphone thành Graphics Tablet độ trễ siêu thấp',
    badge: 'Slide 01 · Giới Thiệu Tổng Quan',
    content: {
      heading: 'Truyền tải tọa độ & cảm ứng lực theo thời gian thực',
      description: 'Hệ thống kết hợp WebRTC DataChannel (kênh trực tiếp P2P <15ms) và WebSocket relay thông qua mạng nội bộ LAN, cho phép thao tác mượt như cắm dây cáp.',
      points: [
        'Hỗ trợ bút cảm ứng (Apple Pencil, S-Pen) và cảm ứng ngón tay',
        'Giải thuật làm mượt nét đường cong Quadratic Bézier Spline chống rung',
        'Tích hợp 3 chế độ: Viết/Vẽ tay, Chuột đa điểm Trackpad, Điều khiển PDF từ xa',
      ],
      diagramLabel: 'Tốc độ phản hồi đạt chuẩn 60 FPS mượt mà',
    },
  },
  {
    id: 2,
    title: 'Công Nghệ Cảm Ứng Lực & Phân Tích Áp Suất',
    subtitle: 'Mô phỏng lực nhấn bút tự nhiên và độ đậm nhạt như viết giấy thật',
    badge: 'Slide 02 · Công Nghệ Cảm Ứng',
    content: {
      heading: 'Điều biến bán kính nét vẽ theo độ nhấn và vận tốc vuốt',
      description: 'Đọc dữ liệu PointerEvent.pressure từ màn hình cảm ứng, kết hợp đường cong tốc độ vuốt ngón tay để tạo hiệu ứng thư pháp uyển chuyển.',
      points: [
        'Lực nhấn nhẹ: Nét vẽ thanh mảnh, sắc nét, lý tưởng cho ghi chú nhỏ',
        'Lực nhấn mạnh: Tự động bung nở độ dày nét gấp 2.5 lần',
        'Bút dạ quang (Highlighter) bán trong suốt hỗ trợ highlight tài liệu',
      ],
      diagramLabel: 'Chuẩn hóa tọa độ 0.0 – 1.0 tương thích mọi tỷ lệ màn hình',
    },
  },
  {
    id: 3,
    title: 'Chế Độ Bàn Rê Chuột Trackpad & Laser Pointer',
    subtitle: 'Điều hướng máy tính từ xa và thu hút sự chú ý người nghe khi thuyết trình',
    badge: 'Slide 03 · Điều Khiển Thuyết Trình',
    content: {
      heading: 'Rê chuột, nhấp chạm và điểm laser ảo phát sáng',
      description: 'Chỉ cần một cú chạm ngón tay trên điện thoại để kích hoạt con trỏ laser rực rỡ trên màn hình lớn của máy tính.',
      points: [
        'Di chuyển con trỏ mượt mà với gia tốc tương tự trackpad laptop',
        'Hỗ trợ phím chuột trái, chuột phải chuyên dụng',
        'Lật trang PDF tức thì chỉ với một chạm ngón tay cái',
      ],
      diagramLabel: 'Thu hút sự tập trung vào các điểm mấu chốt trên tài liệu',
    },
  },
  {
    id: 4,
    title: 'Quy Trình Giảng Dạy & Làm Việc Đa Năng',
    subtitle: 'Ứng dụng thực tiễn trong giảng dạy trực tuyến và hội thảo',
    badge: 'Slide 04 · Ứng Dụng Thực Tế',
    content: {
      heading: 'Dễ dàng ghi chú giải bài tập hoặc phác thảo ý tưởng nhanh',
      description: 'Giảng viên và diễn giả không cần đứng cạnh bàn máy tính, có thể tự do di chuyển trong phòng và viết vẽ trực tiếp lên bài giảng.',
      points: [
        'Kéo thả tài liệu PDF hoặc bài trình chiếu của riêng bạn',
        'Vẽ chú thích trực tiếp lên trang tài liệu và lưu lại ảnh chất lượng cao',
        'Không cần cài đặt ứng dụng native, hoạt động hoàn toàn trên trình duyệt',
      ],
      diagramLabel: 'Xuất file ghi chú bài học chất lượng cao chỉ với 1 click',
    },
  },
];

interface PresentationViewerProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (direction: 'next' | 'prev') => void;
  onCustomUpload?: (pageCount: number, title: string) => void;
}

export function PresentationViewer({
  currentPage,
  totalPages,
  onPageChange,
  onCustomUpload,
}: PresentationViewerProps) {
  const [customSlides, setCustomSlides] = useState<string[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSlideData = DEFAULT_SLIDES[Math.min(currentPage - 1, DEFAULT_SLIDES.length - 1)];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomSlides([event.target.result as string]);
          onCustomUpload?.(1, file.name);
        }
      };
      reader.readAsDataURL(file);
    } else {
      // PDF or doc notice: sets title
      onCustomUpload?.(4, file.name);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Header of the Presentation Slide */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            {currentSlideData?.badge || `Trang ${currentPage} / ${totalPages}`}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            {currentSlideData?.title || `Tài liệu trình chiếu - Trang ${currentPage}`}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {currentSlideData?.subtitle || 'Bạn có thể dùng điện thoại để viết/vẽ chú thích trực tiếp lên trang này'}
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          title="Tải lên tài liệu PDF hoặc hình ảnh slide của bạn"
        >
          <Upload className="w-3.5 h-3.5 text-indigo-400" />
          <span>Tải tệp PDF / Ảnh</span>
        </button>
      </div>

      {/* Main Slide Content Area */}
      <div className="my-auto py-6">
        {customSlides && customSlides[currentPage - 1] ? (
          <div className="w-full flex items-center justify-center">
            <img
              src={customSlides[currentPage - 1]}
              alt={`Trang ${currentPage}`}
              className="max-h-[60vh] object-contain rounded-xl shadow-lg border border-slate-800"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7 space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold text-slate-100">
                {currentSlideData?.content.heading}
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {currentSlideData?.content.description}
              </p>

              <div className="space-y-2.5 pt-2">
                {currentSlideData?.content.points.map((pt, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-200">{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Box Diagram */}
            <div className="md:col-span-5 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 flex flex-col justify-center shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Chế độ ghi chú trực tiếp</h4>
                  <p className="text-xs text-slate-400">Vẽ bằng điện thoại đè lên trang này</p>
                </div>
              </div>

              <div className="space-y-3 py-3 border-y border-slate-800 text-xs text-slate-300">
                <div className="flex justify-between items-center">
                  <span>Trạng thái trang:</span>
                  <span className="font-mono text-indigo-400 font-semibold">{currentPage} / {totalPages}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Độ trễ tín hiệu:</span>
                  <span className="font-mono text-emerald-400 font-semibold">&lt; 15 ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Khử rung nét vẽ:</span>
                  <span className="font-semibold text-slate-200">Bézier Spline 60fps</span>
                </div>
              </div>

              <div className="mt-4 text-center">
                <span className="text-xs text-indigo-300 font-medium bg-indigo-950/60 border border-indigo-800/40 px-3 py-1.5 rounded-lg inline-block">
                  {currentSlideData?.content.diagramLabel || 'Sẵn sàng nhận nét viết'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Slide Navigation Footer Bar */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
        <div className="text-xs text-slate-500">
          Dùng điện thoại ở chế độ <span className="text-slate-300 font-medium">Trình chiếu PDF</span> hoặc nút điều hướng dưới đây để lướt trang
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange('prev')}
            disabled={currentPage <= 1}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 transition-colors"
            title="Trang trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono font-medium text-slate-300">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => onPageChange('next')}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 transition-colors"
            title="Trang sau"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
