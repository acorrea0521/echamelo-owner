"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MX_STATES } from "@/lib/mx-states";

type ShippingAddress = {
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
};

const EMPTY: ShippingAddress = { fullName: "", line1: "", line2: "", city: "", state: "", postalCode: "", phone: "" };

export default function AccountShippingPage() {
  const router = useRouter();
  const [address, setAddress] = useState<ShippingAddress>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("default_shipping_address")
        .eq("id", user.id)
        .single();
      if (profile?.default_shipping_address) {
        setAddress({ ...EMPTY, ...(profile.default_shipping_address as Partial<ShippingAddress>) });
      }
    });
  }, []);

  function update<K extends keyof ShippingAddress>(key: K, value: ShippingAddress[K]) {
    setAddress((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ default_shipping_address: address })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      setStatus("No se pudo guardar la dirección.");
      return;
    }
    router.push("/account/payment");
    router.refresh();
  }

  const canSave = address.fullName.trim() && address.line1.trim() && address.city.trim() && address.state && address.postalCode.trim();

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <div className="flex items-center gap-3">
        <Link
          href="/account/payment"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-foreground/80"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-bold">Dirección de envío</h1>
      </div>

      <div className="flex flex-col gap-3">
        <Input
          value={address.fullName}
          onChange={(e) => update("fullName", e.target.value)}
          placeholder="Nombre completo"
          className="h-11"
        />
        <Input
          value={address.line1}
          onChange={(e) => update("line1", e.target.value)}
          placeholder="Calle y número"
          className="h-11"
        />
        <Input
          value={address.line2}
          onChange={(e) => update("line2", e.target.value)}
          placeholder="Colonia, referencias (opcional)"
          className="h-11"
        />
        <div className="flex gap-3">
          <Input
            value={address.city}
            onChange={(e) => update("city", e.target.value)}
            placeholder="Ciudad"
            className="h-11 flex-1"
          />
          <Input
            value={address.postalCode}
            onChange={(e) => update("postalCode", e.target.value)}
            placeholder="C.P."
            inputMode="numeric"
            className="h-11 w-28"
          />
        </div>
        <select
          value={address.state}
          onChange={(e) => update("state", e.target.value)}
          className="h-11 rounded-lg border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Estado</option>
          {MX_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        <Input
          value={address.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="Teléfono de contacto"
          inputMode="tel"
          className="h-11"
        />
      </div>

      {status && <p className="text-sm text-destructive">{status}</p>}

      <Button onClick={handleSave} disabled={!canSave || saving} className="h-11">
        {saving ? "Guardando..." : "Guardar dirección"}
      </Button>
    </div>
  );
}
