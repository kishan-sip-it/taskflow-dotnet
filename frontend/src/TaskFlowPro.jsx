import { useState, useEffect, useContext, useReducer, createContext } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import axios from 'axios';

// ✅ FIX 1 — Yahan apna current Codespace backend URL daal
const API_BASE_URL = "https://potential-journey-5g9gxr4j6rv9hpg45-5193.app.github.dev/api";

const WEEKLY_DATA = [
  { day: "Mon", created: 3, completed: 2 },
  { day: "Tue", created: 5, completed: 4 },
  { day: "Wed", created: 2, completed: 3 },
  { day: "Thu", created: 4, completed: 2 },
  { day: "Fri", created: 6, completed: 5 },
  { day: "Sat", created: 1, completed: 1 },
  { day: "Sun", created: 2, completed: 3 },
];

const PRIORITY = {
  High:   { color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  Medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  Low:    { color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
};

const COLUMNS = [
  { id: "Pending",    label: "To Do",       color: "#a855f7", icon: "📌" },
  { id: "InProgress", label: "In Progress", color: "#f59e0b", icon: "⚡" },
  { id: "Completed",  label: "Done",        color: "#22c55e", icon: "✅" },
];

// ============================================================
// AXIOS INSTANCE — auto JWT attach
// ============================================================
const api = axios.create({ baseURL: API_BASE_URL });
api.interceptors.request.use(config => {
  const token = localStorage.getItem("tf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ============================================================
// AUTH CONTEXT
// ============================================================
const AuthContext = createContext(null);
function useAuth() { return useContext(AuthContext); }

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem("tf_user");
    return s ? JSON.parse(s) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("tf_token") || null);

  // ✅ FIX 2 — Sahi credentials format
  const login = async (username, password, remember) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/Auth/login`, 
        { username, password },
        { headers: { "Content-Type": "application/json" } }
      );
      const { token: newToken } = res.data;
      const userData = { id: 1, name: "Kishan Marwadi", email: "kishan.18mm19@gmail.com", role: "Full Stack Developer", username };
      setUser(userData);
      setToken(newToken);
      if (remember) {
        localStorage.setItem("tf_user", JSON.stringify(userData));
        localStorage.setItem("tf_token", newToken);
      }
      return { success: true };
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      return { success: false, error: err.response?.data?.message || "Invalid username or password" };
    }
  };

  const logout = () => {
    setUser(null); setToken(null);
    localStorage.removeItem("tf_user");
    localStorage.removeItem("tf_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// TASK CONTEXT
// ============================================================
const TaskContext = createContext(null);
function useTasks() { return useContext(TaskContext); }

function taskReducer(state, action) {
  switch (action.type) {
    case "SET":    return action.payload;
    case "ADD":    return [...state, action.payload];
    case "UPDATE": return state.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t);
    case "DELETE": return state.filter(t => t.id !== action.payload);
    default:       return state;
  }
}

function TaskProvider({ children }) {
  const [tasks, dispatch] = useReducer(taskReducer, []);
  const [loading, setLoading] = useState(false);

  // ✅ FIX 3 — Token ready hone pe tasks fetch karo
  useEffect(() => {
    const token = localStorage.getItem("tf_token");
    if (!token) return;
    setLoading(true);
    api.get("/Task")
      .then(res => {
        dispatch({ type: "SET", payload: res.data.map(t => ({
          ...t,
          priority: t.priority || "Medium",
          assignee: t.assignee || "Kishan",
          dueDate: t.dueDate || "",
          description: t.description || "",
        }))});
      })
      .catch(err => console.error("Fetch tasks failed:", err))
      .finally(() => setLoading(false));
  }, [localStorage.getItem("tf_token")]);

  const addTask = async (task) => {
    try {
      const res = await api.post("/Task", {
        title: task.title,
        status: task.status || "Pending",
        priority: task.priority || "Medium",
        description: task.description || "",
        assignee: task.assignee || "Kishan",
        dueDate: task.dueDate || null,
      });
      dispatch({ type: "ADD", payload: { ...task, id: res.data.id } });
    } catch (err) { console.error("Add failed:", err); }
  };

  const updateTask = async (task) => {
    try {
      await api.put(`/Task/${task.id}`, task);
      dispatch({ type: "UPDATE", payload: task });
    } catch (err) { console.error("Update failed:", err); }
  };

  const deleteTask = async (id) => {
    try {
      await api.delete(`/Task/${id}`);
      dispatch({ type: "DELETE", payload: id });
    } catch (err) { console.error("Delete failed:", err); }
  };

  const moveTask = async (id, status) => {
    const t = tasks.find(t => t.id === id);
    if (t) await updateTask({ ...t, status });
  };

  return (
    <TaskContext.Provider value={{ tasks, loading, addTask, updateTask, deleteTask, moveTask }}>
      {children}
    </TaskContext.Provider>
  );
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
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: "#1e1e2e", color: "#fff", padding: "12px 20px", borderRadius: 10, borderLeft: `4px solid ${colors[t.type]}`, fontSize: 14, minWidth: 240, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ============================================================
// NAVBAR
// ============================================================
function Navbar({ page, setPage }) {
  const { user, logout } = useAuth();
  const { show } = useToast();
  const navItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "kanban",    icon: "🗂️",  label: "Board" },
    { id: "profile",   icon: "👤", label: "Profile" },
  ];
  return (
    <nav style={{ background: "#13131f", borderBottom: "1px solid #2a2a3e", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 60, position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: "#a855f7", textShadow: "0 0 12px #a855f7" }}>
          TaskFlow<span style={{ color: "#22c55e" }}>Pro</span>
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)}
              style={{ background: page === n.id ? "rgba(168,85,247,0.15)" : "transparent", border: page === n.id ? "1px solid rgba(168,85,247,0.4)" : "1px solid transparent", color: page === n.id ? "#a855f7" : "#888", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
              {n.icon} {n.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ color: "#888", fontSize: 13 }}>👋 {user?.name?.split(" ")[0]}</span>
        <button onClick={() => { logout(); show("Logged out", "info"); }}
          style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
          Logout
        </button>
      </div>
    </nav>
  );
}

// ============================================================
// LOGIN PAGE  ✅ FIX 4 — admin/admin123 credentials
// ============================================================
function LoginPage({ onLogin }) {
  const { login } = useAuth();
  const { show } = useToast();
  // ✅ Default credentials jo backend mein hain
  const [form, setForm] = useState({ username: "admin", password: "admin123", remember: true });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.username.trim()) { setErrors({ username: "Username required" }); return; }
    if (form.password.length < 6) { setErrors({ password: "Min 6 characters" }); return; }
    setLoading(true);
    const res = await login(form.username, form.password, form.remember);
    setLoading(false);
    if (res.success) { show("Welcome back! 🚀", "success"); onLogin(); }
    else { setErrors({ submit: res.error }); show(res.error, "error"); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d1a", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 16, color: "#a855f7", textShadow: "0 0 20px #a855f7", marginBottom: 8 }}>
            TaskFlow<span style={{ color: "#22c55e" }}>Pro</span>
          </h1>
          <p style={{ color: "#666", fontSize: 14 }}>.NET Backend + React Frontend</p>
        </div>
        <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 16, padding: 32 }}>
          {[
            { key: "username", label: "Username", type: "text", placeholder: "admin" },
            { key: "password", label: "Password", type: "password", placeholder: "admin123" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>{f.label}</label>
              <input type={f.type} value={form[f.key]} placeholder={f.placeholder}
                onChange={e => { setForm(p => ({ ...p, [f.key]: e.target.value })); setErrors({}); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                style={{ width: "100%", background: "#0d0d1a", border: `1px solid ${errors[f.key] ? "#ef4444" : "#2a2a3e"}`, borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              {errors[f.key] && <span style={{ color: "#ef4444", fontSize: 12 }}>{errors[f.key]}</span>}
            </div>
          ))}
          <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#888", fontSize: 13, marginBottom: 20, cursor: "pointer" }}>
            <input type="checkbox" checked={form.remember} onChange={e => setForm(p => ({ ...p, remember: e.target.checked }))} />
            Remember me
          </label>
          {errors.submit && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", color: "#ef4444", fontSize: 13, marginBottom: 16 }}>
              {errors.submit}
            </div>
          )}
          <button onClick={handleSubmit} disabled={loading}
            style={{ width: "100%", background: loading ? "#333" : "linear-gradient(135deg,#a855f7,#7c3aed)", border: "none", borderRadius: 8, padding: "12px", color: "#fff", fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontWeight: 600 }}>
            {loading ? "Connecting to .NET API..." : "Sign In"}
          </button>
          <p style={{ color: "#555", fontSize: 12, textAlign: "center", marginTop: 16 }}>
            Credentials: <span style={{ color: "#a855f7" }}>admin</span> / <span style={{ color: "#22c55e" }}>admin123</span>
          </p>
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
  const done       = tasks.filter(t => t.status === "Completed").length;
  const inProgress = tasks.filter(t => t.status === "InProgress").length;
  const todo       = tasks.filter(t => t.status === "Pending").length;
  const rate       = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const pieData = [
    { name: "Done",        value: done || 0,       color: "#22c55e" },
    { name: "In Progress", value: inProgress || 0, color: "#f59e0b" },
    { name: "Todo",        value: todo || 0,        color: "#a855f7" },
  ];
  const stats = [
    { label: "Total Tasks",     value: tasks.length, icon: "📋", color: "#a855f7" },
    { label: "Completed",       value: done,          icon: "✅", color: "#22c55e" },
    { label: "In Progress",     value: inProgress,    icon: "⚡", color: "#f59e0b" },
    { label: "Completion Rate", value: `${rate}%`,    icon: "📈", color: "#3b82f6" },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: 22, margin: 0 }}>Dashboard</h1>
          <p style={{ color: "#666", fontSize: 14, margin: "4px 0 0" }}>
            ✅ .NET API Connected — {tasks.length} tasks loaded
          </p>
        </div>
        <button onClick={() => setPage("kanban")}
          style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
          + Add Task
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 14, padding: "20px 24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: 16, top: 16, fontSize: 24, opacity: 0.2 }}>{s.icon}</div>
            <p style={{ color: "#666", fontSize: 11, margin: "0 0 8px", letterSpacing: "0.1em" }}>{s.label.toUpperCase()}</p>
            <p style={{ color: s.color, fontSize: 28, fontWeight: 700, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 14, padding: 20 }}>
          <h3 style={{ color: "#fff", fontSize: 15, margin: "0 0 20px" }}>Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={WEEKLY_DATA}>
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
              {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid #2a2a3e", borderRadius: 8, color: "#fff" }} />
          </PieChart>
          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
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
        <h3 style={{ color: "#fff", fontSize: 15, margin: "0 0 16px" }}>Recent Tasks</h3>
        {tasks.slice(-5).reverse().map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1a1a2e" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: t.status === "Completed" ? "#22c55e" : t.status === "InProgress" ? "#f59e0b" : "#a855f7" }} />
              <span style={{ color: "#ddd", fontSize: 14 }}>{t.title}</span>
            </div>
            <span style={{ background: PRIORITY[t.priority]?.bg, color: PRIORITY[t.priority]?.color, padding: "2px 10px", borderRadius: 20, fontSize: 11 }}>{t.priority}</span>
          </div>
        ))}
        {tasks.length === 0 && <p style={{ color: "#555", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No tasks yet — add some from the Board!</p>}
      </div>
    </div>
  );
}

// ============================================================
// TASK MODAL
// ============================================================
function TaskModal({ task, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(task || { title: "", description: "", priority: "Medium", status: "Pending", dueDate: "", assignee: "Kishan" });
  const [showDel, setShowDel] = useState(false);
  const { show } = useToast();
  const isNew = !task?.id;

  const handleSave = () => {
    if (!form.title.trim()) { show("Title required", "error"); return; }
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
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { key: "title", label: "Title", type: "text" },
            { key: "assignee", label: "Assignee", type: "text" },
            { key: "dueDate", label: "Due Date", type: "date" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>{f.label}</label>
              <input type={f.type} value={form[f.key] || ""}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: "100%", background: "#0d0d1a", border: "1px solid #2a2a3e", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <div>
            <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>Description</label>
            <textarea value={form.description || ""} rows={3}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              style={{ width: "100%", background: "#0d0d1a", border: "1px solid #2a2a3e", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                style={{ width: "100%", background: "#0d0d1a", border: "1px solid #2a2a3e", borderRadius: 8, padding: "10px 14px", color: PRIORITY[form.priority]?.color || "#fff", fontSize: 14, outline: "none" }}>
                {["High","Medium","Low"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                style={{ width: "100%", background: "#0d0d1a", border: "1px solid #2a2a3e", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none" }}>
                <option value="Pending">To Do</option>
                <option value="InProgress">In Progress</option>
                <option value="Completed">Done</option>
              </select>
            </div>
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid #2a2a3e", display: "flex", justifyContent: "space-between" }}>
          <div>
            {!isNew && !showDel && (
              <button onClick={() => setShowDel(true)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Delete</button>
            )}
            {showDel && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: "#ef4444", fontSize: 13 }}>Sure?</span>
                <button onClick={() => { onDelete(task.id); onClose(); }} style={{ background: "#ef4444", border: "none", color: "#fff", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Yes</button>
                <button onClick={() => setShowDel(false)} style={{ background: "transparent", border: "1px solid #555", color: "#aaa", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>No</button>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{ background: "transparent", border: "1px solid #2a2a3e", color: "#888", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
            <button onClick={handleSave} style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", border: "none", color: "#fff", padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{isNew ? "Create" : "Save"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// KANBAN
// ============================================================
function TaskCard({ task, onEdit, onDragStart }) {
  const p = PRIORITY[task.priority] || {};
  return (
    <div draggable onDragStart={() => onDragStart(task)} onClick={() => onEdit(task)}
      style={{ background: "#0d0d1a", border: "1px solid #2a2a3e", borderRadius: 10, padding: 14, cursor: "grab", marginBottom: 8, transition: "all 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#a855f7"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a3e"; e.currentTarget.style.transform = "none"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <p style={{ color: "#ddd", fontSize: 13, margin: 0, fontWeight: 500, flex: 1, lineHeight: 1.4 }}>{task.title}</p>
        <span style={{ background: p.bg, color: p.color, fontSize: 10, padding: "2px 8px", borderRadius: 20, marginLeft: 8 }}>{task.priority}</span>
      </div>
      {task.description && <p style={{ color: "#555", fontSize: 12, margin: "0 0 10px" }}>{task.description.slice(0,60)}{task.description.length > 60 ? "..." : ""}</p>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: "linear-gradient(135deg,#a855f7,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700 }}>
          {(task.assignee || "K")[0]}
        </div>
        {task.dueDate && <span style={{ color: "#555", fontSize: 11 }}>📅 {task.dueDate?.slice(0,10)}</span>}
      </div>
    </div>
  );
}

function KanbanColumn({ column, tasks, onEdit, onDragStart, onDrop }) {
  const [isOver, setIsOver] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const { addTask } = useTasks();
  const { show } = useToast();

  const handleQuickAdd = () => {
    if (!newTitle.trim()) return;
    addTask({ title: newTitle, status: column.id, priority: "Medium", description: "", assignee: "Kishan", dueDate: "" });
    setNewTitle(""); setShowAdd(false);
    show("Task added to .NET DB!", "success");
  };

  return (
    <div style={{ flex: 1, minWidth: 260 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, padding: "10px 14px", background: "#13131f", borderRadius: 10, border: `1px solid ${column.color}30` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>{column.icon}</span>
          <span style={{ color: "#ddd", fontSize: 13, fontWeight: 600 }}>{column.label}</span>
          <span style={{ background: `${column.color}20`, color: column.color, fontSize: 11, padding: "1px 8px", borderRadius: 20 }}>{tasks.length}</span>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 20 }}>+</button>
      </div>
      <div onDragOver={e => { e.preventDefault(); setIsOver(true); }} onDragLeave={() => setIsOver(false)}
        onDrop={() => { onDrop(column.id); setIsOver(false); }}
        style={{ minHeight: 200, background: isOver ? `${column.color}08` : "transparent", border: isOver ? `2px dashed ${column.color}50` : "2px dashed transparent", borderRadius: 10, padding: 4, transition: "all 0.2s" }}>
        {tasks.map(t => <TaskCard key={t.id} task={t} onEdit={onEdit} onDragStart={onDragStart} />)}
        {tasks.length === 0 && !isOver && <div style={{ textAlign: "center", color: "#333", fontSize: 13, padding: "40px 0" }}>Drop here</div>}
      </div>
      {showAdd && (
        <div style={{ marginTop: 8 }}>
          <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleQuickAdd(); if (e.key === "Escape") setShowAdd(false); }}
            placeholder="Task title..."
            style={{ width: "100%", background: "#0d0d1a", border: `1px solid ${column.color}50`, borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 6 }} />
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
    t.title?.toLowerCase().includes(search.toLowerCase()) &&
    (filterPriority === "All" || t.priority === filterPriority)
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: 22, margin: 0 }}>Kanban Board</h1>
          <p style={{ color: "#666", fontSize: 14, margin: "4px 0 0" }}>Drag & drop — saves to .NET database</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 8, padding: "8px 14px", color: "#fff", fontSize: 13, outline: "none", width: 160 }} />
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 8, padding: "8px 14px", color: "#fff", fontSize: 13, outline: "none" }}>
            {["All","High","Medium","Low"].map(p => <option key={p}>{p}</option>)}
          </select>
          <button onClick={() => { setEditTask(null); setShowModal(true); }}
            style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", border: "none", borderRadius: 8, padding: "8px 18px", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
            + New Task
          </button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", overflowX: "auto", paddingBottom: 16 }}>
        {COLUMNS.map(col => (
          <KanbanColumn key={col.id} column={col}
            tasks={filtered.filter(t => t.status === col.id)}
            onEdit={t => { setEditTask(t); setShowModal(true); }}
            onDragStart={setDragTask}
            onDrop={status => { if (dragTask) { moveTask(dragTask.id, status); setDragTask(null); } }} />
        ))}
      </div>
      {showModal && (
        <TaskModal task={editTask} onClose={() => setShowModal(false)}
          onSave={data => data.id ? updateTask(data) : addTask(data)}
          onDelete={deleteTask} />
      )}
    </div>
  );
}

// ============================================================
// PROFILE
// ============================================================
function ProfilePage() {
  const { user, logout } = useAuth();
  const { show } = useToast();
  const { tasks } = useTasks();
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });

  const done = tasks.filter(t => t.status === "Completed").length;
  const inProgress = tasks.filter(t => t.status === "InProgress").length;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ color: "#fff", fontSize: 22, marginBottom: 24 }}>Profile</h1>
      <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 16, padding: 28, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
          <div style={{ width: 70, height: 70, borderRadius: 16, background: "linear-gradient(135deg,#a855f7,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: "#fff", fontWeight: 700 }}>
            {user?.name?.[0]}
          </div>
          <div>
            <h2 style={{ color: "#fff", fontSize: 18, margin: "0 0 4px" }}>{user?.name}</h2>
            <p style={{ color: "#a855f7", fontSize: 13, margin: "0 0 2px" }}>{user?.role}</p>
            <p style={{ color: "#555", fontSize: 13, margin: 0 }}>{user?.email}</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { label: "Total Tasks", value: tasks.length },
            { label: "Completed", value: done },
            { label: "In Progress", value: inProgress },
            { label: "Rate", value: tasks.length ? `${Math.round(done/tasks.length*100)}%` : "0%" },
          ].map(s => (
            <div key={s.label} style={{ background: "#0d0d1a", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
              <p style={{ color: "#a855f7", fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>{s.value}</p>
              <p style={{ color: "#555", fontSize: 12, margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 16, padding: 28, marginBottom: 20 }}>
        <h3 style={{ color: "#fff", fontSize: 15, margin: "0 0 20px" }}>Change Password</h3>
        {[{ key:"current",label:"Current Password" },{ key:"next",label:"New Password" },{ key:"confirm",label:"Confirm" }].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>{f.label}</label>
            <input type="password" value={pwForm[f.key]} onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
              style={{ width: "100%", background: "#0d0d1a", border: "1px solid #2a2a3e", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
        <button onClick={() => {
          if (pwForm.next !== pwForm.confirm) { show("Passwords don't match","error"); return; }
          if (pwForm.next.length < 6) { show("Min 6 characters","error"); return; }
          show("Password updated!","success");
          setPwForm({ current:"", next:"", confirm:"" });
        }} style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", border: "none", borderRadius: 8, padding: "10px 24px", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
          Update Password
        </button>
      </div>

      <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ color: "#ef4444", fontSize: 14, margin: "0 0 4px" }}>Logout</h3>
          <p style={{ color: "#666", fontSize: 13, margin: 0 }}>Sign out from TaskFlow Pro</p>
        </div>
        <button onClick={() => { logout(); show("Logged out!", "info"); }}
          style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          Logout
        </button>
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
        * { box-sizing: border-box; }
        body { background: #0d0d1a; margin: 0; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); }
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