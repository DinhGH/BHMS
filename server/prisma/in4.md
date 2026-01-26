Quản lý schema Prisma, migration và seed dữ liệu.
Kết nối và đồng bộ cấu trúc database MySQL.
Muốn sửa database thì sửa script trong schema.prisma
Sau khi sửa xong thì lưu và mở terminal vào thư mục server của dự án nhập:
npx prisma migrate dev --name init
name: là tên của thao tác vừa làm, ví dụ update_user_email,...
