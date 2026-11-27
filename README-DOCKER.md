
# Droguería Borsuas - Entorno Docker

## 1. Requisitos

- Docker Desktop en ejecución.
- Git.
- Visual Studio Code.
- Acceso autorizado a la base de datos de desarrollo.

No es necesario instalar Node.js, npm ni Prisma
directamente en la computadora.

## 2. Descargar el proyecto

git fetch origin
git switch cloud-infrastructure

## 3. Variables de entorno

Crear el archivo .env.local utilizando la plantilla
.env.example y solicitar las credenciales autorizadas.

No compartir ni publicar las credenciales en GitHub.
Utilizar una base de datos independiente de producción.

## 4. Primera ejecución

docker compose -p borsuas-dev -f docker-compose.dev.yml up -d --build

## 5. Revisar el arranque

docker logs -f borsuas-dev

Cuando Next.js indique Ready, ingresar a:

http://localhost:3003

## 6. Desarrollo diario

Iniciar el contenedor:

docker compose -p borsuas-dev -f docker-compose.dev.yml up -d

Modificar los archivos desde Visual Studio Code.

El código se sincroniza mediante volúmenes.
Webpack utiliza polling para detectar modificaciones.

## 7. Descargar cambios de GitHub

git pull

Si cambiaron las dependencias o el esquema Prisma:

docker restart borsuas-dev

El contenedor comprueba si cambiaron las dependencias
antes de volver a instalarlas.

## 8. Detener el entorno

docker stop borsuas-dev

## 9. Validaciones técnicas

docker exec borsuas-dev npx prisma validate

docker exec borsuas-dev npx tsc --noEmit

docker exec borsuas-dev npm audit --omit=dev

## 10. Tecnologías

- Node.js 22
- Next.js 16.4.6
- Prisma 7.10.x
- PostgreSQL
- Docker Compose
- Webpack

## 11. Entornos disponibles

- Docker desarrollo: puerto 3003.
- Docker producción: puerto 3001.
- Kubernetes: puerto 8082 mediante port-forward.
- Grafana: puerto 3002 mediante port-forward.
- Prometheus: puerto 9090 mediante port-forward.

Kubernetes y las herramientas de monitoreo no son
necesarios para el desarrollo diario.

## 12. Seguridad

La auditoría de dependencias permitió reducir las
vulnerabilidades reportadas de 20 a 3.

Las alertas restantes corresponden a una dependencia
transitiva de Prisma.

No ejecutar npm audit fix --force sin evaluar
previamente la compatibilidad del proyecto.
