import { useState, useEffect, useMemo, useCallback } from "react";

// ── Supabase config ────────────────────────────────────────────────────────────
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

// ── Login ──────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [modo, setModo] = useState("login");
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
    } catch { setErro("Erro de conexão. Tente novamente."); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <div style={{ width: 400, background: "#13131a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "48px 40px" }}>
        <img src="/logo.png" alt="PRT" style={{ height: 52, marginBottom: 20, display: "block" }} />
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 32 }}>{modo === "login" ? "Entre na sua conta" : "Crie sua conta gratuita"}</div>
        {erro && <div style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f87171", marginBottom: 16 }}>{erro}</div>}
        {[["E-mail", "email"], ["Senha", "password"]].map(([label, type], i) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</label>
            <input type={type} value={i === 0 ? email : senha} onChange={(e) => (i === 0 ? setEmail : setSenha)(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handle()}
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
        <button onClick={handle} disabled={loading} style={{ width: "100%", background: loading ? "rgba(99,102,241,0.5)" : "#6366f1", border: "none", borderRadius: 10, padding: "13px", color: "#fff", fontSize: 15, fontWeight: 500, cursor: "pointer", marginTop: 8 }}>
          {loading ? "Aguarde..." : modo === "login" ? "Entrar →" : "Criar conta →"}
        </button>
        <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
          {modo === "login" ? "Não tem conta? " : "Já tem conta? "}
          <span onClick={() => { setModo(modo === "login" ? "cadastro" : "login"); setErro(""); }} style={{ color: "#818cf8", cursor: "pointer" }}>
            {modo === "login" ? "Cadastre-se" : "Entrar"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Componentes reutilizáveis ──────────────────────────────────────────────────
function Modal({ titulo, onClose, children }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#13131a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, padding: 32, width: 500, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 22 }}>{titulo}</div>
        {children}
      </div>
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</label>
      {children}
    </div>
  );
}

function BtnRow({ onCancel, onSave, loading }) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
      <button onClick={onCancel} style={{ flex: 1, padding: "11px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 13 }}>Cancelar</button>
      <button onClick={onSave} disabled={loading} style={{ flex: 1, padding: "11px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>{loading ? "Salvando..." : "Salvar"}</button>
    </div>
  );
}

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "🏠" },
  { id: "lancamentos", label: "Lançamentos", icon: "📋" },
  { id: "contas", label: "Contas", icon: "💳" },
  { id: "investimentos", label: "Investimentos", icon: "📈" },
  { id: "orcamento", label: "Orçamento", icon: "🎯" },
  { id: "relatorios", label: "Relatórios / DRE", icon: "📊" },
  { id: "categorias", label: "Categorias", icon: "🏷️" },
];

function Sidebar({ tela, setTela, user, onLogout }) {
  return (
    <div style={{ width: 220, background: "#13131a", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
      <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <img src="/logo.png" alt="PRT" style={{ height: 44, display: "block", marginBottom: 8 }} />
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", wordBreak: "break-all" }}>{user?.email}</div>
      </div>
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        {NAV.map((n) => (
          <button key={n.id} onClick={() => setTela(n.id)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: 8, border: "none", background: tela === n.id ? "rgba(99,102,241,0.18)" : "transparent", color: tela === n.id ? "#818cf8" : "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: tela === n.id ? 500 : 400, cursor: "pointer", marginBottom: 2, textAlign: "left" }}>
            <span style={{ fontSize: 15 }}>{n.icon}</span>{n.label}
          </button>
        ))}
      </nav>
      <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: 8, border: "none", background: "transparent", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer" }}>🚪 Sair</button>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ lancamentos, contas, investimentos, categorias }) {
  const rec = lancamentos.filter((l) => l.tipo === "receita").reduce((s, l) => s + Number(l.valor), 0);
  const desp = lancamentos.filter((l) => l.tipo === "despesa").reduce((s, l) => s + Number(l.valor), 0);
  const saldo = contas.reduce((s, c) => s + Number(c.saldo), 0);
  const invest = investimentos.reduce((s, i) => s + Number(i.valor_atual), 0);

  const porCat = categorias.filter((c) => c.tipo === "despesa").map((cat) => ({
    ...cat,
    total: lancamentos.filter((l) => l.categoria_id === cat.id && l.tipo === "despesa").reduce((s, l) => s + Number(l.valor), 0),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total).slice(0, 6);

  const ultimos = [...lancamentos].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 7);

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 600, color: "#fff", marginBottom: 4 }}>Dashboard</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 22 }}>Visão geral</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[["Saldo em contas", saldo, "#fff"], ["Receitas", rec, "#34d399"], ["Despesas", desp, "#f87171"], ["Investimentos", invest, "#a78bfa"]].map(([label, value, cor]) => (
          <div key={label} style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: cor }}>{fmt(value)}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.6)", marginBottom: 14 }}>Despesas por categoria</div>
          {porCat.length === 0 && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>Nenhum lançamento ainda.</div>}
          {porCat.map((cat) => (
            <div key={cat.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{cat.nome}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{fmt(cat.total)}</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 999 }}>
                <div style={{ width: `${desp ? Math.min((cat.total / desp) * 100, 100) : 0}%`, height: "100%", borderRadius: 999, background: cat.cor || "#6366f1" }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.6)", marginBottom: 14 }}>Últimos lançamentos</div>
          {ultimos.length === 0 && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>Nenhum lançamento ainda.</div>}
          {ultimos.map((l) => {
            const cat = categorias.find((c) => c.id === l.categoria_id);
            return (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: cat?.cor || "#6366f1", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.descricao}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{cat?.nome || "—"} · {l.data}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: l.tipo === "receita" ? "#34d399" : "#f87171", flexShrink: 0 }}>
                  {l.tipo === "receita" ? "+" : ""}{fmt(l.valor)}
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
function Lancamentos({ lancamentos, contas, categorias, userId, onRefresh }) {
  const [filtro, setFiltro] = useState("todos");
  const [modal, setModal] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nf, setNf] = useState(null);
  const [comp, setComp] = useState(null);
  const [diasAbertos, setDiasAbertos] = useState({});
  const hoje = new Date().toISOString().split("T")[0];
  const primeiroDiaMes = new Date().toISOString().slice(0,7) + "-01";
  const [dataInicio, setDataInicio] = useState(primeiroDiaMes);
  const [dataFim, setDataFim] = useState(hoje);
  const [form, setForm] = useState({ descricao: "", valor: "", tipo: "despesa", data: new Date().toISOString().split("T")[0], categoria_id: "", conta_id: "", observacao: "" });

  const lista = useMemo(() => lancamentos.filter((l) => (filtro === "todos" || l.tipo === filtro) && (!dataInicio || l.data >= dataInicio) && (!dataFim || l.data <= dataFim)).sort((a, b) => new Date(b.data) - new Date(a.data)), [lancamentos, filtro, dataInicio, dataFim]);

  // Agrupa por data
  const porDia = useMemo(() => {
    const dias = {};
    lista.forEach((l) => {
      if (!dias[l.data]) dias[l.data] = [];
      dias[l.data].push(l);
    });
    return Object.entries(dias).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [lista]);

  const totalGeral = useMemo(() => ({
    receita: lista.filter(l => l.tipo === "receita").reduce((s, l) => s + Number(l.valor), 0),
    despesa: lista.filter(l => l.tipo === "despesa").reduce((s, l) => s + Number(l.valor), 0),
  }), [lista]);

  const toggleDia = (data) => setDiasAbertos(prev => ({ ...prev, [data]: !prev[data] }));

  const uploadArquivo = async (arquivo) => {
    const nomeSeguro = arquivo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${Date.now()}_${nomeSeguro}`;
    const token = localStorage.getItem("sb_token");
    const up = await fetch(`${SUPABASE_URL}/storage/v1/object/anexos/${path}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, "Content-Type": arquivo.type, "x-upsert": "true" },
      body: arquivo,
    });
    if (up.ok) return { url: path, nome: arquivo.name };
    return { url: null, nome: null };
  };

  const verAnexo = async (url, nome) => {
    const token = localStorage.getItem("sb_token");
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/authenticated/anexos/${url}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` }
    });
    const blob = await res.blob();
    setPreview({ url: URL.createObjectURL(blob), nome, tipo: blob.type });
  };

  const salvar = async () => {
    if (!form.descricao || !form.valor || !form.data) return alert("Preencha descrição, valor e data.");
    setLoading(true);
    try {
      let nf_url = null, nf_nome = null, comprovante_url = null, comprovante_nome = null;
      if (nf) { const r = await uploadArquivo(nf); nf_url = r.url; nf_nome = r.nome; }
      if (comp) { const r = await uploadArquivo(comp); comprovante_url = r.url; comprovante_nome = r.nome; }
      await sb("lancamentos", { method: "POST", body: JSON.stringify({ ...form, valor: Number(form.valor), user_id: userId, categoria_id: form.categoria_id || null, conta_id: form.conta_id || null, nf_url, nf_nome, comprovante_url, comprovante_nome }) });
      setModal(false); setNf(null); setComp(null);
      setForm({ descricao: "", valor: "", tipo: "despesa", data: new Date().toISOString().split("T")[0], categoria_id: "", conta_id: "", observacao: "" });
      onRefresh();
    } catch (e) { alert("Erro ao salvar: " + e.message); }
    setLoading(false);
  };

  const excluir = async (id) => {
    if (!confirm("Excluir este lançamento?")) return;
    await sb(`lancamentos?id=eq.${id}`, { method: "DELETE", prefer: "" });
    onRefresh();
  };

  const BtnAnexo = ({ url, nome, label }) => url ? (
    <button onClick={() => verAnexo(url, nome)}
      style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", cursor: "pointer", fontSize: 10, padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap" }}>
      {label}
    </button>
  ) : null;

  const fmtData = (data) => {
    const [y, m, d] = data.split("-");
    const dias = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
    const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    const dt = new Date(Number(y), Number(m)-1, Number(d));
    return { dia: d, mes: meses[Number(m)-1], semana: dias[dt.getDay()] };
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#fff", marginBottom: 4 }}>Lançamentos</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{lista.length} registros</div>
        </div>
        <button onClick={() => setModal(true)} style={{ background: "#6366f1", border: "none", borderRadius: 8, padding: "9px 16px", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>+ Novo lançamento</button>
      </div>

      {/* Filtro de datas */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14, background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>De</span>
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 10px", color: "#fff", fontSize: 12, outline: "none" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Até</span>
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 10px", color: "#fff", fontSize: 12, outline: "none" }} />
        </div>
        <button onClick={() => { setDataInicio(primeiroDiaMes); setDataFim(hoje); }}
          style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 6, padding: "6px 12px", color: "#818cf8", fontSize: 12, cursor: "pointer" }}>
          Mês atual
        </button>
        <button onClick={() => { setDataInicio(""); setDataFim(""); }}
          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 12px", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer" }}>
          Tudo
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 7, marginBottom: 16 }}>
        {["todos", "receita", "despesa"].map((f) => (
          <button key={f} onClick={() => setFiltro(f)} style={{ padding: "5px 13px", borderRadius: 6, border: `1px solid ${filtro === f ? "#6366f1" : "rgba(255,255,255,0.1)"}`, background: filtro === f ? "rgba(99,102,241,0.15)" : "transparent", color: filtro === f ? "#818cf8" : "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", textTransform: "capitalize" }}>{f}</button>
        ))}
      </div>

      {/* Totais gerais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
        {[["Total de receitas", totalGeral.receita, "#34d399"], ["Total de despesas", totalGeral.despesa, "#f87171"], ["Resultado", totalGeral.receita - totalGeral.despesa, totalGeral.receita - totalGeral.despesa >= 0 ? "#34d399" : "#f87171"]].map(([l,v,c]) => (
          <div key={l} style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{l}</div>
            <div style={{ fontSize: 17, fontWeight: 600, color: c }}>{fmt(v)}</div>
          </div>
        ))}
      </div>

      {/* Extrato por dia */}
      {porDia.length === 0 && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", padding: 20 }}>Nenhum lançamento encontrado.</div>}
      {porDia.map(([data, itens]) => {
        const rec = itens.filter(l => l.tipo === "receita").reduce((s,l) => s + Number(l.valor), 0);
        const desp = itens.filter(l => l.tipo === "despesa").reduce((s,l) => s + Number(l.valor), 0);
        const aberto = diasAbertos[data];
        const { dia, mes, semana } = fmtData(data);
        return (
          <div key={data} style={{ marginBottom: 8 }}>
            {/* Cabeçalho do dia — clicável */}
            <div onClick={() => toggleDia(data)} style={{ display: "flex", alignItems: "center", gap: 14, background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: aberto ? "10px 10px 0 0" : 10, padding: "12px 16px", cursor: "pointer", userSelect: "none" }}>
              {/* Data */}
              <div style={{ textAlign: "center", minWidth: 44, background: "rgba(99,102,241,0.15)", borderRadius: 8, padding: "6px 8px" }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#818cf8", lineHeight: 1 }}>{dia}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{mes}</div>
              </div>
              {/* Dia da semana */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{semana}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{itens.length} lançamento{itens.length !== 1 ? "s" : ""}</div>
              </div>
              {/* Totais do dia */}
              <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                {rec > 0 && <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>Entrada</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#34d399" }}>{fmt(rec)}</div>
                </div>}
                {desp > 0 && <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>Saída</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#f87171" }}>{fmt(desp)}</div>
                </div>}
                <div style={{ fontSize: 16, color: "rgba(255,255,255,0.3)", marginLeft: 4 }}>{aberto ? "▲" : "▼"}</div>
              </div>
            </div>

            {/* Detalhes do dia — expande */}
            {aberto && (
              <div style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.07)", borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                {itens.map((l, i) => {
                  const cat = categorias.find((c) => c.id === l.categoria_id);
                  const conta = contas.find((c) => c.id === l.conta_id);
                  return (
                    <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: i < itens.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: cat?.cor || "#6366f1", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.descricao}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "flex", gap: 8, marginTop: 2 }}>
                          {cat && <span>{cat.nome}</span>}
                          {conta && <span>· {conta.nome}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          {l.nf_url && <BtnAnexo url={l.nf_url} nome={l.nf_nome || "NF"} label="📄 NF" />}
                          {l.comprovante_url && <BtnAnexo url={l.comprovante_url} nome={l.comprovante_nome || "Comprovante"} label="🧾 Comprovante" />}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: l.tipo === "receita" ? "#34d399" : "#f87171", minWidth: 90, textAlign: "right" }}>
                          {l.tipo === "receita" ? "+" : "-"}{fmt(Math.abs(Number(l.valor)))}
                        </div>
                        <button onClick={() => excluir(l.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 14 }}>🗑</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Modal preview de arquivo */}
      {preview && (
        <div onClick={() => setPreview(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#13131a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, width: "80vw", maxWidth: 800, maxHeight: "90vh", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, color: "#fff", fontWeight: 500 }}>{preview.nome}</span>
              <div style={{ display: "flex", gap: 10 }}>
                <a href={preview.url} download={preview.nome} style={{ background: "#6366f1", borderRadius: 7, padding: "7px 14px", color: "#fff", fontSize: 12, fontWeight: 500, textDecoration: "none" }}>⬇ Baixar</a>
                <button onClick={() => setPreview(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 7, padding: "7px 12px", color: "#fff", fontSize: 12, cursor: "pointer" }}>✕ Fechar</button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: "auto", borderRadius: 8 }}>
              {preview.tipo === "application/pdf"
                ? <iframe src={preview.url} style={{ width: "100%", height: "65vh", border: "none", borderRadius: 8 }} />
                : <img src={preview.url} alt={preview.nome} style={{ maxWidth: "100%", maxHeight: "65vh", display: "block", margin: "0 auto", borderRadius: 8 }} />
              }
            </div>
          </div>
        </div>
      )}

      {modal && (
        <Modal titulo="Novo lançamento" onClose={() => setModal(false)}>
          <Campo label="Descrição"><input style={inputStyle} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Supermercado" /></Campo>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Campo label="Valor (R$)"><input style={inputStyle} type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" /></Campo>
            <Campo label="Data"><input style={inputStyle} type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></Campo>
          </div>
          <Campo label="Tipo">
            <div style={{ display: "flex", gap: 8 }}>
              {["despesa", "receita"].map((t) => (
                <button key={t} onClick={() => setForm({ ...form, tipo: t })} style={{ flex: 1, padding: "9px", borderRadius: 7, border: `1px solid ${form.tipo === t ? "#6366f1" : "rgba(255,255,255,0.1)"}`, background: form.tipo === t ? "rgba(99,102,241,0.15)" : "transparent", color: form.tipo === t ? "#818cf8" : "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer", textTransform: "capitalize" }}>{t}</button>
              ))}
            </div>
          </Campo>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Campo label="Categoria">
              <select style={selectStyle} value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}>
                <option value="">Sem categoria</option>
                {categorias.filter((c) => c.tipo === form.tipo).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Campo>
            <Campo label="Conta">
              <select style={selectStyle} value={form.conta_id} onChange={(e) => setForm({ ...form, conta_id: e.target.value })}>
                <option value="">Sem conta</option>
                {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Campo>
          </div>
          <Campo label="Observação"><textarea style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} placeholder="Opcional" /></Campo>
          <Campo label="📄 Nota Fiscal (imagem ou PDF)">
            <input type="file" accept="image/*,.pdf" onChange={(e) => setNf(e.target.files[0])} style={{ ...inputStyle, padding: "8px 12px" }} />
            {nf && <div style={{ fontSize: 11, color: "#34d399", marginTop: 4 }}>✓ {nf.name}</div>}
          </Campo>
          <Campo label="🧾 Comprovante de Pagamento (imagem ou PDF)">
            <input type="file" accept="image/*,.pdf" onChange={(e) => setComp(e.target.files[0])} style={{ ...inputStyle, padding: "8px 12px" }} />
            {comp && <div style={{ fontSize: 11, color: "#34d399", marginTop: 4 }}>✓ {comp.name}</div>}
          </Campo>
          <BtnRow onCancel={() => setModal(false)} onSave={salvar} loading={loading} />
        </Modal>
      )}
    </div>
  );
}

// ── Contas ─────────────────────────────────────────────────────────────────────
function Contas({ contas, userId, onRefresh }) {
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome: "", banco: "", saldo: "", cor: "#6366f1" });
  const total = contas.reduce((s, c) => s + Number(c.saldo), 0);

  const salvar = async () => {
    if (!form.nome || !form.banco) return alert("Preencha nome e banco.");
    setLoading(true);
    try {
      await sb("contas", { method: "POST", body: JSON.stringify({ ...form, saldo: Number(form.saldo) || 0, user_id: userId }) });
      setModal(false); setForm({ nome: "", banco: "", saldo: "", cor: "#6366f1" }); onRefresh();
    } catch (e) { alert("Erro: " + e.message); }
    setLoading(false);
  };

  const excluir = async (id) => {
    if (!confirm("Excluir esta conta?")) return;
    await sb(`contas?id=eq.${id}`, { method: "DELETE", prefer: "" }); onRefresh();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#fff", marginBottom: 4 }}>Contas bancárias</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Saldo consolidado: {fmt(total)}</div>
        </div>
        <button onClick={() => setModal(true)} style={{ background: "#6366f1", border: "none", borderRadius: 8, padding: "9px 16px", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>+ Nova conta</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {contas.length === 0 && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Nenhuma conta cadastrada.</div>}
        {contas.map((c) => (
          <div key={c.id} style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 18, position: "relative" }}>
            <button onClick={() => excluir(c.id)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 14 }}>🗑</button>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: (c.cor || "#6366f1") + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 12 }}>💳</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{c.banco}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: 10 }}>{fmt(c.saldo)}</div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 999 }}>
              <div style={{ width: `${total ? Math.min((Number(c.saldo) / total) * 100, 100) : 0}%`, height: "100%", background: c.cor || "#6366f1", borderRadius: 999 }} />
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>{total ? ((Number(c.saldo) / total) * 100).toFixed(1) : 0}% do total</div>
          </div>
        ))}
      </div>
      {modal && (
        <Modal titulo="Nova conta" onClose={() => setModal(false)}>
          <Campo label="Nome da conta"><input style={inputStyle} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Nubank" /></Campo>
          <Campo label="Banco"><input style={inputStyle} value={form.banco} onChange={(e) => setForm({ ...form, banco: e.target.value })} placeholder="Ex: Nubank" /></Campo>
          <Campo label="Saldo inicial (R$)"><input style={inputStyle} type="number" step="0.01" value={form.saldo} onChange={(e) => setForm({ ...form, saldo: e.target.value })} placeholder="0,00" /></Campo>
          <Campo label="Cor">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CORES.map((cor) => <div key={cor} onClick={() => setForm({ ...form, cor })} style={{ width: 28, height: 28, borderRadius: "50%", background: cor, cursor: "pointer", border: form.cor === cor ? "3px solid #fff" : "2px solid transparent" }} />)}
            </div>
          </Campo>
          <BtnRow onCancel={() => setModal(false)} onSave={salvar} loading={loading} />
        </Modal>
      )}
    </div>
  );
}

// ── Investimentos ──────────────────────────────────────────────────────────────
function Investimentos({ investimentos, userId, onRefresh }) {
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome: "", tipo: "", valor_inicial: "", valor_atual: "", vencimento: "" });

  const tAtual = investimentos.reduce((s, i) => s + Number(i.valor_atual), 0);
  const tInic = investimentos.reduce((s, i) => s + Number(i.valor_inicial), 0);
  const rend = tAtual - tInic;
  const pct = tInic ? ((rend / tInic) * 100).toFixed(2) : "0.00";

  const salvar = async () => {
    if (!form.nome || !form.valor_inicial || !form.valor_atual) return alert("Preencha os campos obrigatórios.");
    setLoading(true);
    try {
      await sb("investimentos", { method: "POST", body: JSON.stringify({ ...form, valor_inicial: Number(form.valor_inicial), valor_atual: Number(form.valor_atual), vencimento: form.vencimento || null, user_id: userId }) });
      setModal(false); setForm({ nome: "", tipo: "", valor_inicial: "", valor_atual: "", vencimento: "" }); onRefresh();
    } catch (e) { alert("Erro: " + e.message); }
    setLoading(false);
  };

  const excluir = async (id) => {
    if (!confirm("Excluir?")) return;
    await sb(`investimentos?id=eq.${id}`, { method: "DELETE", prefer: "" }); onRefresh();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#fff", marginBottom: 4 }}>Investimentos</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Carteira consolidada</div>
        </div>
        <button onClick={() => setModal(true)} style={{ background: "#6366f1", border: "none", borderRadius: 8, padding: "9px 16px", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>+ Novo investimento</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
        {[["Valor atual", fmt(tAtual), "#fff"], ["Rendimento total", fmt(rend), "#34d399"], ["Rentabilidade", `+${pct}%`, "#a78bfa"]].map(([l, v, c]) => (
          <div key={l} style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{l}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: c }}>{v}</div>
          </div>
        ))}
      </div>
      {investimentos.length === 0 && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Nenhum investimento cadastrado.</div>}
      {investimentos.map((inv) => {
        const r = Number(inv.valor_atual) - Number(inv.valor_inicial);
        const p = Number(inv.valor_inicial) ? ((r / Number(inv.valor_inicial)) * 100).toFixed(2) : "0.00";
        return (
          <div key={inv.id} style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: "#fff", marginBottom: 4 }}>{inv.nome}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", padding: "2px 8px", borderRadius: 5, fontSize: 11 }}>{inv.tipo}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{inv.vencimento ? "Venc: " + inv.vencimento : "Sem vencimento"}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{fmt(inv.valor_atual)}</div>
                <div style={{ fontSize: 11, color: "#34d399" }}>+{fmt(r)} ({p}%)</div>
              </div>
              <button onClick={() => excluir(inv.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 14 }}>🗑</button>
            </div>
          </div>
        );
      })}
      {modal && (
        <Modal titulo="Novo investimento" onClose={() => setModal(false)}>
          <Campo label="Nome"><input style={inputStyle} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: CDB Bradesco 120% CDI" /></Campo>
          <Campo label="Tipo"><input style={inputStyle} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} placeholder="Ex: Renda Fixa, Ações, FII..." /></Campo>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Campo label="Valor inicial (R$)"><input style={inputStyle} type="number" step="0.01" value={form.valor_inicial} onChange={(e) => setForm({ ...form, valor_inicial: e.target.value })} /></Campo>
            <Campo label="Valor atual (R$)"><input style={inputStyle} type="number" step="0.01" value={form.valor_atual} onChange={(e) => setForm({ ...form, valor_atual: e.target.value })} /></Campo>
          </div>
          <Campo label="Vencimento (opcional)"><input style={inputStyle} type="date" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} /></Campo>
          <BtnRow onCancel={() => setModal(false)} onSave={salvar} loading={loading} />
        </Modal>
      )}
    </div>
  );
}

// ── Orçamento ──────────────────────────────────────────────────────────────────
function Orcamento({ orcamento, lancamentos, categorias, userId, onRefresh }) {
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const [form, setForm] = useState({ categoria_id: "", limite: "", mes: now.getMonth() + 1, ano: now.getFullYear() });

  const salvar = async () => {
    if (!form.categoria_id || !form.limite) return alert("Preencha categoria e limite.");
    setLoading(true);
    try {
      await sb("orcamento", { method: "POST", body: JSON.stringify({ ...form, limite: Number(form.limite), user_id: userId }), prefer: "resolution=merge-duplicates,return=representation" });
      setModal(false); setForm({ categoria_id: "", limite: "", mes: now.getMonth() + 1, ano: now.getFullYear() }); onRefresh();
    } catch (e) { alert("Erro: " + e.message); }
    setLoading(false);
  };

  const excluir = async (id) => {
    if (!confirm("Excluir?")) return;
    await sb(`orcamento?id=eq.${id}`, { method: "DELETE", prefer: "" }); onRefresh();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#fff", marginBottom: 4 }}>Orçamento mensal</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Limites por categoria</div>
        </div>
        <button onClick={() => setModal(true)} style={{ background: "#6366f1", border: "none", borderRadius: 8, padding: "9px 16px", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>+ Definir limite</button>
      </div>
      {orcamento.length === 0 && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Nenhum orçamento definido ainda.</div>}
      {orcamento.map((o) => {
        const cat = categorias.find((c) => c.id === o.categoria_id);
        const gasto = lancamentos.filter((l) => l.categoria_id === o.categoria_id && l.tipo === "despesa" && new Date(l.data).getMonth() + 1 === o.mes && new Date(l.data).getFullYear() === o.ano).reduce((s, l) => s + Number(l.valor), 0);
        const pct = Math.min((gasto / Number(o.limite)) * 100, 100);
        const cor = pct >= 90 ? "#f87171" : pct >= 70 ? "#fbbf24" : cat?.cor || "#6366f1";
        return (
          <div key={o.id} style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 18px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: cat?.cor || "#6366f1" }} />
                <span style={{ fontSize: 13, color: "#fff" }}>{cat?.nome || "—"}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{o.mes}/{o.ano}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{fmt(gasto)} de {fmt(o.limite)}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: cor }}>{pct.toFixed(0)}%</span>
                {pct >= 90 && <span>⚠️</span>}
                <button onClick={() => excluir(o.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 14 }}>🗑</button>
              </div>
            </div>
            <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 999 }}>
              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: cor }} />
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>Restam: {fmt(Number(o.limite) - gasto)}</div>
          </div>
        );
      })}
      {modal && (
        <Modal titulo="Definir limite de orçamento" onClose={() => setModal(false)}>
          <Campo label="Categoria">
            <select style={selectStyle} value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}>
              <option value="">Selecione...</option>
              {categorias.filter((c) => c.tipo === "despesa").map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </Campo>
          <Campo label="Limite (R$)"><input style={inputStyle} type="number" step="0.01" value={form.limite} onChange={(e) => setForm({ ...form, limite: e.target.value })} placeholder="0,00" /></Campo>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Campo label="Mês"><input style={inputStyle} type="number" min="1" max="12" value={form.mes} onChange={(e) => setForm({ ...form, mes: Number(e.target.value) })} /></Campo>
            <Campo label="Ano"><input style={inputStyle} type="number" value={form.ano} onChange={(e) => setForm({ ...form, ano: Number(e.target.value) })} /></Campo>
          </div>
          <BtnRow onCancel={() => setModal(false)} onSave={salvar} loading={loading} />
        </Modal>
      )}
    </div>
  );
}

// ── Categorias ─────────────────────────────────────────────────────────────────
function Categorias({ categorias, userId, onRefresh }) {
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome: "", tipo: "despesa", cor: "#6366f1" });

  const salvar = async () => {
    if (!form.nome) return alert("Preencha o nome.");
    setLoading(true);
    try {
      await sb("categorias", { method: "POST", body: JSON.stringify({ ...form, user_id: userId }) });
      setModal(false); setForm({ nome: "", tipo: "despesa", cor: "#6366f1" }); onRefresh();
    } catch (e) { alert("Erro: " + e.message); }
    setLoading(false);
  };

  const excluir = async (id) => {
    if (!confirm("Excluir esta categoria?")) return;
    await sb(`categorias?id=eq.${id}`, { method: "DELETE", prefer: "" }); onRefresh();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#fff", marginBottom: 4 }}>Categorias</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{categorias.length} categorias</div>
        </div>
        <button onClick={() => setModal(true)} style={{ background: "#6366f1", border: "none", borderRadius: 8, padding: "9px 16px", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>+ Nova categoria</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {categorias.length === 0 && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Nenhuma categoria. Crie a primeira!</div>}
        {categorias.map((cat) => (
          <div key={cat.id} style={{ background: "#1a1a2e", borderLeft: `3px solid ${cat.cor || "#6366f1"}`, borderTop: "1px solid rgba(255,255,255,0.07)", borderRight: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", borderRadius: "0 10px 10px 0", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: "#fff" }}>{cat.nome}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "capitalize" }}>{cat.tipo}</div>
            </div>
            <button onClick={() => excluir(cat.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 14 }}>🗑</button>
          </div>
        ))}
      </div>
      {modal && (
        <Modal titulo="Nova categoria" onClose={() => setModal(false)}>
          <Campo label="Nome"><input style={inputStyle} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Alimentação" /></Campo>
          <Campo label="Tipo">
            <div style={{ display: "flex", gap: 8 }}>
              {["despesa", "receita"].map((t) => (
                <button key={t} onClick={() => setForm({ ...form, tipo: t })} style={{ flex: 1, padding: "9px", borderRadius: 7, border: `1px solid ${form.tipo === t ? "#6366f1" : "rgba(255,255,255,0.1)"}`, background: form.tipo === t ? "rgba(99,102,241,0.15)" : "transparent", color: form.tipo === t ? "#818cf8" : "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer", textTransform: "capitalize" }}>{t}</button>
              ))}
            </div>
          </Campo>
          <Campo label="Cor">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CORES.map((cor) => <div key={cor} onClick={() => setForm({ ...form, cor })} style={{ width: 28, height: 28, borderRadius: "50%", background: cor, cursor: "pointer", border: form.cor === cor ? "3px solid #fff" : "2px solid transparent" }} />)}
            </div>
          </Campo>
          <BtnRow onCancel={() => setModal(false)} onSave={salvar} loading={loading} />
        </Modal>
      )}
    </div>
  );
}

// ── Relatórios ────────────────────────────────────────────────────────────────
function GraficoPizza({ dados, total }) {
  if (!dados.length) return null;
  let angulo = 0;
  const raio = 80, cx = 100, cy = 100;
  const fatias = dados.map((d) => {
    const pct = d.total / total;
    const rad = pct * 2 * Math.PI;
    const x1 = cx + raio * Math.sin(angulo);
    const y1 = cy - raio * Math.cos(angulo);
    angulo += rad;
    const x2 = cx + raio * Math.sin(angulo);
    const y2 = cy - raio * Math.cos(angulo);
    const large = rad > Math.PI ? 1 : 0;
    return { ...d, path: `M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${raio},${raio} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`, pct };
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <svg width={200} height={200} viewBox="0 0 200 200">
        {fatias.map((f, i) => <path key={i} d={f.path} fill={f.cor || "#6366f1"} stroke="#1a1a2e" strokeWidth={1.5} />)}
        <circle cx={cx} cy={cy} r={38} fill="#1a1a2e" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {fatias.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: f.cor || "#6366f1", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{f.nome}</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: "auto" }}>{(f.pct * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FiltrosPeriodo({ inicio, fim, setInicio, setFim }) {
  const hoje = new Date().toISOString().split("T")[0];
  const primeiroDia = new Date().toISOString().slice(0,7) + "-01";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>De</span>
        <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 10px", color: "#fff", fontSize: 12, outline: "none" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Até</span>
        <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 10px", color: "#fff", fontSize: 12, outline: "none" }} />
      </div>
      <button onClick={() => { setInicio(primeiroDia); setFim(hoje); }} style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 6, padding: "6px 12px", color: "#818cf8", fontSize: 12, cursor: "pointer" }}>Mês atual</button>
      <button onClick={() => { const a = new Date(); a.setDate(1); a.setMonth(a.getMonth()-1); const b = new Date(a.getFullYear(), a.getMonth()+1, 0); setInicio(a.toISOString().split("T")[0]); setFim(b.toISOString().split("T")[0]); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 12px", color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer" }}>Mês anterior</button>
      <button onClick={() => { const a = new Date(); setInicio(new Date(a.getFullYear(),0,1).toISOString().split("T")[0]); setFim(hoje); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 12px", color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer" }}>Ano atual</button>
    </div>
  );
}

function Relatorios({ lancamentos, categorias, contas }) {
  const hoje = new Date().toISOString().split("T")[0];
  const primeiroDia = new Date().toISOString().slice(0,7) + "-01";
  const [aba, setAba] = useState("balancete");
  const [inicio, setInicio] = useState(primeiroDia);
  const [fim, setFim] = useState(hoje);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroCat, setFiltroCat] = useState("");

  const filtrados = useMemo(() => lancamentos.filter((l) => {
    if (inicio && l.data < inicio) return false;
    if (fim && l.data > fim) return false;
    if (filtroTipo !== "todos" && l.tipo !== filtroTipo) return false;
    if (filtroCat && l.categoria_id !== filtroCat) return false;
    return true;
  }), [lancamentos, inicio, fim, filtroTipo, filtroCat]);

  const rec = filtrados.filter(l => l.tipo === "receita").reduce((s,l) => s + Number(l.valor), 0);
  const desp = filtrados.filter(l => l.tipo === "despesa").reduce((s,l) => s + Number(l.valor), 0);
  const res = rec - desp;

  const porCat = categorias.map((cat) => ({
    ...cat,
    total: filtrados.filter(l => l.categoria_id === cat.id && l.tipo === "despesa").reduce((s,l) => s + Number(l.valor), 0),
  })).filter(c => c.total > 0).sort((a,b) => b.total - a.total);

  const porCatRec = categorias.map((cat) => ({
    ...cat,
    total: filtrados.filter(l => l.categoria_id === cat.id && l.tipo === "receita").reduce((s,l) => s + Number(l.valor), 0),
  })).filter(c => c.total > 0).sort((a,b) => b.total - a.total);

  // Fluxo por dia
  const porDia = useMemo(() => {
    const dias = {};
    filtrados.forEach(l => {
      if (!dias[l.data]) dias[l.data] = { rec: 0, desp: 0 };
      if (l.tipo === "receita") dias[l.data].rec += Number(l.valor);
      else dias[l.data].desp += Number(l.valor);
    });
    return Object.entries(dias).sort((a,b) => a[0].localeCompare(b[0]));
  }, [filtrados]);

  const abas = [
    { id: "balancete", label: "Balancete" },
    { id: "caixa", label: "Caixa" },
    { id: "dre", label: "DRE" },
    { id: "categorias_rel", label: "Por Categoria" },
  ];

  const selectFiltro = { ...inputStyle, width: "auto", minWidth: 140 };

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 600, color: "#fff", marginBottom: 4 }}>Relatórios</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 18 }}>Análise financeira por período</div>

      {/* Abas de relatório */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 12 }}>
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "7px 16px", borderRadius: 7, border: `1px solid ${aba === a.id ? "#6366f1" : "rgba(255,255,255,0.1)"}`, background: aba === a.id ? "rgba(99,102,241,0.18)" : "transparent", color: aba === a.id ? "#818cf8" : "rgba(255,255,255,0.45)", fontSize: 13, cursor: "pointer", fontWeight: aba === a.id ? 500 : 400 }}>{a.label}</button>
        ))}
      </div>

      {/* Filtros globais */}
      <FiltrosPeriodo inicio={inicio} fim={fim} setInicio={setInicio} setFim={setFim} />
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <select style={selectFiltro} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="todos">Tipo: Todos</option>
          <option value="receita">Receitas</option>
          <option value="despesa">Despesas</option>
        </select>
        <select style={selectFiltro} value={filtroCat} onChange={e => setFiltroCat(e.target.value)}>
          <option value="">Categoria: Todas</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      {/* Cards de totais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[["Receitas", rec, "#34d399"], ["Despesas", desp, "#f87171"], ["Resultado", res, res >= 0 ? "#34d399" : "#f87171"]].map(([l,v,c]) => (
          <div key={l} style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{l}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: c }}>{fmt(v)}</div>
          </div>
        ))}
      </div>

      {/* ── BALANCETE ── */}
      {aba === "balancete" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Despesas por categoria</div>
            {porCat.length === 0 && <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>Sem dados no período.</div>}
            {porCat.map(cat => (
              <div key={cat.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: cat.cor || "#6366f1" }} />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{cat.nome}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#f87171" }}>{fmt(cat.total)}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{desp ? ((cat.total/desp)*100).toFixed(1) : 0}%</div>
                </div>
              </div>
            ))}
            {desp > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", marginTop: 4, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>Total</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#f87171" }}>{fmt(desp)}</span>
            </div>}
          </div>
          <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Gráfico de despesas</div>
            <GraficoPizza dados={porCat} total={desp} />
          </div>
        </div>
      )}

      {/* ── CAIXA ── */}
      {aba === "caixa" && (
        <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                {["Data", "Dia", "Entradas", "Saídas", "Saldo do dia", "Saldo acum."].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {porDia.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>Sem movimentações no período.</td></tr>}
              {(() => {
                let acum = 0;
                const dias = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
                return porDia.map(([data, v]) => {
                  const saldoDia = v.rec - v.desp;
                  acum += saldoDia;
                  const [y,m,d] = data.split("-");
                  const diaSem = dias[new Date(Number(y),Number(m)-1,Number(d)).getDay()];
                  return (
                    <tr key={data} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{d}/{m}/{y}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{diaSem}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#34d399", fontWeight: 500 }}>{v.rec > 0 ? fmt(v.rec) : "—"}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#f87171", fontWeight: 500 }}>{v.desp > 0 ? fmt(v.desp) : "—"}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 600, color: saldoDia >= 0 ? "#34d399" : "#f87171" }}>{fmt(saldoDia)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 600, color: acum >= 0 ? "#818cf8" : "#f87171" }}>{fmt(acum)}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      )}

      {/* ── DRE ── */}
      {aba === "dre" && (
        <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
            DRE — {inicio} a {fim}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>( + ) Receita bruta</span>
            <span style={{ fontSize: 13, color: "#34d399", fontWeight: 500 }}>{fmt(rec)}</span>
          </div>
          {porCat.map(cat => (
            <div key={cat.id} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0 9px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>( − ) {cat.nome}</span>
              <span style={{ fontSize: 12, color: "#f87171" }}>({fmt(cat.total)})</span>
            </div>
          ))}
          {porCat.length === 0 && <div style={{ padding: "9px 0 9px 14px", fontSize: 12, color: "rgba(255,255,255,0.25)" }}>Nenhuma despesa neste período.</div>}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 6 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>( = ) Despesas totais</span>
            <span style={{ fontSize: 13, color: "#f87171", fontWeight: 500 }}>({fmt(desp)})</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0 4px", borderTop: "2px solid rgba(255,255,255,0.15)", marginTop: 4 }}>
            <span style={{ fontSize: 15, color: "#fff", fontWeight: 500 }}>( = ) Resultado líquido</span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: res >= 0 ? "#34d399" : "#f87171" }}>{fmt(res)}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Margem: {rec ? ((res/rec)*100).toFixed(1) : "0.0"}%</div>
            </div>
          </div>
        </div>
      )}

      {/* ── POR CATEGORIA ── */}
      {aba === "categorias_rel" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Receitas por categoria</div>
            {porCatRec.length === 0 && <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>Sem dados.</div>}
            {porCatRec.map(cat => (
              <div key={cat.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{cat.nome}</span>
                  <span style={{ fontSize: 12, color: "#34d399" }}>{fmt(cat.total)}</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 999 }}>
                  <div style={{ width: `${rec ? (cat.total/rec*100) : 0}%`, height: "100%", background: cat.cor || "#34d399", borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Despesas por categoria</div>
            {porCat.length === 0 && <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>Sem dados.</div>}
            {porCat.map(cat => (
              <div key={cat.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{cat.nome}</span>
                  <span style={{ fontSize: 12, color: "#f87171" }}>{fmt(cat.total)}</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 999 }}>
                  <div style={{ width: `${desp ? (cat.total/desp*100) : 0}%`, height: "100%", background: cat.cor || "#f87171", borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



// ── App principal ──────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("sb_user")); } catch { return null; } });
  const [tela, setTela] = useState("dashboard");
  const [dados, setDados] = useState({ lancamentos: [], contas: [], investimentos: [], orcamento: [], categorias: [] });
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    if (!user) return;
    setCarregando(true);
    try {
      const uid = user.id;
      const [lancamentos, contas, investimentos, orcamento, categorias] = await Promise.all([
        sb(`lancamentos?user_id=eq.${uid}&order=data.desc`),
        sb(`contas?user_id=eq.${uid}&order=nome.asc`),
        sb(`investimentos?user_id=eq.${uid}&order=nome.asc`),
        sb(`orcamento?user_id=eq.${uid}&order=ano.desc,mes.desc`),
        sb(`categorias?user_id=eq.${uid}&order=nome.asc`),
      ]);
      setDados({ lancamentos, contas, investimentos, orcamento, categorias });
    } catch (e) { console.error("Erro ao carregar:", e); }
    setCarregando(false);
  }, [user]);

  useEffect(() => { carregar(); }, [carregar]);

  const logout = () => { localStorage.removeItem("sb_token"); localStorage.removeItem("sb_user"); setUser(null); };

  if (!user) return <LoginScreen onLogin={(u) => setUser(u)} />;

  const props = { ...dados, userId: user.id, onRefresh: carregar };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#0a0a0f", color: "#fff" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <Sidebar tela={tela} setTela={setTela} user={user} onLogout={logout} />
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "28px 32px", maxWidth: 1100 }}>
          {carregando ? (
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, paddingTop: 40 }}>Carregando seus dados...</div>
          ) : (
            <>
              {tela === "dashboard"     && <Dashboard {...props} />}
              {tela === "lancamentos"   && <Lancamentos {...props} />}
              {tela === "contas"        && <Contas {...props} />}
              {tela === "investimentos" && <Investimentos {...props} />}
              {tela === "orcamento"     && <Orcamento {...props} />}
              {tela === "relatorios"    && <Relatorios {...props} contas={dados.contas} />}
              {tela === "categorias"    && <Categorias {...props} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
