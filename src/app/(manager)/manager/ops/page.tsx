"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Clock, Settings } from "lucide-react";
import { ManagerHeader } from "@/components/innara/ManagerHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import { EmptyState } from "@/components/innara/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  getSlaConfigs,
  updateSlaConfig,
  type SlaConfig,
} from "@/app/actions/branding";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_LABELS, PRIORITY_CONFIG } from "@/constants/app";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTargetColor(minutes: number): string {
  if (minutes < 30) return "text-emerald-400";
  if (minutes <= 60) return "text-amber-400";
  return "text-red-400";
}

// ---------------------------------------------------------------------------
// Skeleton row
// ---------------------------------------------------------------------------

function SkeletonRow(): React.ReactElement {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline editable minutes cell
// ---------------------------------------------------------------------------

interface EditableCellProps {
  config: SlaConfig;
  editingId: string | null;
  editValue: string;
  savingId: string | null;
  onStartEdit: (config: SlaConfig) => void;
  onEditChange: (value: string) => void;
  onCommit: (config: SlaConfig) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, config: SlaConfig) => void;
}

function EditableCell({
  config,
  editingId,
  editValue,
  savingId,
  onStartEdit,
  onEditChange,
  onCommit,
  onKeyDown,
}: EditableCellProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId === config.id) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingId, config.id]);

  const isSaving = savingId === config.id;
  const isEditing = editingId === config.id;

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          type="number"
          min={1}
          max={10080}
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={() => onCommit(config)}
          onKeyDown={(e) => onKeyDown(e, config)}
          className="w-24 h-8 text-sm text-center bg-white/10 border-white/20 focus:border-[#9B7340]"
          aria-label={`Target minutes for ${config.category} ${config.priority}`}
        />
        <span className="text-xs text-muted-foreground">min</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => onStartEdit(config)}
      disabled={isSaving}
      className="flex items-center gap-2 group rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B7340] focus-visible:ring-offset-1"
      aria-label={`Edit target minutes for ${config.category} ${config.priority}: currently ${config.targetMinutes} minutes`}
    >
      {isSaving ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9B7340]" />
      ) : (
        <Clock className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      <span
        className={`text-sm font-semibold tabular-nums ${getTargetColor(config.targetMinutes)}`}
      >
        {config.targetMinutes}
        <span className="text-xs font-normal text-muted-foreground ml-1">min</span>
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// SLA Config Row
// ---------------------------------------------------------------------------

interface SlaConfigRowProps {
  config: SlaConfig;
  editingId: string | null;
  editValue: string;
  savingId: string | null;
  onStartEdit: (config: SlaConfig) => void;
  onEditChange: (value: string) => void;
  onCommit: (config: SlaConfig) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, config: SlaConfig) => void;
}

function SlaConfigRow({
  config,
  editingId,
  editValue,
  savingId,
  onStartEdit,
  onEditChange,
  onCommit,
  onKeyDown,
}: SlaConfigRowProps): React.ReactElement {
  const priorityConfig = PRIORITY_CONFIG[config.priority as keyof typeof PRIORITY_CONFIG];
  const priorityLabel = priorityConfig?.label ?? config.priority;
  const priorityTextClass = priorityConfig?.textClass ?? "text-muted-foreground";
  const priorityBgClass = priorityConfig?.bgClass ?? "bg-muted";

  return (
    <div
      className="flex items-center justify-between px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
      role="row"
    >
      <div className="flex items-center gap-3" role="cell">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityBgClass} ${priorityTextClass}`}
        >
          {priorityLabel}
        </span>
      </div>

      <div role="cell">
        <EditableCell
          config={config}
          editingId={editingId}
          editValue={editValue}
          savingId={savingId}
          onStartEdit={onStartEdit}
          onEditChange={onEditChange}
          onCommit={onCommit}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category Section
// ---------------------------------------------------------------------------

interface CategorySectionProps {
  category: string;
  configs: SlaConfig[];
  editingId: string | null;
  editValue: string;
  savingId: string | null;
  onStartEdit: (config: SlaConfig) => void;
  onEditChange: (value: string) => void;
  onCommit: (config: SlaConfig) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, config: SlaConfig) => void;
}

function CategorySection({
  category,
  configs,
  editingId,
  editValue,
  savingId,
  onStartEdit,
  onEditChange,
  onCommit,
  onKeyDown,
}: CategorySectionProps): React.ReactElement {
  const categoryLabel =
    CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category;

  return (
    <section aria-labelledby={`category-${category}`} className="mb-6">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <h2
          id={`category-${category}`}
          className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        >
          {categoryLabel}
        </h2>
        <div className="flex-1 h-px bg-white/5" />
        <span className="text-xs text-muted-foreground">{configs.length} rules</span>
      </div>

      {/* Rows */}
      <div
        className="glass-card-dark rounded-2xl overflow-hidden"
        role="table"
        aria-label={`${categoryLabel} SLA rules`}
      >
        {/* Table header */}
        <div
          className="flex items-center justify-between px-5 py-2.5 bg-white/[0.03] border-b border-white/5"
          role="row"
        >
          <span className="text-xs font-medium text-muted-foreground" role="columnheader">
            Priority
          </span>
          <span className="text-xs font-medium text-muted-foreground" role="columnheader">
            Target Response
          </span>
        </div>

        {configs.map((config) => (
          <SlaConfigRow
            key={config.id}
            config={config}
            editingId={editingId}
            editValue={editValue}
            savingId={savingId}
            onStartEdit={onStartEdit}
            onEditChange={onEditChange}
            onCommit={onCommit}
            onKeyDown={onKeyDown}
          />
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ManagerOpsPage(): React.ReactElement {
  const router = useRouter();
  const [configs, setConfigs] = useState<SlaConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getSlaConfigs();
    if (!result.success || !result.data) {
      setError(result.error ?? "Failed to load SLA configurations.");
      setLoading(false);
      return;
    }
    setConfigs(result.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadConfigs();
  }, [loadConfigs]);

  // ---------------------------------------------------------------------------
  // Sign out
  // ---------------------------------------------------------------------------

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/staff/login");
  };

  // ---------------------------------------------------------------------------
  // Inline editing handlers
  // ---------------------------------------------------------------------------

  const startEdit = (config: SlaConfig) => {
    setEditingId(config.id);
    setEditValue(String(config.targetMinutes));
  };

  const commitEdit = useCallback(
    async (config: SlaConfig) => {
      const newMinutes = parseInt(editValue, 10);

      if (isNaN(newMinutes) || newMinutes <= 0) {
        toast.error("Target must be a positive number");
        setEditingId(null);
        return;
      }

      if (newMinutes === config.targetMinutes) {
        setEditingId(null);
        return;
      }

      setEditingId(null);
      setSavingId(config.id);

      const result = await updateSlaConfig({
        category: config.category as Parameters<typeof updateSlaConfig>[0]["category"],
        priority: config.priority as Parameters<typeof updateSlaConfig>[0]["priority"],
        targetMinutes: newMinutes,
      });

      if (result.success && result.data) {
        // Update local state with the returned row
        setConfigs((prev) =>
          prev.map((c) =>
            c.id === config.id
              ? { ...c, targetMinutes: result.data!.targetMinutes, id: result.data!.id }
              : c,
          ),
        );
        toast.success("SLA rule updated");
      } else {
        toast.error(result.error ?? "Failed to update SLA rule");
      }

      setSavingId(null);
    },
    [editValue],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, config: SlaConfig) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void commitEdit(config);
      }
      if (e.key === "Escape") {
        setEditingId(null);
      }
    },
    [commitEdit],
  );

  // ---------------------------------------------------------------------------
  // Group configs by category
  // ---------------------------------------------------------------------------

  const grouped = configs.reduce<Record<string, SlaConfig[]>>((acc, config) => {
    const key = config.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(config);
    return acc;
  }, {});

  // Preserve the canonical category order from CATEGORY_LABELS
  const orderedCategories = Object.keys(CATEGORY_LABELS).filter(
    (cat) => grouped[cat]?.length > 0,
  );
  // Append any categories not in CATEGORY_LABELS (future-proofing)
  const allCategories = [
    ...orderedCategories,
    ...Object.keys(grouped).filter((cat) => !orderedCategories.includes(cat)),
  ];

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <>
        <ManagerHeader onSignOut={() => void handleSignOut()} />
        <PageContainer>
          <PageHeader
            title="Operations"
            subtitle="SLA configuration per category and priority"
            action={
              <Button variant="ghost" size="icon" disabled aria-label="Refresh">
                <RefreshCw className="w-4 h-4" />
              </Button>
            }
          />
          {/* Skeleton sections */}
          {Array.from({ length: 3 }).map((_, sectionIdx) => (
            <div key={sectionIdx} className="mb-6">
              <div className="flex items-center gap-2 mb-2 px-1">
                <Skeleton className="h-3 w-24" />
                <div className="flex-1 h-px bg-white/5" />
              </div>
              <div className="glass-card-dark rounded-2xl overflow-hidden">
                <div className="px-5 py-2.5 bg-white/[0.03] border-b border-white/5 flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
                {Array.from({ length: 4 }).map((_, rowIdx) => (
                  <SkeletonRow key={rowIdx} />
                ))}
              </div>
            </div>
          ))}
        </PageContainer>
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------

  if (error) {
    return (
      <>
        <ManagerHeader onSignOut={() => void handleSignOut()} />
        <PageContainer>
          <PageHeader
            title="Operations"
            subtitle="SLA configuration per category and priority"
          />
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <div className="glass-card-dark p-8 rounded-2xl text-center max-w-md">
              <Settings className="w-10 h-10 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-base font-medium mb-2">Unable to load SLA configurations</p>
              <p className="text-sm text-muted-foreground mb-6">{error}</p>
              <Button
                onClick={() => void loadConfigs()}
                className="bg-[#9B7340] hover:bg-[#b8924f] text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <ManagerHeader onSignOut={() => void handleSignOut()} />

      <PageContainer>
        <PageHeader
          title="Operations"
          subtitle="SLA configuration per category and priority"
          action={
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void loadConfigs()}
              aria-label="Refresh SLA configurations"
              className="hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </Button>
          }
        />

        {/* Empty state */}
        {configs.length === 0 && (
          <div className="glass-card-dark rounded-2xl">
            <EmptyState
              icon={Clock}
              title="No SLA rules configured yet"
              description="SLA rules define the target response time for each category and priority combination."
              size="lg"
            />
          </div>
        )}

        {/* Category sections */}
        {allCategories.map((category) => (
          <CategorySection
            key={category}
            category={category}
            configs={grouped[category]}
            editingId={editingId}
            editValue={editValue}
            savingId={savingId}
            onStartEdit={startEdit}
            onEditChange={setEditValue}
            onCommit={(config) => void commitEdit(config)}
            onKeyDown={handleKeyDown}
          />
        ))}

        {/* Legend */}
        {configs.length > 0 && (
          <div className="mt-2 flex items-center gap-5 px-1">
            <p className="text-xs text-muted-foreground">Response time color coding:</p>
            <span className="text-xs text-emerald-400 font-medium">Under 30 min</span>
            <span className="text-xs text-amber-400 font-medium">30–60 min</span>
            <span className="text-xs text-red-400 font-medium">Over 60 min</span>
          </div>
        )}
      </PageContainer>
    </>
  );
}
