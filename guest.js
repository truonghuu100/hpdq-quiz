import { HPDQFirebase } from "./firebase-live.js";
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const initialCode=(params.get("room")||"").replace(/\D/g,"").slice(0,6);
$("room-code").value=initialCode;
if(initialCode){$("room-code").readOnly=true;$("intro").textContent="Bạn được mời tham gia phòng "+initialCode+". Nhập họ tên để vào phòng chờ."}
let joined=false,lastQuestion="",lastStatus="",answerBusy=false,questionStartedAt=0,guestClock=null;
function drawTimer(q){
 if(guestClock)clearInterval(guestClock);
 const tick=()=>{
  const el=$("countdown");if(!el)return;
  const left=Math.max(0,Number(q.seconds||20)-Math.floor((Date.now()-questionStartedAt)/1000));
  el.textContent=left+" giây";el.classList.toggle("urgent",left<=5);
 };
 tick();guestClock=setInterval(tick,250);
}
function renderQuestion(data){
 const q=data.question;if(!q)return;
 lastQuestion=String(q.number||1);lastStatus="question";questionStartedAt=Number(data.questionStartedAt||Date.now());
 $("title").textContent="Câu hỏi "+lastQuestion;$("intro").textContent=q.text;$("message").textContent="Chọn một đáp án để gửi câu trả lời.";
 let timer=$("countdown");if(!timer){timer=document.createElement("div");timer.id="countdown";timer.className="guest-countdown";$("guest-card").insertBefore(timer,$("message"));}
 drawTimer(q);
 const old=$("answer-options");if(old)old.remove();
 const box=document.createElement("div");box.id="answer-options";box.className="answer-options";
 (q.options||[]).forEach((opt,i)=>{
  const b=document.createElement("button");b.type="button";b.className="answer-option";b.textContent=("ABCD"[i]||"")+" · "+opt;
  b.addEventListener("click",async()=>{
   if(answerBusy||box.dataset.submitted)return;answerBusy=true;
   [...box.querySelectorAll("button")].forEach(x=>x.disabled=true);b.classList.add("selected");
   try{await HPDQFirebase.answerQuestion(initialCode||$("room-code").value.trim(),i);box.dataset.submitted="1";$("message").textContent="Đã ghi nhận câu trả lời. Vui lòng chờ Ban tổ chức công bố kết quả.";}
   catch(e){[...box.querySelectorAll("button")].forEach(x=>x.disabled=false);$("message").textContent=e.message||"Không gửi được đáp án.";}
   finally{answerBusy=false;}
  });box.append(b);
 });
 $("guest-card").append(box);$("join-form").style.display="none";
}
function showResult(data){
 if(guestClock)clearInterval(guestClock);
 const q=data.question,p=data.participant||{};
 $("countdown").textContent="Đã hết thời gian";
 $("title").textContent="Kết quả câu hỏi "+(q.number||"");$("intro").textContent=q.text||"";
 $("message").textContent=p.lastCorrect?"Xin chúc mừng bạn đã chọn đúng!":"Rất tiếc, đáp án của bạn chưa chính xác.";
 const box=$("answer-options");
 if(box)[...box.querySelectorAll("button")].forEach((b,i)=>{b.disabled=true;if(i===Number(q.correctIndex))b.classList.add("correct");if(i===Number(p.lastAnswer))b.classList.add("selected");});
}
$("join-form").addEventListener("submit",async e=>{
 e.preventDefault();if(joined)return;
 const code=$("room-code").value.trim(),name=$("full-name").value.trim();
 if(!/^\d{6}$/.test(code)){$("message").textContent="Vui lòng nhập mã phòng gồm 6 chữ số.";return}
 if(!name){$("message").textContent="Vui lòng nhập họ và tên.";return}
 $("join-btn").disabled=true;$("message").textContent="Đang kết nối phòng thi…";
 try{
  await HPDQFirebase.joinRoom(code,name);joined=true;$("title").textContent="Bạn đã vào phòng!";$("intro").textContent="Chào "+name+". Hãy giữ màn hình này để nhận câu hỏi.";$("join-form").style.display="none";$("message").textContent="✓ Tham gia thành công · Mã phòng "+code;
  HPDQFirebase.watchGuestRoom(code,data=>{
   if(data.status==="revealed"&&data.question){if(lastStatus!=="revealed")showResult(data);lastStatus="revealed";return;}
   if(data.status==="question"&&data.question){const key=String(data.question.number||1);if(key!==lastQuestion||lastStatus!=="question")renderQuestion(data);else questionStartedAt=Number(data.questionStartedAt||questionStartedAt);lastStatus="question";return;}
   if(data.status==="waiting"||!data.question){if(guestClock)clearInterval(guestClock);$("title").textContent="Đang chờ câu hỏi tiếp theo";$("intro").textContent="Ban tổ chức sẽ sớm phát câu hỏi.";$("message").textContent="Vui lòng chú ý màn hình.";const old=$("answer-options");if(old)old.remove();lastStatus="waiting";}
  },err=>{$("message").textContent=err.message||"Mất kết nối tới phòng thi."});
 }catch(err){$("join-btn").disabled=false;$("message").textContent=err.message||"Không thể tham gia phòng thi."}
});
