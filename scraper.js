import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUTPUT_PATH = "docs/partidos.json";
const URL = "https://www.futbolenlatv.es/competicion/la-liga";

async function scrapearLaLiga() {
  console.log("⚽ Abriendo navegador...");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let datosPartidos = null;

  page.on("response", async (response) => {
    const url = response.url();

    // 👇 Este es el patrón bueno (endpoints reales de partidos)
    if (url.includes("futbolenlatv") && url.includes("laliga")) {
      try {
        const json = await response.json();
        datosPartidos = json;
        console.log("🎯 API de partidos capturada:", url);
      } catch {}
    }
  });

  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(8000); // esperar a que todas las XHR carguen

  await browser.close();

  if (!datosPartidos) {
    console.log("⚠️ No se ha capturado la API de partidos");
    return;
  }

  // Guardamos SOLO lo que nos interesa
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(datosPartidos, null, 2));

  console.log("✅ partidos.json generado desde API real");
}

scrapearLaLiga();

