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
type CtaCtx = {
  openBooking: () => void;
  openContact: () => void;
  openAuth: () => void;
};
const Ctx = createContext<CtaCtx | null>(null);

function useCta(): CtaCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("CTA buttons must be used within <CtaProvider>");
  return ctx;
}

export function CtaProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState(false);
  const [contact, setContact] = useState(false);
  const [auth, setAuth] = useState(false);

  const openBooking = useCallback(() => {
    setContact(false);
    setAuth(false);
    setBooking(true);
  }, []);
  const openContact = useCallback(() => {
    setBooking(false);
    setAuth(false);
    setContact(true);
  }, []);
  const openAuth = useCallback(() => {
    setBooking(false);
    setContact(false);
    setAuth(true);
  }, []);

  return (
    <Ctx.Provider value={{ openBooking, openContact, openAuth }}>
      {children}
      {booking && <BookingModal onClose={() => setBooking(false)} />}
      {contact && <ContactModal onClose={() => setContact(false)} />}
      {auth && <AuthModal onClose={() => setAuth(false)} />}
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

export function LoginButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { openAuth } = useCta();
  return (
    <button type="button" className={className} onClick={openAuth}>
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

  // Current-location capture. No geocoding key wired yet, so we fill the field
  // with GPS coordinates and attach a maps link to the request. TODO: reverse-
  // geocode to a street address via Mapbox (MAPBOX_PUBLIC_TOKEN) when available.
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const useCurrentLocation = () => {
    setGeoError("");
    if (!("geolocation" in navigator)) {
      setGeoError("Location isn't available on this device — please type your address.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setCoords({ lat, lng });
        setForm((f) => ({ ...f, address: `${lat}, ${lng}` }));
        setLocating(false);
      },
      (err) => {
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — please type your address instead."
            : "Couldn't get your location — please type your address instead."
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // No backend yet: compose a prefilled SMS to the shop so the request goes
  // somewhere real. TODO: POST to Supabase Edge Function / `appointments`
  // table (PRD F-4) once the backend slice is built.
  const smsHref = () => {
    const lines = [
      "Driveway Mechanics — booking request",
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `Email: ${form.email}`,
      `Address: ${form.address}`,
      `Preferred date: ${form.date}`,
      `Preferred time: ${form.time}`,
      `Problem: ${form.problem}`,
    ];
    if (coords) {
      lines.push(`Map: https://maps.google.com/?q=${coords.lat},${coords.lng}`);
    }
    return `sms:${PHONE_E164}?&body=${encodeURIComponent(lines.join("\n"))}`;
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
            <label htmlFor="bk-address">Home address / Current Location</label>
            <input
              id="bk-address"
              type="text"
              autoComplete="street-address"
              placeholder="Where we'll come to your car"
              required
              value={form.address}
              onChange={(e) => {
                setCoords(null);
                setForm((f) => ({ ...f, address: e.target.value }));
              }}
            />
            <button
              type="button"
              className="geo-btn"
              onClick={useCurrentLocation}
              disabled={locating}
            >
              {locating ? "Locating…" : "📍 Use my current location"}
            </button>
            {geoError && <p className="field-error">{geoError}</p>}
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

// ── Login / Register ───────────────────────────────────────────────────────
// NOTE: no auth backend yet. For security we NEVER store or transmit the
// password — on submit we show a "coming soon" confirmation. TODO: wire to
// Supabase Auth (PRD F-1; confirm username/password vs. phone-OTP) when the
// backend slice is built.
function AuthLegal() {
  return (
    <p className="auth-legal">
      By registering or logging in to DrivewayMechanicsAPP, customers are able to
      track their service history and their current service progress.
    </p>
  );
}

function AuthModal({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<
    "choose" | "login" | "register" | "login-done" | "register-done"
  >("choose");

  const [login, setLogin] = useState({ username: "", password: "" });
  const [reg, setReg] = useState({
    name: "",
    phone: "",
    email: "",
    username: "",
    password: "",
  });

  const titles: Record<typeof view, string> = {
    choose: "Log in or register",
    login: "Welcome back",
    register: "Create your account",
    "login-done": "Almost there",
    "register-done": "You're on the list",
  };

  return (
    <Modal titleId="auth-title" title={titles[view]} onClose={onClose}>
      {view === "choose" && (
        <div className="modal-body">
          <p className="modal-note">
            Track your service history and watch your live service progress.
          </p>
          <div className="auth-choose">
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => setView("login")}
            >
              Log in — existing client
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => setView("register")}
            >
              Register — new client
            </button>
          </div>
          <AuthLegal />
        </div>
      )}

      {view === "login" && (
        <form
          className="modal-body"
          onSubmit={(e) => {
            e.preventDefault();
            setView("login-done");
          }}
        >
          <div className="field">
            <label htmlFor="lg-username">Username</label>
            <input
              id="lg-username"
              type="text"
              autoComplete="username"
              required
              autoFocus
              value={login.username}
              onChange={(e) =>
                setLogin((s) => ({ ...s, username: e.target.value }))
              }
            />
          </div>
          <div className="field">
            <label htmlFor="lg-password">Password</label>
            <input
              id="lg-password"
              type="password"
              autoComplete="current-password"
              required
              value={login.password}
              onChange={(e) =>
                setLogin((s) => ({ ...s, password: e.target.value }))
              }
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            Log in
          </button>
          <button
            type="button"
            className="modal-textlink"
            onClick={() => setView("choose")}
          >
            ← Back
          </button>
          <AuthLegal />
        </form>
      )}

      {view === "register" && (
        <form
          className="modal-body"
          onSubmit={(e) => {
            e.preventDefault();
            setView("register-done");
          }}
        >
          <div className="field">
            <label htmlFor="rg-name">Full name</label>
            <input
              id="rg-name"
              type="text"
              autoComplete="name"
              required
              autoFocus
              value={reg.name}
              onChange={(e) => setReg((s) => ({ ...s, name: e.target.value }))}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="rg-phone">Phone number</label>
              <input
                id="rg-phone"
                type="tel"
                autoComplete="tel"
                required
                value={reg.phone}
                onChange={(e) =>
                  setReg((s) => ({ ...s, phone: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="rg-email">Email</label>
              <input
                id="rg-email"
                type="email"
                autoComplete="email"
                required
                value={reg.email}
                onChange={(e) =>
                  setReg((s) => ({ ...s, email: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="rg-username">Choose a username</label>
            <input
              id="rg-username"
              type="text"
              autoComplete="username"
              required
              value={reg.username}
              onChange={(e) =>
                setReg((s) => ({ ...s, username: e.target.value }))
              }
            />
          </div>
          <div className="field">
            <label htmlFor="rg-password">Create a password</label>
            <input
              id="rg-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={reg.password}
              onChange={(e) =>
                setReg((s) => ({ ...s, password: e.target.value }))
              }
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            Create account
          </button>
          <button
            type="button"
            className="modal-textlink"
            onClick={() => setView("choose")}
          >
            ← Back
          </button>
          <AuthLegal />
        </form>
      )}

      {(view === "login-done" || view === "register-done") && (
        <div className="modal-body">
          <p className="modal-success">
            {view === "register-done"
              ? `Thanks, ${reg.name.split(" ")[0] || "there"}! `
              : "Thanks! "}
            Accounts are coming soon.
          </p>
          <p className="modal-note">
            We&apos;re building secure sign-in so you can track your service
            history and live service progress. We&apos;ll let you know the moment
            it&apos;s ready.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={onClose}
          >
            Got it
          </button>
          <AuthLegal />
        </div>
      )}
    </Modal>
  );
}
