# ----- GIAI ĐOẠN 1: Build -----
# Dùng image Node.js 18 (Alpine) làm "builder"
FROM node:18-alpine AS builder

WORKDIR /app

# Copy file package.json và package-lock.json (nếu có)
COPY package*.json ./

# Cài đặt dependencies (chỉ cho production)
# "--omit=dev" là cách mới thay cho "--production"
RUN npm install --omit=dev

# ----- GIAI ĐOẠN 2: Production -----
# Dùng một image Alpine sạch
FROM node:18-alpine

WORKDIR /app

# Copy node_modules đã cài đặt từ Giai đoạn 1
COPY --from=builder /app/node_modules ./node_modules

# Copy toàn bộ code backend của bạn
COPY . .

# (Bảo mật) Tạo một user không phải root để chạy ứng dụng
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose port 5000 (port mà backend của bạn chạy)
EXPOSE 5000

# Lệnh khởi động ứng dụng
# (THAY "server.js" BẰNG FILE CHÍNH CỦA BẠN NẾU CẦN)
CMD [ "node", "server.js" ]