(async () => {
  const SITE_ID = "SITE_UUID";

  const device =
    /Mobi|Android/i.test(navigator.userAgent)
      ? "mobile"
      : "desktop";

  let hash = localStorage.getItem("visitor_hash");

  if (!hash) {
    hash = crypto.randomUUID();
    localStorage.setItem("visitor_hash", hash);
  }

  fetch("https://YOURPROJECT.supabase.co/rest/v1/site_visits", {
    method: "POST",
    headers: {
      apikey: "PUBLIC_ANON_KEY",
      Authorization: "Bearer PUBLIC_ANON_KEY",
      "Content-Type": "application/json",
      Prefer: "resolution=ignore",
    },
    body: JSON.stringify({
      site_id: SITE_ID,
      visitor_hash: hash,
      device,
    }),
  });
})();
