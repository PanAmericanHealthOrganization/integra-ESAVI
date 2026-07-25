#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Construye la imagen BASE del dashboard (dependencias de sistema + paquetes R).
#
# Es la parte lenta del build (renv::restore). Solo se reconstruye cuando cambia
# renv.lock o Dockerfile.deps; en cualquier otro caso el script no hace nada y
# el build de la app reutiliza la imagen ya existente.
#
# Uso (desde docker-compose/):
#   ./scripts/build-dash-base.sh          # construye solo si hace falta
#   ./scripts/build-dash-base.sh --force  # reconstruye siempre
#
# Variables:
#   DASH_BASE_IMAGE   tag de la imagen (por defecto localhost/integra-esavi/dash-base:4.4.1)
#   CONTAINER_ENGINE  podman | docker    (autodetecta, prefiere podman)
#   BUILD_PLATFORM    p. ej. linux/amd64 para forzar binarios PPM en un host arm64
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASH_DIR="$(cd "${SCRIPT_DIR}/../../proyecto-02-integra-esavi/workspace/dash-integra-esavi" && pwd)"

# Motor de contenedores: podman por defecto.
if [[ -n "${CONTAINER_ENGINE:-}" ]]; then
  ENGINE="${CONTAINER_ENGINE}"
elif command -v podman >/dev/null 2>&1; then
  ENGINE="podman"
elif command -v docker >/dev/null 2>&1; then
  ENGINE="docker"
else
  echo "ERROR: no se encontró podman ni docker en el PATH." >&2
  exit 1
fi

IMAGE="${DASH_BASE_IMAGE:-localhost/integra-esavi/dash-base:4.4.1}"
FORCE="${1:-}"

# Huella de las entradas que obligan a reconstruir la base.
if command -v sha256sum >/dev/null 2>&1; then
  sha256() { sha256sum; }
else
  sha256() { shasum -a 256; }   # macOS
fi
LOCK_SHA="$(cat "${DASH_DIR}/renv.lock" "${DASH_DIR}/Dockerfile.deps" | sha256 | cut -d' ' -f1)"

CURRENT_SHA="$("${ENGINE}" image inspect "${IMAGE}" \
  --format '{{ index .Config.Labels "org.integraesavi.renv-lock-sha" }}' 2>/dev/null || true)"

if [[ "${FORCE}" != "--force" && "${CURRENT_SHA}" == "${LOCK_SHA}" ]]; then
  echo "✔ ${IMAGE} está al día (renv.lock sin cambios). No se reconstruye."
  exit 0
fi

if [[ -n "${CURRENT_SHA}" && "${FORCE}" != "--force" ]]; then
  echo "→ renv.lock/Dockerfile.deps cambiaron: reconstruyendo ${IMAGE} con ${ENGINE}…"
else
  echo "→ Construyendo ${IMAGE} con ${ENGINE} (puede tardar bastante la primera vez)…"
fi

# Aviso: en arm64 los binarios de PPM (jammy) no existen y todo se compila.
HOST_ARCH="$("${ENGINE}" info --format '{{.Version.OsArch}}' 2>/dev/null || echo "")"
if [[ "${HOST_ARCH}" == *"arm64"* && -z "${BUILD_PLATFORM:-}" ]]; then
  cat >&2 <<'WARN'
⚠  El motor corre en arm64: Posit Package Manager solo publica binarios x86_64
   para jammy, así que los ~147 paquetes R se compilarán desde fuente (lento).
   Alternativa: BUILD_PLATFORM=linux/amd64 ./scripts/build-dash-base.sh
   (usa binarios precompilados, pero el contenedor corre emulado).
WARN
fi

BUILD_ARGS=(-f "${DASH_DIR}/Dockerfile.deps" -t "${IMAGE}" --build-arg "RENV_LOCK_SHA=${LOCK_SHA}")
[[ -n "${BUILD_PLATFORM:-}" ]] && BUILD_ARGS+=(--platform "${BUILD_PLATFORM}")

"${ENGINE}" build "${BUILD_ARGS[@]}" "${DASH_DIR}"

echo "✔ ${IMAGE} listo."
