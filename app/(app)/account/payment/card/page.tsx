"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PaymentMethodStep } from "@/components/auth/PaymentMethodStep";

export default function AccountPaymentCardPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <div className="flex items-center gap-3">
        <Link
          href="/account/payment"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-foreground/80"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-bold">Método de pago</h1>
      </div>

      <PaymentMethodStep
        onComplete={() => {
          router.push("/account/payment");
          router.refresh();
        }}
      />
    </div>
  );
}
