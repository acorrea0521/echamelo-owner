import { LegalDocument } from "@/components/marketing/LegalDocument";
import { termsEs, termsEn } from "@/lib/legal-content";

export default function TermsPage() {
  return <LegalDocument es={termsEs} en={termsEn} />;
}
