export function LabelOptions({ labels }: { labels: Record<string, string> }) {
  return Object.entries(labels).map(([key, label]) => (
    <option key={key} value={key}>
      {label}
    </option>
  ))
}
