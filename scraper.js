import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

const URL = "https://www.partidos-de-hoy.com/";
const OUTPUT_PATH = "docs/partidos.json";

async function scrapearPartidosHoy() {
  console.log("⚽ Iniciando scraper partidos-de-hoy.com...");

  const { data } = await axios.get(URL, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  console.log("HTML length:", data.length);

  const $ = cheerio.load(data);
  const resultado = [];

  // Buscar fechas por headers
  $("h2, h3").each((_, header) => {
    const textoFecha = $(header).text().trim();

    // Filtrar solo fechas reales
    if (!textoFecha.match(/\d{1,2}\s+\w+/i)) return;

    const partidos = [];
    let el = $(header).next();

    while (el.length && !["h2", "h3"].includes(el[0].name)) {
      const texto = el.text().replace(/\s+/g, " ").trim();

      // Buscar patrón tipo "21:00 Equipo vs Equipo"
      const horaMatch = texto.match(/\b\d{1,2}:\d{2}\b/);

      if (horaMatch) {
        const hora = horaMatch[0];

        // equipos
        const equiposMatch = texto.match(/(\d{1,2}:\d{2})\s+(.+?)\s+vs\s+(.+?)(Canal|TV|$)/i);

        if (equiposMatch) {
          const local = equiposMatch[2].trim();
          const visitante = equiposMatch[3].trim();

          // canales
          const canales = [];
          const canalesMatch = texto.match(/(DAZN.*|Movistar.*|LaLiga.*|Teledeporte.*|Gol.*)/gi);
          if (canalesMatch) {
            canalesMatch.forEach(c => canales.push(c.trim()));
          }

          partidos.push({ hora, local, visitante, canales });
        }
      }

      el = el.next();
    }

    if (partidos.length > 0) {
      resultado.push({
        fecha: textoFecha,
        competicion: "LaLiga",
        partidos,
        total: partidos.length
      });
    }
  });

  if (resultado.length === 0) {
    console.log("⚠️ ALERTA: No se han encontrado partidos");
  } else {
    console.log(`✅ Scraping OK: ${resultado.length} días`);
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(resultado, null, 2));
}

scrapearPartidosHoy();


