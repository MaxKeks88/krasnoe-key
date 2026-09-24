/* ============================================================
   Счётчик посещений: неделя / месяц / за всё время.
   Netlify Function — бесплатный тариф, без рекламы.
   Данные хранятся в Netlify Blobs (входят в бесплатный тариф).
   Адрес функции после деплоя: https://ваш-сайт.netlify.app/api/counter
   ============================================================ */

import { getStore } from "@netlify/blobs";

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "no-store"
};

export default async function handler(req) {
  /* CORS-предзапрос браузера */
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: HEADERS });
  }

  const url = new URL(req.url);
  const hit = url.searchParams.get("hit") === "1";

  const store = getStore("counters");
  const now = new Date();

  /* Ключи периодов (UTC): понедельник текущей недели и текущий месяц */
  const pad = (n) => String(n).padStart(2, "0");
  const dow = (now.getUTCDay() + 6) % 7;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dow));
  const weekKey = "w-" + monday.toISOString().slice(0, 10);
  const monthKey = "m-" + now.toISOString().slice(0, 7);
  const totalKey = "total";

  const keys = [weekKey, monthKey, totalKey];

  const readCount = async (k) => {
    try {
      const v = await store.get(k, { type: "text" });
      const n = parseInt(v, 10);
      return isFinite(n) ? n : 0;
    } catch (e) {
      return 0;
    }
  };

  const counts = {};
  for (const k of keys) counts[k] = await readCount(k);

  if (hit) {
    /* Инкремент с повторной попыткой: защита от редких сбоев Blobs */
    for (const k of keys) {
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          const cur = await readCount(k);
          await store.set(k, String(cur + 1));
          counts[k] = cur + 1;
          break;
        } catch (e) {
          if (attempt === 5) break;
          await new Promise((r) => setTimeout(r, 150));
        }
      }
    }
  }

  return new Response(
    JSON.stringify({
      week: counts[weekKey],
      month: counts[monthKey],
      total: counts[totalKey]
    }),
    { status: 200, headers: HEADERS }
  );
}