import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Play, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuickJobForm from "@/components/QuickJobForm";

export default function QuickJobsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [spools, setSpools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list | new | edit
  const [editingJob, setEditingJob] = useState(null);
  const [running, setRunning] = useState(null); // job id being run
  const [runResult, setRunResult] = useState(null); // { success, message }

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [j, s] = await Promise.all([
      base44.entities.QuickJob.list("-created_date", 100),
      base44.entities.Spool.filter({ is_empty: false }, "-updated_date", 200),
    ]);
    setJobs(j);
    setSpools(s);
    setLoading(false);
  };

  const handleRun = async (job) => {
    setRunning(job.id);
    setRunResult(null);
    try {
      // Fetch fresh spool weights
      const spoolIds = job.usages.map(u => u.spool_id);
      const freshSpools = await Promise.all(spoolIds.map(id => base44.entities.Spool.get(id)));
      const spoolMap = Object.fromEntries(freshSpools.map(s => [s.id, s]));

      // Check enough filament
      const shortages = job.usages.filter(u => {
        const s = spoolMap[u.spool_id];
        return !s || s.current_weight_grams < u.grams;
      });

      if (shortages.length > 0) {
        const names = shortages.map(u => u.spool_label || u.spool_id).join(", ");
        setRunResult({ success: false, message: `Not enough filament on: ${names}` });
        setRunning(null);
        return;
      }

      // Deduct all at once
      await Promise.all(
        job.usages.map(u => {
          const s = spoolMap[u.spool_id];
          const newWeight = Math.max(0, s.current_weight_grams - u.grams);
          return Promise.all([
            base44.entities.Spool.update(u.spool_id, {
              current_weight_grams: newWeight,
              is_empty: newWeight <= 0,
            }),
            base44.entities.UsageLog.create({
              spool_id: u.spool_id,
              grams_used: u.grams,
              job_name: job.name,
              weight_before: s.current_weight_grams,
              weight_after: newWeight,
            }),
          ]);
        })
      );

      setRunResult({ success: true, message: `"${job.name}" logged! All spools updated.` });
      loadAll();
    } catch (err) {
      setRunResult({ success: false, message: "Something went wrong. Try again." });
    } finally {
      setRunning(null);
    }
  };

  const handleDelete = async (job) => {
    if (!confirm(`Delete "${job.name}"?`)) return;
    await base44.entities.QuickJob.delete(job.id);
    loadAll();
  };

  const handleSave = async (data) => {
    if (editingJob) {
      await base44.entities.QuickJob.update(editingJob.id, data);
    } else {
      await base44.entities.QuickJob.create(data);
    }
    setView("list");
    setEditingJob(null);
    loadAll();
  };

  if (view === "new" || view === "edit") {
    return (
      <QuickJobForm
        spools={spools}
        initialData={editingJob}
        onSave={handleSave}
        onCancel={() => { setView("list"); setEditingJob(null); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-full active:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-foreground">Quick Jobs</span>
        </div>
        <Button onClick={() => { setEditingJob(null); setView("new"); }} className="h-9 bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-1" /> New Job
        </Button>
      </div>

      <div className="p-4 space-y-3 pb-8">
        {runResult && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium ${runResult.success ? "bg-green-950/50 border border-green-800/50 text-green-300" : "bg-red-950/50 border border-red-800/50 text-red-300"}`}>
            {runResult.message}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-medium">No quick jobs yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create a job to one-tap log filament usage</p>
          </div>
        ) : (
          jobs.map(job => (
            <div key={job.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-base">{job.name}</p>
                  {job.description && <p className="text-xs text-muted-foreground mt-0.5">{job.description}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setEditingJob(job); setView("edit"); }} className="p-2 rounded-full active:bg-muted">
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(job)} className="p-2 rounded-full active:bg-muted">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              {/* Spool usages */}
              <div className="space-y-1.5 mb-4">
                {(job.usages || []).map((u, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 border border-white/10" style={{ backgroundColor: u.spool_color_hex || "#888" }} />
                    <span className="text-sm text-muted-foreground flex-1 truncate">{u.spool_label}</span>
                    <span className="text-sm font-semibold text-foreground">{u.grams}g</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handleRun(job)}
                disabled={running === job.id}
                className="w-full h-12 bg-primary text-primary-foreground font-semibold text-base"
              >
                {running === job.id ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" /> Running…</span>
                ) : (
                  <span className="flex items-center gap-2"><Play className="w-4 h-4" /> Run Job</span>
                )}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}