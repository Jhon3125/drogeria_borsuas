import { prisma } from "../src/lib/prisma";

async function main() {
    const usuarios = await prisma.usuario.count();
    const categorias = await prisma.categoria.count();
    console.log(`Conexión OK → usuarios: ${usuarios}, categorías: ${categorias}`);
}

main()
    .catch((e) => {
        console.error("Error de conexión:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());