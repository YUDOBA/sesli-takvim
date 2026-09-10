(function (root) {
  const SCOPE = "https://www.googleapis.com/auth/calendar.events";
  let tokenClient = null;
  let accessToken = "";
  function localDateTime(value) {
    if (!value) return "";
    return value.length === 16 ? value + ":00" : value;
  }
  function toEvent(draft) {
    const tz = draft.timezone || "Europe/Istanbul";
    const reminders = (draft.reminders || []).filter(function (m) { return Number(m) > 0; });
    return {
      summary: draft.title,
      description: draft.raw || "",
      start: { dateTime: localDateTime(draft.startLocal), timeZone: tz },
      end: { dateTime: localDateTime(draft.endLocal), timeZone: tz },
      reminders: {
        useDefault: false,
        overrides: reminders.length
          ? reminders.map(function (m) { return { method: "popup", minutes: Number(m) }; })
          : [{ method: "popup", minutes: 60 }]
      }
    };
  }
  function ensureTokenClient() {
    const clientId = window.APP_CONFIG && window.APP_CONFIG.googleClientId;
    if (!clientId) throw new Error("config.js icinde googleClientId bos.");
    if (!window.google || !google.accounts || !google.accounts.oauth2) throw new Error("Google scripti yuklenmedi. Sayfayi yenile.");
    if (!tokenClient) {
      tokenClient = google.accounts.oauth2.initTokenClient({ client_id: clientId, scope: SCOPE, callback: function () {} });
    }
    return tokenClient;
  }
  function requestToken() {
    return new Promise(function (resolve, reject) {
      try {
        const client = ensureTokenClient();
        client.callback = function (resp) {
          if (resp && resp.access_token) { accessToken = resp.access_token; resolve(accessToken); }
          else reject(new Error((resp && resp.error) || "Google izni alinamadi"));
        };
        client.requestAccessToken({ prompt: accessToken ? "" : "consent" });
      } catch (err) { reject(err); }
    });
  }
  async function insertGoogle(draft) {
    if (!(window.APP_CONFIG && window.APP_CONFIG.googleClientId)) throw new Error("Client ID yok. config.js doldur.");
    if (!accessToken) await requestToken();
    const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
      body: JSON.stringify(toEvent(draft))
    });
    const data = await res.json();
    if (res.status === 401) { accessToken = ""; await requestToken(); return insertGoogle(draft); }
    if (!res.ok) throw new Error((data.error && data.error.message) || ("Calendar API " + res.status));
    return { mode: "google", message: "Google Takvim'e yazildi: " + (data.summary || draft.title), event: data };
  }
  root.TakvimCal = { toEvent: toEvent, insertGoogle: insertGoogle, requestToken: requestToken };
})(window);
