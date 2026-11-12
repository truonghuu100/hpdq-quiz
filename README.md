# HPDQ Quiz

Website độc lập phục vụ tổ chức thi trắc nghiệm nội bộ HPDQ.

## Quy tắc đã thống nhất
- Live Quiz ưu tiên; Independent Quiz là giai đoạn tiếp theo.
- Học viên quét QR, chỉ nhập họ tên và chờ Admin bắt đầu.
- Mục tiêu 300 học viên/phòng.
- Cùng câu hỏi được phát đồng bộ.
- Công bố đáp án sau từng câu.
- Trả lời đúng và nhanh được điểm cao hơn.

## Prototype hiện tại
Bản này là giao diện frontend tĩnh: dashboard, ngân hàng câu hỏi mẫu, bộ đề, tạo mã phòng, QR tham gia, màn hình chờ và màn hình trình chiếu mẫu. Trạng thái phòng và danh sách học viên chưa đồng bộ giữa các trình duyệt; dữ liệu không được lưu bền vững. Không dùng cho kỳ thi chính thức.

## Triển khai Render
Tạo Static Site, repository `truonghuu100/hpdq-quiz`, branch `main`, build command để trống, publish directory `.`.

## Backend cần hoàn thiện trước vận hành thật
- Firebase Authentication cho Admin.
- Firestore/Realtime Database cho trạng thái phòng và người chơi.
- Backend tin cậy (Cloud Functions/Cloud Run) xác thực bắt đầu/kết thúc câu hỏi, deadline, câu trả lời duy nhất và tính điểm.
- Không gửi đáp án đúng tới trình duyệt trước công bố.
- Dùng đồng hồ máy chủ, không tin thời gian do trình duyệt người chơi gửi.
- Giới hạn phòng ở 300 học viên và kiểm thử tải 300 kết nối đồng thời.
