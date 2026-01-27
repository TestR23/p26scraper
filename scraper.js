import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

const URL = "https://www.futbolenlatv.es/competicion/la-liga";
const OUTPUT_PATH = "docs/partidos.json";

async function scrapearLaLiga() {
  console.log("⚽ Iniciando scraper LaLiga...");

  const response = await axios.get(URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    },
  });

  const $ = cheerio.load(response.data);
  const resultado = [];

  // Recorre cada sección de día
  $("h2, h3").each((_, elemento) => {
    const textoFecha = $(elemento).text().trim();

    // Detectar fecha de forma robusta
    if (!textoFecha.match(/\d{2}\/\d{2}\/\d{4}/)) return;

    const fecha = textoFecha;
    const partidos = [];

    // Buscar todos los partidos inmediatamente después de la fecha
    let siguiente = $(elemento).next();

    while (siguiente.length && siguiente.get(0).name !== "h2" && siguiente.get(0).name !== "h3") {
      const hora = siguiente.find("span:contains(':')").first().text().trim();

      const local = siguiente.find("img + span").first().text().trim();
      const visitante = siguiente.find("img + span").last().text().trim();

      if (hora && local && visitante) {
        const canales = [];
        siguiente.find("ul li").each((_, li) => {
          const canal = $(li).text().trim();
          if (canal && !canal.includes("Comprar")) {
            canales.push(canal);
          }
        });

        partidos.push({ hora, local, visitante, canales });
      }

      siguiente = siguiente.next();
    }

    if (partidos.length > 0) {
      resultado.push({ fecha, competicion: "LaLiga EA Sports", partidos });
    }
  });

  if (resultado.length === 0) {
    console.log("⚠️ ALERTA: No se han encontrado partidos");
  } else {
    console.log(`✅ Scraping OK: ${resultado.length} días encontrados`);
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(resultado, null, 2));

  console.log("RESULTADO FINAL:", JSON.stringify(resultado, null, 2));
}

scrapearLaLiga().catch((err) => {
  console.error("❌ Error en el scraper:", err.message);
  process.exit(1);
});

