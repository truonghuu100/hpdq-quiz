const $ = (s, root=document) => root.querySelector(s);
const page = $("#page");
const state = {
  view:"dashboard",
  questions:[
    {id:1,category:"An toàn lao động",level:"Dễ",text:"Trước khi tiến hành sửa chữa thiết bị, người lao động cần thực hiện bước nào?",options:["Thực hiện LOTO và xác nhận hết năng lượng","Chỉ cần thông báo cho đồng nghiệp","Bắt đầu ngay khi thiết bị dừng","Đeo găng tay là đủ"],correct:0,seconds:20},
    {id:2,category:"5S",level:"Dễ",text:"Mục tiêu chính của hoạt động 5S tại nơi làm việc là gì?",options:["Tăng số lượng biểu mẫu","Sàng lọc, sắp xếp, sạch sẽ, chuẩn hóa và duy trì","Chỉ tập trung vệ sinh cuối ca","Thay thế toàn bộ quy trình"],correct:1,seconds:20}
  ],
  quizzes:[{id:1,name:"Kiểm tra kiến thức an toàn – Demo",count:2,updated:"12/11/2026"}],
  room:null,
  demoParticipants:["Nguyễn Văn An","Trần Thị Bình","Lê Văn Cường"],
  currentQuestion:0,
  answers:{},
  started:false,
  revealed:false
};
const labels={dashboard:"Tổng quan",questions:"Ngân hàng câu hỏi",quizzes:"Bộ đề thi",rooms:"Tổ chức cuộc thi",results:"Kết quả & báo cáo"};
function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)}
function stat(label,value,note,icon){return `<div class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></div>`}
function head(eyebrow,title,sub,action=""){return `<div class="page-head"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p class="subtitle">${sub}</p></div>${action}</div>`}
function render(){
  $("#crumb").textContent=labels[state.view];
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===state.view));
  if(state.view==="dashboard") page.innerHTML=dashboard();
  if(state.view==="questions") page.innerHTML=questions();
  if(state.view==="quizzes") page.innerHTML=quizzes();
  if(state.view==="rooms") page.innerHTML=rooms();
  if(state.view==="results") page.innerHTML=results();
  bindPage();
}
function dashboard(){return `
  ${head("TRUNG TÂM ĐIỀU KHIỂN","Tổng quan","Theo dõi hoạt động tổ chức thi trắc nghiệm HPDQ Quiz.",'<button class="btn primary" data-action="new-room">＋ Tạo cuộc thi mới</button>')}
  <div class="cards">${stat("NGÂN HÀNG CÂU HỎI",state.questions.length,"Câu hỏi đã tạo","▤")}${stat("BỘ ĐỀ THI",state.quizzes.length,"Bộ đề sẵn sàng","☷")}${stat("PHÒNG ĐANG MỞ",state.room?1:0,"Phòng thi trực tiếp","◉")}${stat("SỨC CHỨA MỖI PHÒNG","300","Học viên tối đa","♙")}</div>
  <div class="dashboard-grid"><div class="panel"><div class="panel-title"><h3>Hoạt động gần đây</h3><small>Trạng thái hệ thống</small></div><div class="empty"><strong>${state.room?"Đã khởi tạo phòng thi":"Chưa có cuộc thi nào được tổ chức"}</strong>${state.room?"Phòng "+state.room.code+" · "+state.room.name:"Tạo phòng thi đầu tiên để mời học viên tham gia bằng QR Code."}</div><div style="margin-top:15px"><button class="btn secondary" data-view="rooms">Đi đến tổ chức cuộc thi →</button></div></div><div class="panel"><div class="panel-title"><h3>Quy trình nhanh</h3><small>Live Quiz</small></div><div class="feature-list"><div class="feature"><div class="feature-icon">＋</div><div><b>1. Tạo bộ đề</b><small>Chuẩn bị câu hỏi, đáp án đúng và thời gian trả lời.</small></div></div><div class="feature"><div class="feature-icon">▦</div><div><b>2. Mở phòng & chiếu QR</b><small>Học viên quét mã, nhập họ tên và chờ Admin.</small></div></div><div class="feature"><div class="feature-icon">▶</div><div><b>3. Điều khiển cuộc thi</b><small>Admin bắt đầu, công bố đáp án sau từng câu.</small></div></div><div class="feature"><div class="feature-icon">🏆</div><div><b>4. Tổng kết</b><small>Xếp hạng theo điểm, số câu đúng và tốc độ.</small></div></div></div></div></div>`}
function questions(){return `
  ${head("NỘI DUNG ĐÀO TẠO","Ngân hàng câu hỏi","Tạo và quản lý câu hỏi dùng chung cho các bộ đề.",'<button class="btn primary" data-action="new-question">＋ Thêm câu hỏi</button>')}
  <div class="toolbar"><input class="field" id="questionSearch" placeholder="Tìm theo nội dung câu hỏi..."><select id="categoryFilter"><option value="">Tất cả lĩnh vực</option><option>An toàn lao động</option><option>5S</option><option>Kỹ thuật</option></select><button class="btn secondary" data-action="import-questions">⇧ Nhập Excel (sắp triển khai)</button></div>
  <div class="table-wrap"><table><thead><tr><th>Câu hỏi</th><th>Lĩnh vực</th><th>Mức độ</th><th>Thời gian</th><th>Thao tác</th></tr></thead><tbody id="questionRows">${state.questions.map(q=>`<tr><td><b>${escapeHtml(q.text)}</b><div class="muted">ID: Q-${q.id}</div></td><td>${q.category}</td><td><span class="tag">${q.level}</span></td><td>${q.seconds} giây</td><td><button class="btn secondary" data-action="edit-question" data-id="${q.id}">Sửa</button></td></tr>`).join("")}</tbody></table></div>`}
function quizzes(){return `
  ${head("THƯ VIỆN ĐỀ THI","Bộ đề thi","Tập hợp câu hỏi thành các bộ đề để sử dụng khi mở phòng.",'<button class="btn primary" data-action="new-quiz">＋ Tạo bộ đề</button>')}
  <div class="table-wrap"><table><thead><tr><th>Tên bộ đề</th><th>Số câu hỏi</th><th>Cập nhật</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${state.quizzes.map(q=>`<tr><td><b>${escapeHtml(q.name)}</b></td><td>${q.count}</td><td>${q.updated}</td><td><span class="tag">Sẵn sàng</span></td><td><button class="btn secondary" data-action="use-quiz" data-id="${q.id}">Tổ chức thi</button></td></tr>`).join("")}</tbody></table></div>
  <p class="subtitle" style="margin-top:13px">Bản khởi tạo đang sử dụng dữ liệu mẫu trên trình duyệt. Chưa đồng bộ dữ liệu giữa các thiết bị.</p>`}
function rooms(){
 if(!state.room)return `
  ${head("LIVE QUIZ","Tổ chức cuộc thi","Tạo phòng thi trực tiếp, mời học viên tham gia bằng QR Code.",'<button class="btn primary" data-action="new-room">＋ Tạo phòng thi</button>')}
  <div class="panel"><div class="empty"><strong>Chưa có phòng thi đang hoạt động</strong>Chọn “Tạo phòng thi” để khởi tạo cuộc thi trực tiếp.</div></div>`;
 const r=state.room, joinUrl=location.origin+location.pathname.replace(/index\.html$/,"")+"?join="+r.code;
 return `
 ${head("PHÒNG THI TRỰC TIẾP",escapeHtml(r.name),"Mã phòng · "+r.code,'<button class="btn secondary" data-action="end-room">Kết thúc phòng</button>')}
 <div class="room-card"><div><div class="eyebrow" style="color:#b8d9c1">MÃ THAM GIA</div><div class="room-code">${r.code}</div><p>Học viên quét QR hoặc truy cập đường dẫn để nhập họ tên.</p></div><div style="text-align:center"><div id="qr" style="background:white;padding:9px;border-radius:9px;width:126px;height:126px;display:grid;place-items:center;color:#173c28;font-size:10px">QR đang tạo...</div><small style="display:block;margin-top:7px;color:#cce3d2">Quét để tham gia</small></div></div>
 <div class="room-layout"><div class="panel"><div class="panel-title"><h3>Điều khiển cuộc thi</h3><span class="tag ${state.started?"wait":""}">${state.started?"Đang diễn ra":"Đang chờ bắt đầu"}</span></div><div class="feature-list"><div class="feature"><div class="feature-icon">👥</div><div><b>${state.demoParticipants.length} / 300 học viên</b><small>Danh sách người tham gia (dữ liệu minh họa ở chế độ xem trước).</small></div></div><div class="feature"><div class="feature-icon">☷</div><div><b>${state.questions.length} câu hỏi</b><small>Bộ đề: ${escapeHtml(r.quizName)}</small></div></div></div><div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:20px">${!state.started?'<button class="btn primary" data-action="start-quiz">▶ Bắt đầu cuộc thi</button>':'<button class="btn secondary" data-action="next-question">Câu tiếp theo →</button><button class="btn lime" data-action="show-leaderboard">🏆 Bảng xếp hạng</button>'}<button class="btn secondary" data-action="open-projector">▣ Màn hình trình chiếu</button></div><div class="subtitle" style="margin-top:13px">Lưu ý: nút điều khiển hiện là bản mô phỏng giao diện, chưa truyền trạng thái tới thiết bị học viên.</div></div><div class="panel"><div class="panel-title"><h3>Học viên tham gia</h3><small>Danh sách minh họa</small></div><div class="participant-list">${state.demoParticipants.map((n,i)=>`<div class="participant"><span>${i+1}. ${escapeHtml(n)}</span><span class="tag">${state.started?"Đã vào thi":"Đang chờ"}</span></div>`).join("")}</div></div></div>`;
}
function results(){return `${head("PHÂN TÍCH & ĐÁNH GIÁ","Kết quả & báo cáo","Theo dõi kết quả các cuộc thi và xuất dữ liệu tổng hợp.")}<div class="panel"><div class="empty"><strong>Chưa có dữ liệu kết quả</strong>Kết quả sẽ xuất hiện sau khi hoàn thiện kết nối máy chủ thời gian thực và tổ chức cuộc thi thực tế.</div></div>`}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function bindPage(){
 page.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>{state.view=b.dataset.view;render()}));
 page.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>action(b.dataset.action,b.dataset.id)));
 const search=$("#questionSearch");if(search)search.addEventListener("input",()=>{const term=search.value.toLowerCase();$("#questionRows").innerHTML=state.questions.filter(q=>q.text.toLowerCase().includes(term)).map(q=>`<tr><td><b>${escapeHtml(q.text)}</b></td><td>${q.category}</td><td>${q.level}</td><td>${q.seconds} giây</td><td>—</td></tr>`).join("")});
 const qr=$("#qr");if(qr){const img=document.createElement("img");img.alt="QR tham gia phòng";img.width=108;img.height=108;img.src="https://api.qrserver.com/v1/create-qr-code/?size=108x108&data="+encodeURIComponent(location.origin+location.pathname+"?join="+state.room.code);img.onerror=()=>qr.textContent="Không tải được QR";qr.textContent="";qr.append(img)}
}
function showModal(title,body,onConfirm){$("#modalTitle").textContent=title;$("#modalBody").innerHTML=body;const confirm=$("#modalConfirm");confirm.style.display=onConfirm?"inline-flex":"none";confirm.onclick=e=>{if(onConfirm){e.preventDefault();onConfirm()}};$("#modal").showModal()}
function action(type,id){
 if(type==="new-room"||type==="use-quiz"){
  const quiz=state.quizzes.find(q=>q.id===Number(id))||state.quizzes[0];
  showModal("Tạo phòng thi trực tiếp",`<div class="form-row"><label>Tên cuộc thi</label><input id="roomName" class="field" value="${escapeHtml(quiz?.name||"Cuộc thi HPDQ Quiz")}"></div><div class="form-row"><label>Bộ đề thi</label><select id="roomQuiz" class="field">${state.quizzes.map(q=>`<option value="${q.id}">${escapeHtml(q.name)}</option>`).join("")}</select></div><div class="form-row"><label>Sức chứa tối đa</label><input class="field" value="300 học viên" disabled></div><div class="form-row"><label>Cách tính điểm</label><input class="field" value="Trả lời đúng và nhanh được điểm cao" disabled></div>`,()=>{const name=$("#roomName").value.trim();if(!name){toast("Vui lòng nhập tên cuộc thi");return}state.room={name,code:String(Math.floor(100000+Math.random()*900000)),quizName:state.quizzes.find(q=>q.id===Number($("#roomQuiz").value))?.name||quiz.name};state.started=false;$("#modal").close();state.view="rooms";render();toast("Đã tạo phòng ở chế độ xem trước")});
 }
 if(type==="new-question")showModal("Thêm câu hỏi",`<div class="form-row"><label>Nội dung câu hỏi</label><textarea id="qText" rows="3" placeholder="Nhập nội dung câu hỏi"></textarea></div><div class="form-row"><label>Lĩnh vực</label><input id="qCat" class="field" value="An toàn lao động"></div>${[0,1,2,3].map(i=>`<div class="form-row"><label>Phương án ${"ABCD"[i]}</label><input class="field q-option" placeholder="Nhập phương án ${"ABCD"[i]}"></div>`).join("")}<div class="form-row"><label>Đáp án đúng</label><select id="qCorrect" class="field"><option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option></select></div><div class="form-row"><label>Thời gian trả lời (giây)</label><input id="qSeconds" type="number" class="field" value="20" min="5" max="120"></div>`,()=>{const text=$("#qText").value.trim(),opts=[...document.querySelectorAll(".q-option")].map(x=>x.value.trim());if(!text||opts.some(x=>!x)){toast("Vui lòng nhập câu hỏi và đủ 4 phương án");return}state.questions.push({id:Date.now(),text,category:$("#qCat").value,level:"Trung bình",options:opts,correct:Number($("#qCorrect").value),seconds:Number($("#qSeconds").value)||20});$("#modal").close();render();toast("Đã thêm câu hỏi vào bản xem trước")});
 if(type==="edit-question"){const q=state.questions.find(x=>x.id===Number(id));if(q)toast("Chức năng chỉnh sửa chi tiết sẽ được hoàn thiện ở bước tiếp theo")}
 if(type==="new-quiz")showModal("Tạo bộ đề",'<div class="form-row"><label>Tên bộ đề</label><input id="quizName" class="field" placeholder="Nhập tên bộ đề"></div><p class="subtitle">Bản đầu tiên sẽ đưa toàn bộ câu hỏi trong ngân hàng vào bộ đề.</p>',()=>{const name=$("#quizName").value.trim();if(!name){toast("Vui lòng nhập tên bộ đề");return}state.quizzes.push({id:Date.now(),name,count:state.questions.length,updated:new Date().toLocaleDateString("vi-VN")});$("#modal").close();render();toast("Đã tạo bộ đề xem trước")});
 if(type==="start-quiz"){state.started=true;state.currentQuestion=0;toast("Bản mô phỏng: cuộc thi đã bắt đầu");render()}
 if(type==="next-question"){state.currentQuestion=Math.min(state.currentQuestion+1,state.questions.length-1);toast("Đã chuyển câu trong bản mô phỏng")}
 if(type==="show-leaderboard")showModal("Bảng xếp hạng – Bản xem trước",'<div class="empty"><strong>Chưa có câu trả lời thực tế</strong>Bảng xếp hạng sẽ được tính từ dữ liệu thời gian phản hồi do máy chủ ghi nhận.</div>');
 if(type==="open-projector")window.open("?projector="+(state.room?.code||""),"_blank");
 if(type==="end-room"){state.room=null;state.started=false;render();toast("Đã đóng phòng xem trước")}
 if(type==="import-questions")toast("Chức năng nhập Excel đang nằm trong kế hoạch phát triển tiếp theo");
}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>{state.view=b.dataset.view;render();$("#sidebar").classList.remove("open")}));
$("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
$("#helpBtn").addEventListener("click",()=>showModal("Trợ giúp HPDQ Quiz",'<p style="font-size:12px;line-height:1.7;color:#53675b">Đây là bản giao diện khởi tạo. Dữ liệu hiện lưu tạm trong bộ nhớ trang và các thao tác phòng thi đang ở chế độ mô phỏng. Chưa sử dụng cho kỳ thi thật cho đến khi kết nối backend, xác thực Admin và đồng bộ thời gian thực.</p>'));
const params=new URLSearchParams(location.search);
if(params.has("join")){page.innerHTML=`<div style="max-width:480px;margin:9vh auto;background:white;border:1px solid #e7eee8;border-radius:18px;padding:30px;text-align:center"><div class="brand-mark" style="margin:auto">Q</div><h1 style="color:#17452c">Tham gia HPDQ Quiz</h1><p class="subtitle">Mã phòng: ${escapeHtml(params.get("join"))}</p><form id="joinForm"><div class="form-row" style="text-align:left"><label>Họ và tên</label><input required id="joinName" class="field" style="width:100%" placeholder="Nhập họ tên của anh/chị"></div><button class="btn primary" style="width:100%;justify-content:center">Tham gia phòng thi</button></form><div id="joinState" class="subtitle" style="margin-top:20px">Sau khi tham gia, vui lòng chờ Admin bắt đầu cuộc thi.</div></div>`;$("#joinForm").addEventListener("submit",e=>{e.preventDefault();const n=$("#joinName").value.trim();if(n){$("#joinForm").style.display="none";$("#joinState").innerHTML="<b>Xin chào "+escapeHtml(n)+"!</b><br><br>Đã ghi nhận ở giao diện minh họa. Vui lòng chờ Admin bắt đầu.";}})}
else if(params.has("projector")){document.body.innerHTML='<div style="background:#103e2a;color:white;min-height:100vh;display:grid;place-items:center;text-align:center;padding:30px"><div><div style="color:#d7ef74;font-size:14px;letter-spacing:4px">HPDQ QUIZ · LIVE</div><h1 style="font-size:clamp(32px,6vw,76px)">SẴN SÀNG CHƯA?</h1><p style="font-size:20px;color:#c1d9c8">Chờ Admin bắt đầu cuộc thi</p><h2 style="font-size:clamp(36px,8vw,90px);letter-spacing:12px;color:#e1f28b">'+escapeHtml(params.get("projector"))+'</h2></div></div>'}
else render();
