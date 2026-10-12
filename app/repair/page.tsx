import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Camera,
  Sparkles,
  Wrench,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/storefront/site-chrome";
import { RepairForm } from "@/components/repair-form";
import "./repair.css";

export const dynamic = "force-dynamic";
export const metadata = {
  alternates: { canonical: "/repair" },
  title: "Repairs & care",
  description:
    "A little care for your favorite camera. Request a camera repair, restoration, cleaning, film development, or quote request.",
};

export default async function RepairPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="repair-page">
        <section className="repair-hero">
          <div className="repair-hero-copy">
            <div className="repair-breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <span>Repairs & care</span>
            </div>
            <p className="repair-kicker">
              GOOD CAMERAS DESERVE ANOTHER CHAPTER.
            </p>
            <h1>
              A little care.
              <br />
              <em>A lot more joy.</em>
            </h1>
            <p className="repair-hero-description">
              For the camera you can’t quite let go of.
              <br />
              Tell us what it needs, and let’s explore what’s possible.
            </p>
            <div className="repair-hero-actions">
              <a className="repair-button repair-button-dark" href="#request">
                Start a service request <ArrowDown size={17} />
              </a>
              <a className="repair-text-link" href="/contact">
                Talk to the workshop <ArrowUpRight size={15} />
              </a>
            </div>
            <p className="repair-hero-footnote">
              REPAIR · RESTORE · CLEAN · DEVELOP
            </p>
          </div>
          <div className="repair-service-art" aria-hidden="true">
            <div className="repair-care-stamp">
              KEEP THE
              <br />
              <em>good</em>
              <br />
              THINGS GOING <Sparkles size={18} />
            </div>
            <div className="repair-art-top">
              <span>MEASURE JOY CAMERA CLUB</span>
              <Wrench size={19} />
            </div>
            <div className="repair-camera-mark">
              <Camera strokeWidth={0.8} />
              <span>✳</span>
            </div>
            <div className="repair-art-bottom">
              <p>
                Made for memories.
                <br />
                <em>Worth looking after.</em>
              </p>
              <span>
                REPAIRS
                <br />& CARE
              </span>
            </div>
          </div>
        </section>
        <section className="repair-process" aria-label="How a request works">
          <div>
            <span>01</span>
            <h2>Tell us the story.</h2>
            <p>Share the camera, the quirks, and what you have in mind.</p>
          </div>
          <div>
            <span>02</span>
            <h2>Straight to the workshop.</h2>
            <p>Your details go directly to Christian by email.</p>
          </div>
          <div>
            <span>03</span>
            <h2>Make a plan.</h2>
            <p>
              Discuss a quote, availability, and next steps before sending your
              camera.
            </p>
          </div>
        </section>
        <section className="repair-intake" id="request">
          <aside className="repair-intake-aside">
            <p className="repair-kicker">LESS LANDFILL. MORE LIFE.</p>
            <h2>
              Old favorite.
              <br />
              <em>New possibilities.</em>
            </h2>
            <p>
              A sticky lens. A sleepy flash. A roll that’s waited long enough.
              Every camera has a story — start with yours.
            </p>
            <div className="repair-aside-note">
              <Wrench size={22} />
              <h3>A request is the first step.</h3>
              <p>
                Repair options, pricing, and timing depend on your camera. Agree
                on a plan with the workshop before shipping anything.
              </p>
            </div>
            <div className="repair-aside-contact">
              <p>Prefer to get in touch directly?</p>
              <a href="mailto:christianvelasquez363@gmail.com">
                Open an email <ArrowUpRight size={15} />
              </a>
              <small>christianvelasquez363@gmail.com</small>
            </div>
          </aside>
          <RepairForm />
        </section>
        <section className="repair-faq">
          <p className="repair-kicker">A FEW THINGS TO KNOW</p>
          <h2>
            A little <em>clarity.</em>
          </h2>
          <div>
            <details>
              <summary>What happens after I send a request?</summary>
              <p>
                Your camera details and contact information are emailed directly
                to Christian. The workshop can then follow up using your
                preferred contact method to discuss what is possible.
              </p>
            </details>
            <details>
              <summary>Can you fix every camera?</summary>
              <p>
                What’s possible depends on the model, its condition, and
                available parts. Include as much detail as you can, then contact
                the workshop for an assessment before sending your camera.
              </p>
            </details>
            <details>
              <summary>
                How much will it cost, and how long will it take?
              </summary>
              <p>
                Pricing and timing are agreed with the workshop after discussing
                your camera. This form does not provide a quote, take payment,
                or reserve an appointment.
              </p>
            </details>
            <details>
              <summary>Can I add more details later?</summary>
              <p>
                Yes. Email christianvelasquez363@gmail.com with your name and
                camera model, or reply when the workshop gets in touch.
              </p>
            </details>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
