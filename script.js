let fanclubs = JSON.parse(localStorage.getItem("fanclubs")) || [];
let editIndex = null;

const fcList = document.getElementById("fcList");
const searchInput = document.getElementById("searchInput");
let currentGroupFilter = "all";

/* テーマ読み込み */
const savedTheme = localStorage.getItem("theme");
if (savedTheme) document.body.classList.add(savedTheme);

/* テーマ切り替え */
document.getElementById("themeBtn").onclick = () => {
  document.getElementById("themePanel").classList.toggle("hide");
};

document.querySelectorAll(".theme-option").forEach(opt => {
  opt.onclick = () => {
    const theme = opt.dataset.theme;
    document.body.className = theme;
    localStorage.setItem("theme", theme);
    document.getElementById("themePanel").classList.add("hide");
  };
});

/* パスワード表示切替（登録画面） */
function togglePassword() {
  const input = document.getElementById("password");
  const btn = document.getElementById("togglePass");

  if (input.type === "password") {
    input.type = "text";
    btn.textContent = "非表示";
  } else {
    input.type = "password";
    btn.textContent = "表示";
  }
}

/* グループ絞り込みラジオ生成 */
function renderGroupFilter() {
  const container = document.getElementById("groupFilter");
  if (!container) return;

  const groups = [...new Set(fanclubs.map(fc => fc.groupName).filter(Boolean))];

  let html = `
    <label><input type="radio" name="group" value="all" ${currentGroupFilter === "all" ? "checked" : ""}> すべて</label>
  `;

  groups.forEach(g => {
    html += `
      <label><input type="radio" name="group" value="${g}" ${currentGroupFilter === g ? "checked" : ""}> ${g}</label>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll("input[type=radio]").forEach(r => {
    r.addEventListener("change", e => {
      currentGroupFilter = e.target.value;
      displayFanclubs();
    });
  });
}

/* 一覧表示 */
function saveFanclubs() {
  localStorage.setItem("fanclubs", JSON.stringify(fanclubs));
}

function displayFanclubs() {
  fcList.innerHTML = "";

  const keyword = (searchInput?.value || "").toLowerCase();
  const groupFilterValue = currentGroupFilter;

  fanclubs
    .filter(fc => {
      const name = (fc.groupName || "").toLowerCase();
      const matchKeyword = name.includes(keyword);
      const matchGroup =
        groupFilterValue === "all" ? true : fc.groupName === groupFilterValue;
      return matchKeyword && matchGroup;
    })
    .forEach((fc, index) => {
      const card = document.createElement("div");
      card.className = "card list-card";
      card.onclick = () => openDetail(index);

      card.innerHTML = `
        <div class="card-header">
          <h3>${fc.groupName || ""}</h3>
          <span class="memberNo-inline">${fc.memberNo || ""}</span>
        </div>
        <p>更新期限：${fc.expireDate || ""}</p>
        <div class="btn-area">
          <button onclick="event.stopPropagation(); editFanclub(${index})">編集</button>
          <button onclick="event.stopPropagation(); deleteFanclub(${index})">削除</button>
        </div>
      `;

      fcList.appendChild(card);
    });

  renderGroupFilter();
}

/* ソートボタンのハイライト */
function setActiveSort(button) {
  document.querySelectorAll(".sort-btn").forEach(btn =>
    btn.classList.remove("active")
  );
  button.classList.add("active");
}

/* ソートラベル更新 */
function updateSortLabel(button, label, asc) {
  button.textContent = label + (asc ? " ↑" : " ↓");
}

/* ソート：グループ名 */
let sortGroupAsc = true;
function sortByGroupName() {
  const btn = event.target;
  setActiveSort(btn);

  fanclubs.sort((a, b) => {
    if (!a.groupName) return 1;
    if (!b.groupName) return -1;
    return sortGroupAsc
      ? a.groupName.localeCompare(b.groupName, "ja")
      : b.groupName.localeCompare(a.groupName, "ja");
  });

  updateSortLabel(btn, "グループ名順", sortGroupAsc);
  sortGroupAsc = !sortGroupAsc;

  saveFanclubs();
  displayFanclubs();
}

/* ソート：更新期限 */
let sortExpireAsc = true;
function sortByExpireDate() {
  const btn = event.target;
  setActiveSort(btn);

  fanclubs.sort((a, b) => {
    const da = new Date(a.expireDate || "1900-01-01");
    const db = new Date(b.expireDate || "1900-01-01");
    return sortExpireAsc ? da - db : db - da;
  });

  updateSortLabel(btn, "更新期限順", sortExpireAsc);
  sortExpireAsc = !sortExpireAsc;

  saveFanclubs();
  displayFanclubs();
}

/* ソート：会員番号 */
let sortMemberNoAsc = true;
function sortByMemberNo() {
  const btn = event.target;
  setActiveSort(btn);

  fanclubs.sort((a, b) => {
    const na = parseInt(a.memberNo || "0", 10);
    const nb = parseInt(b.memberNo || "0", 10);
    return sortMemberNoAsc ? na - nb : nb - na;
  });

  updateSortLabel(btn, "会員番号順", sortMemberNoAsc);
  sortMemberNoAsc = !sortMemberNoAsc;

  saveFanclubs();
  displayFanclubs();
}

/* 詳細画面 */
function openDetail(index) {
  const fc = fanclubs[index];

  fcList.innerHTML = `
    <div class="card detail-card">
      <div class="card-header">
        <h3>${fc.groupName || ""}</h3>
        <span class="memberNo-inline">${fc.memberNo || ""}</span>
      </div>
      <p>担当：${fc.memberName || ""}</p>
      <p>年会費：${fc.annualFee || ""}円</p>
      <p>会員番号：${fc.memberNo || ""}</p>
      <p>住所：${fc.address || ""}</p>
      <p>電話番号：${fc.phone || ""}</p>
      <p>メール：${fc.email || ""}</p>
      <p>
        パスワード：
        <span id="pw-real">＊＊＊＊</span>
        <button onclick="toggleDetailPassword('${fc.password || ""}')">表示</button>
      </p>
      <p>更新期限：${fc.expireDate || ""}</p>
      <button onclick="showListPage()">戻る</button>
    </div>
  `;
}

/* 詳細画面のパスワード表示 */
function toggleDetailPassword(password) {
  const span = document.getElementById("pw-real");
  const btn = event.target;

  if (span.textContent === "＊＊＊＊") {
    span.textContent = password;
    btn.textContent = "非表示";
  } else {
    span.textContent = "＊＊＊＊";
    btn.textContent = "表示";
  }
}

/* 登録・編集 */
function addFanclub() {
  const data = {
    groupName: document.getElementById("groupName").value,
    memberName: document.getElementById("memberName").value,
    annualFee: document.getElementById("annualFee").value,
    memberNo: document.getElementById("memberNo").value,
    address: document.getElementById("address").value,
    phone: document.getElementById("phone").value,
    email: document.getElementById("email").value,
    password: document.getElementById("password").value,
    expireDate: document.getElementById("expireDate").value
  };

  if (!data.groupName) {
    alert("グループ名を入力してください");
    return;
  }

  if (editIndex !== null) {
    fanclubs[editIndex] = data;
    editIndex = null;
  } else {
    fanclubs.push(data);
  }

  saveFanclubs();
  displayFanclubs();
  showListPage();
  clearForm();
}

/* 削除 */
function deleteFanclub(index) {
  const fc = fanclubs[index];
  const name = fc?.groupName || "この登録";

  const ok = window.confirm(`${name} を削除します。よろしいですか？`);
  if (!ok) return;

  fanclubs.splice(index, 1);
  saveFanclubs();
  displayFanclubs();
}

/* 編集 */
function editFanclub(index) {
  const fc = fanclubs[index];

  document.getElementById("groupName").value = fc.groupName;
  document.getElementById("memberName").value = fc.memberName;
  document.getElementById("annualFee").value = fc.annualFee;
  document.getElementById("memberNo").value = fc.memberNo;
  document.getElementById("address").value = fc.address;
  document.getElementById("phone").value = fc.phone;
  document.getElementById("email").value = fc.email;
  document.getElementById("password").value = fc.password;
  document.getElementById("expireDate").value = fc.expireDate;

  editIndex = index;

  showAddPage();
}

/* フォームクリア */
function clearForm() {
  document.getElementById("groupName").value = "";
  document.getElementById("memberName").value = "";
  document.getElementById("annualFee").value = "";
  document.getElementById("memberNo").value = "";
  document.getElementById("address").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
  document.getElementById("expireDate").value = "";
}

/* 画面切り替え */
function showAddPage() {
  document.getElementById("addPage").style.display = "block";
  document.getElementById("listPage").style.display = "none";
}

function showListPage() {
  document.getElementById("addPage").style.display = "none";
  document.getElementById("listPage").style.display = "block";
  displayFanclubs();
}

/* 検索入力イベント */
searchInput?.addEventListener("input", displayFanclubs);

/* 初期表示 */
displayFanclubs();
