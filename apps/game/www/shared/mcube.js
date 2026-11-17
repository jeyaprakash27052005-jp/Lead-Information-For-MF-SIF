/* Mcube Games: shared code for every game on the games site and in the apps.
   - GAMES: the list of games (the Game Admin site turns them on/off and sets the order)
   - register(): saves a player's registration in the online database (collection gamePlayers)
   - finish():   saves the player's result
   Works offline: anything that cannot be sent is kept on the device and sent when online again. */
(function () {
  var FB = { p: "extended-history-5xctm", d: "ai-studio-leadflowmanager-bcefb4c1-411b-40a6-bac1-6db2d10e0822", k: "AIzaSyDYJFZoBMkmXl8f0N1BthmNx3uBrH0u3H8" };
  var BASE = "https://firestore.googleapis.com/v1/projects/" + FB.p + "/databases/" + encodeURIComponent(FB.d) + "/documents/";

  var GAMES = [
    { id: "investment", name: "Investment Business", icon: "🎲", file: "games/investment.html", who: "Grown-ups and kids · 1 to 4 players",
      desc: "Move round the board with the dice or the spinning wheel and learn a money habit on every square." },
    { id: "adventure", name: "Money Adventure", icon: "🌟", file: "games/adventure.html", who: "Kids",
      desc: "Pick a hero, choose where to invest and watch the money grow year by year." },
    { id: "challenge", name: "₹1 Lakh → ₹10 Lakh Challenge", icon: "💰", file: "games/challenge.html", who: "Grown-ups",
      desc: "Build a portfolio, face 3 surprise events and see what 15 years can do." },
    { id: "aadupuli", name: "Bull vs Bear – Aadu Puli", icon: "🐯", file: "games/aadupuli.html", who: "Everyone · English / தமிழ்",
      desc: "The traditional goats-and-tigers game: protect your investments from market risks." },
    { id: "pallanguli", name: "Pallanguli Investment Game", icon: "🌰", file: "games/pallanguli.html", who: "2 players · English / தமிழ்",
      desc: "Play the traditional pits game, then invest the seeds you saved." },
    { id: "finance", name: "Personal Finance Management", icon: "🏦", file: "games/finance.html", who: "Grown-ups · 1 to 4 players",
      desc: "Salary, expenses, loans, insurance and investing, month by month on a board." }
  ];
  var byId = {}; GAMES.forEach(function (g) { byId[g.id] = g; });

  /* ---------- small helpers ---------- */
  function ls(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function device() {
    var u = navigator.userAgent || "", app = /Electron/.test(u) || !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    var os = /android/i.test(u) ? "android" : (/iPhone|iPad|iPod/.test(u) || (/Mac/.test(navigator.platform) && navigator.maxTouchPoints > 1)) ? "ios" : /Win/.test(navigator.platform) ? "windows" : /Mac/.test(navigator.platform) ? "mac" : "other";
    return (app ? "app-" : "web-") + os;
  }
  function inApp() { try { return /Electron/.test(navigator.userAgent) || !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) || matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; } catch (e) { return false; } }

  /* Firestore REST value encoding */
  function enc(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === "boolean") return { booleanValue: v };
    if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
    if (typeof v === "object") { var f = {}; Object.keys(v).forEach(function (k) { if (v[k] !== undefined) f[k] = enc(v[k]); }); return { mapValue: { fields: f } }; }
    return { stringValue: String(v) };
  }
  function dec(x) {
    if (!x) return null;
    if ("stringValue" in x) return x.stringValue; if ("booleanValue" in x) return x.booleanValue;
    if ("integerValue" in x) return Number(x.integerValue); if ("doubleValue" in x) return x.doubleValue;
    if ("nullValue" in x) return null; if ("timestampValue" in x) return x.timestampValue;
    if ("arrayValue" in x) return (x.arrayValue.values || []).map(dec);
    if ("mapValue" in x) { var o = {}, f = x.mapValue.fields || {}; Object.keys(f).forEach(function (k) { o[k] = dec(f[k]); }); return o; }
    return null;
  }
  function fields(o) { var f = {}; Object.keys(o).forEach(function (k) { if (o[k] !== undefined) f[k] = enc(o[k]); }); return f; }
  function timeout(ms) { var c = window.AbortController ? new AbortController() : null; if (c) setTimeout(function () { c.abort(); }, ms); return c && c.signal; }

  /* ---------- settings set in the Game Admin site (settings/gameHub) ---------- */
  var SK = "mg_settings_v1";
  var DEFAULTS = { enabled: {}, order: GAMES.map(function (g) { return g.id; }), onePlay: {}, mover: "dice" };
  function norm(s) {
    s = s || {}; var o = { enabled: s.enabled || {}, onePlay: s.onePlay || {}, mover: s.mover === "spinner" ? "spinner" : "dice", order: [] };
    (s.order || []).forEach(function (id) { if (byId[id] && o.order.indexOf(id) < 0) o.order.push(id); });
    GAMES.forEach(function (g) { if (o.order.indexOf(g.id) < 0) o.order.push(g.id); });
    return o;
  }
  function cachedSettings() { return norm(ls(SK) || DEFAULTS); }
  function loadSettings() {
    return fetch(BASE + "settings/gameHub?key=" + FB.k, { cache: "no-store", signal: timeout(7000) })
      .then(function (r) { if (r.status === 404) return DEFAULTS; if (!r.ok) throw 0; return r.json().then(function (j) { return dec({ mapValue: { fields: j.fields || {} } }); }); })
      .then(function (s) { var n = norm(s); ls(SK, n); return n; })
      .catch(function () { return cachedSettings(); });
  }
  function isOn(s, id) { return s.enabled[id] !== false; }
  function onePlay(s, id) { return s.onePlay[id] !== false; }

  /* ---------- outbox: saves that wait for the internet ---------- */
  var OB = "mg_outbox_v1";
  function queue(op) { var q = ls(OB) || []; q.push(op); ls(OB, q); }
  function send(op) {
    if (op.t === "create") {
      return fetch(BASE + "gamePlayers?documentId=" + encodeURIComponent(op.id) + "&key=" + FB.k, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields: fields(op.data) }), signal: timeout(9000) })
        .then(function (r) { if (r.ok) return "ok"; if (r.status === 409) return "dup"; if (r.status >= 400 && r.status < 500) return "rejected"; throw 0; });
    }
    var mask = Object.keys(op.data).map(function (k) { return "updateMask.fieldPaths=" + encodeURIComponent(k); }).join("&");
    return fetch(BASE + "gamePlayers/" + encodeURIComponent(op.id) + "?" + mask + "&currentDocument.exists=true&key=" + FB.k, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields: fields(op.data) }), signal: timeout(9000) })
      .then(function (r) { if (r.ok) return "ok"; if (r.status >= 400 && r.status < 500 && r.status !== 404) return "rejected"; throw 0; });
  }
  var flushing = false;
  function flush() {
    if (flushing) return Promise.resolve(); var q = ls(OB) || []; if (!q.length) return Promise.resolve();
    flushing = true; var left = [];
    return q.reduce(function (p, op) { return p.then(function () { return send(op).catch(function () { left.push(op); }); }); }, Promise.resolve())
      .then(function () { ls(OB, left.concat((ls(OB) || []).slice(q.length))); flushing = false; });
  }
  window.addEventListener("online", flush);
  setTimeout(flush, 1500);

  /* ---------- players ---------- */
  var PK = "mg_played_v1"; /* games already played on this device, by mobile */
  function playedHere(game, mobile) { var p = ls(PK) || {}; return !!p[game + "|" + mobile]; }
  function markPlayed(game, mobile) { var p = ls(PK) || {}; p[game + "|" + mobile] = 1; ls(PK, p); }
  function cleanMobile(v) { var d = String(v || "").replace(/\D/g, ""); if (d.length === 12 && d.slice(0, 2) === "91") d = d.slice(2); if (d.length === 11 && d[0] === "0") d = d.slice(1); return d; }

  /* Saves a registration. Resolves {ok, id} or {dup:true} when this mobile already played this game. */
  function register(game, p) {
    var mobile = cleanMobile(p.mobile);
    return loadSettings().then(function (s) {
      var one = onePlay(s, game);
      if (one && playedHere(game, mobile)) return { dup: true };
      var id = game + "_" + mobile + (one ? "" : "_" + Date.now().toString(36));
      var data = { game: game, gameName: (byId[game] || {}).name || game, name: String(p.name || "").trim().slice(0, 60), mobile: mobile,
        email: p.email ? String(p.email).trim().toLowerCase().slice(0, 120) : "", age: p.age ? Number(p.age) : 0, lang: p.lang || "en", mode: p.mode || "",
        consent: true, device: device(), status: "started", registeredAt: new Date().toISOString() };
      return send({ t: "create", id: id, data: data }).then(function (r) {
        if (r === "dup") return { dup: true };
        markPlayed(game, mobile); return { ok: true, id: id, saved: r === "ok" };
      }, function () { queue({ t: "create", id: id, data: data }); markPlayed(game, mobile); return { ok: true, id: id, queued: true }; });
    });
  }
  /* True when this mobile already played this game (on this device or in the online database) */
  function check(game, mobile) {
    mobile = cleanMobile(mobile);
    return loadSettings().then(function (s) {
      if (!onePlay(s, game)) return false;
      if (playedHere(game, mobile)) return true;
      return fetch(BASE + "gamePlayers/" + encodeURIComponent(game + "_" + mobile) + "?key=" + FB.k, { cache: "no-store", signal: timeout(7000) })
        .then(function (r) { return r.ok; }).catch(function () { return false; });
    });
  }
  /* Saves the result: result = short text (e.g. "WIN"), score = number, details = small object */
  function finish(id, result, score, details) {
    if (!id) return Promise.resolve();
    var data = { status: "finished", result: String(result || "").slice(0, 80), score: typeof score === "number" && isFinite(score) ? Math.round(score * 100) / 100 : 0, details: details || {}, finishedAt: new Date().toISOString() };
    var op = { t: "patch", id: id, data: data };
    return flush().then(function () { return send(op); }).catch(function () { queue(op); });
  }

  /* ---------- registration form (used by games without their own form) ---------- */
  var MOB = /^[6-9]\d{9}$/, MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function registerForm(o) {
    /* o: {game, players:1, kids:false, email:false, age:false, title, intro} -> Promise<[{id,name,mobile,...}]> */
    return new Promise(function (resolve, reject) {
      var n = o.players || 1, i = 0, out = [];
      var ov = document.createElement("div"); ov.className = "mg-ov"; document.body.appendChild(ov);
      /* Grown-ups check before any personal details are asked (children's games) */
      function gate(err) {
        var a = 3 + Math.floor(Math.random() * 7), b = 4 + Math.floor(Math.random() * 6);
        ov.innerHTML = '<form class="mg-card mg-reg" novalidate><div class="mg-reg-h"><span class="mg-ic">🔒</span><div><b>For parents</b><small>Ask a grown-up to continue</small></div></div>' +
          '<p class="mg-mut">A parent or guardian registers before the game starts.</p><label>What is ' + a + ' × ' + b + '?<input name="g" inputmode="numeric" maxlength="3" autocomplete="off"></label>' +
          '<p class="mg-err" aria-live="polite">' + esc(err || "") + '</p><div class="mg-row"><button class="mg-btn" type="submit">Continue</button>' + (o.cancel !== false ? '<button class="mg-btn alt" type="button" data-x>Back</button>' : "") + "</div></form>";
        var f = ov.querySelector("form"); f.g.focus();
        var x = ov.querySelector("[data-x]"); if (x) x.onclick = function () { ov.remove(); reject(new Error("cancelled")); };
        f.onsubmit = function (e) { e.preventDefault(); if (parseInt(f.g.value, 10) === a * b) step(); else gate("That is not right. Please ask a grown-up."); };
      }
      function step(err) {
        ov.innerHTML = '<form class="mg-card mg-reg" novalidate><div class="mg-reg-h"><span class="mg-ic">' + esc((byId[o.game] || {}).icon || "🎮") + '</span><div><b>' + esc(o.title || (byId[o.game] || {}).name || "Register") + '</b><small>' + (n > 1 ? "Player " + (i + 1) + " of " + n : "Register to play") + '</small></div></div>' +
          (o.intro ? '<p class="mg-mut">' + esc(o.intro) + "</p>" : "") +
          '<label>' + (o.parent ? "Parent’s name" : o.kids ? "Child’s name" : "Name") + '<input name="nm" autocomplete="off" maxlength="60"></label>' +
          '<label>' + (o.kids || o.parent ? "Parent’s mobile number" : "Mobile number") + '<input name="ph" type="tel" inputmode="numeric" maxlength="14" placeholder="10-digit number" autocomplete="off"></label>' +
          (o.email ? '<label>' + (o.kids ? "Parent’s email ID" : "Email ID") + '<input name="em" type="email" autocomplete="off"></label>' : "") +
          (o.age ? '<label>Age<input name="ag" inputmode="numeric" maxlength="3"></label>' : "") +
          '<label class="mg-ck"><input name="ck" type="checkbox"><span>' + (o.kids || o.parent ? "I am the parent or guardian, and I agree that Mcube Academy may contact me about courses and investor education." : "I agree that Mcube Academy may contact me about courses and investor education.") + "</span></label>" +
          '<p class="mg-err" aria-live="polite">' + esc(err || "") + '</p><div class="mg-row"><button class="mg-btn" type="submit">' + (i + 1 < n ? "Next player" : "Start the game") + '</button>' +
          (o.cancel !== false ? '<button class="mg-btn alt" type="button" data-x>Back</button>' : "") + "</div>" +
          '<p class="mg-mut mg-s">' + (o.onePlayNote === false ? "" : "Each mobile number can play each game once. ") + '<a href="' + base() + 'privacy.html" target="_blank" rel="noopener">Privacy policy</a></p></form>';
        var f = ov.querySelector("form"); f.nm.focus();
        var x = ov.querySelector("[data-x]"); if (x) x.onclick = function () { ov.remove(); reject(new Error("cancelled")); };
        f.onsubmit = function (e) {
          e.preventDefault(); var er = f.querySelector(".mg-err");
          var p = { name: f.nm.value.trim(), mobile: cleanMobile(f.ph.value), email: f.em ? f.em.value.trim() : "", age: f.ag ? parseInt(f.ag.value, 10) : 0, mode: o.kids || o.parent ? "kids" : "" };
          if (p.name.length < 2) return er.textContent = "Please enter the name.";
          if (!MOB.test(p.mobile)) return er.textContent = "Please enter a valid 10-digit mobile number.";
          if (f.em && !MAIL.test(p.email)) return er.textContent = "Please enter a valid email ID.";
          if (f.ag && !(p.age >= 4 && p.age <= 110)) return er.textContent = "Please enter a valid age.";
          if (!f.ck.checked) return er.textContent = "Please tick the box to agree.";
          if (out.some(function (q) { return q.mobile === p.mobile; })) return er.textContent = "Each player needs a different mobile number.";
          var b = f.querySelector("[type=submit]"); b.disabled = true; b.textContent = "Saving…";
          register(o.game, p).then(function (r) {
            if (r.dup) { step("This mobile number has already played this game."); return; }
            p.id = r.id; out.push(p); i++;
            if (i < n) step(); else { ov.remove(); resolve(out); }
          });
        };
      }
      if (o.gate) gate(); else step();
    });
  }

  /* ---------- top bar with "All games" ---------- */
  /* In a single-game Android app (made by apps/game/android-games/build.mjs) window.MG_SINGLE is the game id */
  var SINGLE = window.MG_SINGLE || "";
  function base() { return /\/games\/[^/]*$/.test(location.pathname) ? "../" : ""; }
  function topbar(title) {
    if (!document.body) { document.addEventListener("DOMContentLoaded", function () { topbar(title); }); return; }
    var b = document.createElement("div"); b.className = "mg-top";
    b.innerHTML = (SINGLE ? '<img src="../icons/icon-192.png" alt="Mcube Academy">' : '<a class="mg-back" href="../index.html" aria-label="All games">‹ <span>All games</span></a>') +
      '<b>' + esc(title) + '</b>' + (SINGLE ? '<a class="mg-back" href="../privacy.html">Privacy</a>' : '<img src="../icons/icon-192.png" alt="Mcube Academy">');
    document.body.insertBefore(b, document.body.firstChild);
    if (SINGLE) loadSettings().then(function (s) {
      if (isOn(s, SINGLE)) return;
      var ov = document.createElement("div"); ov.className = "mg-ov";
      ov.innerHTML = '<div class="mg-card"><div class="mg-reg-h"><span class="mg-ic">⏸️</span><div><b>' + esc((byId[SINGLE] || {}).name || "This game") + '</b><small>Paused for now</small></div></div><p class="mg-mut">Mcube Academy has paused this game. Please check again later.</p></div>';
      document.body.appendChild(ov);
    });
  }

  window.MG = { FB: FB, GAMES: GAMES, game: function (id) { return byId[id]; }, esc: esc, device: device, inApp: inApp,
    settings: loadSettings, cachedSettings: cachedSettings, isOn: isOn, onePlay: onePlay,
    register: register, check: check, finish: finish, flush: flush, registerForm: registerForm, topbar: topbar, cleanMobile: cleanMobile, playedHere: playedHere };
})();
