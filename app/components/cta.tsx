"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// Business contact — update these two when the real line is provisioned.
const PHONE_DISPLAY = "(772) 555-0142";
const PHONE_E164 = "+17725550142";

// ── Context so any button on the page opens the shared modals ─────────────
type CtaCtx = { openBooking: () => void; openContact: () => void };
const Ctx = createContext<CtaCtx | null>(null);

function useCta(): CtaCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("CTA buttons must be used within <CtaProvider>");
  return ctx;
}

export function CtaProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState(false);
  const [contact, setContact] = useState(false);

  const openBooking = useCallback(() => {
    setContact(false);
    setBooking(true);
  }, []);
  const openContact = useCallback(() => {
    setBooking(false);
    setContact(true);
  }, []);

  return (
    <Ctx.Provider value={{ openBooking, openContact }}>
      {children}
      {booking && <BookingModal onClose={() => setBooking(false)} />}
      {contact && <ContactModal onClose={() => setContact(false)} />}
    </Ctx.Provider>
  );
}

// ── Trigger buttons (reuse existing .btn styles via className) ─────────────
export function BookButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { openBooking } = useCta();
  return (
    <button type="button" className={className} onClick={openBooking}>
      {children}
    </button>
  );
}

export function ContactButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { openContact } = useCta();
  return (
    <button type="button" className={className} onClick={openContact}>
      {children}
    </button>
  );
}

// ── Shared modal shell (overlay, Escape, scroll lock, a11y) ────────────────
function Modal({
  titleId,
  title,
  onClose,
  children,
}: {
  titleId: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3 id={titleId} className="modal-title">
            {title}
          </h3>
          <button
            type="button"
            className="modal-close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Booking form ───────────────────────────────────────────────────────────
function BookingModal({ onClose }: { onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    date: "",
    time: "",
    problem: "",
  });

  const update =
    (key: keyof typeof form) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  // No backend yet: compose a prefilled SMS to the shop so the request goes
  // somewhere real. TODO: POST to Supabase Edge Function / `appointments`
  // table (PRD F-4) once the backend slice is built.
  const smsHref = () => {
    const body = [
      "Driveway Mechanics — booking request",
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `Email: ${form.email}`,
      `Address: ${form.address}`,
      `Preferred date: ${form.date}`,
      `Preferred time: ${form.time}`,
      `Problem: ${form.problem}`,
    ].join("\n");
    return `sms:${PHONE_E164}?&body=${encodeURIComponent(body)}`;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <Modal titleId="booking-title" title="Book your driveway visit" onClose={onClose}>
      {submitted ? (
        <div className="modal-body">
          <p className="modal-success">
            Thanks, {form.name.split(" ")[0] || "there"}! We&apos;ve got your
            request for <strong>{form.date}</strong> at <strong>{form.time}</strong>.
          </p>
          <p className="modal-note">
            Send it to us and we&apos;ll confirm your visit and address:
          </p>
          <a className="btn btn-primary btn-block" href={smsHref()}>
            Text my request to {PHONE_DISPLAY}
          </a>
          <a className="btn btn-ghost btn-block" href={`tel:${PHONE_E164}`}>
            Prefer to call? Tap to call
          </a>
          <button type="button" className="modal-textlink" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <form className="modal-body" onSubmit={onSubmit}>
          <p className="modal-note">
            Tell us where and when. We come to your home — no dropping off the car.
          </p>
          <div className="field">
            <label htmlFor="bk-name">Full name</label>
            <input
              id="bk-name"
              type="text"
              autoComplete="name"
              required
              autoFocus
              value={form.name}
              onChange={update("name")}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="bk-phone">Phone number</label>
              <input
                id="bk-phone"
                type="tel"
                autoComplete="tel"
                required
                value={form.phone}
                onChange={update("phone")}
              />
            </div>
            <div className="field">
              <label htmlFor="bk-email">Email</label>
              <input
                id="bk-email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={update("email")}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="bk-address">Home address</label>
            <input
              id="bk-address"
              type="text"
              autoComplete="street-address"
              placeholder="Where we'll come to your car"
              required
              value={form.address}
              onChange={update("address")}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="bk-date">Preferred date</label>
              <input
                id="bk-date"
                type="date"
                required
                value={form.date}
                onChange={update("date")}
              />
            </div>
            <div className="field">
              <label htmlFor="bk-time">Preferred time</label>
              <input
                id="bk-time"
                type="time"
                required
                value={form.time}
                onChange={update("time")}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="bk-problem">What&apos;s going on with the car?</label>
            <textarea
              id="bk-problem"
              rows={3}
              placeholder="Describe the problem — e.g. check-engine light on, squealing brakes, won't start…"
              required
              value={form.problem}
              onChange={update("problem")}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            Request my driveway visit
          </button>
        </form>
      )}
    </Modal>
  );
}

// ── Call / Text panel ──────────────────────────────────────────────────────
function ContactModal({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState("");
  const smsHref = `sms:${PHONE_E164}?&body=${encodeURIComponent(message)}`;

  return (
    <Modal titleId="contact-title" title="Call or text us" onClose={onClose}>
      <div className="modal-body">
        <p className="modal-note">Reach a real person — we answer texts fast.</p>

        <div className="contact-block">
          <span className="contact-label">Tap to call</span>
          <a className="contact-phone" href={`tel:${PHONE_E164}`}>
            {PHONE_DISPLAY}
          </a>
        </div>

        <div className="contact-block">
          <label htmlFor="ct-message" className="contact-label">
            Send us a text
          </label>
          <textarea
            id="ct-message"
            rows={3}
            placeholder="Hi! I'd like to book a driveway visit for my car…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <a
            className="btn btn-primary btn-block"
            href={smsHref}
            aria-disabled={message.trim() === ""}
            onClick={(e) => {
              if (message.trim() === "") e.preventDefault();
            }}
          >
            Send text
          </a>
        </div>
      </div>
    </Modal>
  );
}
