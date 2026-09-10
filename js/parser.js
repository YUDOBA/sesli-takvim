(function (root) {
  const TZ = "Europe/Istanbul";
  function pad(n) { return String(n).padStart(2, "0"); }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function atHour(base, h, m) { const d = new Date(base); d.setHours(h, m, 0, 0); return d; }
  function toLocalInput(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  function norm(t) { return String(t || "").replace(/\s+/g, " ").trim().toLocaleLowerCase("tr-TR"); }
  function parseUtterance(text, now) {
    now = now ? new Date(now) : new Date();
    const t = norm(text);
    const today = new Date(now); today.setHours(0,0,0,0);
    let day = today;
    if (/yar[\u0131i]n/.test(t)) day = addDays(today, 1);
    else if (/bug[\u00fcun]/.test(t)) day = today;
    else if (/[\u00f6o]b[\u00fcru]r\s*g[\u00fcun]/.test(t)) day = addDays(today, 2);
    const wd = {pazar:0,pazartesi:1,sal\u0131:2,sali:2,"\u00e7ar\u015famba":3,carsamba:3,"per\u015fembe":4,persembe:4,cuma:5,cumartesi:6};
    Object.keys(wd).forEach(function (k) {
      if (t.indexOf(k) >= 0) {
        const cur = today.getDay();
        let add = (wd[k] - cur + 7) % 7; if (add === 0) add = 7;
        day = addDays(today, add);
      }
    });
    let hour = 9, minute = 0;
    let m = t.match(/saat\s*(\d{1,2})(?:[:.](\d{2}))?/);
    if (!m) m = t.match(/\b(\d{1,2})[:.](\d{2})\b/);
    if (m) { hour = parseInt(m[1], 10); minute = m[2] ? parseInt(m[2], 10) : 0; }
    if (/ak[\u015fs]am/.test(t) && hour < 12) hour += 12;
    if (/[\u00f6o][g\u011f]leden\s*sonra/.test(t) && hour < 12) hour += 12;
    const start = atHour(day, hour, minute);
    let dur = 60;
    const dh = t.match(/(\d+(?:[.,]\d+)?)\s*saat\s*s[\u00fcr]/);
    const dm = t.match(/(\d+)\s*(?:dk|dakika)\s*s[\u00fcr]/);
    if (dh) dur = Math.round(parseFloat(dh[1].replace(",", ".")) * 60);
    if (dm) dur = parseInt(dm[1], 10);
    if (/yar[\u0131i]m\s*saat/.test(t) && /s[\u00fcr]/.test(t)) dur = 30;
    const end = new Date(start.getTime() + dur * 60000);
    const reminders = [];
    const rr = /(\d+)\s*(saat|dk|dakika|g[\u00fcun])\s*[\u00f6o]nce/g;
    let r;
    while ((r = rr.exec(t))) {
      const n = parseInt(r[1], 10);
      if (r[2].indexOf("g") === 0) reminders.push(n * 24 * 60);
      else if (r[2].indexOf("saat") === 0) reminders.push(n * 60);
      else reminders.push(n);
    }
    if (!reminders.length && /hat[\u0131i]rlat/.test(t)) reminders.push(60);
    if (!reminders.length) reminders.push(60);
    if (/hat[\u0131i]rlatma\s*yok/.test(t)) reminders.length = 0;
    let title = "Yeni etkinlik";
    const tm = text.match(/(.+?)\s+etkinli[g\u011f]in\s+konusu/i) || text.match(/konusu\s*[:\-]?\s*(.+?)(?:[.!]|hat[\u0131i]rlat|$)/i);
    if (tm) title = tm[1].replace(/etkinlik\s+olu[\u015fs]tur[,.]?/ig,"").replace(/\b(bug\u00fcn|yar\u0131n)\s*(i\u00e7in)?[,.]?/ig,"").replace(/saat\s*\d{1,2}(?:[:.]\d{2})?[^,.]*/ig,"").replace(/\d+\s*saat\s*s\u00fcrs\u00fcn[,.]?/ig,"").replace(/^[\s,\.]+/,"").trim();
    if (!title) title = "Yeni etkinlik";
    return { title: title, start: start, end: end, durationMinutes: dur, reminders: reminders, timezone: TZ, raw: text, startLocal: toLocalInput(start), endLocal: toLocalInput(end) };
  }
  const api = { parseUtterance: parseUtterance, toLocalInput: toLocalInput, TZ: TZ };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.TakvimParser = api;
})(typeof window !== "undefined" ? window : globalThis);
