import { redirect } from "next/navigation";
import { usuarioVigente } from "@/lib/guard";

/** Landing según funciones habilitadas, sin quitar el dashboard general. */
export default async function InicioDashboard() {
  const { rol } = await usuarioVigente();
  switch (rol) {
    case "COMPRAS": redirect("/dashboard/compras");
    case "ALMACEN": redirect("/dashboard/inventario");
    case "COMERCIAL": redirect("/dashboard/clientes");
    default: redirect("/dashboard"); // Gerencia y Conductor: dashboard filtrado
  }
}
