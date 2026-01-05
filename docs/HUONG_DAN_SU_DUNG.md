# Tài liệu Hướng dẫn Sử dụng Hệ thống Quản lý In ấn (MPS)

## 1. Giới thiệu chung

Hệ thống Dịch vụ Quản lý In ấn (Managed Print Service - MPS) là giải pháp toàn diện giúp doanh nghiệp quản lý, giám sát và tối ưu hóa hạ tầng in ấn. Hệ thống cung cấp khả năng theo dõi trạng thái thiết bị theo thời gian thực, quản lý vật tư tiêu hao, tự động hóa quy trình bảo trì và cung cấp các báo cáo chi tiết về chi phí và hiệu suất sử dụng.

## 2. Đối tượng sử dụng và Phân quyền

Hệ thống được thiết kế cho bốn nhóm đối tượng chính:

### 2.1. Vai trò thuộc Nhà cung cấp dịch vụ MPS (System Portal)

- **System Admin (Quản trị viên Hệ thống):** Nhân viên cấp cao của công ty MPS, có quyền quản lý toàn bộ nền tảng, cấu hình hệ thống, quản lý tất cả khách hàng, thiết bị, policies và giám sát vận hành chung.
- **Customer Manager (Quản lý Khách hàng):** Nhân viên công ty MPS được phân công phụ trách quản lý một nhóm khách hàng cụ thể. Chỉ có quyền truy cập dữ liệu của các khách hàng được gán (`managedCustomers`).

### 2.2. Vai trò thuộc Doanh nghiệp Khách hàng (Customer Portal)

- **Manager (Quản trị viên Nội bộ):** Đại diện/quản lý IT của doanh nghiệp khách hàng. Quản lý thiết bị, người dùng, phòng ban và các yêu cầu dịch vụ trong phạm vi tổ chức của mình.
- **User (Người dùng cuối):** Nhân viên sử dụng thiết bị, có thể xem danh sách máy in và tạo các yêu cầu hỗ trợ.

## 3. Hướng dẫn Đăng nhập và Tài khoản

### 3.1. Đăng nhập

1.  Truy cập vào địa chỉ web của hệ thống (ví dụ: `https://mps.example.com`).
2.  Tại màn hình đăng nhập, nhập thông tin:
    - **Tên đăng nhập (Username)** hoặc **Email**.
    - **Mật khẩu (Password)**.
3.  Nhấn nút **Đăng nhập**.

### 3.2. Quên mật khẩu

1.  Tại màn hình đăng nhập, nhấn vào liên kết **"Quên mật khẩu?"**.
2.  Nhập địa chỉ email đã đăng ký với hệ thống.
3.  Kiểm tra email để nhận đường dẫn đặt lại mật khẩu.
4.  Nhấn vào đường dẫn trong email và nhập mật khẩu mới (2 lần để xác nhận).

### 3.3. Đổi mật khẩu

1.  Sau khi đăng nhập, nhấn vào **Avatar** (ảnh đại diện) ở góc trên bên phải màn hình.
2.  Chọn **Hồ sơ cá nhân** hoặc **Đổi mật khẩu**.
3.  Nhập mật khẩu hiện tại và mật khẩu mới.
4.  Nhấn **Lưu thay đổi**.

---

## 4. Chức năng dành cho System Admin (Quản trị viên Hệ thống)

**Đối tượng:** Nhân viên cấp cao của công ty MPS  
**Phạm vi:** Toàn bộ hệ thống, tất cả khách hàng

Khu vực này dành riêng cho đội ngũ vận hành MPS để quản lý toàn bộ nền tảng.

### 4.1. Bảng điều khiển (Dashboard)

Ngay khi đăng nhập, System Admin sẽ thấy:

- **Tổng quan hệ thống:** Số lượng khách hàng, thiết bị đang hoạt động, cảnh báo lỗi.
- **Biểu đồ doanh thu và chi phí:** Theo tháng/quý.
- **Sức khỏe thiết bị toàn hệ thống:**
  - Màu xanh: **Online** (Hoạt động bình thường).
  - Màu vàng: **Warning** (Sắp hết mực, cảnh báo nhẹ).
  - Màu đỏ: **Error** (Lỗi kẹt giấy, cửa mở, mất kết nối).
  - Màu xám: **Offline** (Mất kết nối mạng).
- **Yêu cầu chờ xử lý:** Danh sách Service Requests và Purchase Requests mới.

### 4.2. Quản lý Khách hàng (Customers)

Chức năng này cho phép tạo mới và quản lý thông tin các công ty/tổ chức sử dụng dịch vụ.

- **Thêm mới Khách hàng:**
  1.  Truy cập menu **System > Customers**.
  2.  Nhấn nút **+ Thêm mới**.
  3.  Điền các thông tin bắt buộc:
      - _Tên khách hàng (Name)_: Tên công ty đầy đủ.
      - _Mã khách hàng (Code)_: Mã định danh duy nhất (ví dụ: CUST001).
      - _Email liên hệ_: Email của người đại diện.
      - _Số điện thoại_: Số điện thoại liên hệ chính.
  4.  Nhấn **Lưu**.

- **Quản lý Hợp đồng (Contracts):**
  1.  Trong chi tiết khách hàng, chọn tab **Hợp đồng**.
  2.  Tạo hợp đồng mới với thông tin: Ngày bắt đầu, Ngày kết thúc, Gói dịch vụ (SLA).

### 4.3. Quản lý Thiết bị (Device Management)

Quản lý toàn bộ kho thiết bị máy in, máy photocopy của tất cả khách hàng.

- **Thêm mới Thiết bị:**
  1.  Truy cập menu **System > Devices**.
  2.  Nhấn nút **+ Thêm thiết bị**.
  3.  Nhập thông tin:
      - _Serial Number_: Số seri máy (Bắt buộc & Duy nhất).
      - _Model_: Chọn dòng máy từ danh sách (ví dụ: HP LaserJet Pro, Canon ImageRunner).
      - _Khách hàng_: Gán thiết bị cho khách hàng cụ thể.
      - _Vị trí_: Mô tả vị trí lắp đặt (ví dụ: Tầng 3, Phòng Kế toán).
  4.  Nhấn **Lưu**.

- **Giám sát Trạng thái:**
  - Màu xanh: **Online** (Hoạt động bình thường).
  - Màu vàng: **Warning** (Sắp hết mực, cảnh báo nhẹ).
  - Màu đỏ: **Error** (Lỗi kẹt giấy, cửa mở, mất kết nối).
  - Màu xám: **Offline** (Mất kết nối mạng).

- **Cập nhật Page Count:** System Admin có thể điều chỉnh chỉ số Counter của thiết bị (ví dụ: sau khi bảo trì hoặc reset máy).

### 4.4. Quản lý Vật tư (Inventory & Consumables)

Quản lý kho mực in và linh kiện.

- **Định nghĩa Loại vật tư (Consumable Types):**
  - Tạo các mã mực (ví dụ: TN-2385, CE285A) và gán cho các Model máy in tương thích.
- **Nhập kho (Warehouse Documents):**
  1.  Truy cập **Warehouse Documents**.
  2.  Tạo phiếu **Nhập kho (Inbound)**.
  3.  Chọn loại vật tư và số lượng nhập.
- **Xuất kho:**
  - Tạo phiếu **Xuất kho (Outbound)** khi cấp phát mực cho kỹ thuật viên hoặc gửi cho khách hàng.

### 4.5. Xử lý Yêu cầu Dịch vụ (Service Requests)

Tiếp nhận và xử lý các báo cáo sự cố từ tất cả khách hàng.

1.  Truy cập **Service Requests**.
2.  Lọc các yêu cầu có trạng thái **New (Mới)** hoặc theo khách hàng.
3.  Xem chi tiết lỗi và hình ảnh đính kèm (nếu có).
4.  **Phân công (Assign):** Chọn kỹ thuật viên chịu trách nhiệm xử lý.
5.  Cập nhật trạng thái:
    - _In Progress_: Đang xử lý.
    - _Pending Parts_: Chờ linh kiện.
    - _Resolved_: Đã xử lý xong.
6.  Ghi chú giải pháp xử lý vào hệ thống để lưu hồ sơ.

### 4.6. Xử lý Yêu cầu Mua Vật tư (Purchase Requests)

1.  Truy cập **Purchase Requests**.
2.  Xem danh sách yêu cầu từ tất cả khách hàng.
3.  Phê duyệt hoặc từ chối yêu cầu.
4.  Theo dõi tiến độ giao hàng.

### 4.7. Quản lý Người dùng & Vai trò (Users & Roles)

1.  Truy cập **Users** để quản lý tất cả tài khoản trong hệ thống.
2.  Tạo tài khoản mới cho nhân viên MPS hoặc khách hàng.
3.  Gán vai trò phù hợp: system-admin, customer-manager, manager, user.
4.  Truy cập **Roles** để quản lý các vai trò và quyền hạn.

### 4.8. Quản lý Policies (Phân quyền)

1.  Truy cập **Policies** để cấu hình quyền truy cập chi tiết.
2.  Tạo policy mới với điều kiện Subject (ai), Resource (tài nguyên nào), Action (hành động gì).
3.  Thiết lập ALLOW hoặc DENY cho từng trường hợp.

### 4.9. Cấu hình Hệ thống (System Settings)

- Cấu hình tham số hệ thống, tiền tệ (Currencies), tỷ giá (Exchange Rates).
- Quản lý SLA Templates.
- Cấu hình Navigation cho từng vai trò.

### 4.10. Báo cáo & Doanh thu

1.  Truy cập **Revenue** để xem doanh thu theo khách hàng, theo tháng.
2.  Truy cập **Reports** để xuất báo cáo chi tiết.
3.  **Cost Calculation:** Tính toán chi phí vật tư cho từng dòng máy.

---

## 5. Chức năng dành cho Customer Manager (Quản lý Khách hàng)

**Đối tượng:** Nhân viên công ty MPS được phân công quản lý một nhóm khách hàng  
**Phạm vi:** Chỉ các khách hàng được gán trong `managedCustomers`

Vai trò này tương tự System Admin nhưng bị giới hạn phạm vi dữ liệu.

### 5.1. Bảng điều khiển (Dashboard)

- Xem tổng quan các khách hàng mình phụ trách.
- Thống kê thiết bị, yêu cầu đang chờ xử lý.
- Giám sát trạng thái thiết bị (Online/Offline/Error/Warning).

### 5.2. Quản lý Khách hàng (Customers)

- Xem danh sách khách hàng được phân công.
- Cập nhật thông tin liên hệ khách hàng.
- Quản lý hợp đồng của các khách hàng mình phụ trách.

### 5.3. Quản lý Thiết bị (Devices)

- Xem và quản lý thiết bị của các khách hàng được gán.
- Theo dõi trạng thái, mức mực.
- **Cập nhật Page Count:** Customer Manager có thể điều chỉnh chỉ số Counter (ví dụ: sau khi bảo trì).
- Xem lịch sử sử dụng của từng thiết bị.

### 5.4. Quản lý Vật tư (Consumables)

- Xem tình trạng vật tư của các khách hàng mình quản lý.
- Theo dõi mức tồn kho.

### 5.5. Xử lý Yêu cầu Dịch vụ (Service Requests)

- Xem và xử lý yêu cầu từ các khách hàng được phân công.
- Phân công kỹ thuật viên, cập nhật trạng thái.
- Ghi chú giải pháp xử lý.

### 5.6. Xử lý Yêu cầu Mua Vật tư (Purchase Requests)

- Xem và duyệt yêu cầu mua từ khách hàng được gán.
- Theo dõi tiến độ giao hàng.

### 5.7. Quản lý Người dùng (Users)

- Tạo và quản lý tài khoản cho nhân viên của các khách hàng được phân công.
- Chỉ có thể gán vai trò `manager` hoặc `user`.

### 5.8. Báo cáo

- Xuất báo cáo sử dụng của các khách hàng mình quản lý.
- Xem doanh thu theo khách hàng.

---

## 6. Chức năng dành cho Manager (Quản trị viên Nội bộ Khách hàng)

**Đối tượng:** Quản lý IT / Đại diện của doanh nghiệp khách hàng  
**Phạm vi:** Chỉ dữ liệu của công ty mình

Khu vực này dành cho người quản lý được chỉ định của từng doanh nghiệp khách hàng.

### 6.1. Bảng điều khiển Quản trị (Dashboard)

Ngay khi đăng nhập, Manager sẽ thấy:

- **Tổng quan chi phí:** Xem biểu đồ chi phí in ấn của toàn công ty theo tháng/quý.
- **Sức khỏe thiết bị:** Theo dõi tình trạng hoạt động của tất cả máy in trong công ty.
  - Màu xanh: **Online** (Hoạt động bình thường).
  - Màu vàng: **Warning** (Sắp hết mực, cảnh báo nhẹ).
  - Màu đỏ: **Error** (Lỗi kẹt giấy, cửa mở, mất kết nối).
  - Màu xám: **Offline** (Mất kết nối mạng).
- **Thống kê sử dụng:** Xem phòng ban nào in nhiều nhất, người dùng nào in nhiều nhất.
- **Cảnh báo nhanh:** Các máy sắp hết mực cần đặt hàng.

### 6.2. Quản lý Thiết bị (Devices)

Xem và theo dõi danh sách máy in của công ty.

1.  Truy cập menu **Devices**.
2.  Xem danh sách tất cả máy in được gán cho công ty.
3.  Xem thông tin chi tiết: Serial Number, Model, Vị trí lắp đặt.
4.  Theo dõi mức mực và trạng thái hoạt động của từng máy.
5.  Xem lịch sử sử dụng (số trang in, copy, scan).

### 6.3. Quản lý Người dùng (User Management)

Tạo và quản lý tài khoản cho nhân viên trong công ty.

- **Thêm nhân viên mới:**
  1.  Truy cập menu **Users**.
  2.  Nhấn **+ Thêm người dùng**.
  3.  Nhập thông tin: Họ tên, Email, Phòng ban.
  4.  Hệ thống sẽ gửi email kích hoạt tài khoản cho nhân viên.
- **Chỉnh sửa/Vô hiệu hóa:** Cập nhật thông tin hoặc khóa tài khoản nhân viên nghỉ việc.
- **Phân quyền:** Chỉ định nhân viên thuộc phòng ban nào để dễ dàng quản lý chi phí.
- **Lưu ý:** Manager chỉ có thể tạo tài khoản với vai trò `user` cho nhân viên công ty.

### 6.4. Quản lý Phòng ban (Departments)

Thiết lập cơ cấu tổ chức để phân bổ chi phí.

1.  Truy cập menu **Departments**.
2.  Tạo các phòng ban (ví dụ: Kế toán, Nhân sự, Sale).
3.  Gán ngân sách in ấn (nếu có) cho từng phòng ban.

### 6.5. Quản lý Vật tư (Consumables)

Theo dõi tình trạng vật tư tiêu hao của công ty.

1.  Truy cập menu **Consumables**.
2.  Xem danh sách vật tư (mực in) đang có trong kho nội bộ (nếu có).
3.  Theo dõi mức tồn kho và ngày hết hạn.

### 6.6. Yêu cầu Dịch vụ (Service Requests)

Quản lý và theo dõi các yêu cầu sửa chữa, bảo trì.

#### a. Tạo yêu cầu mới (Báo hỏng máy in)

Khi máy in gặp sự cố (kẹt giấy, bản in mờ, không kết nối được):

1.  Truy cập menu **Service Requests** hoặc nhấn nút **Báo hỏng** trên Dashboard.
2.  Chọn **Thiết bị** đang gặp lỗi (tìm theo tên hoặc vị trí).
3.  Chọn **Mức độ ưu tiên**: Thấp, Bình thường, hoặc Khẩn cấp.
4.  Nhập **Mô tả chi tiết** lỗi (ví dụ: "Máy kêu to khi in 2 mặt").
5.  (Tùy chọn) Đính kèm hình ảnh lỗi.
6.  Nhấn **Gửi yêu cầu**.

#### b. Theo dõi và quản lý yêu cầu

1.  Xem danh sách tất cả yêu cầu của công ty (bao gồm yêu cầu từ nhân viên).
2.  Lọc theo trạng thái: Mới, Đang xử lý, Hoàn thành.
3.  Xem chi tiết tiến độ xử lý của từng yêu cầu.

### 6.7. Yêu cầu Mua Vật tư (Purchase Requests)

Đặt mua mực in và vật tư tiêu hao.

#### a. Tạo yêu cầu mua mới

1.  Truy cập menu **Purchase Requests**.
2.  Nhấn **+ Tạo yêu cầu mua**.
3.  Chọn **Thiết bị** cần thay mực.
4.  Hệ thống sẽ tự động gợi ý loại mực tương thích.
5.  Nhập **Số lượng** cần mua.
6.  Nhấn **Gửi**.

#### b. Duyệt yêu cầu từ nhân viên

- Xem danh sách yêu cầu mua từ nhân viên trong công ty.
- **Phê duyệt** hoặc **Từ chối** trước khi gửi đến nhà cung cấp dịch vụ.

### 6.8. Báo cáo & Thống kê (Reports)

Truy xuất dữ liệu để phục vụ kế toán và kiểm soát.

1.  Truy cập menu **Reports**.
2.  Chọn loại báo cáo:
    - _Báo cáo chi tiết theo máy_: Xem máy nào in nhiều nhất.
    - _Báo cáo theo phòng ban_: Xem phòng ban nào chi tiêu nhiều nhất.
    - _Báo cáo theo người dùng_: Xem ai in nhiều nhất.
    - _Báo cáo tổng hợp tháng_: Dùng để đối soát hóa đơn.
3.  Chọn khoảng thời gian (Tháng này, Quý trước...).
4.  Nhấn **Xuất Excel** hoặc **Xuất PDF** để tải về.

### 6.9. Hợp đồng Dịch vụ (Contracts)

Xem thông tin hợp đồng dịch vụ với nhà cung cấp.

1.  Truy cập menu **Contracts**.
2.  Xem chi tiết: Ngày bắt đầu, Ngày kết thúc, Gói SLA đang sử dụng.
3.  Theo dõi thời hạn hợp đồng để gia hạn kịp thời.

### 6.10. Hồ sơ Cá nhân (Profile)

1.  Nhấn vào **Avatar** ở góc trên bên phải.
2.  Chọn **Hồ sơ cá nhân**.
3.  Có thể cập nhật: Họ tên hiển thị, Số điện thoại.
4.  Đổi mật khẩu: Nhập mật khẩu cũ và mật khẩu mới.

---

## 7. Chức năng dành cho User (Người dùng cuối)

**Đối tượng:** Nhân viên của doanh nghiệp khách hàng  
**Phạm vi:** Chỉ dữ liệu liên quan đến bản thân và thiết bị được phép sử dụng

Khu vực này dành cho nhân viên sử dụng máy in hàng ngày.

### 7.1. Bảng điều khiển Cá nhân (Dashboard)

Ngay khi đăng nhập, người dùng sẽ thấy:

- **Danh sách máy in:** Các máy in được phép sử dụng trong phòng ban/công ty.
- **Trạng thái máy in:**
  - Màu xanh: **Online** (Hoạt động bình thường).
  - Màu vàng: **Warning** (Sắp hết mực).
  - Màu đỏ: **Error** (Đang lỗi).
  - Màu xám: **Offline** (Mất kết nối).
- **Yêu cầu của tôi:** Danh sách các yêu cầu hỗ trợ đã gửi và trạng thái xử lý.
- **Cảnh báo:** Thông báo máy sắp hết mực hoặc cần bảo trì.

### 7.2. Xem Thiết bị (Devices)

Xem thông tin máy in được phép sử dụng.

1.  Truy cập menu **Devices**.
2.  Xem danh sách máy in trong phòng ban/công ty.
3.  Xem thông tin: Tên máy, Vị trí, Trạng thái hoạt động.
4.  Kiểm tra mức mực còn lại của từng máy.

### 7.3. Yêu cầu Dịch vụ (Service Requests) - Báo hỏng máy in

Khi máy in gặp sự cố (kẹt giấy, bản in mờ, không kết nối được):

#### a. Tạo yêu cầu mới

1.  Truy cập menu **Service Requests** hoặc nhấn nút **Báo hỏng** trên Dashboard.
2.  Chọn **Thiết bị** đang gặp lỗi (tìm theo tên hoặc vị trí).
3.  Chọn **Mức độ ưu tiên**: Thấp, Bình thường, hoặc Khẩn cấp.
4.  Nhập **Mô tả chi tiết** lỗi (ví dụ: "Kẹt giấy khay 2", "In ra bị mờ").
5.  (Tùy chọn) Đính kèm hình ảnh lỗi để kỹ thuật viên dễ hiểu.
6.  Nhấn **Gửi yêu cầu**.

#### b. Theo dõi trạng thái yêu cầu

1.  Truy cập menu **Service Requests** hoặc **My Requests**.
2.  Xem danh sách các yêu cầu đã gửi.
3.  Theo dõi trạng thái:
    - _New (Mới)_: Yêu cầu vừa được tạo, chờ tiếp nhận.
    - _In Progress (Đang xử lý)_: Kỹ thuật viên đang xử lý.
    - _Pending Parts (Chờ linh kiện)_: Đang chờ linh kiện thay thế.
    - _Resolved (Hoàn thành)_: Đã sửa xong.
4.  Nhận thông báo qua email khi trạng thái thay đổi.

#### c. Hủy yêu cầu

- Chỉ có thể hủy yêu cầu khi trạng thái là **New (Mới)**.
- Nhấn vào yêu cầu cần hủy > Nhấn nút **Hủy yêu cầu**.

### 7.4. Yêu cầu Mua Vật tư (Purchase Requests) - Đặt mực in

Khi thấy máy báo sắp hết mực hoặc cần đặt thêm vật tư:

#### a. Tạo yêu cầu mua mới

1.  Truy cập menu **Purchase Requests**.
2.  Nhấn **+ Tạo yêu cầu mua**.
3.  Chọn **Thiết bị** cần thay mực.
4.  Hệ thống sẽ tự động gợi ý loại mực tương thích với máy.
5.  Nhập **Số lượng** cần mua.
6.  (Tùy chọn) Ghi chú thêm nếu cần.
7.  Nhấn **Gửi yêu cầu**.

#### b. Theo dõi trạng thái đơn hàng

1.  Truy cập menu **Purchase Requests**.
2.  Xem danh sách các yêu cầu đã gửi.
3.  Theo dõi trạng thái:
    - _Pending Approval (Chờ duyệt)_: Đang chờ quản lý phê duyệt.
    - _Approved (Đã duyệt)_: Đơn hàng đã được duyệt.
    - _Processing (Đang xử lý)_: Đang chuẩn bị giao hàng.
    - _Delivered (Đã giao)_: Vật tư đã được giao.

### 7.5. Hồ sơ Cá nhân (Profile)

Quản lý thông tin tài khoản cá nhân.

1.  Nhấn vào **Avatar** ở góc trên bên phải.
2.  Chọn **Hồ sơ cá nhân**.
3.  Có thể cập nhật: Họ tên hiển thị, Số điện thoại.
4.  Đổi mật khẩu: Nhập mật khẩu cũ và mật khẩu mới.

---

## 8. Các Quy trình Tự động

Hệ thống MPS có các tính năng chạy ngầm để hỗ trợ người dùng:

### 8.1. Thu thập chỉ số Counter (Meter Reading)

- Hệ thống tự động kết nối với máy in hàng ngày để lấy chỉ số Counter (Tổng số trang in).
- Người dùng **không cần** đi ghi số điện hay báo cáo thủ công vào cuối tháng.
- Nếu máy in bị tắt hoặc mất mạng quá 3 ngày, hệ thống sẽ gửi email cảnh báo cho Admin kiểm tra.

### 8.2. Cảnh báo Mực thấp (Low Toner Alert)

- Khi lượng mực còn dưới **20%** (hoặc ngưỡng cài đặt), hệ thống sẽ:
  1.  Hiển thị cảnh báo màu vàng trên Dashboard.
  2.  Gửi email thông báo cho người phụ trách.
- Khi lượng mực còn dưới **5%**, hệ thống có thể tự động tạo đơn đặt hàng (nếu được cấu hình).

---

## 9. Câu hỏi thường gặp (FAQ)

**Q: Tôi không thấy máy in của mình trong danh sách?**
A: Vui lòng liên hệ Quản trị viên để kiểm tra xem máy in đã được thêm vào hệ thống và gán đúng cho tài khoản của bạn chưa.

**Q: Làm sao để biết yêu cầu của tôi đã được xử lý chưa?**
A: Bạn sẽ nhận được email thông báo mỗi khi trạng thái yêu cầu thay đổi. Ngoài ra, bạn có thể vào mục **My Requests** để xem trạng thái cập nhật theo thời gian thực.

**Q: Tôi có thể hủy yêu cầu đã gửi không?**
A: Bạn chỉ có thể hủy yêu cầu khi nó đang ở trạng thái **New (Mới)**. Nếu yêu cầu đã chuyển sang **In Progress (Đang xử lý)**, bạn cần liên hệ trực tiếp với bộ phận hỗ trợ để hủy.

**Q: Sự khác biệt giữa Customer Manager và Manager là gì?**
A: **Customer Manager** là nhân viên của công ty MPS (nhà cung cấp dịch vụ), được phân công quản lý một nhóm khách hàng. **Manager** là quản trị viên nội bộ của một doanh nghiệp khách hàng, chỉ quản lý dữ liệu của công ty mình.
