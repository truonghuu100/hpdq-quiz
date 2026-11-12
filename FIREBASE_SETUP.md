# Kết nối Firebase cho HPDQ Quiz

## Việc cần thực hiện trong Firebase Console
1. Mở https://console.firebase.google.com/ và tạo project có Project ID chính xác là `hpdq-quiz` (nếu ID đã được dùng, chọn ID khác và cập nhật cấu hình).
2. Thêm Web App tên HPDQ Quiz, sao chép Firebase config.
3. Authentication → Sign-in method → bật Anonymous.
4. Realtime Database → Create Database, chọn region gần Việt Nam (Singapore nếu có). Sao chép URL database thực tế.
5. Cập nhật các giá trị trong `firebase-config.js` từ `firebase-config.example.js`, sau đó commit file cấu hình vào repo riêng tư hoặc cấu hình build an toàn. Firebase web apiKey không phải mật khẩu, nhưng vẫn không đưa service account/private key lên frontend.
6. Dán `database.rules.json` vào tab Realtime Database → Rules và Publish.

## Bảo mật trước khi dùng thật
Các rules mẫu này chỉ cho phép người đã đăng nhập anonymous truy cập; chúng chưa xác định vai trò Admin, chưa bảo vệ đáp án đúng và chưa áp giới hạn 300 người bằng transaction phía server. Không dùng rules mẫu cho kỳ thi chính thức hoặc dữ liệu nhạy cảm. Cần bổ sung Cloud Functions/Cloud Run xác thực quyền Admin, kiểm soát số lượng tham gia, bắt đầu câu hỏi và chấm điểm ở máy chủ.

## Kiểm tra kết nối
Sau khi cấu hình xong, mở website trên hai trình duyệt/thiết bị: tạo phòng ở trình duyệt Admin, mở QR ở trình duyệt học viên và xác nhận bộ đếm thay đổi trực tiếp.
