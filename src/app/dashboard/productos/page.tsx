import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { formatoMoneda } from "@/lib/formato";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ProductoDialog } from "./producto-dialog";
import { FiltrosProductos } from "./filtros";
import { BotonCambiarEstado } from "./cambiar-estado";

export default async function ProductosPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; cat?: string; mon?: string; est?: string; page?: string }>;
}) {
    // 1. Validar permisos
    const usuario = await exigirRol(["SUPER_ADMIN", "ADMIN", "COMPRAS", "COMERCIAL"]);
    const puedeGestionar = ["SUPER_ADMIN", "ADMIN", "COMPRAS"].includes(usuario.rol);
    const puedeVerCostos = puedeGestionar;

    // 2. Extraer parámetros de búsqueda de la URL
    const filtros = await searchParams;
    const query = filtros?.q || "";
    const categoriaId = filtros?.cat ? Number(filtros.cat) : undefined;
    const monedaFiltro = filtros?.mon || "";
    const filtroEstado = filtros?.est || "activos";

    // 3. Construir la consulta "Where" para Prisma
    const whereCondition: any = {};

    if (query) {
        whereCondition.OR = [
            { nombre: { contains: query, mode: "insensitive" } },
            { codigo: { contains: query, mode: "insensitive" } },
        ];
    }

    if (categoriaId) {
        whereCondition.categoriaId = categoriaId;
    }

    if (monedaFiltro) {
        whereCondition.moneda = monedaFiltro; // <-- NUEVO: Filtra por PEN o USD
    }

    if (filtroEstado === "activos") whereCondition.estado = true;
    else if (filtroEstado === "inactivos") whereCondition.estado = false;

    // 4. Consultar Categorías (para el selector) y Productos (para la tabla)
    const categorias = await prisma.categoria.findMany({ orderBy: { nombre: "asc" } });

    const productos = await prisma.producto.findMany({
        where: whereCondition,
        orderBy: { id: "desc" },
        take: 15, // Paginación básica (Sprint 1)
        select: {
            id: true,
            codigo: true,
            nombre: true,
            descripcion: true,
            categoriaId: true,
            categoria: { select: { nombre: true } },
            unidadMedida: true,
            moneda: true,
            precioVenta: true,
            estado: true,
            stockMinimo: true,
            // Seguridad: El servidor NUNCA extrae de la BD el precio de compra si el rol es COMERCIAL
            ...(puedeVerCostos ? { precioCompra: true } : {}),
        }
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Catálogo de Productos</h1>
                {puedeGestionar && <ProductoDialog categorias={categorias} />}
            </div>

            <FiltrosProductos categorias={categorias} />

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead>Categoría / Unidad</TableHead>
                            {puedeVerCostos && <TableHead className="text-right">Costo</TableHead>}
                            <TableHead className="text-right">Precio Venta</TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                            {puedeGestionar && <TableHead className="text-right">Acciones</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {productos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                    No se encontraron productos.
                                </TableCell>
                            </TableRow>
                        ) : (
                            productos.map((p) => {
                                // 1. Cálculo para la alerta visual
                                const compra = puedeVerCostos ? Number(p.precioCompra) : 0;
                                const venta = Number(p.precioVenta);
                                const enPerdida = puedeVerCostos && !isNaN(compra) && !isNaN(venta) && venta < compra;

                                // 2. Aplanar el producto para evitar el error Decimal (SOLUCIÓN AQUÍ)
                                const productoPlano = {
                                    ...p,
                                    precioCompra: p.precioCompra?.toString(),
                                    precioVenta: p.precioVenta?.toString(),
                                };

                                return (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium whitespace-nowrap">{p.codigo}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{p.nombre}</div>
                                            {p.descripcion && (
                                                <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                                                    {p.descripcion}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{p.categoria.nombre}</div>
                                            <div className="text-xs text-muted-foreground">{p.unidadMedida}</div>
                                        </TableCell>

                                        {puedeVerCostos && (
                                            <TableCell className="text-right whitespace-nowrap">
                                                {formatoMoneda(p.precioCompra, p.moneda as any)}
                                            </TableCell>
                                        )}

                                        <TableCell className="text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                {enPerdida && (
                                                    <span className="flex h-2 w-2 rounded-full bg-amber-500" title="Venta bajo costo" />
                                                )}
                                                {formatoMoneda(p.precioVenta, p.moneda as any)}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <Badge variant={p.estado ? "default" : "secondary"}>
                                                {p.estado ? "Activo" : "Inactivo"}
                                            </Badge>
                                        </TableCell>

                                        {puedeGestionar && (
                                            <TableCell className="text-right whitespace-nowrap">
                                                {/* 3. Pasar el producto aplanado aquí */}
                                                <ProductoDialog producto={productoPlano as any} categorias={categorias} />
                                                <BotonCambiarEstado id={p.id} estadoActual={p.estado} />
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}