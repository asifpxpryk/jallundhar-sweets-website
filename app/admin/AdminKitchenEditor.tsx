"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import AdminNav from "./AdminNav";
import { saveLiveKitchen, uploadKitchenPhoto } from "./kitchenActions";
import KitchenArt from "@/components/KitchenArt";
import { withCompressedPhoto } from "@/lib/compressImage";
import {
  KITCHEN_TAGS,
  PIZZA_SIZE_TEMPLATE,
  kitchenHoursLabel,
  type KitchenConfig,
  type KitchenGroup,
  type KitchenItem,
  type KitchenTag,
} from "@/lib/liveKitchen";

const SAVED_KEY = "jallundhar-kitchen-saved-at";
const SAVED_TEXT = "Saved. The Live Kitchen page now shows this menu.";

const TIMES = Array.from({ length: 48 }, (_, index) => index / 2);

function timeLabel(time: number) {
  return kitchenHoursLabel({ open: time, close: time }).split(" – ")[0];
}

const input =
  "w-full rounded-lg border border-gold-200 bg-white px-2.5 py-2 text-sm text-maroon-900 outline-none focus:border-maroon-500";
const label = "block text-[11px] font-semibold uppercase tracking-wide text-maroon-700/70";
const smallButton =
  "rounded-lg border border-gold-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-maroon-800 transition hover:bg-gold-50 disabled:opacity-40";

function PriceInput({ value, onChange, name }: { value: number; onChange: (value: number) => void; name: string }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-maroon-700/60">Rs.</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        step={10}
        aria-label={name}
        value={value === 0 ? "" : value}
        placeholder="0"
        onChange={(event) => onChange(Math.max(0, Math.round(Number(event.target.value) || 0)))}
        className={`${input} pl-9`}
      />
    </div>
  );
}

function ItemEditor({
  item,
  group,
  first,
  last,
  onChange,
  onMove,
  onRemove,
}: {
  item: KitchenItem;
  group: KitchenGroup;
  first: boolean;
  last: boolean;
  onChange: (next: KitchenItem) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setPhotoError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("photo", file);
      const result = await uploadKitchenPhoto(await withCompressedPhoto(formData));
      if (result.url) onChange({ ...item, image: result.url });
      else setPhotoError(result.error || "Photo could not be uploaded.");
    } catch {
      setPhotoError("Photo could not be uploaded.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <li className={`rounded-2xl border bg-white p-3 sm:p-4 ${item.hidden ? "border-maroon-200 opacity-70" : "border-gold-200"}`}>
      <div className="flex gap-3">
        <div className="flex w-20 shrink-0 flex-col items-center gap-1.5">
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-[#1c0c09]">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt="" className="h-[4.5rem] w-[4.5rem] object-contain" />
            ) : (
              <KitchenArt kind={group.key} className="h-14 w-14" />
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => pickPhoto(event.target.files?.[0])}
          />
          <button type="button" className={`${smallButton} w-full`} disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? "Uploading…" : item.image ? "Change photo" : "Add photo"}
          </button>
          {item.image ? (
            <button type="button" className="text-[11px] text-maroon-700/70 underline" onClick={() => onChange({ ...item, image: undefined })}>
              Remove photo
            </button>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <label className={label}>
              Name
              <input
                className={`${input} mt-1 font-semibold`}
                value={item.name}
                maxLength={80}
                onChange={(event) => onChange({ ...item, name: event.target.value })}
              />
            </label>
          </div>
          <div>
            <label className={label}>
              Short description
              <input
                className={`${input} mt-1`}
                value={item.description}
                maxLength={200}
                onChange={(event) => onChange({ ...item, description: event.target.value })}
              />
            </label>
          </div>

          {item.sizes ? (
            <div className="grid grid-cols-3 gap-2">
              {item.sizes.map((size, index) => (
                <div key={size.key}>
                  <span className={label}>{size.label}</span>
                  <div className="mt-1">
                    <PriceInput
                      name={`${item.name} ${size.label} price`}
                      value={size.price}
                      onChange={(price) =>
                        onChange({
                          ...item,
                          sizes: item.sizes!.map((entry, at) => (at === index ? { ...entry, price } : entry)),
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-[10rem]">
              <span className={label}>Price</span>
              <div className="mt-1">
                <PriceInput name={`${item.name} price`} value={item.price ?? 0} onChange={(price) => onChange({ ...item, price })} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-end gap-2">
            <label className={label}>
              Badge
              <select
                className={`${input} mt-1 w-auto`}
                value={item.tag ?? ""}
                onChange={(event) => onChange({ ...item, tag: (event.target.value || undefined) as KitchenTag | undefined })}
              >
                <option value="">None</option>
                {KITCHEN_TAGS.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className={smallButton} onClick={() => onChange({ ...item, hidden: !item.hidden })}>
              {item.hidden ? "Hidden — show it" : "Hide from customers"}
            </button>
            <button type="button" className={smallButton} disabled={first} onClick={() => onMove(-1)} aria-label={`Move ${item.name} up`}>
              ↑
            </button>
            <button type="button" className={smallButton} disabled={last} onClick={() => onMove(1)} aria-label={`Move ${item.name} down`}>
              ↓
            </button>
            <button
              type="button"
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-700 underline"
              onClick={() => {
                if (window.confirm(`Delete "${item.name}" from the Live Kitchen menu?`)) onRemove();
              }}
            >
              Delete
            </button>
          </div>
          {photoError ? <p className="text-xs text-red-700">{photoError}</p> : null}
        </div>
      </div>
    </li>
  );
}

export default function AdminKitchenEditor({ initial }: { initial: KitchenConfig }) {
  const [config, setConfig] = useState<KitchenConfig>(initial);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, startSaving] = useTransition();

  // Saving refreshes this page's data, which can remount the editor; show the confirmation anyway.
  useEffect(() => {
    try {
      const savedAt = Number(sessionStorage.getItem(SAVED_KEY) || 0);
      if (savedAt && Date.now() - savedAt < 8000) setMessage({ text: SAVED_TEXT, ok: true });
      sessionStorage.removeItem(SAVED_KEY);
    } catch {
      /* private mode */
    }
  }, []);

  function update(next: KitchenConfig) {
    setConfig(next);
    setDirty(true);
    setMessage(null);
  }

  function updateGroup(key: KitchenGroup["key"], change: (group: KitchenGroup) => KitchenGroup) {
    update({ ...config, groups: config.groups.map((group) => (group.key === key ? change(group) : group)) });
  }

  function addItem(group: KitchenGroup) {
    const item: KitchenItem = {
      id: `lk-${group.key}-${Date.now().toString(36)}`,
      name: "New item",
      description: "",
      ...(group.key === "pizza"
        ? { sizes: PIZZA_SIZE_TEMPLATE.map((size) => ({ ...size, price: 0 })) }
        : { price: 0 }),
      hidden: true,
    };
    updateGroup(group.key, (current) => ({ ...current, items: [...current.items, item] }));
  }

  function save() {
    startSaving(async () => {
      const result = await saveLiveKitchen(JSON.stringify(config));
      if (result.error) {
        setMessage({ text: result.error, ok: false });
        return;
      }
      try {
        sessionStorage.setItem(SAVED_KEY, String(Date.now()));
      } catch {
        /* private mode */
      }
      setDirty(false);
      setMessage({ text: SAVED_TEXT, ok: true });
    });
  }

  return (
    <div className="pb-24">
      <AdminNav active="kitchen" />

      <div className="mt-6">
        <h1 className="font-display text-2xl font-bold text-maroon-800">Live Kitchen</h1>
      </div>

      <section className="mt-5 rounded-2xl border border-gold-200 bg-white p-4">
        <h2 className="font-display text-lg font-bold text-maroon-800">Kitchen timing</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className={label}>
            Opens
            <select
              className={`${input} mt-1 w-auto`}
              value={config.hours.open}
              onChange={(event) => update({ ...config, hours: { ...config.hours, open: Number(event.target.value) } })}
            >
              {TIMES.map((time) => (
                <option key={time} value={time}>
                  {timeLabel(time)}
                </option>
              ))}
            </select>
          </label>
          <label className={label}>
            Closes
            <select
              className={`${input} mt-1 w-auto`}
              value={config.hours.close}
              onChange={(event) => update({ ...config, hours: { ...config.hours, close: Number(event.target.value) } })}
            >
              {TIMES.map((time) => (
                <option key={time} value={time}>
                  {timeLabel(time)}
                </option>
              ))}
            </select>
          </label>
          <p className="pb-2 text-sm text-maroon-800">
            Customers see: <span className="font-semibold">Daily {kitchenHoursLabel(config.hours)}</span>
          </p>
        </div>
      </section>

      {config.groups.map((group) => (
        <section key={group.key} className="mt-6">
          <div className="grid gap-2 sm:grid-cols-[14rem_1fr]">
            <label className={label}>
              Section name
              <input
                className={`${input} mt-1 font-display text-base font-bold`}
                value={group.name}
                maxLength={40}
                onChange={(event) => updateGroup(group.key, (current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className={label}>
              Line under the name
              <input
                className={`${input} mt-1`}
                value={group.tagline}
                maxLength={80}
                onChange={(event) => updateGroup(group.key, (current) => ({ ...current, tagline: event.target.value }))}
              />
            </label>
          </div>

          <ul className="mt-3 space-y-3">
            {group.items.map((item, index) => (
              <ItemEditor
                key={item.id}
                item={item}
                group={group}
                first={index === 0}
                last={index === group.items.length - 1}
                onChange={(next) =>
                  updateGroup(group.key, (current) => ({
                    ...current,
                    items: current.items.map((entry) => (entry.id === item.id ? next : entry)),
                  }))
                }
                onMove={(delta) =>
                  updateGroup(group.key, (current) => {
                    const items = [...current.items];
                    const target = index + delta;
                    if (target < 0 || target >= items.length) return current;
                    [items[index], items[target]] = [items[target], items[index]];
                    return { ...current, items };
                  })
                }
                onRemove={() =>
                  updateGroup(group.key, (current) => ({
                    ...current,
                    items: current.items.filter((entry) => entry.id !== item.id),
                  }))
                }
              />
            ))}
          </ul>
          <button type="button" className={`${smallButton} mt-3`} onClick={() => addItem(group)}>
            + Add item to {group.name || "this section"}
          </button>
        </section>
      ))}

      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-gold-200 bg-cream/95 px-4 py-3 backdrop-blur xl:bottom-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <p
            role="status"
            className={`text-sm ${message ? (message.ok ? "text-emerald-700" : "text-red-700") : "text-maroon-700/70"}`}
          >
            {message ? message.text : dirty ? "You have unsaved changes." : "No changes yet."}
          </p>
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="rounded-xl bg-maroon-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-maroon-800 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save Live Kitchen"}
          </button>
        </div>
      </div>
    </div>
  );
}
