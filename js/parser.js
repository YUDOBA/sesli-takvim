(function (root) {
  const TZ = "Europe/Istanbul";
  function pad(n) { return String(n).padStart(2, "0"); }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function atHour(base, h, m) { const d = new Date(base); d.setHours(h, m, 0, 0); return d; }
  function toLocalInput(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  function norm(t) { return String(t || "").replace(/\s+/g, " ").trim().toLocaleLowerCase("tr-TR"); }
  function wordToNum(s) {
    const map = { bir:1, iki:2, "üç":3, uc:3, "dört":4, dort:4, "beş":5, bes:5, "altı":6, yedi:7, sekiz:8, dokuz:9, on:10, "yarım":0.5, yarim:0.5 };
    s = norm(s); if (map[s] != null) return map[s];
    const n = parseFloat(String(s).replace(",", ".")); return isNaN(n) ? null : n;
  }
  function splitSpeech(text) {
    const raw = String(text || "").replace(/\s+/g, " ").trim();
    const titleCut = raw.split(/\betkinlik\s+ad[ıi](?=\s|$|[.,;:!])/i);
    let titlePart = "", afterTitle = raw;
    if (titleCut.length >= 2) { titlePart = titleCut[0].trim(); afterTitle = titleCut.slice(1).join(" ").trim(); }
    const remCut = afterTitle.split(/\bhat[ıi]rlatma(?=\s|$|[.,;:!])/i);
    let schedulePart = afterTitle, reminderPart = "", hasReminderKeyword = false;
    if (remCut.length >= 2) { schedulePart = remCut[0].trim(); reminderPart = remCut.slice(1).join(" ").trim(); hasReminderKeyword = true; }
    return { raw: raw, titlePart: titlePart, schedulePart: schedulePart, reminderPart: reminderPart, hasReminderKeyword: hasReminderKeyword };
  }
  function chunkReminders(chunk) {
    const t = norm(chunk); const out = [];
    if (/^(yok|olmas[ıi]n)/.test(t)) return out;
    const re = /(?:(\d+(?:[.,]\d+)?)|(bir|iki|[üu][çc]|d[öo]rt|be[şs]|alt[ıi]|yedi|sekiz|dokuz|on|yar[ıi]m))\s*(saat|dk|dakika|g[uün])/g;
    let m;
    while ((m = re.exec(t))) {
      const n = m[1] ? parseFloat(m[1].replace(",", ".")) : wordToNum(m[2]);
      if (n == null) continue;
      const u = m[3];
      if (u.indexOf("g") === 0) out.push(Math.round(n * 1440));
      else if (u.indexOf("saat") === 0) out.push(Math.round(n * 60));
      else out.push(Math.round(n));
    }
    return out;
  }
  function parseUtterance(text, now) {
    now = now ? new Date(now) : new Date();
    const parts = splitSpeech(text);
    const schedule = parts.schedulePart || text;
    const t = norm(schedule);
    const today = new Date(now); today.setHours(0,0,0,0);
    let day = today;
    if (/yar[ıi]n/.test(t)) day = addDays(today, 1);
    else if (/bug[üun]/.test(t)) day = today;
    let hour = 9, minute = 0;
    let m = t.match(/saat\s*(\d{1,2})(?:[:.](\d{2}))?/);
    if (!m) m = t.match(/\b(\d{1,2})[:.](\d{2})\b/);
    if (m) { hour = parseInt(m[1], 10); minute = m[2] ? parseInt(m[2], 10) : 0; }
    if (/ak[şs]am/.test(t) && hour < 12) hour += 12;
    const start = atHour(day, hour, minute);
    let dur = 60;
    const dh = t.match(/(\d+(?:[.,]\d+)?)\s*saat\s*s[ür]/);
    const dm = t.match(/(\d+)\s*(?:dk|dakika)\s*s[ür]/);
    if (dh) dur = Math.round(parseFloat(dh[1].replace(",", ".")) * 60);
    if (dm) dur = parseInt(dm[1], 10);
    const end = new Date(start.getTime() + dur * 60000);
    let reminders = [];
    if (parts.hasReminderKeyword) reminders = chunkReminders(parts.reminderPart);
    const title = (parts.titlePart || "Yeni etkinlik").replace(/^[\s,\.]+|[\s,\.]+$/g, "") || "Yeni etkinlik";
    return { title: title, start: start, end: end, durationMinutes: dur, reminders: reminders, timezone: TZ, raw: text, startLocal: toLocalInput(start), endLocal: toLocalInput(end) };
  }
  root.TakvimParser = { parseUtterance: parseUtterance, TZ: TZ };
})(typeof window !== "undefined" ? window : globalThis);
