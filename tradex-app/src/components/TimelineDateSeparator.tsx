
interface TimelineDateSeparatorProps {
  dateInput: string | number;
}

export function getDayLabel(dateInput: string | number) {
  const date = typeof dateInput === "number" ? new Date(dateInput * 1000) : new Date(dateInput);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }
}

export default function TimelineDateSeparator({ dateInput }: TimelineDateSeparatorProps) {
  const dayLabel = getDayLabel(dateInput);
  return (
    <div className="timeline-date-separator">
      <div className="timeline-date-line"></div>
      <span className="timeline-date-text">{dayLabel}</span>
      <div className="timeline-date-line"></div>
    </div>
  );
}
