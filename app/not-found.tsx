import { BrandLogo } from "@/components/BrandLogo";

export default function NotFound() {
  return (
    <div className="p-6 sm:p-10 max-w-lg">
      <BrandLogo size="sm" className="max-h-7 mb-3" />
      <h1 className="text-[22px] font-semibold mt-1">Page introuvable</h1>
      <p className="text-muted mt-2">Cet écran n’existe pas. Revenez à l’accueil pour continuer.</p>
    </div>
  );
}
