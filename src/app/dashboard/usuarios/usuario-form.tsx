
"use client";

import { useActionState, useEffect, useState } from "react";
import {
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
    Shield,
    UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ETIQUETA_ROL } from "@/lib/navegacion";
import { ESTADOS, ROLES } from "@/lib/validaciones/usuario";

import type { EstadoForm } from "./actions";

type Props = {
    action: (
        prev: EstadoForm,
        formData: FormData
    ) => Promise<EstadoForm>;
    modo: "crear" | "editar";
    inicial?: {
        nombre: string;
        email: string;
        rol: string;
        estado: string;
    };
    onExito: () => void;
    onCancelar: () => void;
};

const claseSelect =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10";

export function UsuarioForm({
    action,
    modo,
    inicial,
    onExito,
    onCancelar,
}: Props) {
    const [estado, formAction, pendiente] = useActionState(
        action,
        undefined
    );

    const [mostrarPassword, setMostrarPassword] = useState(false);

    const valores = estado?.valores ?? inicial;
    const errores = estado?.errores ?? {};
    const editando = modo === "editar";

    useEffect(() => {
        if (estado?.ok) {
            onExito();
        }
    }, [estado, onExito]);

    return (
        <form action={formAction} className="space-y-6">
            {/* Información personal */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                    <UserRound className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">
                        Información personal
                    </h3>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="nombre">
                        Nombre completo
                    </Label>

                    <Input
                        id="nombre"
                        name="nombre"
                        placeholder="Ej. Juan Pérez"
                        defaultValue={valores?.nombre}
                        className="h-10"
                        required
                    />

                    {errores.nombre && (
                        <p className="text-xs font-medium text-destructive">
                            {errores.nombre}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">
                        Correo electrónico
                    </Label>

                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="usuario@empresa.com"
                        defaultValue={
                            inicial?.email ?? valores?.email
                        }
                        disabled={editando}
                        required={!editando}
                        className="h-10"
                    />

                    {editando && (
                        <p className="text-xs text-muted-foreground">
                            El correo electrónico no puede modificarse.
                        </p>
                    )}

                    {errores.email && (
                        <p className="text-xs font-medium text-destructive">
                            {errores.email}
                        </p>
                    )}
                </div>
            </section>

            {/* Permisos */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">
                        Permisos y estado
                    </h3>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="rol">
                        Rol del usuario
                    </Label>

                    <select
                        id="rol"
                        name="rol"
                        defaultValue={
                            valores?.rol ?? "COMERCIAL"
                        }
                        className={claseSelect}
                    >
                        {ROLES.map((rol) => (
                            <option key={rol} value={rol}>
                                {ETIQUETA_ROL[rol]}
                            </option>
                        ))}
                    </select>

                    <p className="text-xs text-muted-foreground">
                        El rol determina los módulos a los que puede
                        acceder el usuario.
                    </p>

                    {errores.rol && (
                        <p className="text-xs font-medium text-destructive">
                            {errores.rol}
                        </p>
                    )}
                </div>

                {editando && (
                    <div className="space-y-2">
                        <Label htmlFor="estado">
                            Estado de la cuenta
                        </Label>

                        <select
                            id="estado"
                            name="estado"
                            defaultValue={
                                valores?.estado ?? "ACTIVO"
                            }
                            className={claseSelect}
                        >
                            {ESTADOS.map((estado) => (
                                <option
                                    key={estado}
                                    value={estado}
                                >
                                    {estado}
                                </option>
                            ))}
                        </select>

                        <p className="text-xs text-muted-foreground">
                            Al guardar como ACTIVO se reinician los
                            intentos fallidos de acceso.
                        </p>

                        {errores.estado && (
                            <p className="text-xs font-medium text-destructive">
                                {errores.estado}
                            </p>
                        )}
                    </div>
                )}
            </section>

            {/* Seguridad */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                    <KeyRound className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">
                        Seguridad
                    </h3>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">
                        {editando
                            ? "Nueva contraseña"
                            : "Contraseña"}
                        {editando && (
                            <span className="ml-1 font-normal text-muted-foreground">
                                (opcional)
                            </span>
                        )}
                    </Label>

                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={
                                mostrarPassword
                                    ? "text"
                                    : "password"
                            }
                            autoComplete="new-password"
                            placeholder={
                                editando
                                    ? "Dejar vacío para conservar la actual"
                                    : "Ingresa una contraseña segura"
                            }
                            required={!editando}
                            className="h-10 pr-11"
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setMostrarPassword(
                                    (anterior) => !anterior
                                )
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                            aria-label={
                                mostrarPassword
                                    ? "Ocultar contraseña"
                                    : "Mostrar contraseña"
                            }
                        >
                            {mostrarPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Mínimo 8 caracteres, una letra mayúscula y
                        un número.
                    </p>

                    {errores.password && (
                        <p className="text-xs font-medium text-destructive">
                            {errores.password}
                        </p>
                    )}
                </div>
            </section>

            {/* Error general */}
            {estado?.error && (
                <div
                    role="alert"
                    className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
                >
                    {estado.error}
                </div>
            )}

            {/* Acciones */}
            <div className="flex items-center justify-end gap-3 border-t pt-5">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancelar}
                    disabled={pendiente}
                >
                    Cancelar
                </Button>

                <Button
                    type="submit"
                    disabled={pendiente}
                    className="min-w-36"
                >
                    {pendiente && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}

                    {pendiente
                        ? "Guardando..."
                        : editando
                            ? "Guardar cambios"
                            : "Crear usuario"}
                </Button>
            </div>
        </form>
    );
}
