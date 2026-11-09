"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  LoaderCircle,
  Mail,
} from "lucide-react";
import {
  CAMERA_BRANDS,
  REPAIR_ISSUES,
  REPAIR_SERVICES,
  repairNeedsCamera,
  repairServiceLabel,
  validateRepairInput,
  type RepairInput,
} from "@/lib/repair-intake";
import { repairPhotoSelectionError } from "@/lib/repair-photos";

export function RepairForm({ photosEnabled = false }: { photosEnabled?: boolean }) {
  const [saved, setSaved] = useState<RepairInput | null>(null);
  const [activationPending, setActivationPending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string[] | undefined>>(
    {},
  );
  const [contact, setContact] = useState("email");
  const [description, setDescription] = useState("");
  const [serviceChoice, setServiceChoice] = useState("");
  const [photoCount, setPhotoCount] = useState(0);
  const needsCamera = repairNeedsCamera(serviceChoice);
  const token = useRef<string | null>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const fieldError = (name: string) => fields[name]?.[0];
  const errorProps = (name: string) => ({
    "aria-invalid": !!fieldError(name),
    "aria-describedby": fieldError(name) ? `repair-error-${name}` : undefined,
  });
  const errorText = (name: string) =>
    fieldError(name) ? (
      <span className="repair-field-error" id={`repair-error-${name}`}>
        {fieldError(name)}
      </span>
    ) : null;
  function focusFeedback() {
    requestAnimationFrame(() => feedback.current?.focus());
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setFields({});
    const data = new FormData(event.currentTarget);
    if (!token.current) token.current = crypto.randomUUID();
    const result = validateRepairInput({
      requestToken: token.current,
      website: data.get("website"),
      service: data.get("service"),
      brand: data.get("brand"),
      model: data.get("model"),
      issues: data.getAll("issues"),
      description: data.get("description"),
      name: data.get("name"),
      email: data.get("email"),
      phone: data.get("phone"),
      preferredContact: data.get("preferredContact"),
      consent: data.get("consent") === "on",
    });
    if (!result.success) {
      setFields(result.error.flatten().fieldErrors);
      setError("A few details need a second look. Check the fields below.");
      focusFeedback();
      return;
    }
    const photos = data.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0);
    const photoError = repairPhotoSelectionError(photos);
    if (photoError) {
      setFields({ photos: [photoError] });
      setError(photoError);
      focusFeedback();
      return;
    }
    const multipart = new FormData();
    multipart.set("payload", JSON.stringify(result.data));
    photos.forEach((photo) => multipart.append("photos", photo));
    setSubmitting(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch("/api/repairs", {
        method: "POST",
        ...(photos.length ? {} : { headers: { "Content-Type": "application/json" } }),
        body: photos.length ? multipart : JSON.stringify(result.data),
        signal: controller.signal,
        credentials: "same-origin",
      });
      const body = (await response.json()) as {
        success?: boolean;
        status?: "accepted" | "activation_pending";
        error?: string;
        fieldErrors?: Record<string, string[] | undefined>;
      };
      if (!response.ok || body.success !== true) {
        setFields(body.fieldErrors || {});
        throw new Error(
          body.error || "We couldn’t confirm your submission. Please try again.",
        );
      }
      setActivationPending(body.status === "activation_pending");
      setSaved(result.data);
      focusFeedback();
    } catch (problem) {
      setError(
        problem instanceof Error && problem.name !== "AbortError"
          ? problem.message
          : "The connection took too long. Your details are still here. Please retry or email Christian directly.",
      );
      focusFeedback();
    } finally {
      clearTimeout(timeout);
      setSubmitting(false);
    }
  }
  if (saved)
    return (
      <div
        ref={feedback}
        tabIndex={-1}
        className="repair-confirmation"
        aria-live="polite"
      >
        <span className="repair-confirmation-icon">
          <Check size={26} />
        </span>
        <p className="repair-kicker">A LITTLE CARE STARTS HERE</p>
        <h2>
          Your request
          <br />
          is <em>{activationPending ? "queued." : "on its way."}</em>
        </h2>
        <dl className="repair-receipt">
          {saved.brand && <div>
            <dt>Camera</dt>
            <dd>
              {saved.brand} {saved.model}
            </dd>
          </div>}
          <div>
            <dt>Service</dt>
            <dd>{repairServiceLabel(saved.service)}</dd>
          </div>
          <div>
            <dt>Reply to</dt>
            <dd>
              {saved.preferredContact === "phone" ? saved.phone : saved.email}
            </dd>
          </div>
        </dl>
        <div className="repair-next">
          <Mail size={20} />
          <div>
            <h3>The next chapter starts with a conversation.</h3>
            <p>
              {activationPending ? (
                <>
                  Your request is queued while the workshop finishes email setup.
                  For time-sensitive help, {" "}
                  <a href="mailto:christianvelasquez363@gmail.com" className="underline">
                    email Christian directly
                  </a>
                  .{" "}
                </>
              ) : (
                <>
                  Your request has been submitted to the workshop for review.
                  Christian will get in touch about your request. {" "}
                </>
              )}
              Please wait for agreed instructions before shipping a camera.
            </p>
          </div>
        </div>
        <div className="repair-confirmation-links">
          <a href="/shop">
            Explore the collection <ArrowUpRight size={14} />
          </a>
          <button
            type="button"
            onClick={() => {
              setSaved(null);
              setActivationPending(false);
              setError("");
              setFields({});
              setDescription("");
              token.current = null;
              setContact("email");
              setServiceChoice("");
              setPhotoCount(0);
            }}
          >
            Start another request
          </button>
        </div>
      </div>
    );
  return (
    <form
      ref={form}
      className="repair-form"
      onSubmit={submit}
      onChange={() => {
        token.current = null;
      }}
      aria-label="Camera service request"
    >
      <div className="repair-form-heading">
        <p className="repair-kicker">LET’S TAKE A LOOK</p>
        <h2>
          Tell us about
          <br />
          <em>your camera.</em>
        </h2>
        <p>Fields marked * are required.</p>
      </div>
      {error && (
        <div ref={feedback} tabIndex={-1} className="repair-alert" role="alert">
          <strong>Your request needs attention</strong>
          <p>{error}</p>
          <p>
            Your details are still here. You can retry or{" "}
            <a href="mailto:christianvelasquez363@gmail.com">
              email Christian directly
            </a>
            .
          </p>
        </div>
      )}
      <div className="form-trap" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <fieldset disabled={submitting} className="repair-form-body">
        <fieldset className="repair-service-group" {...errorProps("service")}>
          <legend>
            <span>01</span> What can we help with? *
          </legend>
          {(["Camera care", "Other requests"] as const).map((group) => (
            <div className="repair-service-category" key={group}>
              <p className="repair-service-category-label">{group}</p>
              <div className="repair-service-options">
            {REPAIR_SERVICES.filter((service) => service.group === group).map((service) => (
              <label className="repair-service-choice" key={service.value} htmlFor={`repair-service-${service.value}`}>
                <input
                  id={`repair-service-${service.value}`}
                  type="radio"
                  name="service"
                  value={service.value}
                  checked={serviceChoice === service.value}
                  onChange={(event) => setServiceChoice(event.target.value)}
                  required
                />
                <span>
                  <strong>{service.label}</strong>
                  <small>{service.description}</small>
                </span>
                <CheckCircle2 size={17} aria-hidden="true" />
              </label>
            ))}
              </div>
            </div>
          ))}
          {errorText("service")}
        </fieldset>
        <fieldset className="repair-form-section">
          <legend>
            <span>02</span> {needsCamera ? "The camera" : "Your request"}
          </legend>
          <div className="repair-fields-grid">
            <label>
              Brand {needsCamera ? "*" : "(optional)"}
              <input
                name="brand"
                list="repair-camera-brands"
                placeholder="e.g. Canon"
                required={needsCamera}
                maxLength={80}
                {...errorProps("brand")}
              />
              <datalist id="repair-camera-brands">
                {CAMERA_BRANDS.map((brand) => (
                  <option key={brand} value={brand} />
                ))}
              </datalist>
              {errorText("brand")}
            </label>
            <label>
              Model {needsCamera ? "*" : "(optional)"}
              <input
                name="model"
                placeholder="e.g. PowerShot SD1000"
                required={needsCamera}
                maxLength={120}
                {...errorProps("model")}
              />
              {errorText("model")}
            </label>
          </div>
          <p className="repair-hint">
            {needsCamera ? "Not sure of the model? Enter “Unknown”." : "No camera details needed for a rental or general enquiry."}
          </p>
          <fieldset className="repair-issues" hidden={!needsCamera} disabled={!needsCamera}>
            <legend>
              Anything sound familiar? <span>Optional · choose any</span>
            </legend>
            <div>
              {REPAIR_ISSUES.map((issue) => (
                <label className="repair-issue-chip" key={issue}>
                  <input type="checkbox" name="issues" value={issue} />
                  <span>{issue}</span>
                </label>
              ))}
            </div>
            {errorText("issues")}
          </fieldset>
          <label className="repair-description">
            {serviceChoice === "rental-enquiry" ? "Your event plans *" : "A few more details *"}
            <textarea
              name="description"
              required
              minLength={10}
              maxLength={3000}
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={serviceChoice === "rental-enquiry" ? "Tell us your preferred date, location, and how many cameras you have in mind. Availability and pricing will be discussed before any booking." : "What’s happening? When did it start? Tell us what you have in mind and what help you need."}
              {...errorProps("description")}
            />
            {errorText("description")}
            <span className="repair-counter">
              {description.length.toLocaleString()} / 3,000
            </span>
          </label>
          {photosEnabled ? <div className="repair-photos">
            <label htmlFor="repair-photos">Camera photos <span>(optional)</span></label>
            <p id="repair-photo-help">Add up to 3 JPG or PNG photos. Maximum 2 MB each, 3 MB total. Photos are emailed with your request; please leave out faces, documents, and personal information.</p>
            <input
              id="repair-photos"
              name="photos"
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={(event) => setPhotoCount(event.target.files?.length || 0)}
              aria-describedby={`repair-photo-help${fieldError("photos") ? " repair-error-photos" : ""}`}
              aria-invalid={!!fieldError("photos")}
            />
            <p className="repair-hint" aria-live="polite">{photoCount ? `${photoCount} photo${photoCount === 1 ? "" : "s"} selected` : "A clear view of the camera and the issue helps us take a look."}</p>
            {errorText("photos")}
          </div> : <p className="repair-hint">You can send camera photos directly to <a href="mailto:christianvelasquez363@gmail.com">Christian by email</a>.</p>}
        </fieldset>
        <fieldset className="repair-form-section">
          <legend>
            <span>03</span> Your details
          </legend>
          <div className="repair-fields-grid">
            <label>
              Your name *
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                placeholder="First and last name"
                {...errorProps("name")}
              />
              {errorText("name")}
            </label>
            <label>
              Email address *
              <input
                name="email"
                autoComplete="email"
                type="email"
                required
                maxLength={254}
                placeholder="you@example.com"
                {...errorProps("email")}
              />
              {errorText("email")}
            </label>
            <label>
              Phone {contact === "phone" ? "*" : "(optional)"}
              <input
                name="phone"
                autoComplete="tel"
                type="tel"
                required={contact === "phone"}
                maxLength={40}
                placeholder="(555) 123-4567"
                {...errorProps("phone")}
              />
              {errorText("phone")}
            </label>
            <label>
              Preferred contact *
              <select
                name="preferredContact"
                value={contact}
                onChange={(event) => setContact(event.target.value)}
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </label>
          </div>
        </fieldset>
        <label className="repair-consent">
          <input
            type="checkbox"
            name="consent"
            required
            {...errorProps("consent")}
          />
          <span>
            I agree to share my contact and camera details with the workshop for
            this service request. *
          </span>
        </label>
        {errorText("consent")}
        <button
          className="repair-button repair-button-dark repair-submit"
          type="submit"
          disabled={submitting}
        >
          {submitting ? (
            <>
              Sending your request{" "}
              <LoaderCircle size={18} className="repair-spin" />
            </>
          ) : (
            <>
              Send to the workshop <ArrowUpRight size={18} />
            </>
          )}
        </button>
        <p className="repair-form-note">
          This sends your details directly to Christian. No payment is taken and
          no appointment is reserved.
        </p>
      </fieldset>
      <noscript>
        <p className="repair-alert">
          Enable JavaScript to send a request here, or{" "}
          <a href="mailto:christianvelasquez363@gmail.com">
            open an email to the workshop
          </a>
          .
        </p>
      </noscript>
      <a className="repair-form-bottom" href="/privacy">
        How we look after your details <ArrowUpRight size={14} />
      </a>
    </form>
  );
}
