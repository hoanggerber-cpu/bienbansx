// Schema keys to keep consistent with your previous app
const SCHEMA_KEYS = [
  "id",
  "productCodeName",
  "customerName",
  "sampleSewingDate",
  "productionDate",
  "sampleEditDetails",
  "originalForm",
  "sampleImage",
  "patternImage",
  "agreedToTerms",
  "signature",
  "confirmationDate",
  "reportCreator"
];

const STORAGE_KEY = "bienban_data_v1";

function loadSampleData(){
  return [
    {
      "id": "BB-001",
      "productCodeName": "TSHIRT-POLO/2025",
      "customerName": "Khách A",
      "sampleSewingDate": "2025-10-01",
      "productionDate": "2025-10-05",
      "sampleEditDetails": "May lại cổ áo, chỉnh form vai.",
      "originalForm": "Form Regular",
      "sampleImage": "",
      "patternImage": "",
      "agreedToTerms": true,
      "signature": "",
      "confirmationDate": "2025-10-06",
      "reportCreator": "Phúc Hoàng"
    },
    {
      "id": "BB-002",
      "productCodeName": "HOODIE-HCM/GRAY",
      "customerName": "Khách B",
      "sampleSewingDate": "2025-10-10",
      "productionDate": "2025-10-15",
      "sampleEditDetails": "Bổ sung bo tay, giảm độ rộng thân 1cm.",
      "originalForm": "Form Oversize",
      "sampleImage": "",
      "patternImage": "",
      "agreedToTerms": false,
      "signature": "",
      "confirmationDate": "2025-10-16",
      "reportCreator": "INPETPHUCHOANG"
    }
  ];
}

function readData(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw){ return loadSampleData(); }
    const data = JSON.parse(raw);
    if(!Array.isArray(data)) throw new Error("Invalid data");
    return sanitizeArrayToSchema(data);
  }catch(e){
    console.warn("Failed to parse local data, using sample", e);
    return loadSampleData();
  }
}

function saveData(rows){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function sanitizeRow(row){
  const out = {};
  SCHEMA_KEYS.forEach(k => {
    let v = row[k];
    if(k === "agreedToTerms"){
      v = (v === true || v === "true");
    }
    out[k] = (v === undefined ? "" : v);
  });
  return out;
}

function sanitizeArrayToSchema(arr){
  return arr.map(sanitizeRow);
}

function parseCSV(text){
  const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
  const headers = headerLine.split(",").map(h => h.trim());
  return lines.map(line => {
    const values = line.split(",").map(v => v.trim());
    const row = {};
    headers.forEach((h,i)=>{ row[h] = values[i] ?? ""; });
    return sanitizeRow(row);
  });
}

function toCSV(rows){
  const head = SCHEMA_KEYS.join(",");
  const body = rows.map(r => SCHEMA_KEYS.map(k => (r[k] ?? "")).join(",")).join("\n");
  return head + "\n" + body;
}

let rows = readData();
let filtered = [...rows];
let sortKey = null;
let sortAsc = true;

const $tbody = document.querySelector("#dataTable tbody");
const $rowTpl = document.querySelector("#rowTemplate");
const $dialog = document.querySelector("#editDialog");
const $form = document.querySelector("#editForm");
const $dialogTitle = document.querySelector("#dialogTitle");

function render(){
  $tbody.innerHTML = "";
  filtered.forEach((r, idx) => {
    const clone = $rowTpl.content.cloneNode(true);
    SCHEMA_KEYS.forEach(k => {
      const cell = clone.querySelector(`[data-key="${k}"]`);
      if(!cell) return;
      if(["sampleImage","patternImage","signature"].includes(k)){
        cell.innerHTML = r[k] ? `<img src="${r[k]}" alt="${k}">` : "<span class='muted'>—</span>";
      }else if(k === "agreedToTerms"){
        cell.textContent = r[k] ? "✔" : "✘";
      }else{
        cell.textContent = r[k] || "";
      }
    });
    const actions = clone.querySelector(".actions");
    const btnEdit = actions.querySelector(".edit");
    const btnDel = actions.querySelector(".del");
    btnEdit.addEventListener("click", ()=> openEdit(idx));
    btnDel.addEventListener("click", ()=> deleteRow(idx));
    $tbody.appendChild(clone);
  });
}

function applyFilters(){
  const qCustomer = document.querySelector("#searchCustomer").value.trim().toLowerCase();
  const qProduct = document.querySelector("#searchProduct").value.trim().toLowerCase();
  const startDate = document.querySelector("#startDate").value;
  const endDate = document.querySelector("#endDate").value;

  filtered = rows.filter(r => {
    if(qCustomer && !String(r.customerName).toLowerCase().includes(qCustomer)) return false;
    if(qProduct && !String(r.productCodeName).toLowerCase().includes(qProduct)) return false;
    if(startDate && String(r.productionDate) < startDate) return false;
    if(endDate && String(r.productionDate) > endDate) return false;
    return true;
  });

  if(sortKey){
    sortBy(sortKey, false);
  }else{
    render();
  }
}

function sortBy(key, toggle=true){
  if(toggle){
    if(sortKey === key){ sortAsc = !sortAsc; }
    else { sortKey = key; sortAsc = true; }
  }
  filtered.sort((a,b)=>{
    const va = (a[key] ?? "").toString();
    const vb = (b[key] ?? "").toString();
    if(va < vb) return sortAsc ? -1 : 1;
    if(va > vb) return sortAsc ? 1 : -1;
    return 0;
  });
  render();
}

function openEdit(idx){
  const row = filtered[idx];
  const realIndex = rows.indexOf(row);
  $form.dataset.index = String(realIndex);
  $dialogTitle.textContent = "Sửa biên bản";
  SCHEMA_KEYS.forEach(k => {
    const field = $form.elements.namedItem(k);
    if(field){
      field.value = row[k] ?? "";
      if(k === "agreedToTerms"){
        field.value = row[k] ? "true" : "false";
      }
    }
  });
  $dialog.showModal();
}

function openAdd(){
  $form.reset();
  delete $form.dataset.index;
  $dialogTitle.textContent = "Thêm biên bản";
  $dialog.showModal();
}

function deleteRow(idx){
  const row = filtered[idx];
  const realIndex = rows.indexOf(row);
  if(realIndex >= 0) rows.splice(realIndex,1);
  saveData(rows);
  applyFilters();
}

$form.addEventListener("submit", (e)=>{
  e.preventDefault();
  const formData = new FormData($form);
  const data = {};
  SCHEMA_KEYS.forEach(k => {
    let v = formData.get(k);
    if(k === "agreedToTerms"){
      data[k] = (v === "true");
    }else{
      data[k] = v ? String(v) : "";
    }
  });
  const idxStr = $form.dataset.index;
  if(idxStr !== undefined){
    const idx = Number(idxStr);
    rows[idx] = data;
  }else{
    rows.push(data);
  }
  saveData(rows);
  $dialog.close();
  applyFilters();
});

document.querySelector("#btnAdd").addEventListener("click", openAdd);
document.querySelector("#btnClearFilter").addEventListener("click", ()=>{
  document.querySelector("#searchCustomer").value = "";
  document.querySelector("#searchProduct").value = "";
  document.querySelector("#startDate").value = "";
  document.querySelector("#endDate").value = "";
  applyFilters();
});

document.querySelector("#searchCustomer").addEventListener("input", applyFilters);
document.querySelector("#searchProduct").addEventListener("input", applyFilters);
document.querySelector("#startDate").addEventListener("change", applyFilters);
document.querySelector("#endDate").addEventListener("change", applyFilters);

document.querySelectorAll("thead th[data-key]").forEach(th => {
  th.addEventListener("click", ()=> sortBy(th.dataset.key));
});

document.querySelector("#btnReset").addEventListener("click", ()=>{
  if(confirm("Khôi phục dữ liệu mẫu? Dữ liệu hiện tại sẽ bị ghi đè.")){
    rows = loadSampleData();
    saveData(rows);
    applyFilters();
  }
});

document.querySelector("#fileImport").addEventListener("change", async (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const text = await file.text();
  let imported = [];
  if(file.name.toLowerCase().endsWith(".csv")){
    imported = parseCSV(text);
  }else{
    try{
      imported = sanitizeArrayToSchema(JSON.parse(text));
    }catch(err){
      alert("File JSON không hợp lệ.");
      return;
    }
  }
  rows = imported;
  saveData(rows);
  applyFilters();
  e.target.value = "";
});

function download(filename, text){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], {type: "text/plain"}));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

document.querySelector("#btnExportJSON").addEventListener("click", ()=>{
  download("bienban_data.json", JSON.stringify(rows, null, 2));
});

document.querySelector("#btnExportCSV").addEventListener("click", ()=>{
  download("bienban_data.csv", toCSV(rows));
});

// Initial render
applyFilters();
