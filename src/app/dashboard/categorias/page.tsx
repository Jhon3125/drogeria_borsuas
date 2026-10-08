import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import {
    ROLES_CONSULTA_CATALOGO,
    ROLES_GESTION_CATALOGO,
} from "@/lib/permisos";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CategoriaDialog } from "./categoria-dialog";
import { EliminarCategoria } from "./eliminar-categoria";

export default async function CategoriasPage() {
    const usuario = await exigirRol(ROLES_CONSULTA_CATALOGO);
    const puedeGestionar = ROLES_GESTION_CATALOGO.includes(usuario.rol);

    const categorias = await prisma.categoria.findMany({
        orderBy: { nombre: "asc" },
        include: { _count: { select: { productos: true } } },
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Categorías</h1>
                {puedeGestionar && <CategoriaDialog />}
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Productos</TableHead>
                        {puedeGestionar && <TableHead className="text-right">Acciones</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {categorias.length === 0 && (
                        <TableRow>
                            <TableCell
                                colSpan={puedeGestionar ? 4 : 3}
                                className="text-center text-muted-foreground"
                            >
                                Aún no hay categorías registradas.
                            </TableCell>
                        </TableRow>
                    )}
                    {categorias.map((c) => (
                        <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.nombre}</TableCell>
                            <TableCell className="text-muted-foreground">
                                {c.descripcion ?? "—"}
                            </TableCell>
                            <TableCell>{c._count.productos}</TableCell>
                            {puedeGestionar && (
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <CategoriaDialog
                                            categoria={{
                                                id: c.id,
                                                nombre: c.nombre,
                                                descripcion: c.descripcion ?? "",
                                            }}
                                        />
                                        <EliminarCategoria id={c.id} nombre={c.nombre} />
                                    </div>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}