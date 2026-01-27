import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUTPUT_PATH = "docs/partidos.json";
const URL = "https://www.futbolenlatv.es/competicion/la-liga";

async function scrapearLaLiga() {
  console.log("⚽ Abriendo navegador...");

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });

  const resultado = await page.evaluate(() => {
    const dias = [];
    const fechas = document.querySelectorAll("h2, h3");

    fechas.forEach(fechaEl => {
      if (!fechaEl.innerText.match(/\d{2}\/\d{2}\/\d{4}/)) return;

      const fecha = fechaEl.innerText.trim();
      const partidos = [];

      let el = fechaEl.nextElementSibling;
      while (el && !["H2", "H3"].includes(el.tagName)) {
        const hora = el.querySelector("span")?.innerText;
        const equipos = el.querySelectorAll("img + span");

        if (hora && equipos.length === 2) {
          partidos.push({
            hora,
            local: equipos[0].innerText,
            visitante: equipos[1].innerText
          });
        }
        el = el.nextElementSibling;
      }

      if (partidos.length > 0) {
        dias.push({ fecha, partidos });
      }
    });

    return dias;
  });

  await browser.close();

  if (resultado.length === 0) {
    console.log("⚠️ ALERTA: No se han encontrado partidos");
  } else {
    console.log(`✅ Scraping OK: ${resultado.length} días`);
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(resultado, null, 2));
}

scrapearLaLiga();

