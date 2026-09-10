(function (root) {
  function pad(n) { return String(n).padStart(2, "0"); }
  function icsDate(d) {
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" + pad(d.getHours()) + pad(d.getMinutes()) + "00";
  }
  function toIcs(draft) {
    const start = new Date(draft.startLocal);
    const end = new Date(draft.endLocal);
    const alarms = (draft.reminders || [60]).map(function (m) {
      return "BEGIN:VALARM\nACTION:DISPLAY\nDESCRIPTION:" + draft.title + "\nTRIGGER:-PT" + m + "M\nEND:VALARM";
    }).join("\n");
    return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Sesli Takvim//TR","BEGIN:VEVENT","UID:"+Date.now()+"@sesli-takvim","DTSTART:"+icsDate(start),"DTEND:"+icsDate(end),"SUMMARY:"+draft.title.replace(/\n/g," "),alarms,"END:VEVENT","END:VCALENDAR"].join("\n");
  }
  function downloadIcs(draft) {
    const blob = new Blob([toIcs(draft)], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "etkinlik.ics"; a.click();
  }
  async function insertGoogle(draft) {
    downloadIcs(draft);
    return { mode: "ics", message: "ICS indirildi. iPhone Takvim ile acip Google hesabina kaydedebilirsin." };
  }
  root.TakvimCal = { toIcs: toIcs, downloadIcs: downloadIcs, insertGoogle: insertGoogle };
})(window);
