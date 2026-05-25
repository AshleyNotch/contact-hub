import { useEffect, useState } from "react";
import type { Lead } from "./crm-types";

const KEY = "sprrintly-crm-leads";

function read(): Lead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Lead[]) : [];
  } catch {
    return [];
  }
}

function write(leads: Lead[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(leads));
  window.dispatchEvent(new Event("leads-changed"));
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  useEffect(() => {
    setLeads(read());
    const h = () => setLeads(read());
    window.addEventListener("leads-changed", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("leads-changed", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return {
    leads,
    setAll: (next: Lead[]) => write(next),
    add: (incoming: Lead[]) => write([...read(), ...incoming]),
    update: (id: string, patch: Partial<Lead>) =>
      write(read().map((l) => (l.id === id ? { ...l, ...patch } : l))),
    remove: (id: string) => write(read().filter((l) => l.id !== id)),
    clear: () => write([]),
  };
}
