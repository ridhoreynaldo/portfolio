import type { Field } from "@/modules/content/resources";

type Values = Record<string, unknown> | undefined;

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

/** Render form dari definisi Field[] (server component). */
export function FieldInputs({ fields, values, disabled }: { fields: Field[]; values?: Values; disabled?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        const v = values?.[f.name];
        const wide = f.type === "textarea" ? "sm:col-span-2" : "";
        if (f.type === "checkbox") {
          return (
            <label key={f.name} className="flex items-center gap-2 pt-6 text-sm text-slate-300">
              <input type="checkbox" name={f.name} defaultChecked={Boolean(v)} disabled={disabled} className="accent-violet-500" /> {f.label}
            </label>
          );
        }
        return (
          <div key={f.name} className={wide}>
            <label className="label" htmlFor={f.name}>{f.label}{f.required && " *"}</label>
            {f.type === "textarea" ? (
              <textarea id={f.name} name={f.name} rows={4} defaultValue={str(v)} required={f.required} disabled={disabled} placeholder={f.placeholder} className="input-dark" />
            ) : f.type === "select" ? (
              <select id={f.name} name={f.name} defaultValue={str(v)} disabled={disabled} className="input-dark">
                <option value="">—</option>
                {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                id={f.name}
                name={f.name}
                type={f.type === "url" ? "url" : f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                defaultValue={str(v)}
                required={f.required}
                disabled={disabled}
                min={f.min}
                max={f.max}
                placeholder={f.placeholder}
                className="input-dark"
              />
            )}
            {f.hint && <p className="mt-1 text-xs text-slate-500">{f.hint}</p>}
          </div>
        );
      })}
    </div>
  );
}

export function formatCell(v: unknown) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "✔" : "✘";
  if (v instanceof Date) return v.toLocaleDateString("id-ID");
  return String(v);
}
