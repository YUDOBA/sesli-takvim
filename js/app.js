(function () {
  const $ = (id) => document.getElementById(id);
  let rec = null, listening = false;
  function formatWhen(d) {
    return new Date(d).toLocaleString("tr-TR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  function remindText(list) {
    if (!list || !list.length) return "Yok";
    return list.map((m) => (m >= 1440 && m % 1440 === 0 ? (m / 1440) + " gun once" : m % 60 === 0 ? (m / 60) + " saat once" : m + " dk once")).join(", ");
  }
  function durationText(startLocal, endLocal) {
    const m = Math.max(0, Math.round((new Date(endLocal) - new Date(startLocal)) / 60000));
    if (m >= 60 && m % 60 === 0) return (m / 60) + " saat";
    if (m >= 60) return Math.floor(m / 60) + " saat " + (m % 60) + " dk";
    return m + " dk";
  }
  function paintPreview(d) {
    $("previewTitle").textContent = d.title || "-";
    $("previewWhen").textContent = formatWhen(d.startLocal) + " -> " + formatWhen(d.endLocal);
    $("previewDur").textContent = durationText(d.startLocal, d.endLocal);
    $("previewRemind").textContent = remindText(d.reminders);
  }
  function applyDraft(d) {
    $("title").value = d.title || "";
    $("start").value = d.startLocal;
    $("end").value = d.endLocal;
    $("reminders").value = (d.reminders || []).join(", ");
    paintPreview(d);
    $("editor").hidden = false;
  }
  function readForm() {
    const reminders = $("reminders").value.split(/[,\s]+/).map((x) => parseInt(x, 10)).filter((n) => !isNaN(n) && n > 0);
    return { title: $("title").value.trim() || "Yeni etkinlik", startLocal: $("start").value, endLocal: $("end").value, reminders: reminders, timezone: window.APP_CONFIG.timezone, raw: $("transcript").value };
  }
  function parseNow() {
    const text = $("transcript").value.trim();
    if (!text) { $("status").textContent = "Once konus veya yaz."; return; }
    applyDraft(TakvimParser.parseUtterance(text));
    $("status").textContent = "Ozet hazir.";
  }
  function startSpeech() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { $("status").textContent = "Canli dikte yok."; return; }
    rec = new SR(); rec.lang = "tr-TR"; rec.interimResults = true; rec.continuous = true;
    rec.onresult = function (e) { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + " "; $("transcript").value = t.trim(); };
    rec.onerror = function (e) { $("status").textContent = "Dikte: " + e.error; stopSpeech(); };
    rec.onend = function () { if (listening) rec.start(); };
    listening = true; rec.start();
    $("mic").classList.add("live"); $("mic").textContent = "Dinleniyor";
  }
  function stopSpeech() {
    listening = false; try { rec && rec.stop(); } catch (e) {}
    $("mic").classList.remove("live"); $("mic").textContent = "Konusmaya basla";
    if ($("transcript").value.trim()) parseNow();
  }
  $("mic").onclick = function () { listening ? stopSpeech() : startSpeech(); };
  $("parseBtn").onclick = parseNow;
  $("sampleBtn").onclick = function () {
    $("transcript").value = "Polonya ile toplanti etkinlik adi yarin saat 16:00 1 saat sursun hatirlatma 1 gun 1 saat";
    parseNow();
  };
  ["title", "start", "end", "reminders"].forEach(function (id) {
    $(id).addEventListener("input", function () { paintPreview(readForm()); });
  });
  if ($("googleBtn")) {
    $("googleBtn").onclick = async function () {
      try {
        $("status").textContent = "Google izni aciliyor...";
        await TakvimCal.requestToken();
        $("googleBtn").textContent = "Google bagli";
        $("status").textContent = "Baglandi. Kaydet Google Takvim'e yazar.";
      } catch (err) { $("status").textContent = err.message; }
    };
  }
  $("saveBtn").onclick = async function () {
    const d = readForm();
    $("status").textContent = "Kaydediliyor...";
    try {
      const res = await TakvimCal.insertGoogle(d);
      $("status").textContent = res.message || "Tamam.";
    } catch (err) { $("status").textContent = err.message; }
  };
})();
