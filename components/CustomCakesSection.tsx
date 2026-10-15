"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CAKE_DESIGNS, CAKE_WHATSAPP, cakeDesign } from "@/lib/customCakes";

const OCCASIONS = ["Birthday", "Wedding", "Other"] as const;
const STANDARD_FLAVOURS = ["Pineapple", "Chocolate", "Caramel", "Coffee", "Pistache", "Strawberry", "Black Forest", "Red Velvet"] as const;
const SPECIAL_FLAVOURS = ["Kit Kat", "Dairy milk", "Lotus Sunday", "Chocolate fudge", "Three milk", "Ferraro cake", "OREO cake", "Raffaello cake", "Honey cake"] as const;
const SIZES = ["2 Pond", "3 Pond", "4 Pond", "Custome"] as const;

type FormState = {
  occasion: string;
  occasionOther: string;
  date: string;
  size: string;
  sizeCustom: string;
  standardFlavour: string;
  specialFlavour: string;
  notes: string;
};

type FieldErrors = Partial<Record<"occasion" | "date" | "size" | "flavour", string>>;

const EMPTY_FORM: FormState = {
  occasion: "",
  occasionOther: "",
  date: "",
  size: "",
  sizeCustom: "",
  standardFlavour: "",
  specialFlavour: "",
  notes: "",
};

function localISODate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLocalDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function focusable(panel: HTMLElement) {
  return [...panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])")].filter(
    (element) => element.tabIndex !== -1
  );
}

function validate(form: FormState, today: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.occasion) errors.occasion = "Choose an occasion.";
  else if (form.occasion === "Other" && !form.occasionOther.trim()) errors.occasion = "Tell us the occasion.";
  if (!form.date) errors.date = "Choose the date you need the cake.";
  else if (today && form.date < today) errors.date = "Choose today or a later date.";
  const sizeKnown = (SIZES as readonly string[]).includes(form.size);
  if (!form.size || !sizeKnown) errors.size = "Choose a size.";
  else if (form.size === "Custome" && !form.sizeCustom.trim()) errors.size = "Tell us the custom size.";
  const standardKnown = (STANDARD_FLAVOURS as readonly string[]).includes(form.standardFlavour);
  const specialKnown = (SPECIAL_FLAVOURS as readonly string[]).includes(form.specialFlavour);
  if ((form.standardFlavour && !standardKnown) || (form.specialFlavour && !specialKnown) || (form.standardFlavour && form.specialFlavour) || (!form.standardFlavour && !form.specialFlavour)) {
    errors.flavour = "Choose either a standard or a special flavour.";
  }
  return errors;
}

function inquiryMessage(form: FormState, designId: string | null) {
  const design = cakeDesign(designId);
  const occasion = form.occasion === "Other" ? form.occasionOther.trim() : form.occasion;
  const lines = [
    "I would like to inquire about a custom cake.",
    "",
    `Occasion: ${occasion}`,
    `Date needed: ${formatLocalDate(form.date)}`,
  ];
  if (form.size === "Custome") lines.push(`Size: Custome — ${form.sizeCustom.trim()}`);
  else if (form.size) lines.push(`Size: ${form.size}`);
  if (form.standardFlavour) lines.push(`Standard flavour: ${form.standardFlavour}`);
  if (form.specialFlavour) lines.push(`Special flavour: ${form.specialFlavour}`);
  if (form.notes.trim()) lines.push(`Design notes: ${form.notes.trim()}`);
  if (design) lines.push(`Design reference: ${design.id} (${design.title})`);
  lines.push("", "I can share reference photos in this WhatsApp chat.");
  return lines.join("\n");
}

const fieldClass =
  "mt-1 w-full rounded-xl border border-gold-200 bg-white px-3 py-2 text-sm text-maroon-900 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon-700";

export default function CustomCakesSection() {
  const titleId = useId();
  const inquiryTitleId = useId();
  const galleryTitleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const inquiryButtonRef = useRef<HTMLButtonElement>(null);
  const galleryButtonRef = useRef<HTMLButtonElement>(null);
  const designButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const pendingFocus = useRef<HTMLElement | null>(null);
  const returnFocusDesign = useRef<string | null>(null);
  const [panel, setPanel] = useState<null | "gallery" | "inquiry">(null);
  const [inquiryReturn, setInquiryReturn] = useState<"page" | "gallery">("page");
  const [designId, setDesignId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(localISODate());
  }, []);

  useEffect(() => {
    if (!panel) return;
    const panelElement = dialogRef.current;
    if (!panelElement) return;
    const list = focusable(panelElement);
    const requested = pendingFocus.current;
    pendingFocus.current = null;
    const designButton = returnFocusDesign.current ? designButtonRefs.current[returnFocusDesign.current] : null;
    returnFocusDesign.current = null;
    const occasion = panel === "inquiry" ? panelElement.querySelector<HTMLElement>("#cake-occasion") : null;
    const target =
      (requested && panelElement.contains(requested) ? requested : null) ??
      (designButton && panelElement.contains(designButton) ? designButton : null) ??
      occasion ??
      list[0];
    target?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (panel === "inquiry") closeInquiry();
        else closeGallery();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const items = focusable(dialogRef.current);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [panel]);

  function openInquiry(nextDesign: string | null, returnTo: "page" | "gallery") {
    setDesignId(nextDesign);
    setForm(EMPTY_FORM);
    setErrors({});
    setInquiryReturn(returnTo);
    pendingFocus.current = null;
    setPanel("inquiry");
  }

  function closeInquiry() {
    if (inquiryReturn === "gallery") {
      returnFocusDesign.current = designId;
      setPanel("gallery");
      return;
    }
    setPanel(null);
    inquiryButtonRef.current?.focus();
  }

  function openGallery() {
    returnFocusDesign.current = null;
    pendingFocus.current = null;
    setPanel("gallery");
  }

  function closeGallery() {
    setPanel(null);
    galleryButtonRef.current?.focus();
  }

  function update(field: keyof FormState, value: string) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "standardFlavour" && value) next.specialFlavour = "";
      if (field === "specialFlavour" && value) next.standardFlavour = "";
      return next;
    });
    setErrors((current) => {
      const next = { ...current };
      if (field === "occasion" || field === "occasionOther") delete next.occasion;
      else if (field === "date") delete next.date;
      else if (field === "size" || field === "sizeCustom") delete next.size;
      else if (field === "standardFlavour" || field === "specialFlavour") delete next.flavour;
      return next;
    });
  }

  const pendingErrors = validate(form, today);
  const formReady = Boolean(today) && Object.keys(pendingErrors).length === 0;
  const whatsappHref = formReady ? `${CAKE_WHATSAPP}?text=${encodeURIComponent(inquiryMessage(form, designId))}` : "#";
  const selectedDesign = cakeDesign(designId);

  function continueOnWhatsApp(event: React.MouseEvent<HTMLAnchorElement>) {
    const nextErrors = validate(form, today || localISODate());
    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      setErrors(nextErrors);
      const sizeTarget = form.size === "Custome" && !form.sizeCustom.trim() ? "cake-size-custom" : "cake-size";
      const first = nextErrors.occasion ? "cake-occasion" : nextErrors.date ? "cake-date" : nextErrors.size ? sizeTarget : "cake-flavour-standard";
      document.getElementById(first)?.focus();
      return;
    }
    closeInquiry();
  }

  return (
    <section aria-labelledby={titleId} className="mx-auto w-full max-w-6xl px-4 pb-1 pt-1 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-[#fff8f0]">
        <picture>
          <source media="(min-width: 1024px)" srcSet="/custom-cakes/banner-desktop.webp" width={1800} height={600} />
          <img
            src="/custom-cakes/banner-mobile.webp"
            alt=""
            width={900}
            height={600}
            className="block h-auto w-full"
          />
        </picture>
        <div className="flex flex-col justify-center px-4 py-4 lg:absolute lg:inset-y-0 lg:left-0 lg:w-[44%] lg:px-8 lg:py-5 xl:px-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-600">CUSTOM CAKES, MADE FOR YOU</p>
          <h2 id={titleId} className="mt-1.5 font-display text-[27px] font-bold leading-[1.12] text-maroon-900 lg:mt-2 lg:text-[1.85rem] lg:leading-[1.08] xl:text-[2.15rem]">
            Your Celebration, Your
            <br />
            Cake
          </h2>
          <p className="mt-2 text-sm leading-snug text-maroon-800/90">
            From birthdays to weddings, let us create a cake around your favourite theme.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              ref={inquiryButtonRef}
              type="button"
              onClick={() => openInquiry(null, "page")}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-maroon-800 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-maroon-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon-700 sm:w-auto"
            >
              Custom Cake Inquiry
              <span aria-hidden="true">{"\u2192"}</span>
            </button>
            <button
              ref={galleryButtonRef}
              type="button"
              onClick={() => openGallery()}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-maroon-800 bg-white/90 px-5 text-sm font-semibold text-maroon-800 transition hover:bg-gold-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon-700 sm:w-auto"
            >
              View Cake Designs
            </button>
          </div>
          <div className="mt-3">
            <p className="text-sm leading-snug text-maroon-800">Have a design in mind? Share it with us on WhatsApp.</p>
          </div>
        </div>
      </div>

      {panel ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-maroon-900/50 p-4 sm:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              if (panel === "inquiry") closeInquiry();
              else closeGallery();
            }
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={panel === "inquiry" ? inquiryTitleId : galleryTitleId}
            tabIndex={-1}
            className={`max-h-[min(90vh,44rem)] w-full overflow-y-auto rounded-3xl bg-[#fff8f0] p-5 shadow-xl outline-none sm:p-6 ${panel === "gallery" ? "max-w-3xl" : "max-w-lg"}`}
          >
            {panel === "gallery" ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <h2 id={galleryTitleId} className="font-display text-2xl font-bold text-maroon-900">
                    Cake designs
                  </h2>
                  <button
                    type="button"
                    onClick={closeGallery}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-maroon-800 hover:bg-gold-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon-700"
                    aria-label="Close cake designs"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                  {CAKE_DESIGNS.map((design) => (
                    <li key={design.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gold-100">
                      <img src={design.src} alt={design.alt} width={design.width} height={design.height} className="aspect-square w-full bg-[#fff8f0] object-contain" />
                      <div className="p-3">
                        <p className="font-display text-sm font-semibold text-maroon-900">{design.title}</p>
                        <button
                          ref={(node) => {
                            designButtonRefs.current[design.id] = node;
                          }}
                          type="button"
                          onClick={() => openInquiry(design.id, "gallery")}
                          className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-maroon-800 px-3 text-sm font-semibold text-white transition hover:bg-maroon-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon-700"
                        >
                          Inquire About This Design
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <h2 id={inquiryTitleId} className="font-display text-2xl font-bold text-maroon-900">
                    Custom cake inquiry
                  </h2>
                  <button
                    type="button"
                    onClick={closeInquiry}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-maroon-800 hover:bg-gold-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon-700"
                    aria-label="Close inquiry"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                {selectedDesign ? (
                  <p className="mt-3 rounded-xl bg-gold-50 px-3 py-2 text-sm text-maroon-800 ring-1 ring-gold-200">
                    Design reference: {selectedDesign.title}
                  </p>
                ) : null}
                <form className="mt-4 space-y-4" onSubmit={(event) => event.preventDefault()}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <label htmlFor="cake-occasion" className="text-sm font-semibold text-maroon-800">
                        Occasion
                      </label>
                      <select
                        id="cake-occasion"
                        value={form.occasion}
                        onChange={(event) => update("occasion", event.target.value)}
                        aria-invalid={errors.occasion ? true : undefined}
                        aria-describedby={errors.occasion ? "cake-occasion-error" : undefined}
                        className={`${fieldClass} min-w-0`}
                      >
                        <option value="">Select</option>
                        {OCCASIONS.map((occasion) => (
                          <option key={occasion} value={occasion}>
                            {occasion}
                          </option>
                        ))}
                      </select>
                      {form.occasion === "Other" ? (
                        <input
                          value={form.occasionOther}
                          onChange={(event) => update("occasionOther", event.target.value)}
                          aria-label="Occasion name"
                          className={fieldClass}
                        />
                      ) : null}
                      {errors.occasion ? (
                        <p id="cake-occasion-error" className="mt-1 text-sm text-red-700">
                          {errors.occasion}
                        </p>
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <label htmlFor="cake-date" className="text-sm font-semibold text-maroon-800">
                        Date needed
                      </label>
                      <input
                        id="cake-date"
                        type="date"
                        value={form.date}
                        min={today || undefined}
                        onChange={(event) => update("date", event.target.value)}
                        aria-invalid={errors.date ? true : undefined}
                        aria-describedby={errors.date ? "cake-date-error" : undefined}
                        className={`${fieldClass} min-w-0`}
                      />
                      {errors.date ? (
                        <p id="cake-date-error" className="mt-1 text-sm text-red-700">
                          {errors.date}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="cake-size" className="text-sm font-semibold text-maroon-800">
                      Size
                    </label>
                    <select
                      id="cake-size"
                      value={form.size}
                      onChange={(event) => update("size", event.target.value)}
                      aria-invalid={errors.size ? true : undefined}
                      aria-describedby={errors.size ? "cake-size-error" : undefined}
                      className={fieldClass}
                    >
                      <option value="">Select</option>
                      {SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    {form.size === "Custome" ? (
                      <input
                        id="cake-size-custom"
                        value={form.sizeCustom}
                        onChange={(event) => update("sizeCustom", event.target.value)}
                        aria-label="Custom size"
                        placeholder="Type the size"
                        aria-invalid={errors.size ? true : undefined}
                        className={fieldClass}
                      />
                    ) : null}
                    {errors.size ? (
                      <p id="cake-size-error" className="mt-1 text-sm text-red-700">
                        {errors.size}
                      </p>
                    ) : null}
                  </div>
                  <fieldset aria-describedby={errors.flavour ? "cake-flavour-error" : undefined}>
                    <legend className="text-sm font-semibold text-maroon-800">Preferred flavours</legend>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div className="min-w-0">
                        <label htmlFor="cake-flavour-standard" className="text-xs font-semibold text-maroon-800">
                          Standard
                        </label>
                        <select
                          id="cake-flavour-standard"
                          value={form.standardFlavour}
                          onChange={(event) => update("standardFlavour", event.target.value)}
                          aria-invalid={errors.flavour ? true : undefined}
                          className={`${fieldClass} min-w-0`}
                        >
                          <option value="">Select</option>
                          {STANDARD_FLAVOURS.map((flavour) => (
                            <option key={flavour} value={flavour}>
                              {flavour}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="min-w-0">
                        <label htmlFor="cake-flavour-special" className="text-xs font-semibold text-maroon-800">
                          Special
                        </label>
                        <select
                          id="cake-flavour-special"
                          value={form.specialFlavour}
                          onChange={(event) => update("specialFlavour", event.target.value)}
                          aria-invalid={errors.flavour ? true : undefined}
                          className={`${fieldClass} min-w-0`}
                        >
                          <option value="">Select</option>
                          {SPECIAL_FLAVOURS.map((flavour) => (
                            <option key={flavour} value={flavour}>
                              {flavour}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {errors.flavour ? (
                      <p id="cake-flavour-error" className="mt-1 text-sm text-red-700">
                        {errors.flavour}
                      </p>
                    ) : null}
                  </fieldset>
                  <div>
                    <label htmlFor="cake-notes" className="text-sm font-semibold text-maroon-800">
                      Design notes
                    </label>
                    <textarea
                      id="cake-notes"
                      value={form.notes}
                      onChange={(event) => update("notes", event.target.value)}
                      rows={3}
                      className={fieldClass}
                    />
                  </div>
                  <a
                    href={whatsappHref}
                    target={formReady ? "_blank" : undefined}
                    rel={formReady ? "noreferrer" : undefined}
                    onClick={continueOnWhatsApp}
                    onAuxClick={(event) => {
                      if (!formReady) {
                        event.preventDefault();
                        return;
                      }
                      closeInquiry();
                    }}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-gold-500 px-5 text-sm font-semibold text-maroon-900 transition hover:bg-gold-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon-700"
                  >
                    Continue on WhatsApp
                  </a>
                </form>
              </>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
