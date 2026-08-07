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

## Cómo funciona

Un solo archivo HTML sin dependencias: nada de CDN, fuentes externas ni llamadas de
red. Funciona offline con doble clic. Para actualizarlo, edita `index.html` y haz push.

## Alcance

Estimación referencial. No considera rentas de capital, créditos por gastos en
educación, dividendos de empresas, gastos efectivos en vez de presuntos ni tramos de
cobertura parcial de cotizaciones de independiente. Para una declaración real,
valídalo con un contador.
