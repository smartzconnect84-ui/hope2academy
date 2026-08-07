import { useEffect, useState } from "react";
import { apiClient, isNetworkError } from "./api-client";
import { MODULE_LABELS } from "./module-access";

export interface ModuleConfig {
  id: string;
  key: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  updatedAt?: string;
}

const KEY = "h2l.module_config";
const EVENT = "h2l.module_config.change";

const EXTRA_LABELS: Record<string, string> = {
  hero: "Hero Banner", team: "Team Page", homepage: "Homepage Content",
  projectspage: "Projects Content", storiespage: "Stories Content",
  divisionspage: "Departments Content", inquiries: "Enquiries",
  volunteers: "Volunteer Sign-ups", subscribers: "Subscribers", pledges: "Pledges",
  finance: "Finance Overview", broadcast: "Internal Broadcast",
  scholarships: "Scholarships & Financial Aid", approvals: "Approvals Centre",
  reports: "Reports Inbox", receipts: "Payment Receipts", visitorlog: "Visitor Log",
  academicyear: "Academic Year Setup", counselling: "Counselling Records",
  bookstock: "Library Catalogue", ptmeetings: "PTM Scheduler",
  leaverequests: "Staff Leave Management",
};

const fallbackConfigs = (): ModuleConfig[] =>
  Array.from(new Set([...Object.keys(MODULE_LABELS), ...Object.keys(EXTRA_LABELS)])).map((key) => ({
    id: `module_${key}`,
    key,
    title: MODULE_LABELS[key] ?? EXTRA_LABELS[key] ?? key,
    subtitle: `Manage ${(MODULE_LABELS[key] ?? EXTRA_LABELS[key] ?? key).toLowerCase()} in the portal`,
    enabled: true,
  }));

function read(): ModuleConfig[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as ModuleConfig[] : fallbackConfigs();
  } catch {
    return fallbackConfigs();
  }
}

function write(configs: ModuleConfig[]) {
  localStorage.setItem(KEY, JSON.stringify(configs));
  window.dispatchEvent(new CustomEvent(EVENT));
}

let loadPromise: Promise<ModuleConfig[]> | null = null;

export const moduleConfigStore = {
  list: read,
  get(key: string) { return read().find((module) => module.key === key); },
  isEnabled(key: string) { return this.get(key)?.enabled !== false; },
  async load(): Promise<ModuleConfig[]> {
    if (!loadPromise) {
      loadPromise = apiClient.list<ModuleConfig>("modules")
        .then((configs) => {
          write(configs);
          return configs;
        })
        .catch((error) => {
          if (!isNetworkError(error)) throw error;
          return read();
        })
        .finally(() => { loadPromise = null; });
    }
    return loadPromise;
  },
  async update(id: string, patch: Partial<Pick<ModuleConfig, "title" | "subtitle" | "enabled">>) {
    const current = read();
    const existing = current.find((module) => module.id === id);
    if (!existing) throw new Error("Module not found");
    try {
      const updated = await apiClient.update<ModuleConfig>("modules", id, patch);
      write(current.map((module) => module.id === id ? updated : module));
      return updated;
    } catch (error) {
      if (!isNetworkError(error)) throw error;
      const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      write(current.map((module) => module.id === id ? updated : module));
      return updated;
    }
  },
};

export function useModuleConfigs() {
  const [configs, setConfigs] = useState<ModuleConfig[]>(() => read());
  useEffect(() => {
    const refresh = () => setConfigs(read());
    const load = () => { void moduleConfigStore.load().then(setConfigs).catch(() => undefined); };
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", refresh);
    load();
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return configs;
}