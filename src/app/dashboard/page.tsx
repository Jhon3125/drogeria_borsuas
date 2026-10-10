
import Link from "next/link";
import { redirect } from "next/navigation";
import {
    AlertTriangle,
    ArrowRight,
    Boxes,
    Building2,
    CheckCircle2,
    ClipboardList,
    CreditCard,
    FileText,
    LayoutDashboard,
    Package,
    PackageSearch,
    ShieldCheck,
    ShoppingCart,
    Tags,
    Truck,
    Users,
    Wallet,
    type LucideIcon,
} from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
    ETIQUETA_ROL,
    NAVEGACION,
    type IconoNav,
} from "@/lib/navegacion";

import type { RolUsuario } from "@/generated/prisma/enums";
import { MetricCard } from "@/components/dashboard/metric-card";

const ICONOS: Record<IconoNav, LucideIcon> = {
    dashboard: LayoutDashboard,
    users: Users,
    package: Package,
    tags: Tags,
    boxes: Boxes,
    building: Building2,
    "shopping-cart": ShoppingCart,
    "package-search": PackageSearch,
    "users-round": Users,
    "file-text": FileText,
};

const DESCRIPCIONES: Record<string, string> = {
    "/dashboard/productos":
        "Consulta y administra el catálogo de productos.",
    "/dashboard/categorias":
        "Organiza y clasifica los productos.",
    "/dashboard/inventario":
        "Accede a la gestión de existencias.",
    "/dashboard/clientes": "Gestiona clientes y sus datos comerciales.",
    "/dashboard/cotizaciones": "Crea cotizaciones sin afectar existencias.",
    "/dashboard/ventas": "Consulta la evolución comercial de las oportunidades.",
    "/dashboard/usuarios":
        "Gestiona las cuentas, roles y accesos.",
};

type MetricaFutura = {
    titulo: string;
    descripcion: string;
    icono: LucideIcon;
};

const METRICAS_VENTAS: MetricaFutura[] = [
    {
        titulo: "Ventas del mes",
        descripcion: "Importe acumulado del mes actual",
        icono: Wallet,
    },
    {
        titulo: "Ventas realizadas",
        descripcion: "Operaciones comerciales confirmadas",
        icono: ShoppingCart,
    },
    {
        titulo: "Cotizaciones pendientes",
        descripcion: "Cotizaciones por atender",
        icono: FileText,
    },
    {
        titulo: "Cuentas por cobrar",
        descripcion: "Saldo pendiente de clientes",
        icono: CreditCard,
    },
];

const METRICAS_LOGISTICA: MetricaFutura[] = [
    {
        titulo: "Despachos pendientes",
        descripcion: "Pedidos pendientes de despacho",
        icono: Package,
    },
    {
        titulo: "Despachos en ruta",
        descripcion: "Entregas actualmente en proceso",
        icono: Truck,
    },
    {
        titulo: "Entregas completadas",
        descripcion: "Despachos finalizados",
        icono: CheckCircle2,
    },
    {
        titulo: "Incidencias de entrega",
        descripcion: "Despachos con observaciones",
        icono: AlertTriangle,
    },
];

function SeccionFutura({
    titulo,
    descripcion,
    icono: Icono,
    metricas,
}: {
    titulo: string;
    descripcion: string;
    icono: LucideIcon;
    metricas: MetricaFutura[];
}) {
    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icono className="h-5 w-5" />
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold">
                            {titulo}
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                            {descripcion}
                        </p>
                    </div>
                </div>

                <span className="rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                    En desarrollo
                </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metricas.map((metrica) => (
                    <MetricCard
                        key={metrica.titulo}
                        titulo={metrica.titulo}
                        descripcion={metrica.descripcion}
                        icono={metrica.icono}
                        pendiente
                    />
                ))}
            </div>
        </section>
    );
}

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const rol: RolUsuario = session.user.rol;
    const nombre = session.user.name ?? "Usuario";

    const esSuperAdmin = rol === "SUPER_ADMIN";

    const puedeVerCatalogo = (
        ["SUPER_ADMIN", "ADMIN", "COMPRAS", "COMERCIAL"] as RolUsuario[]
    ).includes(rol);

    const puedeVerVentas = (
        ["SUPER_ADMIN", "ADMIN", "COMERCIAL"] as RolUsuario[]
    ).includes(rol);

    const puedeVerLogistica = (
        ["SUPER_ADMIN", "ADMIN", "ALMACEN", "CONDUCTOR"] as RolUsuario[]
    ).includes(rol);

    const modulos = NAVEGACION.filter(
        (item) =>
            item.href !== "/dashboard" &&
            item.roles.includes(rol)
    );

    // Solo consultamos los datos que el usuario puede visualizar.
    const [totalProductos, productosActivos, totalCategorias, totalUsuarios] =
        await Promise.all([
            puedeVerCatalogo
                ? prisma.producto.count()
                : Promise.resolve(null),

            puedeVerCatalogo
                ? prisma.producto.count({
                    where: { estado: true },
                })
                : Promise.resolve(null),

            puedeVerCatalogo
                ? prisma.categoria.count()
                : Promise.resolve(null),

            esSuperAdmin
                ? prisma.usuario.count()
                : Promise.resolve(null),
        ]);

    return (
        <div className="mx-auto max-w-7xl space-y-9 pb-6">
            {/* Encabezado */}

            {/* Bienvenida corporativa */}
            <section className="relative overflow-hidden rounded-2xl bg-[#123E70] p-6 text-white shadow-md sm:p-8">
                {/* Elementos decorativos */}
                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#087EBD]/35" />
                <div className="pointer-events-none absolute -bottom-24 right-20 h-56 w-56 rounded-full bg-[#238B55]/25" />

                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
                            <LayoutDashboard className="h-3.5 w-3.5" />
                            Dashboard empresarial
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Bienvenido, {nombre}
                        </h1>

                        <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/85">
                            Consulta los indicadores y accede a las herramientas
                            de gestión de Droguería Borsuas.
                        </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 self-start rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
                        <ShieldCheck className="h-5 w-5 text-emerald-300" />

                        <div>
                            <p className="text-xs text-blue-100/75">
                                Rol de acceso
                            </p>

                            <p className="text-sm font-semibold text-white">
                                {ETIQUETA_ROL[rol]}
                            </p>
                        </div>
                    </div>
                </div>
            </section>


            {/* Resumen general */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">
                        Resumen general
                    </h2>

                    <p className="text-sm text-muted-foreground">
                        Indicadores actuales del sistema.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        titulo="Módulos disponibles"
                        valor={modulos.length}
                        descripcion="Módulos habilitados para tu rol"
                        icono={LayoutDashboard}
                        color="blue"
                    />

                    {esSuperAdmin && (
                        <MetricCard
                            titulo="Usuarios registrados"
                            valor={totalUsuarios}
                            descripcion="Cuentas registradas en el ERP"
                            icono={Users}
                            color="violet"
                            href="/dashboard/usuarios"
                        />
                    )}

                    {puedeVerCatalogo && (
                        <>
                            <MetricCard
                                titulo="Productos registrados"
                                valor={totalProductos}
                                descripcion="Productos en el catálogo"
                                icono={Package}
                                color="blue"
                                href="/dashboard/productos"
                            />

                            <MetricCard
                                titulo="Productos activos"
                                valor={productosActivos}
                                descripcion="Productos habilitados"
                                icono={CheckCircle2}
                                color="green"
                                href="/dashboard/productos"
                            />

                            <MetricCard
                                titulo="Categorías"
                                valor={totalCategorias}
                                descripcion="Categorías registradas"
                                icono={Tags}
                                color="violet"
                                href="/dashboard/categorias"
                            />
                        </>
                    )}
                </div>
            </section>

            {/* Accesos rápidos */}
            <section className="space-y-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ClipboardList className="h-5 w-5" />
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold">
                            Accesos rápidos
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Ingresa directamente a tus módulos de trabajo.
                        </p>
                    </div>
                </div>

                {modulos.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {modulos.map((modulo) => {
                            const Icono = ICONOS[modulo.icono];

                            return (
                                <Link
                                    key={modulo.href}
                                    href={modulo.href}
                                    className="group flex min-h-44 flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-[#F7FBFF] hover:shadow-md"
                                >
                                    <div>
                                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#E1F0FC] text-[#087EBD] transition-colors group-hover:bg-primary group-hover:text-white">
                                            <Icono className="h-5 w-5" />
                                        </div>

                                        <h3 className="text-sm font-semibold">
                                            {modulo.titulo}
                                        </h3>

                                        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                                            {DESCRIPCIONES[modulo.href] ??
                                                "Accede a este módulo del sistema."}
                                        </p>
                                    </div>

                                    <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary">
                                        Ir al módulo
                                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                        No tienes módulos adicionales habilitados.
                    </div>
                )}
            </section>

            {/* Inventario: reservado para Sprint 1 */}
            {NAVEGACION.some(
                (item) =>
                    item.href === "/dashboard/inventario" &&
                    item.roles.includes(rol)
            ) && (
                    <section className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Boxes className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold">
                                    Inventario y stock
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Indicadores que conectaremos durante
                                    el desarrollo de Inventario.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <MetricCard
                                titulo="Unidades disponibles"
                                descripcion="Existencias disponibles en lotes"
                                icono={Boxes}
                                pendiente
                            />

                            <MetricCard
                                titulo="Productos con stock bajo"
                                descripcion="Existencias por debajo del mínimo"
                                icono={AlertTriangle}
                                pendiente
                            />

                            <MetricCard
                                titulo="Productos agotados"
                                descripcion="Sin unidades disponibles"
                                icono={Package}
                                pendiente
                            />

                            <MetricCard
                                titulo="Próximos a vencer"
                                descripcion="Lotes próximos a su vencimiento"
                                icono={AlertTriangle}
                                pendiente
                            />
                        </div>
                    </section>
                )}

            {/* Ventas */}
            {puedeVerVentas && (
                <SeccionFutura
                    titulo="Área comercial y ventas"
                    descripcion="Indicadores comerciales que se activarán con los módulos correspondientes."
                    icono={ShoppingCart}
                    metricas={METRICAS_VENTAS}
                />
            )}

            {/* Logística */}
            {puedeVerLogistica && (
                <SeccionFutura
                    titulo="Logística y despacho"
                    descripcion="Seguimiento de pedidos, rutas y entregas de mercadería."
                    icono={Truck}
                    metricas={METRICAS_LOGISTICA}
                />
            )}

            {/* Información de acceso */}
            <section className="rounded-xl border bg-card p-5 shadow-xs sm:p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ShieldCheck className="h-5 w-5" />
                    </div>

                    <div>
                        <h2 className="text-base font-semibold">
                            Tu espacio de trabajo
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Has iniciado sesión con el rol{" "}
                            <span className="font-medium text-foreground">
                                {ETIQUETA_ROL[rol]}
                            </span>
                            . Los indicadores y módulos disponibles
                            dependen de los permisos de tu cuenta.
                        </p>

                        <p className="mt-2 text-xs text-muted-foreground">
                            Las métricas marcadas como próximas
                            se conectarán cuando sus procesos
                            estén implementados.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
