import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ETIQUETA_ROL } from "@/lib/navegacion";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { UsuarioDialog } from "./usuario-dialog";

export default async function UsuariosPage() {
    await exigirRol(["SUPER_ADMIN"]);

    const usuarios = await prisma.usuario.findMany({
        select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
            estado: true,
            intentosFallidos: true,
        },
        orderBy: { creadoEn: "desc" },
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Usuarios</h1>
                <UsuarioDialog />
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Correo</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Intentos fallidos</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {usuarios.map((u) => (
                        <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.nombre}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>{ETIQUETA_ROL[u.rol]}</TableCell>
                            <TableCell>
                                <Badge variant={u.estado === "ACTIVO" ? "default" : "destructive"}>
                                    {u.estado}
                                </Badge>
                            </TableCell>
                            <TableCell>{u.intentosFallidos}</TableCell>
                            <TableCell className="text-right">
                                <UsuarioDialog usuario={u} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}