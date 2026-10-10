import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ROLES_COMERCIAL } from "@/lib/comercial-roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BLUE = rgb(0.071, 0.243, 0.439);
const INK = rgb(0.12, 0.18, 0.26);
const MUTED = rgb(0.4, 0.46, 0.53);
const PALE = rgb(0.94, 0.97, 0.99);
const WIDTH = 595.28;
const HEIGHT = 841.89;
const MARGIN = 44;
const MONEY = (value: number) => `S/ ${value.toFixed(2)}`;
const cents = (value: { toString(): string }) => Math.round(Number(value.toString()) * 100);
const clean = (value: string) => value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();

// Standard PDF fonts use WinAnsi; unsupported characters are safely replaced.
function safe(value: string) {
  return clean(value).replace(/[\u0100-\uffff]/g, (ch) => {
    const map: Record<string, string> = { "–": "-", "—": "-", "’": "'", "“": '"', "”": '"', "•": "-", "…": "..." };
    return map[ch] ?? "?";
  });
}
function fit(value: string, font: PDFFont, size: number, maxWidth: number) {
  const s = safe(value);
  if (font.widthOfTextAtSize(s, size) <= maxWidth) return s;
  let end = s.length;
  while (end > 0 && font.widthOfTextAtSize(s.slice(0, end) + "...", size) > maxWidth) end--;
  return s.slice(0, end) + "...";
}
function text(page: PDFPage, value: string, x: number, y: number, font: PDFFont, size = 10, color = INK, maxWidth?: number) {
  page.drawText(maxWidth ? fit(value, font, size, maxWidth) : safe(value), { x, y, font, size, color });
}
function right(page: PDFPage, value: string, xRight: number, y: number, font: PDFFont, size = 10, color = INK) {
  const content = safe(value);
  text(page, content, xRight - font.widthOfTextAtSize(content, size), y, font, size, color);
}
function splitLines(value: string, font: PDFFont, size: number, maxWidth: number) {
  const words = safe(value).split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) { current = candidate; continue; }
    if (current) lines.push(current);
    current = fit(word, font, size, maxWidth);
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new NextResponse("No autenticado", { status: 401 });
  if (!ROLES_COMERCIAL.includes(session.user.rol)) return new NextResponse("Sin permisos", { status: 403 });

  const { id } = await context.params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
    return new NextResponse("Identificador inválido", { status: 400 });
  }
  const venta = await prisma.venta.findFirst({
    where: { id: Number(id), etapa: "COTIZACION" },
    include: {
      cliente: { select: { razonSocial: true, documento: true, direccion: true, correo: true, telefono: true } },
      detalles: { orderBy: { id: "asc" }, include: { producto: { select: { nombre: true, codigo: true, unidadMedida: true } } } },
    },
  });
  if (!venta) return new NextResponse("Cotización no encontrada", { status: 404 });
  const numeroCotizacion = `COT-${String(venta.id).padStart(5, "0")}`;

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Cotización ${numeroCotizacion}`);
  pdf.setAuthor("Droguería Borsuas E.I.R.L.");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([WIDTH, HEIGHT]);
  let y = HEIGHT - 51;
  let pageNum = 1;
  const issueDate = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "2-digit", year: "numeric" }).format(venta.fecha);

  function footer(p: PDFPage, number: number) {
    p.drawLine({ start: { x: MARGIN, y: 50 }, end: { x: WIDTH - MARGIN, y: 50 }, thickness: 0.7, color: rgb(0.82, 0.86, 0.9) });
    text(p, "Documento comercial informativo. No es comprobante de pago.", MARGIN, 34, regular, 8, MUTED);
    right(p, `Página ${number}`, WIDTH - MARGIN, 34, regular, 8, MUTED);
  }
  function header(p: PDFPage, continuation: boolean) {
    p.drawRectangle({ x: 0, y: HEIGHT - 102, width: WIDTH, height: 102, color: BLUE });
    text(p, "DROGUERÍA BORSUAS E.I.R.L.", MARGIN, HEIGHT - 51, bold, 18, rgb(1, 1, 1));
    text(p, continuation ? "COTIZACIÓN COMERCIAL · CONTINUACIÓN" : "COTIZACIÓN COMERCIAL", MARGIN, HEIGHT - 73, regular, 10, rgb(0.87, 0.94, 1));
    right(p, numeroCotizacion, WIDTH - MARGIN, HEIGHT - 73, bold, 11, rgb(1, 1, 1));
  }
  function newPage() {
    footer(page, pageNum);
    page = pdf.addPage([WIDTH, HEIGHT]);
    pageNum++;
    header(page, true);
    y = HEIGHT - 132;
    tableHeader();
  }
  function tableHeader() {
    page.drawRectangle({ x: MARGIN, y: y - 9, width: WIDTH - MARGIN * 2, height: 24, color: PALE });
    text(page, "PRODUCTO / DESCRIPCIÓN", MARGIN + 8, y, bold, 8, BLUE);
    right(page, "CANT.", 408, y, bold, 8, BLUE);
    right(page, "P. UNIT.", 479, y, bold, 8, BLUE);
    right(page, "IMPORTE", WIDTH - MARGIN - 7, y, bold, 8, BLUE);
    y -= 33;
  }
  header(page, false);
  y = HEIGHT - 129;
  text(page, "CLIENTE", MARGIN, y, bold, 9, BLUE);
  text(page, venta.cliente.razonSocial, MARGIN, y - 19, bold, 12, INK, 345);
  text(page, `DNI/RUC: ${venta.cliente.documento}`, MARGIN, y - 35, regular, 9, MUTED);
  if (venta.cliente.direccion) text(page, `Dirección: ${venta.cliente.direccion}`, MARGIN, y - 50, regular, 9, MUTED, 355);
  text(page, `Fecha: ${issueDate}`, 418, y - 19, regular, 9, INK);
  text(page, "Moneda: PEN (S/)", 418, y - 35, regular, 9, INK);
  y -= 95;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: WIDTH - MARGIN, y }, thickness: 0.7, color: rgb(0.82, 0.86, 0.9) });
  y -= 26;
  tableHeader();
  let itemTotalCents = 0;
  for (const item of venta.detalles) {
    const unitCents = cents(item.precioUnitario);
    const itemDiscountCents = cents(item.descuento);
    const amount = unitCents * item.cantidad - itemDiscountCents;
    itemTotalCents += amount;
    const label = `${item.producto.codigo} · ${item.producto.nombre}`;
    const lines = splitLines(label, regular, 9, 265);
    const rowHeight = Math.max(32, 13 * lines.length + 12);
    if (y - rowHeight < 133) newPage();
    lines.forEach((line, index) => text(page, line, MARGIN + 8, y - index * 13, regular, 9, INK));
    right(page, String(item.cantidad), 408, y, regular, 9);
    right(page, MONEY(unitCents / 100), 479, y, regular, 9);
    right(page, MONEY(amount / 100), WIDTH - MARGIN - 7, y, regular, 9);
    if (itemDiscountCents > 0) text(page, `Descuento línea: ${MONEY(itemDiscountCents / 100)}`, MARGIN + 8, y - 13 * lines.length, regular, 8, MUTED);
    y -= rowHeight + (itemDiscountCents > 0 ? 12 : 0);
    page.drawLine({ start: { x: MARGIN, y: y + 9 }, end: { x: WIDTH - MARGIN, y: y + 9 }, thickness: 0.4, color: rgb(0.88, 0.9, 0.92) });
  }
  if (y < 166) {
    footer(page, pageNum);
    page = pdf.addPage([WIDTH, HEIGHT]); pageNum++; header(page, true); y = HEIGHT - 155;
  }
  const subtotal = cents(venta.subtotal);
  const discount = cents(venta.descuento);
  const total = cents(venta.importeTotal);
  // Display the stored totals, not recalculations based on current catalog prices.
  const totals = [
    ["Subtotal", MONEY(subtotal / 100)],
    ["Descuento general", `- ${MONEY(discount / 100)}`],
    ["TOTAL COTIZADO", MONEY(total / 100)],
  ];
  y -= 12;
  totals.forEach(([label, value], index) => {
    const isTotal = index === 2;
    if (isTotal) page.drawRectangle({ x: 330, y: y - 9, width: WIDTH - MARGIN - 330, height: 29, color: PALE });
    text(page, label, 340, y, isTotal ? bold : regular, isTotal ? 11 : 9, isTotal ? BLUE : MUTED);
    right(page, value, WIDTH - MARGIN - 7, y, isTotal ? bold : regular, isTotal ? 11 : 9, isTotal ? BLUE : INK);
    y -= isTotal ? 36 : 25;
  });
  if (y > 115) text(page, "Cotización sujeta a confirmación comercial y disponibilidad de stock.", MARGIN, y - 12, regular, 9, MUTED, WIDTH - 2 * MARGIN);
  footer(page, pageNum);
  const bytes = await pdf.save();
  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${numeroCotizacion}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
