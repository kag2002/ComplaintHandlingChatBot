# GrabFood Complaint Router Chatbot 🤖🍔

Hệ thống tự động tiếp nhận khiếu nại, đối soát hình ảnh hóa đơn/bằng chứng, tự động phân loại định tuyến ticket (Triage) và hỗ trợ phê duyệt bồi hoàn (HITL) sử dụng kiến trúc AI Agent Loop & Guardrails.

Dự án được xây dựng cho **Day 06 Mini Hackathon (VinUni AI Product Labs)**.

---

## 🌟 Tính Năng Nổi Bật

1. **AI Agent Tool Calling Loop**:
   - Sử dụng mô hình Agent gọi công cụ đa vòng (lên tới 4 vòng) để hoàn thành quy trình xử lý thay vì gọi AI một lần (single-shot).
   - Tích hợp 5 công cụ chuyên biệt: `order_lookup`, `evidence_check`, `triage`, `hitl_handoff`, và `clarify`.
2. **Dashboard Split-View & Tabs**:
   - Giao diện chat đơn giản, tinh tế ở trung tâm.
   - Bảng theo dõi phân chia thành các tab: **Phân loại (Triage)**, **Đơn hàng**, **CSKH (HITL)**, và **AI Pipeline** có thể đóng/mở linh hoạt.
3. **AI Pipeline Visualizer**:
   - Trực quan hóa quy trình xử lý thực tế của AI Agent (Tiếp nhận -> Tra cứu -> Check ảnh -> Phân loại -> Check an toàn -> CSKH).
4. **Safety Policy Guardrails**:
   - Tự động kiểm duyệt đầu ra của Agent, đảm bảo không tự ý cam kết hoàn tiền chắc chắn hoặc quy kết lỗi trách nhiệm cho tài xế/cửa hàng.
5. **Interactive HITL Control Panel**:
   - CSKH có thể phê duyệt hoàn tiền, đối soát với cửa hàng hoặc tài xế trực tiếp trên UI và cập nhật nhật ký kiểm toán (audit log).
6. **Log Viewer & Evals UI**:
   - Giao diện xem lịch sử chat và kết quả đánh giá (evaluation runs) kèm nút kích hoạt Evaluation tự động trực tiếp trên web.

---

## 🛠️ Tech Stack

* **Backend**: Python FastAPI, Uvicorn, OpenAI SDK (kết nối qua OpenRouter).
* **Frontend**: Next.js, TailwindCSS v4, Lucide Icons, React.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Thử

### 1. Chuẩn Bị Environment
* Đảm bảo đã có API Key của OpenRouter.
* Sao chép file cấu hình `.env.example` thành `.env` tại thư mục `backend/` và điền key của bạn:
  ```env
  OPENROUTER_API_KEY=your_openrouter_api_key_here
  ```

### 2. Chạy Backend (FastAPI - Port 8000)
Chạy các lệnh sau tại thư mục `backend/`:
```bash
# Cài đặt thư viện
pip install -r requirements.txt

# Khởi chạy server
python server.py --provider openrouter
```

### 3. Chạy Frontend (Next.js - Port 3000)
Chạy các lệnh sau tại thư mục `frontend/`:
```bash
# Cài đặt node modules
npm install

# Khởi chạy dev server
npm run dev
```
👉 Truy cập giao diện Chat tại: [http://localhost:3000/chat](http://localhost:3000/chat)  
👉 Truy cập giao diện Log & Eval tại: [http://localhost:3000/logs](http://localhost:3000/logs)

---

## 🧪 Chạy Đánh Giá Tự Động (Evaluation Suite)

Bạn có thể chạy kiểm thử độ chính xác định tuyến và chính sách an toàn (guardrails) qua 2 cách:
1. **Từ Terminal (Backend)**:
   ```bash
   python run_eval.py --provider openrouter
   ```
2. **Từ Web UI**:
   * Truy cập [http://localhost:3000/logs](http://localhost:3000/logs).
   * Bấm nút **"Chạy Evaluation"** màu xanh để nhận kết quả phân tích trực tiếp.
