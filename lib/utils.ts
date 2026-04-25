import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID().slice(0, 12)}`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function metricValue(metrics: { name: string; value: string }[], names: string[]) {
  const normalized = names.map((name) => name.toLowerCase());
  return metrics.find((metric) => normalized.includes(metric.name.toLowerCase()))?.value;
}
