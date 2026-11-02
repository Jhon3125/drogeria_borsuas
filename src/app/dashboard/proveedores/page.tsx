
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import {
    ROLES_COMPRAS_LECTURA,
    ROLES_COMPRAS_GESTION,
} from "@/lib/compras-roles";
import { DirectorioProveedores } from "./directorio";

export default async function ProveedoresPage() {
    const usuario = await exigirRol(ROLES_COMPRAS_LECTURA);

    const puedeGestionar = ROLES_COMPRAS_GESTION.includes(
        usuario.rol
    );

    const proveedores = await prisma.proveedor.findMany({
        orderBy: {
            razonSocial: "asc",
        },
        select: {
            id: true,
            razonSocial: true,
            ruc: true,
            contacto: true,
            telefono: true,
            correo: true,
            direccion: true,
            estado: true,
            _count: {
                select: {
                    compras: true,
                },
            },
        },
    });

    return (
        <main className="space-y-6 p-4 md:p-6">
            <DirectorioProveedores
                proveedores={proveedores}
                puedeGestionar={puedeGestionar}
            />
        </main>
    );
}
