import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUTPUT_PATH = "docs/partidos.json";
const URL = "https://www.futbolenlatv.es/competicion/la-liga";

async function scrapearLaLiga() {
  console.log("⚽ Abriendo navegador...");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let datosAPI = null;

  // Escuchar respuestas de red
  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("/api/")) {
      try {
        const json = await response.json();
        datosAPI = json;
      } catch {}
    }
  });

  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(5000); // esperar a que cargue la API

  await browser.close();

  if (!datosAPI) {
    console.log("⚠️ No se ha capturado ninguna API");
    return;
  }

  // Aquí ya tienes los datos reales
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(datosAPI, null, 2));

  console.log("✅ Datos capturados desde API interna");
}

scrapearLaLiga();
