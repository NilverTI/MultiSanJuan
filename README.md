# MULTI SAN JUAN

Sistema profesional de inventario, ventas y caja para tienda minorista.

## Stack Tecnológico

- **Frontend:** Next.js 14 + React 18 + TypeScript + TailwindCSS
- **Backend:** NestJS + TypeScript + Prisma ORM
- **Base de Datos:** PostgreSQL 16
- **Autenticación:** JWT + Refresh Tokens
- **UI/UX:** Diseño moderno, responsive, modo claro/oscuro

## Requisitos

- Node.js 20 o superior (LTS recomendada)
- PostgreSQL 15 o superior instalado localmente
- npm 10 o superior

## Instalación

### 1. Instalar Node.js LTS

Descargar e instalar desde: https://nodejs.org

### 2. Instalar PostgreSQL

Descargar e instalar desde: https://www.postgresql.org/download/windows/

Durante la instalación, establecer:
- Puerto: 5432
- Usuario: postgres
- Contraseña: [PASSWORD]

### 3. Crear la base de datos

Abrir pgAdmin (se instala con PostgreSQL) o usar la terminal:

```bash
psql -U postgres -c "CREATE DATABASE multisanjuan;"
```

Ingresar la contraseña `[PASSWORD]` cuando se solicite.

### 4. Configurar el backend

```bash
cd backend
npm install
```

Editar el archivo `backend/.env` si es necesario. La configuración por defecto es:

```
DATABASE_URL="postgresql://postgres:1234@localhost:5432/multisanjuan"
JWT_SECRET="multi_san_juan_secret_key"
JWT_REFRESH_SECRET="multi_san_juan_refresh_secret_key"
PORT=3001
NODE_ENV="development"
```

### 5. Ejecutar Prisma (migraciones y seed)

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### 6. Iniciar el backend

```bash
cd backend
npm run start:dev
```

El backend se iniciará en: http://localhost:3001

Documentación Swagger: http://localhost:3001/api/docs

### 7. Configurar el frontend

```bash
cd frontend
npm install
```

Crear archivo `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 8. Iniciar el frontend

```bash
cd frontend
npm run dev
```

El frontend se iniciará en: http://localhost:3000

## Acceso al sistema

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | admin123 | Super Admin |

## Inicio rápido (desde la raíz del proyecto)

```bash
# Instalar todo
npm run install:all

# Generar Prisma
cd backend && npx prisma generate && npx prisma migrate dev --name init && npx prisma db seed && cd ..

# Iniciar backend y frontend simultáneamente
npm run dev
```

## Estructura del proyecto

```
MULTI-SAN-JUAN/
├── frontend/           # Next.js (App Router)
│   ├── src/
│   │   ├── app/        # Páginas y rutas
│   │   ├── components/ # Componentes reutilizables
│   │   ├── providers/  # Contextos (Auth, Theme)
│   │   ├── services/   # API client
│   │   ├── lib/        # Utilidades
│   │   ├── layouts/    # Layouts
│   │   ├── types/      # TypeScript types
│   │   ├── config/     # Configuración
│   │   └── styles/     # Estilos globales
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
│
├── backend/            # NestJS
│   ├── src/
│   │   ├── modules/    # Módulos (auth, users, products, sales, etc.)
│   │   ├── common/     # Estrategias compartidas
│   │   ├── guards/     # Guards (JWT, permisos)
│   │   ├── decorators/ # Decoradores personalizados
│   │   ├── filters/    # Filtros de excepción
│   │   ├── interceptors/ # Interceptores
│   │   └── prisma/     # Servicio Prisma
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── package.json
│   └── tsconfig.json
│
├── docs/
├── .env.example
├── .gitignore
└── README.md
```

## Módulos del sistema

- **POS / Ventas** — Punto de venta con búsqueda por código de barras
- **Productos** — Gestión con múltiples presentaciones y códigos de barras
- **Inventario** — Control de stock y movimientos
- **Caja** — Apertura, cierre y cuadre de caja por método de pago
- **Clientes** — Registro e historial de compras
- **Promociones** — Descuentos y ofertas especiales
- **Cotizaciones** — Presupuestos para clientes
- **Notas de Venta** — Pedidos y separaciones
- **Reportes** — Estadísticas de ventas y productos
- **Usuarios y Permisos** — Control de acceso basado en roles (43 permisos)
- **Auditoría** — Registro completo de todas las actividades
- **Configuración** — Personalización del sistema

## Conexión a la base de datos

```
Host: localhost
Puerto: 5432
Usuario: postgres
Contraseña: [PASSWORD]
Base de datos: multisanjuan
```

## Comandos útiles

```bash
# Backend
cd backend
npm run start:dev        # Iniciar en desarrollo
npx prisma studio        # Abrir Prisma Studio (gestor gráfico de BD)
npx prisma migrate dev   # Ejecutar migraciones
npx prisma db seed       # Poblar base de datos

# Frontend
cd frontend
npm run dev              # Iniciar en desarrollo
npm run build            # Construir para producción

# Raíz
npm run dev              # Iniciar backend y frontend simultáneamente
```
