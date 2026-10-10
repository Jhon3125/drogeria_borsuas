
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import type { RolUsuario, EstadoUsuario } from "@/generated/prisma/enums";
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    FilterX,
    Search,
    ShieldCheck,
    Users,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ETIQUETA_ROL } from "@/lib/navegacion";
import { ESTADOS, ROLES } from "@/lib/validaciones/usuario";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { UsuarioDialog } from "./usuario-dialog";

type FiltrosUsuarios = {
    q?: string;
    rol?: string;
    est?: string;
    page?: string;
};

const claseFiltro =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10";

export default async function UsuariosPage({
    searchParams,
}: {
    searchParams: Promise<FiltrosUsuarios>;
}) {
    await exigirRol(["SUPER_ADMIN"]);

    const filtros = await searchParams;
    const query = (filtros.q ?? "").trim();
    const rolFiltro = filtros.rol ?? "";
    const estadoFiltro = filtros.est ?? "";

    // Conservamos los filtros existentes.
    const whereCondition: Prisma.UsuarioWhereInput = {};
    const numeroPagina = /^\d+$/.test(filtros.page ?? "") ? Number(filtros.page) : 1;
    const pagina = Number.isSafeInteger(numeroPagina) && numeroPagina > 0 ? Math.min(numeroPagina, 100000) : 1;
    const TAMANIO = 25;

    if (query) {
        whereCondition.OR = [
            { nombre: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
        ];
    }

    if (ROLES.includes(rolFiltro as RolUsuario)) {
        whereCondition.rol = rolFiltro as RolUsuario;
    }

    if (ESTADOS.includes(estadoFiltro as EstadoUsuario)) {
        whereCondition.estado = estadoFiltro as EstadoUsuario;
    }

    const [usuarios, totalUsuarios, activosCount, alertasCount, totalCoincidentes] =
        await Promise.all([
            prisma.usuario.findMany({
                where: whereCondition,
                select: {
                    id: true,
                    nombre: true,
                    email: true,
                    rol: true,
                    estado: true,
                    intentosFallidos: true,
                },
                orderBy: { creadoEn: "desc" },
                take: TAMANIO,
                skip: (pagina - 1) * TAMANIO,
            }),
            prisma.usuario.count(),
            prisma.usuario.count({
                where: { estado: "ACTIVO" },
            }),
            prisma.usuario.count({
                where: {
                    OR: [
                        { estado: "BLOQUEADO" },
                        { intentosFallidos: { gte: 3 } },
                    ],
                },
            }),
            prisma.usuario.count({ where: whereCondition }),
        ]);
    const totalPaginas = Math.max(1, Math.ceil(totalCoincidentes / TAMANIO));
    const urlPagina = (n: number) => {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (rolFiltro) params.set("rol", rolFiltro);
        if (estadoFiltro) params.set("est", estadoFiltro);
        if (n > 1) params.set("page", String(n));
        return `/dashboard/usuarios?${params.toString()}`;
    };

    const hayFiltros = Boolean(query || rolFiltro || estadoFiltro);

    const indicadores = [
        {
            titulo: "Total de cuentas",
            valor: totalUsuarios,
            descripcion: "Usuarios registrados",
            icono: Users,
            estiloIcono: "bg-blue-50 text-blue-600",
            estiloValor: "text-foreground",
        },
        {
            titulo: "Cuentas activas",
            valor: activosCount,
            descripcion: "Con acceso habilitado",
            icono: CheckCircle2,
            estiloIcono: "bg-emerald-50 text-emerald-600",
            estiloValor: "text-foreground",
        },
        {
            titulo: "Cuentas con alerta",
            valor: alertasCount,
            descripcion: "Bloqueos o intentos fallidos elevados",
            icono: AlertTriangle,
            estiloIcono: "bg-amber-50 text-amber-600",
            estiloValor: "text-foreground",
        },
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-7">
            {/* Encabezado */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Administración</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="font-medium text-foreground">
                        Usuarios y Accesos
                    </span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            Usuarios y Accesos
                        </h1>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                            Administra las cuentas, roles y seguridad de
                            acceso al sistema.
                        </p>
                    </div>

                    <div className="shrink-0">
                        <UsuarioDialog />
                    </div>
                </div>
            </section>

            {/* Indicadores */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {indicadores.map((indicador) => {
                    const Icono = indicador.icono;

                    return (
                        <div
                            key={indicador.titulo}
                            className="rounded-xl border bg-card p-5 shadow-xs"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <p className="text-sm font-medium text-muted-foreground">
                                    {indicador.titulo}
                                </p>
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${indicador.estiloIcono}`}
                                >
                                    <Icono className="h-5 w-5" />
                                </div>
                            </div>

                            <p
                                className={`mt-3 text-3xl font-bold tracking-tight ${indicador.estiloValor}`}
                            >
                                {indicador.valor}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                                {indicador.descripcion}
                            </p>
                        </div>
                    );
                })}
            </section>

            {/* Listado */}
            <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
                <div className="border-b px-5 py-5 sm:px-6">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <h2 className="text-base font-semibold">
                            Directorio de usuarios
                        </h2>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Consulta las cuentas y administra sus permisos.
                    </p>

                    {/* Filtros propios del módulo */}
                    <form
                        action="/dashboard/usuarios"
                        method="GET"
                        className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]"
                    >
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="search"
                                name="q"
                                aria-label="Buscar usuarios"
                                placeholder="Buscar por nombre o correo..."
                                defaultValue={query}
                                className={`${claseFiltro} pl-9`}
                            />
                        </div>

                        <select
                            name="rol"
                            aria-label="Filtrar por rol"
                            defaultValue={rolFiltro}
                            className={claseFiltro}
                        >
                            <option value="">Todos los roles</option>
                            {ROLES.map((rol) => (
                                <option key={rol} value={rol}>
                                    {ETIQUETA_ROL[rol]}
                                </option>
                            ))}
                        </select>

                        <select
                            name="est"
                            aria-label="Filtrar por estado"
                            defaultValue={estadoFiltro}
                            className={claseFiltro}
                        >
                            <option value="">Todos los estados</option>
                            {ESTADOS.map((estado) => (
                                <option key={estado} value={estado}>
                                    {estado}
                                </option>
                            ))}
                        </select>

                        <Button type="submit" className="h-10">
                            <Search className="mr-2 h-4 w-4" />
                            Buscar
                        </Button>
                    </form>

                    {hayFiltros && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground">
                                Mostrando {usuarios.length} resultado(s)
                            </p>

                            <Link
                                href="/dashboard/usuarios"
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                            >
                                <FilterX className="h-3.5 w-3.5" />
                                Limpiar filtros
                            </Link>
                        </div>
                    )}
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40 hover:bg-muted/40">
                                <TableHead className="min-w-60 pl-6">
                                    Usuario
                                </TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-center">
                                    Intentos fallidos
                                </TableHead>
                                <TableHead className="pr-6 text-right">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {usuarios.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-64 text-center"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                                <Users className="h-6 w-6 text-muted-foreground" />
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold text-foreground">
                                                    No se encontraron usuarios
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {hayFiltros
                                                        ? "Prueba con otros criterios de búsqueda."
                                                        : "Todavía no hay cuentas registradas."}
                                                </p>
                                            </div>

                                            {hayFiltros && (
                                                <Link
                                                    href="/dashboard/usuarios"
                                                    className="text-sm font-medium text-primary hover:underline"
                                                >
                                                    Ver todos los usuarios
                                                </Link>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                usuarios.map((usuario) => {
                                    const iniciales = usuario.nombre
                                        .trim()
                                        .split(/\s+/)
                                        .slice(0, 2)
                                        .map((parte) => parte[0])
                                        .join("")
                                        .toUpperCase();

                                    const activo =
                                        usuario.estado === "ACTIVO";
                                    const bloqueado =
                                        usuario.estado === "BLOQUEADO";

                                    return (
                                        <TableRow
                                            key={usuario.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <TableCell className="py-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                        {iniciales || "U"}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="font-medium text-foreground">
                                                            {usuario.nombre}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            {usuario.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <span className="inline-flex rounded-md border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground">
                                                    {ETIQUETA_ROL[usuario.rol]}
                                                </span>
                                            </TableCell>

                                            <TableCell>
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${activo
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : bloqueado
                                                                ? "bg-red-50 text-red-700"
                                                                : "bg-slate-100 text-slate-700"
                                                        }`}
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${activo
                                                                ? "bg-emerald-500"
                                                                : bloqueado
                                                                    ? "bg-red-500"
                                                                    : "bg-slate-500"
                                                            }`}
                                                    />
                                                    {usuario.estado}
                                                </span>
                                            </TableCell>

                                            <TableCell className="text-center">
                                                {usuario.intentosFallidos >
                                                    0 ? (
                                                    <span className="inline-flex min-w-8 justify-center rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                                                        {usuario.intentosFallidos}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">
                                                        0
                                                    </span>
                                                )}
                                            </TableCell>

                                            <TableCell className="pr-6 text-right">
                                                <UsuarioDialog
                                                    usuario={usuario}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/10 px-6 py-3">
                    <p className="text-xs text-muted-foreground">
                        {usuarios.length} usuario(s) mostrados de {totalCoincidentes} coincidentes ({totalUsuarios} cuentas). Página {Math.min(pagina, totalPaginas)} de {totalPaginas}.
                    </p>
                    <nav aria-label="Páginas de usuarios" className="flex gap-2 text-sm">
                        {pagina > 1 && <Link className="rounded-lg border bg-white px-3 py-1.5" href={urlPagina(pagina - 1)}>Anterior</Link>}
                        {pagina < totalPaginas && <Link className="rounded-lg border bg-white px-3 py-1.5" href={urlPagina(pagina + 1)}>Siguiente</Link>}
                    </nav>
                </div>
            </section>
        </div>
    );
}
