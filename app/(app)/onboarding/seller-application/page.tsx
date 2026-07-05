import { SellerApplicationWizard } from "@/components/seller/SellerApplicationWizard";

export default function SellerApplicationPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-1 text-center">
        <span className="text-lg font-black tracking-tight text-primary">¡ECHAMELO!</span>
        <h1 className="text-xl font-bold">Solicitud de vendedor</h1>
        <p className="text-sm text-muted-foreground">
          Completa tu perfil para poder transmitir y vender en vivo.
        </p>
      </div>

      <SellerApplicationWizard />
    </div>
  );
}
