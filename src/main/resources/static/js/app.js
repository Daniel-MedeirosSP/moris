(function () {
  const form      = document.getElementById("chatForm");
  const promptEl  = document.getElementById("prompt");
  const thread    = document.getElementById("thread");
  const inner     = document.getElementById("threadInner");
  const historyUl = document.getElementById("historyList");
  const roomTitle = document.getElementById("roomTitle");
  const shareBtn  = document.getElementById("shareChatBtn");
  const newBtn    = document.getElementById("newChatBtn");
  const TPL       = document.getElementById("historyItemTemplate");

  const SKEY = "moris:sessions:v6";
  let sessions = load(); if (!sessions.items) sessions.items = [];
  if (!sessions.currentId) seed();

  function load(){ try { return JSON.parse(localStorage.getItem(SKEY)) || {}; } catch{ return {}; } }
  function save(){ localStorage.setItem(SKEY, JSON.stringify(sessions)); }

  function seed(){
    const id = "s"+Date.now();
    sessions.items = [{
      id, title: "Novo chat",
      messages: [{ role:"bot", html:"Olá! Sou o Moris 🤖. Como posso te ajudar?" }]
    }];
    sessions.currentId = id; save();
  }
  function current(){ return sessions.items.find(s => s.id === sessions.currentId) || sessions.items[0]; }
  function setCurrent(id){ sessions.currentId = id; save(); }

  function escapeHtml(s){
    return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/\\"/g,"&quot;")
      .replace(/'/g,"&#039;").replace(/\n/g,"<br>");
  }
  function plain(s){ return (s||"").replace(/<br>/g,"\n").replace(/<[^>]+>/g,""); }
  function scrollBottom(){ thread.scrollTop = thread.scrollHeight + 9999; }

  function row(role, html, typing=false){
    const el = document.createElement("div");
    el.className = "msg";
    const isUser = role === "user";
    const avatar = isUser
      ? `<div class="avatar avatar-user"><i class="bi bi-person"></i></div>`
      : `<div class="avatar avatar-bot"><i class="bi bi-robot"></i></div>`;
    const content = typing
      ? `<div class="bubble bubble-bot"><span class="typing"><i class="bi bi-cpu"></i> <span>Pensando…</span><span class="dots"><span></span><span></span><span></span></span></span></div>`
      : `<div class="bubble ${isUser?"bubble-user":"bubble-bot"}">${html}</div>`;
    el.innerHTML = avatar + content;
    if (typing) el.dataset.typing = "true";
    return el;
  }

  function renderThread(){
    const s = current();
    inner.innerHTML = "";
    s.messages.forEach(m => inner.appendChild(row(m.role, m.html)));
    roomTitle.textContent = s.title || "Chat atual";
    scrollBottom();
  }
  function renderHistory(){
    historyUl.innerHTML = "";
    const cur = current();
    sessions.items.forEach(s => {
      const frag = TPL.content.cloneNode(true);
      const wrap = frag.querySelector(".history-item");
      wrap.dataset.id = s.id;
      if (s.id === cur.id) wrap.classList.add("active");
      const firstUser = s.messages.find(m => m.role==="user")?.html || "Novo chat";
      const lastBot   = [...s.messages].reverse().find(m => m.role==="bot")?.html || "—";
      frag.querySelector(".history-title").textContent = plain(firstUser).slice(0,42) + (plain(firstUser).length>42?"…":"");
      frag.querySelector(".history-subtitle").textContent = plain(lastBot).slice(0,56) + (plain(lastBot).length>56?"…":"");
      historyUl.appendChild(frag);
    });
  }
  function render(){ renderThread(); renderHistory(); }

  function add(role, html){ const s = current(); s.messages.push({ role, html, ts: Date.now() }); save(); }
  function setTitleOnFirstUser(text){
    const s = current(); if (!s.messages.some(m => m.role==="user")) { s.title = (text||"Novo chat").slice(0,64); save(); }
  }

  function buildText(s){
    const lines = [`${s.title || "Conversa"}\n`];
    s.messages.forEach(m => { lines.push((m.role==="user" ? "Você: " : "Moris: ") + plain(m.html)); });
    return lines.join("\n");
  }
  function shareWhatsApp(sess){
    const text = buildText(sess);
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const url = isMobile
      ? `https://wa.me/?text=${encodeURIComponent(text)}`
      : `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener");
  }

 // ===== INTEGRAÇÃO COM BACKEND =====
 async function askBackend(message){
   // Chama o backend real
   const res = await fetch("/chat", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ message, sessionId: sessions.currentId })
   });
   if (!res.ok) throw new Error("HTTP " + res.status);
   const data = await res.json(); // { answer: "<p>...</p>" } ou { text: "..." }
   return data.answer || escapeHtml(data.text || "");
 }

 form.addEventListener("submit", async (e)=>{
   e.preventDefault();
   const text = promptEl.value.trim(); if (!text) return;
   const html = escapeHtml(text);
   setTitleOnFirstUser(text);
   add("user", html);
   promptEl.value = ""; render();

   const thinking = row("bot","",true); inner.appendChild(thinking); scrollBottom();

   try {
     const backendHtml = await askBackend(text); // [BACKEND]
     inner.removeChild(thinking);
     add("bot", backendHtml || "(sem resposta)"); // resposta REAL do backend
   } catch {
     inner.removeChild(thinking);
     add("bot", '<span class="text-danger">Erro ao obter resposta.</span>');
   } finally {
     render();
   }
 });

 document.getElementById("clearBtn").addEventListener("click", ()=>{
   promptEl.value = ""; promptEl.focus();
 });

 newBtn.addEventListener("click", ()=>{
   const id = "s"+Date.now();
   sessions.items.unshift({
     id, title:"Novo chat",
     messages:[{ role:"bot", html:"Olá! Sou o Moris 🤖. Como posso te ajudar?" }]
   });
   sessions.currentId = id; save(); render();
 });

 historyUl.addEventListener("click",(e)=>{
   const item = e.target.closest(".history-item"); if (!item) return;
   const id = item.dataset.id;
   const sess = sessions.items.find(s=>s.id===id);

   if (e.target.closest(".history-delete")) {
     sessions.items = sessions.items.filter(s => s.id !== id);
     if (sessions.currentId === id) {
       sessions.currentId = sessions.items[0]?.id || null;
       if (!sessions.currentId) seed();
     }
     save(); render(); return;
   }

   if (e.target.closest(".history-open")) { setCurrent(id); render(); }
 });

 promptEl.addEventListener("keydown",(e)=>{
   if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
 });

 shareBtn.addEventListener("click", ()=> shareWhatsApp(current()));

 render();
 })();
