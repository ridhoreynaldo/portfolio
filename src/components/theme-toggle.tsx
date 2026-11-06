"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

/** Ganti tema terang/gelap (disimpan di localStorage; awalnya mengikuti pengaturan perangkat). */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.dataset.theme === "dark"); }, []);
  function toggle() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("svc-theme", next); } catch { /* abaikan */ }
    setDark(!dark);
  }
  return (
    <button type="button" onClick={toggle} className={`btn-ghost btn-sm ${className}`} aria-label={dark ? "Ganti ke tema terang" : "Ganti ke tema gelap"} title={dark ? "Tema terang" : "Tema gelap"}>
      {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </button>
  );
}
