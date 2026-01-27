import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

const URL =
  "https://espndeportes.espn.com/futbol/calendario/_/league/esp.1/primera-division-de-espana";
const OUTPUT_PATH = "docs/partidos.json";

async function scrapearESPN() {
  console.log("⚽ Iniciando scraper ESPN Deportes...");

  const { data } = await axios.get(URL, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "es-ES,es;q=0.9",
    },
  });

  console.log("HTML length:", data.length);

  const $ = cheerio.load(data);
  const resultado = [];

  // Cada bloque de fecha
  $("h2.Table__Title").each((_, header) => {
    const fecha = $(header).text().trim();
    const partidos = [];

    // La tabla viene justo después del h2
    const tabla = $(header).next("div").find("table");

    tabla.find("tbody tr").each((_, row) => {
      const cols = $(row).find("td");
      if (cols.length < 3) return;

      const equiposTexto = $(cols[0]).text().replace(/\s+/g, " ").trim();
      const hora = $(cols[1]).text().trim();
      const tv = $(cols[2]).text().replace(/\s+/g, " ").trim();

      // Formato: "Espanyol v Alavés"
      const match = equiposTexto.match(/(.+?)\sv\s(.+)/i);
      if (!match) return;

      const local = match[1].trim();
      const visitante = match[2].trim();

      const canales = tv
        ? tv.split(",").map(c => c.trim()).filter(Boolean)
        : [];

      partidos.push({
        hora,
        local,
        visitante,
        canales,
      });
    });

    if (partidos.length > 0) {
      resultado.push({
        fecha,
        competicion: "LaLiga",
        partidos,
        total: partidos.length,
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

scrapearESPN().catch(err => {
  console.error("❌ Error en scraper:", err.message);
  process.exit(1);
});


