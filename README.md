# Bảng Biên Bản Sản Xuất (Static, GitHub Pages)

**Mục tiêu:** Tạo một bảng ổn định, dễ dùng, chạy thuần client (không cần server) để up lên GitHub Pages.

## Tính năng
- Bảng responsive, có **sắp xếp** theo cột, **lọc** theo khách hàng, mã/ tên sản phẩm và **khoảng ngày sản xuất**.
- **Thêm/ Sửa/ Xoá** biên bản (lưu vào `localStorage`).
- **Nhập** dữ liệu từ JSON/CSV và **Xuất** dữ liệu ra JSON/CSV.
- Hỗ trợ hiển thị ảnh URL hoặc base64 ở các cột: `sampleImage`, `patternImage`, `signature`.
- **Không phụ thuộc API** → phù hợp GitHub Pages.

## Cấu trúc dữ liệu (schema)
```json
{
  "id": "string",
  "productCodeName": "string",
  "customerName": "string",
  "sampleSewingDate": "YYYY-MM-DD",
  "productionDate": "YYYY-MM-DD",
  "sampleEditDetails": "string",
  "originalForm": "string",
  "sampleImage": "data:image/png;base64,... hoặc URL ảnh",
  "patternImage": "data:image/png;base64,... hoặc URL ảnh",
  "agreedToTerms": true,
  "signature": "data:image/png;base64,... hoặc URL ảnh",
  "confirmationDate": "YYYY-MM-DD",
  "reportCreator": "string"
}
```

## Cách deploy lên GitHub Pages
1. Tạo repo mới (ví dụ `bienban-pages`), upload 4 file: `index.html`, `style.css`, `script.js`, `README.md`.
2. Vào **Settings → Pages** → chọn **Branch: `main`**, folder **`/root`** → **Save**.
3. Đợi site build xong, truy cập URL dạng `https://<username>.github.io/bienban-pages/`.
4. Dữ liệu lưu ở `localStorage` của trình duyệt — riêng cho từng domain.

## Mẹo
- Import file JSON/CSV theo đúng schema để nạp dữ liệu hàng loạt.
- Nếu muốn set sẵn data mặc định, có thể sửa hàm `loadSampleData()` trong `script.js`.
