
"use client";

import { useState } from "react";
import { ClipboardPenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  FormularioAjusteLote,
  type OpcionLote,
} from "./ajuste-dialog";

export function AjusteLote({
  lote,
}: {
  lote: OpcionLote;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-2"
        onClick={() => setAbierto(true)}
      >
        <ClipboardPenLine className="h-3.5 w-3.5" />
        Ajustar lote
      </Button>

      <Dialog
        open={abierto}
        onOpenChange={setAbierto}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader className="space-y-3 pb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
              <ClipboardPenLine className="h-5 w-5" />
            </div>

            <DialogTitle className="text-xl">
              Ajustar lote {lote.numeroLote}
            </DialogTitle>

            <DialogDescription>
              Registra una corrección manual con
              cantidad y motivo. El responsable
              quedará registrado automáticamente.
            </DialogDescription>
          </DialogHeader>

          {abierto && (
            <FormularioAjusteLote
              lote={lote}
              onExito={() => setAbierto(false)}
              onCancelar={() => setAbierto(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
