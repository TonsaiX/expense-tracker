import React, { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";

// สร้าง Context สำหรับ Theme
const ThemeContext = createContext(null);

// รายชื่อธีมที่รองรับ
const THEMES = ["cute", "dark", "minimal"];

// คีย์สำหรับการเก็บค่าใน localStorage
const STORAGE_KEY = "app_theme_v1";

// Hook ที่ใช้เพื่อเข้าถึงข้อมูลและฟังก์ชันจาก ThemeContext
export function useTheme() {
  return useContext(ThemeContext); // คืนค่าคอนเท็กซ์จาก ThemeContext
}

// ฟังก์ชันสำหรับการตั้งค่า theme บน HTML element
function applyTheme(theme) {
  const t = THEMES.includes(theme) ? theme : "cute"; // ตรวจสอบว่าธีมที่เลือกมีอยู่ใน THEMES หรือไม่
  document.documentElement.setAttribute("data-theme", t); // ตั้งค่า data-theme ให้กับ root element
  document.documentElement.style.colorScheme = t === "dark" ? "dark" : "light"; // ตั้งค่า color scheme ให้เป็น dark หรือ light
}

// ThemeProvider คอมโพเนนต์ที่ใช้สำหรับการจัดการและให้บริการธีมแก่แอปพลิเคชัน
export default function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("cute"); // ใช้ useState เพื่อเก็บธีมปัจจุบัน

  // useLayoutEffect ใช้เพื่อดึงข้อมูลธีมที่เก็บไว้ใน localStorage และตั้งค่าธีมตอนที่คอมโพเนนต์โหลดครั้งแรก
  useLayoutEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY); // ดึงค่า theme ที่เก็บไว้จาก localStorage
    const t = THEMES.includes(saved) ? saved : "cute"; // ตรวจสอบว่า theme ที่เก็บไว้มีอยู่ใน THEMES หรือไม่
    setThemeState(t); // ตั้งค่า theme ใน state
    applyTheme(t); // เรียกใช้ applyTheme เพื่อเปลี่ยนธีมบนหน้าเว็บ
  }, []); // useLayoutEffect จะทำงานแค่ครั้งเดียวตอนคอมโพเนนต์โหลด

  // ฟังก์ชันสำหรับการตั้งค่า theme ใหม่
  function setTheme(t) {
    const next = THEMES.includes(t) ? t : "cute"; // ตรวจสอบว่า theme ที่ตั้งใหม่มีอยู่ใน THEMES หรือไม่
    setThemeState(next); // อัพเดต state ของ theme
    localStorage.setItem(STORAGE_KEY, next); // เก็บ theme ที่เลือกใน localStorage
    applyTheme(next); // เรียกใช้ applyTheme เพื่อเปลี่ยนธีมบนหน้าเว็บ
  }

  // useMemo ใช้ในการทำ memoization เพื่อให้ค่า value เปลี่ยนแปลงเฉพาะเมื่อ theme เปลี่ยน
  const value = useMemo(() => ({ theme, setTheme, themes: THEMES }), [theme]);

  // ส่งข้อมูล theme, setTheme, และ THEMES ผ่าน ThemeContext ให้กับ children (คอมโพเนนต์ที่อยู่ภายใน ThemeProvider)
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
