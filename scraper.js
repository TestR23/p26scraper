import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

const URL = "https://www.futbolenlatv.es/competicion/la-liga";
const OUTPUT_PATH = "docs/partidos.json";

async function scrapearLaLigaHoy() {
  console.log("⚽ Iniciando scraper LaLiga...");

  const response = await axios.get(URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    },
  });

  const $ = cheerio.load(response.data);
  const partidos = [];

  // 👉 SOLO la primera tabla (HOY)
  const tablaHoy = $("table.tablaPrincipal").first();

  tablaHoy.find("tr").each((_, row) => {
    const hora = $(row).find("td.hora").text().trim();
    const local = $(row).find("td.local span").text().trim();
    const visitante = $(row).find("td.visitante span").text().trim();

    if (!hora || !local || !visitante) return;

    const canales = [];

    $(row)
      .find("td.canales ul.listaCanales li")
      .each((_, li) => {
        const nombre = $(li).text().trim();
        if (nombre && !nombre.includes("Comprar")) {
          canales.push(nombre);
        }
      });

    partidos.push({
      hora,
      local,
      visitante,
      canales,
    });
  });

  const resultado =
    partidos.length > 0
      ? {
          fecha: "HOY",
          competicion: "LaLiga EA Sports",
          partidos,
          total: partidos.length,
          actualizacion: new Date().toISOString(),
        }
      : {
          fecha: "HOY",
          mensaje: "Hoy no hay partidos de LaLiga EA Sports",
          actualizacion: new Date().toISOString(),
        };

  // 👉 Asegurar que existe la carpeta docs/
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });

  // 👉 Guardar JSON donde el workflow lo espera
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(resultado, null, 2));

  console.log(`✅ ${OUTPUT_PATH} generado (${partidos.length} partidos)`);
}

scrapearLaLigaHoy().catch((err) => {
  console.error("❌ Error en el scraper:", err.message);
  process.exit(1);
});
