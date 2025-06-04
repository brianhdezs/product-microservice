# Microservicio de Productos - NestJS

Este es un microservicio de productos desarrollado en NestJS con PostgreSQL, replicando la funcionalidad del microservicio original en .NET.

## Características

- ✅ CRUD completo de productos
- ✅ Manejo de imágenes con almacenamiento local
- ✅ Autenticación JWT (preparado para integración)
- ✅ Documentación con Swagger
- ✅ Validación de datos con DTOs
- ✅ Base de datos PostgreSQL con TypeORM
- ✅ Manejo de archivos con Multer
- ✅ CORS configurado

## Tecnologías

- **Framework**: NestJS
- **Base de datos**: PostgreSQL
- **ORM**: TypeORM
- **Autenticación**: JWT
- **Documentación**: Swagger/OpenAPI
- **Manejo de archivos**: Multer
- **Validación**: class-validator

## Instalación

1. Clona el repositorio
```bash
git clone <repository-url>
cd product-microservice-nestjs
```

2. Instala las dependencias
```bash
npm install
```

3. Configura las variables de entorno
```bash
cp .env.example .env
# Edita el archivo .env con tus configuraciones
```

4. Configura PostgreSQL
- Crea una base de datos llamada `productodb`
- Actualiza las credenciales en el archivo `.env`

5. Ejecuta las migraciones (opcional - usa synchronize en desarrollo)
```bash
npm run migration:run
```

6. Inicia la aplicación
```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## Estructura del Proyecto

```
src/
├── auth/                   # Módulo de autenticación
│   ├── decorators/         # Decoradores personalizados
│   ├── guards/             # Guards de autenticación
│   ├── strategies/         # Estrategias de Passport
│   └── auth.module.ts
├── config/                 # Configuraciones
│   └── database.config.ts  # Configuración de base de datos
├── product/                # Módulo de productos
│   ├── dto/                # DTOs y validaciones
│   ├── entities/           # Entidades de TypeORM
│   ├── product.controller.ts
│   ├── product.service.ts
│   └── product.module.ts
├── app.module.ts           # Módulo principal
└── main.ts                 # Punto de entrada
```

## API Endpoints

### Productos

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/api/product` | Obtener todos los productos | No |
| GET | `/api/product/GetAll` | Obtener todos los productos (ruta alternativa) | No |
| GET | `/api/product/:id` | Obtener producto por ID | No |
| POST | `/api/product` | Crear nuevo producto | Sí |
| PUT | `/api/product` | Actualizar producto | Sí |
| DELETE | `/api/product/:id` | Eliminar producto | Sí |

## Documentación API

Una vez iniciada la aplicación, puedes acceder a la documentación de Swagger en:
```
http://localhost:3001/api
```

## Variables de Entorno

```bash
# Puerto de la aplicación
PORT=3001

# Base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=productodb

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h
JWT_ISSUER=dsicode-auth-api
JWT_AUDIENCE=dsicode-client

# Entorno
NODE_ENV=development
```

## Esquema de Base de Datos

### Tabla: productos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| product_id | INTEGER PRIMARY KEY | ID único del producto |
| name | VARCHAR(255) NOT NULL | Nombre del producto |
| price | DECIMAL(10,2) NOT NULL | Precio del producto |
| description | TEXT | Descripción del producto |
| category_name | VARCHAR(100) | Nombre de la categoría |
| image_url | VARCHAR(500) | URL de la imagen |
| image_local_path | VARCHAR(500) | Ruta local de la imagen |

## Manejo de Imágenes

- Las imágenes se almacenan en `uploads/ProductImages/`
- Se sirven estáticamente desde `/ProductImages/`
- Formatos permitidos: JPEG, PNG, GIF, WebP
- Tamaño máximo: 5MB
- Nombres de archivo: `{productId}.{extension}`

## Scripts Disponibles

```bash
# Desarrollo
npm run start:dev          # Inicia en modo desarrollo con hot-reload
npm run start:debug        # Inicia en modo debug

# Producción
npm run build              # Compila el proyecto
npm run start:prod         # Inicia en modo producción

# Base de datos
npm run migration:generate # Genera una nueva migración
npm run migration:run      # Ejecuta migraciones pendientes
npm run migration:revert   # Revierte la última migración

# Testing
npm run test               # Ejecuta pruebas unitarias
npm run test:e2e           # Ejecuta pruebas end-to-end
npm run test:cov           # Ejecuta pruebas con coverage

# Linting
npm run lint               # Ejecuta ESLint
npm run format             # Formatea código con Prettier
```

## Integración con Microservicio de Autenticación

Este microservicio está preparado para integrarse con tu microservicio de autenticación de NestJS existente. La configuración JWT debe coincidir entre ambos servicios.

## Diferencias con el Original en .NET

1. **TypeORM vs Entity Framework**: Usamos TypeORM como ORM
2. **PostgreSQL vs SQL Server**: Cambiamos a PostgreSQL
3. **Decoradores vs Atributos**: Usamos decoradores de NestJS para validación y documentación
4. **Multer vs IFormFile**: Usamos Multer para manejo de archivos
5. **Estructura de módulos**: Seguimos la arquitectura modular de NestJS

## Próximos Pasos

1. Integrar con el microservicio de autenticación
2. Implementar paginación avanzada
3. Agregar filtros y búsqueda
4. Implementar caché con Redis
5. Agregar pruebas unitarias y de integración

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request