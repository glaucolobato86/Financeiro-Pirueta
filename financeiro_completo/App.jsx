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

// Injeta fonte robusta

const CORES = ["#6366f1","#e07b54","#7b6cf0","#e0b454","#54b0e0","#34d399","#e054a0","#f87171","#a78bfa","#fbbf24"];
const inputStyle = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" };
const selectStyle = { ...inputStyle, background: "#1e1e2e", color: "#fff" };
const optionStyle = { background: "#1e1e2e", color: "#fff" };

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
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Black+Han+Sans&display=swap" rel="stylesheet" />
      <div style={{ width: 400, background: "#13131a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "48px 40px" }}>
        <div style={{ fontSize:32, fontWeight:300, letterSpacing:"0.15em", color:"#f59e0b", marginBottom:20 }}>PRT <span style={{ color:"#fff" }}>FINANCE</span></div>
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
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Black+Han+Sans&display=swap" rel="stylesheet" />
      <div style={{ width:440, background:"#13131a", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:"40px" }}>
        <div style={{ fontSize:30, fontWeight:300, letterSpacing:"0.15em", color:"#f59e0b", marginBottom:16 }}>PRT <span style={{ color:"#fff" }}>FINANCE</span></div>
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
        <button onClick={onLogout} style={{ marginTop:16, background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:11, cursor:"pointer", width:"100%", textAlign:"center", textDecoration:"underline" }}>
          Sair e voltar ao login
        </button>
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
  { id:"dashboard",    label:"Dashboard",     icon:"📊", single:true },
  { id:"financeiro",   label:"Financeiro",    icon:"💰", single:false, items:[
    { id:"lancamentos",    label:"Lançamentos",      icon:"📋" },
    { id:"contas_pagar",   label:"Contas a Pagar",   icon:"📅" },
    { id:"contas_receber", label:"Contas a Receber",  icon:"📥" },
  ]},
  { id:"relatorios",   label:"Relatórios",    icon:"📈", single:false, items:[
    { id:"dre",          label:"DRE",             icon:"📑" },
    { id:"fluxo_caixa",  label:"Fluxo de Caixa",  icon:"💸" },
    { id:"por_cliente",  label:"Por Cliente",      icon:"👤" },
    { id:"por_projeto",  label:"Por Projeto",      icon:"📁" },
  ]},
  { id:"cadastros",    label:"Cadastros",     icon:"🗂️", single:false, items:[
    { id:"clientes",     label:"Clientes",         icon:"👤" },
    { id:"fornecedores", label:"Fornecedores",      icon:"🏭" },
    { id:"projetos",     label:"Projetos",          icon:"📁" },
    { id:"categorias",   label:"Categorias",        icon:"🏷️" },
  ]},
  { id:"contas",       label:"Contas",        icon:"💳", single:true },
  { id:"usuarios",     label:"Usuários",      icon:"👥", single:true, apenasAdmin:true },
];

function Sidebar({ tela, setTela, user, empresa, membro, onLogout }) {
  const telaToGrupo = (t) => { for (const m of MENU) { if (!m.single && m.items?.some(i=>i.id===t)) return m.id; } return null; };
  const [abertos, setAbertos] = useState(() => { const g=telaToGrupo(tela); const init={}; MENU.forEach(m=>{ if(!m.single) init[m.id]=m.id===g; }); return init; });
  const toggle = (id) => setAbertos(prev=>({...prev,[id]:!prev[id]}));
  const isAdmin = membro?.perfil === "admin";

  return (
    <div style={{ width:230, background:"#13131a", borderRight:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", flexShrink:0, position:"sticky", top:0, height:"100vh" }}>
      <div style={{ padding:"18px 20px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize:22, fontWeight:300, letterSpacing:"0.15em", color:"#f59e0b", marginBottom:8 }}>PRT <span style={{ color:"#fff" }}>FINANCE</span></div>
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

// ── Contas a Receber ────────────────────────────────────────────────────────
function ContasReceber({ categorias, clientes, projetos, contas, empresaId, userId, onRefresh, membro }) {
  const [lista, setLista] = useState([]);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [nf, setNf] = useState(null);
  const [comp, setComp] = useState(null);
  const [preview, setPreview] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const hoje = new Date().toISOString().split("T")[0];
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const fmtData = (data) => { const[y,m,d]=data.split("-"); return{dia:d,mes:meses[Number(m)-1],ano:y}; };

  const [form, setForm] = useState({
    descricao:"", valor:"", vencimento:"", categoria_id:"", cliente_id:"", projeto_id:"", conta_id:"", observacao:"",
    modo:"unico", parcelas:2, recorrencia_meses:12
  });
  const podeCriar  = membro?.perfil !== "visualizador";
  const podeExcluir = membro?.perfil !== "visualizador";

  const carregar = useCallback(async () => {
    setCarregando(true);
    try { const d = await sb(`contas_receber?empresa_id=eq.${empresaId}&order=vencimento.asc`); setLista(d||[]); }
    catch(e){ console.error(e); }
    setCarregando(false);
  }, [empresaId]);

  useEffect(()=>{ carregar(); },[carregar]);

  const getStatus = (c) => {
    if(c.status==="recebido") return "recebido";
    if(c.vencimento < hoje) return "vencido";
    const diff = (new Date(c.vencimento)-new Date())/(1000*60*60*24);
    if(diff<=5) return "avencer";
    return "aberto";
  };
  const statusInfo = {
    recebido: { label:"Recebido",  cor:"#34d399", bg:"rgba(52,211,153,0.15)",  icon:"✓" },
    vencido:  { label:"Vencido",   cor:"#f87171", bg:"rgba(248,113,113,0.15)", icon:"⚠" },
    avencer:  { label:"A receber", cor:"#fbbf24", bg:"rgba(251,191,36,0.15)",  icon:"⏰" },
    aberto:   { label:"Em aberto", cor:"#818cf8", bg:"rgba(129,140,248,0.15)", icon:"○" },
  };

  const marcarRecebido = async (item) => {
    if(!confirm("Marcar como recebido e lançar no financeiro?")) return;
    // Cria lançamento de receita
    await sb("lancamentos", { method:"POST", body:JSON.stringify({
      descricao: item.descricao,
      valor: item.valor,
      tipo: "entrada",
      tipo_lancamento: "receita_operacional",
      data_competencia: hoje,
      data_pagamento: hoje,
      impacta_dre: true,
      impacta_caixa: true,
      empresa_id: empresaId,
      criado_por: userId,
      categoria_id: item.categoria_id||null,
      cliente_id: item.cliente_id||null,
      projeto_id: item.projeto_id||null,
      conta_id: item.conta_id||null,
      observacao: item.observacao||null,
      nf_url: item.nf_url||null,
      nf_nome: item.nf_nome||null,
    })});
    // Marca como recebido
    await sb(`contas_receber?id=eq.${item.id}`, { method:"PATCH", body:JSON.stringify({ status:"recebido", recebido_em:hoje }) });
    carregar();
    onRefresh();
  };

  const excluir = async (id) => { if(!confirm("Excluir?"))return; await sb(`contas_receber?id=eq.${id}`,{method:"DELETE",prefer:""}); carregar(); };
  const excluirGrupo = async (recorrencia_id) => {
    if(!confirm("Cancelar todos os recebimentos futuros desta recorrência?"))return;
    await sb(`contas_receber?recorrencia_id=eq.${recorrencia_id}&vencimento=gt.${hoje}&status=eq.aberto`,{method:"DELETE",prefer:""});
    carregar();
  };

  const salvar = async () => {
    if(!form.descricao||!form.valor||!form.vencimento) return alert("Preencha descrição, valor e vencimento.");
    setLoading(true);
    try {
      let nf_url=null,nf_nome=null,comprovante_url=null,comprovante_nome=null;
      if(nf){const r=await uploadArquivo(nf,userId);nf_url=r.url;nf_nome=r.nome;}
      if(comp){const r=await uploadArquivo(comp,userId);comprovante_url=r.url;comprovante_nome=r.nome;}
      const base = { empresa_id:empresaId, criado_por:userId, descricao:form.descricao, observacao:form.observacao,
        categoria_id:form.categoria_id||null, cliente_id:form.cliente_id||null,
        projeto_id:form.projeto_id||null, conta_id:form.conta_id||null,
        nf_url, nf_nome, comprovante_url, comprovante_nome };
      const addMeses = (dataStr,n) => { const d=new Date(dataStr+"T12:00:00"); d.setMonth(d.getMonth()+n); return d.toISOString().split("T")[0]; };

      if(form.modo==="unico") {
        await sb("contas_receber",{method:"POST",body:JSON.stringify({...base,valor:Number(form.valor),vencimento:form.vencimento,status:"aberto"})});
      } else if(form.modo==="parcelado") {
        const n=Number(form.parcelas)||2;
        const vp=Math.round((Number(form.valor)/n)*100)/100;
        const rid=crypto.randomUUID();
        for(let i=0;i<n;i++){
          await sb("contas_receber",{method:"POST",body:JSON.stringify({...base,valor:vp,vencimento:addMeses(form.vencimento,i),status:"aberto",recorrencia_id:rid,parcela_atual:i+1,total_parcelas:n,descricao:`${form.descricao} (${i+1}/${n})`})});
        }
      } else if(form.modo==="recorrente") {
        const n=Number(form.recorrencia_meses)||12;
        const rid=crypto.randomUUID();
        for(let i=0;i<n;i++){
          await sb("contas_receber",{method:"POST",body:JSON.stringify({...base,valor:Number(form.valor),vencimento:addMeses(form.vencimento,i),status:"aberto",recorrencia_id:rid,parcela_atual:i+1,total_parcelas:n})});
        }
      }
      setModal(false); setNf(null); setComp(null);
      setForm({descricao:"",valor:"",vencimento:"",categoria_id:"",cliente_id:"",projeto_id:"",conta_id:"",observacao:"",modo:"unico",parcelas:2,recorrencia_meses:12});
      carregar();
    } catch(e){ alert("Erro: "+e.message); }
    setLoading(false);
  };

  const filtrada = lista.filter(c=>filtroStatus==="todos"||getStatus(c)===filtroStatus);
  const totalAberto = lista.filter(c=>getStatus(c)!=="recebido").reduce((s,c)=>s+Number(c.valor),0);
  const totalRecebido = lista.filter(c=>c.status==="recebido").reduce((s,c)=>s+Number(c.valor),0);
  const porDia = {};
  filtrada.forEach(c=>{ if(!porDia[c.vencimento])porDia[c.vencimento]=[]; porDia[c.vencimento].push(c); });
  const diasOrdenados = Object.entries(porDia).sort((a,b)=>a[0].localeCompare(b[0]));

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:600, color:"#fff", marginBottom:4 }}>Contas a Receber</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>{lista.length} registros</div>
        </div>
        {podeCriar && <button onClick={()=>setModal(true)} style={{ background:"#6366f1", border:"none", borderRadius:8, padding:"9px 16px", color:"#fff", fontSize:13, fontWeight:500, cursor:"pointer" }}>+ Novo recebimento</button>}
      </div>

      {/* Totais */}
      <div style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 20px", marginBottom:16, display:"flex", gap:28, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Resumo</div>
        {[["A Receber",totalAberto,"#818cf8"],["Já Recebido",totalRecebido,"#34d399"],["Total",totalAberto+totalRecebido,"#fff"]].map(([l,v,c])=>(
          <div key={l}><div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", marginBottom:3 }}>{l}</div><div style={{ fontSize:15, fontWeight:600, color:c }}>{fmt(v)}</div></div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display:"flex", gap:7, marginBottom:16 }}>
        {[["todos","Todos"],["aberto","Em aberto"],["avencer","A vencer"],["vencido","Vencidos"],["recebido","Recebidos"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFiltroStatus(v)} style={{ padding:"6px 12px", borderRadius:7, border:`1px solid ${filtroStatus===v?"#6366f1":"rgba(255,255,255,0.1)"}`, background:filtroStatus===v?"rgba(99,102,241,0.15)":"transparent", color:filtroStatus===v?"#818cf8":"rgba(255,255,255,0.4)", fontSize:12, cursor:"pointer" }}>{l}</button>
        ))}
      </div>

      {carregando && <div style={{ color:"rgba(255,255,255,0.3)", padding:20 }}>Carregando...</div>}

      {diasOrdenados.map(([data,itens])=>{
        const {dia,mes,ano} = fmtData(data);
        const totalDia = itens.reduce((s,c)=>s+Number(c.valor),0);
        return (
          <div key={data} style={{ display:"flex", gap:14, marginBottom:16 }}>
            <div style={{ width:48, textAlign:"center", flexShrink:0 }}>
              <div style={{ fontSize:20, fontWeight:700, color:"#fff", lineHeight:1 }}>{dia}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{mes}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)" }}>{ano}</div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginBottom:6, textAlign:"right" }}>Total do dia: {fmt(totalDia)}</div>
              {itens.map(c=>{
                const st = getStatus(c);
                const si = statusInfo[st];
                const cli = clientes.find(x=>x.id===c.cliente_id);
                const proj = projetos.find(x=>x.id===c.projeto_id);
                const cat = categorias.find(x=>x.id===c.categoria_id);
                return (
                  <div key={c.id} style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"12px 14px", marginBottom:8, display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ background:si.bg, border:`1px solid ${si.cor}44`, borderRadius:6, padding:"3px 8px", fontSize:11, color:si.cor, fontWeight:500, whiteSpace:"nowrap", minWidth:80, textAlign:"center" }}>{si.icon} {si.label}</div>
                    {st!=="recebido" && podeCriar && (
                      <button onClick={()=>marcarRecebido(c)} title="Marcar como recebido" style={{ width:34, height:34, borderRadius:"50%", background:"#16a34a", border:"none", color:"#fff", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>💰</button>
                    )}
                    {st==="recebido" && <div style={{ width:34, height:34, borderRadius:"50%", background:"rgba(52,211,153,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:16 }}>✓</div>}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, color:"#fff", fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {c.descricao}
                        {c.total_parcelas>1 && <span style={{ marginLeft:6, fontSize:10, background:"rgba(99,102,241,0.15)", color:"#818cf8", padding:"1px 6px", borderRadius:4 }}>{c.parcela_atual}/{c.total_parcelas}</span>}
                      </div>
                      <div style={{ display:"flex", gap:6, marginTop:3, flexWrap:"wrap" }}>
                        {cat && <span style={{ fontSize:11, background:(cat.cor||"#6366f1")+"22", color:cat.cor||"#6366f1", padding:"1px 7px", borderRadius:4 }}>{cat.nome}</span>}
                        {cli && <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>👤 {cli.nome}</span>}
                        {proj && <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>📁 {proj.nome}</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      {c.nf_url && <button onClick={()=>verAnexo(c.nf_url,c.nf_nome||"NF",setPreview)} style={{ background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.3)", color:"#34d399", cursor:"pointer", fontSize:10, padding:"2px 8px", borderRadius:4 }}>📄 NF</button>}
                      {c.comprovante_url && <button onClick={()=>verAnexo(c.comprovante_url,c.comprovante_nome||"Comp.",setPreview)} style={{ background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.3)", color:"#34d399", cursor:"pointer", fontSize:10, padding:"2px 8px", borderRadius:4 }}>🧾 Comp.</button>}
                    </div>
                    <div style={{ fontSize:15, fontWeight:600, color:st==="recebido"?"#34d399":"#818cf8", minWidth:100, textAlign:"right" }}>+{fmt(c.valor)}</div>
                    <div style={{ display:"flex", gap:4 }}>
                      {c.recorrencia_id && st!=="recebido" && <button onClick={()=>excluirGrupo(c.recorrencia_id)} title="Cancelar série" style={{ background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:5, color:"#fbbf24", cursor:"pointer", fontSize:10, padding:"2px 7px" }}>⛔</button>}
                      {podeExcluir && <button onClick={()=>excluir(c.id)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.2)", cursor:"pointer", fontSize:14 }}>🗑</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <PreviewModal preview={preview} onClose={()=>setPreview(null)} />

      {modal && (
        <Modal titulo="Novo recebimento" onClose={()=>setModal(false)}>
          <Campo label="Descrição"><input style={inputStyle} value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})} placeholder="Ex: Fee mensal, Projeto X..." /></Campo>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Campo label="Valor (R$)"><input style={inputStyle} type="number" step="0.01" value={form.valor} onChange={e=>setForm({...form,valor:e.target.value})} /></Campo>
            <Campo label="Vencimento / Previsão"><input style={inputStyle} type="date" value={form.vencimento} onChange={e=>setForm({...form,vencimento:e.target.value})} /></Campo>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Campo label="Cliente">
              <select style={selectStyle} value={form.cliente_id} onChange={e=>setForm({...form,cliente_id:e.target.value})}>
                <option style={optionStyle} value="">Sem cliente</option>
                {clientes.map(c=><option style={optionStyle} key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Campo>
            <Campo label="Projeto">
              <select style={selectStyle} value={form.projeto_id} onChange={e=>setForm({...form,projeto_id:e.target.value})}>
                <option style={optionStyle} value="">Sem projeto</option>
                {projetos.map(p=><option style={optionStyle} key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </Campo>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Campo label="Categoria">
              <select style={selectStyle} value={form.categoria_id} onChange={e=>setForm({...form,categoria_id:e.target.value})}>
                <option style={optionStyle} value="">Sem categoria</option>
                {categorias.filter(c=>c.grupo==="receita_operacional").map(c=><option style={optionStyle} key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Campo>
            <Campo label="Conta bancária">
              <select style={selectStyle} value={form.conta_id} onChange={e=>setForm({...form,conta_id:e.target.value})}>
                <option style={optionStyle} value="">Sem conta</option>
                {contas.map(c=><option style={optionStyle} key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Campo>
          </div>
          <Campo label="Tipo de lançamento">
            <div style={{ display:"flex", gap:6 }}>
              {[["unico","Único"],["parcelado","Parcelado"],["recorrente","Recorrente"]].map(([v,l])=>(
                <button key={v} onClick={()=>setForm({...form,modo:v})} style={{ flex:1, padding:"9px 6px", borderRadius:8, border:`1px solid ${form.modo===v?"#6366f1":"rgba(255,255,255,0.1)"}`, background:form.modo===v?"rgba(99,102,241,0.2)":"transparent", color:form.modo===v?"#818cf8":"rgba(255,255,255,0.45)", fontSize:12, cursor:"pointer", fontWeight:form.modo===v?600:400 }}>{l}</button>
              ))}
            </div>
          </Campo>
          {form.modo==="parcelado" && (
            <Campo label="Número de parcelas">
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <input style={{ ...inputStyle, width:80 }} type="number" min="2" max="60" value={form.parcelas} onChange={e=>setForm({...form,parcelas:e.target.value})} />
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{form.valor?`${form.parcelas}x de ${fmt(Number(form.valor)/Number(form.parcelas))}`:`${form.parcelas} parcelas mensais`}</div>
              </div>
            </Campo>
          )}
          {form.modo==="recorrente" && (
            <Campo label="Duração (meses)">
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <input style={{ ...inputStyle, width:80 }} type="number" min="2" max="120" value={form.recorrencia_meses} onChange={e=>setForm({...form,recorrencia_meses:e.target.value})} />
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{form.recorrencia_meses} meses de {form.valor?fmt(Number(form.valor)):"R$ --"}</div>
              </div>
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


  const [form, setForm] = useState({ descricao:"", valor:"", vencimento:"", categoria_id:"", subcategoria_id:"", tipo_custo:"variavel", observacao:"",
    modo:"unico",        // "unico" | "parcelado" | "recorrente"
    parcelas:2,          // para modo parcelado
    recorrencia_meses:12 // para modo recorrente
  });
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
  const excluirGrupo=async(recorrencia_id)=>{
    if(!confirm("Cancelar todos os lançamentos futuros desta recorrência?"))return;
    const hoje2=new Date().toISOString().split("T")[0];
    await sb(`contas_pagar?recorrencia_id=eq.${recorrencia_id}&vencimento=gt.${hoje2}&status=eq.aberto`,{method:"DELETE",prefer:""});
    carregar();
  };

  const salvar=async()=>{
    if(!form.descricao||!form.valor||!form.vencimento)return alert("Preencha descrição, valor e vencimento.");
    setLoading(true);
    try{
      let nf_url=null,nf_nome=null,comprovante_url=null,comprovante_nome=null;
      if(nf){const r=await uploadArquivo(nf,userId);nf_url=r.url;nf_nome=r.nome;}
      if(comp){const r=await uploadArquivo(comp,userId);comprovante_url=r.url;comprovante_nome=r.nome;}
      const base={empresa_id:empresaId,criado_por:userId,categoria_id:form.categoria_id||null,subcategoria_id:form.subcategoria_id||null,nf_url,nf_nome,comprovante_url,comprovante_nome,tipo_custo:form.tipo_custo,descricao:form.descricao,observacao:form.observacao};
      const addMeses=(dataStr,n)=>{ const d=new Date(dataStr+"T12:00:00"); d.setMonth(d.getMonth()+n); return d.toISOString().split("T")[0]; };

      if(form.modo==="unico"){
        await sb("contas_pagar",{method:"POST",body:JSON.stringify({...base,valor:Number(form.valor),vencimento:form.vencimento,status:"aberto"})});
      } else if(form.modo==="parcelado"){
        const n=Number(form.parcelas)||2;
        const valorParcela=Math.round((Number(form.valor)/n)*100)/100;
        const rid=crypto.randomUUID();
        for(let i=0;i<n;i++){
          await sb("contas_pagar",{method:"POST",body:JSON.stringify({...base,valor:valorParcela,vencimento:addMeses(form.vencimento,i),status:"aberto",recorrencia_id:rid,parcela_atual:i+1,total_parcelas:n,descricao:`${form.descricao} (${i+1}/${n})`})});
        }
      } else if(form.modo==="recorrente"){
        const n=Number(form.recorrencia_meses)||12;
        const rid=crypto.randomUUID();
        for(let i=0;i<n;i++){
          await sb("contas_pagar",{method:"POST",body:JSON.stringify({...base,valor:Number(form.valor),vencimento:addMeses(form.vencimento,i),status:"aberto",recorrencia_id:rid,parcela_atual:i+1,total_parcelas:n})});
        }
      }
      setModal(false);setNf(null);setComp(null);
      setForm({descricao:"",valor:"",vencimento:"",categoria_id:"",subcategoria_id:"",tipo_custo:"variavel",observacao:"",modo:"unico",parcelas:2,recorrencia_meses:12});
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
        {[["todos","Todos","#6366f1"],["vencido","Vencidos","#f87171"],["avencer","A vencer","#fbbf24"],["aberto","Em aberto","#818cf8"],["pago","Pagos","#34d399"]].map(([v,l,c])=>(
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
                    <div style={{ fontSize:13, color:"#fff", fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {c.descricao}
                      {c.total_parcelas>1 && <span style={{ marginLeft:6, fontSize:10, background:"rgba(99,102,241,0.15)", color:"#818cf8", padding:"1px 6px", borderRadius:4 }}>{c.parcela_atual}/{c.total_parcelas}</span>}
                    </div>
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
                  <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                    {c.recorrencia_id && getStatus(c)!=="pago" && (
                      <button onClick={()=>excluirGrupo(c.recorrencia_id)} title="Cancelar recorrência futura" style={{ background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:5, color:"#fbbf24", cursor:"pointer", fontSize:10, padding:"2px 7px" }}>⛔ Cancelar série</button>
                    )}
                    {podeExcluir && <button onClick={()=>excluir(c.id)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.2)", cursor:"pointer", fontSize:14 }}>🗑</button>}
                  </div>
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
                <option style={optionStyle} value="fixo">Custo Fixo</option>
                <option style={optionStyle} value="variavel">Custo Variável</option>
                <option style={optionStyle} value="investimento">Investimento</option>
                <option style={optionStyle} value="outros">Outros</option>
              </select>
            </Campo>
            <Campo label="Categoria">
              <select style={selectStyle} value={form.categoria_id} onChange={e=>setForm({...form,categoria_id:e.target.value,subcategoria_id:""})}>
                <option style={optionStyle} value="">Sem categoria</option>
                {categorias.map(c=><option style={optionStyle} key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Campo>
          </div>
          {form.categoria_id && subsDisponiveis.length>0 && (
            <Campo label="Subcategoria">
              <select style={selectStyle} value={form.subcategoria_id} onChange={e=>setForm({...form,subcategoria_id:e.target.value})}>
                <option style={optionStyle} value="">Sem subcategoria</option>
                {subsDisponiveis.map(s=><option style={optionStyle} key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </Campo>
          )}
          {/* Modo: único / parcelado / recorrente */}
          <Campo label="Tipo de lançamento">
            <div style={{ display:"flex", gap:6 }}>
              {[["unico","Único"],["parcelado","Parcelado"],["recorrente","Recorrente"]].map(([v,l])=>(
                <button key={v} onClick={()=>setForm({...form,modo:v})}
                  style={{ flex:1, padding:"9px 6px", borderRadius:8, border:`1px solid ${form.modo===v?"#6366f1":"rgba(255,255,255,0.1)"}`, background:form.modo===v?"rgba(99,102,241,0.2)":"transparent", color:form.modo===v?"#818cf8":"rgba(255,255,255,0.45)", fontSize:12, cursor:"pointer", fontWeight:form.modo===v?600:400 }}>
                  {l}
                </button>
              ))}
            </div>
          </Campo>
          {form.modo==="parcelado" && (
            <Campo label="Número de parcelas">
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <input style={{ ...inputStyle, width:80 }} type="number" min="2" max="60" value={form.parcelas} onChange={e=>setForm({...form,parcelas:e.target.value})} />
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>
                  {form.valor ? `${form.parcelas}x de ${fmt(Number(form.valor)/Number(form.parcelas))}` : `${form.parcelas} parcelas mensais`}
                </div>
              </div>
            </Campo>
          )}
          {form.modo==="recorrente" && (
            <Campo label="Duração (meses)">
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <input style={{ ...inputStyle, width:80 }} type="number" min="2" max="120" value={form.recorrencia_meses} onChange={e=>setForm({...form,recorrencia_meses:e.target.value})} />
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>
                  {form.recorrencia_meses} meses de {form.valor ? fmt(Number(form.valor)) : "R$ --"}
                </div>
              </div>
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

// ── Grupos de lançamento ───────────────────────────────────────────────────────
const GRUPOS = {
  receita_operacional:  { label:"Receita Operacional",    cor:"#6366f1", impactaDRE:true,  tipo:"entrada" },
  repasse_terceiros:    { label:"Repasse / Pass-through", cor:"#f97316", impactaDRE:false, tipo:"saida"   },
  despesa_operacional:  { label:"Despesa Operacional",    cor:"#10b981", impactaDRE:true,  tipo:"saida" },
  despesa_financeira:   { label:"Despesa Financeira",     cor:"#fbbf24", impactaDRE:true,  tipo:"saida" },
  imposto:              { label:"Imposto",                cor:"#ef4444", impactaDRE:true,  tipo:"saida" },
  taxa_bancaria:        { label:"Taxa Bancária",          cor:"#94a3b8", impactaDRE:false, tipo:"saida" },
  transferencia_interna:{ label:"Transferência Interna",  cor:"#cbd5e1", impactaDRE:false, tipo:"saida" },
};

// ── Contas Bancárias ───────────────────────────────────────────────────────────
function Contas({ contas, empresaId, onRefresh, membro, lancamentos, categorias, clientes, fornecedores, projetos, userId }) {
  // Calcula saldo dinâmico: saldo_inicial + entradas - saídas por conta
  const saldoDinamico = (conta) => {
    const movs = lancamentos.filter(l => l.conta_id === conta.id && l.impacta_caixa);
    const entradas = movs.filter(l => l.tipo === "entrada").reduce((s,l) => s + Number(l.valor), 0);
    const saidas   = movs.filter(l => l.tipo === "saida").reduce((s,l) => s + Number(l.valor), 0);
    return Number(conta.saldo) + entradas - saidas;
  };
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome:"", banco:"", saldo:"", cor:"#6366f1" });
  const [ofxContaId, setOfxContaId] = useState(null);
  const ofxConta = ofxContaId ? contas.find(c=>c.id===ofxContaId)||null : null;
  const [editSaldo, setEditSaldo] = useState(null);
  const [loadingSaldo, setLoadingSaldo] = useState(false);
  const [editConta, setEditConta] = useState(null); // { id, nome, banco, cor }
  const [loadingEditConta, setLoadingEditConta] = useState(false);

  const salvarSaldoInicial = async () => {
    if(editSaldo.saldo === "") return alert("Digite um valor.");
    setLoadingSaldo(true);
    try {
      await sb(`contas?id=eq.${editSaldo.id}`, { method:"PATCH", body:JSON.stringify({ saldo: Number(editSaldo.saldo) }) });
      setEditSaldo(null);
      onRefresh();
    } catch(e) { alert("Erro: "+e.message); }
    setLoadingSaldo(false);
  };

  const salvarEditConta = async () => {
    if(!editConta.nome||!editConta.banco) return alert("Preencha nome e banco.");
    setLoadingEditConta(true);
    try {
      await sb(`contas?id=eq.${editConta.id}`, { method:"PATCH", body:JSON.stringify({ nome:editConta.nome, banco:editConta.banco, cor:editConta.cor }) });
      setEditConta(null);
      onRefresh();
    } catch(e) { alert("Erro: "+e.message); }
    setLoadingEditConta(false);
  };
  const total=contas.reduce((s,c)=>s+saldoDinamico(c),0);
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
            {membro?.perfil !== "visualizador" && <button onClick={()=>setOfxContaId(c.id)} style={{ position:"absolute", top:12, right:44, background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:6, padding:"3px 8px", color:"#818cf8", fontSize:10, cursor:"pointer", fontWeight:600 }}>📂 OFX</button>}
            {podeCriar && <button onClick={()=>setEditConta({id:c.id,nome:c.nome,banco:c.banco,cor:c.cor||"#6366f1"})} style={{ position:"absolute", top:12, right:90, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"3px 8px", color:"rgba(255,255,255,0.4)", fontSize:10, cursor:"pointer" }}>✏</button>}
            <div style={{ width:34, height:34, borderRadius:9, background:(c.cor||"#6366f1")+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, marginBottom:12 }}>💳</div>
            <div style={{ fontSize:14, fontWeight:600, color:"#fff", marginBottom:2 }}>{c.nome}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginBottom:4 }}>{c.banco}</div>
            <div style={{ fontSize:20, fontWeight:600, color:"#fff", marginBottom:6 }}>{fmt(saldoDinamico(c))}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
              Saldo inicial: {fmt(Number(c.saldo))}
              {podeCriar && <button onClick={()=>setEditSaldo({id:c.id, saldo:c.saldo})} style={{ background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:4, padding:"1px 6px", color:"#818cf8", fontSize:9, cursor:"pointer" }}>✏ editar</button>}
            </div>
            <div style={{ height:3, background:"rgba(255,255,255,0.07)", borderRadius:999 }}>
              <div style={{ width:`${total?(Math.min(saldoDinamico(c)/total,1)*100):0}%`, height:"100%", background:c.cor||"#6366f1", borderRadius:999 }} />
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:4 }}>{total?((saldoDinamico(c)/total)*100).toFixed(1):0}% do total</div>
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
      {editConta && (
        <Modal titulo="Editar conta" onClose={()=>setEditConta(null)}>
          <Campo label="Nome da conta"><input style={inputStyle} value={editConta.nome} onChange={e=>setEditConta({...editConta,nome:e.target.value})} placeholder="Ex: Itaú PJ" autoFocus /></Campo>
          <Campo label="Banco"><input style={inputStyle} value={editConta.banco} onChange={e=>setEditConta({...editConta,banco:e.target.value})} /></Campo>
          <Campo label="Cor"><div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>{CORES.map(cor=><div key={cor} onClick={()=>setEditConta({...editConta,cor})} style={{ width:28, height:28, borderRadius:"50%", background:cor, cursor:"pointer", border:editConta.cor===cor?"3px solid #fff":"2px solid transparent" }} />)}</div></Campo>
          <BtnRow onCancel={()=>setEditConta(null)} onSave={salvarEditConta} loading={loadingEditConta} />
        </Modal>
      )}
      {editSaldo && (
        <Modal titulo="Editar saldo inicial" onClose={()=>setEditSaldo(null)}>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginBottom:12, lineHeight:1.6 }}>
            O <strong style={{color:"#fff"}}>saldo inicial</strong> é o valor que você tinha na conta <strong style={{color:"#fff"}}>antes</strong> de começar a lançar no sistema.<br/>
            O saldo atual é calculado automaticamente: <em>saldo inicial + entradas − saídas</em>.
          </div>
          <Campo label="Saldo inicial (R$)">
            <input style={inputStyle} type="number" step="0.01"
              value={editSaldo.saldo}
              onChange={e=>setEditSaldo({...editSaldo, saldo:e.target.value})}
              autoFocus
            />
          </Campo>
          <BtnRow onCancel={()=>setEditSaldo(null)} onSave={salvarSaldoInicial} loading={loadingSaldo} />
        </Modal>
      )}
      {ofxConta && (
        <ImportadorOFX
          conta={ofxConta}
          lancamentos={lancamentos}
          categorias={categorias}
          clientes={clientes}
          fornecedores={fornecedores}
          projetos={projetos}
          empresaId={empresaId}
          userId={userId}
          onRefresh={onRefresh}
          onFechar={()=>setOfxContaId(null)}
        />
      )}
    </div>
  );
}

// ── Parser OFX Itaú ───────────────────────────────────────────────────────────
function parseOFX(texto) {
  // Normaliza encoding — usa split/join para evitar corrupção de \r\n no editor do GitHub
  const t = texto.split("\r\n").join("\n").split("\r").join("\n");

  // Extrai todas as transações STMTTRN
  const transacoes = [];
  const regex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let match;

  while ((match = regex.exec(t)) !== null) {
    const bloco = match[1];
    const get = (tag) => {
      const m = new RegExp(`<${tag}>([^<\n]+)`).exec(bloco);
      return m ? m[1].trim() : "";
    };

    const tipo  = get("TRNTYPE"); // DEBIT ou CREDIT
    const dtStr = get("DTPOSTED"); // ex: 20260515
    const valor = parseFloat(get("TRNAMT").replace(",","."));
    const memo  = get("MEMO") || get("NAME") || "Sem descrição";
    const fitid = get("FITID");

    if(!dtStr || isNaN(valor)) continue;

    // Formata data para YYYY-MM-DD
    const ano  = dtStr.slice(0,4);
    const mes  = dtStr.slice(4,6);
    const dia  = dtStr.slice(6,8);
    const data = `${ano}-${mes}-${dia}`;

    transacoes.push({
      fitid,
      tipo: valor >= 0 ? "entrada" : "saida",
      valor: Math.abs(valor),
      data,
      memo: memo.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">"),
      raw_tipo: tipo,
    });
  }

  // Extrai saldo do extrato bancário — tenta vários formatos do Itaú
  let saldoExtrato = null;
  const tryPatterns = [
    /<LEDGERBAL>[\s\S]*?<BALAMT>([-\d.,]+)/,
    /<AVAILBAL>[\s\S]*?<BALAMT>([-\d.,]+)/,
    /<BALAMT>([-\d.,]+)/,
  ];
  for(const pat of tryPatterns) {
    const m = t.match(pat);
    if(m) { saldoExtrato = parseFloat(m[1].replace(",",".")); break; }
  }

  return { transacoes: transacoes.sort((a,b) => new Date(a.data) - new Date(b.data)), saldoExtrato };
}

// ── Importador OFX ─────────────────────────────────────────────────────────────
function ImportadorOFX({ conta, lancamentos, categorias, clientes, fornecedores, projetos, empresaId, userId, onRefresh, onFechar }) {
  const [transacoes, setTransacoes] = useState([]);
  const [processando, setProcessando] = useState(false);
  const [modalLanc, setModalLanc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({});
  // Inicializa com fitids já lançados anteriormente (gravados no campo observacao)
  const [lançados, setLançados] = useState(() => {
    const s = new Set();
    lancamentos.forEach(l => {
      const m = l.observacao && l.observacao.match(/Importado OFX - (.+)/);
      if(m) s.add(m[1].trim());
    });
    return s;
  });

  const [saldoOFX, setSaldoOFX] = useState(null);

  const handleArquivo = (e) => {
    const arquivo = e.target.files[0];
    if(!arquivo) return;
    setProcessando(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const { transacoes: txs, saldoExtrato } = parseOFX(ev.target.result);
        setTransacoes(txs);
        setSaldoOFX(saldoExtrato);
        // Atualiza saldo da conta automaticamente com o saldo do extrato
        if(saldoExtrato !== null && !isNaN(saldoExtrato)) {
          await sb(`contas?id=eq.${conta.id}`, { method:"PATCH", body:JSON.stringify({ saldo: saldoExtrato }) });
          // NÃO chama onRefresh() aqui — evita fechar a tela do OFX
        } else {
          console.warn("Saldo não encontrado no arquivo OFX — verifique se o arquivo contém LEDGERBAL ou BALAMT.");
        }
      } catch(err) {
        alert("Erro ao ler OFX: " + err.message);
      }
      setProcessando(false);
    };
    reader.readAsText(arquivo, "latin1");
  };

  // Verifica se uma transação já foi lançada — usa FITID único para evitar
  // falso-positivo em transações com mesmo valor (ex: dois funcionários com salário igual)
  const jaLancado = (tx) => lançados.has(tx.fitid);

  const abrirLancar = (tx) => {
    setForm({
      descricao: tx.memo,
      valor: tx.valor.toFixed(2),
      tipo: tx.tipo,
      tipo_lancamento: tx.tipo === "entrada" ? "receita_operacional" : "despesa_operacional",
      data_competencia: tx.data,
      data_pagamento: tx.data,
      impacta_dre: true,
      impacta_caixa: true,
      categoria_id: "",
      conta_id: conta.id,
      cliente_id: "",
      fornecedor_id: "",
      projeto_id: "",
      valor_repasse: "0",
      observacao: `Importado OFX - ${tx.fitid}`,
    });
    setModalLanc(tx);
  };

  const salvarLanc = async () => {
    if(!form.descricao || !form.valor) return;
    setLoading(true);
    try {
      await sb("lancamentos", { method:"POST", body: JSON.stringify({
        ...form,
        valor: Number(form.valor),
        valor_repasse: 0,
        empresa_id: empresaId,
        criado_por: userId,
        categoria_id: form.categoria_id || null,
        cliente_id: form.cliente_id || null,
        fornecedor_id: form.fornecedor_id || null,
        projeto_id: form.projeto_id || null,
        data_pagamento: form.data_pagamento || null,
      })});
      setLançados(prev => new Set([...prev, modalLanc.fitid]));
      setModalLanc(null);
      // NÃO chama onRefresh() aqui para manter o extrato OFX na tela.
      // onRefresh() é chamado ao fechar o importador.
    } catch(e) { alert("Erro: " + e.message); }
    setLoading(false);
  };

  const setTipoLanc = (tl) => {
    const g = GRUPOS[tl];
    setForm(f => ({...f, tipo_lancamento: tl, tipo: g?.tipo || f.tipo, impacta_dre: g?.impactaDRE ?? true, categoria_id: ""}));
  };

  const catsFiltradas = categorias.filter(c => c.grupo === form.tipo_lancamento);
  const jaMarcados = transacoes.filter(tx => jaLancado(tx) || lançados.has(tx.fitid)).length;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#13131a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:18, width:"100%", maxWidth:820, maxHeight:"90vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 24px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#fff" }}>Importar Extrato OFX</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2 }}>Conta: {conta.nome} — {conta.banco}</div>
            {saldoOFX !== null && <div style={{ fontSize:12, color:"#34d399", marginTop:4 }}>✓ Saldo atualizado pelo extrato: <strong>{Number(saldoOFX).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</strong></div>}
          </div>
          <button onClick={()=>{ onRefresh(); onFechar(); }} style={{ background:"rgba(255,255,255,0.06)", border:"none", borderRadius:8, padding:"6px 14px", color:"rgba(255,255,255,0.5)", cursor:"pointer" }}>✕ Fechar</button>
        </div>

        {/* Upload */}
        <div style={{ padding:"16px 24px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          {transacoes.length === 0 ? (
            <label style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:"2px dashed rgba(99,102,241,0.3)", borderRadius:12, padding:"28px 20px", cursor:"pointer", background:"rgba(99,102,241,0.05)" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>📂</div>
              <div style={{ fontSize:14, color:"#818cf8", fontWeight:600, marginBottom:4 }}>Clique para selecionar o arquivo OFX</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>Exporte o extrato do Itaú Internet Banking → formato OFX</div>
              <input type="file" accept=".ofx,.OFX" onChange={handleArquivo} style={{ display:"none" }} />
            </label>
          ) : (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", gap:16 }}>
                <div style={{ background:"rgba(99,102,241,0.12)", borderRadius:8, padding:"8px 14px" }}>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>TOTAL</div>
                  <div style={{ fontSize:16, fontWeight:700, color:"#818cf8" }}>{transacoes.length} transações</div>
                </div>
                <div style={{ background:"rgba(52,211,153,0.1)", borderRadius:8, padding:"8px 14px" }}>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>JÁ LANÇADOS</div>
                  <div style={{ fontSize:16, fontWeight:700, color:"#34d399" }}>{jaMarcados}</div>
                </div>
                <div style={{ background:"rgba(251,191,36,0.1)", borderRadius:8, padding:"8px 14px" }}>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>PENDENTES</div>
                  <div style={{ fontSize:16, fontWeight:700, color:"#fbbf24" }}>{transacoes.length - jaMarcados}</div>
                </div>
              </div>
              <label style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"7px 14px", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:12 }}>
                📂 Trocar arquivo
                <input type="file" accept=".ofx,.OFX" onChange={handleArquivo} style={{ display:"none" }} />
              </label>
            </div>
          )}
          {processando && <div style={{ textAlign:"center", padding:16, color:"rgba(255,255,255,0.4)", fontSize:13 }}>Lendo arquivo...</div>}
        </div>

        {/* Lista de transações */}
        {transacoes.length > 0 && (
          <div style={{ flex:1, overflowY:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                  {["Data","Descrição","Valor","Status",""].map(h=>(
                    <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:10, color:"rgba(255,255,255,0.35)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transacoes.map((tx, i) => {
                  const lancado = jaLancado(tx) || lançados.has(tx.fitid);
                  return (
                    <tr key={tx.fitid+i} style={{ borderBottom:"1px solid rgba(255,255,255,0.03)", background: lancado ? "rgba(52,211,153,0.03)" : "transparent" }}>
                      <td style={{ padding:"10px 16px", fontSize:12, color:"rgba(255,255,255,0.5)", whiteSpace:"nowrap" }}>{tx.data.split("-").reverse().join("/")}</td>
                      <td style={{ padding:"10px 16px", fontSize:12, color:"rgba(255,255,255,0.85)", maxWidth:280, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tx.memo}</td>
                      <td style={{ padding:"10px 16px", fontSize:13, fontWeight:600, color: tx.tipo==="entrada"?"#818cf8":"#f87171", whiteSpace:"nowrap" }}>
                        {tx.tipo==="entrada"?"+":"-"}{fmt(tx.valor)}
                      </td>
                      <td style={{ padding:"10px 16px" }}>
                        {lancado ? (
                          <span style={{ background:"rgba(52,211,153,0.12)", color:"#34d399", borderRadius:6, padding:"3px 9px", fontSize:11, fontWeight:600 }}>✓ Lançado</span>
                        ) : (
                          <span style={{ background:"rgba(251,191,36,0.12)", color:"#fbbf24", borderRadius:6, padding:"3px 9px", fontSize:11, fontWeight:600 }}>⚠ Pendente</span>
                        )}
                      </td>
                      <td style={{ padding:"10px 16px" }}>
                        {!lancado && (
                          <button onClick={()=>abrirLancar(tx)}
                            style={{ background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.3)", borderRadius:7, padding:"5px 12px", color:"#818cf8", fontSize:12, cursor:"pointer", fontWeight:500 }}>
                            + Lançar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de lançamento */}
      {modalLanc && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={()=>setModalLanc(null)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#13131a", border:"1px solid rgba(255,255,255,0.12)", borderRadius:18, padding:28, width:500, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ fontSize:16, fontWeight:700, color:"#fff", marginBottom:4 }}>Lançar transação</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:18 }}>{modalLanc.memo}</div>

            <Campo label="Tipo de lançamento">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
                {Object.entries(GRUPOS).filter(([k])=>k!=="transferencia_interna").map(([k,g])=>(
                  <button key={k} onClick={()=>setTipoLanc(k)} style={{ padding:"7px 6px", borderRadius:8, border:`1px solid ${form.tipo_lancamento===k?g.cor:"rgba(255,255,255,0.08)"}`, background:form.tipo_lancamento===k?g.cor+"22":"transparent", color:form.tipo_lancamento===k?g.cor:"rgba(255,255,255,0.4)", fontSize:10, cursor:"pointer", fontWeight:form.tipo_lancamento===k?600:400, textAlign:"center", lineHeight:1.3 }}>
                    {g.label}
                  </button>
                ))}
              </div>
            </Campo>

            <Campo label="Descrição">
              <input style={inputStyle} value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})} />
            </Campo>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Campo label="Valor (R$)">
                <input style={inputStyle} type="number" value={form.valor} onChange={e=>setForm({...form,valor:e.target.value})} />
              </Campo>
              <Campo label="Data competência">
                <input style={inputStyle} type="date" value={form.data_competencia} onChange={e=>setForm({...form,data_competencia:e.target.value})} />
              </Campo>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Campo label="Categoria">
                <select style={selectStyle} value={form.categoria_id} onChange={e=>setForm({...form,categoria_id:e.target.value})}>
                  <option style={optionStyle} value="">Selecione...</option>
                  {catsFiltradas.map(c=><option style={optionStyle} key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </Campo>
              <Campo label="Cliente">
                <select style={selectStyle} value={form.cliente_id} onChange={e=>setForm({...form,cliente_id:e.target.value})}>
                  <option style={optionStyle} value="">Sem cliente</option>
                  {clientes.map(c=><option style={optionStyle} key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </Campo>
            </div>

            <Campo label="Projeto">
              <select style={selectStyle} value={form.projeto_id} onChange={e=>setForm({...form,projeto_id:e.target.value})}>
                <option style={optionStyle} value="">Sem projeto</option>
                {projetos.map(p=><option style={optionStyle} key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </Campo>

            <BtnRow onCancel={()=>setModalLanc(null)} onSave={salvarLanc} loading={loading} />
          </div>
        </div>
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
          <Campo label="Categoria"><select style={selectStyle} value={form.categoria_id} onChange={e=>setForm({...form,categoria_id:e.target.value})}><option style={optionStyle} value="">Selecione...</option>{categorias.filter(c=>c.tipo==="despesa").map(c=><option style={optionStyle} key={c.id} value={c.id}>{c.nome}</option>)}</select></Campo>
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
        <select style={{ ...selectStyle, width:"auto", minWidth:140 }} value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)}><option style={optionStyle} value="todos">Tipo: Todos</option><option style={optionStyle} value="receita">Receitas</option><option style={optionStyle} value="despesa">Despesas</option></select>
        <select style={{ ...selectStyle, width:"auto", minWidth:140 }} value={filtroCat} onChange={e=>setFiltroCat(e.target.value)}><option style={optionStyle} value="">Categoria: Todas</option>{categorias.map(c=><option style={optionStyle} key={c.id} value={c.id}>{c.nome}</option>)}</select>
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
              {(()=>{ let acum=saldoInicial; return porDia.map(([data,v])=>{ const sd=v.rec-v.desp; acum+=sd; const [y,m,d]=data.split("-"); const ds=dias[new Date(Number(y),Number(m)-1,Number(d)).getDay()]; return (<tr key={data} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}><td style={{ padding:"10px 14px", fontSize:12, color:"rgba(255,255,255,0.5)" }}>{d}/{m}/{y}</td><td style={{ padding:"10px 14px", fontSize:12, color:"rgba(255,255,255,0.5)" }}>{ds}</td><td style={{ padding:"10px 14px", fontSize:12, color:"#34d399", fontWeight:500 }}>{v.rec>0?fmt(v.rec):"—"}</td><td style={{ padding:"10px 14px", fontSize:12, color:"#f87171", fontWeight:500 }}>{v.desp>0?fmt(v.desp):"—"}</td><td style={{ padding:"10px 14px", fontSize:12, fontWeight:600, color:sd>=0?"#34d399":"#f87171" }}>{fmt(sd)}</td><td style={{ padding:"10px 14px", fontSize:12, fontWeight:600, color:acum>=0?"#818cf8":"#f87171" }}>{fmt(acum)}</td></tr>); }); })()}
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


// ── Helpers ────────────────────────────────────────────────────────────────────

const SUBGRUPOS = {
  pessoal:        "Pessoal",
  estrutura:      "Estrutura",
  tecnologia:     "Tecnologia",
  marketing:      "Marketing",
  comercial:      "Comercial",
  administrativo: "Administrativo",
  tarifas:        "Tarifas Bancárias",
  juros:          "Juros e Encargos",
  antecipacao:    "Antecipação",
  servicos:       "Serviços",
  producao:       "Produção",
  tributos:       "Tributos",
};

const fmtPct = (v) => `${Number(v).toFixed(1)}%`;

// ── Dashboard ERP ──────────────────────────────────────────────────────────────
function Dashboard({ lancamentos, contas, categorias, subcategorias, clientes, projetos, setTela }) {
  const hoje = new Date().toISOString().split("T")[0];
  const primeiroDia = new Date().toISOString().slice(0,7)+"-01";
  const [inicio, setInicio] = useState(primeiroDia);
  const [fim, setFim] = useState(hoje);

  const filtrados = useMemo(()=>lancamentos.filter(l=>{
    if(inicio && l.data_competencia < inicio) return false;
    if(fim && l.data_competencia > fim) return false;
    return true;
  }),[lancamentos,inicio,fim]);

  // KPIs principais
  const recOp   = filtrados.filter(l=>l.tipo_lancamento==="receita_operacional").reduce((s,l)=>s+Number(l.valor),0);
  const repasse  = filtrados.filter(l=>l.tipo_lancamento==="repasse_terceiros").reduce((s,l)=>s+Number(l.valor),0);
  const despOp   = filtrados.filter(l=>l.tipo_lancamento==="despesa_operacional").reduce((s,l)=>s+Number(l.valor),0);
  const impostos = filtrados.filter(l=>l.tipo_lancamento==="imposto").reduce((s,l)=>s+Number(l.valor),0);
  const despFin  = filtrados.filter(l=>["despesa_financeira","taxa_bancaria"].includes(l.tipo_lancamento)).reduce((s,l)=>s+Number(l.valor),0);
  const lucroLiq = recOp - despOp - despFin;
  const pctFin   = recOp > 0 ? (despFin/recOp)*100 : 0;
  const margemLiq = recOp > 0 ? (lucroLiq/recOp)*100 : 0;
  const totalEntradas = filtrados.filter(l=>l.tipo==="entrada").reduce((s,l)=>s+Number(l.valor),0);
  const totalSaidas   = filtrados.filter(l=>l.tipo==="saida").reduce((s,l)=>s+Number(l.valor),0);
  const lucroOp = recOp - despOp;
  const margem  = recOp > 0 ? (lucroOp/recOp)*100 : 0;
  const saldoCaixa = contas.reduce((s,c)=>{ const movs=lancamentos.filter(l=>l.conta_id===c.id&&l.impacta_caixa); const ent=movs.filter(l=>l.tipo==="entrada").reduce((a,l)=>a+Number(l.valor),0); const sai=movs.filter(l=>l.tipo==="saida").reduce((a,l)=>a+Number(l.valor),0); return s+Number(c.saldo)+ent-sai; },0);

  // Top clientes
  const topClientes = clientes.map(cl=>({
    ...cl,
    receita: filtrados.filter(l=>l.cliente_id===cl.id&&l.tipo_lancamento==="receita_operacional").reduce((s,l)=>s+Number(l.valor),0),
    repasse: filtrados.filter(l=>l.cliente_id===cl.id&&l.tipo_lancamento==="repasse_terceiros").reduce((s,l)=>s+Number(l.valor),0),
  })).filter(cl=>cl.receita>0||cl.repasse>0).sort((a,b)=>(b.receita+b.repasse)-(a.receita+a.repasse)).slice(0,5);

  // Por categoria (DRE)
  const porCatRec = categorias.filter(c=>c.grupo==="receita_operacional").map(cat=>({
    ...cat, total: filtrados.filter(l=>l.categoria_id===cat.id).reduce((s,l)=>s+Number(l.valor),0)
  })).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);

  // Pizza chart
  const [pTipo, setPTipo] = useState("receita_operacional");
  const [pCatSel, setPCatSel] = useState(null); // categoria selecionada para ver subcats
  const PALETA = ["#6366f1","#f97316","#10b981","#ef4444","#eab308","#06b6d4","#ec4899","#84cc16","#a78bfa","#f59e0b","#14b8a6","#8b5cf6","#fb7185","#34d399","#fbbf24","#38bdf8","#c084fc","#4ade80"];

  const TIPOS_PIZZA = {
    receita_operacional: { label:"Receitas Op.", cor:"#6366f1" },
    repasse_terceiros:   { label:"Repasses",     cor:"#f97316" },
    despesa_operacional: { label:"Despesas Op.", cor:"#ef4444" },
    imposto:             { label:"Impostos",     cor:"#eab308" },
  };

  const porCatPizza = useMemo(()=>{
    if(pTipo === "todos") {
      // Mostra os grupos principais juntos
      return Object.entries(TIPOS_PIZZA).map(([tipo, info], i)=>({
        id: tipo, nome: info.label, cor: info.cor,
        total: filtrados.filter(l=>l.tipo_lancamento===tipo).reduce((s,l)=>s+Number(l.valor),0)
      })).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);
    }
    return categorias.filter(c=>c.grupo===pTipo).map((cat,i)=>({
      ...cat, cor: PALETA[i%PALETA.length],
      total: filtrados.filter(l=>l.tipo_lancamento===pTipo&&l.categoria_id===cat.id).reduce((s,l)=>s+Number(l.valor),0)
    })).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);
  }, [filtrados, categorias, pTipo]);

  // Subcategorias da categoria selecionada
  const subcats = subcategorias || [];
  const porSubPizza = useMemo(()=>{
    if(!pCatSel || pTipo==="todos") return [];
    const subs = (subcats||[]).filter(s=>s.categoria_id===pCatSel.id);
    const semSub = filtrados.filter(l=>l.tipo_lancamento===pTipo&&l.categoria_id===pCatSel.id&&!l.subcategoria_id).reduce((s,l)=>s+Number(l.valor),0);
    const result = subs.map((s,i)=>({...s, cor:PALETA[(i+4)%PALETA.length], total:filtrados.filter(l=>l.subcategoria_id===s.id).reduce((x,l)=>x+Number(l.valor),0)})).filter(s=>s.total>0);
    if(semSub>0) result.push({id:"sem",nome:"Sem subcategoria",cor:"#64748b",total:semSub});
    return result.sort((a,b)=>b.total-a.total);
  }, [filtrados, pCatSel, subcats, pTipo]);

  const card = (label,valor,cor,sub=null,click=null) => (
    <div onClick={click} style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px 18px", cursor:click?"pointer":"default" }}>
      <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8, fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700, color:cor }}>{fmt(valor)}</div>
      {sub && <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:4 }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      <div style={{ fontSize:22, fontWeight:700, color:"#fff", marginBottom:4 }}>Dashboard Executivo</div>
      <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:14 }}>Visão gerencial da agência</div>

      {/* Filtro de período */}
      <div style={{ display:"flex", gap:10, marginBottom:20, background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"10px 16px", alignItems:"center", flexWrap:"wrap" }}>
        <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:600, textTransform:"uppercase" }}>Período</span>
        <input type="date" value={inicio} onChange={e=>setInicio(e.target.value)} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, padding:"5px 10px", color:"#fff", fontSize:12, outline:"none" }} />
        <span style={{ color:"rgba(255,255,255,0.3)", fontSize:12 }}>até</span>
        <input type="date" value={fim} onChange={e=>setFim(e.target.value)} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, padding:"5px 10px", color:"#fff", fontSize:12, outline:"none" }} />
        <button onClick={()=>{setInicio(primeiroDia);setFim(hoje);}} style={{ background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.25)", borderRadius:7, padding:"5px 12px", color:"#818cf8", fontSize:11, cursor:"pointer" }}>Mês atual</button>
        <button onClick={()=>{ const a=new Date(); setInicio(new Date(a.getFullYear(),0,1).toISOString().split("T")[0]); setFim(hoje); }} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, padding:"5px 12px", color:"rgba(255,255,255,0.4)", fontSize:11, cursor:"pointer" }}>Ano</button>
        <button onClick={()=>{setInicio("");setFim("");}} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, padding:"5px 12px", color:"rgba(255,255,255,0.4)", fontSize:11, cursor:"pointer" }}>Tudo</button>
      </div>

      {/* Cards principais */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:12 }}>
        {card("Receita Operacional", recOp, "#818cf8", `Margem EBIT: ${fmtPct(margem)}`)}
        {card("Lucro Operacional (EBIT)", lucroOp, lucroOp>=0?"#34d399":"#f87171", `Despesas op.: ${fmt(despOp)}`)}
        {card("Repasse Terceiros", repasse, "#f97316", "Não entra na DRE")}
        {card("Lucro Líquido", lucroLiq, lucroLiq>=0?"#34d399":"#f87171", `Margem: ${fmtPct(margemLiq)}`)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:12 }}>
        {card("Volume Movimentado", totalEntradas, "rgba(255,255,255,0.6)", "Total de entradas no período")}
        {card("Impostos", impostos, "#fca5a5")}
        {card("Desp. Financeiras", despFin, "#fbbf24", `${fmtPct(pctFin)} da rec. líq.`)}
        {card("Lucro Operacional (EBIT)", lucroOp, lucroOp>=0?"#34d399":"#f87171", `Despesas op.: ${fmt(despOp)}`)}
      </div>

      {/* Saldo em Caixa — por conta + total */}
      <div style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px 20px", marginBottom:20 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14 }}>Saldo em Caixa</div>
        <div style={{ display:"flex", alignItems:"center", gap:24, flexWrap:"wrap" }}>
          {contas.map(c=>{
            const movs=lancamentos.filter(l=>l.conta_id===c.id&&l.impacta_caixa);
            const ent=movs.filter(l=>l.tipo==="entrada").reduce((a,l)=>a+Number(l.valor),0);
            const sai=movs.filter(l=>l.tipo==="saida").reduce((a,l)=>a+Number(l.valor),0);
            const saldo=Number(c.saldo)+ent-sai;
            return (
              <div key={c.id} style={{ flex:1, minWidth:140 }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>{c.nome}</div>
                <div style={{ fontSize:18, fontWeight:600, color:"#fff" }}>{fmt(saldo)}</div>
              </div>
            );
          })}
          {contas.length > 0 && <div style={{ width:"1px", height:40, background:"rgba(255,255,255,0.07)" }} />}
          <div style={{ flex:1, minWidth:140 }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>SALDO TOTAL</div>
            <div style={{ fontSize:28, fontWeight:700, color:"#fff" }}>{fmt(saldoCaixa)}</div>
          </div>
        </div>
      </div>

      {/* Tabelas */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {/* Top clientes */}
        <div style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:18 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.6)", marginBottom:14 }}>Receita por cliente</div>
          {topClientes.length===0 && <div style={{ fontSize:13, color:"rgba(255,255,255,0.25)" }}>Nenhum lançamento com cliente.</div>}
          {topClientes.map(cl=>(
            <div key={cl.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
              <div>
                <div style={{ fontSize:13, color:"#fff", fontWeight:500 }}>{cl.nome}</div>
                {cl.repasse>0 && <div style={{ fontSize:10, color:"#f97316" }}>+ {fmt(cl.repasse)} em repasses</div>}
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#818cf8" }}>{fmt(cl.receita)}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>operacional</div>
              </div>
            </div>
          ))}
        </div>

        {/* Receitas por categoria */}
        <div style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:18 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.6)", marginBottom:14 }}>Receita por serviço</div>
          {porCatRec.length===0 && <div style={{ fontSize:13, color:"rgba(255,255,255,0.25)" }}>Nenhuma receita no período.</div>}
          {porCatRec.map(cat=>(
            <div key={cat.id} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <div style={{ width:7, height:7, borderRadius:2, background:cat.cor||"#6366f1" }} />
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>{cat.nome}</span>
                </div>
                <span style={{ fontSize:12, color:"#818cf8", fontWeight:500 }}>{fmt(cat.total)}</span>
              </div>
              <div style={{ height:3, background:"rgba(255,255,255,0.07)", borderRadius:999 }}>
                <div style={{ width:`${recOp?(cat.total/recOp*100):0}%`, height:"100%", borderRadius:999, background:cat.cor||"#6366f1" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico Pizza */}
      <div style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20, marginTop:16 }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.7)" }}>
              {pCatSel ? (
                <span>
                  <button onClick={()=>setPCatSel(null)} style={{ background:"none", border:"none", color:"#818cf8", cursor:"pointer", fontSize:13, padding:0, marginRight:8 }}>← Categorias</button>
                  {pCatSel.nome} — Subcategorias
                </span>
              ) : "Análise por gráfico"}
            </div>
            {!pCatSel && <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>Clique em uma categoria para ver subcategorias</div>}
          </div>
          <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.04)", borderRadius:8, padding:3 }}>
            {[["receita_operacional","Receitas"],["despesa_operacional","Despesas"],["repasse_terceiros","Repasses"],["todos","Visão Geral"]].map(([v,l])=>(
              <button key={v} onClick={()=>{ setPTipo(v); setPCatSel(null); }} style={{ padding:"5px 10px", borderRadius:6, border:"none", background:pTipo===v?"rgba(99,102,241,0.25)":"transparent", color:pTipo===v?"#818cf8":"rgba(255,255,255,0.45)", fontSize:11, cursor:"pointer", fontWeight:pTipo===v?500:400 }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Pizza + Legenda */}
        {(()=>{
          const dados = pCatSel ? porSubPizza : porCatPizza;
          const total = dados.reduce((s,d)=>s+d.total,0);

          if(!dados.length||total===0) return (
            <div style={{ textAlign:"center", padding:"40px 0", color:"rgba(255,255,255,0.2)" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>◎</div>
              <div style={{ fontSize:13 }}>Sem dados no período</div>
              {pCatSel && <div style={{ fontSize:11, marginTop:4 }}>Esta categoria não tem subcategorias com lançamentos</div>}
            </div>
          );

          let angulo=0;
          const cx=100,cy=100,raio=85,furo=42;
          const fatias = dados.map(d=>{
            const pct=d.total/total;
            const rad=pct*2*Math.PI;
            const x1o=cx+raio*Math.sin(angulo), y1o=cy-raio*Math.cos(angulo);
            const x1i=cx+furo*Math.sin(angulo), y1i=cy-furo*Math.cos(angulo);
            angulo+=rad;
            const x2o=cx+raio*Math.sin(angulo), y2o=cy-raio*Math.cos(angulo);
            const x2i=cx+furo*Math.sin(angulo), y2i=cy-furo*Math.cos(angulo);
            const large=rad>Math.PI?1:0;
            const path=`M${x1i.toFixed(1)},${y1i.toFixed(1)} L${x1o.toFixed(1)},${y1o.toFixed(1)} A${raio},${raio} 0 ${large},1 ${x2o.toFixed(1)},${y2o.toFixed(1)} L${x2i.toFixed(1)},${y2i.toFixed(1)} A${furo},${furo} 0 ${large},0 ${x1i.toFixed(1)},${y1i.toFixed(1)} Z`;
            return {...d, path, pct};
          });

          return (
            <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:24, alignItems:"start" }}>
              {/* SVG */}
              <div style={{ position:"relative" }}>
                <svg width={200} height={200} viewBox="0 0 200 200">
                  {fatias.map((f,i)=>(
                    <path key={i} d={f.path}
                      fill={f.cor||"#6366f1"}
                      stroke="#1a1a2e" strokeWidth={2}
                      style={{ cursor: !pCatSel?"pointer":"default", opacity:1, transition:"opacity 0.15s" }}
                      onClick={()=>{ if(!pCatSel) { if(pTipo==="todos"){ setPTipo(f.id); } else { setPCatSel(f); } } }}
                      onMouseEnter={e=>e.target.style.opacity="0.8"}
                      onMouseLeave={e=>e.target.style.opacity="1"}>
                      <title>{f.nome}: {fmt(f.total)} ({(f.pct*100).toFixed(1)}%)</title>
                    </path>
                  ))}
                  {/* Centro */}
                  <text x={cx} y={cy-6} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.4)" fontFamily="DM Sans">TOTAL</text>
                  <text x={cx} y={cy+10} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.6)" fontFamily="DM Sans">{fmt(total)}</text>
                </svg>
                {!pCatSel && <div style={{ position:"absolute", bottom:-16, left:0, right:0, textAlign:"center", fontSize:10, color:"rgba(255,255,255,0.25)" }}>{pTipo==="todos"?"clique para ver por categoria":"clique para ver subcategorias"}</div>}
              </div>

              {/* Legenda */}
              <div>
                {fatias.map((f,i)=>(
                  <div key={i}
                    onClick={()=>{ if(!pCatSel) { if(pTipo==="todos"){ setPTipo(f.id); } else { setPCatSel(f); } } }}
                    style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 10px", borderRadius:8, marginBottom:4, cursor:!pCatSel?"pointer":"default", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.04)", transition:"background 0.15s" }}
                    onMouseEnter={e=>{ if(!pCatSel) e.currentTarget.style.background="rgba(255,255,255,0.07)"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background="rgba(255,255,255,0.03)"; }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:10, height:10, borderRadius:3, background:f.cor||"#6366f1", flexShrink:0 }} />
                      <span style={{ fontSize:12, color:"rgba(255,255,255,0.8)" }}>{f.nome}</span>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.95)" }}>{fmt(f.total)}</div>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>{(f.pct*100).toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 10px 0", borderTop:"1px solid rgba(255,255,255,0.08)", marginTop:4 }}>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)", fontWeight:500 }}>Total</span>
                  <span style={{ fontSize:14, fontWeight:700, color:"#818cf8" }}>{fmt(total)}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}


// ── Anexo Preview Helper ───────────────────────────────────────────────────────
async function abrirPreview(path, nome, setPreview) {
  if(!path) return;
  try {
    const token = localStorage.getItem("sb_token");
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/authenticated/anexos/${path}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` }
    });
    if(!res.ok) throw new Error("Erro " + res.status);
    const blob = await res.blob();
    setPreview({ url: URL.createObjectURL(blob), nome: nome || "Arquivo", tipo: blob.type });
  } catch(e) {
    alert("Não foi possível abrir: " + e.message);
  }
}

// ── Lançamentos ERP ────────────────────────────────────────────────────────────
// ── Impressão de Extrato ───────────────────────────────────────────────────────
function imprimirExtrato(modo, porDia, categorias, clientes, projetos) {
  const meses=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const dias=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const fmt=(v)=>Number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const fmtData=(data)=>{ const[y,m,d]=data.split("-"); return `${dias[new Date(Number(y),Number(m)-1,Number(d)).getDay()]}, ${d} ${meses[Number(m)-1]} ${y}`; };

  const linhasDetalhadas = (itens) => itens.map(l=>{
    const cat = categorias.find(c=>c.id===l.categoria_id);
    const cli = clientes.find(c=>c.id===l.cliente_id);
    const proj = projetos.find(p=>p.id===l.projeto_id);
    const sinal = l.tipo==="entrada"?"+":"-";
    const cor = l.tipo==="entrada"?"#4f46e5":"#dc2626";
    return `<tr style="border-bottom:1px solid #f1f5f9">
      <td style="padding:6px 10px;font-size:12px;color:#64748b">${l.descricao||""}</td>
      <td style="padding:6px 10px;font-size:11px;color:#94a3b8">${cat?.nome||""}</td>
      <td style="padding:6px 10px;font-size:11px;color:#94a3b8">${cli?.nome||""}${proj?" · "+proj.nome:""}</td>
      <td style="padding:6px 10px;font-size:12px;font-weight:600;color:${cor};text-align:right">${sinal}${fmt(l.valor)}</td>
    </tr>`;
  }).join("");

  const linhas = porDia.map(([data,itens])=>{
    const ent=itens.filter(l=>l.tipo==="entrada").reduce((s,l)=>s+Number(l.valor),0);
    const sai=itens.filter(l=>l.tipo==="saida").reduce((s,l)=>s+Number(l.valor),0);
    const saldo=ent-sai;
    const corSaldo=saldo>=0?"#16a34a":"#dc2626";
    const cabecalho=`<tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0">
      <td colspan="${modo==="detalhado"?4:3}" style="padding:10px 12px;font-weight:700;font-size:13px;color:#1e293b">${fmtData(data)}</td>
      <td style="padding:10px 12px;text-align:right">
        <span style="font-size:11px;color:#64748b">Ent: ${fmt(ent)} | Saí: ${fmt(sai)} | </span>
        <span style="font-size:13px;font-weight:700;color:${corSaldo}">${fmt(saldo)}</span>
      </td>
    </tr>`;
    return cabecalho + (modo==="detalhado" ? linhasDetalhadas(itens) : "");
  }).join("");

  const colunas = modo==="detalhado"
    ? `<tr style="background:#1e293b;color:#fff"><th style="padding:8px 10px;text-align:left;font-size:11px">Descrição</th><th style="padding:8px 10px;text-align:left;font-size:11px">Categoria</th><th style="padding:8px 10px;text-align:left;font-size:11px">Cliente / Projeto</th><th style="padding:8px 10px;text-align:right;font-size:11px">Valor</th></tr>`
    : `<tr style="background:#1e293b;color:#fff"><th colspan="3" style="padding:8px 10px;text-align:left;font-size:11px">Data</th><th style="padding:8px 10px;text-align:right;font-size:11px">Saldo do dia</th></tr>`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Extrato Pirueta Ideias</title>
  <style>body{font-family:system-ui,sans-serif;margin:0;padding:20px;color:#1e293b}@media print{@page{margin:15mm}}</style>
  </head><body>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #6366f1">
    <div><div style="font-size:20px;font-weight:700;color:#6366f1">Pirueta Ideias</div><div style="font-size:13px;color:#64748b">Extrato ${modo==="detalhado"?"Detalhado":"Resumido"} de Lançamentos</div></div>
    <div style="font-size:12px;color:#94a3b8">Gerado em ${new Date().toLocaleDateString("pt-BR")}</div>
  </div>
  <table style="width:100%;border-collapse:collapse">${colunas}${linhas}</table>
  <script>window.onload=()=>{window.print();}<\/script></body></html>`;

  const w = window.open("","_blank","width=900,height=700");
  w.document.write(html);
  w.document.close();
}

function Lancamentos({ lancamentos, contas, categorias, clientes, fornecedores, projetos, empresaId, userId, onRefresh, membro }) {
  const [filtro, setFiltro] = useState("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nf, setNf] = useState(null);
  const [comp, setComp] = useState(null);
  const [diasAbertos, setDiasAbertos] = useState({});
  const [preview, setPreview] = useState(null);
  const [editando, setEditando] = useState(null); // lançamento sendo editado
  const [nfEdit, setNfEdit] = useState(null);
  const [compEdit, setCompEdit] = useState(null);
  const podeCriar = membro?.perfil !== "visualizador";
  const podeExcluir = membro?.perfil !== "visualizador";

  const hoje = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    descricao:"", valor:"", tipo:"entrada",
    tipo_lancamento:"receita_operacional",
    data_competencia:hoje, data_pagamento:"",
    impacta_dre:true, impacta_caixa:true,
    categoria_id:"", conta_id:"", cliente_id:"",
    fornecedor_id:"", projeto_id:"",
    valor_repasse:"0", observacao:"",
    modo_lanc:"unico",       // "unico" | "recorrente"
    recorrencia_meses:12
  });

  // Quando tipo_lancamento muda, atualiza tipo e impacta_dre automaticamente
  const setTipoLanc = (tl) => {
    const g = GRUPOS[tl];
    setForm(f=>({...f, tipo_lancamento:tl, tipo:g.tipo, impacta_dre:g.impactaDRE, categoria_id:""}));
  };

  const catsFiltradas = useMemo(()=>categorias.filter(c=>c.grupo===form.tipo_lancamento),[categorias,form.tipo_lancamento]);

  const lista = useMemo(()=>lancamentos.filter(l=>{
    if(filtro!=="todos" && l.tipo_lancamento!==filtro) return false;
    if(dataInicio && l.data_competencia < dataInicio) return false;
    if(dataFim && l.data_competencia > dataFim) return false;
    return true;
  }).sort((a,b)=>new Date(b.data_competencia)-new Date(a.data_competencia)),[lancamentos,filtro,dataInicio,dataFim]);

  const porDia = useMemo(()=>{
    const d={};
    lista.forEach(l=>{ const dt=l.data_competencia||new Date().toISOString().split("T")[0]; if(!d[dt])d[dt]=[]; d[dt].push(l); });
    return Object.entries(d).sort((a,b)=>new Date(b[0])-new Date(a[0]));
  },[lista]);

  const totais = useMemo(()=>({
    recOp:  lista.filter(l=>l.tipo_lancamento==="receita_operacional").reduce((s,l)=>s+Number(l.valor),0),
    repasse:lista.filter(l=>l.tipo_lancamento==="repasse_terceiros").reduce((s,l)=>s+Number(l.valor),0),
    desp:   lista.filter(l=>["despesa_operacional","imposto"].includes(l.tipo_lancamento)).reduce((s,l)=>s+Number(l.valor),0),
  }),[lista]);

  const salvar = async () => {
    if(!form.descricao||!form.valor) return alert("Preencha descrição e valor.");
    setLoading(true);
    try {
      let nf_url=null,nf_nome=null,comprovante_url=null,comprovante_nome=null;
      if(nf){const r=await uploadArquivo(nf,userId);nf_url=r.url;nf_nome=r.nome;}
      if(comp){const r=await uploadArquivo(comp,userId);comprovante_url=r.url;comprovante_nome=r.nome;}
      const addMeses=(dataStr,n)=>{ const d=new Date(dataStr+"T12:00:00"); d.setMonth(d.getMonth()+n); return d.toISOString().split("T")[0]; };
      const base={
        ...form, valor:Number(form.valor), valor_repasse:Number(form.valor_repasse)||0,
        empresa_id:empresaId, criado_por:userId,
        categoria_id:form.categoria_id||null, conta_id:form.conta_id||null,
        cliente_id:form.cliente_id||null, fornecedor_id:form.fornecedor_id||null,
        projeto_id:form.projeto_id||null, data_pagamento:form.data_pagamento||null,
        nf_url,nf_nome,comprovante_url,comprovante_nome
      };
      if(form.modo_lanc==="recorrente"){
        const n=Number(form.recorrencia_meses)||12;
        const rid=crypto.randomUUID();
        for(let i=0;i<n;i++){
          await sb("lancamentos",{method:"POST",body:JSON.stringify({...base, data_competencia:addMeses(form.data_competencia,i), recorrencia_id:rid, parcela_atual:i+1, total_parcelas:n})});
        }
      } else {
        await sb("lancamentos",{method:"POST",body:JSON.stringify(base)});
      }
      setModal(false); setNf(null); setComp(null);
      setForm({descricao:"",valor:"",tipo:"entrada",tipo_lancamento:"receita_operacional",data_competencia:hoje,data_pagamento:"",impacta_dre:true,impacta_caixa:true,categoria_id:"",conta_id:"",cliente_id:"",fornecedor_id:"",projeto_id:"",valor_repasse:"0",observacao:"",modo_lanc:"unico",recorrencia_meses:12});
      onRefresh();
    } catch(e){alert("Erro: "+e.message);}
    setLoading(false);
  };

  const excluir = async (id) => { if(!confirm("Excluir?"))return; await sb(`lancamentos?id=eq.${id}`,{method:"DELETE",prefer:""}); onRefresh(); };
  const excluirSerie = async (recorrencia_id) => {
    if(!confirm("Cancelar todos os lançamentos futuros desta recorrência?"))return;
    const hoje2=new Date().toISOString().split("T")[0];
    await sb(`lancamentos?recorrencia_id=eq.${recorrencia_id}&data_competencia=gt.${hoje2}`,{method:"DELETE",prefer:""});
    onRefresh();
  };

  const abrirEditar = (l) => {
    setEditando({
      id: l.id,
      descricao: l.descricao||"",
      valor: String(l.valor||""),
      tipo: l.tipo||"entrada",
      tipo_lancamento: l.tipo_lancamento||"receita_operacional",
      data_competencia: l.data_competencia||hoje,
      data_pagamento: l.data_pagamento||"",
      impacta_dre: l.impacta_dre!==false,
      impacta_caixa: l.impacta_caixa!==false,
      categoria_id: l.categoria_id||"",
      conta_id: l.conta_id||"",
      cliente_id: l.cliente_id||"",
      fornecedor_id: l.fornecedor_id||"",
      projeto_id: l.projeto_id||"",
      valor_repasse: String(l.valor_repasse||"0"),
      observacao: l.observacao||"",
      nf_url: l.nf_url||null,
      nf_nome: l.nf_nome||null,
      comprovante_url: l.comprovante_url||null,
      comprovante_nome: l.comprovante_nome||null,
    });
    setNfEdit(null);
    setCompEdit(null);
  };

  const salvarEdicao = async () => {
    if(!editando.descricao||!editando.valor) return alert("Preencha descrição e valor.");
    setLoading(true);
    try {
      let nf_url=editando.nf_url, nf_nome=editando.nf_nome;
      let comprovante_url=editando.comprovante_url, comprovante_nome=editando.comprovante_nome;
      if(nfEdit){ const r=await uploadArquivo(nfEdit,userId); nf_url=r.url; nf_nome=r.nome; }
      if(compEdit){ const r=await uploadArquivo(compEdit,userId); comprovante_url=r.url; comprovante_nome=r.nome; }
      await sb(`lancamentos?id=eq.${editando.id}`, { method:"PATCH", body:JSON.stringify({
        descricao: editando.descricao,
        valor: Number(editando.valor),
        tipo: editando.tipo,
        tipo_lancamento: editando.tipo_lancamento,
        data_competencia: editando.data_competencia,
        data_pagamento: editando.data_pagamento||null,
        impacta_dre: editando.impacta_dre,
        impacta_caixa: editando.impacta_caixa,
        categoria_id: editando.categoria_id||null,
        conta_id: editando.conta_id||null,
        cliente_id: editando.cliente_id||null,
        fornecedor_id: editando.fornecedor_id||null,
        projeto_id: editando.projeto_id||null,
        valor_repasse: Number(editando.valor_repasse)||0,
        observacao: editando.observacao||null,
        nf_url, nf_nome, comprovante_url, comprovante_nome,
      })});
      setEditando(null); setNfEdit(null); setCompEdit(null);
      onRefresh();
    } catch(e){ alert("Erro: "+e.message); }
    setLoading(false);
  };

  const CORES_GRUPO = { receita_operacional:"#818cf8", repasse_terceiros:"#f97316", despesa_operacional:"#34d399", imposto:"#f87171", taxa_bancaria:"#94a3b8", transferencia_interna:"#cbd5e1" };
  const meses=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const dias=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const fmtDt=(data)=>{ if(!data)return""; const[y,m,d]=data.split("-"); return `${dias[new Date(Number(y),Number(m)-1,Number(d)).getDay()]}, ${d} ${meses[Number(m)-1]}`; };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:700, color:"#fff", marginBottom:2 }}>Lançamentos</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{lista.length} registros</div>
        </div>
        {podeCriar && <button onClick={()=>setModal(true)} style={{ background:"#6366f1", border:"none", borderRadius:10, padding:"9px 18px", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>+ Novo lançamento</button>}
      </div>

      {/* KPIs compactos */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        {[["Receita Operacional",totais.recOp,"#818cf8"],["Repasse Terceiros",totais.repasse,"#f97316"],["Despesas",totais.desp,"#f87171"],["Lucro",totais.recOp-totais.desp,(totais.recOp-totais.desp)>=0?"#34d399":"#f87171"]].map(([l,v,c])=>(
          <div key={l} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"8px 14px" }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:3 }}>{l}</div>
            <div style={{ fontSize:14, fontWeight:700, color:c }}>{fmt(v)}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ display:"flex", gap:1, background:"rgba(255,255,255,0.04)", borderRadius:10, padding:3 }}>
          {[["todos","Todos"],["receita_operacional","Receita Op."],["repasse_terceiros","Repasse"],["despesa_operacional","Despesa Op."],["despesa_financeira","Desp. Financeira"],["imposto","Imposto"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFiltro(v)} style={{ padding:"5px 11px", borderRadius:8, border:"none", background:filtro===v?"rgba(99,102,241,0.25)":"transparent", color:filtro===v?"#818cf8":"rgba(255,255,255,0.45)", fontSize:11, cursor:"pointer", fontWeight:filtro===v?600:400, whiteSpace:"nowrap" }}>{l}</button>
          ))}
        </div>
        <input type="date" value={dataInicio} onChange={e=>setDataInicio(e.target.value)} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"6px 10px", color:"#fff", fontSize:12, outline:"none" }} />
        <span style={{ color:"rgba(255,255,255,0.3)", fontSize:12 }}>até</span>
        <input type="date" value={dataFim} onChange={e=>setDataFim(e.target.value)} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"6px 10px", color:"#fff", fontSize:12, outline:"none" }} />
        <button onClick={()=>{setDataInicio(new Date().toISOString().slice(0,7)+"-01");setDataFim(new Date().toISOString().split("T")[0]);}} style={{ background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:8, padding:"6px 12px", color:"#818cf8", fontSize:11, cursor:"pointer" }}>Mês</button>
        <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
          <button onClick={()=>imprimirExtrato("resumido",porDia,categorias,clientes,projetos)} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"6px 12px", color:"rgba(255,255,255,0.6)", fontSize:11, cursor:"pointer" }}>🖨 Resumido</button>
          <button onClick={()=>imprimirExtrato("detalhado",porDia,categorias,clientes,projetos)} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"6px 12px", color:"rgba(255,255,255,0.6)", fontSize:11, cursor:"pointer" }}>🖨 Detalhado</button>
        </div>
      </div>

      {/* Lista por dia */}
      {porDia.length===0 && <div style={{ textAlign:"center", padding:"40px 0", color:"rgba(255,255,255,0.2)" }}><div style={{ fontSize:28, marginBottom:8 }}>◎</div><div>Nenhum lançamento no período</div></div>}
      {porDia.map(([data,itens])=>{
        const entradas=itens.filter(l=>l.tipo==="entrada").reduce((s,l)=>s+Number(l.valor),0);
        const saidas=itens.filter(l=>l.tipo==="saida").reduce((s,l)=>s+Number(l.valor),0);
        const aberto=diasAbertos[data];
        return (
          <div key={data} style={{ marginBottom:8 }}>
            <button onClick={()=>setDiasAbertos(p=>({...p,[data]:!p[data]}))} style={{ width:"100%", display:"flex", alignItems:"center", gap:14, background:aberto?"#1a1a2e":"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:aberto?"12px 12px 0 0":12, padding:"11px 16px", cursor:"pointer" }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#fff", flex:1, textAlign:"left" }}>{fmtDt(data)}</div>
              <div style={{ display:"flex", gap:14, alignItems:"center" }}>
                {entradas>0&&<span style={{ fontSize:12, color:"#818cf8", fontWeight:500 }}>+{fmt(entradas)}</span>}
                {saidas>0&&<span style={{ fontSize:12, color:"#f87171", fontWeight:500 }}>-{fmt(saidas)}</span>}
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.25)" }}>{itens.length} item{itens.length!==1?"s":""}</span>
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>{aberto?"▲":"▼"}</span>
              </div>
            </button>
            {aberto && (
              <div style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.06)", borderTop:"none", borderRadius:"0 0 12px 12px", overflow:"hidden" }}>
                {itens.map((l,i)=>{
                  const cat=categorias.find(c=>c.id===l.categoria_id);
                  const cli=clientes.find(c=>c.id===l.cliente_id);
                  const proj=projetos.find(p=>p.id===l.projeto_id);
                  const corGrupo=CORES_GRUPO[l.tipo_lancamento]||"#6366f1";
                  return (
                    <div key={l.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 16px", borderBottom:i<itens.length-1?"1px solid rgba(255,255,255,0.04)":"none" }}
>
                      {/* Badge tipo */}
                      <div style={{ background:corGrupo+"22", border:`1px solid ${corGrupo}44`, borderRadius:6, padding:"2px 8px", fontSize:10, color:corGrupo, fontWeight:600, whiteSpace:"nowrap", flexShrink:0 }}>
                        {GRUPOS[l.tipo_lancamento]?.label||l.tipo_lancamento}
                      </div>
                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, color:"#fff", fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{l.descricao}</div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", display:"flex", gap:8, marginTop:2, flexWrap:"wrap" }}>
                          {cat&&<span>{cat.nome}</span>}
                          {cli&&<span>· {cli.nome}</span>}
                          {proj&&<span>· {proj.nome}</span>}
                          {!l.impacta_dre&&<span style={{ color:"#f97316" }}>· fora da DRE</span>}
                        </div>
                      </div>
                      {/* Anexos */}
                      <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                        {l.nf_url && (
                          <button onClick={()=>abrirPreview(l.nf_url, l.nf_nome||"Nota Fiscal", setPreview)}
                            title="Ver Nota Fiscal"
                            style={{ background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:6, color:"#818cf8", cursor:"pointer", fontSize:11, padding:"3px 8px" }}>
                            📄 NF
                          </button>
                        )}
                        {l.comprovante_url && (
                          <button onClick={()=>abrirPreview(l.comprovante_url, l.comprovante_nome||"Comprovante", setPreview)}
                            title="Ver Comprovante"
                            style={{ background:"rgba(16,185,129,0.12)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:6, color:"#34d399", cursor:"pointer", fontSize:11, padding:"3px 8px" }}>
                            🧾 CP
                          </button>
                        )}
                      </div>
                      {/* Valor */}
                      <div style={{ fontSize:14, fontWeight:700, color:l.tipo==="entrada"?"#818cf8":"#f87171", minWidth:90, textAlign:"right" }}>
                        {l.tipo==="entrada"?"+":"-"}{fmt(l.valor)}
                        {l.total_parcelas>1 && <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", fontWeight:400 }}>{l.parcela_atual}/{l.total_parcelas}</div>}
                      </div>
                      {/* Ações */}
                      <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                        {podeCriar && <button onClick={()=>abrirEditar(l)} title="Editar lançamento" style={{ background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:5, color:"#818cf8", cursor:"pointer", fontSize:10, padding:"2px 8px" }}>✏</button>}
                        {l.recorrencia_id && <button onClick={()=>excluirSerie(l.recorrencia_id)} title="Cancelar série futura" style={{ background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:5, color:"#fbbf24", cursor:"pointer", fontSize:10, padding:"2px 6px" }}>⛔</button>}
                        {podeExcluir&&<button onClick={()=>excluir(l.id)} style={{ background:"rgba(239,68,68,0.12)", border:"none", borderRadius:6, color:"#f87171", cursor:"pointer", fontSize:12, padding:"3px 7px" }}>✕</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Modal de Preview de Anexo */}
      {preview && (
        <div onClick={()=>setPreview(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", zIndex:300, padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#13131a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, width:"90%", maxWidth:800, maxHeight:"90vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize:14, fontWeight:600, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:500 }}>{preview.nome}</div>
              <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                <a href={preview.url} download={preview.nome}
                  style={{ background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.3)", borderRadius:8, padding:"6px 14px", color:"#818cf8", fontSize:12, textDecoration:"none", fontWeight:500 }}>
                  ⬇ Baixar
                </a>
                <a href={preview.url} target="_blank" rel="noreferrer"
                  style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"6px 14px", color:"rgba(255,255,255,0.6)", fontSize:12, textDecoration:"none" }}>
                  ↗ Nova aba
                </a>
                <button onClick={()=>setPreview(null)}
                  style={{ background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, padding:"6px 12px", color:"#f87171", fontSize:14, cursor:"pointer" }}>
                  ✕
                </button>
              </div>
            </div>
            {/* Preview */}
            <div style={{ flex:1, overflow:"auto", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.3)", minHeight:200 }}>
              {(preview.tipo||"").startsWith("image/") ? (
                <img src={preview.url} alt={preview.nome} style={{ maxWidth:"100%", maxHeight:"70vh", objectFit:"contain", borderRadius:4 }} />
              ) : (preview.tipo||"") === "application/pdf" ? (
                <iframe src={preview.url} title={preview.nome} style={{ width:"100%", height:"70vh", border:"none" }} />
              ) : (
                <div style={{ textAlign:"center", padding:40 }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>📎</div>
                  <div style={{ fontSize:14, color:"rgba(255,255,255,0.5)", marginBottom:16 }}>{preview.nome}</div>
                  <a href={preview.url} target="_blank" rel="noreferrer"
                    style={{ background:"#6366f1", borderRadius:8, padding:"10px 20px", color:"#fff", textDecoration:"none", fontSize:13, fontWeight:500 }}>
                    Abrir arquivo
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal titulo="Novo lançamento" onClose={()=>setModal(false)}>
          {/* Tipo de lançamento */}
          <Campo label="Tipo de lançamento">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
              {Object.entries(GRUPOS).map(([k,g])=>(
                <button key={k} onClick={()=>setTipoLanc(k)} style={{ padding:"7px 6px", borderRadius:8, border:`1px solid ${form.tipo_lancamento===k?g.cor:"rgba(255,255,255,0.08)"}`, background:form.tipo_lancamento===k?g.cor+"22":"transparent", color:form.tipo_lancamento===k?g.cor:"rgba(255,255,255,0.4)", fontSize:11, cursor:"pointer", fontWeight:form.tipo_lancamento===k?600:400, textAlign:"center", lineHeight:1.3 }}>
                  {g.label}
                </button>
              ))}
            </div>
            {!form.impacta_dre && <div style={{ marginTop:6, fontSize:11, color:"#f97316", background:"rgba(249,115,22,0.1)", borderRadius:6, padding:"4px 10px" }}>⚠ Este tipo não impacta a DRE</div>}
          </Campo>

          <Campo label="Descrição"><input style={inputStyle} value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})} placeholder="Ex: Fee de gestão - SENAC Maio" /></Campo>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Campo label="Valor total (R$)"><input style={inputStyle} type="number" step="0.01" value={form.valor} onChange={e=>setForm({...form,valor:e.target.value})} /></Campo>
            <Campo label="Data competência"><input style={inputStyle} type="date" value={form.data_competencia} onChange={e=>setForm({...form,data_competencia:e.target.value})} /></Campo>
          </div>

          {form.tipo_lancamento==="repasse_terceiros" && (
            <div style={{ background:"rgba(249,115,22,0.08)", border:"1px solid rgba(249,115,22,0.2)", borderRadius:8, padding:"10px 14px", marginBottom:14 }}>
              <div style={{ fontSize:11, color:"#f97316", fontWeight:600, marginBottom:6 }}>REPASSE / PASS-THROUGH</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>Este valor pertence a terceiros e não entra na sua DRE como receita.</div>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Campo label="Categoria">
              <select style={selectStyle} value={form.categoria_id} onChange={e=>setForm({...form,categoria_id:e.target.value})}>
                <option style={optionStyle} value="">Selecione...</option>
                {catsFiltradas.map(c=><option style={optionStyle} key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Campo>
            <Campo label="Conta bancária">
              <select style={selectStyle} value={form.conta_id} onChange={e=>setForm({...form,conta_id:e.target.value})}>
                <option style={optionStyle} value="">Sem conta</option>
                {contas.map(c=><option style={optionStyle} key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Campo>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Campo label="Cliente">
              <select style={selectStyle} value={form.cliente_id} onChange={e=>setForm({...form,cliente_id:e.target.value})}>
                <option style={optionStyle} value="">Sem cliente</option>
                {clientes.map(c=><option style={optionStyle} key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Campo>
            <Campo label="Projeto / Campanha">
              <select style={selectStyle} value={form.projeto_id} onChange={e=>setForm({...form,projeto_id:e.target.value})}>
                <option style={optionStyle} value="">Sem projeto</option>
                {projetos.map(p=><option style={optionStyle} key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </Campo>
          </div>

          {["repasse_terceiros","despesa_operacional"].includes(form.tipo_lancamento) && (
            <Campo label="Fornecedor">
              <select style={selectStyle} value={form.fornecedor_id} onChange={e=>setForm({...form,fornecedor_id:e.target.value})}>
                <option style={optionStyle} value="">Sem fornecedor</option>
                {fornecedores.map(f=><option style={optionStyle} key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </Campo>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Campo label="Data pagamento (opcional)"><input style={inputStyle} type="date" value={form.data_pagamento} onChange={e=>setForm({...form,data_pagamento:e.target.value})} /></Campo>
            <Campo label="Impacta DRE?">
              <button onClick={()=>setForm({...form,impacta_dre:!form.impacta_dre})} style={{ width:"100%", padding:"10px", borderRadius:8, border:`1px solid ${form.impacta_dre?"#6366f1":"#f97316"}`, background:form.impacta_dre?"rgba(99,102,241,0.12)":"rgba(249,115,22,0.12)", color:form.impacta_dre?"#818cf8":"#f97316", cursor:"pointer", fontSize:13, fontWeight:500 }}>
                {form.impacta_dre?"✓ Sim, impacta DRE":"✕ Não impacta DRE"}
              </button>
            </Campo>
          </div>

          <Campo label="Observação"><textarea style={{ ...inputStyle, resize:"none", height:55 }} value={form.observacao} onChange={e=>setForm({...form,observacao:e.target.value})} /></Campo>

          {/* Recorrência */}
          <Campo label="Recorrência">
            <div style={{ display:"flex", gap:6 }}>
              {[["unico","Lançamento único"],["recorrente","Recorrente"]].map(([v,l])=>(
                <button key={v} onClick={()=>setForm({...form,modo_lanc:v})}
                  style={{ flex:1, padding:"9px 6px", borderRadius:8, border:`1px solid ${form.modo_lanc===v?"#6366f1":"rgba(255,255,255,0.1)"}`, background:form.modo_lanc===v?"rgba(99,102,241,0.2)":"transparent", color:form.modo_lanc===v?"#818cf8":"rgba(255,255,255,0.45)", fontSize:12, cursor:"pointer", fontWeight:form.modo_lanc===v?600:400 }}>
                  {l}
                </button>
              ))}
            </div>
          </Campo>
          {form.modo_lanc==="recorrente" && (
            <Campo label="Duração (meses)">
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <input style={{ ...inputStyle, width:80 }} type="number" min="2" max="120" value={form.recorrencia_meses} onChange={e=>setForm({...form,recorrencia_meses:e.target.value})} />
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>
                  {form.recorrencia_meses} meses de {form.valor ? fmt(Number(form.valor)) : "R$ --"}
                </div>
              </div>
            </Campo>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Campo label="📄 Nota Fiscal"><input type="file" accept="image/*,.pdf" onChange={e=>setNf(e.target.files[0])} style={{ ...inputStyle, padding:"7px 10px", fontSize:12 }} />{nf&&<div style={{ fontSize:11, color:"#34d399", marginTop:3 }}>✓ {nf.name.slice(0,20)}</div>}</Campo>
            <Campo label="🧾 Comprovante"><input type="file" accept="image/*,.pdf" onChange={e=>setComp(e.target.files[0])} style={{ ...inputStyle, padding:"7px 10px", fontSize:12 }} />{comp&&<div style={{ fontSize:11, color:"#34d399", marginTop:3 }}>✓ {comp.name.slice(0,20)}</div>}</Campo>
          </div>
          <BtnRow onCancel={()=>setModal(false)} onSave={salvar} loading={loading} />
        </Modal>
      )}

      {/* Modal de edição de lançamento */}
      {editando && (
        <Modal titulo="Editar lançamento" onClose={()=>setEditando(null)}>
          <Campo label="Descrição"><input style={inputStyle} value={editando.descricao} onChange={e=>setEditando({...editando,descricao:e.target.value})} /></Campo>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Campo label="Valor (R$)"><input style={inputStyle} type="number" step="0.01" value={editando.valor} onChange={e=>setEditando({...editando,valor:e.target.value})} /></Campo>
            <Campo label="Data competência"><input style={inputStyle} type="date" value={editando.data_competencia} onChange={e=>setEditando({...editando,data_competencia:e.target.value})} /></Campo>
          </div>
          <Campo label="Tipo de lançamento">
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {Object.entries(GRUPOS).map(([k,g])=>(
                <button key={k} onClick={()=>setEditando({...editando,tipo_lancamento:k,tipo:g.tipo,impacta_dre:g.impactaDRE,categoria_id:""})}
                  style={{ padding:"6px 10px", borderRadius:7, border:`1px solid ${editando.tipo_lancamento===k?g.cor:"rgba(255,255,255,0.08)"}`, background:editando.tipo_lancamento===k?g.cor+"22":"transparent", color:editando.tipo_lancamento===k?g.cor:"rgba(255,255,255,0.4)", fontSize:11, cursor:"pointer" }}>
                  {g.label}
                </button>
              ))}
            </div>
          </Campo>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Campo label="Categoria">
              <select style={selectStyle} value={editando.categoria_id} onChange={e=>setEditando({...editando,categoria_id:e.target.value})}>
                <option style={optionStyle} value="">Sem categoria</option>
                {categorias.filter(c=>c.grupo===editando.tipo_lancamento).map(c=><option style={optionStyle} key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Campo>
            <Campo label="Conta bancária">
              <select style={selectStyle} value={editando.conta_id} onChange={e=>setEditando({...editando,conta_id:e.target.value})}>
                <option style={optionStyle} value="">Sem conta</option>
                {contas.map(c=><option style={optionStyle} key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Campo>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Campo label="Cliente">
              <select style={selectStyle} value={editando.cliente_id} onChange={e=>setEditando({...editando,cliente_id:e.target.value})}>
                <option style={optionStyle} value="">Sem cliente</option>
                {clientes.map(c=><option style={optionStyle} key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Campo>
            <Campo label="Projeto">
              <select style={selectStyle} value={editando.projeto_id} onChange={e=>setEditando({...editando,projeto_id:e.target.value})}>
                <option style={optionStyle} value="">Sem projeto</option>
                {projetos.map(p=><option style={optionStyle} key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </Campo>
          </div>
          {["repasse_terceiros","despesa_operacional","taxa_bancaria","despesa_financeira"].includes(editando.tipo_lancamento) && (
            <Campo label="Fornecedor">
              <select style={selectStyle} value={editando.fornecedor_id} onChange={e=>setEditando({...editando,fornecedor_id:e.target.value})}>
                <option style={optionStyle} value="">Sem fornecedor</option>
                {fornecedores.map(f=><option style={optionStyle} key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </Campo>
          )}
          <Campo label="Observação"><textarea style={{ ...inputStyle, resize:"none", height:55 }} value={editando.observacao} onChange={e=>setEditando({...editando,observacao:e.target.value})} /></Campo>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Campo label="📄 Nota Fiscal">
              <input type="file" accept="image/*,.pdf" onChange={e=>setNfEdit(e.target.files[0])} style={{ ...inputStyle, padding:"7px 10px", fontSize:12 }} />
              {nfEdit && <div style={{ fontSize:11, color:"#34d399", marginTop:3 }}>✓ {nfEdit.name.slice(0,20)}</div>}
              {!nfEdit && editando.nf_url && <div style={{ fontSize:11, color:"#818cf8", marginTop:3 }}>📄 NF já anexada — subir novo substitui</div>}
            </Campo>
            <Campo label="🧾 Comprovante">
              <input type="file" accept="image/*,.pdf" onChange={e=>setCompEdit(e.target.files[0])} style={{ ...inputStyle, padding:"7px 10px", fontSize:12 }} />
              {compEdit && <div style={{ fontSize:11, color:"#34d399", marginTop:3 }}>✓ {compEdit.name.slice(0,20)}</div>}
              {!compEdit && editando.comprovante_url && <div style={{ fontSize:11, color:"#818cf8", marginTop:3 }}>🧾 Comprovante já anexado — subir novo substitui</div>}
            </Campo>
          </div>
          <BtnRow onCancel={()=>setEditando(null)} onSave={salvarEdicao} loading={loading} />
        </Modal>
      )}
    </div>
  );
}
function DRE({ lancamentos, categorias }) {
  const hoje = new Date().toISOString().split("T")[0];
  const primeiroDia = new Date().toISOString().slice(0,7)+"-01";
  const [inicio, setInicio] = useState(primeiroDia);
  const [fim, setFim] = useState(hoje);

  const base = useMemo(()=>lancamentos.filter(l=>{
    if(inicio && l.data_competencia < inicio) return false;
    if(fim && l.data_competencia > fim) return false;
    return true;
  }),[lancamentos,inicio,fim]);

  // ── Cálculos ──────────────────────────────────────────────────────────────
  const recBruta   = base.filter(l=>l.tipo_lancamento==="receita_operacional").reduce((s,l)=>s+Number(l.valor),0);
  const impostos   = base.filter(l=>l.tipo_lancamento==="imposto").reduce((s,l)=>s+Number(l.valor),0);
  const recLiq     = recBruta - impostos;
  const despOp     = base.filter(l=>l.tipo_lancamento==="despesa_operacional").reduce((s,l)=>s+Number(l.valor),0);
  const ebit       = recLiq - despOp;
  const despFin    = base.filter(l=>["despesa_financeira","taxa_bancaria"].includes(l.tipo_lancamento)).reduce((s,l)=>s+Number(l.valor),0);
  const lucroLiq   = ebit - despFin;
  const margemEbit = recLiq>0 ? (ebit/recLiq)*100 : 0;
  const margemLiq  = recLiq>0 ? (lucroLiq/recLiq)*100 : 0;
  const pctFin     = recLiq>0 ? (despFin/recLiq)*100 : 0;

  // Por subgrupo de despesas operacionais
  const subgruposOp = useMemo(()=>{
    const grupos = {};
    base.filter(l=>l.tipo_lancamento==="despesa_operacional").forEach(l=>{
      const cat = categorias.find(c=>c.id===l.categoria_id);
      const sg = cat?.subgrupo || "outros";
      if(!grupos[sg]) grupos[sg] = { total:0, cats:{} };
      grupos[sg].total += Number(l.valor);
      const cn = cat?.nome || "Outros";
      grupos[sg].cats[cn] = (grupos[sg].cats[cn]||0) + Number(l.valor);
    });
    return grupos;
  },[base,categorias]);

  // Por categoria de despesas financeiras
  const catsFin = useMemo(()=>{
    const m = {};
    base.filter(l=>["despesa_financeira","taxa_bancaria"].includes(l.tipo_lancamento)).forEach(l=>{
      const cat = categorias.find(c=>c.id===l.categoria_id);
      const cn = cat?.nome || "Outras";
      m[cn] = (m[cn]||0) + Number(l.valor);
    });
    return Object.entries(m).sort((a,b)=>b[1]-a[1]);
  },[base,categorias]);

  // Por categoria de receita
  const catsRec = useMemo(()=>{
    const m = {};
    base.filter(l=>l.tipo_lancamento==="receita_operacional").forEach(l=>{
      const cat = categorias.find(c=>c.id===l.categoria_id);
      const cn = cat?.nome || "Outros";
      m[cn] = (m[cn]||0) + Number(l.valor);
    });
    return Object.entries(m).sort((a,b)=>b[1]-a[1]);
  },[base,categorias]);

  const cor = (v) => v >= 0 ? "#34d399" : "#f87171";
  const corPct = (v) => v >= 20 ? "#34d399" : v >= 10 ? "#fbbf24" : "#f87171";

  const Linha = ({label, valor, destaque=false, indent=0, corValor=null, borda=false}) => (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:`${destaque?"12px":"7px"} 0`, borderBottom: borda?"2px solid rgba(255,255,255,0.12)":"1px solid rgba(255,255,255,0.04)", paddingLeft: indent*16 }}>
      <span style={{ fontSize:destaque?14:13, color:destaque?"#fff":"rgba(255,255,255,0.65)", fontWeight:destaque?700:400 }}>{label}</span>
      <span style={{ fontSize:destaque?16:13, color:corValor||(destaque?cor(valor):"rgba(255,255,255,0.8)"), fontWeight:destaque?700:500 }}>{fmt(valor)}</span>
    </div>
  );

  const SUBG_LABELS = { pessoal:"Pessoal", estrutura:"Estrutura", tecnologia:"Tecnologia", marketing:"Marketing", comercial:"Comercial", administrativo:"Administrativo", outros:"Outros" };

  return (
    <div>
      <div style={{ fontSize:22, fontWeight:700, color:"#fff", marginBottom:4 }}>DRE — Demonstrativo de Resultado</div>
      <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:18 }}>Estrutura gerencial completa da agência</div>

      {/* Filtro */}
      <div style={{ display:"flex", gap:10, marginBottom:20, background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"10px 16px", alignItems:"center", flexWrap:"wrap" }}>
        <input type="date" value={inicio} onChange={e=>setInicio(e.target.value)} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, padding:"5px 10px", color:"#fff", fontSize:12, outline:"none" }} />
        <span style={{ color:"rgba(255,255,255,0.3)" }}>até</span>
        <input type="date" value={fim} onChange={e=>setFim(e.target.value)} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, padding:"5px 10px", color:"#fff", fontSize:12, outline:"none" }} />
        <button onClick={()=>{setInicio(new Date().toISOString().slice(0,7)+"-01");setFim(new Date().toISOString().split("T")[0]);}} style={{ background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.25)", borderRadius:7, padding:"5px 12px", color:"#818cf8", fontSize:11, cursor:"pointer" }}>Mês</button>
        <button onClick={()=>{ const a=new Date().getFullYear(); setInicio(`${a}-01-01`); setFim(`${a}-12-31`); }} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, padding:"5px 12px", color:"rgba(255,255,255,0.4)", fontSize:11, cursor:"pointer" }}>Ano</button>
        <div style={{ marginLeft:"auto", fontSize:11, color:"#f97316", background:"rgba(249,115,22,0.08)", borderRadius:6, padding:"4px 10px" }}>⚠ Repasses excluídos</div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[
          ["Receita Líquida", recLiq, "#818cf8", null],
          ["EBIT", ebit, cor(ebit), `Margem: ${fmtPct(margemEbit)}`],
          ["Desp. Financeiras", despFin, "#fbbf24", `${fmtPct(pctFin)} da rec. líq.`],
          ["Lucro Líquido", lucroLiq, cor(lucroLiq), `Margem: ${fmtPct(margemLiq)}`],
        ].map(([l,v,c,sub])=>(
          <div key={l} style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 16px" }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8, fontWeight:600 }}>{l}</div>
            <div style={{ fontSize:20, fontWeight:700, color:c }}>{fmt(v)}</div>
            {sub && <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:4 }}>{sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {/* DRE Estruturada */}
        <div style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:16 }}>Demonstrativo</div>

          {/* Receita */}
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:10, color:"#818cf8", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Receita</div>
            <Linha label="( + ) Receita Bruta" valor={recBruta} corValor="#818cf8" />
            {catsRec.map(([nome,v])=><Linha key={nome} label={nome} valor={v} indent={1} corValor="#818cf8" />)}
            <Linha label="( − ) Impostos e Deduções" valor={impostos} corValor="#f87171" />
            <Linha label="( = ) Receita Líquida" valor={recLiq} destaque corValor="#818cf8" borda />
          </div>

          {/* Despesas Operacionais */}
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:10, color:"#10b981", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4, marginTop:8 }}>Despesas Operacionais</div>
            {Object.entries(subgruposOp).sort((a,b)=>b[1].total-a[1].total).map(([sg,data])=>(
              <div key={sg}>
                <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0 2px", paddingLeft:0 }}>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.45)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{SUBG_LABELS[sg]||sg}</span>
                  <span style={{ fontSize:11, color:"#f87171", fontWeight:500 }}>{fmt(data.total)}</span>
                </div>
                {Object.entries(data.cats).map(([cn,v])=><Linha key={cn} label={cn} valor={v} indent={1} corValor="#f87171" />)}
              </div>
            ))}
            <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", marginTop:4 }}>
              <Linha label="( = ) EBIT — Resultado Operacional" valor={ebit} destaque corValor={cor(ebit)} borda />
            </div>
          </div>

          {/* Despesas Financeiras */}
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:10, color:"#fbbf24", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4, marginTop:8 }}>Despesas Financeiras</div>
            {catsFin.map(([nome,v])=><Linha key={nome} label={nome} valor={v} indent={1} corValor="#fbbf24" />)}
            <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", marginTop:4 }}>
              <Linha label="( − ) Total Despesas Financeiras" valor={despFin} corValor="#fbbf24" />
            </div>
          </div>

          {/* Resultado Final */}
          <div style={{ borderTop:"2px solid rgba(255,255,255,0.15)", marginTop:8, paddingTop:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
              <span style={{ fontSize:16, color:"#fff", fontWeight:700 }}>( = ) Lucro Líquido</span>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:26, fontWeight:700, color:cor(lucroLiq) }}>{fmt(lucroLiq)}</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>Margem: {fmtPct(margemLiq)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna direita - análises */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {/* Indicador de Custo Financeiro */}
          <div style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:18 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#fbbf24", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14 }}>⚠ Custo Financeiro</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              <div style={{ background:"rgba(251,191,36,0.08)", borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>TOTAL</div>
                <div style={{ fontSize:18, fontWeight:700, color:"#fbbf24" }}>{fmt(despFin)}</div>
              </div>
              <div style={{ background:"rgba(251,191,36,0.08)", borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>% RECEITA LÍQ.</div>
                <div style={{ fontSize:18, fontWeight:700, color:pctFin>5?"#f87171":pctFin>2?"#fbbf24":"#34d399" }}>{fmtPct(pctFin)}</div>
              </div>
            </div>
            {catsFin.length===0 && <div style={{ fontSize:12, color:"rgba(255,255,255,0.2)" }}>Sem despesas financeiras no período</div>}
            {catsFin.map(([nome,v])=>(
              <div key={nome} style={{ marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>{nome}</span>
                  <span style={{ fontSize:12, color:"#fbbf24", fontWeight:500 }}>{fmt(v)}</span>
                </div>
                <div style={{ height:3, background:"rgba(255,255,255,0.07)", borderRadius:999 }}>
                  <div style={{ width:`${despFin?(v/despFin*100):0}%`, height:"100%", background:"#fbbf24", borderRadius:999 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Receitas por serviço */}
          <div style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:18 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>Receitas por serviço</div>
            {catsRec.length===0 && <div style={{ fontSize:12, color:"rgba(255,255,255,0.2)" }}>Sem receitas</div>}
            {catsRec.map(([nome,v])=>(
              <div key={nome} style={{ marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>{nome}</span>
                  <span style={{ fontSize:12, color:"#818cf8", fontWeight:500 }}>{fmt(v)}</span>
                </div>
                <div style={{ height:3, background:"rgba(255,255,255,0.07)", borderRadius:999 }}>
                  <div style={{ width:`${recBruta?(v/recBruta*100):0}%`, height:"100%", background:"#6366f1", borderRadius:999 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Resumo de margens */}
          <div style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:18 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>Margens</div>
            {[
              ["Margem Bruta (EBIT)", margemEbit],
              ["Impacto Financeiro", -pctFin],
              ["Margem Líquida", margemLiq],
            ].map(([label,pct])=>(
              <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>{label}</span>
                <span style={{ fontSize:13, fontWeight:700, color:corPct(Math.abs(pct)) }}>{fmtPct(pct)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Fluxo de Caixa ─────────────────────────────────────────────────────────────
function FluxoCaixa({ lancamentos, categorias, contas }) {
  const hoje = new Date().toISOString().split("T")[0];
  const primeiroDia = new Date().toISOString().slice(0,7)+"-01";
  const [inicio, setInicio] = useState(primeiroDia);
  const [fim, setFim] = useState(hoje);

  // Saldo inicial = soma dos saldos cadastrados nas contas (atualizados pelo OFX)
  const saldoInicial = useMemo(()=>(contas||[]).reduce((s,c)=>s+Number(c.saldo),0),[contas]);

  const base = useMemo(()=>lancamentos.filter(l=>{
    if(l.impacta_caixa===false) return false;
    if(inicio && l.data_competencia < inicio) return false;
    if(fim && l.data_competencia > fim) return false;
    return true;
  }),[lancamentos,inicio,fim]);

  const porDia = useMemo(()=>{
    const d={};
    base.forEach(l=>{ const dt=l.data_competencia; if(!d[dt])d[dt]={ent:0,sai:0,items:[]}; if(l.tipo==="entrada")d[dt].ent+=Number(l.valor); else d[dt].sai+=Number(l.valor); d[dt].items.push(l); });
    return Object.entries(d).sort((a,b)=>a[0].localeCompare(b[0]));
  },[base]);

  const totalEnt = base.filter(l=>l.tipo==="entrada").reduce((s,l)=>s+Number(l.valor),0);
  const totalSai = base.filter(l=>l.tipo==="saida").reduce((s,l)=>s+Number(l.valor),0);
  const dias=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const meses=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  return (
    <div>
      <div style={{ fontSize:22, fontWeight:700, color:"#fff", marginBottom:4 }}>Fluxo de Caixa</div>
      <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:18 }}>Todo dinheiro que entrou e saiu — incluindo repasses de terceiros</div>

      <div style={{ display:"flex", gap:10, marginBottom:20, background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"10px 16px", alignItems:"center", flexWrap:"wrap" }}>
        <input type="date" value={inicio} onChange={e=>setInicio(e.target.value)} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, padding:"5px 10px", color:"#fff", fontSize:12, outline:"none" }} />
        <span style={{ color:"rgba(255,255,255,0.3)" }}>até</span>
        <input type="date" value={fim} onChange={e=>setFim(e.target.value)} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, padding:"5px 10px", color:"#fff", fontSize:12, outline:"none" }} />
        <button onClick={()=>{setInicio(primeiroDia);setFim(hoje);}} style={{ background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.25)", borderRadius:7, padding:"5px 12px", color:"#818cf8", fontSize:11, cursor:"pointer" }}>Mês</button>
        <div style={{ display:"flex", gap:16, marginLeft:"auto" }}>
          <div><div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>SALDO INICIAL</div><div style={{ fontSize:15, fontWeight:700, color:"rgba(255,255,255,0.6)" }}>{fmt(saldoInicial)}</div></div>
          <div><div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>ENTRADAS</div><div style={{ fontSize:15, fontWeight:700, color:"#818cf8" }}>{fmt(totalEnt)}</div></div>
          <div><div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>SAÍDAS</div><div style={{ fontSize:15, fontWeight:700, color:"#f87171" }}>{fmt(totalSai)}</div></div>
          <div><div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>SALDO ATUAL</div><div style={{ fontSize:15, fontWeight:700, color:(saldoInicial+totalEnt-totalSai)>=0?"#34d399":"#f87171" }}>{fmt(saldoInicial+totalEnt-totalSai)}</div></div>
        </div>
      </div>

      <div style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
            {["Data","Dia","Entradas","Saídas","Saldo do dia","Acumulado"].map(h=>(
              <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10, color:"rgba(255,255,255,0.35)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {porDia.length===0 && <tr><td colSpan={6} style={{ padding:24, textAlign:"center", color:"rgba(255,255,255,0.2)", fontSize:13 }}>Sem movimentações no período</td></tr>}
            {(()=>{ let acum=0; return porDia.map(([data,v])=>{
              const sd=v.ent-v.sai; acum+=sd;
              const[y,m,d]=data.split("-");
              const ds=dias[new Date(Number(y),Number(m)-1,Number(d)).getDay()];
              return (<tr key={data} style={{ borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                <td style={{ padding:"9px 14px", fontSize:12, color:"rgba(255,255,255,0.6)" }}>{d}/{m}/{y}</td>
                <td style={{ padding:"9px 14px", fontSize:12, color:"rgba(255,255,255,0.35)" }}>{ds}</td>
                <td style={{ padding:"9px 14px", fontSize:12, color:"#818cf8", fontWeight:500 }}>{v.ent>0?fmt(v.ent):"—"}</td>
                <td style={{ padding:"9px 14px", fontSize:12, color:"#f87171", fontWeight:500 }}>{v.sai>0?fmt(v.sai):"—"}</td>
                <td style={{ padding:"9px 14px", fontSize:12, fontWeight:600, color:sd>=0?"#34d399":"#f87171" }}>{fmt(sd)}</td>
                <td style={{ padding:"9px 14px", fontSize:12, fontWeight:600, color:acum>=0?"#818cf8":"#f87171" }}>{fmt(acum)}</td>
              </tr>);
            }); })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Por Cliente ────────────────────────────────────────────────────────────────
function PorCliente({ lancamentos, clientes, projetos }) {
  const hoje = new Date().toISOString().split("T")[0];
  const primeiroDia = new Date().toISOString().slice(0,7)+"-01";
  const [inicio, setInicio] = useState(primeiroDia);
  const [fim, setFim] = useState(hoje);

  const base = useMemo(()=>lancamentos.filter(l=>{
    if(inicio && l.data_competencia < inicio) return false;
    if(fim && l.data_competencia > fim) return false;
    return true;
  }),[lancamentos,inicio,fim]);

  const dados = useMemo(()=>clientes.map(cl=>{
    const lCl = base.filter(l=>l.cliente_id===cl.id);
    const recOp = lCl.filter(l=>l.tipo_lancamento==="receita_operacional").reduce((s,l)=>s+Number(l.valor),0);
    const repasse = lCl.filter(l=>l.tipo_lancamento==="repasse_terceiros").reduce((s,l)=>s+Number(l.valor),0);
    const volume = recOp + repasse;
    const projsCl = projetos.filter(p=>p.cliente_id===cl.id);
    return { ...cl, recOp, repasse, volume, projsCl };
  }).filter(cl=>cl.volume>0).sort((a,b)=>b.recOp-a.recOp),[clientes,base,projetos]);

  const totalRecOp = dados.reduce((s,cl)=>s+cl.recOp,0);

  return (
    <div>
      <div style={{ fontSize:22, fontWeight:700, color:"#fff", marginBottom:4 }}>Resultado por Cliente</div>
      <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:18 }}>Receita operacional e volume financeiro por cliente</div>

      <div style={{ display:"flex", gap:10, marginBottom:20, background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"10px 16px", alignItems:"center" }}>
        <input type="date" value={inicio} onChange={e=>setInicio(e.target.value)} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, padding:"5px 10px", color:"#fff", fontSize:12, outline:"none" }} />
        <span style={{ color:"rgba(255,255,255,0.3)" }}>até</span>
        <input type="date" value={fim} onChange={e=>setFim(e.target.value)} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, padding:"5px 10px", color:"#fff", fontSize:12, outline:"none" }} />
        <button onClick={()=>{setInicio(primeiroDia);setFim(hoje);}} style={{ background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.25)", borderRadius:7, padding:"5px 12px", color:"#818cf8", fontSize:11, cursor:"pointer" }}>Mês</button>
      </div>

      {dados.length===0 && <div style={{ textAlign:"center", padding:"40px 0", color:"rgba(255,255,255,0.2)" }}>Nenhum cliente com lançamentos no período</div>}
      {dados.map(cl=>(
        <div key={cl.id} style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px 18px", marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:600, color:"#fff", marginBottom:4 }}>{cl.nome}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{cl.projsCl.length} projeto{cl.projsCl.length!==1?"s":""}</div>
            </div>
            <div style={{ display:"flex", gap:20, textAlign:"right" }}>
              <div><div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:3 }}>REC. OPERACIONAL</div><div style={{ fontSize:16, fontWeight:700, color:"#818cf8" }}>{fmt(cl.recOp)}</div></div>
              {cl.repasse>0&&<div><div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:3 }}>REPASSE</div><div style={{ fontSize:16, fontWeight:700, color:"#f97316" }}>{fmt(cl.repasse)}</div></div>}
              <div><div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:3 }}>VOLUME TOTAL</div><div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.6)" }}>{fmt(cl.volume)}</div></div>
            </div>
          </div>
          <div style={{ height:4, background:"rgba(255,255,255,0.07)", borderRadius:999 }}>
            <div style={{ width:`${totalRecOp?(cl.recOp/totalRecOp*100):0}%`, height:"100%", background:"#6366f1", borderRadius:999 }} />
          </div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:4 }}>{totalRecOp?((cl.recOp/totalRecOp)*100).toFixed(1):0}% da receita operacional total</div>
        </div>
      ))}
    </div>
  );
}

// ── Por Projeto ────────────────────────────────────────────────────────────────
function PorProjeto({ lancamentos, projetos, clientes }) {
  const hoje = new Date().toISOString().split("T")[0];
  const primeiroDia = new Date().toISOString().slice(0,7)+"-01";
  const [inicio, setInicio] = useState(primeiroDia);
  const [fim, setFim] = useState(hoje);

  const base = useMemo(()=>lancamentos.filter(l=>{
    if(inicio && l.data_competencia < inicio) return false;
    if(fim && l.data_competencia > fim) return false;
    return true;
  }),[lancamentos,inicio,fim]);

  const dados = useMemo(()=>projetos.map(p=>{
    const lP = base.filter(l=>l.projeto_id===p.id);
    const recOp = lP.filter(l=>l.tipo_lancamento==="receita_operacional").reduce((s,l)=>s+Number(l.valor),0);
    const repasse = lP.filter(l=>l.tipo_lancamento==="repasse_terceiros").reduce((s,l)=>s+Number(l.valor),0);
    const despesas = lP.filter(l=>["despesa_operacional","imposto"].includes(l.tipo_lancamento)).reduce((s,l)=>s+Number(l.valor),0);
    const lucro = recOp - despesas;
    const margem = recOp > 0 ? (lucro/recOp)*100 : 0;
    const cliente = clientes.find(c=>c.id===p.cliente_id);
    return { ...p, recOp, repasse, despesas, lucro, margem, cliente };
  }).filter(p=>p.recOp>0||p.repasse>0).sort((a,b)=>b.recOp-a.recOp),[projetos,base,clientes]);

  const STATUS_COR = { ativo:"#34d399", pausado:"#fbbf24", concluido:"#818cf8", cancelado:"#f87171" };

  return (
    <div>
      <div style={{ fontSize:22, fontWeight:700, color:"#fff", marginBottom:4 }}>Resultado por Projeto</div>
      <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:18 }}>Rentabilidade e volume por campanha/projeto</div>

      <div style={{ display:"flex", gap:10, marginBottom:20, background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"10px 16px", alignItems:"center" }}>
        <input type="date" value={inicio} onChange={e=>setInicio(e.target.value)} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, padding:"5px 10px", color:"#fff", fontSize:12, outline:"none" }} />
        <span style={{ color:"rgba(255,255,255,0.3)" }}>até</span>
        <input type="date" value={fim} onChange={e=>setFim(e.target.value)} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, padding:"5px 10px", color:"#fff", fontSize:12, outline:"none" }} />
        <button onClick={()=>{setInicio(primeiroDia);setFim(hoje);}} style={{ background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.25)", borderRadius:7, padding:"5px 12px", color:"#818cf8", fontSize:11, cursor:"pointer" }}>Mês</button>
      </div>

      {dados.length===0 && <div style={{ textAlign:"center", padding:"40px 0", color:"rgba(255,255,255,0.2)" }}>Nenhum projeto com lançamentos no período</div>}
      {dados.map(p=>(
        <div key={p.id} style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px 18px", marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                <div style={{ fontSize:15, fontWeight:600, color:"#fff" }}>{p.nome}</div>
                <span style={{ fontSize:10, background:STATUS_COR[p.status]+"22", color:STATUS_COR[p.status], padding:"2px 8px", borderRadius:4, fontWeight:600, textTransform:"capitalize" }}>{p.status}</span>
              </div>
              {p.cliente && <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>Cliente: {p.cliente.nome}</div>}
            </div>
            <div style={{ display:"flex", gap:16, textAlign:"right" }}>
              <div><div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:3 }}>REC. OP.</div><div style={{ fontSize:15, fontWeight:700, color:"#818cf8" }}>{fmt(p.recOp)}</div></div>
              {p.repasse>0&&<div><div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:3 }}>REPASSE</div><div style={{ fontSize:15, fontWeight:700, color:"#f97316" }}>{fmt(p.repasse)}</div></div>}
              <div><div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:3 }}>LUCRO</div><div style={{ fontSize:15, fontWeight:700, color:p.lucro>=0?"#34d399":"#f87171" }}>{fmt(p.lucro)}</div></div>
              <div><div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:3 }}>MARGEM</div><div style={{ fontSize:15, fontWeight:700, color:p.margem>=20?"#34d399":p.margem>=10?"#fbbf24":"#f87171" }}>{fmtPct(p.margem)}</div></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Clientes ───────────────────────────────────────────────────────────────────
function Clientes({ clientes, empresaId, onRefresh, membro }) {
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome:"", contato:"", email:"", telefone:"" });
  const podeCriar = membro?.perfil !== "visualizador";

  const salvar = async () => {
    if(!form.nome) return;
    setLoading(true);
    try { await sb("clientes",{method:"POST",body:JSON.stringify({...form,empresa_id:empresaId,ativo:true})}); setModal(false);setForm({nome:"",contato:"",email:"",telefone:""});onRefresh(); }
    catch(e){alert("Erro: "+e.message);}
    setLoading(false);
  };
  const excluir = async(id)=>{ if(!confirm("Excluir?"))return; await sb(`clientes?id=eq.${id}`,{method:"DELETE",prefer:""});onRefresh(); };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div><div style={{ fontSize:22, fontWeight:700, color:"#fff", marginBottom:2 }}>Clientes</div><div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{clientes.length} cadastrados</div></div>
        {podeCriar && <button onClick={()=>setModal(true)} style={{ background:"#6366f1", border:"none", borderRadius:10, padding:"9px 18px", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>+ Novo cliente</button>}
      </div>
      {clientes.length===0 && <div style={{ textAlign:"center", padding:"40px 0", color:"rgba(255,255,255,0.2)" }}>Nenhum cliente cadastrado</div>}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
        {clientes.map(cl=>(
          <div key={cl.id} style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px 18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ fontSize:14, fontWeight:600, color:"#fff", marginBottom:6 }}>{cl.nome}</div>
              {podeCriar && <button onClick={()=>excluir(cl.id)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.2)", cursor:"pointer", fontSize:14 }}>✕</button>}
            </div>
            {cl.contato && <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>👤 {cl.contato}</div>}
            {cl.email && <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>✉ {cl.email}</div>}
            {cl.telefone && <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>📞 {cl.telefone}</div>}
          </div>
        ))}
      </div>
      {modal && <Modal titulo="Novo cliente" onClose={()=>setModal(false)}>
        <Campo label="Nome da empresa/cliente"><input style={inputStyle} value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} placeholder="Ex: SENAC" /></Campo>
        <Campo label="Contato"><input style={inputStyle} value={form.contato} onChange={e=>setForm({...form,contato:e.target.value})} /></Campo>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Campo label="E-mail"><input style={inputStyle} type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></Campo>
          <Campo label="Telefone"><input style={inputStyle} value={form.telefone} onChange={e=>setForm({...form,telefone:e.target.value})} /></Campo>
        </div>
        <BtnRow onCancel={()=>setModal(false)} onSave={salvar} loading={loading} />
      </Modal>}
    </div>
  );
}

// ── Fornecedores ───────────────────────────────────────────────────────────────
function Fornecedores({ fornecedores, empresaId, onRefresh, membro }) {
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome:"", tipo:"outros", email:"", contato:"" });
  const podeCriar = membro?.perfil !== "visualizador";
  const TIPOS = { grafica:"Gráfica", produtora:"Produtora", midia:"Mídia", influenciador:"Influenciador", outros:"Outros" };
  const CORES_TIPO = { grafica:"#f97316", produtora:"#8b5cf6", midia:"#06b6d4", influenciador:"#ec4899", outros:"#94a3b8" };

  const salvar = async () => {
    if(!form.nome) return;
    setLoading(true);
    try { await sb("fornecedores",{method:"POST",body:JSON.stringify({...form,empresa_id:empresaId,ativo:true})}); setModal(false);setForm({nome:"",tipo:"outros",email:"",contato:""});onRefresh(); }
    catch(e){alert("Erro: "+e.message);}
    setLoading(false);
  };
  const excluir=async(id)=>{ if(!confirm("Excluir?"))return; await sb(`fornecedores?id=eq.${id}`,{method:"DELETE",prefer:""});onRefresh(); };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div><div style={{ fontSize:22, fontWeight:700, color:"#fff", marginBottom:2 }}>Fornecedores</div><div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{fornecedores.length} cadastrados</div></div>
        {podeCriar && <button onClick={()=>setModal(true)} style={{ background:"#6366f1", border:"none", borderRadius:10, padding:"9px 18px", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>+ Novo fornecedor</button>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
        {fornecedores.map(f=>(
          <div key={f.id} style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px 18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:"#fff", marginBottom:6 }}>{f.nome}</div>
                <span style={{ fontSize:11, background:(CORES_TIPO[f.tipo]||"#94a3b8")+"22", color:CORES_TIPO[f.tipo]||"#94a3b8", padding:"2px 8px", borderRadius:4 }}>{TIPOS[f.tipo]||f.tipo}</span>
              </div>
              {podeCriar && <button onClick={()=>excluir(f.id)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.2)", cursor:"pointer", fontSize:14 }}>✕</button>}
            </div>
            {f.contato && <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:8 }}>👤 {f.contato}</div>}
            {f.email && <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>✉ {f.email}</div>}
          </div>
        ))}
      </div>
      {modal && <Modal titulo="Novo fornecedor" onClose={()=>setModal(false)}>
        <Campo label="Nome"><input style={inputStyle} value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} placeholder="Ex: Gráfica Central" /></Campo>
        <Campo label="Tipo">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
            {Object.entries(TIPOS).map(([v,l])=>(
              <button key={v} onClick={()=>setForm({...form,tipo:v})} style={{ padding:"7px", borderRadius:8, border:`1px solid ${form.tipo===v?(CORES_TIPO[v]||"#6366f1"):"rgba(255,255,255,0.08)"}`, background:form.tipo===v?(CORES_TIPO[v]||"#6366f1")+"22":"transparent", color:form.tipo===v?(CORES_TIPO[v]||"#6366f1"):"rgba(255,255,255,0.4)", fontSize:12, cursor:"pointer" }}>{l}</button>
            ))}
          </div>
        </Campo>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Campo label="Contato"><input style={inputStyle} value={form.contato} onChange={e=>setForm({...form,contato:e.target.value})} /></Campo>
          <Campo label="E-mail"><input style={inputStyle} type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></Campo>
        </div>
        <BtnRow onCancel={()=>setModal(false)} onSave={salvar} loading={loading} />
      </Modal>}
    </div>
  );
}

// ── Projetos ───────────────────────────────────────────────────────────────────
function Projetos({ projetos, clientes, empresaId, onRefresh, membro }) {
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome:"", cliente_id:"", descricao:"", status:"ativo", valor_contrato:"", data_inicio:"", data_fim:"" });
  const podeCriar = membro?.perfil !== "visualizador";
  const STATUS = { ativo:"Ativo", pausado:"Pausado", concluido:"Concluído", cancelado:"Cancelado" };
  const STATUS_COR = { ativo:"#34d399", pausado:"#fbbf24", concluido:"#818cf8", cancelado:"#f87171" };

  const salvar = async () => {
    if(!form.nome) return;
    setLoading(true);
    try { await sb("projetos",{method:"POST",body:JSON.stringify({...form,valor_contrato:Number(form.valor_contrato)||0,empresa_id:empresaId,cliente_id:form.cliente_id||null,data_inicio:form.data_inicio||null,data_fim:form.data_fim||null})}); setModal(false);setForm({nome:"",cliente_id:"",descricao:"",status:"ativo",valor_contrato:"",data_inicio:"",data_fim:""});onRefresh(); }
    catch(e){alert("Erro: "+e.message);}
    setLoading(false);
  };
  const excluir=async(id)=>{ if(!confirm("Excluir?"))return; await sb(`projetos?id=eq.${id}`,{method:"DELETE",prefer:""});onRefresh(); };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div><div style={{ fontSize:22, fontWeight:700, color:"#fff", marginBottom:2 }}>Projetos / Campanhas</div><div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{projetos.length} projetos</div></div>
        {podeCriar && <button onClick={()=>setModal(true)} style={{ background:"#6366f1", border:"none", borderRadius:10, padding:"9px 18px", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>+ Novo projeto</button>}
      </div>
      {projetos.length===0 && <div style={{ textAlign:"center", padding:"40px 0", color:"rgba(255,255,255,0.2)" }}>Nenhum projeto cadastrado</div>}
      {projetos.map(p=>{
        const cliente=clientes.find(c=>c.id===p.cliente_id);
        return (
          <div key={p.id} style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px 18px", marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                <div style={{ fontSize:14, fontWeight:600, color:"#fff" }}>{p.nome}</div>
                <span style={{ fontSize:10, background:STATUS_COR[p.status]+"22", color:STATUS_COR[p.status], padding:"2px 8px", borderRadius:4, fontWeight:600 }}>{STATUS[p.status]}</span>
              </div>
              {cliente && <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>Cliente: {cliente.nome}</div>}
              {p.descricao && <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{p.descricao}</div>}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              {Number(p.valor_contrato)>0 && <div style={{ textAlign:"right" }}><div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>CONTRATO</div><div style={{ fontSize:15, fontWeight:600, color:"#818cf8" }}>{fmt(p.valor_contrato)}</div></div>}
              {podeCriar && <button onClick={()=>excluir(p.id)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.2)", cursor:"pointer", fontSize:14 }}>✕</button>}
            </div>
          </div>
        );
      })}
      {modal && <Modal titulo="Novo projeto" onClose={()=>setModal(false)}>
        <Campo label="Nome do projeto / campanha"><input style={inputStyle} value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} placeholder="Ex: Campanha Verão SENAC 2026" /></Campo>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Campo label="Cliente"><select style={selectStyle} value={form.cliente_id} onChange={e=>setForm({...form,cliente_id:e.target.value})}><option style={optionStyle} value="">Sem cliente</option>{clientes.map(c=><option style={optionStyle} key={c.id} value={c.id}>{c.nome}</option>)}</select></Campo>
          <Campo label="Valor do contrato (R$)"><input style={inputStyle} type="number" step="0.01" value={form.valor_contrato} onChange={e=>setForm({...form,valor_contrato:e.target.value})} /></Campo>
        </div>
        <Campo label="Status">
          <div style={{ display:"flex", gap:6 }}>
            {Object.entries(STATUS).map(([v,l])=>(
              <button key={v} onClick={()=>setForm({...form,status:v})} style={{ flex:1, padding:"7px", borderRadius:8, border:`1px solid ${form.status===v?(STATUS_COR[v]||"#6366f1"):"rgba(255,255,255,0.08)"}`, background:form.status===v?(STATUS_COR[v]||"#6366f1")+"22":"transparent", color:form.status===v?(STATUS_COR[v]||"#6366f1"):"rgba(255,255,255,0.4)", fontSize:11, cursor:"pointer" }}>{l}</button>
            ))}
          </div>
        </Campo>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Campo label="Início"><input style={inputStyle} type="date" value={form.data_inicio} onChange={e=>setForm({...form,data_inicio:e.target.value})} /></Campo>
          <Campo label="Fim previsto"><input style={inputStyle} type="date" value={form.data_fim} onChange={e=>setForm({...form,data_fim:e.target.value})} /></Campo>
        </div>
        <Campo label="Descrição"><textarea style={{ ...inputStyle, resize:"none", height:55 }} value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})} /></Campo>
        <BtnRow onCancel={()=>setModal(false)} onSave={salvar} loading={loading} />
      </Modal>}
    </div>
  );
}

// ── Categorias ERP ─────────────────────────────────────────────────────────────
function Categorias({ categorias, subcategorias: subcatsProps, empresaId, onRefresh, membro }) {
  const [modalSub, setModalSub] = useState(null);
  const [subcats, setSubcats] = useState(subcatsProps||[]);
  const [expandido, setExpandido] = useState({});
  const [formSub, setFormSub] = useState({ nome:"", cor:"#6366f1" });

  const carregarSubs = useCallback(async () => {
    try { setSubcats((await sb(`subcategorias?empresa_id=eq.${empresaId}&order=nome.asc`))||[]); } catch {}
  }, [empresaId]);
  useEffect(() => { carregarSubs(); }, [carregarSubs]);

  const salvarSub = async () => {
    if(!formSub.nome) return;
    try { await sb("subcategorias",{method:"POST",body:JSON.stringify({...formSub,empresa_id:empresaId,categoria_id:modalSub.id})}); setModalSub(null);setFormSub({nome:"",cor:"#6366f1"});carregarSubs(); }
    catch(e){alert("Erro: "+e.message);}
  };
  const excluirSub = async(id) => { if(!confirm("Excluir subcategoria?"))return; await sb(`subcategorias?id=eq.${id}`,{method:"DELETE",prefer:""}); carregarSubs(); };
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome:"", grupo:"receita_operacional", cor:"#6366f1" });
  const podeCriar = membro?.perfil !== "visualizador";

  const salvar = async () => {
    if(!form.nome) return alert("Preencha o nome da categoria.");
    setLoading(true);
    try {
      const res = await sb("categorias",{method:"POST",body:JSON.stringify({...form,ordem:0,empresa_id:empresaId})});
      if(res && res[0]?.code) { alert("Erro Supabase: " + (res[0].message || JSON.stringify(res[0]))); setLoading(false); return; }
      setModal(false);
      setForm({nome:"",grupo:"receita_operacional",cor:"#6366f1"});
      onRefresh();
    }
    catch(e){ alert("Erro ao salvar: " + (e.message || JSON.stringify(e))); }
    setLoading(false);
  };
  const excluir=async(id)=>{ if(!confirm("Excluir?"))return; await sb(`categorias?id=eq.${id}`,{method:"DELETE",prefer:""});onRefresh(); };

  const porGrupo = useMemo(()=>{
    const g={};
    categorias.forEach(c=>{ if(!g[c.grupo])g[c.grupo]=[]; g[c.grupo].push(c); });
    return g;
  },[categorias]);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div><div style={{ fontSize:22, fontWeight:700, color:"#fff", marginBottom:2 }}>Categorias</div><div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{categorias.length} categorias</div></div>
        {podeCriar && <button onClick={()=>setModal(true)} style={{ background:"#6366f1", border:"none", borderRadius:10, padding:"9px 18px", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>+ Nova categoria</button>}
      </div>
      {Object.entries(GRUPOS).map(([grupo,info])=>(
        <div key={grupo} style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:info.cor, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:info.cor }} />
            {info.label}
            {!info.impactaDRE && <span style={{ fontSize:9, background:"rgba(249,115,22,0.15)", color:"#f97316", padding:"1px 6px", borderRadius:3 }}>fora da DRE</span>}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {(porGrupo[grupo]||[]).map(cat=>{
              const subs = subcats.filter(s=>s.categoria_id===cat.id);
              const aberto = expandido[cat.id];
              return (
                <div key={cat.id}>
                  <div style={{ background:"#1a1a2e", borderLeft:`3px solid ${cat.cor||info.cor}`, border:"1px solid rgba(255,255,255,0.07)", borderRadius:aberto&&subs.length>0?"8px 8px 0 0":"0 8px 8px 0", padding:"8px 12px", display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:12, color:"rgba(255,255,255,0.75)", flex:1 }}>{cat.nome}</span>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>{subs.length} sub</span>
                    {podeCriar && <button onClick={()=>setModalSub(cat)} style={{ background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:5, padding:"2px 7px", color:"#818cf8", fontSize:10, cursor:"pointer" }}>+ Sub</button>}
                    {subs.length>0 && <button onClick={()=>setExpandido(p=>({...p,[cat.id]:!p[cat.id]}))} style={{ background:"rgba(255,255,255,0.04)", border:"none", borderRadius:5, padding:"2px 7px", color:"rgba(255,255,255,0.4)", fontSize:10, cursor:"pointer" }}>{aberto?"▲":"▼"}</button>}
                    {podeCriar && <button onClick={()=>excluir(cat.id)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.15)", cursor:"pointer", fontSize:13 }}>✕</button>}
                  </div>
                  {aberto && subs.map((sub,i)=>(
                    <div key={sub.id} style={{ background:"#13131f", borderLeft:`3px solid ${sub.cor||cat.cor||info.cor}`, border:"1px solid rgba(255,255,255,0.05)", borderTop:"none", borderRadius:i===subs.length-1?"0 0 8px 8px":"0", padding:"7px 12px 7px 22px", display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:5, height:5, borderRadius:"50%", background:sub.cor||"#6366f1" }} />
                      <span style={{ flex:1, fontSize:11, color:"rgba(255,255,255,0.6)" }}>{sub.nome}</span>
                      {podeCriar && <button onClick={()=>excluirSub(sub.id)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.15)", cursor:"pointer", fontSize:12 }}>✕</button>}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {modalSub && <Modal titulo={`Nova subcategoria em "${modalSub?.nome}"`} onClose={()=>setModalSub(null)}>
        <Campo label="Nome"><input style={inputStyle} value={formSub.nome} onChange={e=>setFormSub({...formSub,nome:e.target.value})} placeholder="Ex: Pró-labore" /></Campo>
        <Campo label="Cor"><div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>{["#6366f1","#f97316","#8b5cf6","#eab308","#06b6d4","#10b981","#ec4899","#ef4444","#a78bfa","#f59e0b"].map(cor=><div key={cor} onClick={()=>setFormSub({...formSub,cor})} style={{ width:28, height:28, borderRadius:"50%", background:cor, cursor:"pointer", border:formSub.cor===cor?"3px solid #fff":"2px solid transparent" }} />)}</div></Campo>
        <BtnRow onCancel={()=>setModalSub(null)} onSave={salvarSub} loading={false} />
      </Modal>}
      {modal && <Modal titulo="Nova categoria" onClose={()=>setModal(false)}>
        <Campo label="Nome"><input style={inputStyle} value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} placeholder="Ex: Fee de Agência" /></Campo>
        <Campo label="Grupo financeiro">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {Object.entries(GRUPOS).map(([k,g])=>(
              <button key={k} onClick={()=>setForm({...form,grupo:k})} style={{ padding:"8px", borderRadius:8, border:`1px solid ${form.grupo===k?g.cor:"rgba(255,255,255,0.08)"}`, background:form.grupo===k?g.cor+"22":"transparent", color:form.grupo===k?g.cor:"rgba(255,255,255,0.4)", fontSize:11, cursor:"pointer", textAlign:"left" }}>
                {g.label}
                {!g.impactaDRE && <span style={{ display:"block", fontSize:9, opacity:0.7 }}>fora da DRE</span>}
              </button>
            ))}
          </div>
        </Campo>
        <Campo label="Cor"><div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {["#6366f1","#f97316","#8b5cf6","#eab308","#06b6d4","#10b981","#ec4899","#ef4444","#a78bfa","#f59e0b"].map(cor=>(
            <div key={cor} onClick={()=>setForm({...form,cor})} style={{ width:28, height:28, borderRadius:"50%", background:cor, cursor:"pointer", border:form.cor===cor?"3px solid #fff":"2px solid transparent" }} />
          ))}
        </div></Campo>
        <BtnRow onCancel={()=>setModal(false)} onSave={salvar} loading={loading} />
      </Modal>}
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
  const [dados, setDados] = useState({ lancamentos:[], contas:[], categorias:[], subcategorias:[], clientes:[], fornecedores:[], projetos:[], contasPagar:[], contasReceber:[] });
  const [carregando, setCarregando] = useState(false);
  const [verificando, setVerificando] = useState(true);

  // Detecta token expirado e limpa sessão automaticamente
  useEffect(()=>{
    const handleError = (e) => {
      if(e?.reason?.message?.includes("JWT") || e?.reason?.status === 401 || e?.reason?.message?.includes("token")) {
        localStorage.removeItem("sb_user");
        window.location.reload();
      }
    };
    window.addEventListener("unhandledrejection", handleError);
    return () => window.removeEventListener("unhandledrejection", handleError);
  },[]);

  // Valida token ao voltar para a aba (visibilidade)
  useEffect(()=>{
    const handleVisibility = async () => {
      if(document.visibilityState === "visible" && user) {
        try {
          const teste = await sb(`membros?user_id=eq.${user.id}&limit=1`);
          if(!teste || (Array.isArray(teste) && teste[0]?.code === "PGRST301")) {
            localStorage.removeItem("sb_user");
            window.location.reload();
          }
        } catch(e) {
          // Se falhar com 401/JWT, limpa e recarrega
          if(e?.message?.includes("401") || e?.message?.includes("JWT")) {
            localStorage.removeItem("sb_user");
            window.location.reload();
          }
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  },[user]);

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
      } catch(e) {
        console.error(e);
        // Token expirado ou inválido — limpa sessão e recarrega
        if(e?.message?.includes("JWT") || e?.message?.includes("401") || e?.message?.includes("token")) {
          localStorage.removeItem("sb_user");
          window.location.reload();
          return;
        }
      }
      setVerificando(false);
    };
    verificar();
  }, [user]);

  const carregar = useCallback(async () => {
    if (!empresa) return;
    setCarregando(true);
    try {
      const eid = empresa.id;
      const [lancamentos, contas, categorias, subcategorias, clientes, fornecedores, projetos, contasPagar, contasReceber] = await Promise.all([
        sb(`lancamentos?empresa_id=eq.${eid}&order=data_competencia.desc`),
        sb(`contas?empresa_id=eq.${eid}&order=nome.asc`),
        sb(`categorias?empresa_id=eq.${eid}&order=ordem.asc,nome.asc`),
        sb(`contas_receber?empresa_id=eq.${eid}&order=vencimento.asc`),
        sb(`subcategorias?empresa_id=eq.${eid}&order=nome.asc`),
        sb(`clientes?empresa_id=eq.${eid}&order=nome.asc`),
        sb(`fornecedores?empresa_id=eq.${eid}&order=nome.asc`),
        sb(`projetos?empresa_id=eq.${eid}&order=created_at.desc`),
        sb(`contas_pagar?empresa_id=eq.${eid}&order=vencimento.asc`),
      ]);
      setDados({ lancamentos, contas, categorias, subcategorias, clientes, fornecedores, projetos, contasPagar, contasReceber });
    } catch(e) { console.error(e); }
    setCarregando(false);
  }, [empresa]);

  useEffect(()=>{ carregar(); },[carregar]);

  const logout = () => {
    // Limpa todos os dados de autenticação
    localStorage.removeItem("sb_token");
    localStorage.removeItem("sb_user");
    localStorage.removeItem("sb_empresa");
    setUser(null);
    setEmpresa(null);
    setMembro(null);
    setDados({ lancamentos:[], contas:[], categorias:[], subcategorias:[], clientes:[], fornecedores:[], projetos:[], contasPagar:[], contasReceber:[] });
  };

  if (!user) return <LoginScreen onLogin={u=>{ setVerificando(true); setUser(u); }} />;
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
              {tela==="dashboard"    && <Dashboard {...props} subcategorias={dados.subcategorias} setTela={setTela} />}
              {tela==="lancamentos"  && <Lancamentos {...props} />}
              {tela==="contas_pagar"   && <ContasPagar {...props} />}
              {tela==="contas_receber" && <ContasReceber categorias={dados.categorias} clientes={dados.clientes} projetos={dados.projetos} contas={dados.contas} empresaId={empresa.id} userId={user.id} onRefresh={carregar} membro={membro} />}
              {tela==="dre"          && <DRE lancamentos={dados.lancamentos} categorias={dados.categorias} />}
              {tela==="fluxo_caixa"  && <FluxoCaixa lancamentos={dados.lancamentos} categorias={dados.categorias} contas={dados.contas} />}
              {tela==="por_cliente"  && <PorCliente lancamentos={dados.lancamentos} clientes={dados.clientes} projetos={dados.projetos} />}
              {tela==="por_projeto"  && <PorProjeto lancamentos={dados.lancamentos} projetos={dados.projetos} clientes={dados.clientes} />}
              {tela==="clientes"     && <Clientes clientes={dados.clientes} empresaId={empresa.id} onRefresh={carregar} membro={membro} />}
              {tela==="fornecedores" && <Fornecedores fornecedores={dados.fornecedores} empresaId={empresa.id} onRefresh={carregar} membro={membro} />}
              {tela==="projetos"     && <Projetos projetos={dados.projetos} clientes={dados.clientes} empresaId={empresa.id} onRefresh={carregar} membro={membro} />}
              {tela==="contas"       && <Contas contas={dados.contas} empresaId={empresa.id} onRefresh={carregar} membro={membro} lancamentos={dados.lancamentos} categorias={dados.categorias} clientes={dados.clientes} fornecedores={dados.fornecedores} projetos={dados.projetos} userId={user.id} />}
              
              
              {tela==="relatorios"    && <Relatorios {...props} />}
              {tela==="categorias"   && <Categorias categorias={dados.categorias} subcategorias={dados.subcategorias} empresaId={empresa.id} onRefresh={carregar} membro={membro} />}
              {tela==="usuarios"      && <Usuarios empresa={empresa} userId={user.id} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
