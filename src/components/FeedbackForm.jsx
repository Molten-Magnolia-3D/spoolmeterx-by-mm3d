import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { MessageSquare, Star } from "lucide-react";

const TYPES = [
  { value: "bug", label: "🐛 Bug" },
  { value: "feature", label: "💡 Feature" },
  { value: "general", label: "💬 General" },
];

export default function FeedbackForm({ user, isBeta, onDone }) {
  const [type, setType] = useState("general");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSending(true);

    if (isBeta) {
      // Save to DB for admin review
      await base44.entities.Feedback.create({
        user_email: user?.email || "",
        user_id: user?.id || "",
        type,
        message: message.trim(),
        rating: rating || undefined,
        is_beta: true,
        status: "new",
      });
    } else {
      // Send email
      await base44.integrations.Core.SendEmail({
        to: "mm3d.info@gmail.com",
        subject: `[SpoolmeterX Feedback] ${type} — ${user?.email || "anonymous"}`,
        body: `Type: ${type}\nRating: ${rating ? `${rating}/5` : "not rated"}\nUser: ${user?.email || "anonymous"}\n\n${message.trim()}`,
      });
    }

    setSending(false);
    setSent(true);
    setTimeout(() => { setSent(false); setMessage(""); setRating(0); setType("general"); onDone?.(); }, 2000);
  };

  if (sent) {
    return (
      <div className="py-6 text-center">
        <p className="text-2xl mb-2">🎉</p>
        <p className="font-semibold text-foreground">Thanks for your feedback!</p>
        {!isBeta && <p className="text-xs text-muted-foreground mt-1">Your message was sent to our team.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="flex gap-2">
        {TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${type === t.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Star rating */}
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">Overall rating (optional)</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(s => (
            <button
              key={s}
              onMouseEnter={() => setHoverRating(s)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(s === rating ? 0 : s)}
              className="active:scale-110 transition-transform"
            >
              <Star
                className={`w-7 h-7 ${(hoverRating || rating) >= s ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">Your feedback</p>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Tell us what's on your mind…"
          rows={4}
          className="w-full rounded-lg bg-muted border border-border text-foreground text-sm px-3 py-2 resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={sending || !message.trim()}
        className="w-full gap-2"
      >
        <MessageSquare className="w-4 h-4" />
        {sending ? "Sending…" : "Send Feedback"}
      </Button>
    </div>
  );
}