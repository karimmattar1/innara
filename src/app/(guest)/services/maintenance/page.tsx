"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Thermometer,
  Droplets,
  Zap,
  Lock,
  Wifi,
  Tv,
  Wrench,
  AlertCircle,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";
import { GuestPageShell } from "@/components/innara/GuestPageShell";
import { ServiceOptionCard } from "@/components/innara/ServiceOptionCard";
import { SectionHeader } from "@/components/innara/SectionHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRequest } from "@/app/actions/requests";
import type { RequestPriority } from "@/constants/app";

interface MaintenanceItem {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

const MAINTENANCE_ITEMS: MaintenanceItem[] = [
  {
    id: "ac_heating",
    label: "AC / Heating",
    icon: Thermometer,
    description: "Temperature control",
  },
  {
    id: "plumbing",
    label: "Plumbing",
    icon: Droplets,
    description: "Sink, shower, toilet",
  },
  {
    id: "electrical",
    label: "Electrical",
    icon: Zap,
    description: "Lights or outlets",
  },
  {
    id: "door_lock",
    label: "Door / Lock",
    icon: Lock,
    description: "Key card or door issue",
  },
  {
    id: "wifi",
    label: "WiFi",
    icon: Wifi,
    description: "Internet connectivity",
  },
  {
    id: "tv_electronics",
    label: "TV / Electronics",
    icon: Tv,
    description: "TV, remote & devices",
  },
  {
    id: "other",
    label: "Other",
    icon: Wrench,
    description: "Something else",
  },
];

const ITEM_LABELS: Record<string, string> = {
  ac_heating: "AC / Heating",
  plumbing: "Plumbing",
  electrical: "Electrical",
  door_lock: "Door / Lock",
  wifi: "WiFi",
  tv_electronics: "TV / Electronics",
  other: "Other",
};

export default function MaintenancePage(): React.ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<RequestPriority>("medium");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleItemSelect(id: string): void {
    setSelectedItem((prev) => (prev === id ? null : id));
    setError(null);
  }

  function handleSubmit(): void {
    if (!selectedItem) {
      setError("Please select the type of issue.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await createRequest({
        category: "maintenance",
        item: ITEM_LABELS[selectedItem] ?? selectedItem,
        description,
        priority,
        roomNumber: "N/A",
      });

      if (!result.success) {
        setError(result.error ?? "An error occurred");
        return;
      }

      setSubmitted(true);
      setTimeout(() => {
        router.push("/guest/requests");
      }, 1200);
    });
  }

  if (submitted) {
    return (
      <GuestPageShell>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="glass-card p-8 max-w-sm w-full">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-[#1a1d3a] mb-2">
              Request Submitted
            </h2>
            <p className="text-sm text-muted-foreground">
              Our maintenance team has been notified and will be with you
              shortly.
            </p>
          </div>
        </div>
      </GuestPageShell>
    );
  }

  return (
    <GuestPageShell>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2 -ml-1 hover:text-foreground transition-colors"
        aria-label="Go back"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      <SectionHeader title="Maintenance" />

      <p className="text-sm text-muted-foreground -mt-2 mb-4">
        Tell us what needs fixing and we&apos;ll send someone right away.
      </p>

      {/* Item grid */}
      <div className="grid grid-cols-2 gap-3">
        {MAINTENANCE_ITEMS.map((item) => (
          <ServiceOptionCard
            key={item.id}
            icon={item.icon}
            title={item.label}
            description={item.description}
            selected={selectedItem === item.id}
            onClick={() => handleItemSelect(item.id)}
          />
        ))}
      </div>

      {/* Details section */}
      {selectedItem !== null && (
        <div className="glass-card p-4 space-y-4">
          <h3 className="font-medium text-sm text-[#1a1d3a]">
            Describe the issue{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </h3>

          <div className="space-y-1.5">
            <label
              htmlFor="mt-description"
              className="text-xs font-medium text-foreground/70"
            >
              Details
            </label>
            <Textarea
              id="mt-description"
              placeholder="Describe the problem so we can bring the right tools..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none text-sm"
              maxLength={500}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="mt-priority"
              className="text-xs font-medium text-foreground/70"
            >
              How urgent is this?
            </label>
            <Select
              value={priority}
              onValueChange={(val) => setPriority(val as RequestPriority)}
            >
              <SelectTrigger id="mt-priority" className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low — not urgent</SelectItem>
                <SelectItem value="medium">Medium — within the hour</SelectItem>
                <SelectItem value="high">High — affecting my stay</SelectItem>
                <SelectItem value="urgent">Urgent — safety concern</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border border-dashed border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Photo upload coming soon
            </p>
          </div>
        </div>
      )}

      {error !== null && (
        <div
          className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2.5"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isPending || selectedItem === null}
        className="w-full"
        style={{ backgroundColor: "var(--color-navy)", color: "#fff" }}
        aria-busy={isPending}
      >
        {isPending ? "Submitting..." : "Submit Request"}
      </Button>
    </GuestPageShell>
  );
}
