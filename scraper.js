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

  // Cada bloque de fecha + tabla
  $(".bloque").each((_, bloque) => {
    const fecha = $(bloque).find(".cabecera h2").text().trim();
    const partidos = [];

    $(bloque)
      .find("table.tablaPrincipal tr")
      .each((_, row) => {
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

    if (partidos.length > 0) {
      resultado.push({
        fecha,
        competicion: "LaLiga EA Sports",
        partidos,
      });
    }
  });

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(resultado, null, 2));

  console.log(`✅ partidos.json generado con ${resultado.length} días`);
}

scrapearLaLiga();
