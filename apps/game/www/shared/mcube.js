/* Mcube Academy FinFun: shared code for every game on the games site and in the apps.
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
      desc: "Pick 100 days, 100 weeks or 100 months, build a portfolio, face 3 surprises and see your portfolio value." },
    { id: "aadupuli", name: "Bull vs Bear – Aadu Puli", icon: "🐯", file: "games/aadupuli.html", who: "Everyone · English / தமிழ்",
      desc: "The traditional goats-and-tigers game: protect your investments from market risks." },
    { id: "pallanguli", name: "Pallanguli Investment Game", icon: "🌰", file: "games/pallanguli.html", who: "2 players · English / தமிழ்",
      desc: "Play the traditional pits game, then invest the seeds you saved." },
    { id: "finance", name: "Personal Finance Management", icon: "🏦", file: "games/finance.html", who: "Grown-ups · 1 to 4 players",
      desc: "Salary, expenses, loans, insurance and investing, month by month on a board." },
    { id: "unlock", name: "Unlock Your Future", icon: "🔐", file: "games/unlock.html", who: "Grown-ups · solo or team of 2",
      desc: "Locked in a bank vault! Beat 4 money challenges in 5 minutes to crack the code before the Scam King takes your money." }
  ];
  var byId = {}; GAMES.forEach(function (g) { byId[g.id] = g; });

  /* ---------- installed apps always show the latest website ----------
     LIVE is the games website. When an installed app (Windows, Mac, Android, iPhone) opens with internet,
     it switches to LIVE, so every change made to the site shows in the apps too, with no reinstall.
     Without internet the app keeps using the copy built into it. */
  var LIVE = "https://investment-business-game.vercel.app";
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  (function () {
    var q = location.search, m = /[?&]single=([a-z]+)/.exec(q);
    if (m) ss("mg_single", m[1]);
    if (/[?&]app=1/.test(q)) ss("mg_app", "1");
  })();

  /* ---------- small helpers ---------- */
  function ls(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function device() {
    var u = navigator.userAgent || "", app = /Electron/.test(u) || ss("mg_app") === "1" || !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    var os = /android/i.test(u) ? "android" : (/iPhone|iPad|iPod/.test(u) || (/Mac/.test(navigator.platform) && navigator.maxTouchPoints > 1)) ? "ios" : /Win/.test(navigator.platform) ? "windows" : /Mac/.test(navigator.platform) ? "mac" : "other";
    return (app ? "app-" : "web-") + os;
  }
  function inApp() { try { return /Electron/.test(navigator.userAgent) || ss("mg_app") === "1" || !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) || matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; } catch (e) { return false; } }

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
  var DEFAULTS = { enabled: {}, order: GAMES.map(function (g) { return g.id; }), onePlay: {}, mover: "dice", downloads: false };
  function norm(s) {
    s = s || {}; var o = { enabled: s.enabled || {}, onePlay: s.onePlay || {}, mover: s.mover === "spinner" ? "spinner" : "dice", downloads: s.downloads === true, order: [] };
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
  /* Registration form words, English and Tamil (o.lang = "ta") */
  var RW = {
    en: { forParents: "For parents", askGrown: "Ask a grown-up to continue", parentReg: "A parent or guardian registers before the game starts.", whatIs: "What is", cont: "Continue", back: "Back",
      notRight: "That is not right. Please ask a grown-up.", player: "Player", of: "of", reg: "Register to play", parentName: "Parent’s name", childName: "Child’s name", name: "Name",
      parentMob: "Parent’s mobile number", mob: "Mobile number", ph10: "10-digit number", parentMail: "Parent’s email ID", mail: "Email ID", age: "Age",
      agreeP: "I am the parent or guardian, and I agree that Mcube Academy may contact me about courses and investor education.", agree: "I agree that Mcube Academy may contact me about courses and investor education.",
      next: "Next player", start: "Start the game", once: "Each mobile number can play each game once. ", privacy: "Privacy policy", saving: "Saving…",
      eName: "Please enter the name.", eMob: "Please enter a valid 10-digit mobile number.", eMail: "Please enter a valid email ID.", eAge: "Please enter a valid age.", eTick: "Please tick the box to agree.",
      eSame: "Each player needs a different mobile number.", eDup: "This mobile number has already played this game." },
    ta: { forParents: "பெற்றோருக்கு", askGrown: "தொடர ஒரு பெரியவரைக் கேளுங்கள்", parentReg: "ஆட்டம் தொடங்கும் முன் பெற்றோர் அல்லது பாதுகாவலர் பதிவு செய்ய வேண்டும்.", whatIs: "இதன் விடை என்ன:", cont: "தொடரவும்", back: "பின்செல்",
      notRight: "அது சரியல்ல. ஒரு பெரியவரைக் கேளுங்கள்.", player: "வீரர்", of: "/", reg: "விளையாடப் பதிவு செய்யவும்", parentName: "பெற்றோர் பெயர்", childName: "குழந்தையின் பெயர்", name: "பெயர்",
      parentMob: "பெற்றோர் மொபைல் எண்", mob: "மொபைல் எண்", ph10: "10 இலக்க எண்", parentMail: "பெற்றோர் மின்னஞ்சல்", mail: "மின்னஞ்சல்", age: "வயது",
      agreeP: "நான் பெற்றோர் / பாதுகாவலர். பயிற்சிகள் மற்றும் முதலீட்டாளர் கல்வி பற்றி Mcube Academy என்னைத் தொடர்புகொள்ள ஒப்புக்கொள்கிறேன்.", agree: "பயிற்சிகள் மற்றும் முதலீட்டாளர் கல்வி பற்றி Mcube Academy என்னைத் தொடர்புகொள்ள ஒப்புக்கொள்கிறேன்.",
      next: "அடுத்த வீரர்", start: "ஆட்டத்தைத் தொடங்கு", once: "ஒவ்வொரு மொபைல் எண்ணும் ஒவ்வொரு ஆட்டத்தையும் ஒரு முறை மட்டுமே விளையாடலாம். ", privacy: "தனியுரிமைக் கொள்கை", saving: "சேமிக்கிறது…",
      eName: "பெயரை உள்ளிடவும்.", eMob: "சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்.", eMail: "சரியான மின்னஞ்சலை உள்ளிடவும்.", eAge: "சரியான வயதை உள்ளிடவும்.", eTick: "ஒப்புதல் பெட்டியைத் தேர்வு செய்யவும்.",
      eSame: "ஒவ்வொரு வீரருக்கும் வேறு மொபைல் எண் வேண்டும்.", eDup: "இந்த மொபைல் எண் ஏற்கனவே இந்த ஆட்டத்தை விளையாடியுள்ளது." }
  };
  function registerForm(o) {
    /* o: {game, players:1, kids:false, email:false, age:false, title, intro} -> Promise<[{id,name,mobile,...}]> */
    return new Promise(function (resolve, reject) {
      var n = o.players || 1, i = 0, out = [], W = RW[o.lang === "ta" ? "ta" : "en"];
      var ov = document.createElement("div"); ov.className = "mg-ov"; document.body.appendChild(ov);
      /* Grown-ups check before any personal details are asked (children's games) */
      function gate(err) {
        var a = 3 + Math.floor(Math.random() * 7), b = 4 + Math.floor(Math.random() * 6);
        ov.innerHTML = '<form class="mg-card mg-reg" novalidate><div class="mg-reg-h"><span class="mg-ic">🔒</span><div><b>' + W.forParents + '</b><small>' + W.askGrown + '</small></div></div>' +
          '<p class="mg-mut">' + W.parentReg + '</p><label>' + W.whatIs + ' ' + a + ' × ' + b + '?<input name="g" inputmode="numeric" maxlength="3" autocomplete="off"></label>' +
          '<p class="mg-err" aria-live="polite">' + esc(err || "") + '</p><div class="mg-row"><button class="mg-btn" type="submit">' + W.cont + '</button>' + (o.cancel !== false ? '<button class="mg-btn alt" type="button" data-x>' + W.back + '</button>' : "") + "</div></form>";
        var f = ov.querySelector("form"); f.g.focus();
        var x = ov.querySelector("[data-x]"); if (x) x.onclick = function () { ov.remove(); reject(new Error("cancelled")); };
        f.onsubmit = function (e) { e.preventDefault(); if (parseInt(f.g.value, 10) === a * b) step(); else gate(W.notRight); };
      }
      function step(err) {
        ov.innerHTML = '<form class="mg-card mg-reg" novalidate><div class="mg-reg-h"><span class="mg-ic">' + esc((byId[o.game] || {}).icon || "🎮") + '</span><div><b>' + esc(o.title || (byId[o.game] || {}).name || "Register") + '</b><small>' + (n > 1 ? W.player + " " + (i + 1) + " " + W.of + " " + n : W.reg) + '</small></div></div>' +
          (o.intro ? '<p class="mg-mut">' + esc(o.intro) + "</p>" : "") +
          '<label>' + (o.parent ? W.parentName : o.kids ? W.childName : W.name) + '<input name="nm" autocomplete="off" maxlength="60"></label>' +
          '<label>' + (o.kids || o.parent ? W.parentMob : W.mob) + '<input name="ph" type="tel" inputmode="numeric" maxlength="14" placeholder="' + W.ph10 + '" autocomplete="off"></label>' +
          (o.email ? '<label>' + (o.kids ? W.parentMail : W.mail) + '<input name="em" type="email" autocomplete="off"></label>' : "") +
          (o.age ? '<label>' + W.age + '<input name="ag" inputmode="numeric" maxlength="3"></label>' : "") +
          '<label class="mg-ck"><input name="ck" type="checkbox"><span>' + (o.kids || o.parent ? W.agreeP : W.agree) + "</span></label>" +
          '<p class="mg-err" aria-live="polite">' + esc(err || "") + '</p><div class="mg-row"><button class="mg-btn" type="submit">' + (i + 1 < n ? W.next : W.start) + '</button>' +
          (o.cancel !== false ? '<button class="mg-btn alt" type="button" data-x>' + W.back + '</button>' : "") + "</div>" +
          '<p class="mg-mut mg-s">' + (o.onePlayNote === false ? "" : W.once) + '<a href="' + base() + 'privacy.html" target="_blank" rel="noopener">' + W.privacy + '</a></p></form>';
        var f = ov.querySelector("form"); f.nm.focus();
        var x = ov.querySelector("[data-x]"); if (x) x.onclick = function () { ov.remove(); reject(new Error("cancelled")); };
        f.onsubmit = function (e) {
          e.preventDefault(); var er = f.querySelector(".mg-err");
          var p = { name: f.nm.value.trim(), mobile: cleanMobile(f.ph.value), email: f.em ? f.em.value.trim() : "", age: f.ag ? parseInt(f.ag.value, 10) : 0, mode: o.kids || o.parent ? "kids" : "" };
          if (p.name.length < 2) return er.textContent = W.eName;
          if (!MOB.test(p.mobile)) return er.textContent = W.eMob;
          if (f.em && !MAIL.test(p.email)) return er.textContent = W.eMail;
          if (f.ag && !(p.age >= 4 && p.age <= 110)) return er.textContent = W.eAge;
          if (!f.ck.checked) return er.textContent = W.eTick;
          if (out.some(function (q) { return q.mobile === p.mobile; })) return er.textContent = W.eSame;
          var b = f.querySelector("[type=submit]"); b.disabled = true; b.textContent = W.saving;
          register(o.game, p).then(function (r) {
            if (r.dup) { step(W.eDup); return; }
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
  var SINGLE = window.MG_SINGLE || ss("mg_single") || "";

  /* The copy built into an app runs from file:// (Windows, Mac) or https://localhost (Android, iPhone) */
  function bundled() { return location.protocol === "file:" || location.hostname === "localhost" || location.protocol === "capacitor:"; }
  function goLive() {
    if (!bundled() || !inApp() || navigator.onLine === false || /[?&]offline=1/.test(location.search)) return;
    var de = document.documentElement, shown = false;
    function show() { if (!shown) { shown = true; de.style.visibility = ""; } }
    de.style.visibility = "hidden"; setTimeout(show, 4500);
    var m = /((?:games\/)?[a-z-]+\.html)$/.exec(location.pathname), page = m ? m[1] : "index.html";
    if (SINGLE && page === "index.html") page = "games/" + SINGLE + ".html";
    fetch(LIVE + "/sw.js?ping=" + Date.now(), { mode: "no-cors", cache: "no-store", signal: timeout(4000) })
      .then(function () { return flush().catch(function () {}); })
      .then(function () { location.replace(LIVE + "/" + page + "?app=1" + (SINGLE ? "&single=" + SINGLE : "") + location.hash); })
      .catch(show);
  }
  goLive();
  /* On the website (and in apps showing it), keep a copy for offline play */
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol) && !bundled())
    addEventListener("load", function () { navigator.serviceWorker.register(base() + "sw.js").catch(function () {}); });
  function base() { return /\/games\/[^/]*$/.test(location.pathname) ? "../" : ""; }
  function topbar(title) {
    if (!document.body) { document.addEventListener("DOMContentLoaded", function () { topbar(title); }); return; }
    var b = document.createElement("div"); b.className = "mg-top";
    b.innerHTML = (SINGLE ? '<img src="../icons/icon-192.png" alt="Mcube Academy">' : '<a class="mg-back" href="../index.html" aria-label="All games">‹ <span>All games</span></a>') +
      '<b>' + esc(title) + '</b>' + (SINGLE ? '<a class="mg-back" href="../privacy.html">Privacy</a>' : '<img src="../icons/icon-192.png" alt="Mcube Academy">');
    var lk = document.createElement("button"); lk.type = "button"; lk.className = "mg-lock"; lk.innerHTML = "🔒 <span>Lock</span>";
    lk.title = "Lock: full screen game"; lk.onclick = lock;
    b.insertBefore(lk, b.lastChild);
    document.body.insertBefore(b, document.body.firstChild);
    if (SINGLE) loadSettings().then(function (s) {
      if (isOn(s, SINGLE)) return;
      var ov = document.createElement("div"); ov.className = "mg-ov";
      ov.innerHTML = '<div class="mg-card"><div class="mg-reg-h"><span class="mg-ic">⏸️</span><div><b>' + esc((byId[SINGLE] || {}).name || "This game") + '</b><small>Paused for now</small></div></div><p class="mg-mut">Mcube Academy has paused this game. Please check again later.</p></div>';
      document.body.appendChild(ov);
    });
  }

  /* ---------- Lock: the game fills the whole screen; Unlock goes back to the normal screen ---------- */
  var locked = false, unl = null;
  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement; }
  function lock() {
    if (locked) return; locked = true;
    document.documentElement.classList.add("mg-locked");
    if (!unl) {
      unl = document.createElement("button"); unl.type = "button"; unl.className = "mg-unlock"; unl.innerHTML = "🔓 <span>Unlock</span>";
      unl.title = "Unlock: back to the normal screen (drag to move)"; unl.setAttribute("aria-label", "Unlock");
      /* small and movable, so it never hides part of the game: drag it anywhere, tap it to unlock */
      var sx = 0, sy = 0, ox = 0, oy = 0, moved = false, down = false;
      unl.addEventListener("pointerdown", function (e) { down = true; moved = false; sx = e.clientX; sy = e.clientY; var r = unl.getBoundingClientRect(); ox = r.left; oy = r.top; try { unl.setPointerCapture(e.pointerId); } catch (x) {} });
      unl.addEventListener("pointermove", function (e) { if (!down) return; var dx = e.clientX - sx, dy = e.clientY - sy; if (!moved && Math.abs(dx) + Math.abs(dy) < 6) return; moved = true;
        unl.style.left = Math.max(4, Math.min(innerWidth - unl.offsetWidth - 4, ox + dx)) + "px"; unl.style.top = Math.max(4, Math.min(innerHeight - unl.offsetHeight - 4, oy + dy)) + "px"; unl.style.bottom = "auto"; });
      unl.addEventListener("pointerup", function () { down = false; });
      unl.onclick = function () { if (!moved) unlock(); moved = false; };
      document.body.appendChild(unl);
    }
    var d = document.documentElement, r = d.requestFullscreen || d.webkitRequestFullscreen;
    if (r) { try { var pr = r.call(d, { navigationUI: "hide" }); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {} }
    /* the phone's Back button does not leave the game while it is locked */
    try { history.pushState({ mgLock: 1 }, ""); } catch (e) {}
    window.scrollTo(0, 0);
  }
  function unlock() {
    if (!locked) return; locked = false;
    document.documentElement.classList.remove("mg-locked");
    if (fsEl()) { var x = document.exitFullscreen || document.webkitExitFullscreen; try { var pr = x.call(document); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {} }
    try { if (history.state && history.state.mgLock) history.back(); } catch (e) {}
  }
  function fsChange() { if (locked && !fsEl() && document.documentElement.dataset.mgFs === "1") unlock(); document.documentElement.dataset.mgFs = fsEl() ? "1" : ""; }
  document.addEventListener("fullscreenchange", fsChange); document.addEventListener("webkitfullscreenchange", fsChange);
  window.addEventListener("popstate", function () { if (locked) { try { history.pushState({ mgLock: 1 }, ""); } catch (e) {} } });

  /* ---------- CAGR: the steady yearly return that turns the money put in into the final value ----------
     flows: [[years from start, amount]] (money in > 0, money taken out < 0); T: years in total; fv: final value.
     With one payment it is the usual CAGR; with several (SIP, top-ups) it is the same as XIRR. Returns % a year. */
  function cagr(flows, T, fv) {
    if (!(T > 0) || !flows.length) return 0;
    var f = function (R) { return flows.reduce(function (s, x) { return s + x[1] * Math.pow(1 + R, T - x[0]); }, 0); };
    var lo = -0.9999, hi = 1;
    while (f(hi) < fv && hi < 1e6) hi *= 2;
    for (var i = 0; i < 200; i++) { var m = (lo + hi) / 2; if (f(m) > fv) hi = m; else lo = m; }
    return (lo + hi) / 2 * 100;
  }
  function pct(v) { return !isFinite(v) ? "–" : Math.abs(v) >= 1000 ? (v > 0 ? "> +999%" : "< −999%") : (v >= 0 ? "+" : "") + v.toFixed(1) + "%"; }

  window.MG = { FB: FB, cagr: cagr, pct: pct, GAMES: GAMES, game: function (id) { return byId[id]; }, esc: esc, device: device, inApp: inApp,
    LIVE: LIVE, settings: loadSettings, cachedSettings: cachedSettings, isOn: isOn, onePlay: onePlay,
    lock: lock, unlock: unlock, register: register, check: check, finish: finish, flush: flush, registerForm: registerForm, topbar: topbar, cleanMobile: cleanMobile, playedHere: playedHere };
})();
