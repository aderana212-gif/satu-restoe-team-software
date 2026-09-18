"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
  cost_status: "none" | "pending" | "approved" | "rejected" | "paid";
  cost_notes?: string | null;
};

const emptyForm = {
  employee_name: "",
  task_date: new Date().toISOString().slice(0, 10),
  due_date: "",
  task_description: "",
  notes: "",
  priority: "normal" as Task["priority"],
  needs_cost: false,
  cost_description: "",
  requested_amount: "",
};

const money = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const costStatusLabel = (status: Task["cost_status"]) => {
  if (status === "pending") return "Menunggu Persetujuan";
  if (status === "approved") return "Disetujui";
  if (status === "rejected") return "Ditolak";
  if (status === "paid") return "Sudah Dibayar";
  return "Tidak Ada Biaya";
};

export default function TugasKaryawanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadTasks() {
    setLoading(true);
    const { data, error } = await supabase
      .from("employee_tasks")
      .select("*")
      .order("task_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) setMessage(`Gagal memuat: ${error.message}`);
    else setTasks((data || []) as Task[]);
    setLoading(false);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const visibleTasks = tasks.filter((task) => {
    const q = search.toLowerCase();
    return (
      (filter === "all" || task.status === filter) &&
      (!q ||
        task.employee_name.toLowerCase().includes(q) ||
        task.task_description.toLowerCase().includes(q))
    );
  });

  function change<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((old) => ({ ...old, [key]: value }));
  }

  function reset() {
    setForm({ ...emptyForm, task_date: new Date().toISOString().slice(0, 10) });
    setEditingId(null);
    setShowForm(false);
  }

  async function save() {
    setMessage("");

    if (!form.employee_name.trim() || !form.task_description.trim()) {
      setMessage("Nama karyawan dan uraian tugas wajib diisi.");
      return;
    }

    if (form.needs_cost && !form.cost_description.trim()) {
      setMessage("Keterangan biaya wajib diisi.");
      return;
    }

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

    const result = editingId
      ? await supabase.from("employee_tasks").update(payload).eq("id", editingId)
      : await supabase.from("employee_tasks").insert(payload);

    if (result.error) {
      setMessage(`Gagal menyimpan: ${result.error.message}`);
    } else {
      setMessage(editingId ? "Tugas diperbarui." : "Tugas ditambahkan.");
      reset();
      loadTasks();
    }
  }

  async function toggle(task: Task) {
    const { error } = await supabase
      .from("employee_tasks")
      .update({ status: task.status === "done" ? "pending" : "done" })
      .eq("id", task.id);

    if (error) setMessage(error.message);
    else loadTasks();
  }

  async function updateCostStatus(
    task: Task,
    nextStatus: "approved" | "rejected" | "paid"
  ) {
    const labels = {
      approved: "menyetujui biaya ini",
      rejected: "menolak biaya ini",
      paid: "menandai biaya ini sudah dibayar",
    };

    if (!confirm(`Yakin ingin ${labels[nextStatus]}?`)) return;

    const { error } = await supabase
      .from("employee_tasks")
      .update({
        cost_status: nextStatus,
        cost_approved_at: nextStatus === "approved" ? new Date().toISOString() : undefined,
      })
      .eq("id", task.id);

    if (error) setMessage(`Gagal mengubah status biaya: ${error.message}`);
    else {
      setMessage(`Status biaya berhasil diubah menjadi ${costStatusLabel(nextStatus)}.`);
      loadTasks();
    }
  }

  async function remove(task: Task) {
    if (!confirm("Hapus tugas ini?")) return;

    const { error } = await supabase
      .from("employee_tasks")
      .delete()
      .eq("id", task.id);

    if (error) setMessage(error.message);
    else loadTasks();
  }

  function edit(task: Task) {
    setEditingId(task.id);
    setForm({
      employee_name: task.employee_name,
      task_date: task.task_date,
      due_date: task.due_date || "",
      task_description: task.task_description,
      notes: task.notes || "",
      priority: task.priority,
      needs_cost: task.needs_cost,
      cost_description: task.cost_description || "",
      requested_amount: task.requested_amount ? String(task.requested_amount) : "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function whatsapp(task: Task) {
    const text = `PERMOHONAN BIAYA TUGAS KARYAWAN\n\nKaryawan: ${task.employee_name}\nTugas: ${task.task_description}\nKeperluan: ${task.cost_description || "-"}\nNominal: ${money(task.requested_amount)}\nStatus: ${costStatusLabel(task.cost_status)}\n\nMohon persetujuan biaya.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: 24,
        fontFamily: "Arial, sans-serif",
        color: "#172033",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 22,
          }}
        >
          <div>
            <div style={{ color: "#0f766e", fontWeight: 700, fontSize: 13 }}>
              SATU RESTOE TEAM SOFTWARE
            </div>
            <h1 style={{ margin: "8px 0 4px", fontSize: 30 }}>Tugas Karyawan</h1>
            <p style={{ margin: 0, color: "#667085" }}>
              Checklist pekerjaan dan permohonan biaya.
            </p>
          </div>
          <button
            onClick={() => {
              if (showForm) reset();
              else setShowForm(true);
            }}
            style={{
              background: "#0f766e",
              color: "white",
              border: 0,
              borderRadius: 10,
              padding: "12px 18px",
              fontWeight: 700,
            }}
          >
            {showForm ? "Tutup Form" : "+ Tambah Tugas"}
          </button>
        </div>

        {message && (
          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              padding: 12,
              borderRadius: 10,
              marginBottom: 16,
            }}
          >
            {message}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 14,
            marginBottom: 20,
          }}
        >
          {[
            { label: "Total", value: tasks.length },
            { label: "Belum Selesai", value: tasks.filter((t) => t.status === "pending").length },
            { label: "Selesai", value: tasks.filter((t) => t.status === "done").length },
            {
              label: "Biaya Menunggu",
              value: tasks.filter((t) => t.needs_cost && t.cost_status === "pending").length,
            },
          ].map((x) => (
            <div
              key={x.label}
              style={{
                background: "white",
                border: "1px solid #eaecf0",
                borderRadius: 14,
                padding: 18,
              }}
            >
              <div style={{ color: "#667085", fontSize: 13 }}>{x.label}</div>
              <strong style={{ display: "block", fontSize: 26, marginTop: 8 }}>
                {x.value}
              </strong>
            </div>
          ))}
        </div>

        {showForm && (
          <section
            style={{
              background: "white",
              border: "1px solid #eaecf0",
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <h2 style={{ marginTop: 0 }}>{editingId ? "Edit Tugas" : "Tambah Tugas Baru"}</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                gap: 14,
              }}
            >
              <label>
                Nama Karyawan
                <input
                  value={form.employee_name}
                  onChange={(e) => change("employee_name", e.target.value)}
                  placeholder="Nama karyawan"
                />
              </label>
              <label>
                Prioritas
                <select
                  value={form.priority}
                  onChange={(e) => change("priority", e.target.value as Task["priority"])}
                >
                  <option value="normal">Normal</option>
                  <option value="penting">Penting</option>
                  <option value="mendesak">Mendesak</option>
                </select>
              </label>
              <label>
                Tanggal Tugas
                <input
                  type="date"
                  value={form.task_date}
                  onChange={(e) => change("task_date", e.target.value)}
                />
              </label>
              <label>
                Deadline
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => change("due_date", e.target.value)}
                />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                Uraian Tugas
                <textarea
                  rows={3}
                  value={form.task_description}
                  onChange={(e) => change("task_description", e.target.value)}
                  placeholder="Uraian pekerjaan"
                />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                Catatan
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => change("notes", e.target.value)}
                />
              </label>
            </div>

            <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 16 }}>
              <input
                type="checkbox"
                checked={form.needs_cost}
                onChange={(e) => change("needs_cost", e.target.checked)}
              />
              Membutuhkan biaya
            </label>

            {form.needs_cost && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                  gap: 14,
                  marginTop: 12,
                }}
              >
                <label>
                  Keperluan Biaya
                  <textarea
                    rows={2}
                    value={form.cost_description}
                    onChange={(e) => change("cost_description", e.target.value)}
                  />
                </label>
                <label>
                  Nominal
                  <input
                    type="number"
                    value={form.requested_amount}
                    onChange={(e) => change("requested_amount", e.target.value)}
                    placeholder="100000"
                  />
                </label>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button
                onClick={save}
                style={{
                  background: "#0f766e",
                  color: "white",
                  border: 0,
                  borderRadius: 9,
                  padding: "10px 16px",
                  fontWeight: 700,
                }}
              >
                Simpan
              </button>
              <button
                onClick={reset}
                style={{
                  border: "1px solid #d0d5dd",
                  background: "white",
                  borderRadius: 9,
                  padding: "10px 16px",
                }}
              >
                Batal
              </button>
            </div>
          </section>
        )}

        <section
          style={{
            background: "white",
            border: "1px solid #eaecf0",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
            <input
              style={{ flex: 1, minWidth: 220 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tugas atau karyawan..."
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
            >
              <option value="all">Semua</option>
              <option value="pending">Belum Selesai</option>
              <option value="done">Selesai</option>
            </select>
            <button
              onClick={loadTasks}
              style={{
                border: "1px solid #d0d5dd",
                background: "white",
                borderRadius: 9,
                padding: "8px 14px",
              }}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p>Memuat data...</p>
          ) : visibleTasks.length === 0 ? (
            <p style={{ color: "#667085" }}>Belum ada tugas.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {visibleTasks.map((task) => (
                <article
                  key={task.id}
                  style={{
                    border: "1px solid #eaecf0",
                    borderRadius: 13,
                    padding: 16,
                    background: task.status === "done" ? "#f0fdf4" : "white",
                  }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <input
                      type="checkbox"
                      checked={task.status === "done"}
                      onChange={() => toggle(task)}
                      style={{ width: 20, height: 20 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong
                        style={{
                          textDecoration: task.status === "done" ? "line-through" : "none",
                        }}
                      >
                        {task.task_description}
                      </strong>
                      <div style={{ color: "#667085", fontSize: 13, marginTop: 7 }}>
                        Karyawan: {task.employee_name} · Tanggal: {task.task_date}
                        {task.due_date ? ` · Deadline: ${task.due_date}` : ""}
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          color:
                            task.priority === "mendesak"
                              ? "#b42318"
                              : task.priority === "penting"
                              ? "#b54708"
                              : "#667085",
                        }}
                      >
                        {task.priority.toUpperCase()}
                      </div>
                      {task.notes && (
                        <p style={{ margin: "8px 0 0", color: "#475467" }}>
                          Catatan: {task.notes}
                        </p>
                      )}

                      {task.needs_cost && (
                        <div
                          style={{
                            marginTop: 10,
                            padding: 12,
                            borderRadius: 9,
                            background: "#faf5ff",
                            color: "#6b21a8",
                          }}
                        >
                          <div>
                            <strong>Pengajuan Biaya</strong>
                          </div>
                          <div style={{ marginTop: 5 }}>
                            Keperluan: {task.cost_description || "-"}
                          </div>
                          <div>Nominal: {money(task.requested_amount)}</div>
                          <div style={{ marginTop: 5, fontWeight: 700 }}>
                            Status: {costStatusLabel(task.cost_status)}
                          </div>
                          {task.cost_notes && <div>Catatan: {task.cost_notes}</div>}

                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                              marginTop: 10,
                            }}
                          >
                            {task.cost_status === "pending" && (
                              <>
                                <button
                                  onClick={() => updateCostStatus(task, "approved")}
                                  style={{
                                    background: "#16a34a",
                                    color: "white",
                                    border: 0,
                                    borderRadius: 8,
                                    padding: "8px 11px",
                                    fontWeight: 700,
                                  }}
                                >
                                  Setujui
                                </button>
                                <button
                                  onClick={() => updateCostStatus(task, "rejected")}
                                  style={{
                                    background: "#dc2626",
                                    color: "white",
                                    border: 0,
                                    borderRadius: 8,
                                    padding: "8px 11px",
                                    fontWeight: 700,
                                  }}
                                >
                                  Tolak
                                </button>
                              </>
                            )}
                            {task.cost_status === "approved" && (
                              <button
                                onClick={() => updateCostStatus(task, "paid")}
                                style={{
                                  background: "#2563eb",
                                  color: "white",
                                  border: 0,
                                  borderRadius: 8,
                                  padding: "8px 11px",
                                  fontWeight: 700,
                                }}
                              >
                                Tandai Sudah Dibayar
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                      <button onClick={() => edit(task)}>Edit</button>
                      {task.needs_cost && (
                        <button onClick={() => whatsapp(task)}>WhatsApp</button>
                      )}
                      <button onClick={() => remove(task)} style={{ color: "#b42318" }}>
                        Hapus
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <style jsx>{`
        label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
        }
        input,
        select,
        textarea {
          font: inherit;
          font-weight: 400;
          border: 1px solid #d0d5dd;
          border-radius: 9px;
          padding: 10px;
          background: white;
        }
        button {
          font: inherit;
          border: 1px solid #d0d5dd;
          background: white;
          border-radius: 8px;
          padding: 7px 10px;
          cursor: pointer;
        }
      `}</style>
    </main>
  );
}
