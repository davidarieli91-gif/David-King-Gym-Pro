(function () {
  var STR = {
    en: { btn: "📊 Report", title: "Progress Report", workouts: "Workouts", volume: "Total volume", avg: "Avg duration", streak: "Current streak", days: "d", top: "Top exercises", last30: "Last 30 days", prev30: "Previous 30 days", share: "Share via WhatsApp", noData: "No workouts yet for this client." },
    ru: { btn: "📊 Отчёт", title: "Отчёт прогресса", workouts: "Тренировок", volume: "Общий объём", avg: "Средняя длительность", streak: "Текущая серия", days: "дн", top: "Топ упражнений", last30: "Последние 30 дней", prev30: "Предыдущие 30 дней", share: "В WhatsApp", noData: "У клиента пока нет тренировок." },
    he: { btn: "📊 דוח", title: "דוח התקדמות", workouts: "אימונים", volume: "נפח כולל", avg: "משך ממוצע", streak: "רצף נוכחי", days: "ימים", top: "תרגילים מובילים", last30: "30 יום אחרונים", prev30: "30 יום קודמים", share: "וואטסאפ", noData: "אין עדיין אימונים ללקוח זה." }
  };
  function lang() { try { return currentLang(); } catch (e) { return "en"; } }
  function S() { return STR[lang()] || STR.en; }

  function injectButton() {
    try {
      if (document.getElementById("p54-btn")) return;
      var btns = document.querySelectorAll("button");
      var anchor = null;
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].textContent || "").replace(/\s+/g, " ").trim();
        if (t === "История" || t === "History" || t === "היסטוריה") { anchor = btns[i]; break; }
      }
      if (!anchor || !anchor.parentNode) return;
      var b = document.createElement("button");
      b.id = "p54-btn";
      b.className = anchor.className;
      b.textContent = S().btn;
      b.addEventListener("click", openReport);
      anchor.parentNode.insertBefore(b, anchor.nextSibling);
    } catch (e) {}
  }

  function dayStamp(d) { return Math.floor(d / 86400000); }
  function computeStreak(hist) {
    var days = {};
    hist.forEach(function (h) { days[dayStamp(h.date)] = true; });
    var t = dayStamp(Date.now());
    if (!days[t]) t -= 1;
    var s = 0;
    while (days[t]) { s++; t--; }
    return s;
  }

  function openReport() {
    var cid = null;
    try { cid = screens.profile.clientId; } catch (e) {}
    if (!cid) { try { toast("Select a client first", "warning"); } catch (e) {} return; }
    db.find("workout_history", "by_clientId", cid).then(function (hist) {
      renderReport(hist || []);
    }).catch(function () { renderReport([]); });
  }

  function stat(label, value) {
    return "<div style='flex:1;min-width:45%;padding:10px 16px'><div style='color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.05em'>" + label + "</div><div style='font-size:20px;font-weight:800;color:var(--text)'>" + value + "</div></div>";
  }

  function renderReport(hist) {
    var s = S();
    var now = Date.now();
    var last30 = 0, prev30 = 0, totalVol = 0, totalDur = 0;
    var exCount = {}, exMax = {};
    hist.forEach(function (h) {
      totalVol += h.total_volume || 0;
      totalDur += h.duration || 0;
      var age = now - h.date;
      if (age <= 30 * 86400000) last30++;
      else if (age <= 60 * 86400000) prev30++;
      (h.exercises || []).forEach(function (ex) {
        var n = ex.name || "?";
        exCount[n] = (exCount[n] || 0) + 1;
        (ex.sets || []).forEach(function (st) {
          var w = parseFloat(st.weight);
          if (w > (exMax[n] || 0)) exMax[n] = w;
        });
      });
    });
    var top = Object.keys(exCount).sort(function (a, b) { return exCount[b] - exCount[a]; }).slice(0, 5);
    var html = "";
    if (!hist.length) {
      html = "<p style='padding:16px;color:var(--muted)'>" + s.noData + "</p>";
    } else {
      html += stat(s.workouts, hist.length);
      html += stat(s.volume, Math.round(totalVol).toLocaleString() + " " + s.kg);
      html += stat(s.avg, Math.round(totalDur / 60 / hist.length) + " " + s.min);
      html += stat(s.streak, computeStreak(hist) + " " + s.days);
      html += "<div style='width:100%;padding:0 16px 8px'><div style='color:var(--muted);font-size:12px'>" + s.last30 + ": <b style='color:var(--text)'>" + last30 + "</b> · " + s.prev30 + ": <b style='color:var(--text)'>" + prev30 + "</b></div></div>";
      if (top.length) {
        html += "<div style='width:100%;padding:0 16px 12px'><div style='color:var(--muted);font-size:12px;margin-bottom:6px'>" + s.top + "</div>";
        top.forEach(function (n) {
          html += "<div style='display:flex;justify-content:space-between;font-size:13px;padding:4px 0;border-bottom:1px solid var(--border)'><span>" + n + "</span><span style='color:var(--muted)'>" + exCount[n] + "x · max " + (exMax[n] || "-") + " " + s.kg + "</span></div>";
        });
        html += "</div>";
      }
    }
    showModal(html, hist);
  }

  var modalEl = null;
  function closeModal() { if (modalEl && modalEl.parentNode) modalEl.parentNode.removeChild(modalEl); modalEl = null; }

  function showModal(bodyHtml, hist) {
    closeModal();
    var s = S();
    modalEl = document.createElement("div");
    modalEl.style.cssText = "position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px";
    var panel = document.createElement("div");
    panel.style.cssText = "background:var(--surface);border:1px solid var(--border);border-radius:16px;max-width:560px;width:100%;max-height:85vh;overflow:auto;padding:16px";
    var head = document.createElement("div");
    head.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px";
    head.innerHTML = "<div style='font-weight:800;font-size:16px;color:var(--text)'>" + s.title + "</div>";
    var closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    closeBtn.style.cssText = "color:var(--muted);padding:6px 10px;border-radius:8px";
    closeBtn.addEventListener("click", closeModal);
    head.appendChild(closeBtn);
    panel.appendChild(head);
    var wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;flex-wrap:wrap";
    wrap.innerHTML = bodyHtml;
    panel.appendChild(wrap);
    var share = document.createElement("button");
    share.textContent = s.share;
    share.style.cssText = "width:100%;background:var(--success);color:#fff;font-weight:700;padding:10px;border-radius:12px;margin-top:8px";
    share.addEventListener("click", function () { shareReport(hist); });
    panel.appendChild(share);
    modalEl.appendChild(panel);
    modalEl.addEventListener("click", function (e) { if (e.target === modalEl) closeModal(); });
    document.body.appendChild(modalEl);
  }

  function shareReport(hist) {
    var s = S();
    var client = "";
    try { client = screens.profile._client ? (screens.profile._client.full_name || "") : ""; } catch (e) {}
    var vol = 0;
    hist.forEach(function (h) { vol += h.total_volume || 0; });
    var lines = ["🏋️ " + s.title + (client ? " — " + client : "")];
    lines.push(s.workouts + ": " + hist.length);
    lines.push(s.volume + ": " + Math.round(vol).toLocaleString() + " " + s.kg);
    lines.push(s.streak + ": " + computeStreak(hist) + " " + s.days);
    window.open("https://wa.me/?text=" + encodeURIComponent(lines.join("\n")), "_blank");
  }

  var pending = false;
  function schedule() { if (pending) return; pending = true; setTimeout(function () { pending = false; injectButton(); }, 80); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule); else schedule();
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
})();
