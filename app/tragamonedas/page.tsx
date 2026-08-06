import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SlotMachine } from "@/components/slots/SlotMachine";

export const metadata: Metadata = {
  title: "Tragamonedas Granja — ECHAMELO",
  description:
    "Juego de tragamonedas con monedas virtuales. Gira, gana el jackpot y diviértete. Sin valor en efectivo.",
};

export default function TragamonedasPage() {
  return (
    <main className="min-h-dvh bg-background px-4 py-6">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-5 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Volver
          </Link>
          <h1 className="text-lg font-bold tracking-tight">
            🚜 Tragamonedas Granja
          </h1>
        </header>

        <SlotMachine />
      </div>
    </main>
  );
}
