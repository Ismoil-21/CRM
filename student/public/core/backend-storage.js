/**
 * Backend Storage Shim — barcha localStorage backend'ga sinxronlanadi.
 *
 * ⚠️  BUG FIX: Auth session kalitlari (edumanage_auth_*) backend KV'ga
 * YOZILMAYDI — chunki bu shared server, har bir user o'z sessionini
 * faqat o'z browserida saqlashi kerak.
 *
 * Auth kalitlari: localStorage (browser-only) + sessionStorage (fallback)
 * CRM kalitlari:  localStorage + backend KV (sinxron)
 */
(function () {
  // API base URL — Vercel da VITE_API_URL, mahallida va Render da relative ''
  var _API =
    typeof __API_BASE__ !== "undefined" && __API_BASE__ ? __API_BASE__ : "";

  // ── 1. Auth uchun CLIENT-ONLY kalitlar ro'yxati ──────────────────────────────
  var CLIENT_ONLY_KEYS = [
    "edumanage_auth_v10", // login sessiyasi — faqat browserda!
    "edu_remember_cred", // "Eslab qol" checkbox
    "edumanage_admin_cred_v1", // admin login/parol — faqat local
    "edumanage_ui_v8", // UI sozlamalari (tab, theme) — har user o'ziniki
  ];

  function isClientOnly(key) {
    return CLIENT_ONLY_KEYS.indexOf(key) !== -1;
  }

  // ── 2. Sync hydrate — boshqa skriptlar localStorage ni o'qishidan oldin ──────
  //    FAQAT CRM kalitlarini backend'dan yuklaymiz, auth kalitlarini O'ZGARTIRMAYMIZ
  try {
    var x = new XMLHttpRequest();
    x.open("GET", _API + "/api/kv", false); // sinxron
    x.send(null);
    if (x.status >= 200 && x.status < 300) {
      var r = JSON.parse(x.responseText || "{}");
      if (r && r.ok && r.data && typeof r.data === "object") {
        // Faqat AUTH bo'lmagan kalitlarni yozamiz
        Object.keys(r.data).forEach(function (k) {
          if (!isClientOnly(k)) {
            try {
              Storage.prototype.setItem.call(localStorage, k, r.data[k]);
            } catch (e) {}
          }
        });
      }
    }
  } catch (e) {
    /* offline bo'lsa ham ishlasin */
  }

  // ── 3. Yozish/o'chirishni backend ga proxy qilish ────────────────────────────
  var _set = Storage.prototype.setItem;
  var _rem = Storage.prototype.removeItem;
  var _clr = Storage.prototype.clear;

  function sync(key, value) {
    if (isClientOnly(key)) return; // Auth kalitlarini backend'ga YOZMA
    try {
      fetch(_API + "/api/kv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key, value: value }),
      }).catch(function () {});
    } catch (e) {}
  }

  localStorage.setItem = function (k, v) {
    _set.call(localStorage, k, v);
    sync(k, v);
  };

  localStorage.removeItem = function (k) {
    _rem.call(localStorage, k);
    sync(k, null);
  };

  localStorage.clear = function () {
    // Auth kalitlarini saqlab qolamiz — faqat CRM kalitlarini tozalaymiz
    var savedAuth = {};
    CLIENT_ONLY_KEYS.forEach(function (k) {
      try {
        var v = Storage.prototype.getItem.call(localStorage, k);
        if (v !== null) savedAuth[k] = v;
      } catch (e) {}
    });

    _clr.call(localStorage);

    // Auth kalitlarini qayta yozamiz
    Object.keys(savedAuth).forEach(function (k) {
      try {
        Storage.prototype.setItem.call(localStorage, k, savedAuth[k]);
      } catch (e) {}
    });

    // Backend'da faqat CRM kalitlarini tozalaymiz
    try {
      fetch(_API + "/api/kv/clear", { method: "POST" }).catch(function () {});
    } catch (e) {}
  };

  window.__BACKEND_STORAGE__ = true;
})();
