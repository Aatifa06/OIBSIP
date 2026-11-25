const KEY="focusflow_data_v2";
const quotes=[
"Progress is still progress, even when it feels small.",
"You do not need a perfect day. You need one meaningful step.",
"Your future self is built by what you do today.",
"Consistency quietly creates extraordinary results.",
"Start where you are. Use what you have. Keep going.",
"One focused hour can change the direction of a day.",
"Dreams become plans when you give them a little action."
];
const todayKey=()=>new Date().toISOString().slice(0,10);
const defaultData={tasks:[],dreams:["Become the best version of myself"],habits:["Drink enough water","Read / learn something","Practice coding"],habitDates:{},streak:0,lastActive:null,quoteIndex:0};
let data=load();let currentFilter="all";let timerSeconds=1500,timerRunning=false,timerInterval=null;

function load(){try{return {...defaultData,...JSON.parse(localStorage.getItem(KEY))}}catch{return {...defaultData}}}
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function esc(s){const d=document.createElement("div");d.textContent=s;return d.innerHTML}
function dateFmt(ts){return new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(ts))}
function activeDay(){if(data.lastActive===todayKey())return;const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);const y=yesterday.toISOString().slice(0,10);data.streak=data.lastActive===y?data.streak+1:1;data.lastActive=todayKey();save()}
function render(){
 const pending=data.tasks.filter(t=>!t.done),done=data.tasks.filter(t=>t.done);
 const percent=data.tasks.length?Math.round(done.length/data.tasks.length*100):0;
 document.getElementById("progressPercent").textContent=percent+"%";document.getElementById("progressNumber").textContent=done.length;
 document.getElementById("progressFill").style.width=percent+"%";document.getElementById("doneMeta").textContent=done.length+" completed";document.getElementById("pendingMeta").textContent=pending.length+" pending";
 document.getElementById("streakCount").textContent=(data.streak||0)+" day streak";document.getElementById("taskCount").textContent=data.tasks.length+" task"+(data.tasks.length===1?"":"s");
 let list=data.tasks.filter(t=>currentFilter==="all"||currentFilter==="done"&&t.done||currentFilter!=="done"&&t.priority===currentFilter);
 const q=document.getElementById("searchInput").value.trim().toLowerCase();if(q)list=list.filter(t=>t.text.toLowerCase().includes(q));
 document.getElementById("taskList").innerHTML=list.length?list.map(taskHTML).join(""):'<div class="empty"><b>No tasks found</b>Try adding a task or changing your filter.</div>';
 document.getElementById("dreamList").innerHTML=data.dreams.length?data.dreams.map((d,i)=>`<div class="dream-item"><i class="dream-dot"></i><span>${esc(d)}</span><div class="item-actions"><button data-dream-edit="${i}">✎</button><button data-dream-delete="${i}">×</button></div></div>`):'<div class="empty">Your dreams belong here ✨</div>';
 const doneHabits=data.habitDates[todayKey()]||[];
 document.getElementById("habitList").innerHTML=data.habits.length?data.habits.map((h,i)=>{let yes=doneHabits.includes(i);return `<div class="habit-item ${yes?"done":""}"><button class="habit-check" data-habit-toggle="${i}">${yes?"✓":""}</button><span>${esc(h)}</span><div class="item-actions"><button data-habit-edit="${i}">✎</button><button data-habit-delete="${i}">×</button></div></div>`}).join(""):'<div class="empty">Add a tiny ritual 🌱</div>';
 document.getElementById("quoteText").textContent=quotes[data.quoteIndex%quotes.length];
}
function taskHTML(t){return `<div class="task-card ${t.done?"done":""}" data-id="${t.id}"><button class="check ${t.done?"done":""}" data-toggle>${t.done?"✓":""}</button><div class="task-info"><div class="task-name">${esc(t.text)}<span class="priority ${t.priority}">${t.priority}</span></div><div class="task-time">${t.done?"Completed":"Added"} ${dateFmt(t.doneAt||t.createdAt)}</div></div><div class="task-actions"><button data-edit>Edit</button><button class="delete" data-delete>Delete</button></div></div>`}
document.getElementById("taskForm").addEventListener("submit",e=>{e.preventDefault();const input=document.getElementById("taskInput"),text=input.value.trim();if(!text){toast("Write a task first.");return}activeDay();data.tasks.unshift({id:Date.now().toString(),text,priority:document.getElementById("priorityInput").value,done:false,createdAt:Date.now(),doneAt:null});save();input.value="";render();toast("Task added — you've got this! ✨")});
document.getElementById("taskList").addEventListener("click",e=>{const card=e.target.closest(".task-card");if(!card)return;const t=data.tasks.find(x=>x.id===card.dataset.id);if(!t)return;if(e.target.closest("[data-toggle]")){activeDay();t.done=!t.done;t.doneAt=t.done?Date.now():null;save();render();if(t.done){confetti();toast("Completed! Keep that momentum 🔥")}}else if(e.target.closest("[data-delete]")){data.tasks=data.tasks.filter(x=>x.id!==t.id);save();render();toast("Task removed.")}else if(e.target.closest("[data-edit]")){openModal("EDIT TASK","Edit your task",t.text,v=>{if(v){t.text=v;save();render();toast("Task updated.")}})}});
document.querySelectorAll(".filter").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");currentFilter=b.dataset.filter;render()}));
document.getElementById("searchInput").addEventListener("input",render);
document.getElementById("quoteBtn").addEventListener("click",nextQuote);document.getElementById("nextQuote").addEventListener("click",nextQuote);
function nextQuote(){data.quoteIndex=(data.quoteIndex+1)%quotes.length;save();render()}
document.getElementById("addDream").addEventListener("click",()=>openModal("DREAM BOARD","Add a dream or goal","",v=>{if(v){data.dreams.push(v);save();render();toast("Dream added to your board ☁️")}}));
document.getElementById("dreamList").addEventListener("click",e=>{let i=e.target.dataset.dreamEdit;if(i!==undefined)openModal("DREAM BOARD","Edit your dream",data.dreams[i],v=>{if(v){data.dreams[i]=v;save();render()}});i=e.target.dataset.dreamDelete;if(i!==undefined){data.dreams.splice(i,1);save();render()}});
document.getElementById("addHabit").addEventListener("click",()=>openModal("HABIT GARDEN","Add a daily habit","",v=>{if(v){data.habits.push(v);save();render();toast("Habit planted 🌱")}}));
document.getElementById("habitList").addEventListener("click",e=>{let i=e.target.dataset.habitToggle;if(i!==undefined){let arr=data.habitDates[todayKey()]||[];i=Number(i);arr=arr.includes(i)?arr.filter(x=>x!==i):[...arr,i];data.habitDates[todayKey()]=arr;activeDay();save();render()}i=e.target.dataset.habitEdit;if(i!==undefined)openModal("HABIT GARDEN","Edit habit",data.habits[i],v=>{if(v){data.habits[i]=v;save();render()}});i=e.target.dataset.habitDelete;if(i!==undefined){data.habits.splice(i,1);save();render()}});
let modalSaveFn=null;
function openModal(label,title,value,fn){document.getElementById("modalEyebrow").textContent=label;document.getElementById("modalTitle").textContent=title;document.getElementById("modalInput").value=value;document.getElementById("modal").classList.remove("hidden");modalSaveFn=fn;setTimeout(()=>document.getElementById("modalInput").focus(),50)}
function closeModal(){document.getElementById("modal").classList.add("hidden");modalSaveFn=null}
document.getElementById("modalSave").addEventListener("click",()=>{const v=document.getElementById("modalInput").value.trim();if(!v){toast("Please enter something.");return}if(modalSaveFn)modalSaveFn(v);closeModal()});document.getElementById("modalCancel").addEventListener("click",closeModal);document.getElementById("modalClose").addEventListener("click",closeModal);document.getElementById("modalInput").addEventListener("keydown",e=>{if(e.key==="Enter")document.getElementById("modalSave").click();if(e.key==="Escape")closeModal()});
function toast(msg){const el=document.getElementById("toast");el.textContent=msg;el.classList.add("show");clearTimeout(window.toastT);window.toastT=setTimeout(()=>el.classList.remove("show"),2200)}
function confetti(){const box=document.getElementById("confetti");box.innerHTML="";const symbols=["✦","•","◆","✧"];for(let i=0;i<48;i++){const p=document.createElement("i");p.className="piece";p.textContent=symbols[i%symbols.length];p.style.left=Math.random()*100+"%";p.style.fontSize=(7+Math.random()*8)+"px";p.style.animationDelay=Math.random()*.35+"s";p.style.color=["#7468f2","#e997c0","#55b981","#e7ad4b","#fff"][i%5];box.appendChild(p)}setTimeout(()=>box.innerHTML="",1700)}
function updateTimer(){let m=Math.floor(timerSeconds/60),s=timerSeconds%60;document.getElementById("timerDisplay").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
document.getElementById("timerStart").addEventListener("click",()=>{if(timerRunning){clearInterval(timerInterval);timerRunning=false;document.getElementById("timerStart").textContent="Resume Focus";document.getElementById("timerStatus").textContent="PAUSED";return}timerRunning=true;document.getElementById("timerStart").textContent="Pause";document.getElementById("timerStatus").textContent="FOCUSING";timerInterval=setInterval(()=>{timerSeconds--;updateTimer();if(timerSeconds<=0){clearInterval(timerInterval);timerRunning=false;timerSeconds=1500;document.getElementById("timerStart").textContent="Start Focus";document.getElementById("timerStatus").textContent="COMPLETE";confetti();toast("Focus session complete! 🎉")}},1000)});
document.getElementById("timerReset").addEventListener("click",()=>{clearInterval(timerInterval);timerRunning=false;timerSeconds=1500;updateTimer();document.getElementById("timerStart").textContent="Start Focus";document.getElementById("timerStatus").textContent="READY"});
document.getElementById("themeBtn").addEventListener("click",()=>document.body.classList.toggle("dark"));
document.getElementById("enterBtn").addEventListener("click",()=>document.getElementById("welcome").classList.add("hide"));
document.getElementById("dateText").textContent=new Intl.DateTimeFormat("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date());
render();updateTimer();
