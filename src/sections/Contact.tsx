import { useState, type FormEvent } from "react";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { isConnected, sendContactMessage } from "../lib/farmApi";

type Status = "idle" | "sending" | "sent" | "error" | "not-connected";

const FIELD =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-h)] placeholder:text-[var(--muted)]";
const LABEL = "text-sm font-medium text-[var(--text-h)]";

const FEEDBACK: Partial<Record<Status, string>> = {
  sent: "Thank you. Your message is on its way to the farm.",
  error: "Something went wrong and your message was not sent. Please try again.",
  "not-connected":
    "This draft is not connected to email yet, so nothing was sent.",
};

export function Contact() {
  const [status, setStatus] = useState<Status>("idle");

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!isConnected) {
      setStatus("not-connected");
      return;
    }
    const data = new FormData(form);
    const field = (name: string) => String(data.get(name) ?? "").trim();
    setStatus("sending");
    try {
      await sendContactMessage({
        name: field("name"),
        contact: field("contact"),
        message: field("message"),
        website: field("website"),
      });
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <Section id="contact" tone="forest">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 sm:gap-8">
        <Reveal>
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)]">Get in touch</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="text-lg">
            Send the farm a message and how to reach you, and we will get back
            to you.
          </p>
        </Reveal>

        <Reveal delay={160}>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>Your name</span>
                <input
                  name="name"
                  required
                  autoComplete="name"
                  className={FIELD}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>Email or phone</span>
                <input name="contact" required className={FIELD} />
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Message</span>
              <textarea name="message" required rows={5} className={FIELD} />
            </label>

            {/* Honeypot: hidden from people, so only bots fill it in. */}
            <div className="hidden" aria-hidden="true">
              <label>
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={status === "sending"}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-[var(--accent)] px-6 text-sm font-medium text-[var(--accent-ink)] transition-transform duration-[var(--dur)] hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : "Send message"}
              </button>
              <p role="status" className="text-sm">
                {FEEDBACK[status]}
              </p>
            </div>
          </form>
        </Reveal>

        <p className="pt-8 text-sm text-[var(--muted)]">
          © {new Date().getFullYear()} Welcome Home Farm · Bentonville, Arkansas
        </p>
      </div>
    </Section>
  );
}
