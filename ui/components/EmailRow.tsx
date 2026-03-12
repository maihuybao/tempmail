import { Email } from "@/app/search/SearchResults";

interface EmailRowProps {
  email: Email;
  selected: boolean;
  onClick: () => void;
}

export default function EmailRow({ email, selected, onClick }: EmailRowProps) {
  const date = new Date(email.date);
  const isToday = new Date().toDateString() === date.toDateString();
  const dateStr = isToday
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });

  const sender = email.data.from || email.sender || "Unknown";
  const senderName = sender.includes("<")
    ? sender.split("<")[0].trim()
    : sender;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-border transition-colors ${
        selected
          ? "bg-accent-subtle"
          : "hover:bg-bg-hover"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2 mb-0.5">
        <span className="text-sm font-medium truncate">{senderName}</span>
        <span className="text-xs text-fg-muted whitespace-nowrap flex-shrink-0">
          {dateStr}
        </span>
      </div>
      <div className="text-sm truncate">
        {email.data.subject || "(No Subject)"}
      </div>
      <div className="text-xs text-fg-muted truncate mt-0.5">
        {email.data.text?.slice(0, 100)}
      </div>
    </button>
  );
}
