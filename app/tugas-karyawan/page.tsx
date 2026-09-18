"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type CostStatus = "none" | "pending" | "approved" | "rejected" | "paid";
type Task = {
  id: string;
  employee_name: string;
  task_date: string;
  due_date: string | null;
  task_description: string;
  notes: string | null;
  priority: "normal" | "penting" | "mendesak";
  status: "pending" | "done";
  needs_cost: boolean;
  cost_description: string | null;
  requested_amount: number;
  cost_status: CostStatus;
};

type FormState = {
  employee_name: string;
  task_date: string;
  due_date: string;
  task_description: string;
  notes: string;
  priority: Task["priority"];
  needs_cost: boolean;
  cost_description: string;
  requested_amount: string;
};

const newForm = (): FormState => ({
  employee_name: "",
  task_date: new Date().toISOString().slice(0, 10),
  due_date: "",
  task_description: "",
  notes: "",
  priority: "normal",
  needs_cost: false,
  cost_description: "",
  requested_amount: "",
});

const money = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);

const costLabel = (status: CostStatus) => ({
  none: "Tidak Ada Biaya",
  pending: "Menunggu Persetujuan",
  approved: "Disetujui",
  rejected: "Ditolak",
  paid: "Sudah Dibayar",
}[status]);

export default function TugasKaryawanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState<FormState>(newForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadTasks() {
    setLoading(true);
    const { data, error } = await supabase.from("employee_tasks").select("*").order("task_date", { ascending: false }).order("created_at", { ascending: false });
    if (error) setMessage(`Gagal memuat: ${error.message}`);
    else setTasks((data || []) as Task[]);
    setLoading(false);
  }

  useEffect(() => { loadTasks(); }, []);

  const visibleTasks = tasks.filter((task) => {
    const q = search.toLowerCase();
    return (filter === "all" || task.status === filter) && (!q || task.employee_name.toLowerCase().includes(q) || task.task_description.toLowerCase().includes(q));
  });

  function change<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((old) => ({ ...old, [key]: value }));
  }

  function reset() {
    setForm(newForm());
    setEditingId(null);
    setShowForm(false);
  }

  async function save() {
    setMessage("");
    if (!form.employee_name.trim() || !form.task_description.trim()) return setMessage("Nama karyawan dan uraian tugas wajib diisi.");
    if (form.needs_cost && !form.cost_description.trim()) return setMessage("Keterangan biaya wajib diisi.");

    const payload = {
      employee_name: form.employee_name.trim(),
      task_date: form.task_date,
      due_date: form.due_date || null,
      task_description: form.task_description.trim(),
      notes: form.notes.trim() || null,
      priority: form.priority,
      needs_cost: form.needs_cost,
      cost_description: form.needs_cost ? form.cost_description.trim() : null,
      requested_amount: form.needs_cost ? Number(form.requested_amount || 0) : 0,
      cost_status: form.needs_cost ? "pending" : "none",
    };

    const result = editingId ? await supabase.from("employee_tasks").update(payload).eq("id", editingId) : await supabase.from("employee_tasks").insert(payload);
    if (result.error) setMessage(`Gagal menyimpan: ${result.error.message}`);
    else { setMessage(editingId ? "Tugas diperbarui." : "Tugas ditambahkan."); reset(); loadTasks(); }
  }

  async function toggle(task: Task) {
    const { error } = await supabase.from("employee_tasks").update({ status: task.status === "done" ? "pending" : "done" }).eq("id", task.id);
    if (error) setMessage(error.message); else loadTasks();
  }

  async function updateCostStatus(task: Task, nextStatus: "approved" | "rejected" | "paid") {
    const action = nextStatus === "approved" ? "menyetujui" : nextStatus === "rejected" ? "menolak" : "menandai sudah dibayar";
    if (!confirm(`Yakin ingin ${action} pengajuan biaya ini?`)) return;
    const update: Record<string, string> = { cost_status: nextStatus };
    if (nextStatus === "approved") update.cost_approved_at = new Date().toISOString();
    if (nextStatus === "paid") update.cost_paid_at = new Date().toISOString();
    const { error } = await supabase.from("employee_tasks").update(update).eq("id", task.id);
    if (error) setMessage(`Gagal mengubah status biaya: ${error.message}`);
    else { setMessage(`Status biaya: ${costLabel(nextStatus)}.`); loadTasks(); }
  }

  async function remove(task: Task) {
    if (!confirm("Hapus tugas ini?")) return;
    const { error } = await supabase.from("employee_tasks").delete().eq("id", task.id);
    if (error) setMessage(error.message); else loadTasks();
  }

  function edit(task: Task) {
    setEditingId(task.id);
    setForm({ employee_name: task.employee_name, task_date: task.task_date, due_date: task.due_date || "", task_description: task.task_description, notes: task.notes || "", priority: task.priority, needs_cost: task.needs_cost, cost_description: task.cost_description || "", requested_amount: task.requested_amount ? String(task.requested_amount) : "" });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function whatsapp(task: Task) {
    const text = `PERMOHONAN BIAYA TUGAS KARYAWAN\n\nKaryawan: ${task.employee_name}\nTugas: ${task.task_description}\nKeperluan: ${task.cost_description || "-"}\nNominal: ${money(task.requested_amount)}\nStatus: ${costLabel(task.cost_status)}\n\nMohon persetujuan biaya.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <main className="page">
      <div className="container">
        <div className="header"><div><div className="brand">SATU RESTOE TEAM SOFTWARE</div><h1>Tugas Karyawan</h1><p>Checklist pekerjaan dan permohonan biaya.</p></div><button className="primary" onClick={() => showForm ? reset() : setShowForm(true)}>{showForm ? "Tutup Form" : "+ Tambah Tugas"}</button></div>
        {message && <div className="message">{message}</div>}

        <div className="stats">
          <div><span>Total</span><strong>{tasks.length}</strong></div>
          <div><span>Belum Selesai</span><strong>{tasks.filter(t => t.status === "pending").length}</strong></div>
          <div><span>Selesai</span><strong>{tasks.filter(t => t.status === "done").length}</strong></div>
          <div><span>Biaya Menunggu</span><strong>{tasks.filter(t => t.needs_cost && t.cost_status === "pending").length}</strong></div>
        </div>

        {showForm && <section className="panel form-panel"><h2>{editingId ? "Edit Tugas" : "Tambah Tugas Baru"}</h2><div className="form-grid">
          <label>Nama Karyawan<input value={form.employee_name} onChange={e => change("employee_name", e.target.value)} placeholder="Nama karyawan" /></label>
          <label>Prioritas<select value={form.priority} onChange={e => change("priority", e.target.value as Task["priority"])}><option value="normal">Normal</option><option value="penting">Penting</option><option value="mendesak">Mendesak</option></select></label>
          <label>Tanggal Tugas<input type="date" value={form.task_date} onChange={e => change("task_date", e.target.value)} /></label>
          <label>Deadline<input type="date" value={form.due_date} onChange={e => change("due_date", e.target.value)} /></label>
          <label className="full">Uraian Tugas<textarea rows={3} value={form.task_description} onChange={e => change("task_description", e.target.value)} /></label>
          <label className="full">Catatan<textarea rows={2} value={form.notes} onChange={e => change("notes", e.target.value)} /></label>
        </div><label className="cost-check"><input type="checkbox" checked={form.needs_cost} onChange={e => change("needs_cost", e.target.checked)} /> Membutuhkan biaya</label>
        {form.needs_cost && <div className="form-grid cost-grid"><label>Keperluan Biaya<textarea rows={2} value={form.cost_description} onChange={e => change("cost_description", e.target.value)} /></label><label>Nominal<input type="number" value={form.requested_amount} onChange={e => change("requested_amount", e.target.value)} /></label></div>}
        <div className="form-actions"><button className="primary" onClick={save}>Simpan</button><button onClick={reset}>Batal</button></div></section>}

        <section className="panel"><div className="toolbar"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari tugas atau karyawan..." /><select value={filter} onChange={e => setFilter(e.target.value as typeof filter)}><option value="all">Semua</option><option value="pending">Belum Selesai</option><option value="done">Selesai</option></select><button onClick={loadTasks}>Refresh</button></div>
          {loading ? <p>Memuat data...</p> : visibleTasks.length === 0 ? <p className="muted">Belum ada tugas.</p> : <div className="task-list">{visibleTasks.map(task => <article className={`task-card ${task.status === "done" ? "done" : ""}`} key={task.id}>
            <div className="task-main"><input className="task-check" type="checkbox" checked={task.status === "done"} onChange={() => toggle(task)} /><div className="task-content"><strong className="task-title">{task.task_description}</strong><div className="meta">Karyawan: {task.employee_name} · Tanggal: {task.task_date}{task.due_date ? ` · Deadline: ${task.due_date}` : ""}</div><div className={`priority ${task.priority}`}>{task.priority.toUpperCase()}</div>{task.notes && <p className="notes">Catatan: {task.notes}</p>}{task.needs_cost && <div className={`cost-box ${task.cost_status}`}><b>Biaya</b><br />{task.cost_description || "-"}<br />{money(task.requested_amount)}<br /><span>Status: {costLabel(task.cost_status)}</span><div className="cost-actions">{task.cost_status === "pending" && <><button onClick={() => updateCostStatus(task, "approved")}>Setujui</button><button onClick={() => updateCostStatus(task, "rejected")}>Tolak</button></>}{task.cost_status === "approved" && <button onClick={() => updateCostStatus(task, "paid")}>Tandai Sudah Dibayar</button>}</div></div>}</div></div>
            <div className="task-actions"><button onClick={() => edit(task)}>Edit</button>{task.needs_cost && <button onClick={() => whatsapp(task)}>WhatsApp</button>}<button className="danger" onClick={() => remove(task)}>Hapus</button></div>
          </article>)}</div>}
        </section>
      </div>
      <style jsx>{`
        *{box-sizing:border-box}.page{min-height:100vh;background:#f5f7fb;padding:24px;font-family:Arial,sans-serif;color:#172033}.container{max-width:1100px;margin:0 auto}.header{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:22px}.brand{color:#0f766e;font-weight:700;font-size:13px}.header h1{margin:8px 0 4px;font-size:30px}.header p{margin:0;color:#667085}.panel,.stats>div{background:#fff;border:1px solid #eaecf0;border-radius:16px}.panel{padding:20px;margin-bottom:20px}.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:20px}.stats>div{padding:18px}.stats span{display:block;color:#667085;font-size:13px}.stats strong{display:block;font-size:28px;margin-top:8px}.message{background:#fff7ed;border:1px solid #fed7aa;padding:12px;border-radius:10px;margin-bottom:16px}.primary{background:#0f766e!important;color:#fff;border:0!important;font-weight:700}.form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600}.full{grid-column:1/-1}input,select,textarea,button{font:inherit}input,select,textarea{border:1px solid #d0d5dd;border-radius:9px;padding:10px;background:#fff;font-weight:400}button{border:1px solid #d0d5dd;background:#fff;border-radius:9px;padding:9px 13px;cursor:pointer}.cost-check{flex-direction:row;align-items:center;margin-top:16px}.cost-check input{width:18px;height:18px}.cost-grid{margin-top:12px}.form-actions{display:flex;gap:10px;margin-top:18px}.toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px}.toolbar input{flex:1;min-width:180px}.task-list{display:grid;gap:12px}.task-card{border:1px solid #eaecf0;border-radius:13px;padding:16px;background:#fff}.task-card.done{background:#f0fdf4}.task-main{display:grid;grid-template-columns:28px minmax(0,1fr);gap:12px;align-items:start}.task-check{width:20px;height:20px;margin-top:3px}.task-content{min-width:0}.task-title{display:block;font-size:18px;overflow-wrap:anywhere;text-decoration:none}.done .task-title{text-decoration:line-through}.meta,.notes{color:#667085;overflow-wrap:anywhere}.meta{font-size:13px;margin-top:8px}.priority{font-size:12px;font-weight:700;margin-top:9px}.priority.mendesak{color:#b42318}.priority.penting{color:#b54708}.priority.normal{color:#667085}.notes{margin:8px 0 0}.cost-box{margin-top:12px;padding:10px;border-radius:9px;background:#faf5ff;color:#6b21a8;overflow-wrap:anywhere}.cost-box.approved{background:#ecfdf3;color:#067647}.cost-box.rejected{background:#fef3f2;color:#b42318}.cost-box.paid{background:#eff8ff;color:#175cd3}.cost-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.task-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;padding-left:40px}.danger{color:#b42318}.muted{color:#667085}@media(max-width:600px){.page{padding:16px}.panel{padding:14px}.header h1{font-size:28px}.task-title{font-size:17px}.task-actions{padding-left:40px}.toolbar select,.toolbar button{flex:1}.toolbar input{min-width:100%}}
      `}</style>
    </main>
  );
}
