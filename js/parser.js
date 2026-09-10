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
    const map = { bir:1, iki:2, uc:3, dort:4, bes:5, alti:6, yedi:7, sekiz:8, dokuz:9, on:10, yarim:0.5 };
    s = norm(s).replace(/ı/g,"i").replace(/ü/g,"u").replace(/ş/g,"s").replace(/ö/g,"o").replace(/ç/g,"c").replace(/ğ/g,"g");
    if (map[s] != null) return map[s];
    const n = parseFloat(String(s).replace(",", ".")); return isNaN(n) ? null : n;
  }
  function splitSpeech(text) {
    const raw = String(text || "").replace(/\s+/g, " ").trim();
    const titleRe = /etkinlik\s*ad[ıi]|etkinli[gğ]in\s*(?:ad[ıi]|konusu)/i;
    const remRe = /hat[ıi]rlatma|hat[ıi]rlat/i;
    let titlePart = "", afterTitle = raw;
    const tMatch = raw.match(titleRe);
    if (tMatch && tMatch.index != null) {
      titlePart = raw.slice(0, tMatch.index).trim();
      afterTitle = raw.slice(tMatch.index + tMatch[0].length).trim();
    } else {
      const stop = raw.search(/\b(bugün|bugun|yarın|yarin|saat\s*\d|\d{1,2}[:.]\d{2})\b/i);
      if (stop > 0) {
        titlePart = raw.slice(0, stop).replace(/[,\s]+$/g, "").trim();
        afterTitle = raw.slice(stop).trim();
      }
    }
    let schedulePart = afterTitle, reminderPart = "", hasReminderKeyword = false;
    const rMatch = afterTitle.match(remRe);
    if (rMatch && rMatch.index != null) {
      schedulePart = afterTitle.slice(0, rMatch.index).trim();
      reminderPart = afterTitle.slice(rMatch.index + rMatch[0].length).trim();
      hasReminderKeyword = true;
    }
    return { raw: raw, titlePart: titlePart, schedulePart: schedulePart, reminderPart: reminderPart, hasReminderKeyword: hasReminderKeyword };
  }
  function chunkReminders(chunk) {
    const t = norm(chunk).replace(/\s+ve\s+/g, " ");
    const out = [];
    if (/^(yok|olmas)/.test(t)) return out;
    const re = /(?:(\d+(?:[.,]\d+)?)|(bir|iki|uc|üç|dort|dört|bes|beş|on|yarim|yarım))\s*(saat|dk|dakika|gün|gun)/g;
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
    let hour = 9, minute = 0;
    let m = t.match(/saat\s*(\d{1,2})(?:[:.](\d{2}))?/);
    if (!m) m = t.match(/\b(\d{1,2})[:.](\d{2})\b/);
    if (m) { hour = parseInt(m[1], 10); minute = m[2] ? parseInt(m[2], 10) : 0; }
    const start = atHour(day, hour, minute);
    let dur = 60;
    const dh = t.match(/(\d+(?:[.,]\d+)?)\s*saat\s*s/);
    const dm = t.match(/(\d+)\s*(?:dk|dakika)\s*s/);
    if (dh) dur = Math.round(parseFloat(dh[1].replace(",", ".")) * 60);
    if (dm) dur = parseInt(dm[1], 10);
    const end = new Date(start.getTime() + dur * 60000);
    let reminders = [];
    if (parts.hasReminderKeyword) reminders = chunkReminders(parts.reminderPart);
    const title = (parts.titlePart || "Yeni etkinlik").replace(/^[\s,.]+|[\s,.]+$/g, "") || "Yeni etkinlik";
    return { title: title, start: start, end: end, durationMinutes: dur, reminders: reminders, timezone: TZ, raw: text, startLocal: toLocalInput(start), endLocal: toLocalInput(end) };
  }
  root.TakvimParser = { parseUtterance: parseUtterance, TZ: TZ };
})(typeof window !== "undefined" ? window : globalThis);
