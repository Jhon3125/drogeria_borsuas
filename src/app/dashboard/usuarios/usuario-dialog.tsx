
"use client";

import { useState } from "react";
import { Pencil, Plus, UserRoundCog, UserRoundPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { actualizarUsuario, crearUsuario } from "./actions";
import { UsuarioForm } from "./usuario-form";

type UsuarioEditable = {
    id: number;
    nombre: string;
    email: string;
    rol: string;
    estado: string;
};

export function UsuarioDialog({
    usuario,
}: {
    usuario?: UsuarioEditable;
}) {
    const [abierto, setAbierto] = useState(false);
    const editando = Boolean(usuario);

    return (
        <>
            {editando ? (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAbierto(true)}
                    className="gap-1.5"
                >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                </Button>
            ) : (
                <Button
                    type="button"
                    onClick={() => setAbierto(true)}
                    className="h-10 gap-2 shadow-xs"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo usuario
                </Button>
            )}

            <Dialog open={abierto} onOpenChange={setAbierto}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader className="space-y-3 pb-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            {editando ? (
                                <UserRoundCog className="h-5 w-5" />
                            ) : (
                                <UserRoundPlus className="h-5 w-5" />
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <DialogTitle className="text-xl">
                                {editando
                                    ? "Editar usuario"
                                    : "Nuevo usuario"}
                            </DialogTitle>

                            <DialogDescription>
                                {editando
                                    ? "Actualiza la información, los permisos o el estado de esta cuenta."
                                    : "Completa la información para registrar una nueva cuenta de acceso."}
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <UsuarioForm
                        action={
                            usuario
                                ? actualizarUsuario.bind(null, usuario.id)
                                : crearUsuario
                        }
                        modo={editando ? "editar" : "crear"}
                        inicial={usuario}
                        onExito={() => setAbierto(false)}
                        onCancelar={() => setAbierto(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
