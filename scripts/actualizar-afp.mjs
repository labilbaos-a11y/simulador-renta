// Actualiza las rentabilidades de las AFP dentro de index.html.
//
// Baja de la Superintendencia de Pensiones los valores cuota diarios de los fondos A a E
// de cada AFP, y de la SII la UF diaria. Con eso calcula la rentabilidad real anualizada
// de los últimos 5 años al último día publicado:
//
//   real = ((cuota_fin / cuota_inicio) / (UF_fin / UF_inicio)) ^ (1/5) - 1
//
// y reemplaza el bloque entre /* AFP:INICIO */ y /* AFP:FIN */ de index.html.
// Si algo falla o los números no son razonables, termina con error sin tocar el archivo:
// la página sigue con los datos de la última vez que funcionó.
//
// Uso: node scripts/actualizar-afp.mjs        (lo corre a diario .github/workflows/actualizar-afp.yml)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const HTML = path.join(RAIZ, "index.html");
const AFPS = ["CAPITAL", "CUPRUM", "HABITAT", "MODELO", "PLANVITAL", "PROVIDA", "UNO"];
const FONDOS = ["A", "B", "C", "D", "E"];
const ANIOS = 5;
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
               "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

async function bajar(url) {
  for (let intento = 1; ; intento++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "simulador-renta (GitHub Actions)" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return Buffer.from(await r.arrayBuffer()).toString("latin1");
    } catch (e) {
      if (intento >= 3) throw new Error("No se pudo bajar " + url + ": " + e.message);
      await new Promise((ok) => setTimeout(ok, 5000 * intento));
    }
  }
}

const numero = (txt) => Number(String(txt).trim().replace(/\./g, "").replace(",", "."));
const iso = (d) => d.toISOString().slice(0, 10);

/* Valores cuota de un tipo de fondo: { "2026-11-22": { CUPRUM: {cuota, patrimonio}, ... } } */
async function valoresCuota(tf, desde, hasta) {
  const hoy = iso(new Date()).replace(/-/g, "");
  const url = "https://www.spensiones.cl/apps/valoresCuotaFondo/vcfAFPxls.php" +
    `?aaaaini=${desde}&aaaafin=${hasta}&tf=${tf}&fecconf=${hoy}`;
  const lineas = (await bajar(url)).split(/\r?\n/);
  const iCab = lineas.findIndex((l) => l.startsWith("Fecha;"));
  if (iCab < 0) throw new Error(`Fondo ${tf}: el archivo no trae la cabecera esperada`);
  // La cabecera trae el nombre de cada AFP en la columna de su valor cuota.
  const cab = lineas[iCab].split(";");
  const col = {};
  AFPS.forEach((a) => {
    const i = cab.indexOf(a);
    if (i < 0) throw new Error(`Fondo ${tf}: falta la columna de ${a}`);
    col[a] = i;
  });
  const datos = {};
  for (const l of lineas.slice(iCab + 2)) {
    const c = l.split(";");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c[0])) continue;
    const fila = {};
    let completa = true;
    for (const a of AFPS) {
      const cuota = numero(c[col[a]]), patrimonio = numero(c[col[a] + 1]);
      if (!(cuota > 0)) { completa = false; break; }
      fila[a] = { cuota, patrimonio };
    }
    if (completa) datos[c[0]] = fila;
  }
  return datos;
}

/* UF diaria de un año desde la tabla de la SII: { "2026-11-22": 41384.81, ... } */
async function ufDelAnio(anio) {
  const html = await bajar(`https://www.sii.cl/valores_y_fechas/uf/uf${anio}.htm`);
  const uf = {};
  MESES.forEach((mes, m) => {
    const i = html.indexOf(`id='mes_${mes}'`);
    if (i < 0) return;
    const fin = html.indexOf("</table>", i);
    const tramo = html.slice(i, fin);
    const re = /<strong>(\d{1,2})<\/strong><\/th>\s*<td[^>]*>([\d.,]*)<\/td>/g;
    let x;
    while ((x = re.exec(tramo))) {
      if (!x[2]) continue;
      const dia = String(x[1]).padStart(2, "0"), mm = String(m + 1).padStart(2, "0");
      uf[`${anio}-${mm}-${dia}`] = numero(x[2]);
    }
  });
  if (!Object.keys(uf).length) throw new Error(`La SII no trajo valores de UF para ${anio}`);
  return uf;
}

/* El último día que esté en todos los fondos y tenga UF. */
function ultimaFechaComun(series, uf) {
  const fechas = Object.keys(series.A).sort().reverse();
  return fechas.find((f) => uf[f] && FONDOS.every((t) => series[t][f]));
}

/* El mismo día de hace 5 años; si no hay dato (29 de febrero), el anterior que exista. */
function fechaInicio(fin, series, uf) {
  const d = new Date(fin + "T12:00:00Z");
  d.setUTCFullYear(d.getUTCFullYear() - ANIOS);
  for (let k = 0; k < 7; k++) {
    const f = iso(d);
    if (uf[f] && FONDOS.every((t) => series[t][f])) return f;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  throw new Error("No hay datos para el inicio del período de " + ANIOS + " años");
}

async function main() {
  const anioFin = new Date().getUTCFullYear();
  const anioIni = anioFin - ANIOS - 1;

  const series = {};
  for (const t of FONDOS) series[t] = await valoresCuota(t, anioIni, anioFin);
  const uf = {};
  for (let a = anioIni; a <= anioFin; a++) Object.assign(uf, await ufDelAnio(a));

  const fin = ultimaFechaComun(series, uf);
  if (!fin) throw new Error("No hay un día con valores cuota y UF a la vez");
  const ini = fechaInicio(fin, series, uf);
  const factorUf = uf[fin] / uf[ini];

  const tasas = {};
  for (const a of AFPS.concat("SISTEMA")) tasas[a] = {};
  for (const t of FONDOS) {
    let suma = 0, peso = 0;
    for (const a of AFPS) {
      const nominal = series[t][fin][a].cuota / series[t][ini][a].cuota;
      const real = (Math.pow(nominal / factorUf, 1 / ANIOS) - 1) * 100;
      if (!Number.isFinite(real) || Math.abs(real) > 25) {
        throw new Error(`${a} fondo ${t}: rentabilidad fuera de rango (${real})`);
      }
      tasas[a][t] = Math.round(real * 100) / 100;
      // El promedio del sistema pondera cada AFP por su patrimonio en ese fondo.
      suma += real * series[t][fin][a].patrimonio;
      peso += series[t][fin][a].patrimonio;
    }
    tasas.SISTEMA[t] = Math.round((suma / peso) * 100) / 100;
  }

  const datos = { desde: ini, hasta: fin, ufDesde: uf[ini], ufHasta: uf[fin], tasas };
  const bloque = "/* AFP:INICIO */\n  var AFP_DATOS = " + JSON.stringify(datos, null, 2).replace(/\n/g, "\n  ") + ";\n  /* AFP:FIN */";

  const html = fs.readFileSync(HTML, "utf8");
  const re = /\/\* AFP:INICIO \*\/[\s\S]*?\/\* AFP:FIN \*\//;
  if (!re.test(html)) throw new Error("index.html no tiene el bloque /* AFP:INICIO */ … /* AFP:FIN */");
  const actual = html.match(/"hasta": "(\d{4}-\d{2}-\d{2})"/);
  if (actual && actual[1] > fin) throw new Error(`Los datos nuevos (${fin}) son más viejos que los publicados (${actual[1]})`);
  const nuevo = html.replace(re, bloque);
  if (nuevo === html) { console.log("Sin cambios: datos al " + fin); return; }
  fs.writeFileSync(HTML, nuevo);
  console.log(`Rentabilidades AFP actualizadas: ${ini} a ${fin} (UF ${uf[ini]} → ${uf[fin]})`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
