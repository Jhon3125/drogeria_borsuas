"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = { items: { titulo: string; href: string }[] };

export function Sidebar({ items }: Props) {
    const pathname = usePathname();

    return (
        <nav className="flex flex-col gap-1 p-3">
            {items.map((item) => {
                const activo =
                    item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname.startsWith(item.href);

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            activo
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        {item.titulo}
                    </Link>
                );
            })}
        </nav>
    );
}