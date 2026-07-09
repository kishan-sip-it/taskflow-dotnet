import { useState, useEffect, useContext, useReducer, createContext, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ============================================================
// MOCK DATA
// ============================================================
const MOCK_USER = { id: 1, name: "Kishan Marwadi", email: "kishan.18mm19@gmail.com", role: "Full Stack Developer" };
const INITIAL_TASKS = [
  { id: 1, title: "Setup .NET Project", description: "Initialize ASP.NET Core WebAPI with EF Core", priority: "High", status: "Done", dueDate: "2025-07-01", assignee: "Kishan" },
  { id: 2, title: "Design Database Schema", description: "Create normalized tables for TaskFlow", priority: "High", status: "Done", dueDate: "2025-07-02", assignee: "Kishan" },
  { id: 3, title: "Build REST API", description: "CRUD endpoints for tasks with JWT auth", priority: "High", status: "In Progress", dueDate: "2025-07-08", assignee: "Kishan" },
  { id: 4, title: "JWT Authentication", description: "Login/register with token-based auth", priority: "Medium", status: "In Progress", dueDate: "2025-07-09", assignee: "Kishan" },
  { id: 5, title: "React Frontend", description: "Build TaskFlow Pro UI with Tailwind", priority: "Medium", status: "Todo", dueDate: "2025-07-12", assignee: "Kishan" },
  { id: 6, title: "Kanban Drag & Drop", description: "Implement dnd-kit for card dragging", priority: "Low", status: "Todo", dueDate: "2025-07-14", assignee: "Kishan" },
  { id: 7, title: "Deploy to Azure", description: "CI/CD pipeline with GitHub Actions", priority: "Low", status: "Todo", dueDate: "2025-07-18", assignee: "Kishan" },
];

const WEEKLY_DATA = [
  { day: "Mon", created: 3, completed: 2 },
  { day: "Tue", created: 5, completed: 4 },
  { day: "Wed", created: 2, completed: 3 },
  { day: "Thu", created: 4, completed: 2 },
  { day: "Fri", created: 6, completed: 5 },
  { day: "Sat", created: 1, completed: 1 },
  { day: "Sun", created: 2, completed: 3 },
];

// ============================================================
// AUTH CONTEXT
// ============================================================
const AuthContext = createContext(null);
function useAuth() { return useContext(AuthContext); }

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("tf_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("tf_token") || null);

  const login = (email, password, remember) => {
    if (email === "kishan@demo.com" && password === "password123") {
      const fakeToken = "eyJhbGciOiJIUzI1NiJ9.demo_token_kishan";
      setUser(MOCK_USER);
      setToken(fakeToken);
      if (remember) {
        localStorage.setItem("tf_user", JSON.stringify(MOCK_USER));
        localStorage.setItem("tf_token", fakeToken);
      }
      return { success: true };
    }
    return { success: false, error: "Invalid email or password" };
  };

  const logout = () => {
    setUser(null); setToken(null);
    localStorage.removeItem("tf_user");
    localStorage.removeItem("tf_token");
  };

  return <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
    {children}
  </AuthContext.Provider>;
}

// ============================================================
// TASK CONTEXT + REDUCER
// ============================================================
const TaskContext = createContext(null);
function useTasks() { return useContext(TaskContext); }

function taskReducer(state, action) {
  switch (action.type) {
    case "ADD": return [...state, { ...action.payload, id: Date.now() }];
    case "UPDATE": return state.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t);
    case "DELETE": return state.filter(t => t.id !== action.payload);
    case "MOVE": return state.map(t => t.id === action.payload.id ? { ...t, status: action.payload.status } : t);
    default: return state;
  }
}

function TaskProvider({ children }) {
  const [tasks, dispatch] = useReducer(taskReducer, INITIAL_TASKS);
  const addTask = (task) => dispatch({ type: "ADD", payload: task });
  const updateTask = (task) => dispatch({ type: "UPDATE", payload: task });
  const deleteTask = (id) => dispatch({ type: "DELETE", payload: id });
  const moveTask = (id, status) => dispatch({ type: "MOVE", payload: { id, status } });
  return <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask, moveTask }}>
    {children}
  </TaskContext.Provider>;
}

// ============================================================
// TOAST
// ============================================================
const ToastContext = createContext(null);
function useToast() { return useContext(ToastContext); }

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const show = (msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };
  const colors = { success: "#22c55e", error: "#ef4444", info: "#3b82f6" };
  return <ToastContext.Provider value={{ show }}>
    {children}
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: "#1e1e2e", color: "#fff", padding: "12px 20px", borderRadius: 10, borderLeft: `4px solid ${colors[t.type]}`, fontSize: 14, minWidth: 220, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", animation: "slideIn 0.3s ease" }}>
          {t.msg}
        </div>
      ))}
    </div>
  </ToastContext.Provider>;
}

// ============================================================
// PRIORITY CONFIG
// ============================================================
const PRIORITY = {
  High:   { color: "#ef4444", bg: "rgba(239,68,68,0.15)",   label: "High" },
  Medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)",  label: "Medium" },
  Low:    { color: "#22c55e", bg: "rgba(34,197,94,0.15)",   label: "Low" },
};

// ============================================================
// NAV
// ============================================================
function Navbar({ page, setPage }) {
  const { user, logout } = useAuth();
  const { show } = useToast();
  const navItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "kanban",    icon: "🗂️",  label: "Board" },
    { id: "profile",  icon: "👤", label: "Profile" },
  ];
  return (
    <nav style={{ background: "#13131f", borderBottom: "1px solid #2a2a3e", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 60, position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 13, color: "#a855f7", textShadow: "0 0 12px #a855f7" }}>TaskFlow<span style={{ color: "#22c55e" }}>Pro</span></span>
        <div style={{ display: "flex", gap: 4 }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{ background: page === n.id ? "rgba(168,85,247,0.15)" : "transparent", border: page === n.id ? "1px solid rgba(168,85,247,0.4)" : "1px solid transparent", color: page === n.id ? "#a855f7" : "#888", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
              <span>{n.icon}</span>{n.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ color: "#888", fontSize: 13 }}>👋 {user?.name?.split(" ")[0]}</span>
        <button onClick={() => { logout(); show("Logged out", "info"); }} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Logout</button>
      </div>
    </nav>
  );
}

// ============================================================
// LOGIN PAGE
// ============================================================
function LoginPage({ onLogin }) {
  const { login } = useAuth();
  const { show } = useToast();
  const [form, setForm] = useState({ email: "kishan@demo.com", password: "password123", remember: true });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.includes("@")) e.email = "Valid email required";
    if (form.password.length < 6) e.password = "Min 6 characters";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const res = login(form.email, form.password, form.remember);
    setLoading(false);
    if (res.success) { show("Welcome back, Kishan! 🚀", "success"); onLogin(); }
    else { setErrors({ submit: res.error }); show(res.error, "error"); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d1a", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 18, color: "#a855f7", textShadow: "0 0 20px #a855f7", marginBottom: 8 }}>TaskFlow<span style={{ color: "#22c55e" }}>Pro</span></h1>
          <p style={{ color: "#666", fontSize: 14 }}>Your .NET + React Task Manager</p>
        </div>

        <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 16, padding: 32 }}>
          <div style={{ display: "flex", marginBottom: 24, background: "#0d0d1a", borderRadius: 10, padding: 4 }}>
            {["Login", "Register"].map(t => (
              <button key={t} onClick={() => setIsRegister(t === "Register")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: (isRegister ? t === "Register" : t === "Login") ? "#a855f7" : "transparent", color: (isRegister ? t === "Register" : t === "Login") ? "#fff" : "#666", cursor: "pointer", fontSize: 13, transition: "all 0.2s" }}>{t}</button>
            ))}
          </div>

          {[
            { key: "email", label: "Email", type: "email", placeholder: "kishan@demo.com" },
            ...(isRegister ? [{ key: "name", label: "Full Name", type: "text", placeholder: "Kishan Marwadi" }] : []),
            { key: "password", label: "Password", type: "password", placeholder: "password123" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>{f.label}</label>
              <input type={f.type} value={form[f.key] || ""} placeholder={f.placeholder}
                onChange={e => { setForm(p => ({ ...p, [f.key]: e.target.value })); setErrors(p => ({ ...p, [f.key]: "" })); }}
                style={{ width: "100%", background: "#0d0d1a", border: `1px solid ${errors[f.key] ? "#ef4444" : "#2a2a3e"}`, borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              {errors[f.key] && <span style={{ color: "#ef4444", fontSize: 12 }}>{errors[f.key]}</span>}
            </div>
          ))}

          {!isRegister && (
            <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#888", fontSize: 13, marginBottom: 20, cursor: "pointer" }}>
              <input type="checkbox" checked={form.remember} onChange={e => setForm(p => ({ ...p, remember: e.target.checked }))} />
              Remember me
            </label>
          )}

          {errors.submit && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", color: "#ef4444", fontSize: 13, marginBottom: 16 }}>{errors.submit}</div>}

          <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", background: loading ? "#333" : "linear-gradient(135deg,#a855f7,#7c3aed)", border: "none", borderRadius: 8, padding: "12px", color: "#fff", fontSize: 14, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s", fontWeight: 600 }}>
            {loading ? "Authenticating..." : isRegister ? "Create Account" : "Sign In"}
          </button>

          <p style={{ color: "#555", fontSize: 12, textAlign: "center", marginTop: 16 }}>Demo: kishan@demo.com / password123</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD
// ============================================================
function Dashboard({ setPage }) {
  const { tasks } = useTasks();
  const { show } = useToast();
  const done = tasks.filter(t => t.status === "Done").length;
  const inProgress = tasks.filter(t => t.status === "In Progress").length;
  const todo = tasks.filter(t => t.status === "Todo").length;
  const rate = Math.round((done / tasks.length) * 100);
  const pieData = [
    { name: "Done", value: done, color: "#22c55e" },
    { name: "In Progress", value: inProgress, color: "#f59e0b" },
    { name: "Todo", value: todo, color: "#a855f7" },
  ];
  const stats = [
    { label: "Total Tasks", value: tasks.length, icon: "📋", color: "#a855f7" },
    { label: "Completed", value: done, icon: "✅", color: "#22c55e" },
    { label: "In Progress", value: inProgress, icon: "⚡", color: "#f59e0b" },
    { label: "Completion Rate", value: `${rate}%`, icon: "📈", color: "#3b82f6" },
  ];
  const recent = [...tasks].reverse().slice(0, 5);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: 22, margin: 0 }}>Dashboard</h1>
          <p style={{ color: "#666", fontSize: 14, margin: "4px 0 0" }}>TaskFlow Pro — .NET Backend Connected</p>
        </div>
        <button onClick={() => { setPage("kanban"); show("Opening board!", "info"); }} style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>+ Add Task</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 14, padding: "20px 24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: 16, top: 16, fontSize: 24, opacity: 0.3 }}>{s.icon}</div>
            <p style={{ color: "#666", fontSize: 12, margin: "0 0 8px", letterSpacing: "0.05em" }}>{s.label.toUpperCase()}</p>
            <p style={{ color: s.color, fontSize: 28, fontWeight: 700, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 14, padding: 20 }}>
          <h3 style={{ color: "#fff", fontSize: 15, margin: "0 0 20px" }}>Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={WEEKLY_DATA} barGap={4}>
              <XAxis dataKey="day" tick={{ fill: "#666", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#666", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid #2a2a3e", borderRadius: 8, color: "#fff" }} />
              <Bar dataKey="created" fill="#a855f7" radius={[4,4,0,0]} name="Created" />
              <Bar dataKey="completed" fill="#22c55e" radius={[4,4,0,0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 14, padding: 20 }}>
          <h3 style={{ color: "#fff", fontSize: 15, margin: "0 0 8px" }}>Task Breakdown</h3>
          <PieChart width={280} height={180}>
            <Pie data={pieData} cx={140} cy={90} outerRadius={80} innerRadius={50} dataKey="value">
              {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid #2a2a3e", borderRadius: 8, color: "#fff" }} />
          </PieChart>
          <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
            {pieData.map(p => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#888" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
                {p.name} ({p.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 14, padding: 20 }}>
        <h3 style={{ color: "#fff", fontSize: 15, margin: "0 0 16px" }}>Recent Activity</h3>
        {recent.map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1a1a2e" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: t.status === "Done" ? "#22c55e" : t.status === "In Progress" ? "#f59e0b" : "#a855f7" }} />
              <span style={{ color: "#ddd", fontSize: 14 }}>{t.title}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ background: PRIORITY[t.priority]?.bg, color: PRIORITY[t.priority]?.color, padding: "2px 10px", borderRadius: 20, fontSize: 11 }}>{t.priority}</span>
              <span style={{ color: "#555", fontSize: 12 }}>{t.dueDate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// TASK MODAL
// ============================================================
function TaskModal({ task, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(task || { title: "", description: "", priority: "Medium", status: "Todo", dueDate: "", assignee: "Kishan" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { show } = useToast();
  const isNew = !task?.id;

  const handleSave = () => {
    if (!form.title.trim()) { show("Title is required", "error"); return; }
    onSave(form);
    show(isNew ? "Task created!" : "Task updated!", "success");
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
      <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #2a2a3e" }}>
          <h2 style={{ color: "#fff", fontSize: 16, margin: 0 }}>{isNew ? "New Task" : "Edit Task"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { key: "title", label: "Title", type: "text", placeholder: "Task name..." },
            { key: "assignee", label: "Assignee", type: "text", placeholder: "Kishan" },
            { key: "dueDate", label: "Due Date", type: "date" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>{f.label}</label>
              <input type={f.type} value={form[f.key] || ""} placeholder={f.placeholder}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: "100%", background: "#0d0d1a", border: "1px solid #2a2a3e", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}

          <div>
            <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>Description</label>
            <textarea value={form.description || ""} placeholder="Task details..." rows={3}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              style={{ width: "100%", background: "#0d0d1a", border: "1px solid #2a2a3e", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                style={{ width: "100%", background: "#0d0d1a", border: "1px solid #2a2a3e", borderRadius: 8, padding: "10px 14px", color: PRIORITY[form.priority]?.color, fontSize: 14, outline: "none" }}>
                {["High","Medium","Low"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                style={{ width: "100%", background: "#0d0d1a", border: "1px solid #2a2a3e", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none" }}>
                {["Todo","In Progress","Done"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #2a2a3e", display: "flex", gap: 10, justifyContent: "space-between" }}>
          {!isNew && !showDeleteConfirm && (
            <button onClick={() => setShowDeleteConfirm(true)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Delete</button>
          )}
          {showDeleteConfirm && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: "#ef4444", fontSize: 13 }}>Sure?</span>
              <button onClick={() => { onDelete(task.id); onClose(); }} style={{ background: "#ef4444", border: "none", color: "#fff", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Yes, delete</button>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ background: "transparent", border: "1px solid #555", color: "#aaa", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Cancel</button>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button onClick={onClose} style={{ background: "transparent", border: "1px solid #2a2a3e", color: "#888", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
            <button onClick={handleSave} style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", border: "none", color: "#fff", padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{isNew ? "Create" : "Save"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// KANBAN BOARD
// ============================================================
const COLUMNS = [
  { id: "Todo",        label: "To Do",       color: "#a855f7", icon: "📌" },
  { id: "In Progress", label: "In Progress", color: "#f59e0b", icon: "⚡" },
  { id: "Done",        label: "Done",        color: "#22c55e", icon: "✅" },
];

function TaskCard({ task, onEdit, onDragStart }) {
  const p = PRIORITY[task.priority] || {};
  return (
    <div draggable onDragStart={() => onDragStart(task)}
      onClick={() => onEdit(task)}
      style={{ background: "#0d0d1a", border: "1px solid #2a2a3e", borderRadius: 10, padding: 14, cursor: "grab", transition: "all 0.2s", marginBottom: 8 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#a855f7"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a3e"; e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <p style={{ color: "#ddd", fontSize: 13, margin: 0, fontWeight: 500, flex: 1, lineHeight: 1.4 }}>{task.title}</p>
        <span style={{ background: p.bg, color: p.color, fontSize: 10, padding: "2px 8px", borderRadius: 20, marginLeft: 8, whiteSpace: "nowrap" }}>{task.priority}</span>
      </div>
      {task.description && <p style={{ color: "#555", fontSize: 12, margin: "0 0 10px", lineHeight: 1.5 }}>{task.description.slice(0, 60)}{task.description.length > 60 ? "..." : ""}</p>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: "linear-gradient(135deg,#a855f7,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700 }}>
          {task.assignee?.[0] || "K"}
        </div>
        {task.dueDate && <span style={{ color: "#555", fontSize: 11 }}>📅 {task.dueDate}</span>}
      </div>
    </div>
  );
}

function KanbanColumn({ column, tasks, onEdit, onDragStart, onDrop, onAddTask }) {
  const [isOver, setIsOver] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const { addTask } = useTasks();
  const { show } = useToast();

  const handleQuickAdd = () => {
    if (!newTitle.trim()) return;
    addTask({ title: newTitle, status: column.id, priority: "Medium", description: "", assignee: "Kishan", dueDate: "" });
    setNewTitle(""); setShowAdd(false);
    show("Task added!", "success");
  };

  return (
    <div style={{ flex: 1, minWidth: 260 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, padding: "10px 14px", background: "#13131f", borderRadius: 10, border: `1px solid ${column.color}30` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>{column.icon}</span>
          <span style={{ color: "#ddd", fontSize: 13, fontWeight: 600 }}>{column.label}</span>
          <span style={{ background: `${column.color}20`, color: column.color, fontSize: 11, padding: "1px 8px", borderRadius: 20 }}>{tasks.length}</span>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>+</button>
      </div>

      <div onDragOver={e => { e.preventDefault(); setIsOver(true); }} onDragLeave={() => setIsOver(false)}
        onDrop={() => { onDrop(column.id); setIsOver(false); }}
        style={{ minHeight: 200, background: isOver ? `${column.color}08` : "transparent", border: isOver ? `2px dashed ${column.color}50` : "2px dashed transparent", borderRadius: 10, padding: 4, transition: "all 0.2s" }}>
        {tasks.map(t => <TaskCard key={t.id} task={t} onEdit={onEdit} onDragStart={onDragStart} />)}
        {tasks.length === 0 && !isOver && <div style={{ textAlign: "center", color: "#333", fontSize: 13, padding: "40px 0" }}>Drop tasks here</div>}
      </div>

      {showAdd && (
        <div style={{ marginTop: 8 }}>
          <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleQuickAdd(); if (e.key === "Escape") setShowAdd(false); }}
            placeholder="Task title..." style={{ width: "100%", background: "#0d0d1a", border: `1px solid ${column.color}50`, borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 6 }} />
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={handleQuickAdd} style={{ flex: 1, background: column.color, border: "none", borderRadius: 6, padding: "6px", color: "#fff", cursor: "pointer", fontSize: 12 }}>Add</button>
            <button onClick={() => setShowAdd(false)} style={{ background: "transparent", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", color: "#666", cursor: "pointer", fontSize: 12 }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

function KanbanBoard() {
  const { tasks, addTask, updateTask, deleteTask, moveTask } = useTasks();
  const [dragTask, setDragTask] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");

  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) &&
    (filterPriority === "All" || t.priority === filterPriority)
  );

  const handleDrop = (status) => { if (dragTask) { moveTask(dragTask.id, status); setDragTask(null); } };
  const handleSave = (data) => { data.id ? updateTask(data) : addTask(data); };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: 22, margin: 0 }}>Kanban Board</h1>
          <p style={{ color: "#666", fontSize: 14, margin: "4px 0 0" }}>Drag & drop to move tasks between columns</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."
            style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 8, padding: "8px 14px", color: "#fff", fontSize: 13, outline: "none", width: 180 }} />
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 8, padding: "8px 14px", color: "#fff", fontSize: 13, outline: "none" }}>
            {["All","High","Medium","Low"].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={() => { setEditTask(null); setShowModal(true); }} style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", border: "none", borderRadius: 8, padding: "8px 18px", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>+ New Task</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", overflowX: "auto", paddingBottom: 16 }}>
        {COLUMNS.map(col => (
          <KanbanColumn key={col.id} column={col}
            tasks={filtered.filter(t => t.status === col.id)}
            onEdit={t => { setEditTask(t); setShowModal(true); }}
            onDragStart={setDragTask}
            onDrop={handleDrop} />
        ))}
      </div>

      {showModal && (
        <TaskModal task={editTask} onClose={() => setShowModal(false)}
          onSave={handleSave} onDelete={deleteTask} />
      )}
    </div>
  );
}

// ============================================================
// PROFILE PAGE
// ============================================================
function ProfilePage() {
  const { user, logout } = useAuth();
  const { show } = useToast();
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({ name: user?.name, role: user?.role, email: user?.email });

  const handlePwChange = () => {
    if (pwForm.current !== "password123") { show("Current password incorrect", "error"); return; }
    if (pwForm.next.length < 6) { show("Min 6 characters", "error"); return; }
    if (pwForm.next !== pwForm.confirm) { show("Passwords don't match", "error"); return; }
    show("Password updated!", "success");
    setPwForm({ current: "", next: "", confirm: "" });
  };

  const stats = [
    { label: "Tasks Created", value: 7 },
    { label: "Completed", value: 2 },
    { label: "In Progress", value: 2 },
    { label: "Streak", value: "3 days" },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ color: "#fff", fontSize: 22, marginBottom: 24 }}>Profile</h1>

      <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 16, padding: 28, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
          <div style={{ width: 70, height: 70, borderRadius: 16, background: "linear-gradient(135deg,#a855f7,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#fff", fontWeight: 700 }}>
            {user?.name?.[0]}
          </div>
          <div style={{ flex: 1 }}>
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  style={{ background: "#0d0d1a", border: "1px solid #a855f7", borderRadius: 6, padding: "6px 10px", color: "#fff", fontSize: 15, outline: "none" }} />
                <input value={profile.role} onChange={e => setProfile(p => ({ ...p, role: e.target.value }))}
                  style={{ background: "#0d0d1a", border: "1px solid #2a2a3e", borderRadius: 6, padding: "6px 10px", color: "#aaa", fontSize: 13, outline: "none" }} />
              </div>
            ) : (
              <>
                <h2 style={{ color: "#fff", fontSize: 18, margin: "0 0 4px" }}>{profile.name}</h2>
                <p style={{ color: "#a855f7", fontSize: 13, margin: "0 0 2px" }}>{profile.role}</p>
                <p style={{ color: "#555", fontSize: 13, margin: 0 }}>{profile.email}</p>
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {editing ? (
              <button onClick={() => { setEditing(false); show("Profile updated!", "success"); }} style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", border: "none", color: "#fff", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Save</button>
            ) : (
              <button onClick={() => setEditing(true)} style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", color: "#a855f7", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Edit Profile</button>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: "#0d0d1a", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
              <p style={{ color: "#a855f7", fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>{s.value}</p>
              <p style={{ color: "#555", fontSize: 12, margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 16, padding: 28, marginBottom: 20 }}>
        <h3 style={{ color: "#fff", fontSize: 15, margin: "0 0 20px" }}>Change Password</h3>
        {[
          { key: "current", label: "Current Password" },
          { key: "next", label: "New Password" },
          { key: "confirm", label: "Confirm New Password" },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>{f.label}</label>
            <input type="password" value={pwForm[f.key]} onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
              style={{ width: "100%", background: "#0d0d1a", border: "1px solid #2a2a3e", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
        <button onClick={handlePwChange} style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", border: "none", borderRadius: 8, padding: "10px 24px", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Update Password</button>
      </div>

      <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ color: "#ef4444", fontSize: 14, margin: "0 0 4px" }}>Logout</h3>
          <p style={{ color: "#666", fontSize: 13, margin: 0 }}>Sign out of your TaskFlow Pro account</p>
        </div>
        <button onClick={() => { logout(); show("Logged out!", "info"); }} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Logout</button>
      </div>
    </div>
  );
}

// ============================================================
// APP ROOT
// ============================================================
function AppInner() {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState("dashboard");

  if (!isAuthenticated) return <LoginPage onLogin={() => setPage("dashboard")} />;

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d1a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d0d1a; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); }
        @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #0d0d1a; }
        ::-webkit-scrollbar-thumb { background: #2a2a3e; border-radius: 4px; }
        select option { background: #13131f; color: #fff; }
      `}</style>
      <Navbar page={page} setPage={setPage} />
      {page === "dashboard" && <Dashboard setPage={setPage} />}
      {page === "kanban"    && <KanbanBoard />}
      {page === "profile"   && <ProfilePage />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <ToastProvider>
          <AppInner />
        </ToastProvider>
      </TaskProvider>
    </AuthProvider>
  );
}