const API = "https://trainhpdq.onrender.com/api/quiz";
let adminToken = sessionStorage.getItem("hpdqQuizAdminToken") || "";
const roomIds = new Map();
const headers = (auth=false) => ({ "Content-Type":"application/json", ...(auth && adminToken ? {Authorization:"Bearer "+adminToken} : {}) });
async function request(path, options={}) {
  const res=await fetch(API+path,{...options,headers:{...headers(!!options.auth),...(options.headers||{})}});
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error||data.message||("HTTP "+res.status));
  return data;
}
export const HPDQFirebase={
  watchAdminAuth(cb){window.addEventListener("hpdq-quiz-token",e=>{adminToken=e.detail||"";cb({user:adminToken?{username:"admin"}:null,isAdmin:!!adminToken});});cb({user:adminToken?{username:"admin"}:null,isAdmin:!!adminToken});return ()=>{};},
  async loginAdmin(username,password){
    const data=await request("/admin/login",{method:"POST",body:JSON.stringify({username,password})});
    adminToken=data.token;sessionStorage.setItem("hpdqQuizAdminToken",adminToken);
    return {uid:"admin",isAdmin:true};
  },
  async logoutAdmin(){adminToken="";sessionStorage.removeItem("hpdqQuizAdminToken");},
  async createRoom(room){
    const data=await request("/admin/rooms",{method:"POST",auth:true,body:JSON.stringify({title:room.name,rankingSettings:room.rankingSettings||{roundTop:10,finalTop:3}})});
    roomIds.set(String(data.room.code),data.room.id);
    return {id:data.room.id,code:data.room.code,name:data.room.title};
  },
  async startQuestion(code,question){
    let id=roomIds.get(String(code));
    if(!id){const rooms=await request("/admin/rooms",{auth:true});const room=rooms.rooms.find(x=>x.code===String(code));if(!room)throw new Error("Không tìm thấy phòng thi.");id=room.id;roomIds.set(String(code),id);}
    return request("/admin/rooms/"+id+"/start-question",{method:"POST",auth:true,body:JSON.stringify(question)});
  },
  async setQuestion(code,question){
    let id=roomIds.get(String(code));
    if(!id){const rooms=await request("/admin/rooms",{auth:true});const room=rooms.rooms.find(x=>x.code===String(code));if(!room)throw new Error("Không tìm thấy phòng thi.");id=room.id;roomIds.set(String(code),id);}
    return request("/admin/rooms/"+id+"/question",{method:"POST",auth:true,body:JSON.stringify(question)});
  },
  async answerQuestion(code,answerIndex){
    const saved=JSON.parse(localStorage.getItem("hpdqQuizGuest:"+code)||"null");
    if(!saved?.participantId)throw new Error("Không tìm thấy phiên tham gia.");
    return request("/room/"+encodeURIComponent(code)+"/participant/"+saved.participantId+"/answer",{method:"POST",body:JSON.stringify({answerIndex})});
  },
  async setAction(code,action){
    let id=roomIds.get(String(code));
    if(!id){const rooms=await request("/admin/rooms",{auth:true});const room=rooms.rooms.find(x=>x.code===String(code));if(!room)throw new Error("Không tìm thấy phòng thi.");id=room.id;roomIds.set(String(code),id);}
    return request("/admin/rooms/"+id+"/action",{method:"POST",auth:true,body:JSON.stringify({action})});
  },
  async setStarted(code,started){
    const rooms=await request("/admin/rooms",{auth:true});
    const room=rooms.rooms.find(x=>x.code===String(code));
    if(!room)throw new Error("Không tìm thấy phòng thi.");
    return request("/admin/rooms/"+room.id+"/action",{method:"POST",auth:true,body:JSON.stringify({action:started?"start":"stop"})});
  },
  watchRoom(code,cb,err=console.error){
    let active=true;
    let polling=false;
    const poll=async()=>{
      if(polling||!active)return;polling=true;
      try{
        let id=roomIds.get(String(code));
        if(!id){const list=await request("/admin/rooms",{auth:true});const room=list.rooms.find(x=>x.code===String(code));if(!room)throw new Error("Phòng thi không tồn tại.");id=room.id;roomIds.set(String(code),id);}
        const detail=await request("/admin/rooms/"+id,{auth:true});
        const participants={};
        (detail.participants||[]).forEach(p=>participants[p.id]=p);
        cb({started:["question","revealed"].includes(detail.room.status),status:detail.room.status,participants,room:detail.room,question:detail.room.question,questionStartedAt:detail.room.questionStartedAt});
      }catch(e){if(active)err(e);}finally{polling=false;}
    };
    poll();const timer=setInterval(()=>{if(active)poll();},1500);
    return ()=>{active=false;clearInterval(timer);};
  },
  async joinRoom(code,name){
    const data=await request("/room/"+encodeURIComponent(code)+"/join",{method:"POST",body:JSON.stringify({name})});
    localStorage.setItem("hpdqQuizGuest:"+code,JSON.stringify({participantId:data.participantId,name:data.name}));
    return data;
  },
  watchGuestRoom(code,cb,err=console.error){
    let active=true;
    const saved=JSON.parse(localStorage.getItem("hpdqQuizGuest:"+code)||"null");
    if(!saved?.participantId){err(new Error("Không tìm thấy phiên tham gia. Vui lòng vào phòng lại."));return ()=>{};}
    let polling=false;
    const poll=async()=>{
      if(polling||!active)return;polling=true;
      try{
        const data=await request("/room/"+encodeURIComponent(code)+"/participant/"+saved.participantId);
        cb({started:["question","revealed"].includes(data.room.status),status:data.room.status,question:data.question,participant:data.participant,questionStartedAt:data.room.questionStartedAt});
      }catch(e){if(active)err(e);}finally{polling=false;}
    };
    poll();const timer=setInterval(()=>{if(active)poll();},1500);
    return ()=>{active=false;clearInterval(timer);};
  }
};
