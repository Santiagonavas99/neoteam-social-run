import type { FeedbackValue } from "./admin-types";

export function Feedback({ value }: { value: FeedbackValue }) {
  if (!value) return null;
  return <p className={`feedback feedback-${value.kind}`} role={value.kind === "error" ? "alert" : "status"}>{value.text}</p>;
}
export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <span className={`status-badge status-${status}`}>{label}</span>;
}
export function Logo({ url, name }: { url?: string | null; name: string }) {
  return <span className="record-logo">{url ? <img src={url} alt={`Logo de ${name}`} /> : <span aria-hidden="true">{name.slice(0, 2).toUpperCase() || "N"}</span>}</span>;
}

