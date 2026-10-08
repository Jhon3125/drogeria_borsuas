"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ETIQUETA_ROL } from "@/lib/navegacion";
import { ESTADOS, ROLES } from "@/lib/validaciones/usuario";
import type { EstadoForm } from "./actions";

type Props = {
    action: (prev: EstadoForm, formData: FormData) => Promise<EstadoForm>;
    modo: "crear" | "editar";
    inicial?: { nombre: string; email: string; rol: string; estado: string };
    onExito: () => void;
    onCancelar: () => void;
};

const claseSelect =
    "border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function UsuarioForm({ action, modo, inicial, onExito, onCancelar }: Props) {
    const [estado, formAction, pendiente] = useActionState(action, undefined);
    const v = estado?.valores ?? inicial;
    const errores = estado?.errores ?? {};
    const editando = modo === "editar";

    useEffect(() => {
        if (estado?.ok) onExito();
    }, [estado, onExito]);

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input id="nombre" name="nombre" defaultValue={v?.nombre} required />
                {errores.nombre && <p className="text-sm text-red-600">{errores.nombre}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={inicial?.email ?? v?.email}
                    disabled={editando}
                    required={!editando}
                />
                {errores.email && <p className="text-sm text-red-600">{errores.email}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="rol">Rol</Label>
                <select id="rol" name="rol" defaultValue={v?.rol ?? "COMERCIAL"} className={claseSelect}>
                    {ROLES.map((r) => (
                        <option key={r} value={r}>
                            {ETIQUETA_ROL[r]}
                        </option>
                    ))}
                </select>
                {errores.rol && <p className="text-sm text-red-600">{errores.rol}</p>}
            </div>

            {editando && (
                <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <select id="estado" name="estado" defaultValue={v?.estado ?? "ACTIVO"} className={claseSelect}>
                        {ESTADOS.map((e) => (
                            <option key={e} value={e}>
                                {e}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                        Al guardar como ACTIVO se reinician los intentos fallidos (desbloqueo).
                    </p>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="password">
                    {editando ? "Nueva contraseña (opcional)" : "Contraseña"}
                </Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required={!editando}
                />
                <p className="text-xs text-muted-foreground">
                    Mínimo 8 caracteres, con una mayúscula y un número.
                </p>
                {errores.password && <p className="text-sm text-red-600">{errores.password}</p>}
            </div>

            {estado?.error && <p className="text-sm text-red-600">{estado.error}</p>}

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancelar}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={pendiente}>
                    {pendiente ? "Guardando..." : editando ? "Guardar cambios" : "Crear usuario"}
                </Button>
            </div>
        </form>
    );
}