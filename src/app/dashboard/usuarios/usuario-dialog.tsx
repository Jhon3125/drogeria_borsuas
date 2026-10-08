"use client";

import { useState } from "react";
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

export function UsuarioDialog({ usuario }: { usuario?: UsuarioEditable }) {
    const [abierto, setAbierto] = useState(false);
    const editando = !!usuario;

    return (
        <>
            <Button
                size={editando ? "sm" : "default"}
                variant={editando ? "outline" : "default"}
                onClick={() => setAbierto(true)}
            >
                {editando ? "Editar" : "Nuevo usuario"}
            </Button>

            <Dialog open={abierto} onOpenChange={setAbierto}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editando ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
                        <DialogDescription>
                            {editando
                                ? "Modifica los datos, el rol o el estado de la cuenta."
                                : "Completa los datos para registrar un nuevo usuario."}
                        </DialogDescription>
                    </DialogHeader>

                    <UsuarioForm
                        action={editando ? actualizarUsuario.bind(null, usuario.id) : crearUsuario}
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