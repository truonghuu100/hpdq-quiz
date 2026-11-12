import { HPDQFirebase } from "./firebase-live.js";
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const initialCode=(params.get("room")||"").replace(/\D/g,"").slice(0,6);
$("room-code").value=initialCode;
if(initialCode){$("room-code").readOnly=true;$("intro").textContent="Bạn được mời tham gia phòng "+initialCode+". Nhập họ tên để vào phòng chờ."}
let joined=false,lastState="",answerBusy=false,activeQuestion=null,questionStartedAt=0,guestClock=null;
function showQuestion(data){
 const q=data.question;
 if(!q)return;
 const key=(data.status||"")+":"+(q.number||1);
 if(key===lastState)return;
 lastState=key;
 if(data.status==="revealed"){
  $("title").textContent="Đã kết thúc câu hỏi";
  $("intro").textContent="Ban tổ chức đang công bố kết quả. Vui lòng chờ câu tiếp theo.";
  $("message").textContent="Đáp án đúng: "+("ABCD"[q.correctIndex]||"");
  return;
 }
 $("title").textContent="Câu hỏi "+(q.number||1);
 $("intro").textContent=q.text;
 $("message").textContent="Chọn một đáp án để gửi câu trả lời.";
 const old=document.getElementById("answer-options");if(old)old.remove();
 const box=document.createElement("div");box.id="answer-options";box.className="answer-options";
 (q.options||[]).forEach((opt,i)=>{
  const b=document.createElement("button");b.type="button";b.className="answer-option";b.textContent=("ABCD"[i]||"")+" · "+opt;
  b.addEventListener("click",async()=>{
   if(answerBusy)return;answerBusy=true;[...box.querySelectorAll("button")].forEach(x=>x.disabled=true);
   try{const result=await HPDQFirebase.answerQuestion(initialCode||$("room-code").value.trim(),i);$("message").textContent=result.correct?"✓ Chính xác!":"Đã ghi nhận câu trả lời.";box.querySelectorAll("button")[i].classList.add("selected");}
   catch(e){$("message").textContent=e.message||"Không gửi được đáp án."}
   finally{answerBusy=false;}
  });box.append(b);
 });
 $("join-form").style.display="none";$("guest-card").append(box);
}
$("join-form").addEventListener("submit",async e=>{
 e.preventDefault();if(joined)return;
 const code=$("room-code").value.trim(),name=$("full-name").value.trim();
 if(!/^\d{6}$/.test(code)){$("message").textContent="Vui lòng nhập mã phòng gồm 6 chữ số.";return}
 if(!name){$("message").textContent="Vui lòng nhập họ và tên.";return}
 $("join-btn").disabled=true;$("message").textContent="Đang kết nối phòng thi…";
 try{
  await HPDQFirebase.joinRoom(code,name);joined=true;
  $("title").textContent="Bạn đã vào phòng!";
  $("intro").textContent="Chào "+name+". Hãy giữ màn hình này để nhận câu hỏi.";
  $("join-form").style.display="none";$("message").textContent="✓ Tham gia thành công · Mã phòng "+code;
  HPDQFirebase.watchGuestRoom(code,data=>{
   if(data.question){if(data.status!==lastState||Number(data.question.number)!==Number(activeQuestion?.number))showQuestion(data);else{questionStartedAt=Number(data.questionStartedAt||questionStartedAt);}}
   else if(data.status==="question"){$("title").textContent="Cuộc thi đã bắt đầu";$("intro").textContent="Đang tải câu hỏi…"}
  },err=>{$("message").textContent=err.message||"Mất kết nối tới phòng thi."});
 }catch(err){$("join-btn").disabled=false;$("message").textContent=err.message||"Không thể tham gia phòng thi."}
});
