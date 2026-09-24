#!/usr/bin/env bash
#
# Aplica a la base de datos de producción las migraciones que le falten.
#
# La base no se actualiza sola al desplegar: el código llega con cada push,
# pero el esquema es un paso aparte. Si se olvida, la aplicación queda pidiendo
# columnas que no existen y falla solo en las páginas que las usan.
#
#   npm run db:produccion

set -euo pipefail

cd "$(dirname "$0")/.."

echo "Necesitas la cadena del Session pooler de Supabase (puerto 5432)."
echo "Es la misma del Transaction pooler cambiando 6543 por 5432."
echo

read -rs -p "Pégala y pulsa Enter: " CADENA
echo
echo

if [ -z "$CADENA" ]; then
  echo "No pegaste nada. Cancelado."
  exit 1
fi

case "$CADENA" in
  *:5432/*) ;;
  *) echo "Esa cadena no usa el puerto 5432. Con el 6543 las migraciones fallan."; exit 1 ;;
esac

echo "Estado antes:"
DATABASE_URL="$CADENA" npx prisma migrate status || true
echo

echo "Aplicando lo que falte…"
DATABASE_URL="$CADENA" npx prisma migrate deploy
echo

echo "Estado después:"
DATABASE_URL="$CADENA" npx prisma migrate status
