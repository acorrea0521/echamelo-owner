import { LegalDocument } from "@/components/marketing/LegalDocument";
import { privacyEs, privacyEn } from "@/lib/legal-content";

export default function PrivacyPage() {
  return <LegalDocument es={privacyEs} en={privacyEn} />;
}
