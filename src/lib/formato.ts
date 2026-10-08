export const formatoMoneda = (valor: number | string | any, moneda: "PEN" | "USD" = "PEN") => {
    const numero = Number(valor);

    if (isNaN(numero)) {
        return moneda === "PEN" ? "S/ 0.00" : "$ 0.00";
    }

    return new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: moneda,
    }).format(numero);
};