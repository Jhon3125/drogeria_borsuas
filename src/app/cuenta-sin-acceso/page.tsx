import { LogoutButton } from "@/components/logout-button";

export default function CuentaSinAcceso() {
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
    <section className="w-full max-w-md space-y-4 rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-[#123E70]">Acceso no disponible</h1>
      <p className="text-sm text-slate-600">Tu cuenta ya no tiene acceso activo. Cierra sesión y consulta con el administrador si necesitas recuperar el acceso.</p>
      <LogoutButton />
    </section>
  </main>;
}
