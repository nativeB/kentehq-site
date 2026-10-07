/* Product analytics (Mixpanel, EU). Runtime-configured via /config.js; a no-op when no token is set,
   when the browser sends Do Not Track / Global Privacy Control, or for bots. */
(function () {
  "use strict";
  var cfg = window.KENTE_ANALYTICS || {};
  var APP = "site";
  var token = cfg.token || "";
  var apiHost = cfg.apiHost || "https://api-eu.mixpanel.com";
  var nav = window.navigator || {};

  // Strip everything except utm_* and ref from a URL; drop the hash.
  function clean(raw) {
    try {
      var u = new URL(raw, window.location.href);
      var keep = [];
      u.searchParams.forEach(function (v, k) {
        if (/^utm_/i.test(k) || k === "ref") keep.push([k, v]);
      });
      var qs = keep.map(function (p) { return encodeURIComponent(p[0]) + "=" + encodeURIComponent(p[1]); }).join("&");
      return u.origin + u.pathname + (qs ? "?" + qs : "");
    } catch (e) { return ""; }
  }
  window.__kenteCleanUrl = clean;

  function disabled() {
    if (!token) return true;
    if (nav.doNotTrack === "1" || window.doNotTrack === "1" || nav.msDoNotTrack === "1") return true;
    if (nav.globalPrivacyControl === true) return true;
    if (nav.webdriver) return true;
    if (/bot|crawl|spider|slurp|headless|lighthouse|preview/i.test(nav.userAgent || "")) return true;
    return false;
  }
  if (disabled()) return;

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";
  s.onload = start;
  document.head.appendChild(s);

  function start() {
    var mp = window.mixpanel;
    if (!mp || !mp.init) return;
    mp.init(token, {
      api_host: apiHost,
      persistence: "cookie",
      cross_subdomain_cookie: true,
      secure_cookie: window.location.protocol === "https:",
      track_pageview: false,
      autocapture: false,
      record_sessions_percent: 0,
      ip: false,
      respect_dnt: true,
      ignore_dnt: false,
      property_blacklist: ["$current_url", "$referrer"]
    });
    mp.register({
      app: APP,
      current_url: clean(window.location.href),
      referrer: nav && document.referrer ? clean(document.referrer) : ""
    });

    function pagePath() { return window.location.pathname; }
    mp.track("Page View", { path: pagePath(), title: document.title });

    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var a = t.closest("a");
      var card = t.closest(".product");
      if (card) {
        var h = card.querySelector("h3");
        var st = card.querySelector(".status");
        var domain = card.querySelector(".domain");
        mp.track("Product Clicked", {
          product: h ? h.textContent.trim() : "",
          status: st ? st.textContent.trim() : "",
          domain: domain ? domain.textContent.trim() : "",
          target: a ? clean(a.href) : "card",
          path: pagePath()
        });
      }
      if (!a) return;
      var cta = a.closest(".btn");
      if (cta) {
        mp.track("CTA Clicked", {
          label: (cta.textContent || "").replace(/\s+/g, " ").trim().replace(/\s*↗$/, ""),
          target: clean(a.href),
          path: pagePath()
        });
      }
      try {
        var u = new URL(a.href, window.location.href);
        if (/^https?:$/.test(u.protocol) && u.hostname !== window.location.hostname) {
          mp.track("Outbound Link", { url: u.origin + u.pathname, host: u.hostname, path: pagePath() });
        }
      } catch (err) { /* ignore */ }
    }, true);
  }
})();
