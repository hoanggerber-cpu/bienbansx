// Neon confirmation form with PDF export
const $ = (sel, root=document) => root.querySelector(sel);

const state = {
  sampleImage: "",
  patternImage: "",
  signature: ""
};

// Read & bind fields
const fields = [
  "productCodeName","customerName","sampleSewingDate","productionDate",
  "sampleEditDetails","originalForm","reportCreator","confirmationDate"
];

fields.forEach(id => {
  const el = $("#"+id);
  el.addEventListener("input", syncPreview);
});

$("#agreedToTerms").addEventListener("change", syncPreview);

// Image loaders
function bindImageFile(inputId, previewId, key){
  const input = $("#"+inputId);
  const img = $("#"+previewId);
  input.addEventListener("change", (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state[key] = reader.result;
      img.src = state[key];
      syncPreview();
    };
    reader.readAsDataURL(file);
  });
}

bindImageFile("sampleImage","sampleImagePreview","sampleImage");
bindImageFile("patternImage","patternImagePreview","patternImage");

// Signature pad (simple)
const canvas = $("#signaturePad");
const ctx = canvas.getContext("2d");
ctx.strokeStyle = "#00f2ff";
ctx.lineWidth = 2.2;
let drawing = false;
canvas.addEventListener("pointerdown", (e)=>{ drawing=true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); });
canvas.addEventListener("pointermove", (e)=>{
  if(!drawing) return;
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
});
canvas.addEventListener("pointerup", ()=>{
  drawing=false;
  state.signature = canvas.toDataURL("image/png");
  $("#signaturePreview").src = state.signature;
  syncPreview();
});
$("#clearSig").addEventListener("click", ()=>{
  ctx.clearRect(0,0,canvas.width,canvas.height);
  state.signature = "";
  $("#signaturePreview").removeAttribute("src");
  syncPreview();
});

// Preview binding
function syncPreview(){
  fields.forEach(id => { $(`[data-r="${id}"]`).textContent = $("#"+id).value || ""; });
  $(`[data-r="agreedToTerms"]`).textContent = $("#agreedToTerms").checked ? "Đã xác nhận" : "Chưa xác nhận";
  $(`[data-r="today"]`).textContent = new Date().toLocaleDateString("vi-VN");
  // images
  const imgKeys = ["sampleImage","patternImage","signature"];
  imgKeys.forEach(k => {
    const dst = $(`[data-rimg="${k}"]`);
    if(state[k]) dst.src = state[k]; else dst.removeAttribute("src");
  });
}
syncPreview();

// Save to LocalStorage
function currentData(){
  const obj = {};
  fields.forEach(id => obj[id] = $("#"+id).value || "");
  obj.agreedToTerms = $("#agreedToTerms").checked;
  obj.sampleImage = state.sampleImage;
  obj.patternImage = state.patternImage;
  obj.signature = state.signature;
  return obj;
}

$("#saveBtn").addEventListener("click", ()=>{
  const data = currentData();
  localStorage.setItem("bienban_neon_last", JSON.stringify(data));
  alert("Đã lưu vào trình duyệt (localStorage).");
});

// Reset
$("#resetBtn").addEventListener("click", ()=>{
  if(!confirm("Xoá toàn bộ dữ liệu trên biểu mẫu?")) return;
  fields.forEach(id => $("#"+id).value = "");
  $("#agreedToTerms").checked = false;
  state.sampleImage = ""; state.patternImage = ""; state.signature = "";
  $("#sampleImagePreview").removeAttribute("src");
  $("#patternImagePreview").removeAttribute("src");
  $("#signaturePreview").removeAttribute("src");
  const ctx = $("#signaturePad").getContext("2d");
  ctx.clearRect(0,0,canvas.width,canvas.height);
  syncPreview();
});

// Load previous (if any)
try{
  const last = JSON.parse(localStorage.getItem("bienban_neon_last")||"null");
  if(last){
    fields.forEach(id => { if(last[id]!==undefined) $("#"+id).value = last[id]; });
    $("#agreedToTerms").checked = !!last.agreedToTerms;
    if(last.sampleImage){ state.sampleImage = last.sampleImage; $("#sampleImagePreview").src = last.sampleImage; }
    if(last.patternImage){ state.patternImage = last.patternImage; $("#patternImagePreview").src = last.patternImage; }
    if(last.signature){ state.signature = last.signature; $("#signaturePreview").src = last.signature; }
    syncPreview();
  }
}catch(e){}

// Export PDF
$("#exportPDF").addEventListener("click", async ()=>{
  // Make sure preview is fresh
  syncPreview();
  const area = $("#printArea");
  const { jsPDF } = window.jspdf;

  // Render to canvas
  const canvas = await html2canvas(area, { scale: 2, backgroundColor: "#ffffff" });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");

  // Fit width to A4 (210mm - margins). We'll add small margins.
  const margin = 8;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const printableWidth = pageWidth - margin * 2;
  const imgWidth = printableWidth;
  const imgHeight = canvas.height * imgWidth / canvas.width;

  let y = margin;
  if(imgHeight <= pageHeight - margin*2){
    pdf.addImage(imgData, "PNG", margin, y, imgWidth, imgHeight, undefined, "FAST");
  }else{
    // Multi-page
    let heightLeft = imgHeight;
    let position = margin;
    while (heightLeft > 0){
      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= (pageHeight - margin*2);
      if (heightLeft > 0){
        pdf.addPage();
        position = margin - heightLeft; // shift up for next segment
      }
    }
  }

  const code = ($("#productCodeName").value || "MAHANG").replace(/\s+/g,"_");
  pdf.save(`BienBan_${code}.pdf`);
});
