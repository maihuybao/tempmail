import { Email } from "@/app/search/SearchResults";
import { ArrowLeft } from "lucide-react";

interface EmailDetailProps {
  email: Email;
  onBack: () => void;
}

export default function EmailDetail({ email, onBack }: EmailDetailProps) {
  const date = new Date(email.date);
  const htmlContent = email.data.html || email.data.text_as_html || "";

  return (
    <div className="flex flex-col h-full">
      <div className="md:hidden px-4 py-3 border-b border-border">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <h1 className="text-xl font-semibold mb-4">
          {email.data.subject || "(No Subject)"}
        </h1>

        <div className="space-y-1 text-sm mb-6">
          <div className="flex gap-2">
            <span className="text-fg-muted w-12">From</span>
            <span>{email.data.from}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-fg-muted w-12">To</span>
            <span>{email.recipients}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-fg-muted w-12">Date</span>
            <span>
              {date.toLocaleDateString([], {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}{" "}
              {date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        <div className="border-t border-border pt-4 overflow-x-auto">
          {htmlContent ? (
            <div
              className="email-body text-sm"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          ) : (
            <pre className="text-sm whitespace-pre-wrap">{email.data.text}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
