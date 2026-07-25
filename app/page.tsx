const features = [
  {
    title: "Upfront Fixed Pricing",
    body: "You see the exact price before we touch your car. No 'while I'm in here,' no surprise add-ons. The number we quote is the number you pay.",
  },
  {
    title: "We Come to Your Driveway",
    body: "No dropping off the car. No three-hour waiting room. No arranging a ride back. We handle it while you get on with your day.",
  },
  {
    title: "Plain-English Diagnosis",
    body: "We explain exactly what's going on in words that make sense — never talking down, never making you feel small for asking.",
  },
  {
    title: "Live Status & ETA",
    body: "Know exactly when we're arriving and watch the job progress in real time. On the way → Diagnosing → Fixing → Light's off.",
  },
  {
    title: "Evening & Weekend Slots",
    body: "Book around your life, not the other way around. Evening and Saturday appointments so you never take time off work.",
  },
  {
    title: "Trusted, Local & Insured",
    body: "Background-checked, licensed, insured mechanics who live and work in your community — the kind your neighbors recommend.",
  },
];

const steps = [
  { n: "01", label: "We come to you" },
  { n: "02", label: "We diagnose" },
  { n: "03", label: "We fix it" },
  { n: "04", label: "Light's off" },
];

const plans = [
  {
    name: "Driveway Diagnostic",
    price: "$89",
    unit: "flat",
    note: "Fee applied toward the repair if you proceed.",
    perks: [
      "Mobile visit to your home",
      "Full diagnostic scan",
      "Plain-English explanation",
      "Written fixed-price quote",
    ],
    featured: false,
  },
  {
    name: "Repair & Maintenance",
    price: "Fixed",
    unit: "per job",
    note: "Upfront price per job — most customers start here.",
    perks: [
      "Everything in Diagnostic",
      "Repair done on-site at quote",
      "Warranty on parts & labor",
      "Live status tracking",
    ],
    featured: true,
  },
  {
    name: "Family Maintenance Plan",
    price: "$29",
    unit: "/mo",
    note: "Never get caught off guard again.",
    perks: [
      "Scheduled seasonal maintenance",
      "Priority booking",
      "Member pricing on repairs",
      "Maintenance reminders",
    ],
    featured: false,
  },
];

import { CtaProvider, BookButton, ContactButton } from "./components/cta";

export default function Home() {
  return (
    <CtaProvider>
    <main>
      {/* Header */}
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#top">
            <span className="brand-mark">🔧</span>
            <span>
              Driveway<span className="brand-accent">Mechanics</span>
            </span>
          </a>
          <nav className="header-actions">
            <ContactButton className="link-muted">Call or Text</ContactButton>
            <BookButton className="btn btn-primary">
              Book in Your Driveway
            </BookButton>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="hero">
        <div className="container">
          <p className="eyebrow">
            Trusted by South Florida families · Miami · West Palm · Port St. Lucie
          </p>
          <h1>
            That check-engine light? We&apos;ll fix it in your driveway.
          </h1>
          <p className="lede">
            We bring expert auto repair to your home across South Florida. You
            see the <strong>exact price before we touch your car</strong> — and
            you never lose a half day at the shop.
          </p>
          <div className="cta-row" id="book">
            <BookButton className="btn btn-primary btn-lg">
              Book in Your Driveway
            </BookButton>
            <a className="btn btn-ghost btn-lg" href="#how">
              See How It Works
            </a>
          </div>
          <p className="fineprint">
            Upfront pricing · We come to you · Same-week &amp; weekend availability
          </p>

          <div className="quote-card">
            <div className="quote-card-head">
              <span>Your driveway visit</span>
              <span className="badge">CONFIRMED</span>
            </div>
            <p className="quote-vehicle">2019 Honda CR-V · Check-engine diagnostic</p>
            <div className="quote-price">
              <span className="quote-price-label">Your fixed price</span>
              <span className="quote-price-value">$99–$139</span>
              <span className="quote-price-sub">Locked before we start — no surprises</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="trustbar">
        <div className="container trustbar-inner">
          <span>★★★★★ 4.9 rating · 380+ reviews</span>
          <span>Licensed &amp; Insured</span>
          <span>Upfront fixed pricing</span>
          <span>Miami · WPB · Port St. Lucie</span>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="section">
        <div className="container">
          <p className="kicker">The Driveway Way</p>
          <h2>Honest auto repair that comes to your driveway — on your schedule.</h2>
          <p className="section-lede">
            A licensed mechanic comes to your home, diagnoses the issue, and
            tells you the exact price in plain language before touching anything.
          </p>
          <ol className="steps">
            {steps.map((s) => (
              <li key={s.n} className="step">
                <span className="step-n">{s.n}</span>
                <span className="step-label">{s.label}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section className="section section-alt">
        <div className="container">
          <h2>Everything you wish the shop had been</h2>
          <p className="section-lede">
            Every part of the experience is built to save your time, protect your
            money, and take the dread off your plate.
          </p>
          <div className="feature-grid">
            {features.map((f) => (
              <article key={f.title} className="feature-card">
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section">
        <div className="container">
          <p className="kicker">No surprises, ever</p>
          <h2>Transparent pricing you can plan around</h2>
          <p className="section-lede">
            The quote is the price. Parts and labor warrantied. Nothing added
            while we&apos;re in there.
          </p>
          <div className="plan-grid">
            {plans.map((p) => (
              <article
                key={p.name}
                className={`plan-card${p.featured ? " plan-featured" : ""}`}
              >
                {p.featured && <span className="plan-tag">Most popular</span>}
                <h3 className="plan-name">{p.name}</h3>
                <p className="plan-price">
                  <span className="plan-price-value">{p.price}</span>
                  <span className="plan-price-unit">{p.unit}</span>
                </p>
                <p className="plan-note">{p.note}</p>
                <ul className="plan-perks">
                  {p.perks.map((perk) => (
                    <li key={perk}>✓ {perk}</li>
                  ))}
                </ul>
                <BookButton className="btn btn-primary btn-block">
                  Get My Fixed Price
                </BookButton>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-final">
        <div className="container">
          <h2>Ready to handle your car without losing your day?</h2>
          <p>
            Join South Florida families who skip the shop entirely. Book a
            driveway visit — see your exact price before we start, and never
            wonder about that light again.
          </p>
          <div className="cta-row">
            <BookButton className="btn btn-primary btn-lg">
              Book in Your Driveway
            </BookButton>
            <ContactButton className="btn btn-ghost btn-lg">
              Call or Text Us
            </ContactButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <a className="brand" href="#top">
              <span className="brand-mark">🔧</span>
              <span>
                Driveway<span className="brand-accent">Mechanics</span>
              </span>
            </a>
            <p className="footer-blurb">
              Honest car repair, in your driveway. Serving South Florida families
              across Miami, West Palm Beach, and Port St. Lucie.
            </p>
            <p className="footer-phone">(772) 555-0142</p>
          </div>
          <div>
            <h4>Service Areas</h4>
            <ul>
              <li>Miami</li>
              <li>West Palm Beach</li>
              <li>Port St. Lucie</li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li>How It Works</li>
              <li>Reviews</li>
              <li>Membership</li>
              <li>FAQ</li>
            </ul>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© 2026 Driveway Mechanics. All rights reserved.</span>
          <span>
            Upfront pricing · We come to you · Licensed &amp; insured
          </span>
        </div>
        <div className="container footer-credit">
          Developed by <strong>Davidson B.</strong>
        </div>
      </footer>
    </main>
    </CtaProvider>
  );
}
