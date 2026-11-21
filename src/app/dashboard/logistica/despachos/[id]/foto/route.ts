import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { usuarioVigente } from "@/lib/guard";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await usuarioVigente();
  if (!["SUPER_ADMIN", "ADMIN", "ALMACEN", "CONDUCTOR"].includes(usuario.rol)) return new NextResponse("Prohibido", { status: 403 });
  const { id } = await params;
  if (!/^\d+$/.test(id)) return new NextResponse("No encontrado", { status: 404 });
  const despacho = await prisma.despacho.findUnique({ where: { id: Number(id) }, select: { hojaRuta: { select: { conductorId: true } }, evidencia: { select: { contenido: true, tipoMime: true } } } });
  if (!despacho?.evidencia) return new NextResponse("No encontrado", { status: 404 });
  if (usuario.rol === "CONDUCTOR" && despacho.hojaRuta.conductorId !== Number(usuario.id)) return new NextResponse("Prohibido", { status: 403 });
  return new NextResponse(new Uint8Array(despacho.evidencia.contenido), { headers: { "Content-Type": despacho.evidencia.tipoMime, "Content-Disposition": "inline", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
