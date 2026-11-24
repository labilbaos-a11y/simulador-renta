# Simulador de renta — Chile

Calculadora del Impuesto Único de Segunda Categoría y del Global Complementario,
con la tabla del SII de **agosto 2026** (UTM $71.649).

**Ver:** https://labilbaos-a11y.github.io/simulador-renta/

## Qué calcula

- **Sueldo** — ingresas bruto *o* líquido; resuelve el otro hacia atrás. AFP con la
  comisión de cada administradora, Fonasa o isapre, y seguro de cesantía.
- **Boletas de honorarios** — monto bruto o líquido, mensual o anual. Se consolidan
  con el sueldo en el Global Complementario de abril, con gastos presuntos del 30%
  (tope 15 UTA), retención del 15,25% y cotizaciones de independiente (Ley 21.133).
- **APV** — corre el año con y sin aporte para mostrar el ahorro real de impuesto,
  el costo efectivo de tu bolsillo y la comparación entre régimen B (rebaja la base)
  y régimen A (bono estatal del 15%, tope 6 UTM).

## Parámetros editables

UF, tope imponible, tope AFC, retención de boletas, tasa de cotización de
independiente y tope de APV están en «Parámetros y topes» dentro de la página,
porque cambian mes a mes. Los valores por defecto son aproximados — ajústalos si
necesitas precisión al peso. Solo mueven el resultado en rentas altas.

## Rentabilidades de las AFP (automáticas)

Las tasas de los fondos A a E de las 7 AFP y del promedio del sistema se recalculan solas
todos los días con `.github/workflows/actualizar-afp.yml`:

1. `scripts/actualizar-afp.mjs` baja los valores cuota diarios de la
   [Superintendencia de Pensiones](https://www.spensiones.cl) y la UF de la
   [SII](https://www.sii.cl/valores_y_fechas/uf/).
2. Calcula la rentabilidad **real** anualizada de los últimos 5 años al último día
   publicado y reescribe el bloque `/* AFP:INICIO */ … /* AFP:FIN */` de `index.html`.
3. Si cambió algo, hace commit y GitHub Pages publica.

Si una fuente no responde o un número sale fuera de rango, el script no toca nada y el
sitio sigue con los últimos datos buenos. Para correrlo a mano: pestaña *Actions* →
*Actualizar rentabilidades AFP* → *Run workflow*, o `node scripts/actualizar-afp.mjs`.

## Cómo funciona

Un solo archivo HTML sin dependencias: nada de CDN, fuentes externas ni llamadas de
red. Funciona offline con doble clic. Para actualizarlo, edita `index.html` y haz push.

## Alcance

Estimación referencial. No considera rentas de capital, créditos por gastos en
educación, dividendos de empresas, gastos efectivos en vez de presuntos ni tramos de
cobertura parcial de cotizaciones de independiente. Para una declaración real,
valídalo con un contador.
