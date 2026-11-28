import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import VehiculosClient from "./vehiculos-client";

export default async function VehiculosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await exigirRol(["SUPER_ADMIN", "ADMIN"]);

  const params = await searchParams;

  const vehiculos = await prisma.vehiculo.findMany({
    orderBy: { id: "desc" },
    include: {
      _count: {
        select: {
          hojasDeRuta: true,
        },
      },
    },
  });

  return (
    <VehiculosClient
      vehiculos={vehiculos}
      error={params.error ?? null}
    />
  );
}
