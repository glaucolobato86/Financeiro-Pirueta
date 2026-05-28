import { useState, useEffect, useMemo, useCallback } from "react";

const SUPABASE_URL = "https://qxvnpexctvbmvzmyocnm.supabase.co";
const SUPABASE_KEY = "sb_publishable_NPi6gX5WQBrduLRclb3H6w_FraikpyV";

const sb = async (path, opts = {}) => {
  const token = localStorage.getItem("sb_token");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token || SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: opts.prefer ?? "return=representation",
    },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || res.statusText);
  }
  return res.status === 204 ? null : res.json();
};

const authFetch = async (endpoint, body) => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
};

const fmt = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const CORES = ["#6366f1","#e07b54","#7b6cf0","#e0b454","#54b0e0","#34d399","#e054a0","#f87171","#a78bfa","#fbbf24"];
const inputStyle = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" };
const selectStyle = { ...inputStyle };

// ── Login / Cadastro ───────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const emailUrl = new URLSearchParams(window.location.search).get("convite") || "";
  const [email, setEmail] = useState(emailUrl);
  const [senha, setSenha] = useState("");
  const [modo, setModo] = useState(emailUrl ? "cadastro" : "login");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handle = async () => {
    setLoading(true); setErro("");
    try {
      const data = await authFetch(
        modo === "login" ? "token?grant_type=password" : "signup",
        { email, password: senha }
      );
      if (data.access_token) {
        localStorage.setItem("sb_token", data.access_token);
        localStorage.setItem("sb_user", JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setErro(data.error_description || (modo === "cadastro" ? "Verifique seu e-mail para confirmar o cadastro." : "E-mail ou senha incorretos."));
      }
    } catch { setErro("Erro de conexão."); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <div style={{ width: 400, background: "#13131a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "48px 40px" }}>
        <img src="/logo.png" alt="PRT" style={{ height: 50, marginBottom: 20, display: "block" }} />
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 28 }}>{modo === "login" ? "Entre na sua conta" : "Crie sua conta"}</div>
        {erro && <div style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f87171", marginBottom: 16 }}>{erro}</div>}
        {[["E-mail","email"],["Senha","password"]].map(([label,type],i) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</label>
            <input type={type} value={i===0?email:senha} onChange={e=>(i===0?setEmail:setSenha)(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}
              style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"11px 14px", color:"#fff", fontSize:14, outline:"none", boxSizing:"border-box" }} />
          </div>
        ))}
        <button onClick={handle} disabled={loading} style={{ width:"100%", background:loading?"rgba(99,102,241,0.5)":"#6366f1", border:"none", borderRadius:10, padding:"13px", color:"#fff", fontSize:15, fontWeight:500, cursor:"pointer", marginTop:8 }}>
          {loading ? "Aguarde..." : modo==="login" ? "Entrar →" : "Criar conta →"}
        </button>
        <div style={{ marginTop:20, textAlign:"center", fontSize:13, color:"rgba(255,255,255,0.35)" }}>
          {modo==="login" ? "Não tem conta? " : "Já tem conta? "}
          <span onClick={()=>{setModo(modo==="login"?"cadastro":"login");setErro("");}} style={{ color:"#818cf8", cursor:"pointer" }}>
            {modo==="login" ? "Cadastre-se" : "Entrar"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Criar / Entrar em empresa ──────────────────────────────────────────────────
function EmpresaSetup({ user, onEmpresa }) {
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  // Detecta e-mail do convite na URL
  const emailConvite = new URLSearchParams(window.location.search).get("convite") || "";

  const criarEmpresa = async () => {
    if (!nome.trim()) return alert("Digite o nome da empresa.");
    setLoading(true);
    try {
      const emp = await sb("empresas", { method: "POST", body: JSON.stringify({ nome: nome.trim(), criado_por: user.id }) });
      const empresa = emp[0];
      await sb("membros", { method: "POST", body: JSON.stringify({ empresa_id: empresa.id, user_id: user.id, email: user.email, nome: user.email.split("@")[0], perfil: "admin" }) });
      onEmpresa(empresa, "admin");
    } catch(e) { setErro("Erro: " + e.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <div style={{ width:440, background:"#13131a", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:"40px" }}>
        <img src="/logo.png" alt="PRT" style={{ height:44, marginBottom:16, display:"block" }} />
        <div style={{ fontSize:18, fontWeight:600, color:"#fff", marginBottom:6 }}>Configurar empresa</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:24 }}>Logado como {user.email}</div>

        {erro && <div style={{ background:"rgba(248,113,113,0.15)", border:"1px solid rgba(248,113,113,0.3)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#f87171", marginBottom:16 }}>{erro}</div>}

        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:11, color:"rgba(255,255,255,0.5)", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.07em" }}>Nome da empresa</label>
          <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: PRT Criatividade e Estratégia"
            style={{ ...inputStyle }} />
        </div>
        <button onClick={criarEmpresa} disabled={loading}
          style={{ width:"100%", background:loading?"rgba(99,102,241,0.5)":"#6366f1", border:"none", borderRadius:10, padding:"13px", color:"#fff", fontSize:14, fontWeight:500, cursor:"pointer" }}>
          {loading ? "Criando..." : "Criar empresa →"}
        </button>
        <div style={{ marginTop:16, fontSize:12, color:"rgba(255,255,255,0.25)", textAlign:"center" }}>
          Você será o administrador da empresa
        </div>
      </div>
    </div>
  );
}

// ── Componentes reutilizáveis ──────────────────────────────────────────────────
function Modal({ titulo, onClose, children }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#13131a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:18, padding:32, width:500, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ fontSize:18, fontWeight:600, color:"#fff", marginBottom:22 }}>{titulo}</div>
        {children}
      </div>
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:11, color:"rgba(255,255,255,0.5)", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</label>
      {children}
    </div>
  );
}

function BtnRow({ onCancel, onSave, loading }) {
  return (
    <div style={{ display:"flex", gap:10, marginTop:20 }}>
      <button onClick={onCancel} style={{ flex:1, padding:"11px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:13 }}>Cancelar</button>
      <button onClick={onSave} disabled={loading} style={{ flex:1, padding:"11px", borderRadius:8, border:"none", background:"#6366f1", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:500 }}>{loading?"Salvando...":"Salvar"}</button>
    </div>
  );
}

// ── Menu lateral ───────────────────────────────────────────────────────────────
const MENU = [
  { id:"dashboard", label:"Dashboard", icon:"🏠", single:true },
  { id:"financeiro", label:"Financeiro", icon:"💰", single:false,
    items:[
      { id:"lancamentos",  label:"Lançamentos",    icon:"📋" },
      { id:"contas_pagar", label:"Contas a Pagar", icon:"📅" },
    ]
  },
  { id:"contas",        label:"Contas Bancárias",  icon:"💳", single:true },
  { id:"investimentos", label:"Investimentos",     icon:"📈", single:true },
  { id:"orcamento",     label:"Orçamento",         icon:"🎯", single:true },
  { id:"relatorios",    label:"Relatórios / DRE",  icon:"📊", single:true },
  { id:"categorias",    label:"Categorias",        icon:"🏷️", single:true },
  { id:"usuarios",      label:"Usuários",          icon:"👥", single:true, apenasAdmin:true },
];

function Sidebar({ tela, setTela, user, empresa, membro, onLogout }) {
  const telaToGrupo = (t) => { for (const m of MENU) { if (!m.single && m.items?.some(i=>i.id===t)) return m.id; } return null; };
  const [abertos, setAbertos] = useState(() => { const g=telaToGrupo(tela); const init={}; MENU.forEach(m=>{ if(!m.single) init[m.id]=m.id===g; }); return init; });
  const toggle = (id) => setAbertos(prev=>({...prev,[id]:!prev[id]}));
  const isAdmin = membro?.perfil === "admin";

  return (
    <div style={{ width:230, background:"#13131a", borderRight:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", flexShrink:0, position:"sticky", top:0, height:"100vh" }}>
      <div style={{ padding:"18px 20px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <img src="/logo.png" alt="PRT" style={{ height:40, display:"block", marginBottom:8 }} />
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:500 }}>{empresa?.nome}</div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:2 }}>{user?.email}</div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:1, textTransform:"capitalize" }}>Perfil: {membro?.perfil}</div>
      </div>
      <nav style={{ flex:1, padding:"10px 10px", overflowY:"auto" }}>
        {MENU.map(m => {
          if (m.apenasAdmin && !isAdmin) return null;
          if (m.single) {
            return (
              <button key={m.id} onClick={()=>setTela(m.id)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:9, padding:"9px 11px", borderRadius:8, border:"none", background:tela===m.id?"rgba(99,102,241,0.18)":"transparent", color:tela===m.id?"#818cf8":"rgba(255,255,255,0.5)", fontSize:13, fontWeight:tela===m.id?500:400, cursor:"pointer", marginBottom:2, textAlign:"left" }}>
                <span style={{ fontSize:15 }}>{m.icon}</span>{m.label}
              </button>
            );
          }
          const estaAberto = abertos[m.id];
          const temAtivo = m.items?.some(i=>i.id===tela);
          return (
            <div key={m.id} style={{ marginBottom:2 }}>
              <button onClick={()=>toggle(m.id)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:9, padding:"8px 11px", borderRadius:8, border:"none", background:temAtivo?"rgba(99,102,241,0.08)":"transparent", color:temAtivo?"#818cf8":"rgba(255,255,255,0.4)", fontSize:12, fontWeight:500, cursor:"pointer", textAlign:"left", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                <span style={{ fontSize:13 }}>{m.icon}</span>
                <span style={{ flex:1 }}>{m.label}</span>
                <span style={{ fontSize:10, opacity:0.6 }}>{estaAberto?"▲":"▼"}</span>
              </button>
              {estaAberto && (
                <div style={{ marginLeft:10, borderLeft:"1px solid rgba(255,255,255,0.07)", paddingLeft:8, marginBottom:4 }}>
                  {m.items.map(item=>(
                    <button key={item.id} onClick={()=>setTela(item.id)}
                      style={{ width:"100%", display:"flex", alignItems:"center", gap:9, padding:"8px 10px", borderRadius:7, border:"none", background:tela===item.id?"rgba(99,102,241,0.18)":"transparent", color:tela===item.id?"#818cf8":"rgba(255,255,255,0.5)", fontSize:13, fontWeight:tela===item.id?500:400, cursor:"pointer", marginBottom:1, textAlign:"left" }}>
                      <span style={{ fontSize:14 }}>{item.icon}</span>{item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div style={{ padding:"12px 10px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={onLogout} style={{ width:"100%", display:"flex", alignItems:"center", gap:9, padding:"9px 11px", borderRadius:8, border:"none", background:"transparent", color:"rgba(255,255,255,0.35)", fontSize:13, cursor:"pointer" }}>🚪 Sair</button>
      </div>
    </div>
  );
}

// ── Upload helper ──────────────────────────────────────────────────────────────
const uploadArquivo = async (arquivo, userId) => {
  const nomeSeguro = arquivo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${Date.now()}_${nomeSeguro}`;
  const token = localStorage.getItem("sb_token");
  const up = await fetch(`${SUPABASE_URL}/storage/v1/object/anexos/${path}`, {
    method:"POST", headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${token}`, "Content-Type":arquivo.type, "x-upsert":"true" }, body:arquivo,
  });
  if (up.ok) return { url:path, nome:arquivo.name };
  return { url:null, nome:null };
};

const verAnexo = async (url, nome, setPreview) => {
  const token = localStorage.getItem("sb_token");
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/authenticated/anexos/${url}`, { headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${token}` } });
  const blob = await res.blob();
  setPreview({ url:URL.createObjectURL(blob), nome, tipo:blob.type });
};

function PreviewModal({ preview, onClose }) {
  if (!preview) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#13131a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:24, width:"80vw", maxWidth:800, maxHeight:"90vh", display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:14, color:"#fff", fontWeight:500 }}>{preview.nome}</span>
          <div style={{ display:"flex", gap:10 }}>
            <a href={preview.url} download={preview.nome} style={{ background:"#6366f1", borderRadius:7, padding:"7px 14px", color:"#fff", fontSize:12, fontWeight:500, textDecoration:"none" }}>⬇ Baixar</a>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:7, padding:"7px 12px", color:"#fff", fontSize:12, cursor:"pointer" }}>✕ Fechar</button>
          </div>
        </div>
        <div style={{ flex:1, overflow:"auto", borderRadius:8 }}>
          {preview.tipo==="application/pdf"
            ? <iframe src={preview.url} style={{ width:"100%", height:"65vh", border:"none", borderRadius:8 }} />
            : <img src={preview.url} alt={preview.nome} style={{ maxWidth:"100%", maxHeight:"65vh", display:"block", margin:"0 auto", borderRadius:8 }} />}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ lancamentos, contas, investimentos, categorias }) {
  const rec = lancamentos.filter(l=>l.tipo==="receita").reduce((s,l)=>s+Number(l.valor),0);
  const desp = lancamentos.filter(l=>l.tipo==="despesa").reduce((s,l)=>s+Number(l.valor),0);
  const saldo = contas.reduce((s,c)=>s+Number(c.saldo),0);
  const invest = investimentos.reduce((s,i)=>s+Number(i.valor_atual),0);
  const porCat = categorias.filter(c=>c.tipo==="despesa").map(cat=>({ ...cat, total:lancamentos.filter(l=>l.categoria_id===cat.id&&l.tipo==="despesa").reduce((s,l)=>s+Number(l.valor),0) })).filter(c=>c.total>0).sort((a,b)=>b.total-a.total).slice(0,6);
  const ultimos = [...lancamentos].sort((a,b)=>new Date(b.data)-new Date(a.data)).slice(0,7);
  return (
    <div>
      <div style={{ fontSize:22, fontWeight:600, color:"#fff", marginBottom:4 }}>Dashboard</div>
      <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:22 }}>Visão geral da empresa</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[["Saldo em contas",saldo,"#fff"],["Receitas",rec,"#34d399"],["Despesas",desp,"#f87171"],["Investimentos",invest,"#a78bfa"]].map(([label,value,cor])=>(
          <div key={label} style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px 18px" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>{label}</div>
            <div style={{ fontSize:20, fontWeight:600, color:cor }}>{fmt(value)}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:18 }}>
          <div style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.5)", marginBottom:14 }}>Despesas por categoria</div>
          {porCat.length===0 && <div style={{ fontSize:13, color:"rgba(255,255,255,0.25)" }}>Nenhum lançamento ainda.</div>}
          {porCat.map(cat=>(
            <div key={cat.id} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.65)" }}>{cat.nome}</span>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>{fmt(cat.total)}</span>
              </div>
              <div style={{ height:4, background:"rgba(255,255,255,0.07)", borderRadius:999 }}>
                <div style={{ width:`${desp?(cat.total/desp*100):0}%`, height:"100%", borderRadius:999, background:cat.cor||"#6366f1" }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:18 }}>
          <div style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.5)", marginBottom:14 }}>Últimos lançamentos</div>
          {ultimos.length===0 && <div style={{ fontSize:13, color:"rgba(255,255,255,0.25)" }}>Nenhum lançamento ainda.</div>}
          {ultimos.map(l=>{
            const cat=categorias.find(c=>c.id===l.categoria_id);
            return (
              <div key={l.id} style={{ display:"flex", alignItems:"center", gap:10, paddingBottom:10, marginBottom:10, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:cat?.cor||"#6366f1", flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{l.descricao}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{cat?.nome||"—"} · {l.data}</div>
                </div>
                <div style={{ fontSize:12, fontWeight:500, color:l.tipo==="receita"?"#34d399":"#f87171", flexShrink:0 }}>
                  {l.tipo==="receita"?"+":""}{fmt(l.valor)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Lançamentos ────────────────────────────────────────────────────────────────
function Lancamentos({ lancamentos, contas, categorias, subcategorias, empresaId, userId, onRefresh, membro }) {
  const [filtro, setFiltro] = useState("todos");
  const [modal, setModal] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nf, setNf] = useState(null);
  const [comp, setComp] = useState(null);
  const [diasAbertos, setDiasAbertos] = useState({});
  const hoje = new Date().toISOString().split("T")[0];
  const primeiroDiaMes = new Date().toISOString().slice(0,7)+"-01";
  const [dataInicio, setDataInicio] = useState(primeiroDiaMes);
  const [dataFim, setDataFim] = useState(hoje);
  const [form, setForm] = useState({ descricao:"", valor:"", tipo:"despesa", data:hoje, categoria_id:"", subcategoria_id:"", conta_id:"", observacao:"" });
  const podeExcluir = membro?.perfil !== "visualizador";
  const podeCriar = membro?.perfil !== "visualizador";

  const lista = useMemo(()=>lancamentos.filter(l=>(filtro==="todos"||l.tipo===filtro)&&(!dataInicio||l.data>=dataInicio)&&(!dataFim||l.data<=dataFim)).sort((a,b)=>new Date(b.data)-new Date(a.data)),[lancamentos,filtro,dataInicio,dataFim]);
  const porDia = useMemo(()=>{ const d={}; lista.forEach(l=>{ if(!d[l.data])d[l.data]=[]; d[l.data].push(l); }); return Object.entries(d).sort((a,b)=>new Date(b[0])-new Date(a[0])); },[lista]);
  const totalGeral = useMemo(()=>({ receita:lista.filter(l=>l.tipo==="receita").reduce((s,l)=>s+Number(l.valor),0), despesa:lista.filter(l=>l.tipo==="despesa").reduce((s,l)=>s+Number(l.valor),0) }),[lista]);
  const toggleDia = (data)=>setDiasAbertos(prev=>({...prev,[data]:!prev[data]}));
  const meses=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const dias=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const fmtData=(data)=>{ const [y,m,d]=data.split("-"); return { dia:d, mes:meses[Number(m)-1], semana:dias[new Date(Number(y),Number(m)-1,Number(d)).getDay()] }; };

  const salvar = async () => {
    if (!form.descricao||!form.valor||!form.data) return alert("Preencha descrição, valor e data.");
    setLoading(true);
    try {
      let nf_url=null,nf_nome=null,comprovante_url=null,comprovante_nome=null;
      if(nf){const r=await uploadArquivo(nf,userId);nf_url=r.url;nf_nome=r.nome;}
      if(comp){const r=await uploadArquivo(comp,userId);comprovante_url=r.url;comprovante_nome=r.nome;}
      await sb("lancamentos",{method:"POST",body:JSON.stringify({...form,valor:Number(form.valor),empresa_id:empresaId,criado_por:userId,categoria_id:form.categoria_id||null,subcategoria_id:form.subcategoria_id||null,conta_id:form.conta_id||null,nf_url,nf_nome,comprovante_url,comprovante_nome})});
      setModal(false);setNf(null);setComp(null);
      setForm({descricao:"",valor:"",tipo:"despesa",data:hoje,categoria_id:"",subcategoria_id:"",conta_id:"",observacao:""});
      onRefresh();
    } catch(e){alert("Erro: "+e.message);}
    setLoading(false);
  };

  const excluir = async (id) => {
    if(!confirm("Excluir este lançamento?"))return;
    await sb(`lancamentos?id=eq.${id}`,{method:"DELETE",prefer:""});onRefresh();
  };

  const BtnAnexo=({url,nome,label})=>url?(<button onClick={()=>verAnexo(url,nome,setPreview)} style={{ background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.3)", color:"#34d399", cursor:"pointer", fontSize:10, padding:"2px 8px", borderRadius:4, whiteSpace:"nowrap" }}>{label}</button>):null;

  const subsDisponiveis = (subcategorias||[]).filter(s=>s.categoria_id===form.categoria_id);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:600, color:"#fff", marginBottom:4 }}>Lançamentos</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>{lista.length} registros</div>
        </div>
        {podeCriar && <button onClick={()=>setModal(true)} style={{ background:"#6366f1", border:"none", borderRadius:8, padding:"9px 16px", color:"#fff", fontSize:13, fontWeight:500, cursor:"pointer" }}>+ Novo lançamento</button>}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:12, background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"12px 16px", marginBottom:14, flexWrap:"wrap" }}>
        {[["De",dataInicio,setDataInicio],["Até",dataFim,setDataFim]].map(([label,val,set])=>(
          <div key={label} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>{label}</span>
            <input type="date" value={val} onChange={e=>set(e.target.value)} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"6px 10px", color:"#fff", fontSize:12, outline:"none" }} />
          </div>
        ))}
        <button onClick={()=>{setDataInicio(primeiroDiaMes);setDataFim(hoje);}} style={{ background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.3)", borderRadius:6, padding:"6px 12px", color:"#818cf8", fontSize:12, cursor:"pointer" }}>Mês atual</button>
        <button onClick={()=>{setDataInicio("");setDataFim("");}} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"6px 12px", color:"rgba(255,255,255,0.5)", fontSize:12, cursor:"pointer" }}>Tudo</button>
      </div>

      <div style={{ display:"flex", gap:7, marginBottom:16 }}>
        {["todos","receita","despesa"].map(f=>(
          <button key={f} onClick={()=>setFiltro(f)} style={{ padding:"5px 13px", borderRadius:6, border:`1px solid ${filtro===f?"#6366f1":"rgba(255,255,255,0.1)"}`, background:filtro===f?"rgba(99,102,241,0.15)":"transparent", color:filtro===f?"#818cf8":"rgba(255,255,255,0.4)", fontSize:12, cursor:"pointer", textTransform:"capitalize" }}>{f}</button>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:18 }}>
        {[["Total de receitas",totalGeral.receita,"#34d399"],["Total de despesas",totalGeral.despesa,"#f87171"],["Resultado",totalGeral.receita-totalGeral.despesa,totalGeral.receita-totalGeral.despesa>=0?"#34d399":"#f87171"]].map(([l,v,c])=>(
          <div key={l} style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"12px 16px" }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5 }}>{l}</div>
            <div style={{ fontSize:17, fontWeight:600, color:c }}>{fmt(v)}</div>
          </div>
        ))}
      </div>

      {porDia.length===0 && <div style={{ fontSize:13, color:"rgba(255,255,255,0.25)", padding:20 }}>Nenhum lançamento encontrado.</div>}
      {porDia.map(([data,itens])=>{
        const rec=itens.filter(l=>l.tipo==="receita").reduce((s,l)=>s+Number(l.valor),0);
        const desp=itens.filter(l=>l.tipo==="despesa").reduce((s,l)=>s+Number(l.valor),0);
        const aberto=diasAbertos[data];
        const {dia,mes,semana}=fmtData(data);
        return (
          <div key={data} style={{ marginBottom:8 }}>
            <div onClick={()=>toggleDia(data)} style={{ display:"flex", alignItems:"center", gap:14, background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:aberto?"10px 10px 0 0":10, padding:"12px 16px", cursor:"pointer", userSelect:"none" }}>
              <div style={{ textAlign:"center", minWidth:44, background:"rgba(99,102,241,0.15)", borderRadius:8, padding:"6px 8px" }}>
                <div style={{ fontSize:18, fontWeight:600, color:"#818cf8", lineHeight:1 }}>{dia}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", textTransform:"uppercase" }}>{mes}</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:"#fff", fontWeight:500 }}>{semana}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{itens.length} lançamento{itens.length!==1?"s":""}</div>
              </div>
              <div style={{ display:"flex", gap:20, alignItems:"center" }}>
                {rec>0 && <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", textTransform:"uppercase" }}>Entrada</div>
                  <div style={{ fontSize:14, fontWeight:600, color:"#34d399" }}>{fmt(rec)}</div>
                </div>}
                {desp>0 && <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", textTransform:"uppercase" }}>Saída</div>
                  <div style={{ fontSize:14, fontWeight:600, color:"#f87171" }}>{fmt(desp)}</div>
                </div>}
                <div style={{ fontSize:16, color:"rgba(255,255,255,0.3)" }}>{aberto?"▲":"▼"}</div>
              </div>
            </div>
            {aberto && (
              <div style={{ background:"#13131f", border:"1px solid rgba(255,255,255,0.07)", borderTop:"none", borderRadius:"0 0 10px 10px", overflow:"hidden" }}>
                {itens.map((l,i)=>{
                  const cat=categorias.find(c=>c.id===l.categoria_id);
                  const sub=(subcategorias||[]).find(s=>s.id===l.subcategoria_id);
                  const conta=contas.find(c=>c.id===l.conta_id);
                  return (
                    <div key={l.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", borderBottom:i<itens.length-1?"1px solid rgba(255,255,255,0.04)":"none" }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:cat?.cor||"#6366f1", flexShrink:0 }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{l.descricao}</div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", display:"flex", gap:6, marginTop:2, flexWrap:"wrap" }}>
                          {cat && <span>{cat.nome}</span>}
                          {sub && <span style={{ color:"rgba(255,255,255,0.5)" }}>› {sub.nome}</span>}
                          {conta && <span>· {conta.nome}</span>}
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                        {l.nf_url && <BtnAnexo url={l.nf_url} nome={l.nf_nome||"NF"} label="📄 NF" />}
                        {l.comprovante_url && <BtnAnexo url={l.comprovante_url} nome={l.comprovante_nome||"Comprovante"} label="🧾 Comp." />}
                        <div style={{ fontSize:13, fontWeight:600, color:l.tipo==="receita"?"#34d399":"#f87171", minWidth:90, textAlign:"right" }}>
                          {l.tipo==="receita"?"+":"-"}{fmt(Math.abs(Number(l.valor)))}
                        </div>
                        {podeExcluir && <button onClick={()=>excluir(l.id)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.2)", cursor:"pointer", fontSize:14 }}>🗑</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <PreviewModal preview={preview} onClose={()=>setPreview(null)} />

      {modal && (
        <Modal titulo="Novo lançamento" onClose={()=>setModal(false)}>
          <Campo label="Descrição"><input style={inputStyle} value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})} placeholder="Ex: Supermercado" /></Campo>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Campo label="Valor (R$)"><input style={inputStyle} type="number" step="0.01" value={form.valor} onChange={e=>setForm({...form,valor:e.target.value})} /></Campo>
            <Campo label="Data"><input style={inputStyle} type="date" value={form.data} onChange={e=>setForm({...form,data:e.target.value})} /></Campo>
          </div>
          <Campo label="Tipo">
            <div style={{ display:"flex", gap:8 }}>
              {["despesa","receita"].map(t=>(<button key={t} onClick={()=>setForm({...form,tipo:t,categoria_id:"",subcategoria_id:""})} style={{ flex:1, padding:"9px", borderRadius:7, border:`1px solid ${form.tipo===t?"#6366f1":"rgba(255,255,255,0.1)"}`, background:form.tipo===t?"rgba(99,102,241,0.15)":"transparent", color:form.tipo===t?"#818cf8":"rgba(255,255,255,0.4)", fontSize:13, cursor:"pointer", textTransform:"capitalize" }}>{t}</button>))}
            </div>
          </Campo>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Campo label="Categoria">
              <select style={selectStyle} value={form.categoria_id} onChange={e=>setForm({...form,categoria_id:e.target.value,subcategoria_id:""})}>
                <option value="">Sem categoria</option>
                {categorias.filter(c=>c.tipo===form.tipo).map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Campo>
            <Campo label="Conta">
              <select style={selectStyle} value={form.conta_id} onChange={e=>setForm({...form,conta_id:e.target.value})}>
                <option value="">Sem conta</option>
                {contas.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Campo>
          </div>
          {form.categoria_id && subsDisponiveis.length>0 && (
            <Campo label="Subcategoria">
              <select style={selectStyle} value={form.subcategoria_id} onChange={e=>setForm({...form,subcategoria_id:e.target.value})}>
                <option value="">Sem subcategoria</option>
                {subsDisponiveis.map(s=><option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </Campo>
          )}
          <Campo label="Observação"><textarea style={{ ...inputStyle, resize:"vertical", minHeight:50 }} value={form.observacao} onChange={e=>setForm({...form,observacao:e.target.value})} /></Campo>
          <Campo label="📄 Nota Fiscal"><input type="file" accept="image/*,.pdf" onChange={e=>setNf(e.target.files[0])} style={{ ...inputStyle, padding:"8px 12px" }} />{nf&&<div style={{ fontSize:11, color:"#34d399", marginTop:4 }}>✓ {nf.name}</div>}</Campo>
          <Campo label="🧾 Comprovante de Pagamento"><input type="file" accept="image/*,.pdf" onChange={e=>setComp(e.target.files[0])} style={{ ...inputStyle, padding:"8px 12px" }} />{comp&&<div style={{ fontSize:11, color:"#34d399", marginTop:4 }}>✓ {comp.name}</div>}</Campo>
          <BtnRow onCancel={()=>setModal(false)} onSave={salvar} loading={loading} />
        </Modal>
      )}
    </div>
  );
}

// ── Contas a Pagar ─────────────────────────────────────────────────────────────
function ContasPagar({ categorias, subcategorias, empresaId, userId, onRefresh, membro }) {
  const [contas, setContas] = useState([]);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [nf, setNf] = useState(null);
  const [comp, setComp] = useState(null);
  const [preview, setPreview] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const hoje = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ descricao:"", valor:"", vencimento:"", categoria_id:"", subcategoria_id:"", tipo_custo:"variavel", recorrente:false, intervalo_meses:1, observacao:"" });
  const podeExcluir = membro?.perfil !== "visualizador";
  const podeCriar = membro?.perfil !== "visualizador";

  const carregar = useCallback(async () => {
    setCarregando(true);
    try { const data=await sb(`contas_pagar?empresa_id=eq.${empresaId}&order=vencimento.asc`); setContas(data||[]); }
    catch(e){console.error(e);}
    setCarregando(false);
  }, [empresaId]);

  useEffect(()=>{ carregar(); },[carregar]);

  const getStatus=(c)=>{ if(c.status==="pago")return "pago"; if(c.vencimento<hoje)return "vencido"; const diff=(new Date(c.vencimento)-new Date())/(1000*60*60*24); if(diff<=5)return "avencer"; return "aberto"; };
  const statusInfo={ pago:{label:"Pago",cor:"#34d399",bg:"rgba(52,211,153,0.15)",icon:"✓"}, vencido:{label:"Vencido",cor:"#f87171",bg:"rgba(248,113,113,0.15)",icon:"⚠"}, avencer:{label:"A vencer",cor:"#fbbf24",bg:"rgba(251,191,36,0.15)",icon:"⏰"}, aberto:{label:"Em aberto",cor:"#818cf8",bg:"rgba(129,140,248,0.15)",icon:"○"} };

  const marcarPago=async(id)=>{ if(!confirm("Marcar como paga?"))return; await sb(`contas_pagar?id=eq.${id}`,{method:"PATCH",body:JSON.stringify({status:"pago",pago_em:hoje})}); carregar(); };
  const excluir=async(id)=>{ if(!confirm("Excluir?"))return; await sb(`contas_pagar?id=eq.${id}`,{method:"DELETE",prefer:""}); carregar(); };

  const salvar=async()=>{
    if(!form.descricao||!form.valor||!form.vencimento)return alert("Preencha descrição, valor e vencimento.");
    setLoading(true);
    try{
      let nf_url=null,nf_nome=null,comprovante_url=null,comprovante_nome=null;
      if(nf){const r=await uploadArquivo(nf,userId);nf_url=r.url;nf_nome=r.nome;}
      if(comp){const r=await uploadArquivo(comp,userId);comprovante_url=r.url;comprovante_nome=r.nome;}
      await sb("contas_pagar",{method:"POST",body:JSON.stringify({...form,valor:Number(form.valor),empresa_id:empresaId,criado_por:userId,categoria_id:form.categoria_id||null,subcategoria_id:form.subcategoria_id||null,nf_url,nf_nome,comprovante_url,comprovante_nome})});
      setModal(false);setNf(null);setComp(null);
      setForm({descricao:"",valor:"",vencimento:"",categoria_id:"",subcategoria_id:"",tipo_custo:"variavel",recorrente:false,intervalo_meses:1,observacao:""});
      carregar();
    }catch(e){alert("Erro: "+e.message);}
    setLoading(false);
  };

  const lista=contas.filter(c=>filtroStatus==="todos"||getStatus(c)===filtroStatus);
  const totais={fixo:0,variavel:0,investimento:0,outros:0};
  contas.filter(c=>getStatus(c)!=="pago").forEach(c=>{totais[c.tipo_custo]=(totais[c.tipo_custo]||0)+Number(c.valor);});
  const totalGeral=Object.values(totais).reduce((s,v)=>s+v,0);
  const porDia={};
  lista.forEach(c=>{if(!porDia[c.vencimento])porDia[c.vencimento]=[];porDia[c.vencimento].push(c);});
  const diasOrdenados=Object.entries(porDia).sort((a,b)=>a[0].localeCompare(b[0]));
  const meses=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const fmtData=(data)=>{const[y,m,d]=data.split("-");return{dia:d,mes:meses[Number(m)-1],ano:y};};
  const subsDisponiveis=(subcategorias||[]).filter(s=>s.categoria_id===form.categoria_id);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:600, color:"#fff", marginBottom:4 }}>Contas a Pagar</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>{contas.length} contas cadastradas</div>
        </div>
        {podeCriar && <button onClick={()=>setModal(true)} style={{ background:"#6366f1", border:"none", borderRadius:8, padding:"9px 16px", color:"#fff", fontSize:13, fontWeight:500, cursor:"pointer" }}>+ Nova conta</button>}
      </div>

      <div style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 20px", marginBottom:16, display:"flex", gap:28, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Totais em aberto</div>
        {[["Custo Fixo",totais.fixo,"#818cf8"],["Custo Variável",totais.variavel,"#fbbf24"],["Investimento",totais.investimento,"#34d399"],["Total",totalGeral,"#f87171"]].map(([l,v,c])=>(
          <div key={l}><div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", marginBottom:3 }}>{l}</div><div style={{ fontSize:15, fontWeight:600, color:c }}>{fmt(v)}</div></div>
        ))}
      </div>

      <div style={{ display:"flex", gap:7, marginBottom:16 }}>
        {[["todos","Todos","rgba(255,255,255,0.4)"],["vencido","Vencidos","#f87171"],["avencer","A vencer","#fbbf24"],["aberto","Em aberto","#818cf8"],["pago","Pagos","#34d399"]].map(([v,l,c])=>(
          <button key={v} onClick={()=>setFiltroStatus(v)} style={{ padding:"5px 13px", borderRadius:6, border:`1px solid ${filtroStatus===v?c:"rgba(255,255,255,0.1)"}`, background:filtroStatus===v?c+"22":"transparent", color:filtroStatus===v?c:"rgba(255,255,255,0.4)", fontSize:12, cursor:"pointer" }}>{l}</button>
        ))}
      </div>

      {carregando && <div style={{ color:"rgba(255,255,255,0.3)", fontSize:13 }}>Carregando...</div>}
      {!carregando && diasOrdenados.length===0 && <div style={{ color:"rgba(255,255,255,0.25)", fontSize:13, padding:20 }}>Nenhuma conta encontrada.</div>}

      {diasOrdenados.map(([data,itens])=>{
        const totalDia=itens.reduce((s,c)=>s+Number(c.valor),0);
        const {dia,mes,ano}=fmtData(data);
        const temVencido=itens.some(c=>getStatus(c)==="vencido");
        const temAvencer=itens.some(c=>getStatus(c)==="avencer");
        const corDia=temVencido?"#f87171":temAvencer?"#fbbf24":"#818cf8";
        return (
          <div key={data} style={{ marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, background:"#1a1a2e", border:`1px solid ${corDia}44`, borderRadius:"10px 10px 0 0", padding:"10px 16px" }}>
              <div style={{ textAlign:"center", minWidth:44, background:corDia+"22", borderRadius:8, padding:"5px 8px" }}>
                <div style={{ fontSize:18, fontWeight:600, color:corDia, lineHeight:1 }}>{dia}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", textTransform:"uppercase" }}>{mes}</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:"#fff", fontWeight:500 }}>{dia}/{mes}/{ano}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{itens.length} conta{itens.length!==1?"s":""}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", textTransform:"uppercase" }}>Total</div>
                <div style={{ fontSize:15, fontWeight:600, color:corDia }}>{fmt(totalDia)}</div>
              </div>
            </div>
            {itens.map((c,i)=>{
              const cat=categorias.find(x=>x.id===c.categoria_id);
              const sub=(subcategorias||[]).find(s=>s.id===c.subcategoria_id);
              const st=getStatus(c);
              const si=statusInfo[st];
              const tipoCor={fixo:"#818cf8",variavel:"#fbbf24",investimento:"#34d399",outros:"rgba(255,255,255,0.4)"};
              const tipoLabel={fixo:"Custo Fixo",variavel:"Custo Variável",investimento:"Investimento",outros:"Outros"};
              return (
                <div key={c.id} style={{ background:"#13131f", border:"1px solid rgba(255,255,255,0.05)", borderTop:"none", borderRadius:i===itens.length-1?"0 0 10px 10px":0, padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ background:si.bg, border:`1px solid ${si.cor}44`, borderRadius:6, padding:"3px 8px", fontSize:11, color:si.cor, fontWeight:500, whiteSpace:"nowrap", minWidth:80, textAlign:"center" }}>{si.icon} {si.label}</div>
                  {st!=="pago" && podeCriar && (<button onClick={()=>marcarPago(c.id)} title="Marcar como pago" style={{ width:34, height:34, borderRadius:"50%", background:"#16a34a", border:"none", color:"#fff", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>💲</button>)}
                  {st==="pago" && <div style={{ width:34, height:34, borderRadius:"50%", background:"rgba(52,211,153,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:16 }}>✓</div>}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, color:"#fff", fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.descricao}</div>
                    <div style={{ display:"flex", gap:6, marginTop:3, flexWrap:"wrap" }}>
                      <span style={{ fontSize:11, background:(tipoCor[c.tipo_custo]||"#6366f1")+"22", color:tipoCor[c.tipo_custo]||"#6366f1", padding:"1px 7px", borderRadius:4 }}>{tipoLabel[c.tipo_custo]}</span>
                      {cat && <span style={{ fontSize:11, background:(cat.cor||"#6366f1")+"22", color:cat.cor||"#6366f1", padding:"1px 7px", borderRadius:4 }}>{cat.nome}</span>}
                      {sub && <span style={{ fontSize:11, background:(sub.cor||"#6366f1")+"22", color:sub.cor||"#6366f1", padding:"1px 7px", borderRadius:4 }}>› {sub.nome}</span>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {c.nf_url && <button onClick={()=>verAnexo(c.nf_url,c.nf_nome||"NF",setPreview)} style={{ background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.3)", color:"#34d399", cursor:"pointer", fontSize:10, padding:"2px 8px", borderRadius:4 }}>📄 NF</button>}
                    {c.comprovante_url && <button onClick={()=>verAnexo(c.comprovante_url,c.comprovante_nome||"Comp.",setPreview)} style={{ background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.3)", color:"#34d399", cursor:"pointer", fontSize:10, padding:"2px 8px", borderRadius:4 }}>🧾 Comp.</button>}
                  </div>
                  <div style={{ fontSize:15, fontWeight:600, color:st==="pago"?"#34d399":"#fff", minWidth:100, textAlign:"right" }}>{fmt(c.valor)}</div>
                  {podeExcluir && <button onClick={()=>excluir(c.id)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.2)", cursor:"pointer", fontSize:14 }}>🗑</button>}
                </div>
              );
            })}
          </div>
        );
      })}

      <PreviewModal preview={preview} onClose={()=>setPreview(null)} />

      {modal && (
        <Modal titulo="Nova conta a pagar" onClose={()=>setModal(false)}>
          <Campo label="Descrição"><input style={inputStyle} value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})} placeholder="Ex: Aluguel, COFINS..." /></Campo>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Campo label="Valor (R$)"><input style={inputStyle} type="number" step="0.01" value={form.valor} onChange={e=>setForm({...form,valor:e.target.value})} /></Campo>
            <Campo label="Vencimento"><input style={inputStyle} type="date" value={form.vencimento} onChange={e=>setForm({...form,vencimento:e.target.value})} /></Campo>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Campo label="Tipo de custo">
              <select style={selectStyle} value={form.tipo_custo} onChange={e=>setForm({...form,tipo_custo:e.target.value})}>
                <option value="fixo">Custo Fixo</option>
                <option value="variavel">Custo Variável</option>
                <option value="investimento">Investimento</option>
                <option value="outros">Outros</option>
              </select>
            </Campo>
            <Campo label="Categoria">
              <select style={selectStyle} value={form.categoria_id} onChange={e=>setForm({...form,categoria_id:e.target.value,subcategoria_id:""})}>
                <option value="">Sem categoria</option>
                {categorias.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Campo>
          </div>
          {form.categoria_id && subsDisponiveis.length>0 && (
            <Campo label="Subcategoria">
              <select style={selectStyle} value={form.subcategoria_id} onChange={e=>setForm({...form,subcategoria_id:e.target.value})}>
                <option value="">Sem subcategoria</option>
                {subsDisponiveis.map(s=><option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </Campo>
          )}
          <Campo label="Observação"><textarea style={{ ...inputStyle, resize:"vertical", minHeight:50 }} value={form.observacao} onChange={e=>setForm({...form,observacao:e.target.value})} /></Campo>
          <Campo label="📄 Nota Fiscal"><input type="file" accept="image/*,.pdf" onChange={e=>setNf(e.target.files[0])} style={{ ...inputStyle, padding:"8px 12px" }} />{nf&&<div style={{ fontSize:11, color:"#34d399", marginTop:4 }}>✓ {nf.name}</div>}</Campo>
          <Campo label="🧾 Comprovante"><input type="file" accept="image/*,.pdf" onChange={e=>setComp(e.target.files[0])} style={{ ...inputStyle, padding:"8px 12px" }} />{comp&&<div style={{ fontSize:11, color:"#34d399", marginTop:4 }}>✓ {comp.name}</div>}</Campo>
          <BtnRow onCancel={()=>setModal(false)} onSave={salvar} loading={loading} />
        </Modal>
      )}
    </div>
  );
}

// ── Contas Bancárias ───────────────────────────────────────────────────────────
function Contas({ contas, empresaId, onRefresh, membro }) {
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome:"", banco:"", saldo:"", cor:"#6366f1" });
  const total=contas.reduce((s,c)=>s+Number(c.saldo),0);
  const podeExcluir=membro?.perfil!=="visualizador";
  const podeCriar=membro?.perfil!=="visualizador";

  const salvar=async()=>{ if(!form.nome||!form.banco)return alert("Preencha nome e banco."); setLoading(true); try{ await sb("contas",{method:"POST",body:JSON.stringify({...form,saldo:Number(form.saldo)||0,empresa_id:empresaId})}); setModal(false);setForm({nome:"",banco:"",saldo:"",cor:"#6366f1"});onRefresh(); }catch(e){alert("Erro: "+e.message);} setLoading(false); };
  const excluir=async(id)=>{ if(!confirm("Excluir?"))return; await sb(`contas?id=eq.${id}`,{method:"DELETE",prefer:""});onRefresh(); };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
        <div><div style={{ fontSize:22, fontWeight:600, color:"#fff", marginBottom:4 }}>Contas bancárias</div><div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>Saldo consolidado: {fmt(total)}</div></div>
        {podeCriar && <button onClick={()=>setModal(true)} style={{ background:"#6366f1", border:"none", borderRadius:8, padding:"9px 16px", color:"#fff", fontSize:13, fontWeight:500, cursor:"pointer" }}>+ Nova conta</button>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        {contas.length===0 && <div style={{ fontSize:13, color:"rgba(255,255,255,0.3)" }}>Nenhuma conta cadastrada.</div>}
        {contas.map(c=>(
          <div key={c.id} style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:18, position:"relative" }}>
            {podeExcluir && <button onClick={()=>excluir(c.id)} style={{ position:"absolute", top:12, right:12, background:"none", border:"none", color:"rgba(255,255,255,0.2)", cursor:"pointer", fontSize:14 }}>🗑</button>}
            <div style={{ width:34, height:34, borderRadius:9, background:(c.cor||"#6366f1")+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, marginBottom:12 }}>💳</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:4 }}>{c.banco}</div>
            <div style={{ fontSize:20, fontWeight:600, color:"#fff", marginBottom:10 }}>{fmt(c.saldo)}</div>
            <div style={{ height:3, background:"rgba(255,255,255,0.07)", borderRadius:999 }}>
              <div style={{ width:`${total?(Math.min(Number(c.saldo)/total,1)*100):0}%`, height:"100%", background:c.cor||"#6366f1", borderRadius:999 }} />
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:4 }}>{total?((Number(c.saldo)/total)*100).toFixed(1):0}% do total</div>
          </div>
        ))}
      </div>
      {modal && (
        <Modal titulo="Nova conta" onClose={()=>setModal(false)}>
          <Campo label="Nome da conta"><input style={inputStyle} value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} placeholder="Ex: Nubank" /></Campo>
          <Campo label="Banco"><input style={inputStyle} value={form.banco} onChange={e=>setForm({...form,banco:e.target.value})} /></Campo>
          <Campo label="Saldo inicial (R$)"><input style={inputStyle} type="number" step="0.01" value={form.saldo} onChange={e=>setForm({...form,saldo:e.target.value})} /></Campo>
          <Campo label="Cor"><div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>{CORES.map(cor=><div key={cor} onClick={()=>setForm({...form,cor})} style={{ width:28, height:28, borderRadius:"50%", background:cor, cursor:"pointer", border:form.cor===cor?"3px solid #fff":"2px solid transparent" }} />)}</div></Campo>
          <BtnRow onCancel={()=>setModal(false)} onSave={salvar} loading={loading} />
        </Modal>
      )}
    </div>
  );
}

// ── Investimentos ──────────────────────────────────────────────────────────────
function Investimentos({ investimentos, empresaId, onRefresh, membro }) {
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome:"", tipo:"", valor_inicial:"", valor_atual:"", vencimento:"" });
  const tAtual=investimentos.reduce((s,i)=>s+Number(i.valor_atual),0);
  const tInic=investimentos.reduce((s,i)=>s+Number(i.valor_inicial),0);
  const rend=tAtual-tInic;
  const pct=tInic?((rend/tInic)*100).toFixed(2):"0.00";
  const podeExcluir=membro?.perfil!=="visualizador";
  const podeCriar=membro?.perfil!=="visualizador";

  const salvar=async()=>{ if(!form.nome||!form.valor_inicial||!form.valor_atual)return alert("Preencha os campos."); setLoading(true); try{ await sb("investimentos",{method:"POST",body:JSON.stringify({...form,valor_inicial:Number(form.valor_inicial),valor_atual:Number(form.valor_atual),vencimento:form.vencimento||null,empresa_id:empresaId})}); setModal(false);setForm({nome:"",tipo:"",valor_inicial:"",valor_atual:"",vencimento:""});onRefresh(); }catch(e){alert("Erro: "+e.message);} setLoading(false); };
  const excluir=async(id)=>{ if(!confirm("Excluir?"))return; await sb(`investimentos?id=eq.${id}`,{method:"DELETE",prefer:""});onRefresh(); };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
        <div><div style={{ fontSize:22, fontWeight:600, color:"#fff", marginBottom:4 }}>Investimentos</div></div>
        {podeCriar && <button onClick={()=>setModal(true)} style={{ background:"#6366f1", border:"none", borderRadius:8, padding:"9px 16px", color:"#fff", fontSize:13, fontWeight:500, cursor:"pointer" }}>+ Novo</button>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:18 }}>
        {[["Valor atual",fmt(tAtual),"#fff"],["Rendimento",fmt(rend),"#34d399"],["Rentabilidade",`+${pct}%`,"#a78bfa"]].map(([l,v,c])=>(
          <div key={l} style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px 18px" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>{l}</div>
            <div style={{ fontSize:20, fontWeight:600, color:c }}>{v}</div>
          </div>
        ))}
      </div>
      {investimentos.length===0 && <div style={{ fontSize:13, color:"rgba(255,255,255,0.3)" }}>Nenhum investimento.</div>}
      {investimentos.map(inv=>{
        const r=Number(inv.valor_atual)-Number(inv.valor_inicial);
        const p=Number(inv.valor_inicial)?((r/Number(inv.valor_inicial))*100).toFixed(2):"0.00";
        return (
          <div key={inv.id} style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 16px", marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div><div style={{ fontSize:13, color:"#fff", marginBottom:4 }}>{inv.nome}</div><span style={{ background:"rgba(167,139,250,0.15)", color:"#a78bfa", padding:"2px 8px", borderRadius:5, fontSize:11 }}>{inv.tipo}</span></div>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ textAlign:"right" }}><div style={{ fontSize:15, fontWeight:600, color:"#fff" }}>{fmt(inv.valor_atual)}</div><div style={{ fontSize:11, color:"#34d399" }}>+{fmt(r)} ({p}%)</div></div>
              {podeExcluir && <button onClick={()=>excluir(inv.id)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.2)", cursor:"pointer", fontSize:14 }}>🗑</button>}
            </div>
          </div>
        );
      })}
      {modal && (
        <Modal titulo="Novo investimento" onClose={()=>setModal(false)}>
          <Campo label="Nome"><input style={inputStyle} value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} /></Campo>
          <Campo label="Tipo"><input style={inputStyle} value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})} placeholder="Ex: Renda Fixa, Ações..." /></Campo>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Campo label="Valor inicial"><input style={inputStyle} type="number" step="0.01" value={form.valor_inicial} onChange={e=>setForm({...form,valor_inicial:e.target.value})} /></Campo>
            <Campo label="Valor atual"><input style={inputStyle} type="number" step="0.01" value={form.valor_atual} onChange={e=>setForm({...form,valor_atual:e.target.value})} /></Campo>
          </div>
          <Campo label="Vencimento (opcional)"><input style={inputStyle} type="date" value={form.vencimento} onChange={e=>setForm({...form,vencimento:e.target.value})} /></Campo>
          <BtnRow onCancel={()=>setModal(false)} onSave={salvar} loading={loading} />
        </Modal>
      )}
    </div>
  );
}

// ── Orçamento ──────────────────────────────────────────────────────────────────
function Orcamento({ orcamento, lancamentos, categorias, empresaId, onRefresh, membro }) {
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const now=new Date();
  const [form, setForm] = useState({ categoria_id:"", limite:"", mes:now.getMonth()+1, ano:now.getFullYear() });
  const podeCriar=membro?.perfil!=="visualizador";

  const salvar=async()=>{ if(!form.categoria_id||!form.limite)return alert("Preencha categoria e limite."); setLoading(true); try{ await sb("orcamento",{method:"POST",body:JSON.stringify({...form,limite:Number(form.limite),empresa_id:empresaId}),prefer:"resolution=merge-duplicates,return=representation"}); setModal(false);setForm({categoria_id:"",limite:"",mes:now.getMonth()+1,ano:now.getFullYear()});onRefresh(); }catch(e){alert("Erro: "+e.message);} setLoading(false); };
  const excluir=async(id)=>{ if(!confirm("Excluir?"))return; await sb(`orcamento?id=eq.${id}`,{method:"DELETE",prefer:""});onRefresh(); };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
        <div><div style={{ fontSize:22, fontWeight:600, color:"#fff", marginBottom:4 }}>Orçamento mensal</div></div>
        {podeCriar && <button onClick={()=>setModal(true)} style={{ background:"#6366f1", border:"none", borderRadius:8, padding:"9px 16px", color:"#fff", fontSize:13, fontWeight:500, cursor:"pointer" }}>+ Definir limite</button>}
      </div>
      {orcamento.length===0 && <div style={{ fontSize:13, color:"rgba(255,255,255,0.3)" }}>Nenhum orçamento definido.</div>}
      {orcamento.map(o=>{
        const cat=categorias.find(c=>c.id===o.categoria_id);
        const gasto=lancamentos.filter(l=>l.categoria_id===o.categoria_id&&l.tipo==="despesa"&&new Date(l.data).getMonth()+1===o.mes&&new Date(l.data).getFullYear()===o.ano).reduce((s,l)=>s+Number(l.valor),0);
        const pct=Math.min((gasto/Number(o.limite))*100,100);
        const cor=pct>=90?"#f87171":pct>=70?"#fbbf24":cat?.cor||"#6366f1";
        return (
          <div key={o.id} style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px 18px", marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:cat?.cor||"#6366f1" }} />
                <span style={{ fontSize:13, color:"#fff" }}>{cat?.nome||"—"}</span>
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{o.mes}/{o.ano}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>{fmt(gasto)} de {fmt(o.limite)}</span>
                <span style={{ fontSize:12, fontWeight:500, color:cor }}>{pct.toFixed(0)}%</span>
                {pct>=90 && <span>⚠️</span>}
                <button onClick={()=>excluir(o.id)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.2)", cursor:"pointer", fontSize:14 }}>🗑</button>
              </div>
            </div>
            <div style={{ height:5, background:"rgba(255,255,255,0.07)", borderRadius:999 }}>
              <div style={{ width:`${pct}%`, height:"100%", borderRadius:999, background:cor }} />
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:4 }}>Restam: {fmt(Number(o.limite)-gasto)}</div>
          </div>
        );
      })}
      {modal && (
        <Modal titulo="Definir limite" onClose={()=>setModal(false)}>
          <Campo label="Categoria"><select style={selectStyle} value={form.categoria_id} onChange={e=>setForm({...form,categoria_id:e.target.value})}><option value="">Selecione...</option>{categorias.filter(c=>c.tipo==="despesa").map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></Campo>
          <Campo label="Limite (R$)"><input style={inputStyle} type="number" step="0.01" value={form.limite} onChange={e=>setForm({...form,limite:e.target.value})} /></Campo>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Campo label="Mês"><input style={inputStyle} type="number" min="1" max="12" value={form.mes} onChange={e=>setForm({...form,mes:Number(e.target.value)})} /></Campo>
            <Campo label="Ano"><input style={inputStyle} type="number" value={form.ano} onChange={e=>setForm({...form,ano:Number(e.target.value)})} /></Campo>
          </div>
          <BtnRow onCancel={()=>setModal(false)} onSave={salvar} loading={loading} />
        </Modal>
      )}
    </div>
  );
}

// ── Categorias ─────────────────────────────────────────────────────────────────
function Categorias({ categorias, empresaId, onRefresh, membro }) {
  const [modal, setModal] = useState(false);
  const [modalSub, setModalSub] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subcats, setSubcats] = useState([]);
  const [expandido, setExpandido] = useState({});
  const [form, setForm] = useState({ nome:"", tipo:"despesa", cor:"#6366f1" });
  const [formSub, setFormSub] = useState({ nome:"", cor:"#6366f1" });
  const podeCriar=membro?.perfil!=="visualizador";
  const podeExcluir=membro?.perfil!=="visualizador";

  const carregarSubs=useCallback(async()=>{ try{ const data=await sb(`subcategorias?empresa_id=eq.${empresaId}&order=nome.asc`); setSubcats(data||[]); }catch(e){} },[empresaId]);
  useEffect(()=>{ carregarSubs(); },[carregarSubs]);

  const salvar=async()=>{ if(!form.nome)return alert("Preencha o nome."); setLoading(true); try{ await sb("categorias",{method:"POST",body:JSON.stringify({...form,empresa_id:empresaId})}); setModal(false);setForm({nome:"",tipo:"despesa",cor:"#6366f1"});onRefresh(); }catch(e){alert("Erro: "+e.message);} setLoading(false); };
  const salvarSub=async()=>{ if(!formSub.nome)return alert("Preencha o nome."); setLoading(true); try{ await sb("subcategorias",{method:"POST",body:JSON.stringify({...formSub,empresa_id:empresaId,categoria_id:modalSub.id})}); setModalSub(null);setFormSub({nome:"",cor:"#6366f1"});carregarSubs(); }catch(e){alert("Erro: "+e.message);} setLoading(false); };
  const excluir=async(id)=>{ if(!confirm("Excluir esta categoria?"))return; await sb(`categorias?id=eq.${id}`,{method:"DELETE",prefer:""});onRefresh();carregarSubs(); };
  const excluirSub=async(id)=>{ if(!confirm("Excluir subcategoria?"))return; await sb(`subcategorias?id=eq.${id}`,{method:"DELETE",prefer:""});carregarSubs(); };
  const toggle=(id)=>setExpandido(prev=>({...prev,[id]:!prev[id]}));

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
        <div><div style={{ fontSize:22, fontWeight:600, color:"#fff", marginBottom:4 }}>Categorias</div><div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>{categorias.length} categorias · {subcats.length} subcategorias</div></div>
        {podeCriar && <button onClick={()=>setModal(true)} style={{ background:"#6366f1", border:"none", borderRadius:8, padding:"9px 16px", color:"#fff", fontSize:13, fontWeight:500, cursor:"pointer" }}>+ Nova categoria</button>}
      </div>
      {categorias.length===0 && <div style={{ fontSize:13, color:"rgba(255,255,255,0.3)" }}>Nenhuma categoria. Crie a primeira!</div>}
      {categorias.map(cat=>{
        const subs=subcats.filter(s=>s.categoria_id===cat.id);
        const aberto=expandido[cat.id];
        return (
          <div key={cat.id} style={{ marginBottom:8 }}>
            <div style={{ background:"#1a1a2e", borderLeft:`3px solid ${cat.cor||"#6366f1"}`, border:"1px solid rgba(255,255,255,0.07)", borderRadius:aberto&&subs.length>0?"10px 10px 0 0":10, padding:"12px 14px", display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:"#fff", fontWeight:500 }}>{cat.nome}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", textTransform:"capitalize", marginTop:2 }}>{cat.tipo} · {subs.length} subcategoria{subs.length!==1?"s":""}</div>
              </div>
              {podeCriar && <button onClick={()=>setModalSub(cat)} style={{ background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.3)", borderRadius:6, padding:"4px 10px", color:"#818cf8", fontSize:11, cursor:"pointer" }}>+ Sub</button>}
              {subs.length>0 && <button onClick={()=>toggle(cat.id)} style={{ background:"rgba(255,255,255,0.05)", border:"none", borderRadius:6, padding:"4px 10px", color:"rgba(255,255,255,0.5)", fontSize:11, cursor:"pointer" }}>{aberto?"▲":"▼"}</button>}
              {podeExcluir && <button onClick={()=>excluir(cat.id)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.2)", cursor:"pointer", fontSize:14 }}>🗑</button>}
            </div>
            {aberto && subs.map((sub,i)=>(
              <div key={sub.id} style={{ background:"#13131f", borderLeft:`3px solid ${sub.cor||cat.cor||"#6366f1"}`, border:"1px solid rgba(255,255,255,0.05)", borderTop:"none", borderRadius:i===subs.length-1?"0 0 10px 10px":0, padding:"9px 14px 9px 24px", display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:sub.cor||"#6366f1", flexShrink:0 }} />
                <div style={{ flex:1, fontSize:12, color:"rgba(255,255,255,0.7)" }}>{sub.nome}</div>
                {podeExcluir && <button onClick={()=>excluirSub(sub.id)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.2)", cursor:"pointer", fontSize:13 }}>🗑</button>}
              </div>
            ))}
          </div>
        );
      })}
      {modal && (<Modal titulo="Nova categoria" onClose={()=>setModal(false)}><Campo label="Nome"><input style={inputStyle} value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} placeholder="Ex: Alimentação" /></Campo><Campo label="Tipo"><div style={{ display:"flex", gap:8 }}>{["despesa","receita"].map(t=>(<button key={t} onClick={()=>setForm({...form,tipo:t})} style={{ flex:1, padding:"9px", borderRadius:7, border:`1px solid ${form.tipo===t?"#6366f1":"rgba(255,255,255,0.1)"}`, background:form.tipo===t?"rgba(99,102,241,0.15)":"transparent", color:form.tipo===t?"#818cf8":"rgba(255,255,255,0.4)", fontSize:13, cursor:"pointer", textTransform:"capitalize" }}>{t}</button>))}</div></Campo><Campo label="Cor"><div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>{CORES.map(cor=><div key={cor} onClick={()=>setForm({...form,cor})} style={{ width:28, height:28, borderRadius:"50%", background:cor, cursor:"pointer", border:form.cor===cor?"3px solid #fff":"2px solid transparent" }} />)}</div></Campo><BtnRow onCancel={()=>setModal(false)} onSave={salvar} loading={loading} /></Modal>)}
      {modalSub && (<Modal titulo={`Nova subcategoria em "${modalSub.nome}"`} onClose={()=>setModalSub(null)}><Campo label="Nome"><input style={inputStyle} value={formSub.nome} onChange={e=>setFormSub({...formSub,nome:e.target.value})} placeholder="Ex: Supermercado" /></Campo><Campo label="Cor"><div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>{CORES.map(cor=><div key={cor} onClick={()=>setFormSub({...formSub,cor})} style={{ width:28, height:28, borderRadius:"50%", background:cor, cursor:"pointer", border:formSub.cor===cor?"3px solid #fff":"2px solid transparent" }} />)}</div></Campo><BtnRow onCancel={()=>setModalSub(null)} onSave={salvarSub} loading={loading} /></Modal>)}
    </div>
  );
}

// ── Relatórios ─────────────────────────────────────────────────────────────────
function Relatorios({ lancamentos, categorias }) {
  const hoje=new Date().toISOString().split("T")[0];
  const primeiroDia=new Date().toISOString().slice(0,7)+"-01";
  const [aba, setAba]=useState("balancete");
  const [inicio, setInicio]=useState(primeiroDia);
  const [fim, setFim]=useState(hoje);
  const [filtroTipo, setFiltroTipo]=useState("todos");
  const [filtroCat, setFiltroCat]=useState("");

  const filtrados=useMemo(()=>lancamentos.filter(l=>{ if(inicio&&l.data<inicio)return false; if(fim&&l.data>fim)return false; if(filtroTipo!=="todos"&&l.tipo!==filtroTipo)return false; if(filtroCat&&l.categoria_id!==filtroCat)return false; return true; }),[lancamentos,inicio,fim,filtroTipo,filtroCat]);

  const rec=filtrados.filter(l=>l.tipo==="receita").reduce((s,l)=>s+Number(l.valor),0);
  const desp=filtrados.filter(l=>l.tipo==="despesa").reduce((s,l)=>s+Number(l.valor),0);
  const res=rec-desp;

  const porCat=categorias.map(cat=>({ ...cat, total:filtrados.filter(l=>l.categoria_id===cat.id&&l.tipo==="despesa").reduce((s,l)=>s+Number(l.valor),0) })).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);
  const porCatRec=categorias.map(cat=>({ ...cat, total:filtrados.filter(l=>l.categoria_id===cat.id&&l.tipo==="receita").reduce((s,l)=>s+Number(l.valor),0) })).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);

  const porDia=useMemo(()=>{ const d={}; filtrados.forEach(l=>{ if(!d[l.data])d[l.data]={rec:0,desp:0}; if(l.tipo==="receita")d[l.data].rec+=Number(l.valor); else d[l.data].desp+=Number(l.valor); }); return Object.entries(d).sort((a,b)=>a[0].localeCompare(b[0])); },[filtrados]);

  const abas=[{id:"balancete",label:"Balancete"},{id:"caixa",label:"Caixa"},{id:"dre",label:"DRE"},{id:"categorias_rel",label:"Por Categoria"}];
  const dias=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

  return (
    <div>
      <div style={{ fontSize:22, fontWeight:600, color:"#fff", marginBottom:4 }}>Relatórios</div>
      <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:18 }}>Análise financeira por período</div>
      <div style={{ display:"flex", gap:6, marginBottom:16, borderBottom:"1px solid rgba(255,255,255,0.07)", paddingBottom:12 }}>
        {abas.map(a=>(<button key={a.id} onClick={()=>setAba(a.id)} style={{ padding:"7px 16px", borderRadius:7, border:`1px solid ${aba===a.id?"#6366f1":"rgba(255,255,255,0.1)"}`, background:aba===a.id?"rgba(99,102,241,0.18)":"transparent", color:aba===a.id?"#818cf8":"rgba(255,255,255,0.45)", fontSize:13, cursor:"pointer", fontWeight:aba===a.id?500:400 }}>{a.label}</button>))}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:12, background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"12px 16px", marginBottom:14, flexWrap:"wrap" }}>
        {[["De",inicio,setInicio],["Até",fim,setFim]].map(([label,val,set])=>(<div key={label} style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>{label}</span><input type="date" value={val} onChange={e=>set(e.target.value)} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"6px 10px", color:"#fff", fontSize:12, outline:"none" }} /></div>))}
        <button onClick={()=>{setInicio(primeiroDia);setFim(hoje);}} style={{ background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.3)", borderRadius:6, padding:"6px 12px", color:"#818cf8", fontSize:12, cursor:"pointer" }}>Mês atual</button>
      </div>
      <div style={{ display:"flex", gap:10, marginBottom:20 }}>
        <select style={{ ...selectStyle, width:"auto", minWidth:140 }} value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)}><option value="todos">Tipo: Todos</option><option value="receita">Receitas</option><option value="despesa">Despesas</option></select>
        <select style={{ ...selectStyle, width:"auto", minWidth:140 }} value={filtroCat} onChange={e=>setFiltroCat(e.target.value)}><option value="">Categoria: Todas</option>{categorias.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
        {[["Receitas",rec,"#34d399"],["Despesas",desp,"#f87171"],["Resultado",res,res>=0?"#34d399":"#f87171"]].map(([l,v,c])=>(<div key={l} style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px 18px" }}><div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>{l}</div><div style={{ fontSize:20, fontWeight:600, color:c }}>{fmt(v)}</div></div>))}
      </div>

      {aba==="balancete" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 }}>
            <div style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.5)", marginBottom:14, textTransform:"uppercase", letterSpacing:"0.06em" }}>Despesas por categoria</div>
            {porCat.length===0 && <div style={{ color:"rgba(255,255,255,0.25)", fontSize:13 }}>Sem dados.</div>}
            {porCat.map(cat=>(<div key={cat.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}><div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:8, height:8, borderRadius:2, background:cat.cor||"#6366f1" }} /><span style={{ fontSize:13, color:"rgba(255,255,255,0.75)" }}>{cat.nome}</span></div><div style={{ textAlign:"right" }}><div style={{ fontSize:13, fontWeight:500, color:"#f87171" }}>{fmt(cat.total)}</div><div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>{desp?((cat.total/desp)*100).toFixed(1):0}%</div></div></div>))}
            {desp>0 && <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0 0", marginTop:4, borderTop:"1px solid rgba(255,255,255,0.1)" }}><span style={{ fontSize:13, fontWeight:500, color:"#fff" }}>Total</span><span style={{ fontSize:13, fontWeight:600, color:"#f87171" }}>{fmt(desp)}</span></div>}
          </div>
          <div style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 }}>
            <div style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.5)", marginBottom:14, textTransform:"uppercase", letterSpacing:"0.06em" }}>Receitas por categoria</div>
            {porCatRec.length===0 && <div style={{ color:"rgba(255,255,255,0.25)", fontSize:13 }}>Sem dados.</div>}
            {porCatRec.map(cat=>(<div key={cat.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}><div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:8, height:8, borderRadius:2, background:cat.cor||"#6366f1" }} /><span style={{ fontSize:13, color:"rgba(255,255,255,0.75)" }}>{cat.nome}</span></div><div style={{ fontSize:13, fontWeight:500, color:"#34d399" }}>{fmt(cat.total)}</div></div>))}
          </div>
        </div>
      )}

      {aba==="caixa" && (
        <div style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.02)" }}>{["Data","Dia","Entradas","Saídas","Saldo do dia","Saldo acum."].map(h=>(<th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:10, color:"rgba(255,255,255,0.35)", fontWeight:500, textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</th>))}</tr></thead>
            <tbody>
              {porDia.length===0 && <tr><td colSpan={6} style={{ padding:24, textAlign:"center", color:"rgba(255,255,255,0.25)", fontSize:13 }}>Sem movimentações.</td></tr>}
              {(()=>{ let acum=0; return porDia.map(([data,v])=>{ const sd=v.rec-v.desp; acum+=sd; const [y,m,d]=data.split("-"); const ds=dias[new Date(Number(y),Number(m)-1,Number(d)).getDay()]; return (<tr key={data} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}><td style={{ padding:"10px 14px", fontSize:12, color:"rgba(255,255,255,0.5)" }}>{d}/{m}/{y}</td><td style={{ padding:"10px 14px", fontSize:12, color:"rgba(255,255,255,0.5)" }}>{ds}</td><td style={{ padding:"10px 14px", fontSize:12, color:"#34d399", fontWeight:500 }}>{v.rec>0?fmt(v.rec):"—"}</td><td style={{ padding:"10px 14px", fontSize:12, color:"#f87171", fontWeight:500 }}>{v.desp>0?fmt(v.desp):"—"}</td><td style={{ padding:"10px 14px", fontSize:12, fontWeight:600, color:sd>=0?"#34d399":"#f87171" }}>{fmt(sd)}</td><td style={{ padding:"10px 14px", fontSize:12, fontWeight:600, color:acum>=0?"#818cf8":"#f87171" }}>{fmt(acum)}</td></tr>); }); })()}
            </tbody>
          </table>
        </div>
      )}

      {aba==="dre" && (
        <div style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:24 }}>
          <div style={{ fontSize:11, fontWeight:500, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:16 }}>DRE — {inicio} a {fim}</div>
          <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}><span style={{ fontSize:13, color:"rgba(255,255,255,0.65)" }}>( + ) Receita bruta</span><span style={{ fontSize:13, color:"#34d399", fontWeight:500 }}>{fmt(rec)}</span></div>
          {porCat.map(cat=>(<div key={cat.id} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0 9px 14px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}><span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>( − ) {cat.nome}</span><span style={{ fontSize:12, color:"#f87171" }}>({fmt(cat.total)})</span></div>))}
          {porCat.length===0 && <div style={{ padding:"9px 0 9px 14px", fontSize:12, color:"rgba(255,255,255,0.25)" }}>Nenhuma despesa.</div>}
          <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderTop:"1px solid rgba(255,255,255,0.1)", marginTop:6 }}><span style={{ fontSize:13, color:"rgba(255,255,255,0.65)" }}>( = ) Despesas totais</span><span style={{ fontSize:13, color:"#f87171", fontWeight:500 }}>({fmt(desp)})</span></div>
          <div style={{ display:"flex", justifyContent:"space-between", padding:"14px 0 4px", borderTop:"2px solid rgba(255,255,255,0.15)", marginTop:4 }}><span style={{ fontSize:15, color:"#fff", fontWeight:500 }}>( = ) Resultado líquido</span><div style={{ textAlign:"right" }}><div style={{ fontSize:22, fontWeight:600, color:res>=0?"#34d399":"#f87171" }}>{fmt(res)}</div><div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>Margem: {rec?((res/rec)*100).toFixed(1):"0.0"}%</div></div></div>
        </div>
      )}

      {aba==="categorias_rel" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {[["Receitas por categoria",porCatRec,rec,"#34d399"],["Despesas por categoria",porCat,desp,"#f87171"]].map(([titulo,dados,total,cor])=>(
            <div key={titulo} style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 }}>
              <div style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.5)", marginBottom:14, textTransform:"uppercase", letterSpacing:"0.06em" }}>{titulo}</div>
              {dados.length===0 && <div style={{ color:"rgba(255,255,255,0.25)", fontSize:13 }}>Sem dados.</div>}
              {dados.map(cat=>(<div key={cat.id} style={{ marginBottom:12 }}><div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>{cat.nome}</span><span style={{ fontSize:12, color:cor }}>{fmt(cat.total)}</span></div><div style={{ height:4, background:"rgba(255,255,255,0.07)", borderRadius:999 }}><div style={{ width:`${total?(cat.total/total*100):0}%`, height:"100%", background:cat.cor||cor, borderRadius:999 }} /></div></div>))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Usuários ───────────────────────────────────────────────────────────────────
function Usuarios({ empresa, userId }) {
  const [membros, setMembros] = useState([]);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email:"", perfil:"financeiro" });

  const carregar = useCallback(async () => {
    try { const data=await sb(`membros?empresa_id=eq.${empresa.id}&order=created_at.asc`); setMembros(data||[]); }
    catch(e){}
  }, [empresa.id]);

  useEffect(()=>{ carregar(); },[carregar]);

  const [linkGerado, setLinkGerado] = useState("");

  const convidar = async () => {
    if (!form.email) return alert("Digite o e-mail.");
    setLoading(true);
    try {
      await sb("convites", { method:"POST", body:JSON.stringify({ empresa_id:empresa.id, email:form.email, perfil:form.perfil }) });
      const link = `${window.location.origin}?convite=${encodeURIComponent(form.email)}`;
      setLinkGerado(link);
      carregar();
    } catch(e) { alert("Erro: "+e.message); }
    setLoading(false);
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(linkGerado);
    alert("Link copiado! Agora é só colar no WhatsApp.");
  };

  const remover = async (id, uid) => {
    if (uid === userId) return alert("Você não pode remover a si mesmo.");
    if (!confirm("Remover este membro?")) return;
    await sb(`membros?id=eq.${id}`, { method:"DELETE", prefer:"" }); carregar();
  };

  const perfilCor = { admin:"#f87171", financeiro:"#34d399", visualizador:"#818cf8" };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
        <div><div style={{ fontSize:22, fontWeight:600, color:"#fff", marginBottom:4 }}>Usuários</div><div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>{membros.length} membros da empresa</div></div>
        <button onClick={()=>setModal(true)} style={{ background:"#6366f1", border:"none", borderRadius:8, padding:"9px 16px", color:"#fff", fontSize:13, fontWeight:500, cursor:"pointer" }}>+ Convidar usuário</button>
      </div>

      <div style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>{["E-mail","Nome","Perfil","Desde",""].map(h=>(<th key={h} style={{ padding:"11px 16px", textAlign:"left", fontSize:10, color:"rgba(255,255,255,0.35)", fontWeight:500, textTransform:"uppercase" }}>{h}</th>))}</tr></thead>
          <tbody>
            {membros.map(m=>(<tr key={m.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
              <td style={{ padding:"12px 16px", fontSize:13, color:"#fff" }}>{m.email}</td>
              <td style={{ padding:"12px 16px", fontSize:13, color:"rgba(255,255,255,0.5)" }}>{m.nome||"—"}</td>
              <td style={{ padding:"12px 16px" }}><span style={{ background:(perfilCor[m.perfil]||"#6366f1")+"22", color:perfilCor[m.perfil]||"#6366f1", padding:"3px 10px", borderRadius:5, fontSize:12, textTransform:"capitalize" }}>{m.perfil}</span></td>
              <td style={{ padding:"12px 16px", fontSize:12, color:"rgba(255,255,255,0.35)" }}>{new Date(m.created_at).toLocaleDateString("pt-BR")}</td>
              <td style={{ padding:"12px 16px" }}>{m.user_id!==userId && <button onClick={()=>remover(m.id,m.user_id)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.2)", cursor:"pointer", fontSize:14 }}>🗑</button>}</td>
            </tr>))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal titulo="Convidar usuário" onClose={()=>{ setModal(false); setLinkGerado(""); setForm({email:"", perfil:"financeiro"}); }}>
          {!linkGerado ? (
            <>
              <div style={{ background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:8, padding:"12px 14px", fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:16 }}>
                Preencha o e-mail e perfil. Vamos gerar um link para você enviar pelo WhatsApp!
              </div>
              <Campo label="E-mail do usuário"><input style={inputStyle} type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@exemplo.com" /></Campo>
              <Campo label="Perfil de acesso">
                <div style={{ display:"flex", gap:8 }}>
                  {[["financeiro","Financeiro","#34d399"],["visualizador","Visualizador","#818cf8"]].map(([v,l,c])=>(<button key={v} onClick={()=>setForm({...form,perfil:v})} style={{ flex:1, padding:"9px", borderRadius:7, border:`1px solid ${form.perfil===v?c:"rgba(255,255,255,0.1)"}`, background:form.perfil===v?c+"22":"transparent", color:form.perfil===v?c:"rgba(255,255,255,0.4)", fontSize:13, cursor:"pointer" }}>{l}</button>))}
                </div>
              </Campo>
              <BtnRow onCancel={()=>setModal(false)} onSave={convidar} loading={loading} />
            </>
          ) : (
            <>
              <div style={{ background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.3)", borderRadius:8, padding:"12px 14px", fontSize:13, color:"#34d399", marginBottom:16 }}>
                ✓ Convite registrado para <strong>{form.email}</strong>
              </div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:10 }}>
                Copie o link abaixo e envie pelo WhatsApp:
              </div>
              <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"12px 14px", fontSize:12, color:"#818cf8", wordBreak:"break-all", marginBottom:14, fontFamily:"monospace" }}>
                {linkGerado}
              </div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:16 }}>
                ⚠️ A pessoa deve se cadastrar usando exatamente o e-mail <strong style={{ color:"#fff" }}>{form.email}</strong>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>{ setModal(false); setLinkGerado(""); setForm({email:"", perfil:"financeiro"}); }} style={{ flex:1, padding:"11px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:13 }}>Fechar</button>
                <button onClick={copiarLink} style={{ flex:1, padding:"11px", borderRadius:8, border:"none", background:"#6366f1", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:500 }}>📋 Copiar link</button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

// ── App principal ──────────────────────────────────────────────────────────────
export default function App() {
  const [tema, setTema] = useState(() => localStorage.getItem("prt_tema") || "escuro");
  const trocarTema = () => { const novo = tema === "escuro" ? "claro" : "escuro"; setTema(novo); localStorage.setItem("prt_tema", novo); };
  const [user, setUser] = useState(()=>{ try{return JSON.parse(localStorage.getItem("sb_user"));}catch{return null;} });
  const [empresa, setEmpresa] = useState(null);
  const [membro, setMembro] = useState(null);
  const [tela, setTela] = useState("dashboard");
  const [dados, setDados] = useState({ lancamentos:[], contas:[], investimentos:[], orcamento:[], categorias:[], subcategorias:[] });
  const [carregando, setCarregando] = useState(false);
  const [verificando, setVerificando] = useState(true);

  // Verifica se usuário já tem empresa
  useEffect(()=>{
    if (!user) { setVerificando(false); return; }
    const verificar = async () => {
      try {
        const membros = await sb(`membros?user_id=eq.${user.id}&limit=1`);
        if (membros && membros.length > 0) {
          const m = membros[0];
          const empresas = await sb(`empresas?id=eq.${m.empresa_id}&limit=1`);
          if (empresas && empresas.length > 0) {
            setEmpresa(empresas[0]);
            setMembro(m);
          }
        } else {
          // Check if there's a convite for this email
          const convites = await sb(`convites?email=eq.${user.email}&aceito=eq.false&limit=1`);
          if (convites && convites.length > 0) {
            const convite = convites[0];
            // Auto-join empresa
            await sb("membros", { method:"POST", body:JSON.stringify({ empresa_id:convite.empresa_id, user_id:user.id, email:user.email, nome:user.email.split("@")[0], perfil:convite.perfil }) });
            await sb(`convites?id=eq.${convite.id}`, { method:"PATCH", body:JSON.stringify({ aceito:true }) });
            const empresas = await sb(`empresas?id=eq.${convite.empresa_id}&limit=1`);
            if (empresas && empresas.length > 0) {
              const novoMembro = await sb(`membros?user_id=eq.${user.id}&limit=1`);
              setEmpresa(empresas[0]);
              setMembro(novoMembro[0]);
            }
          }
        }
      } catch(e) { console.error(e); }
      setVerificando(false);
    };
    verificar();
  }, [user]);

  const carregar = useCallback(async () => {
    if (!empresa) return;
    setCarregando(true);
    try {
      const eid = empresa.id;
      const [lancamentos, contas, investimentos, orcamento, categorias, subcategorias] = await Promise.all([
        sb(`lancamentos?empresa_id=eq.${eid}&order=data.desc`),
        sb(`contas?empresa_id=eq.${eid}&order=nome.asc`),
        sb(`investimentos?empresa_id=eq.${eid}&order=nome.asc`),
        sb(`orcamento?empresa_id=eq.${eid}&order=ano.desc,mes.desc`),
        sb(`categorias?empresa_id=eq.${eid}&order=nome.asc`),
        sb(`subcategorias?empresa_id=eq.${eid}&order=nome.asc`),
      ]);
      setDados({ lancamentos, contas, investimentos, orcamento, categorias, subcategorias });
    } catch(e) { console.error(e); }
    setCarregando(false);
  }, [empresa]);

  useEffect(()=>{ carregar(); },[carregar]);

  const logout = () => { localStorage.removeItem("sb_token"); localStorage.removeItem("sb_user"); setUser(null); setEmpresa(null); setMembro(null); };

  if (!user) return <LoginScreen onLogin={u=>setUser(u)} />;
  if (verificando) return (<div style={{ minHeight:"100vh", background:"#0a0a0f", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.5)", fontFamily:"'DM Sans', sans-serif", fontSize:14 }}><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />Verificando acesso...</div>);
  if (!empresa) return <EmpresaSetup user={user} onEmpresa={(emp, perfil) => { setEmpresa(emp); setMembro({ perfil }); }} />;

  const props = { ...dados, empresaId:empresa.id, userId:user.id, onRefresh:carregar, membro };

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"'DM Sans', sans-serif", background:"#0a0a0f", color:"#fff", transition:"background 0.3s, color 0.3s" }}>
      <Sidebar tela={tela} setTela={setTela} user={user} empresa={empresa} membro={membro} onLogout={logout} />
      <div style={{ flex:1, overflowY:"auto" }}>
        <div style={{ padding:"28px 32px", maxWidth:1100 }}>
          {carregando ? (
            <div style={{ color:"rgba(255,255,255,0.3)", fontSize:14, paddingTop:40 }}>Carregando...</div>
          ) : (
            <>
              {tela==="dashboard"     && <Dashboard {...props} />}
              {tela==="lancamentos"   && <Lancamentos {...props} />}
              {tela==="contas_pagar"  && <ContasPagar {...props} />}
              {tela==="contas"        && <Contas {...props} />}
              {tela==="investimentos" && <Investimentos {...props} />}
              {tela==="orcamento"     && <Orcamento {...props} />}
              {tela==="relatorios"    && <Relatorios {...props} />}
              {tela==="categorias"    && <Categorias {...props} />}
              {tela==="usuarios"      && <Usuarios empresa={empresa} userId={user.id} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
