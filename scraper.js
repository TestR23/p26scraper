import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

const URL = "https://www.partidos-de-hoy.com/";
const OUTPUT_PATH = "docs/partidos.json";

async function scrapearPartidosHoy() {
  console.log("⚽ Iniciando scraper partidos-de-hoy.com...");

  const { data } = await axios.get(URL, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const $ = cheerio.load(data);
  const resultado = [];

  $(".bloque-dia").each((_, bloqueDia) => {
    const fecha = $(bloqueDia).find(".titulo-dia").text().trim();
    const partidos = [];

    $(bloqueDia).find(".partido").each((_, partido) => {
      const hora = $(partido).find(".hora").text().trim();
      const local = $(partido).find(".equipo-local").text().trim();
      const visitante = $(partido).find(".equipo-visitante").text().trim();

      const canales = [];
      $(partido).find(".canales span").each((_, canal) => {
        const nombre = $(canal).text().trim();
        if (nombre) canales.push(nombre);
      });

      if (hora && local && visitante) {
        partidos.push({
          hora,
          local,
          visitante,
          canales
        });
      }
    });

    if (partidos.length > 0) {
      resultado.push({
        fecha,
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

