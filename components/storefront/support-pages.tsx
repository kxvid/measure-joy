"use client";
import { useRef, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  Camera,
  Heart,
  Wrench,
  Mail,
  MapPin,
  Copy,
  Check,
  Plus,
} from "lucide-react";
import { useStorefrontCopy } from "./copy-provider";
import { SiteHeader, SiteFooter } from "./site-chrome";
const LIVE = "";
const faqs = [
  {
    group: "Finding your camera",
    items: [
      [
        "What makes a vintage digital camera different?",
        "Early digital cameras have their own color, flash, texture, and handling. Choose a camera for the kind of photographs you enjoy, then check its listing for the specific features and condition.",
      ],
      [
        "Are the photos of the actual item?",
        "Product galleries show the photographs attached to each individual listing. Our editorial campaign images are separate from these item photos.",
      ],
      [
        "What comes with my camera?",
        "Check the individual listing for included batteries, chargers, memory cards, and accessories. Compatibility varies by model. If you are unsure, ask the workshop before ordering.",
      ],
      [
        "Can I find film cameras here too?",
        "Yes. Use the Film & instant cameras category to explore the current collection, or select Digital cameras for early digital favorites.",
      ],
    ],
  },
  {
    group: "Orders & payment",
    items: [
      [
        "How do I purchase a camera?",
        "Choose a camera and add it to your bag, or select Buy this find now. Secure checkout confirms current pricing and availability before payment.",
      ],
      [
        "Why did a camera become unavailable?",
        "Many finds have limited stock. Saving a camera does not reserve it. Checkout confirms the latest availability before a purchase is completed.",
      ],
      [
        "Where can I see an existing order?",
        "Use the confirmation email from your purchase for your order details. If you need help, open Contact us and choose “Help with an order”; include your order reference in your message.",
      ],
      [
        "Where do I find shipping and return details?",
        "Our Shipping and Returns pages explain the store policies. The shipping options and amounts shown at checkout apply to your order.",
      ],
    ],
  },
  {
    group: "Repairs & care",
    items: [
      [
        "Can you help with my existing camera?",
        "Send a repair request with the camera brand, model, and a description of the issue. Your details are emailed directly to Christian so the workshop can discuss what is possible.",
      ],
      [
        "Does a request commit me to a repair?",
        "No. A request starts a conversation about an assessment or quote. Do not send your camera until instructions have been agreed.",
      ],
      [
        "What happens after I send a request?",
        "The workshop receives your details by email and can follow up using your preferred contact method. To add information, email Christian with your name and camera model.",
      ],
      [
        "Can every model and fault be repaired?",
        "Repairability depends on the camera, fault, and availability of replacement parts. Describe the issue as clearly as possible so the workshop can advise.",
      ],
    ],
  },
];
export function AboutPage() {
  const copy = useStorefrontCopy();
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="support-page">
        <section className="support-hero about-hero">
          <p className="eyebrow">THE MEASURE JOY WAY</p>
          <h1>
            For the moments
            <br />
            you can’t <em>recreate.</em>
          </h1>
          <p>
            We’re here for the feeling. The flash-lit faces. The accidental
            favorites.
            <br />
            And the little cameras that help us notice more.
          </p>
        </section>
        <section className="about-editorial">
          <img
            src="/editorial/lifestyle.webp"
            alt="Friends making memories by the coast, from the Measure Joy campaign"
          />
          <div>
            <p className="eyebrow">OLD SOULS. NEW STORIES.</p>
            <h2>
              A fresh start.
              <br />
              <em>For you both.</em>
            </h2>
            <p>{copy.about_paragraph1}</p>
            <p>{copy.about_paragraph2}</p>
            <a className="text-link" href="/shop">
              Find your point of view <ArrowUpRight size={18} />
            </a>
          </div>
        </section>
        <section className="about-values">
          <div>
            <Camera />
            <h3>Keep the character.</h3>
            <p>
              Interesting cameras, actual item photos, and the details you need
              to choose well.
            </p>
          </div>
          <div>
            <Heart />
            <h3>Follow the feeling.</h3>
            <p>
              More being there. Less looking at a feed. Make photographs for the
              joy of it.
            </p>
          </div>
          <div>
            <Wrench />
            <h3>Give it another life.</h3>
            <p>
              Care and repair can keep a beloved camera in the picture for
              another chapter.
            </p>
            <a href="/repair">
              Meet the workshop <ArrowUpRight size={14} />
            </a>
          </div>
        </section>
        <section className="support-callout">
          <p className="eyebrow">GOOD CAMERAS. GREAT STORIES.</p>
          <h2>
            Your next chapter
            <br />
            <em>starts with a click.</em>
          </h2>
          <a href="/shop" className="button button-dark">
            Shop the collection <ArrowUpRight size={18} />
          </a>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
export function FAQPage() {
  const [query, setQuery] = useState("");
  const found = faqs
    .map((g) => ({
      ...g,
      items: g.items.filter(([q, a]) =>
        (q + " " + a).toLowerCase().includes(query.toLowerCase()),
      ),
    }))
    .filter((g) => g.items.length);
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="support-page">
        <section className="support-hero">
          <p className="eyebrow">A LITTLE CLARITY</p>
          <h1>
            Good questions.
            <br />
            <em>Clear answers.</em>
          </h1>
          <p>From first frames to next steps, here’s a little help.</p>
          <input
            className="faq-search"
            aria-label="Search frequently asked questions"
            placeholder="What would you like to know?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </section>
        <section className="faq-content">
          {found.length ? (
            found.map((group) => (
              <div className="faq-group" key={group.group}>
                <h2>{group.group}</h2>
                <div>
                  {group.items.map(([q, a]) => (
                    <details key={q}>
                      <summary>
                        {q}
                        <Plus size={17} />
                      </summary>
                      <p>{a}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="faq-empty">
              No matching answers. Try “shipping”, “repair”, or “camera”.
            </p>
          )}
        </section>
        <section className="support-callout">
          <p className="eyebrow">STILL WONDERING?</p>
          <h2>
            We’re all <em>ears.</em>
          </h2>
          <a className="button button-dark" href="/contact">
            Say hello <ArrowUpRight size={18} />
          </a>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
export function ShippingPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="support-page">
        <section className="support-hero">
          <p className="eyebrow">THE JOURNEY TO YOUR DOOR</p>
          <h1>
            Sent with care.
            <br />
            <em>Received with joy.</em>
          </h1>
          <p>Everything you need for the next step, in one place.</p>
        </section>
        <section className="policy-grid">
          <article>
            <span>01 / SHIPPING</span>
            <h2>
              A good thing,
              <br />
              <em>on its way.</em>
            </h2>
            <p>
              Your available delivery options, destination eligibility, and
              shipping amount are confirmed in the existing Measure Joy
              checkout.
            </p>
            <p>
              For the current delivery estimates and full shipping terms, use
              the store’s shipping policy.
            </p>
            <a className="button button-dark" href={`${LIVE}/shipping`}>
              Read the shipping policy <ArrowUpRight size={16} />
            </a>
          </article>
          <article id="returns">
            <span>02 / RETURNS & WARRANTY</span>
            <h2>
              A little
              <br />
              <em>peace of mind.</em>
            </h2>
            <p>
              If something isn’t right, contact the workshop before returning a
              camera. Keep the order details, packaging, and included
              accessories together.
            </p>
            <p>
              Return windows, condition requirements, and warranty terms are
              covered by the current store policy.
            </p>
            <a className="button button-dark" href={`${LIVE}/returns`}>
              Read returns & warranty <ArrowUpRight size={16} />
            </a>
          </article>
        </section>
        <section className="policy-order">
          <div>
            <p className="eyebrow">ALREADY ORDERED?</p>
            <h2>
              Follow your next <em>adventure.</em>
            </h2>
            <p>
              Check your order confirmation email for order details. For a hand
              with delivery or tracking, contact the workshop with your order
              reference.
            </p>
          </div>
          <a className="button button-outline" href="/contact">
            Get help with an order <ArrowUpRight size={18} />
          </a>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
export function ContactPage() {
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [activationPending, setActivationPending] = useState(false);
  const [error, setError] = useState("");
  const token = useRef<string | null>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const email = "christianvelasquez363@gmail.com";
  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const data = new FormData(event.currentTarget);
    token.current ||= crypto.randomUUID();
    setSending(true);
    setError("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        signal: controller.signal,
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          topic: data.get("topic"),
          message: data.get("message"),
          website: data.get("website"),
          requestToken: token.current,
        }),
      });
      const body = await response.json();
      if (!response.ok || body.success !== true)
        throw new Error(
          body.error ||
            "We couldn’t confirm your submission. Your message is still here; please retry.",
        );
      setActivationPending(body.status === "activation_pending");
      setSent(true);
    } catch (problem) {
      setError(
        problem instanceof Error && problem.name !== "AbortError"
          ? problem.message
          : "The connection took too long. Your message is still here; please retry or email Christian directly.",
      );
    } finally {
      clearTimeout(timeout);
      setSending(false);
      requestAnimationFrame(() => feedback.current?.focus());
    }
  }
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="support-page">
        <section className="support-hero">
          <p className="eyebrow">LET’S TALK CAMERAS</p>
          <h1>
            A little help.
            <br />
            <em>A friendly hello.</em>
          </h1>
          <p>
            Not sure which camera is for you? Need a hand with a find?
            <br />
            The workshop is a message away.
          </p>
        </section>
        <section className="contact-layout">
          <div className="contact-info">
            <div>
              <MapPin size={24} />
              <h2>
                From Covina,
                <br />
                <em>with love.</em>
              </h2>
              <p>
                Based in Covina, California. Get in touch before arranging a
                visit or sending a camera.
              </p>
            </div>
            <div>
              <Mail size={23} />
              <h3>The camera workshop</h3>
              <a href={`mailto:${email}`} className="contact-email">
                {email}
              </a>
              <button className="copy-contact" onClick={copy}>
                {copied ? <Check size={13} /> : <Copy size={13} />}{" "}
                {copied ? "Copied" : "Copy email address"}
              </button>
            </div>
            <a className="repair-contact-link" href="/repair">
              <Wrench />
              <span>
                Something not quite right?
                <strong>Start a repair request</strong>
              </span>
              <ArrowUpRight size={20} />
            </a>
          </div>
          {sent ? (
            <div
              className="contact-form contact-success"
              ref={feedback}
              tabIndex={-1}
              role="status"
            >
              <Check size={34} />
              <p className="eyebrow">THANKS FOR REACHING OUT</p>
              <h2>
                Your note
                <br />
                is <em>{activationPending ? "queued." : "on its way."}</em>
              </h2>
              <p>
                {activationPending ? (
                  <>
                    Your note is queued while the workshop finishes email setup.
                    For time-sensitive help, {" "}
                    <a href={`mailto:${email}`} className="underline">
                      email Christian directly
                    </a>
                    .
                  </>
                ) : (
                  <>
                    Your note has been submitted to the workshop. Keep an eye on
                    the email address you shared for a reply.
                  </>
                )}
              </p>
              <button
                className="button button-dark"
                onClick={() => {
                  setSent(false);
                  setActivationPending(false);
                  token.current = null;
                }}
              >
                Write another note <ArrowUpRight size={18} />
              </button>
            </div>
          ) : (
            <form
              className="contact-form"
              onSubmit={submit}
              onChange={() => {
                token.current = null;
              }}
            >
              <p className="eyebrow">A NOTE TO THE WORKSHOP</p>
              <h2>
                What’s on <em>your mind?</em>
              </h2>
              <fieldset disabled={sending}>
                <label>
                  Your name
                  <input
                    name="name"
                    required
                    maxLength={100}
                    autoComplete="name"
                    placeholder="Your name"
                  />
                </label>
                <label>
                  Email address
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </label>
                <label>
                  What’s it about?
                  <select name="topic">
                    <option>A question about a camera</option>
                    <option>Help with an order</option>
                    <option>Camera care and compatibility</option>
                    <option>Something else</option>
                  </select>
                </label>
                <label>
                  Your message
                  <textarea
                    name="message"
                    required
                    minLength={10}
                    maxLength={5000}
                    placeholder="Tell us a little more…"
                    rows={6}
                  />
                </label>
                <div className="form-trap" aria-hidden="true">
                  <label>
                    Website
                    <input name="website" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>
                <button
                  className="button button-dark"
                  type="submit"
                  disabled={sending}
                >
                  {sending ? "Sending your note…" : "Send to the workshop"}{" "}
                  <ArrowUpRight size={18} />
                </button>
                <p className="contact-form-note">
                  Your message goes directly to Christian. For order help,
                  include your order reference.{" "}
                  <a href="/privacy">Privacy policy</a>
                </p>
              </fieldset>
              {error && (
                <div
                  className="contact-compose-status"
                  ref={feedback}
                  tabIndex={-1}
                  role="alert"
                >
                  {error}
                </div>
              )}
            </form>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
