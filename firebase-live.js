import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getDatabase, ref, set, get, onValue, serverTimestamp, update } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";
const firebaseConfig = {
 apiKey:"AIzaSyDvyzV-iQ3GtTaNJ_lpVFApWwLG3ipoC7g",
 authDomain:"hpdq-quiz.firebaseapp.com",
 databaseURL:"https://hpdq-quiz-default-rtdb.asia-southeast1.firebasedatabase.app",
 projectId:"hpdq-quiz", storageBucket:"hpdq-quiz.firebasestorage.app",
 messagingSenderId:"767485831120", appId:"1:767485831120:web:c28d97d45efc1ec60efbd5",
 measurementId:"G-N3T7TNRT64"
};
const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getDatabase(app);
let authReady;
async function ensureAuth(){if(!authReady)authReady=signInAnonymously(auth).then(x=>x.user);return authReady}
export const HPDQFirebase={
 async createRoom(room){const u=await ensureAuth();await set(ref(db,`rooms/${room.code}`),{name:room.name,ownerUid:u.uid,started:false,createdAt:serverTimestamp(),participants:{}})},
 async joinRoom(code,name){const u=await ensureAuth(),r=ref(db,`rooms/${code}`),s=await get(r);if(!s.exists())throw Error("Mã phòng không tồn tại hoặc đã đóng");if(s.child("started").val())throw Error("Cuộc thi đã bắt đầu");if(s.child("participants").numChildren()>=300&&!s.child(`participants/${u.uid}`).exists())throw Error("Phòng đã đủ 300 người");await set(ref(db,`rooms/${code}/participants/${u.uid}`),{name,joinedAt:serverTimestamp()})},
 async setStarted(code,started){await ensureAuth();await update(ref(db,`rooms/${code}`),{started})},
 watchRoom(code,callback,onError=console.error){ensureAuth().then(()=>onValue(ref(db,`rooms/${code}`),s=>{if(s.exists())callback(s.val());else onError(new Error("Phòng không còn tồn tại"))},onError)).catch(onError)}
};