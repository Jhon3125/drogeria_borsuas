import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMERCIAL } from "@/lib/comercial-roles";
import { DirectorioClientes } from "./directorio";

export default async function ClientesPage() {
  await exigirRol(ROLES_COMERCIAL);

  const clientes = await prisma.cliente.findMany({
    orderBy: { razonSocial: "asc" },
    select: {
      id: true,
      razonSocial: true,
      documento: true,
      telefono: true,
      correo: true,
      direccion: true,
      estado: true,
      _count: { select: { ventas: true } },
    },
  });

  return (
    <main className="space-y-6 p-4 md:p-6">
      <DirectorioClientes clientes={clientes} />
    </main>
  );
}
