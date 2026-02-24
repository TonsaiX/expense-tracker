import axios from "axios"; // นำเข้า axios เพื่อใช้ในการทำ HTTP requests

// สร้าง instance ของ axios สำหรับการเชื่อมต่อกับ API
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // ใช้ค่า baseURL ที่กำหนดในไฟล์ .env หรือ .env.local
  withCredentials: true // ใช้ค่า withCredentials เพื่อให้สามารถส่งคุกกี้ไปกับ request ได้
});

let accessToken = null; // ตัวแปรที่เก็บค่า access token

// ฟังก์ชันสำหรับการตั้งค่า access token
export function setAccessToken(token) {
  accessToken = token; // เก็บ access token ที่ส่งมาในตัวแปร accessToken
}

// การตั้งค่าการ intercept ก่อนที่จะส่ง request ไปยัง API
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`; // ถ้ามี access token จะเพิ่ม Authorization header ด้วย Bearer token
  return config; // ส่งค่า config กลับ
});

// ฟังก์ชันสำหรับการรีเฟรช access token
export async function refreshAccessToken() {
  const r = await api.post("/api/auth/refresh"); // ส่ง POST request ไปที่ /api/auth/refresh เพื่อขอ refresh token
  setAccessToken(r.data.accessToken); // ตั้งค่า access token ใหม่
  return r.data; // ส่งข้อมูลที่ได้จากการรีเฟรชกลับ
}

// ฟังก์ชันสำหรับการแปลงตัวเลขเป็นรูปแบบเงิน
export function fmtMoney(n) {
  const v = Number(n || 0); // แปลงค่า n เป็นจำนวนที่เป็นตัวเลข
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(v); // ใช้ Intl.NumberFormat เพื่อแปลงเป็นสกุลเงินบาท (THB)
}

// ฟังก์ชันสำหรับการดึงค่า month key (ปี-เดือน) จากวันที่
export function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7); // คืนค่าปีและเดือนในรูปแบบ "YYYY-MM"
}

// ฟังก์ชันสำหรับการแปลงวันที่เป็นรูปแบบ ISO Date (YYYY-MM-DD)
export function toISODate(d) {
  const yyyy = d.getFullYear(); // ดึงปีจากวันที่
  const mm = String(d.getMonth() + 1).padStart(2, "0"); // ดึงเดือนและเติม 0 หน้าให้ครบ 2 หลัก
  const dd = String(d.getDate()).padStart(2, "0"); // ดึงวันและเติม 0 หน้าให้ครบ 2 หลัก
  return `${yyyy}-${mm}-${dd}`; // คืนค่ารูปแบบ "YYYY-MM-DD"
}
