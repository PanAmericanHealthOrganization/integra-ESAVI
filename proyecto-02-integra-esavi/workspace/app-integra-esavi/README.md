# INTEGRA-ESAVI

Aplicación web para el sistema INTEGRA-ESAVI desarrollada con React, TypeScript y Vite.

## Requisitos Previos

- **Node.js**: v20.10.0 (especificado en `.nvmrc`)
- **pnpm**: Gestor de paquetes recomendado

## Instalación

1. **Verificar la versión de Node.js:**
   ```bash
   node --version
   # Debe mostrar: v20.10.0
   ```

2. **Instalar pnpm (si no está instalado):**
   ```bash
   npm install -g pnpm
   ```

3. **Instalar dependencias:**
   ```bash
   pnpm install
   ```

## Scripts Disponibles

- **Desarrollo:**
  ```bash
  pnpm dev
  ```
  Inicia el servidor de desarrollo en `http://localhost:5173`

- **Build de producción:**
  ```bash
  pnpm build
  ```
  Genera los archivos optimizados en la carpeta `dist/`

- **Preview del build:**
  ```bash
  pnpm preview
  ```
  Sirve los archivos de producción localmente

- **Linting:**
  ```bash
  pnpm lint
  ```
  Ejecuta ESLint para verificar el código

## Tecnologías Utilizadas

- **React 18** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático
- **Vite 5** - Herramienta de build y desarrollo
- **React Admin** - Framework para aplicaciones administrativas
- **Material-UI** - Componentes de UI
- **Keycloak** - Autenticación y autorización
- **pnpm** - Gestor de paquetes

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
├── pages/              # Páginas de la aplicación
├── contexts/           # Contextos de React
├── dataProviders/      # Proveedores de datos
├── layout/             # Componentes de layout
└── types.ts           # Definiciones de tipos TypeScript
```

## Configuración de Desarrollo

El proyecto está configurado para usar:
- **Node.js v20.10.0** (especificado en `.nvmrc`)
- **pnpm** como gestor de paquetes
- **Vite 5** para desarrollo y build
- **TypeScript** para tipado estático

## Despliegue

Para desplegar la aplicación:

1. Ejecutar el build de producción:
   ```bash
   pnpm build
   ```

2. Los archivos optimizados se generarán en la carpeta `dist/`

3. Servir la carpeta `dist/` con cualquier servidor web estático

## Notas Importantes

- El proyecto usa **pnpm** como gestor de paquetes principal
- La versión de Node.js está fijada en v20.10.0
- Vite está configurado para desarrollo rápido y builds optimizados
- Se incluye configuración para Keycloak para autenticación


