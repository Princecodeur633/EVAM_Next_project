"use client";

import { useParams } from "next/navigation";
import { FicheTechniqueWorkspace } from "@/components/FicheTechniqueWorkspace";

export default function FicheTechniqueDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <FicheTechniqueWorkspace selectedId={Number(id)} />;
}
