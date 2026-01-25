import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

const URL = "https://www.futbolenlatv.es/competicion/la-liga";

async function scrapearLaLigaHoy() {
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
        }
      : {
          fecha: "HOY",
          mensaje: "Hoy no hay partidos de LaLiga EA Sports",
        };

   fs.writeFileSync('docs/partidos.json', JSON.stringify(data, null, 2));
  console.log("⚽ partidos.json generado correctamente");
}

scrapearLaLigaHoy();
