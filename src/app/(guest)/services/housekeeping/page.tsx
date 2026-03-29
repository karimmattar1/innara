"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bed,
  Sparkles,
  RefreshCw,
  Wind,
  Coffee,
  ShoppingBag,
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

interface HousekeepingItem {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

const HOUSEKEEPING_ITEMS: HousekeepingItem[] = [
  {
    id: "extra_towels",
    label: "Extra Towels",
    icon: Bed,
    description: "Bath, hand, or pool towels",
  },
  {
    id: "room_cleaning",
    label: "Room Cleaning",
    icon: Sparkles,
    description: "Full room service",
  },
  {
    id: "fresh_linens",
    label: "Fresh Linens",
    icon: RefreshCw,
    description: "Bed sheets & pillowcases",
  },
  {
    id: "pillow_menu",
    label: "Pillow Menu",
    icon: Wind,
    description: "Choose your pillow type",
  },
  {
    id: "toiletries",
    label: "Toiletries",
    icon: Coffee,
    description: "Shampoo, soap & amenities",
  },
  {
    id: "minibar_restock",
    label: "Mini Bar Restock",
    icon: ShoppingBag,
    description: "Snacks, drinks & more",
  },
];

const ITEM_LABELS: Record<string, string> = {
  extra_towels: "Extra Towels",
  room_cleaning: "Room Cleaning",
  fresh_linens: "Fresh Linens",
  pillow_menu: "Pillow Menu",
  toiletries: "Toiletries",
  minibar_restock: "Mini Bar Restock",
};

export default function HousekeepingPage(): React.ReactElement {
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
      setError("Please select a housekeeping item.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await createRequest({
        category: "housekeeping",
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
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-[#1a1d3a] mb-2">
              Request Submitted
            </h2>
            <p className="text-sm text-muted-foreground">
              Your housekeeping request has been received. We&apos;ll be right
              with you.
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

      <SectionHeader title="Housekeeping" />

      <p className="text-sm text-muted-foreground -mt-2 mb-4">
        Select what you need and we&apos;ll take care of it.
      </p>

      {/* Item grid */}
      <div className="grid grid-cols-2 gap-3">
        {HOUSEKEEPING_ITEMS.map((item) => (
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

      {/* Details section — shown after selection */}
      {selectedItem !== null && (
        <div className="glass-card p-4 space-y-4">
          <h3 className="font-medium text-sm text-[#1a1d3a]">
            Add Details{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </h3>

          <div className="space-y-1.5">
            <label
              htmlFor="hk-description"
              className="text-xs font-medium text-foreground/70"
            >
              Special instructions
            </label>
            <Textarea
              id="hk-description"
              placeholder="Any specific requests or notes for our team..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none text-sm"
              maxLength={500}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="hk-priority"
              className="text-xs font-medium text-foreground/70"
            >
              How urgent is this?
            </label>
            <Select
              value={priority}
              onValueChange={(val) => setPriority(val as RequestPriority)}
            >
              <SelectTrigger id="hk-priority" className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low — whenever you get a chance</SelectItem>
                <SelectItem value="medium">Medium — within the hour</SelectItem>
                <SelectItem value="high">High — soon please</SelectItem>
                <SelectItem value="urgent">Urgent — as soon as possible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Photo upload placeholder */}
          <div className="border border-dashed border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Photo upload coming soon
            </p>
          </div>
        </div>
      )}

      {/* Error */}
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

      {/* Submit */}
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
