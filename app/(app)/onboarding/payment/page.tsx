"use client";

import { useRouter } from "next/navigation";
import { PaymentMethodStep } from "@/components/auth/PaymentMethodStep";

export default function PaymentOnboardingPage() {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6">
      <div className="flex flex-col gap-1 text-center">
        <span className="text-lg font-black tracking-tight text-primary">¡ECHAMELO!</span>
        <h1 className="text-xl font-bold">Un último paso</h1>
        <p className="text-sm text-muted-foreground">
          Necesitas una tarjeta guardada antes de poder pujar.
        </p>
      </div>

      <PaymentMethodStep
        onComplete={() => {
          router.push("/home");
          router.refresh();
        }}
      />
    </div>
  );
}
