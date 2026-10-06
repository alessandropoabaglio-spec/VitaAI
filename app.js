const reply=document.getElementById('reply'),input=document.getElementById('prompt');
const responses=[["Cosa devo ricordare?","Per ora non hai ancora inserito ricordi. Prova: “Ricordami che i documenti dell'auto sono nel cassetto.”"],["Dove l'ho messo?","Dimmi cosa stai cercando e dove lo hai riposto: VITA lo potrà memorizzare."],["Cosa devo fare oggi?","Nella versione iniziale possiamo raccogliere attività, scadenze e appuntamenti in un'unica vista."]];
function ask(q){if(!q)return;reply.textContent="Un momento…";setTimeout(()=>{const x=responses.find(r=>q.toLowerCase().includes(r[0].split(' ')[0].toLowerCase())||q.toLowerCase()===r[0].toLowerCase());reply.textContent=x?x[1]:"Ho capito. Nella prossima versione collegheremo questa richiesta alla memoria di VITA, così potrò organizzare automaticamente quello che mi dici.";},350)}
document.getElementById('send').onclick=()=>{ask(input.value);input.value=''};
input.onkeydown=e=>{if(e.key==='Enter'){ask(input.value);input.value=''}};
document.querySelectorAll('.quick button[data-q]').forEach(b=>b.onclick=()=>ask(b.dataset.q));
document.querySelectorAll('[data-module]').forEach(a=>a.onclick=()=>ask("Apri "+a.dataset.module));
document.getElementById('mic').onclick=()=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){reply.textContent="Il riconoscimento vocale non è disponibile in questo browser.";return}const r=new SR();r.lang='it-IT';r.onresult=e=>{input.value=e.results[0][0].transcript;ask(input.value);input.value=''};r.start()};

const DB_NAME='vitaai-files',STORE='files';
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'id',autoIncrement:true});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function saveFile(file){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).add({name:file.name,type:file.type||'application/octet-stream',size:file.size,blob:file,addedAt:new Date().toISOString()});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
async function getFiles(){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function deleteFile(id){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}

const fileInput=document.getElementById('fileInput'),filePanel=document.getElementById('filePanel'),fileList=document.getElementById('fileList');
document.getElementById('addBtn').onclick=()=>fileInput.click();
document.getElementById('documentsBtn').onclick=async()=>{await renderFiles();filePanel.hidden=false};
document.getElementById('closeFiles').onclick=()=>filePanel.hidden=true;
fileInput.onchange=async e=>{
 const files=[...e.target.files]; if(!files.length)return;
 reply.textContent=files.length===1 ? "Ho aggiunto “"+files[0].name+"” ai tuoi file." : "Ho aggiunto "+files.length+" file ai tuoi documenti.";
 for(const f of files) await saveFile(f);
 e.target.value=''; await renderFiles(); filePanel.hidden=false;
};
async function renderFiles(){
 const files=await getFiles();
 if(!files.length){fileList.innerHTML='<div class="empty-files">Nessun file ancora.<br>Tocca ＋ Aggiungi per scegliere PDF, foto, documenti o altri file.</div>';return}
 fileList.innerHTML=files.sort((a,b)=>b.addedAt.localeCompare(a.addedAt)).map(f=>'<div class="file-item"><div class="file-icon">'+(f.type.startsWith('image/')?'🖼️':'📄')+'</div><div class="file-name"><b>'+escapeHtml(f.name)+'</b><small>'+formatSize(f.size)+' · '+new Date(f.addedAt).toLocaleDateString('it-IT')+'</small></div><button class="file-action" data-del="'+f.id+'">Elimina</button></div>').join('');
 fileList.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{await deleteFile(Number(b.dataset.del));renderFiles()});
}
function formatSize(n){if(n<1024)return n+' B';if(n<1048576)return (n/1024).toFixed(1)+' KB';return (n/1048576).toFixed(1)+' MB'}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}