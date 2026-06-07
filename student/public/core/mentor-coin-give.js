// ===================================================
// MENTOR → TALABA COIN BERISH  (v3 — backend-aware)
// student-pages-video.js va coin-system.js yuklanganidan keyin ishlaydi
// ===================================================
(function () {
  "use strict";

  // ── Yordamchi funksiyalar ─────────────────────────────────────────────────
  function cs() {
    return window.coinShop;
  }

  var API_BASE =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? window.location.protocol +
        "//" +
        window.location.hostname +
        ":" +
        (window.location.port || 3000)
      : window.location.origin;

  var COIN_KEY = "edu_mentor_coins_v1";

  // Backend dan coins ma'lumotini yuklab localStorage ni yangilaydi
  function refreshCoinsFromBackend(cb) {
    // /api/kv dan o'qiymiz — shim ham shu yerga yozadi, bir xil manba
    fetch(API_BASE + "/api/kv")
      .then(function (r) {
        return r.json();
      })
      .then(function (d) {
        if (d && d.ok && d.data && d.data[COIN_KEY]) {
          try {
            var coins = JSON.parse(d.data[COIN_KEY]);
            if (typeof coins === "object" && Object.keys(coins).length) {
              // Storage.prototype bypass — shimni trigger qilmaymiz
              Storage.prototype.setItem.call(
                localStorage,
                COIN_KEY,
                d.data[COIN_KEY],
              );
            }
          } catch (e) {}
        }
        if (cb) cb();
      })
      .catch(function () {
        if (cb) cb();
      });
  }

  function toast(msg, color) {
    color = color || "#0d9488";
    var el = document.createElement("div");
    el.style.cssText =
      "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);" +
      "background:var(--bg,#1e293b);border:2px solid " +
      color +
      ";" +
      "padding:10px 22px;border-radius:24px;font-size:14px;font-weight:700;" +
      "z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,.25);white-space:nowrap;" +
      "color:" +
      color +
      ";pointer-events:none";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      el.style.opacity = "0";
      el.style.transition = "opacity .3s";
      setTimeout(function () {
        el.remove();
      }, 350);
    }, 2600);
  }

  // ── Coin berish (detail panel tugmasi bosilganda) ─────────────────────────
  window.csGiveCoinFromDetail = function (studentId, mentorName, groupId) {
    if (!cs()) {
      toast("⚠️ Coin tizimi yuklanmagan!", "#ef4444");
      return;
    }

    var inp = document.getElementById("detail-coin-inp-" + studentId);
    var amt = parseInt(inp ? inp.value : 0) || 0;

    if (amt <= 0) {
      toast("⚠️ Miqdor kiriting!", "#ef4444");
      if (inp) {
        inp.focus();
        inp.style.borderColor = "#ef4444";
        setTimeout(function () {
          inp.style.borderColor = "";
        }, 1500);
      }
      return;
    }

    var gid = groupId ? parseInt(groupId) : null;

    // DOIM backend dan yangi balansni olamiz (admin coin bergan bo'lishi mumkin)
    refreshCoinsFromBackend(function () {
      var mBal = gid
        ? cs().getMentorGroupBal(mentorName, gid)
        : cs().getMentorBal(mentorName);
      if (mBal <= 0) {
        toast("❌ Guruh balansida coin yo'q! Admin coin bermagan.", "#ef4444");
        var mBalEl = document.getElementById("detail-mentor-bal-" + studentId);
        if (mBalEl) mBalEl.textContent = "🪙 0";
        return;
      }
      _doGiveCoin(studentId, mentorName, gid, amt, mBal);
    });
  };

  // Asosiy coin berish logikasi
  function _doGiveCoin(studentId, mentorName, gid, amt, mBal) {
    var inp = document.getElementById("detail-coin-inp-" + studentId);

    if (amt > mBal) {
      toast("❌ Coin yetarli emas! Guruh balansi: 🪙" + mBal, "#ef4444");
      if (inp) {
        inp.style.borderColor = "#ef4444";
        setTimeout(function () {
          inp.style.borderColor = "";
        }, 1500);
      }
      return;
    }

    var stuBal = cs().getStudentBal(studentId);

    // Balanslarga yoz
    if (gid) {
      cs().setMentorGroupBal(mentorName, gid, mBal - amt);
    } else {
      cs().setMentorBal(mentorName, mBal - amt);
    }
    cs().setStudentBal(studentId, stuBal + amt);

    // Input tozala
    if (inp) inp.value = "";

    // UI yangilash
    var newSBal = cs().getStudentBal(studentId);
    var newMBal = gid
      ? cs().getMentorGroupBal(mentorName, gid)
      : cs().getMentorBal(mentorName);

    var sBalEl = document.getElementById("detail-stu-bal-" + studentId);
    if (sBalEl) sBalEl.textContent = "🪙 " + newSBal;

    var mBalEl = document.getElementById("detail-mentor-bal-" + studentId);
    if (mBalEl) mBalEl.textContent = "🪙 " + newMBal;

    // Input max ni yangilaymiz
    if (inp) inp.max = newMBal;

    // Davomat jadvalidagi balanslarni ham yangilash
    var hdrBal = document.getElementById("att-mentor-bal-hdr");
    if (hdrBal) hdrBal.textContent = newMBal;

    document.querySelectorAll('[id^="sc-bal-mentor"]').forEach(function (el) {
      el.textContent = "Guruh: " + newMBal;
    });

    // Davomat jadvalidagi talaba balansini yangilash
    var sRowBal = document.getElementById("sc-bal-" + studentId);
    if (sRowBal) sRowBal.textContent = newSBal;

    var stu = ((window.D && window.D.students) || []).find(function (s) {
      return s.id === studentId;
    });
    var stuName = stu ? stu.name : "Talaba";

    toast(
      "✅ " + stuName + " ga 🪙" + amt + " berildi! Qoldi: 🪙" + newMBal,
      "#0d9488",
    );

    if (window.updateMentorCoinTopbar) window.updateMentorCoinTopbar();
  }

  // ── showMentorStudentDetail ni override qilib coin UI qo'shamiz ───────────
  var _origShowDetail = window.showMentorStudentDetail;

  window.showMentorStudentDetail = function (studentId) {
    if (typeof _origShowDetail === "function") {
      _origShowDetail(studentId);
    }
    // Coin UI injekt: avval localStorage bilan tez ko'rsatamiz,
    // keyin backend dan refresh qilib balansni yangilaymiz
    setTimeout(function () {
      injectCoinUI(studentId);
    }, 50);
  };

  function injectCoinUI(studentId) {
    var detailBody = document.getElementById("detail-body");
    if (!detailBody) return;

    if (document.getElementById("mentor-coin-give-" + studentId)) return;

    var s =
      window.D &&
      window.D.students &&
      window.D.students.find(function (x) {
        return x.id === studentId;
      });
    if (!s) return;

    var cu =
      typeof getCurrentUser === "function"
        ? getCurrentUser()
        : window.getCurrentUser
          ? window.getCurrentUser()
          : {};
    var mentorName = cu.mentorName || cu.name || "";
    if (!mentorName || cu.role === "Super Admin" || cu.role === "Talaba")
      return;

    var grp =
      window.D &&
      window.D.groups &&
      window.D.groups.find(function (g) {
        return g.id === s.groupId;
      });
    var gid = s.groupId || (grp ? grp.id : null);

    // Avval localStorage dan o'qiymiz (tez)
    var mBal = cs()
      ? gid
        ? cs().getMentorGroupBal(mentorName, gid)
        : cs().getMentorBal(mentorName)
      : 0;
    var stuBal = cs() ? cs().getStudentBal(studentId) : 0;

    var coinBox = document.createElement("div");
    coinBox.id = "mentor-coin-give-" + studentId;
    coinBox.style.cssText =
      "background:linear-gradient(135deg,rgba(245,158,11,0.1),rgba(217,119,6,0.06));" +
      "border:1.5px solid rgba(245,158,11,0.35);border-radius:12px;padding:14px 16px;margin-bottom:14px;";

    function buildHTML(mB, sB) {
      var mEscName = mentorName.replace(/'/g, "\\'");
      return (
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
        '<div style="font-size:12px;font-weight:800;color:#d97706">🪙 Coin berish</div>' +
        '<button id="detail-coin-refresh-' +
        studentId +
        '" onclick="event.stopPropagation();_mcgRefresh(' +
        studentId +
        ",'" +
        mEscName +
        "'," +
        gid +
        ')" ' +
        'style="font-size:11px;padding:3px 10px;border-radius:8px;border:1px solid rgba(245,158,11,0.4);background:transparent;color:#d97706;cursor:pointer;font-weight:700" title="Balansni yangilash">🔄</button>' +
        "</div>" +
        '<div style="display:flex;justify-content:space-between;margin-bottom:10px;gap:8px">' +
        '<div style="font-size:12px;color:var(--text2,#94a3b8)">👤 Talaba balansi:<br>' +
        '<b id="detail-stu-bal-' +
        studentId +
        '" style="color:#d97706;font-size:14px">🪙 ' +
        sB +
        "</b></div>" +
        '<div style="font-size:12px;color:var(--text2,#94a3b8)">📚 Guruh balansi:<br>' +
        '<b id="detail-mentor-bal-' +
        studentId +
        '" style="color:#059669;font-size:14px">🪙 ' +
        mB +
        "</b></div>" +
        "</div>" +
        '<div style="display:flex;gap:8px;align-items:center">' +
        '<div style="position:relative;flex:1">' +
        '<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:14px;pointer-events:none">🪙</span>' +
        '<input id="detail-coin-inp-' +
        studentId +
        '" type="number" min="1" max="' +
        mB +
        '" placeholder="Miqdor"' +
        ' onclick="event.stopPropagation()"' +
        ' style="width:100%;padding:9px 10px 9px 32px;border:1.5px solid rgba(245,158,11,0.4);border-radius:9px;' +
        "font-size:15px;font-weight:700;background:var(--bg,#0f172a);color:var(--text,#f1f5f9);" +
        'outline:none;box-sizing:border-box">' +
        "</div>" +
        '<button onclick="event.stopPropagation();csGiveCoinFromDetail(' +
        studentId +
        ",'" +
        mEscName +
        "'," +
        gid +
        ')"' +
        ' style="padding:9px 18px;border-radius:9px;border:none;background:linear-gradient(135deg,#f59e0b,#d97706);' +
        'color:#fff;font-size:13px;font-weight:800;cursor:pointer;box-shadow:0 2px 8px rgba(245,158,11,0.3);white-space:nowrap;flex-shrink:0">' +
        "✓ Ber</button>" +
        "</div>"
      );
    }

    coinBox.innerHTML = buildHTML(mBal, stuBal);

    var actionDiv = detailBody.querySelector(
      '[style*="display:flex;gap:8px;flex-wrap:wrap"]',
    );
    if (actionDiv) {
      detailBody.insertBefore(coinBox, actionDiv);
    } else {
      detailBody.appendChild(coinBox);
    }

    // Agar localStorage da balans 0 bo'lsa — backend dan avtomatik refresh
    if (mBal <= 0) {
      refreshCoinsFromBackend(function () {
        var freshMBal = cs()
          ? gid
            ? cs().getMentorGroupBal(mentorName, gid)
            : cs().getMentorBal(mentorName)
          : 0;
        var freshSBal = cs() ? cs().getStudentBal(studentId) : 0;
        var mBalEl = document.getElementById("detail-mentor-bal-" + studentId);
        if (mBalEl) mBalEl.textContent = "🪙 " + freshMBal;
        var sBalEl = document.getElementById("detail-stu-bal-" + studentId);
        if (sBalEl) sBalEl.textContent = "🪙 " + freshSBal;
        var inpEl = document.getElementById("detail-coin-inp-" + studentId);
        if (inpEl) inpEl.max = freshMBal;
      });
    }
  }

  // 🔄 Refresh tugmasi bosilganda
  window._mcgRefresh = function (studentId, mentorName, groupId) {
    var gid = groupId ? parseInt(groupId) : null;
    var btn = document.getElementById("detail-coin-refresh-" + studentId);
    if (btn) {
      btn.textContent = "⏳";
      btn.disabled = true;
    }
    refreshCoinsFromBackend(function () {
      var freshMBal = cs()
        ? gid
          ? cs().getMentorGroupBal(mentorName, gid)
          : cs().getMentorBal(mentorName)
        : 0;
      var freshSBal = cs() ? cs().getStudentBal(studentId) : 0;
      var mBalEl = document.getElementById("detail-mentor-bal-" + studentId);
      if (mBalEl) mBalEl.textContent = "🪙 " + freshMBal;
      var sBalEl = document.getElementById("detail-stu-bal-" + studentId);
      if (sBalEl) sBalEl.textContent = "🪙 " + freshSBal;
      var inpEl = document.getElementById("detail-coin-inp-" + studentId);
      if (inpEl) inpEl.max = freshMBal;
      if (btn) {
        btn.textContent = "🔄";
        btn.disabled = false;
      }
      toast("✅ Balans yangilandi: 🪙" + freshMBal, "#0d9488");
    });
  };

  console.log("[MentorCoinGive] ✅ v3 Yuklandi");
})();
