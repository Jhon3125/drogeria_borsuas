import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
    const email = "admin@borsuas.com";
    const passwordHash = await bcrypt.hash("Admin12345!", 12);

    const admin = await prisma.usuario.upsert({
        where: { email },
        update: {},
        create: {
            email,
            passwordHash,
            nombre: "Super Administrador",
            rol: "SUPER_ADMIN",
        },
    });

    console.log(`Super Admin listo → ${admin.email}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());