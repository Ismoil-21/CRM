// ===================== GRADING SYSTEM =====================
let _gradesGroupId = null;
let _gradesEditCritId = null;

function renderGradesPanel() {
  const wrap = document.getElementById("grades-wrap");
  if (!wrap) return;
  const isMentor = isMentorRole();
  const cu = getCurrentUser();
  let accessGroups = D.groups;
  if (isMentor) {
    const mName = cu.mentorName || cu.name;
    accessGroups = D.groups.filter((g) => g.mentor === mName);
  }
  if (!accessGroups.length) {
    wrap.innerHTML = `<div class="empty"><div class="empty-ic">🏅</div><div class="empty-txt">Guruh topilmadi</div></div>`;
    return;
  }
  const selGroupId = _gradesGroupId || accessGroups[0].id;
  const groupOptHtml = accessGroups
    .map(
      (g) =>
        `<option value="${g.id}" ${g.id === selGroupId ? "selected" : ""}>${g.name} — ${g.course}</option>`,
    )
    .join("");
  const selGroup = D.groups.find((x) => x.id === selGroupId);
  if (selGroup) _gradesGroupId = selGroup.id;
  const criteriaArr =
    (D.gradingCriteria && D.gradingCriteria[selGroupId]) || [];
  const students = D.students.filter(
    (s) => s.groupId === selGroupId && s.status !== "Arxiv",
  );

  // Criteria table
  let critHtml = "";
  if (criteriaArr.length) {
    critHtml = `<div class="grade-crit-list">${criteriaArr
      .map((c) => {
        const warnColor =
          c.weight > 100 ? "var(--orange-text)" : "var(--teal-text)";
        return `<div class="grade-crit-item">
        <div class="grade-crit-name">${c.name}</div>
        <div class="grade-crit-meta">Max: <b>${c.maxScore}</b> ball &nbsp;·&nbsp; Og\'irlik: <b style="color:${warnColor}">${c.weight}%</b></div>
        <div class="grade-crit-actions">
          <button class="btn btn-sm" onclick="openEditCriteria(${selGroupId},'${c.id}')">✏️</button>
          <button class="btn btn-sm btn-del-outline" onclick="deleteCriteria(${selGroupId},'${c.id}')">🗑</button>
        </div>
      </div>`;
      })
      .join("")}</div>`;
    const totalWeight = criteriaArr.reduce((s, c) => s + c.weight, 0);
    const weightStatus =
      totalWeight === 100
        ? `<span style="color:var(--teal-text);font-weight:700">✅ Jami: ${totalWeight}%</span>`
        : `<span style="color:var(--orange-text);font-weight:700">⚠️ ${L === "ru" ? "Итого" : L === "en" ? "Total" : "Jami"}: ${totalWeight}% ${L === "ru" ? "(должно быть 100%)" : L === "en" ? "(must be 100%)" : "(100% bo'lishi kerak)"}</span>`;
    critHtml =
      `<div class="grade-weight-status">${weightStatus}</div>` + critHtml;
  } else {
    critHtml = `<div style="color:var(--text3);font-size:13px;padding:12px 0">${L === "ru" ? "Критерии не добавлены" : L === "en" ? "No criteria added yet" : "Hali mezon qo'shilmagan"}</div>`;
  }

  // Add criteria form
  const editC = _gradesEditCritId
    ? criteriaArr.find((x) => x.id === _gradesEditCritId)
    : null;
  const critFormHtml = `<div class="grade-add-crit-form">
    <div class="form-row">
      <div class="fg"><label>${L === "ru" ? "Mezon nomi" : L === "en" ? "Criterion" : "Mezon nomi"}</label><input id="gc-name" value="${editC ? editC.name : ""}" placeholder="Uy vazifasi / Imtihon / Faollik..."></div>
      <div class="fg"><label>${L === "ru" ? "Макс балл" : L === "en" ? "Max score" : "Max ball"}</label><input type="number" id="gc-max" value="${editC ? editC.maxScore : 100}" min="1" max="1000" style="width:90px"></div>
      <div class="fg"><label>${L === "ru" ? "Вес (%)" : L === "en" ? "Weight (%)" : "Og'irlik (%)"}</label><input type="number" id="gc-weight" value="${editC ? editC.weight : 30}" min="1" max="100" style="width:90px"></div>
    </div>
    <button class="btn btn-primary btn-sm" onclick="saveCriteria(${selGroupId})">${editC ? (L === "ru" ? "✅ Обновить" : L === "en" ? "✅ Update" : "✅ Yangilash") : L === "ru" ? "➕ Добавить критерий" : L === "en" ? "➕ Add Criterion" : "➕ Mezon qo'shish"}</button>
    ${editC ? `<button class="btn btn-sm" onclick="_gradesEditCritId=null;renderGradesPanel()" style="margin-left:8px">${L === "ru" ? "Отмена" : L === "en" ? "Cancel" : "Bekor"}</button>` : ""}
  </div>`;

  // Student grades table
  let gradeTableHtml = "";
  if (criteriaArr.length && students.length) {
    const headerCols = criteriaArr
      .map(
        (c) =>
          `<th style="white-space:nowrap;font-size:12px;padding:8px 12px;background:var(--bg3);color:var(--text2);font-weight:700">${c.name}<br><span style="font-size:10px;font-weight:500;color:var(--text3)">max ${c.maxScore}</span></th>`,
      )
      .join("");
    const gradeRows = students
      .map((s, i) => {
        const sg = (D.grades[selGroupId] && D.grades[selGroupId][s.id]) || {};
        const cellsHtml = criteriaArr
          .map((c) => {
            const val = sg[c.id] !== undefined ? sg[c.id] : "";
            return `<td style="padding:4px 6px;text-align:center"><input type="number" class="grade-input" value="${val}" min="0" max="${c.maxScore}" placeholder="—" onchange="saveStudentGrade(${selGroupId},${s.id},'${c.id}',this.value,${c.maxScore})" style="width:60px;text-align:center;padding:5px;border:1px solid var(--border2);border-radius:6px;background:var(--bg2);color:var(--text);font-size:13px;font-weight:600"></td>`;
          })
          .join("");
        const totalData = calcStudentWeightedScore(s.id, selGroupId);
        const scoreColor =
          totalData.score >= 85
            ? "var(--teal-text)"
            : totalData.score >= 70
              ? "var(--accent-text)"
              : totalData.score >= 55
                ? "var(--amber-text)"
                : "var(--orange-text)";
        const letter = getGradeLetter(totalData.score);
        return `<tr style="border-bottom:1px solid var(--border)" data-grade-student="${s.id}">
        <td style="padding:8px 12px;font-weight:600;font-size:13px;white-space:nowrap">
          <div style="display:flex;align-items:center;gap:8px">
            <div class="av ${AV_CLS[i % 5]}" style="width:28px;height:28px;font-size:10px;flex-shrink:0">${ini(s.name)}</div>
            <div>
              <div style="font-size:12px;color:var(--text)">${s.firstName || s.name.split(" ")[0]} <b>${s.lastName || s.name.split(" ").slice(1).join(" ")}</b></div>
              <div style="font-size:10px;color:var(--text3)">${groupLabel(s.groupId)}</div>
            </div>
          </div>
        </td>
        ${cellsHtml}
        <td style="padding:8px 12px;text-align:center;font-weight:800;font-size:15px" class="grade-total-score" style="color:${scoreColor}">${totalData.filled ? totalData.score + "%" : "-"}</td>
        <td style="padding:8px 12px;text-align:center" class="grade-letter-cell"><span class="grade-letter-badge grade-${letter.toLowerCase()}">${letter}</span></td>
      </tr>`;
      })
      .join("");

    gradeTableHtml = `<div style="overflow-x:auto;margin-top:20px">
      <table style="width:100%;border-collapse:collapse;background:var(--bg2);border-radius:var(--r-lg);overflow:hidden;box-shadow:var(--shadow-sm)">
        <thead>
          <tr>
            <th style="padding:10px 12px;text-align:left;font-size:12px;background:var(--bg3);color:var(--text2);font-weight:700;border-bottom:2px solid var(--border2)">${L === "ru" ? "Студент" : L === "en" ? "Student" : "Talaba"}</th>
            ${headerCols}
            <th style="padding:10px 12px;font-size:12px;background:var(--bg3);color:var(--text2);font-weight:700;text-align:center;border-bottom:2px solid var(--border2)">Umumiy</th>
            <th style="padding:10px 12px;font-size:12px;background:var(--bg3);color:var(--text2);font-weight:700;text-align:center;border-bottom:2px solid var(--border2)">Baho</th>
          </tr>
        </thead>
        <tbody>${gradeRows}</tbody>
      </table>
    </div>`;
  } else if (!criteriaArr.length) {
    gradeTableHtml = "";
  } else {
    gradeTableHtml = `<div class="empty" style="margin-top:16px"><div class="empty-ic">🧑‍💻</div><div class="empty-txt">Bu guruhda talaba yo'q</div></div>`;
  }

  wrap.innerHTML = `
    <div class="grade-panel-wrap">
      <div class="grade-top-row">
        <div class="fg" style="flex:0 0 300px">
          <label style="font-size:12px;font-weight:700;color:var(--text2)">👥 Guruh tanlang</label>
          <select onchange="_gradesGroupId=parseInt(this.value);_gradesEditCritId=null;renderGradesPanel()" style="width:100%">${groupOptHtml}</select>
        </div>
        <div style="flex:1"></div>
        <button class="btn btn-sm" onclick="exportGrades(${selGroupId})" style="background:var(--teal-light);color:var(--teal-text);border-color:rgba(13,148,136,.3)">📥 CSV yuklash</button>
      </div>

      <div class="grade-section">
        <div class="grade-section-title">⚙️ Baholash mezonlari — ${selGroup ? selGroup.name : ""}</div>
        <div style="font-size:12px;color:var(--text3);margin-bottom:14px">Har bir guruh uchun alohida mezonlar belgilanadi. Og'irliklar yig'indisi 100% bo'lishi kerak.</div>
        ${critHtml}
        <div style="margin-top:16px;border-top:1px solid var(--border);padding-top:16px">
          <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:12px">${editC ? "✏️ Mezonni tahrirlash" : "➕ Yangi mezon qo'shish"}</div>
          ${critFormHtml}
        </div>
      </div>

      ${
        criteriaArr.length
          ? `<div class="grade-section">
        <div class="grade-section-title">📊 Talabalar baholari — ${selGroup ? selGroup.name : ""}</div>
        <div style="font-size:12px;color:var(--text3);margin-bottom:8px">Ball kiriting · Umumiy og'irlik bo'yicha hisoblash avtomatik</div>
        ${gradeTableHtml}
      </div>`
          : ""
      }
    </div>`;
}

function selectGradeGroup(groupId) {
  _gradesGroupId = groupId;
  _gradesEditCritId = null;
  renderGradesPanel();
}

function saveCriteria(groupId) {
  const name = (document.getElementById("gc-name").value || "").trim();
  const maxScore = parseInt(document.getElementById("gc-max").value) || 100;
  const weight = parseInt(document.getElementById("gc-weight").value) || 0;
  if (!name) {
    toast("⚠️ Mezon nomini kiriting!");
    return;
  }
  if (weight < 1 || weight > 100) {
    toast("⚠️ Og'irlik 1—100 orasida!");
    return;
  }
  if (!D.gradingCriteria[groupId]) D.gradingCriteria[groupId] = [];
  if (_gradesEditCritId) {
    const c = D.gradingCriteria[groupId].find(
      (x) => x.id === _gradesEditCritId,
    );
    if (c) {
      c.name = name;
      c.maxScore = maxScore;
      c.weight = weight;
    }
    _gradesEditCritId = null;
    toast("✅ Mezon yangilandi!");
  } else {
    const newId = "c_" + Date.now();
    D.gradingCriteria[groupId].push({ id: newId, name, maxScore, weight });
    toast("✅ Mezon qo'shildi!");
  }
  saveData();
  renderGradesPanel();
}

function openEditCriteria(groupId, critId) {
  _gradesEditCritId = critId;
  _gradesGroupId = groupId;
  renderGradesPanel();
  setTimeout(() => {
    const el = document.getElementById("gc-name");
    if (el) el.focus();
  }, 100);
}

function deleteCriteria(groupId, critId) {
  if (
    !confirm(
      "Bu mezon o'chirilsinmi? Unga tegishli barcha baholar ham o'chadi!",
    )
  )
    return;
  if (D.gradingCriteria[groupId]) {
    D.gradingCriteria[groupId] = D.gradingCriteria[groupId].filter(
      (x) => x.id !== critId,
    );
  }
  if (D.grades[groupId]) {
    Object.values(D.grades[groupId]).forEach((sg) => {
      delete sg[critId];
    });
  }
  saveData();
  toast("🗑 Mezon o'chirildi");
  renderGradesPanel();
}

function saveStudentGrade(groupId, studentId, criteriaId, val, maxScore) {
  const score = Math.min(maxScore, Math.max(0, parseFloat(val) || 0));
  if (!D.grades[groupId]) D.grades[groupId] = {};
  if (!D.grades[groupId][studentId]) D.grades[groupId][studentId] = {};
  if (val === "" || val === null || val === undefined) {
    delete D.grades[groupId][studentId][criteriaId];
  } else {
    D.grades[groupId][studentId][criteriaId] = score;
  }
  saveData();
  // Update this student's total score & letter badge inline (no full re-render)
  const total = calcStudentWeightedScore(studentId, groupId);
  const letter = getGradeLetter(total.score);
  const scoreColor =
    total.score >= 85
      ? "var(--teal-text)"
      : total.score >= 70
        ? "var(--accent-text)"
        : total.score >= 55
          ? "var(--amber-text)"
          : "var(--orange-text)";
  // Find all rows and update the matching student row
  document.querySelectorAll("[data-grade-student]").forEach((row) => {
    if (parseInt(row.dataset.gradeStudent) === studentId) {
      const scoreCell = row.querySelector(".grade-total-score");
      const letterCell = row.querySelector(".grade-letter-cell");
      if (scoreCell) {
        scoreCell.textContent = total.filled ? total.score + "%" : "-";
        scoreCell.style.color = scoreColor;
      }
      if (letterCell) {
        letterCell.innerHTML = `<span class="grade-letter-badge grade-${letter.toLowerCase()}">${letter}</span>`;
      }
    }
  });
}

function calcStudentWeightedScore(studentId, groupId) {
  const criteriaArr = (D.gradingCriteria && D.gradingCriteria[groupId]) || [];
  const maxScore = criteriaArr.reduce((s, c) => s + (c.maxScore || 0), 0);
  if (!criteriaArr.length)
    return { score: 0, maxScore: 0, letter: "—", filled: false };
  const sg = (D.grades[groupId] && D.grades[groupId][studentId]) || {};
  let totalWeight = 0,
    weightedSum = 0,
    hasAny = false;
  let rawScore = 0;
  criteriaArr.forEach((c) => {
    if (sg[c.id] !== undefined) {
      const pct = Math.min(100, (sg[c.id] / c.maxScore) * 100);
      weightedSum += pct * c.weight;
      totalWeight += c.weight;
      rawScore += sg[c.id];
      hasAny = true;
    }
  });
  if (!hasAny || totalWeight === 0)
    return { score: 0, maxScore, letter: "—", filled: false };
  const score = Math.round(weightedSum / totalWeight);
  return {
    score,
    maxScore,
    rawScore,
    letter: getGradeLetter(score),
    filled: true,
  };
}

function getGradeLetter(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 55) return "D";
  return "F";
}

function exportGrades(groupId) {
  const group = D.groups.find((x) => x.id === groupId);
  const criteriaArr = (D.gradingCriteria && D.gradingCriteria[groupId]) || [];
  const students = D.students.filter((s) => s.groupId === groupId);
  let csv =
    "Ism,Familiya,Telefon," +
    criteriaArr.map((c) => c.name).join(",") +
    ",Umumiy (%),Baho\n";
  students.forEach((s) => {
    const sg = (D.grades[groupId] && D.grades[groupId][s.id]) || {};
    const scores = criteriaArr
      .map((c) => (sg[c.id] !== undefined ? sg[c.id] : ""))
      .join(",");
    const total = calcStudentWeightedScore(s.id, groupId);
    csv += `${s.firstName || ""},${s.lastName || ""},${s.phone || ""},${scores},${total.filled ? total.score : ""},${total.filled ? getGradeLetter(total.score) : ""}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = (group ? group.name : "group") + "_baholar.csv";
  a.click();
  toast("📥 CSV yuklandi!");
}

// ===================== TEST SYSTEM =====================
let _testsPanelGroupFilter = null;
let _activeTestId = null;
let _testTimer = null;
let _testAnswers = {};
let _testTimeLeft = 0;
let _editTestId = null;
let _testQuestions = [];

function renderTestsPanel() {
  const wrap = document.getElementById("tests-wrap");
  if (!wrap) return;
  const L = LANG;
  const isMentor = isMentorRole();
  const cu = getCurrentUser();

  let accessGroups = D.groups;
  if (isMentor) {
    const mName = cu.mentorName || cu.name;
    accessGroups = D.groups.filter((g) => g.mentor === mName);
  }

  const gFilterVal = _testsPanelGroupFilter || "";
  const groupFilterOpts =
    `<option value="">Barcha guruhlar</option>` +
    accessGroups
      .map(
        (g) =>
          `<option value="${g.id}" ${gFilterVal == g.id ? "selected" : ""}>${g.name} — ${g.course}</option>`,
      )
      .join("");

  const visibleTests = D.tests.filter((t) => {
    if (gFilterVal && t.groupId && String(t.groupId) !== String(gFilterVal))
      return false;
    if (isMentor) {
      const mName = cu.mentorName || cu.name;
      const accessGroupIds = D.groups
        .filter((g) => g.mentor === mName)
        .map((g) => g.id);
      if (t.groupId && !accessGroupIds.includes(t.groupId)) return false;
    }
    return true;
  });

  const testsListHtml = visibleTests.length
    ? visibleTests
        .map((t) => {
          const grp = t.groupId
            ? D.groups.find((g) => g.id === t.groupId)
            : null;
          const qCount = (t.questions || []).length;
          const resultCount = D.testResults[t.id]
            ? Object.keys(D.testResults[t.id]).length
            : 0;
          return `<div class="test-card">
      <div class="test-card-top">
        <div>
          <div class="test-card-title">${t.title}</div>
          <div class="test-card-meta">
            <span class="badge b-blue">👥 ${grp ? grp.name : L === "ru" ? "Все группы" : L === "en" ? "All groups" : "Barcha guruhlar"}</span>
            <span class="badge b-purple">❓ ${qCount} ${L === "ru" ? "вопросов" : L === "en" ? "questions" : "ta savol"}</span>
            <span class="badge b-amber">⏱ ${t.timeLimit || 30} daqiqa</span>
            <span class="badge b-teal">📊 ${resultCount} ${L === "ru" ? "результатов" : L === "en" ? "results" : "ta natija"}</span>
          </div>
        </div>
        <div class="test-card-actions">
          <button class="btn btn-sm" onclick="openTestResults(${t.id})">📊 Natijalar</button>
          <button class="btn btn-sm" onclick="openEditTest(${t.id})">✏️ Tahrirlash</button>
          <button class="btn btn-sm btn-del-outline" onclick="deleteTest(${t.id})">🗑</button>
        </div>
      </div>
    </div>`;
        })
        .join("")
    : `<div class="empty"><div class="empty-ic">📝</div><div class="empty-txt">${L === "ru" ? "Тестов ещё нет" : L === "en" ? "No tests yet" : "Hali test yo'q"}</div></div>`;

  wrap.innerHTML = `
    <div class="tests-panel-wrap">
      <div class="tests-top-bar">
        <select class="fsel" onchange="_testsPanelGroupFilter=this.value?parseInt(this.value)||this.value:null;renderTestsPanel()" style="min-width:220px">${groupFilterOpts}</select>
        <button class="btn btn-primary" onclick="openCreateTestModal()">${L === "ru" ? "➕ Создать тест" : L === "en" ? "➕ Create test" : L === "ru" ? "➕ Создать тест" : L === "en" ? "➕ Create test" : "➕ Yangi test yaratish"}</button>
      </div>
      <div class="tests-list">${testsListHtml}</div>
    </div>
    <div id="test-modal-overlay" class="overlay" onclick="if(event.target===this)closeTestModal()">
      <div class="modal" id="test-modal" style="max-width:700px;max-height:90vh;overflow-y:auto">
        <div class="modal-head"><div class="modal-title" id="test-modal-title">Yangi test</div><button class="modal-close" onclick="closeTestModal()">✕</button></div>
        <div class="modal-body" id="test-modal-body"></div>
        <div class="modal-foot"><button class="btn" onclick="closeTestModal()">${L === "ru" ? "Отмена" : L === "en" ? "Cancel" : "Bekor"}</button><button class="btn btn-primary" onclick="saveTest()">${L === "ru" ? "💾 Сохранить" : L === "en" ? "💾 Save" : "💾 Saqlash"}</button></div>
      </div>
    </div>
    <div id="test-results-overlay" class="overlay" onclick="if(event.target===this)closeTestResultsModal()">
      <div class="modal" style="max-width:700px;max-height:90vh;overflow-y:auto">
        <div class="modal-head"><div class="modal-title" id="test-results-title">Test natijalari</div><button class="modal-close" onclick="closeTestResultsModal()">✕</button></div>
        <div class="modal-body" id="test-results-body"></div>
        <div class="modal-foot"><button class="btn" onclick="closeTestResultsModal()">${L === "ru" ? "Закрыть" : L === "en" ? "Close" : "Yopish"}</button></div>
      </div>
    </div>`;
}

function filterTestsByGroup(groupId) {
  _testsPanelGroupFilter = groupId;
  renderTestsPanel();
}

function openCreateTestModal() {
  _editTestId = null;
  _testQuestions = [];
  renderTestFormModal({});
}

function openEditTest(id) {
  _editTestId = id;
  const t = D.tests.find((x) => x.id === id);
  if (!t) return;
  _testQuestions = JSON.parse(JSON.stringify(t.questions || []));
  renderTestFormModal(t);
}

function renderTestFormModal(t) {
  const isMentor = isMentorRole();
  const cu = getCurrentUser();
  let availableGroups = D.groups;
  if (isMentor) {
    const mName = cu.mentorName || cu.name;
    availableGroups = D.groups.filter((g) => g.mentor === mName);
  }
  const groupOpts =
    (!isMentor ? `<option value="">Barcha guruhlar</option>` : "") +
    availableGroups
      .map(
        (g) =>
          `<option value="${g.id}" ${t.groupId == g.id ? "selected" : ""}>${g.name} — ${g.course}</option>`,
      )
      .join("");
  const qHtml = _testQuestions
    .map((q, qi) => renderQuestionEdit(q, qi))
    .join("");
  document.getElementById("test-modal-title").textContent = _editTestId
    ? LANG === "ru"
      ? "✏️ Редактировать тест"
      : LANG === "en"
        ? "✏️ Edit test"
        : "✏️ Testni tahrirlash"
    : LANG === "ru"
      ? "➕ Создать тест"
      : LANG === "en"
        ? "➕ Create test"
        : "➕ Yangi test yaratish";
  document.getElementById("test-modal-body").innerHTML = `
    <div class="modal-section-label">📋 Test ma'lumoti</div>
    <div class="fg"><label>${L === "ru" ? "Название теста" : L === "en" ? "Test title" : "Test nomi"} <span class="req">*</span></label><input id="tf-title" value="${t.title || ""}" placeholder="JavaScript asoslari testi"></div>
    <div class="form-row">
      <div class="fg"><label>${L === "ru" ? "Группа" : L === "en" ? "Group" : "Guruh"}</label><select id="tf-group">${groupOpts}</select></div>
      <div class="fg"><label>${L === "ru" ? "⏱ Время (мин.)" : L === "en" ? "⏱ Time (min.)" : "⏱ Vaqt (daqiqa)"}</label><input type="number" id="tf-time" value="${t.timeLimit || 30}" min="5" max="180" style="width:100px"></div>
    </div>
    <div class="modal-section-label" style="margin-top:16px">❓ Savollar (${_testQuestions.length} ${L === "ru" ? "кол-во" : L === "en" ? "count" : "ta"})</div>
    <div id="test-questions-list">${qHtml}</div>
    <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-sm" onclick="addQuestion()" style="background:var(--teal-light);color:var(--teal-text);border-color:rgba(13,148,136,.3)">${L === "ru" ? "➕ Добавить вопрос" : L === "en" ? "➕ Add question" : "➕ Savol qo'shish"}</button>
      <button class="btn btn-sm" onclick="importTestFromFile()" style="background:var(--purple-light);color:var(--purple-text);border-color:rgba(124,58,237,.3)">${L === "ru" ? "📤 Загрузить из файла" : L === "en" ? "📤 Upload from file" : "📤 Fayldan yuklash"}</button>
      <input type="file" id="tf-file-input" accept=".json,.txt" style="display:none" onchange="handleTestFileImport(this)">
    </div>`;
  document.getElementById("test-modal-overlay").classList.add("open");
}

function renderQuestionEdit(q, qi) {
  const opts = ["A", "B", "C", "D"];
  const optsHtml = opts
    .map(
      (lbl, oi) => `
    <div class="q-option-row">
      <input type="radio" name="q${qi}_correct" value="${oi}" ${q.correct === oi ? "checked" : ""} onchange="_testQuestions[${qi}].correct=${oi}" id="qo_${qi}_${oi}">
      <label for="qo_${qi}_${oi}" style="font-weight:600;color:var(--text2);min-width:20px">${lbl})</label>
      <input class="q-opt-input" id="qopt_${qi}_${oi}" value="${(q.options && q.options[oi]) || ""}" placeholder="Variant ${lbl}..." oninput="_testQuestions[${qi}].options=_testQuestions[${qi}].options||['','','',''];_testQuestions[${qi}].options[${oi}]=this.value">
    </div>`,
    )
    .join("");
  return `<div class="question-edit-card" id="qcard_${qi}">
    <div class="qcard-header">
      <span class="qcard-num">❓ ${qi + 1}-savol</span>
      <button class="btn btn-sm btn-del-outline" style="padding:2px 8px;font-size:11px" onclick="removeQuestion(${qi})">✕</button>
    </div>
    <div class="fg" style="margin-bottom:10px">
      <input id="qtxt_${qi}" value="${q.text || ""}" placeholder="Savol matnini kiriting..." oninput="_testQuestions[${qi}].text=this.value" style="font-weight:600">
    </div>
    <div class="q-options">${optsHtml}</div>
  </div>`;
}

function addQuestion() {
  _testQuestions.push({
    id: "q_" + Date.now() + "_" + _testQuestions.length,
    text: "",
    options: ["", "", "", ""],
    correct: _testQuestions.length % 4,
  });
  document.getElementById("test-questions-list").innerHTML = _testQuestions
    .map((q, qi) => renderQuestionEdit(q, qi))
    .join("");
}

function removeQuestion(qi) {
  _testQuestions.splice(qi, 1);
  document.getElementById("test-questions-list").innerHTML = _testQuestions
    .map((q, i) => renderQuestionEdit(q, i))
    .join("");
}

function importTestFromFile() {
  document.getElementById("tf-file-input").click();
}

function handleTestFileImport(inp) {
  const file = inp.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.title) document.getElementById("tf-title").value = data.title;
      if (data.timeLimit)
        document.getElementById("tf-time").value = data.timeLimit;
      if (Array.isArray(data.questions)) {
        _testQuestions = data.questions.map((q, i) => ({
          id: q.id || "q_" + Date.now() + "_" + i,
          text: q.text || "",
          options: q.options || ["", "", "", ""],
          correct: typeof q.correct === "number" ? q.correct : 0,
        }));
        document.getElementById("test-questions-list").innerHTML =
          _testQuestions.map((q, qi) => renderQuestionEdit(q, qi)).join("");
        toast("✅ " + _testQuestions.length + " ta savol yuklandi!");
      }
    } catch (err) {
      toast("❌ Fayl formatida xato! JSON bo'lishi kerak.");
    }
  };
  reader.readAsText(file);
  inp.value = "";
}

function saveTest() {
  const title = (document.getElementById("tf-title").value || "").trim();
  if (!title) {
    toast("⚠️ Test nomini kiriting!");
    return;
  }
  if (!_testQuestions.length) {
    toast("⚠️ Kamida 1 ta savol qo'shing!");
    return;
  }
  const invalid = _testQuestions.find(
    (q) => !q.text.trim() || (q.options || []).some((o) => !o.trim()),
  );
  if (invalid) {
    toast("⚠️ Barcha savol va variantlarni to'ldiring!");
    return;
  }
  const groupIdVal = document.getElementById("tf-group").value;
  const groupId = groupIdVal ? parseInt(groupIdVal) : null;
  const cu = getCurrentUser();
  // Mentor faqat o'z guruhiga test qo'sha oladi
  if (isMentorRole() && groupId) {
    const mName = cu.mentorName || cu.name;
    const myGroup = D.groups.find(
      (g) => g.id === groupId && g.mentor === mName,
    );
    if (!myGroup) {
      toast("⚠️ Siz faqat o'z guruhingizga test qo'sha olasiz!");
      return;
    }
  }
  if (isMentorRole() && !groupId) {
    toast("⚠️ Guruhni tanlang!");
    return;
  }
  const timeLimit = parseInt(document.getElementById("tf-time").value) || 30;
  const testData = {
    title,
    groupId,
    timeLimit,
    questions: _testQuestions,
    createdBy: cu.name || cu.role,
    createdAt: todayStr(),
  };
  if (_editTestId) {
    Object.assign(
      D.tests.find((x) => x.id === _editTestId),
      testData,
    );
    toast("✅ Test yangilandi!");
  } else {
    testData.id = newId();
    D.tests.push(testData);
    toast("✅ Test yaratildi!");
  }
  saveData();
  const ncTests = document.getElementById("nc-tests");
  if (ncTests) ncTests.textContent = D.tests.length;
  closeTestModal();
  renderTestsPanel();
}

function deleteTest(id) {
  if (!confirm("Bu test o'chirilsinmi? Barcha natijalar ham o'chadi!")) return;
  D.tests = D.tests.filter((x) => x.id !== id);
  if (D.testResults[id]) delete D.testResults[id];
  saveData();
  const ncTests = document.getElementById("nc-tests");
  if (ncTests) ncTests.textContent = D.tests.length;
  toast("🗑 Test o'chirildi");
  renderTestsPanel();
}

function openTestResults(testId) {
  const t = D.tests.find((x) => x.id === testId);
  if (!t) return;
  const results = D.testResults[testId] || {};
  document.getElementById("test-results-title").textContent =
    "📊 " + t.title + " — Natijalar";
  const resultEntries = Object.entries(results)
    .map(([sid, r]) => {
      const s = D.students.find((x) => String(x.id) === String(sid));
      return { student: s, result: r };
    })
    .filter((x) => x.student)
    .sort((a, b) => b.result.score - a.result.score);

  if (!resultEntries.length) {
    document.getElementById("test-results-body").innerHTML =
      `<div class="empty"><div class="empty-ic">📊</div><div class="empty-txt">Hali hech kim test topshirmagan</div></div>`;
  } else {
    const rows = resultEntries
      .map((e, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";
        const sc = e.result.score;
        const clr =
          sc >= 85
            ? "var(--teal-text)"
            : sc >= 70
              ? "var(--accent-text)"
              : sc >= 55
                ? "var(--amber-text)"
                : "var(--orange-text)";
        const date = e.result.completedAt
          ? new Date(e.result.completedAt).toLocaleString("uz")
          : "—";
        return `<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:var(--r-md);background:var(--bg2);border:1px solid var(--border);margin-bottom:5px">
        <span style="font-size:16px;min-width:24px">${medal || ""}</span>
        <div style="flex:1"><div style="font-weight:700;font-size:13px">${e.student.firstName || ""} ${e.student.lastName || e.student.name}</div><div style="font-size:11px;color:var(--text3)">${date}</div></div>
        <span style="font-size:18px;font-weight:800;color:${clr}">${sc}%</span>
        <span class="grade-letter-badge grade-${getGradeLetter(sc).toLowerCase()}">${getGradeLetter(sc)}</span>
      </div>`;
      })
      .join("");
    const avg = Math.round(
      resultEntries.reduce((s, e) => s + e.result.score, 0) /
        resultEntries.length,
    );
    document.getElementById("test-results-body").innerHTML = `
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <div style="background:var(--teal-light);border-radius:var(--r-md);padding:10px 18px;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--teal-text)">${resultEntries.length}</div><div style="font-size:11px;color:var(--text3)">Topshirdi</div></div>
        <div style="background:var(--accent-light);border-radius:var(--r-md);padding:10px 18px;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--accent-text)">${avg}%</div><div style="font-size:11px;color:var(--text3)">O'rtacha</div></div>
        <div style="background:var(--purple-light);border-radius:var(--r-md);padding:10px 18px;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--purple-text)">${(t.questions || []).length}</div><div style="font-size:11px;color:var(--text3)">Savollar</div></div>
      </div>
      ${rows}`;
  }
  document.getElementById("test-results-overlay").classList.add("open");
}

function closeTestModal() {
  document.getElementById("test-modal-overlay").classList.remove("open");
  _editTestId = null;
  _testQuestions = [];
}
function closeTestResultsModal() {
  document.getElementById("test-results-overlay").classList.remove("open");
}

// ===================== STUDENT TEST TAKING =====================
function renderStudentTests(studentId, groupId) {
  if (!groupId) return "";
  const myTests = D.tests.filter((t) => !t.groupId || t.groupId === groupId);
  if (!myTests.length)
    return `<div style="color:var(--text3);font-size:13px;padding:16px 0">Hozircha test yo'q.</div>`;
  return myTests
    .map((t) => {
      const result = D.testResults[t.id] && D.testResults[t.id][studentId];
      const done = !!result;
      const scoreClr = done
        ? result.score >= 85
          ? "var(--teal-text)"
          : result.score >= 55
            ? "var(--amber-text)"
            : "var(--orange-text)"
        : "var(--text3)";
      return `<div class="student-test-card">
      <div style="flex:1">
        <div style="font-weight:700;font-size:14px;color:var(--text)">${t.title}</div>
        <div style="font-size:12px;color:var(--text3);margin-top:4px">❓ ${(t.questions || []).length} savol · ⏱ ${t.timeLimit || 30} daqiqa</div>
        ${done ? `<div style="font-size:12px;color:${scoreClr};font-weight:700;margin-top:6px">✅ Natija: ${result.score}% — ${getGradeLetter(result.score)}</div>` : ""}
      </div>
      <div>
        ${done ? `<span class="badge b-teal" style="font-size:12px">✅ Bajarildi</span>` : `<button class="btn btn-primary btn-sm" onclick="startStudentTest(${t.id},${studentId})">▶️ Boshlash</button>`}
      </div>
    </div>`;
    })
    .join("");
}

function renderStudentGrades(studentId, groupId) {
  if (!groupId) return "";
  const criteriaArr = (D.gradingCriteria && D.gradingCriteria[groupId]) || [];
  if (!criteriaArr.length)
    return `<div style="color:var(--text3);font-size:13px;padding:16px 0">Hozircha baholash mezonlari kiritilmagan.</div>`;
  const sg = (D.grades[groupId] && D.grades[groupId][studentId]) || {};
  const rows = criteriaArr
    .map((c) => {
      const score = sg[c.id];
      const pct =
        score !== undefined ? Math.round((score / c.maxScore) * 100) : null;
      const barClr =
        pct === null
          ? "var(--border2)"
          : pct >= 85
            ? "var(--teal)"
            : pct >= 70
              ? "var(--accent)"
              : pct >= 55
                ? "var(--amber)"
                : "var(--orange)";
      return `<div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-size:13px;font-weight:600;color:var(--text)">${c.name}</span>
        <span style="font-size:13px;font-weight:800;color:${barClr}">${score !== undefined ? score + "/" + c.maxScore : "—"}</span>
      </div>
      <div style="height:7px;background:var(--bg4);border-radius:10px;overflow:hidden">
        <div style="height:100%;width:${pct || 0}%;background:${barClr};border-radius:10px;transition:width .4s"></div>
      </div>
      <div style="font-size:11px;color:var(--text3);margin-top:3px">Og'irlik: ${c.weight}% · ${pct !== null ? pct + "%" : "Kiritilmagan"}</div>
    </div>`;
    })
    .join("");
  const total = calcStudentWeightedScore(studentId, groupId);
  const letter = total.filled ? getGradeLetter(total.score) : "—";
  const letterClr =
    total.score >= 85
      ? "var(--teal-text)"
      : total.score >= 70
        ? "var(--accent-text)"
        : total.score >= 55
          ? "var(--amber-text)"
          : "var(--orange-text)";
  return `<div>${rows}</div>
    ${
      total.filled
        ? `<div style="display:flex;align-items:center;gap:12px;background:var(--bg3);border-radius:var(--r-md);padding:12px 16px;margin-top:8px;border:1px solid var(--border2)">
      <div style="font-size:13px;color:var(--text2);font-weight:600">Yakuniy ball:</div>
      <div style="font-size:22px;font-weight:900;color:${letterClr}">${total.score}%</div>
      <span class="grade-letter-badge grade-${letter.toLowerCase()}" style="font-size:16px;padding:4px 14px">${letter}</span>
    </div>`
        : ""
    }`;
}

function startStudentTest(testId, studentId) {
  const t = D.tests.find((x) => x.id === testId);
  if (!t || !t.questions || !t.questions.length) {
    toast(
      LANG === "ru"
        ? "⚠️ В тесте нет вопросов!"
        : LANG === "en"
          ? "⚠️ No questions in test!"
          : "⚠️ Test savolsiz!",
    );
    return;
  }
  const existResult = D.testResults[testId] && D.testResults[testId][studentId];
  if (existResult) {
    toast(
      LANG === "ru"
        ? "Вы уже сдали этот тест!"
        : LANG === "en"
          ? "You have already taken this test!"
          : "Bu testni allaqachon topshirgansiz!",
    );
    return;
  }
  _activeTestId = testId;
  _testAnswers = {};
  _testTimeLeft = (t.timeLimit || 30) * 60;
  renderTestTakingUI(testId, studentId);
}

function renderTestTakingUI(testId, studentId) {
  const t = D.tests.find((x) => x.id === testId);
  if (!t) return;
  const wrap = document.getElementById("student-tests-wrap");
  if (!wrap) return;
  const optLabels = ["A", "B", "C", "D"];
  const qHtml = t.questions
    .map((q, qi) => {
      // Shuffle option indices so answers appear in random order each time
      const shuffledIdx = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      const optsHtml = shuffledIdx
        .map((origIdx, newPos) => {
          const opt = (q.options || [])[origIdx] || "";
          return `
      <label class="test-option-label" id="topt_${qi}_${origIdx}">
        <input type="radio" name="tq${qi}" value="${origIdx}" onchange="_testAnswers[${qi}]=${origIdx};highlightTestOption(${qi},${origIdx})">
        <span class="test-option-badge">${optLabels[origIdx]}</span>
        <span class="test-option-text">${opt}</span>
      </label>`;
        })
        .join("");
      return `<div class="test-q-card">
      <div class="test-q-num">${LANG === "ru" ? `Вопрос ${qi + 1}/${t.questions.length}` : LANG === "en" ? `Question ${qi + 1}/${t.questions.length}` : `Savol ${qi + 1}/${t.questions.length}`}</div>
      <div class="test-q-text">${q.text}</div>
      <div class="test-q-options">${optsHtml}</div>
    </div>`;
    })
    .join("");
  wrap.innerHTML = `
    <div class="test-taking-wrap">
      <div class="test-taking-header">
        <div>
          <div style="font-size:18px;font-weight:800;color:var(--text)">${t.title}</div>
          <div style="font-size:12px;color:var(--text3);margin-top:2px">${t.questions.length} ${LANG === "ru" ? "вопросов" : LANG === "en" ? "questions" : "savol"}</div>
        </div>
        <div class="test-timer" id="test-timer-display">⏱ --:--</div>
      </div>
      <div class="test-questions-scroll">${qHtml}</div>
      <div class="test-submit-bar">
        <span style="font-size:13px;color:var(--text3)" id="test-answered-count">${LANG === "ru" ? `0/${t.questions.length} ответов` : LANG === "en" ? `0/${t.questions.length} answered` : `0/${t.questions.length} javob berildi`}</span>
        <button class="btn btn-primary" onclick="submitStudentTest(${testId},${studentId})">${LANG === "ru" ? "✅ Завершить тест" : LANG === "en" ? "✅ Submit test" : "✅ Testni yakunlash"}</button>
      </div>
    </div>`;

  // Start timer
  if (_testTimer) clearInterval(_testTimer);
  _testTimer = setInterval(() => {
    _testTimeLeft--;
    const m = Math.floor(_testTimeLeft / 60),
      s = _testTimeLeft % 60;
    const disp = document.getElementById("test-timer-display");
    if (disp) {
      disp.textContent = `⏱ ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      if (_testTimeLeft <= 60) disp.style.color = "var(--orange-text)";
      if (_testTimeLeft <= 10) disp.style.background = "var(--orange-light)";
    }
    if (_testTimeLeft <= 0) {
      clearInterval(_testTimer);
      toast("⏰ Vaqt tugadi! Avtomatik topshirildi.");
      submitStudentTest(testId, studentId, true);
    }
  }, 1000);
}

function highlightTestOption(qi, oi) {
  // Update answered count
  const t = D.tests.find((x) => x.id === _activeTestId);
  if (!t) return;
  const cnt = document.getElementById("test-answered-count");
  if (cnt)
    cnt.textContent =
      Object.keys(_testAnswers).length +
      "/" +
      t.questions.length +
      " javob berildi";
  // Highlight selected
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById("topt_" + qi + "_" + i);
    if (el) el.classList.toggle("selected", i === oi);
  }
}

function submitStudentTest(testId, studentId, autoSubmit) {
  if (_testTimer) {
    clearInterval(_testTimer);
    _testTimer = null;
  }
  const t = D.tests.find((x) => x.id === testId);
  if (!t) return;
  const answered = Object.keys(_testAnswers).length;
  if (!autoSubmit && answered < t.questions.length) {
    if (
      !confirm(
        `${t.questions.length - answered} ta savol javobsiz. Baribir topshirasizmi?`,
      )
    )
      return;
  }
  // Calculate score
  let correct = 0;
  t.questions.forEach((q, qi) => {
    if (_testAnswers[qi] === q.correct) correct++;
  });
  const score = Math.round((correct / t.questions.length) * 100);
  if (!D.testResults[testId]) D.testResults[testId] = {};
  D.testResults[testId][studentId] = {
    score,
    correct,
    total: t.questions.length,
    answers: { ..._testAnswers },
    completedAt: new Date().toISOString(),
  };
  saveData();
  _activeTestId = null;
  _testAnswers = {};
  // Show result
  renderStudentTestResult(
    testId,
    studentId,
    score,
    correct,
    t.questions.length,
  );
}

function renderStudentTestResult(testId, studentId, score, correct, total) {
  const wrap = document.getElementById("student-tests-wrap");
  if (!wrap) return;
  const t = D.tests.find((x) => x.id === testId);
  const letter = getGradeLetter(score);
  const clr =
    score >= 85
      ? "var(--teal-text)"
      : score >= 70
        ? "var(--accent-text)"
        : score >= 55
          ? "var(--amber-text)"
          : "var(--orange-text)";
  const emoji =
    score >= 85 ? "🏆" : score >= 70 ? "🎉" : score >= 55 ? "👍" : "💪";
  wrap.innerHTML = `
    <div style="text-align:center;padding:40px 20px;max-width:500px;margin:0 auto">
      <div style="font-size:64px;margin-bottom:16px">${emoji}</div>
      <div style="font-size:28px;font-weight:900;color:${clr}">${score}%</div>
      <div style="font-size:14px;color:var(--text2);margin-top:8px">${correct}/${total} to'g'ri javob</div>
      <span class="grade-letter-badge grade-${letter.toLowerCase()}" style="font-size:20px;padding:6px 20px;margin:16px auto;display:inline-block">${letter}</span>
      <div style="font-size:16px;font-weight:700;color:var(--text);margin-top:8px">${t ? t.title : ""}</div>
      <div style="margin-top:24px">
        <button class="btn btn-primary" onclick="renderStudentTestsPage()" style="padding:10px 28px;font-size:14px">⬅️ Testlarga qaytish</button>
      </div>
    </div>`;
}

// Patch renderStudentDashboard to include grades, tests and chat at bottom
const _origRenderStudentDashboard = renderStudentDashboard;
renderStudentDashboard = function () {
  _origRenderStudentDashboard();
  setTimeout(() => {
    const wrap = document.getElementById("student-my-wrap");
    if (!wrap) return;
    const cu = getCurrentUser();
    const studentId = cu.studentId ? parseInt(cu.studentId) : null;
    const s = studentId ? D.students.find((x) => x.id === studentId) : null;
    if (!s) return;
    const groupId = s.groupId;
    const chatSectionHtml =
      typeof renderStudentChatSection === "function"
        ? `<div id="stud-chat-section">${renderStudentChatSection(studentId)}</div>`
        : "";
    const extraHtml = `
      <div style="margin-top:24px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--r-lg);padding:20px 22px;box-shadow:var(--shadow-sm)">
        <div style="font-size:15px;font-weight:800;color:var(--text);margin-bottom:4px">🏅 Mening baholarim</div>
        <div style="font-size:12px;color:var(--text3);margin-bottom:14px">Guruh mezonlari bo'yicha baholar</div>
        ${renderStudentGrades(studentId, groupId)}
      </div>
      <div style="margin-top:18px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--r-lg);padding:20px 22px;box-shadow:var(--shadow-sm)">
        <div style="font-size:15px;font-weight:800;color:var(--text);margin-bottom:4px">📝 Mening testlarim</div>
        <div style="font-size:12px;color:var(--text3);margin-bottom:14px">Guruhingiz uchun testlar</div>
        ${renderStudentTests(studentId, groupId)}
      </div>
      ${chatSectionHtml}`;
    wrap.insertAdjacentHTML("beforeend", extraHtml);
    // scroll chat to bottom
    setTimeout(() => {
      const a = document.getElementById("stud-chat-msgs");
      if (a) a.scrollTop = a.scrollHeight;
    }, 60);
  }, 50);
};

// ===================== MENTOR DASHBOARD =====================
function renderMentorDashboard() {
  const wrap = document.getElementById("mentor-dash-wrap");
  if (!wrap) return;
  const cu = getCurrentUser();
  const mentorName = cu.mentorName || cu.name;
  const mentor = D.mentors.find((m) => m.name === mentorName);
  const myGroups = D.groups.filter((g) => g.mentor === mentorName);
  const myStudents = D.students.filter((s) =>
    myGroups.some((g) => g.id === s.groupId),
  );
  const activeStudents = myStudents.filter((s) => s.status === "Aktiv");
  const debtors = myStudents.filter((s) => s.isDebtor);

  // Oylik hisoblash (joriy oy, 20%)
  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();
  const txs = (D.finance || []).filter((tx) => {
    const d = new Date(tx.date);
    return (
      d.getFullYear() === curYear &&
      d.getMonth() === curMonth &&
      tx.type === "income"
    );
  });
  const myStudentIds = myStudents.map((s) => s.id);
  let mentorIncome = 0;
  txs
    .filter((tx) => tx.studentId && myStudentIds.includes(tx.studentId))
    .forEach((tx) => (mentorIncome += tx.amount));
  if (mentorIncome === 0) {
    myGroups.forEach((g) => {
      const cp = getCoursePrice(g.course);
      const lp = cp > 0 ? Math.round(cp / LESSON_COUNT) : 0;
      D.students
        .filter((s) => s.groupId === g.id)
        .forEach((s) => {
          const attKey = "att_" + g.id + "_" + curYear + "_" + curMonth;
          const sAtt =
            (D.attendance[attKey] && D.attendance[attKey]["s" + s.id]) || {};
          let ky = 0;
          for (let l = 1; l <= LESSON_COUNT; l++) {
            const v = sAtt["l" + l] || "";
            if (v === "K" || v === "Y") ky++;
          }
          mentorIncome += ky * lp;
        });
    });
  }
  const mySalary = Math.round(mentorIncome * MENTOR_SALARY_PCT);

  // Mentor profil qismi
  const photoHtml = mentor
    ? mentorAvatarHtml(mentor, 0, "lg")
    : `<div class="detail-av av-a" style="font-size:24px;width:68px;height:68px;border-radius:50%">${(mentorName || "M").substring(0, 2).toUpperCase()}</div>`;
  const monthNames =
    L === "ru"
      ? [
          "Январь",
          "Февраль",
          "Март",
          "Апрель",
          "Май",
          "Июнь",
          "Июль",
          "Август",
          "Сентябрь",
          "Октябрь",
          "Ноябрь",
          "Декабрь",
        ]
      : L === "en"
        ? [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ]
        : [
            "Yanvar",
            "Fevral",
            "Mart",
            "Aprel",
            "May",
            "Iyun",
            "Iyul",
            "Avgust",
            "Sentabr",
            "Oktabr",
            "Noyabr",
            "Dekabr",
          ];

  // Guruh kartochkalari (qisqacha)
  const groupCardsHtml = myGroups
    .map((g, i) => {
      const gStudents = D.students.filter((s) => s.groupId === g.id);
      const gActive = gStudents.filter((s) => s.status === "Aktiv").length;
      const gDebtors = gStudents.filter((s) => s.isDebtor).length;
      const DAY_FULL = {
        Du: "Du",
        Se: "Se",
        Ch: "Ch",
        Pa: "Pa",
        Ju: "Ju",
        Sh: "Sh",
      };
      const daysStr = (g.days || []).map((d) => DAY_FULL[d] || d).join(", ");
      return `<div style="background:var(--bg);border:1.5px solid var(--border2);border-radius:var(--r-lg);padding:16px 18px;box-shadow:var(--shadow-sm)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div>
          <div style="font-size:15px;font-weight:800;color:var(--text)">${g.name}</div>
          <div style="font-size:11px;color:var(--text2);margin-top:2px">📚 ${g.course}</div>
        </div>
        <span class="badge ${g.status === "Faol" ? "b-teal" : "b-gray"}">${g.status}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
        <div style="background:var(--bg2);border-radius:var(--r-md);padding:8px 10px;border:1px solid var(--border)">
          <div style="color:var(--text3);font-size:10px;font-weight:700;text-transform:uppercase">⏰ Vaqt</div>
          <div style="font-weight:700;color:var(--accent);margin-top:2px">${g.timeStart || "—"}–${g.timeEnd || "—"}</div>
          <div style="color:var(--text3);font-size:11px">${daysStr}</div>
        </div>
        <div style="background:var(--bg2);border-radius:var(--r-md);padding:8px 10px;border:1px solid var(--border)">
          <div style="color:var(--text3);font-size:10px;font-weight:700;text-transform:uppercase">👥 Talabalar</div>
          <div style="font-weight:700;color:var(--purple);margin-top:2px;font-size:15px">${gStudents.length} <span style="font-size:11px;color:var(--text3)">ta</span></div>
          <div style="color:var(--teal-text);font-size:11px">✅ ${gActive} aktiv${gDebtors > 0 ? ` · 💸 ${gDebtors} qarzdor` : ""}</div>
        </div>
      </div>
      <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-sm btn-primary" onclick="go('mentors-my',document.getElementById('nav-mentors-my'))" style="font-size:11px;padding:5px 10px">${L === "ru" ? "📅 Расписание" : L === "en" ? "📅 Schedule" : "📅 Jadval"}</button>
        <button class="btn btn-sm" onclick="_attMonth=null;showGroupStudents(${g.id})" style="font-size:11px;padding:5px 10px">${L === "ru" ? "📋 Посещаемость" : L === "en" ? "📋 Attendance" : "📋 Davomat"}</button>
        <button class="btn btn-sm" onclick="go('grades',document.getElementById('nav-grades-mentor'));setTimeout(()=>selectGradeGroup(${g.id}),150)" style="font-size:11px;padding:5px 10px;background:var(--amber-light);color:var(--amber-text)">${L === "ru" ? "🏅 Оценки" : L === "en" ? "🏅 Grades" : "🏅 Baholar"}</button>
        <button class="btn btn-sm" onclick="go('tests',document.getElementById('nav-tests-mentor'));setTimeout(()=>filterTestsByGroup(${g.id}),150)" style="font-size:11px;padding:5px 10px;background:var(--teal-light);color:var(--teal-text)">${L === "ru" ? "📝 Тесты" : L === "en" ? "📝 Tests" : "📝 Testlar"}</button>
      </div>
    </div>`;
    })
    .join("");

  // Aktiv talabalar jadvali (top 8)
  const topStudents = activeStudents.slice(0, 8);
  const studTableHtml = topStudents.length
    ? `
    <div style="overflow-x:auto;margin-top:4px">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:2px solid var(--border2)">
          <th style="text-align:left;padding:8px 10px;font-size:11px;color:var(--text3);font-weight:700">${L === "ru" ? "Студент" : L === "en" ? "Student" : "Talaba"}</th>
          <th style="text-align:left;padding:8px 10px;font-size:11px;color:var(--text3);font-weight:700">${L === "ru" ? "Группа" : L === "en" ? "Group" : "Guruh"}</th>
          <th style="text-align:center;padding:8px 10px;font-size:11px;color:var(--text3);font-weight:700">${L === "ru" ? "Статус" : L === "en" ? "Status" : "Holat"}</th>
          <th style="text-align:right;padding:8px 10px;font-size:11px;color:var(--text3);font-weight:700">${L === "ru" ? "Оплата" : L === "en" ? "Payment" : "To'lov"}</th>
        </tr></thead>
        <tbody>${topStudents
          .map((s, i) => {
            const grp = myGroups.find((g) => g.id === s.groupId);
            return `<tr style="border-bottom:1px solid var(--border);cursor:pointer;transition:.12s" onclick="showMentorStudentDetail(${s.id})" onmouseover="this.style.background='var(--accent-light)'" onmouseout="this.style.background=''">
            <td style="padding:8px 10px;font-size:13px;font-weight:600"><div style="display:flex;align-items:center;gap:8px"><div class="av ${AV_CLS[i % 5]}" style="width:26px;height:26px;font-size:9px;flex-shrink:0">${ini(s.name)}</div>${s.name}</div></td>
            <td style="padding:8px 10px;font-size:12px;color:var(--text2)">${grp ? grp.name : "—"}</td>
            <td style="padding:8px 10px;text-align:center"><span class="badge b-teal" style="font-size:10px">${L === "ru" ? "✅ Актив" : L === "en" ? "✅ Active" : "✅ Aktiv"}</span></td>
            <td style="padding:8px 10px;text-align:right"><span class="${s.isDebtor ? "badge b-orange" : "badge b-teal"}" style="font-size:10px">${s.isDebtor ? (L === "ru" ? "💸 Должник" : L === "en" ? "💸 Debtor" : "💸 Qarzdor") : L === "ru" ? "✅ Оплачен" : L === "en" ? "✅ Paid" : "✅ To'lagan"}</span></td>
          </tr>`;
          })
          .join("")}</tbody>
      </table>
      ${activeStudents.length > 8 ? `<div style="font-size:12px;color:var(--text3);padding:8px 10px">${L === "ru" ? `+ ещё ${activeStudents.length - 8} активных студентов` : L === "en" ? `+ ${activeStudents.length - 8} more active students` : `+ yana ${activeStudents.length - 8} ta aktiv talaba`}</div>` : ""}
    </div>`
    : '<div style="color:var(--text3);font-size:13px;padding:12px 0">Aktiv talabalar yo\'q</div>';

  const isDark = _uiSettings && _uiSettings.theme === "dark";
  const curLang = LANG || "uz";
  const curAccent = _uiSettings.accent || "blue";
  const curFs = _uiSettings.fontSize || "md";
  const themeLabel = LANG === "ru" ? "Тема" : LANG === "en" ? "Theme" : "Mavzu";
  const langLabel = LANG === "ru" ? "Язык" : LANG === "en" ? "Language" : "Til";
  const colorLabel = LANG === "ru" ? "Цвет" : LANG === "en" ? "Color" : "Rang";
  const fontLabel = LANG === "ru" ? "Шрифт" : LANG === "en" ? "Font" : "Shrift";
  const accentColors = [
    { k: "blue", c: "#3b82f6" },
    { k: "teal", c: "#0d9488" },
    { k: "purple", c: "#7c3aed" },
    { k: "orange", c: "#ea580c" },
    { k: "rose", c: "#e11d48" },
    { k: "green", c: "#059669" },
  ];
  wrap.innerHTML = `<div style="padding:0 0 24px">
    <!-- Profil banner -->
    <div style="background:linear-gradient(135deg,var(--accent),var(--teal));border-radius:var(--r-lg);padding:22px 24px;color:#fff;margin-bottom:22px;position:relative;overflow:hidden">
      <div style="position:absolute;right:-10px;top:-10px;font-size:110px;opacity:.07;pointer-events:none">🎓</div>
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;border:3px solid rgba(255,255,255,.4);flex-shrink:0;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#fff">${mentor && mentorPhotoSrc(mentor) ? `<img src="${mentorPhotoSrc(mentor)}" style="width:100%;height:100%;object-fit:cover">` : (mentorName || "M").substring(0, 2).toUpperCase()}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;opacity:.8">Xush kelibsiz,</div>
          <div style="font-size:24px;font-weight:800;letter-spacing:-.5px">${mentorName}</div>
          ${mentor ? `<div style="font-size:13px;opacity:.85;margin-top:3px">📚 ${mentor.subject} · 💼 ${mentor.experience || "—"}</div>` : ""}
        </div>
      </div>
      ${
        mentor
          ? `<div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">
        ${mentor.phone ? `<span style="background:rgba(255,255,255,.2);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600">📱 ${mentor.phone}</span>` : ""}
        ${mentor.email ? `<span style="background:rgba(255,255,255,.2);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600">✉️ ${mentor.email}</span>` : ""}
        ${mentor.telegram ? `<span style="background:rgba(255,255,255,.2);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600">💬 ${mentor.telegram}</span>` : ""}
      </div>`
          : ""
      }
    </div>

    <!-- Statistika kartochkalar -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:22px">
      <div style="background:var(--bg);border:1.5px solid var(--border2);border-radius:var(--r-lg);padding:16px 18px;text-align:center;box-shadow:var(--shadow-sm);cursor:pointer;transition:.15s" onclick="showMentorStatDetail('groups')" onmouseover="this.style.transform='translateY(-2px)';this.style.borderColor='var(--accent)'" onmouseout="this.style.transform='';this.style.borderColor='var(--border2)'">
        <div style="font-size:32px;font-weight:900;color:var(--accent)">${myGroups.length}</div>
        <div style="font-size:11px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-top:4px">${L === "ru" ? "Группы" : L === "en" ? "Groups" : "Guruhlar"}</div>
        <div style="font-size:10px;color:var(--accent-text);margin-top:3px">${L === "ru" ? "Нажмите →" : L === "en" ? "Click →" : "Bosing →"}</div>
      </div>
      <div style="background:var(--bg);border:1.5px solid var(--border2);border-radius:var(--r-lg);padding:16px 18px;text-align:center;box-shadow:var(--shadow-sm);cursor:pointer;transition:.15s" onclick="showMentorStatDetail('active')" onmouseover="this.style.transform='translateY(-2px)';this.style.borderColor='var(--teal)'" onmouseout="this.style.transform='';this.style.borderColor='var(--border2)'">
        <div style="font-size:32px;font-weight:900;color:var(--teal-text)">${activeStudents.length}</div>
        <div style="font-size:11px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-top:4px">${L === "ru" ? "Активные студенты" : L === "en" ? "Active students" : "Aktiv talabalar"}</div>
        <div style="font-size:10px;color:var(--teal-text);margin-top:3px">${L === "ru" ? "Нажмите →" : L === "en" ? "Click →" : "Bosing →"}</div>
      </div>
      <div style="background:var(--bg);border:1.5px solid var(--border2);border-radius:var(--r-lg);padding:16px 18px;text-align:center;box-shadow:var(--shadow-sm);cursor:pointer;transition:.15s" onclick="showMentorStatDetail('all')" onmouseover="this.style.transform='translateY(-2px)';this.style.borderColor='var(--purple)'" onmouseout="this.style.transform='';this.style.borderColor='var(--border2)'">
        <div style="font-size:32px;font-weight:900;color:var(--purple-text)">${myStudents.length}</div>
        <div style="font-size:11px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-top:4px">${L === "ru" ? "Всего студентов" : L === "en" ? "Total students" : "Jami talabalar"}</div>
        <div style="font-size:10px;color:var(--purple-text);margin-top:3px">${L === "ru" ? "Нажмите →" : L === "en" ? "Click →" : "Bosing →"}</div>
      </div>
      <div style="background:var(--bg);border:1.5px solid ${debtors.length > 0 ? "var(--orange)" : "var(--teal)"};border-radius:var(--r-lg);padding:16px 18px;text-align:center;box-shadow:var(--shadow-sm);cursor:pointer;transition:.15s" onclick="showMentorStatDetail('debtors')" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
        <div style="font-size:28px;font-weight:900;color:${debtors.length > 0 ? "var(--orange-text)" : "var(--teal-text)"}">${debtors.length > 0 ? "💸 " + debtors.length : "✅ 0"}</div>
        <div style="font-size:11px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-top:4px">${L === "ru" ? "Должники" : L === "en" ? "Debtors" : "Qarzdorlar"}</div>
        <div style="font-size:10px;color:var(--accent-text);margin-top:3px">${L === "ru" ? "Нажмите →" : L === "en" ? "Click →" : "Bosing →"}</div>
      </div>
      <div style="background:var(--bg);border:1.5px solid var(--border2);border-radius:var(--r-lg);padding:16px 18px;text-align:center;box-shadow:var(--shadow-sm)">
        <div style="font-size:22px;font-weight:900;color:var(--purple-text)">${fmtMoney(mySalary)}<span style="font-size:13px"> so'm</span></div>
        <div style="font-size:11px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-top:4px">${monthNames[curMonth]} ${L === "ru" ? "зарплата (20%)" : L === "en" ? "salary (20%)" : "oyligi (20%)"}</div>
      </div>
    </div>
    <!-- Ikki ustun: Guruhlar + Aktiv talabalar -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-bottom:20px">
      <div>
        <div style="font-size:14px;font-weight:800;color:var(--text);margin-bottom:12px">${L === "ru" ? "🗂 Мои группы" : L === "en" ? "🗂 My Groups" : "🗂 Mening guruhlarim"}</div>
        ${myGroups.length ? groupCardsHtml : `<div style="color:var(--text3);font-size:13px;padding:12px 0">${L === "ru" ? "Группы не назначены" : L === "en" ? "No groups assigned" : "Sizga guruh biriktirilmagan"}</div>`}
      </div>
      <div>
        <div style="font-size:14px;font-weight:800;color:var(--text);margin-bottom:12px">${L === "ru" ? "✅ Активные студенты" : L === "en" ? "✅ Active students" : "✅ Aktiv talabalar"}</div>
        <div style="background:var(--bg);border:1.5px solid var(--border2);border-radius:var(--r-lg);padding:16px;box-shadow:var(--shadow-sm)">
          ${studTableHtml}
        </div>
      </div>
    </div>
  </div>`;
}

// ===================== MENTOR CHAT =====================
// Chat storage key: mentor_chat_{mentorName}_{studentId}
function getMentorChatKey(mentorName, studentId) {
  return "mchat_" + btoa(mentorName).replace(/=/g, "") + "_" + studentId;
}
function getMentorChats(mentorName) {
  try {
    return JSON.parse(
      localStorage.getItem(
        "mchat_list_" + btoa(mentorName).replace(/=/g, ""),
      ) || "{}",
    );
  } catch (e) {
    return {};
  }
}
function saveMentorChats(mentorName, obj) {
  localStorage.setItem(
    "mchat_list_" + btoa(mentorName).replace(/=/g, ""),
    JSON.stringify(obj),
  );
}
function getMentorChatMessages(mentorName, studentId) {
  try {
    return JSON.parse(
      localStorage.getItem(getMentorChatKey(mentorName, studentId)) || "[]",
    );
  } catch (e) {
    return [];
  }
}
function saveMentorChatMessages(mentorName, studentId, msgs) {
  localStorage.setItem(
    getMentorChatKey(mentorName, studentId),
    JSON.stringify(msgs),
  );
}

let _chatSelectedStudent = null;

function renderMentorChat() {
  const wrap = document.getElementById("mentor-chat-wrap");
  if (!wrap) return;
  const L = LANG;
  const cu = getCurrentUser();
  const mentorName = cu.mentorName || cu.name;
  const myGroups = D.groups.filter((g) => g.mentor === mentorName);
  const myStudents = D.students.filter(
    (s) => myGroups.some((g) => g.id === s.groupId) && s.status !== "Arxiv",
  );

  if (!myStudents.length) {
    wrap.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--text3)"><div style="font-size:48px;margin-bottom:16px">💬</div><div style="font-size:16px;font-weight:600">${L === "ru" ? "Нет студентов" : L === "en" ? "No students" : "Talabalar yo'q"}</div><div style="font-size:13px;margin-top:8px">${L === "ru" ? "В ваших группах пока нет студентов" : L === "en" ? "No students in your groups yet" : "Sizning guruhlaringizda hali talabalar yo'q"}</div></div>`;
    return;
  }

  if (!_chatSelectedStudent) _chatSelectedStudent = myStudents[0].id;
  const selSt =
    myStudents.find((s) => s.id === _chatSelectedStudent) || myStudents[0];
  const msgs = getMentorChatMessages(mentorName, selSt.id);

  // sidebar: talabalar ro'yxati
  const studentListHtml = myStudents
    .map((s, i) => {
      const grp = myGroups.find((g) => g.id === s.groupId);
      const lastMsgs = getMentorChatMessages(mentorName, s.id);
      const last = lastMsgs.length ? lastMsgs[lastMsgs.length - 1] : null;
      const isActive = s.id === selSt.id;
      const unread = lastMsgs.filter(
        (m) => !m.read && m.from === "student",
      ).length;
      return `<div onclick="_chatSelectedStudent=${s.id};renderMentorChat()" style="display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border);background:${isActive ? "var(--accent-light)" : "var(--bg)"};transition:background .15s" onmouseover="if(!${isActive})this.style.background='var(--bg2)'" onmouseout="if(!${isActive})this.style.background='var(--bg)'">
      <div class="av ${AV_CLS[i % 5]}" style="width:36px;height:36px;font-size:12px;flex-shrink:0">${ini(s.name)}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:700;color:${isActive ? "var(--accent-text)" : "var(--text)"};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.name}${unread > 0 ? `<span style="background:var(--accent);color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;margin-left:6px">${unread}</span>` : ""}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${grp ? grp.name : "—"}${last ? ` · ${last.text.substring(0, 20)}...` : ` · ${L === "ru" ? "Нет сообщений" : L === "en" ? "No messages" : "Xabar yo'q"}`}</div>
      </div>
    </div>`;
    })
    .join("");

  // Messages area
  const msgsHtml = msgs.length
    ? msgs
        .map((m) => {
          const isMentor = m.from === "mentor";
          const time = m.time
            ? new Date(m.time).toLocaleTimeString("uz-UZ", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";
          return `<div style="display:flex;justify-content:${isMentor ? "flex-end" : "flex-start"};margin-bottom:10px">
      <div style="max-width:70%;background:${isMentor ? "var(--accent)" : "var(--bg2)"};color:${isMentor ? "#fff" : "var(--text)"};padding:10px 14px;border-radius:${isMentor ? "14px 14px 4px 14px" : "14px 14px 14px 4px"};font-size:13px;line-height:1.5;box-shadow:var(--shadow-sm)">
        ${m.text}
        <div style="font-size:10px;opacity:.7;margin-top:4px;text-align:right">${time}${isMentor ? " ✓" : ""}</div>
      </div>
    </div>`;
        })
        .join("")
    : `<div style="text-align:center;padding:40px 20px;color:var(--text3)"><div style="font-size:40px;margin-bottom:10px">💬</div><div>${L === "ru" ? "Нет сообщений. Напишите первым!" : L === "en" ? "No messages yet. Say hello!" : "Hali xabar yo'q. Birinchi xabarni yuboring!"}</div></div>`;

  wrap.innerHTML = `<div style="display:flex;height:calc(100vh - 120px);min-height:400px;gap:0;border:1px solid var(--border2);border-radius:var(--r-lg);overflow:hidden;background:var(--bg)">
    <!-- Talabalar ro'yxati sidebar -->
    <div style="width:260px;flex-shrink:0;border-right:1px solid var(--border2);overflow-y:auto;background:var(--bg2)">
      <div style="padding:14px;border-bottom:1px solid var(--border2);font-size:14px;font-weight:800;color:var(--text)">${L === "ru" ? "💬 Студенты" : L === "en" ? "💬 Students" : "💬 Talabalar"}</div>
      ${studentListHtml}
    </div>
    <!-- Chat area -->
    <div style="flex:1;display:flex;flex-direction:column;min-width:0">
      <!-- Header -->
      <div style="padding:12px 16px;border-bottom:1px solid var(--border2);background:var(--bg2);display:flex;align-items:center;gap:10px">
        <div class="av ${AV_CLS[myStudents.findIndex((s) => s.id === selSt.id) % 5]}" style="width:36px;height:36px;font-size:12px;flex-shrink:0">${ini(selSt.name)}</div>
        <div>
          <div style="font-size:14px;font-weight:700;color:var(--text)">${selSt.name}</div>
          <div style="font-size:11px;color:var(--text3)">${(myGroups.find((g) => g.id === selSt.groupId) || {}).name || "—"} · <span class="badge b-teal" style="font-size:9px">${selSt.status}</span></div>
        </div>
      </div>
      <!-- Messages -->
      <div id="chat-msgs-area" style="flex:1;overflow-y:auto;padding:16px">
        ${msgsHtml}
      </div>
      <!-- Input -->
      <div style="padding:12px 16px;border-top:1px solid var(--border2);background:var(--bg2);display:flex;gap:8px;align-items:flex-end">
        <textarea id="chat-input-text" placeholder="${L === "ru" ? "Написать сообщение..." : L === "en" ? "Type a message..." : "Xabar yozing..."}" rows="2" style="flex:1;resize:none;padding:10px 14px;border:1.5px solid var(--border2);border-radius:12px;background:var(--bg);color:var(--text);font-size:13px;font-family:inherit;outline:none" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMentorMessage('${mentorName.replace(/'/g, "\\'")}',${selSt.id});}"></textarea>
        <button class="btn btn-primary" onclick="sendMentorMessage('${mentorName.replace(/'/g, "\\'")}',${selSt.id})" style="padding:10px 18px;align-self:stretch">${L === "ru" ? "➤ Отправить" : L === "en" ? "➤ Send" : "➤ Yuborish"}</button>
      </div>
    </div>
  </div>`;

  // Scroll to bottom
  setTimeout(() => {
    const area = document.getElementById("chat-msgs-area");
    if (area) area.scrollTop = area.scrollHeight;
  }, 50);
  // Mark student msgs as read
  const updated = msgs.map((m) => ({ ...m, read: true }));
  saveMentorChatMessages(mentorName, selSt.id, updated);
}

function sendMentorMessage(mentorName, studentId) {
  const inp = document.getElementById("chat-input-text");
  if (!inp) return;
  const text = (inp.value || "").trim();
  if (!text) return;
  const msgs = getMentorChatMessages(mentorName, studentId);
  msgs.push({
    from: "mentor",
    text,
    time: new Date().toISOString(),
    read: true,
  });
  saveMentorChatMessages(mentorName, studentId, msgs);
  inp.value = "";
  renderMentorChat();
}

// Also allow students to see/reply chat from their dashboard
function renderStudentChatSection(studentId) {
  const cu = getCurrentUser();
  const s = D.students.find((x) => x.id === studentId);
  if (!s) return "";
  const grp = D.groups.find((g) => g.id === s.groupId);
  if (!grp || !grp.mentor) return "";
  const mentorName = grp.mentor;
  const msgs = getMentorChatMessages(mentorName, studentId);
  const msgsHtml = msgs.length
    ? msgs
        .map((m) => {
          const isMentor = m.from === "mentor";
          const time = m.time
            ? new Date(m.time).toLocaleTimeString("uz-UZ", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";
          return `<div style="display:flex;justify-content:${isMentor ? "flex-start" : "flex-end"};margin-bottom:8px">
      <div style="max-width:75%;background:${isMentor ? "var(--bg3)" : "var(--accent)"};color:${isMentor ? "var(--text)" : "#fff"};padding:8px 12px;border-radius:${isMentor ? "12px 12px 12px 4px" : "12px 12px 4px 12px"};font-size:13px;line-height:1.5;box-shadow:var(--shadow-sm)">
        ${isMentor ? `<div style="font-size:10px;font-weight:700;opacity:.7;margin-bottom:3px">🎓 ${mentorName}</div>` : ""}
        ${m.text}
        <div style="font-size:10px;opacity:.6;text-align:right;margin-top:3px">${time}</div>
      </div>
    </div>`;
        })
        .join("")
    : `<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px">Xabar yo'q. Mentorga savol yuboring!</div>`;

  return `<div style="margin-top:20px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--r-lg);padding:20px 22px;box-shadow:var(--shadow-sm)">
    <div style="font-size:15px;font-weight:800;color:var(--text);margin-bottom:4px">💬 Mentor bilan chat</div>
    <div style="font-size:12px;color:var(--text3);margin-bottom:14px">🎓 ${mentorName}</div>
    <div id="stud-chat-msgs" style="max-height:240px;overflow-y:auto;margin-bottom:12px;padding:4px 0">${msgsHtml}</div>
    <div style="display:flex;gap:8px">
      <input type="text" id="stud-chat-inp" placeholder="Savolingizni yozing..." style="flex:1;padding:9px 14px;border:1.5px solid var(--border2);border-radius:10px;background:var(--bg);color:var(--text);font-size:13px" onkeydown="if(event.key==='Enter')sendStudentMessage('${mentorName.replace(/'/g, "\\'")}',${studentId})">
      <button class="btn btn-primary btn-sm" onclick="sendStudentMessage('${mentorName.replace(/'/g, "\\'")}',${studentId})">➤</button>
    </div>
  </div>`;
}

function sendStudentMessage(mentorName, studentId) {
  const inp = document.getElementById("stud-chat-inp");
  if (!inp) return;
  const text = (inp.value || "").trim();
  if (!text) return;
  const msgs = getMentorChatMessages(mentorName, studentId);
  msgs.push({
    from: "student",
    text,
    time: new Date().toISOString(),
    read: false,
  });
  saveMentorChatMessages(mentorName, studentId, msgs);
  inp.value = "";
  // Re-render chat section
  const chatWrap = document.getElementById("stud-chat-section");
  if (chatWrap) {
    chatWrap.innerHTML = renderStudentChatSection(studentId);
  }
  // Scroll
  setTimeout(() => {
    const a = document.getElementById("stud-chat-msgs");
    if (a) a.scrollTop = a.scrollHeight;
  }, 30);
}
