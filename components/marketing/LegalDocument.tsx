"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { LegalDoc } from "@/lib/legal-content";
import { cn } from "@/lib/utils";

export function LegalDocument({ es, en }: { es: LegalDoc; en: LegalDoc }) {
  const [lang, setLang] = useState<"es" | "en">("es");
  const doc = lang === "es" ? es : en;

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-foreground/80"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex rounded-full border border-border bg-surface p-1 text-xs font-semibold">
          <button
            onClick={() => setLang("es")}
            className={cn(
              "rounded-full px-3 py-1 transition-colors",
              lang === "es" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            ES
          </button>
          <button
            onClick={() => setLang("en")}
            className={cn(
              "rounded-full px-3 py-1 transition-colors",
              lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            EN
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{doc.title}</h1>
        <p className="text-xs text-muted-foreground">{doc.version}</p>
        <p className="text-xs text-muted-foreground">{doc.updated}</p>
      </div>

      <div className="flex flex-col gap-3 text-sm leading-relaxed text-foreground/85">
        {doc.intro.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {doc.callout && (
        <div className="rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm leading-relaxed text-foreground/90">
          {doc.callout}
        </div>
      )}

      <ol className="flex flex-col gap-6">
        {doc.sections.map((section, i) => (
          <li key={i} className="flex flex-col gap-2">
            <h2 className="text-base font-bold">
              <span className="text-primary">{i + 1}. </span>
              {section.heading}
            </h2>
            {section.body.map((p, j) => (
              <p key={j} className="text-sm leading-relaxed text-foreground/80">
                {p}
              </p>
            ))}
          </li>
        ))}
      </ol>
    </div>
  );
}
