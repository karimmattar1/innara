"use client";

import { use, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Flower2,
  Phone,
  Car,
  HandHeart,
  Zap as FacialIcon,
  Wind,
  Waves,
  Utensils,
  MapPin,
  Ticket,
  Navigation,
  Bell,
  CarFront,
  PlaneTakeoff,
  Sparkles,
  Droplets,
  ParkingCircle,
  AlertCircle,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";
import { notFound } from "next/navigation";
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
import type { RequestCategory, RequestPriority } from "@/constants/app";

interface ServiceItem {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

interface SlugConfig {
  title: string;
  subtitle: string;
  category: RequestCategory;
  items: ServiceItem[];
  successIcon: LucideIcon;
  successText: string;
}

const SLUG_CONFIGS: Record<string, SlugConfig> = {
  spa: {
    title: "Spa & Wellness",
    subtitle: "Book a treatment or reserve your spot.",
    category: "spa",
    items: [
      {
        id: "massage",
        label: "Massage",
        icon: HandHeart,
        description: "Relaxation or deep tissue",
      },
      {
        id: "facial",
        label: "Facial",
        icon: FacialIcon,
        description: "Rejuvenating skin care",
      },
      {
        id: "body_treatment",
        label: "Body Treatment",
        icon: Droplets,
        description: "Wraps & exfoliation",
      },
      {
        id: "sauna",
        label: "Sauna",
        icon: Wind,
        description: "Steam & dry sauna",
      },
      {
        id: "pool",
        label: "Pool",
        icon: Waves,
        description: "Reserve pool access",
      },
    ],
    successIcon: Flower2,
    successText: "Your spa request has been received. We will be in touch to confirm your booking.",
  },
  concierge: {
    title: "Concierge",
    subtitle: "Let us arrange everything for you.",
    category: "concierge",
    items: [
      {
        id: "restaurant_reservation",
        label: "Restaurant Reservation",
        icon: Utensils,
        description: "Dining recommendations",
      },
      {
        id: "local_directions",
        label: "Local Directions",
        icon: MapPin,
        description: "Attractions & landmarks",
      },
      {
        id: "event_tickets",
        label: "Event Tickets",
        icon: Ticket,
        description: "Shows & experiences",
      },
      {
        id: "transportation",
        label: "Transportation",
        icon: Navigation,
        description: "Taxi, ride-share & more",
      },
      {
        id: "wake_up_call",
        label: "Wake-up Call",
        icon: Bell,
        description: "Schedule a wake-up call",
      },
    ],
    successIcon: Phone,
    successText: "Your concierge request has been received. We will assist you shortly.",
  },
  valet: {
    title: "Valet",
    subtitle: "Car services at your fingertips.",
    category: "valet",
    items: [
      {
        id: "car_retrieval",
        label: "Car Retrieval",
        icon: CarFront,
        description: "Bring your car around",
      },
      {
        id: "airport_transfer",
        label: "Airport Transfer",
        icon: PlaneTakeoff,
        description: "Schedule a transfer",
      },
      {
        id: "car_wash",
        label: "Car Wash",
        icon: Sparkles,
        description: "Exterior & interior clean",
      },
      {
        id: "parking_info",
        label: "Parking Info",
        icon: ParkingCircle,
        description: "Rates & availability",
      },
    ],
    successIcon: Car,
    successText: "Your valet request has been received. We will be with you shortly.",
  },
};

const VALID_SLUGS = Object.keys(SLUG_CONFIGS);

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ServiceDetailPage({ params }: PageProps): React.ReactElement {
  const { slug } = use(params);

  if (!VALID_SLUGS.includes(slug)) {
    notFound();
  }

  return <ServiceDetailContent slug={slug} />;
}

interface ServiceDetailContentProps {
  slug: string;
}

function ServiceDetailContent({ slug }: ServiceDetailContentProps): React.ReactElement {
  const config = SLUG_CONFIGS[slug]!;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<RequestPriority>("medium");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const SuccessIcon = config.successIcon;

  function handleItemSelect(id: string): void {
    setSelectedItem((prev) => (prev === id ? null : id));
    setError(null);
  }

  function handleSubmit(): void {
    if (!selectedItem) {
      setError("Please select a service option.");
      return;
    }

    setError(null);

    const selectedItemLabel =
      config.items.find((i) => i.id === selectedItem)?.label ?? selectedItem;

    startTransition(async () => {
      const result = await createRequest({
        category: config.category,
        item: selectedItemLabel,
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
      }, 1400);
    });
  }

  if (submitted) {
    return (
      <GuestPageShell>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="glass-card p-8 max-w-sm w-full">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <SuccessIcon className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-[#1a1d3a] mb-2">
              Request Submitted
            </h2>
            <p className="text-sm text-muted-foreground">{config.successText}</p>
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

      <SectionHeader title={config.title} />

      <p className="text-sm text-muted-foreground -mt-2 mb-4">{config.subtitle}</p>

      {/* Item grid */}
      <div className="grid grid-cols-2 gap-3">
        {config.items.map((item) => (
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
            Add Details{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </h3>

          <div className="space-y-1.5">
            <label
              htmlFor={`${slug}-description`}
              className="text-xs font-medium text-foreground/70"
            >
              Additional notes
            </label>
            <Textarea
              id={`${slug}-description`}
              placeholder="Any specific preferences or timing requests..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none text-sm"
              maxLength={500}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`${slug}-priority`}
              className="text-xs font-medium text-foreground/70"
            >
              How soon do you need this?
            </label>
            <Select
              value={priority}
              onValueChange={(val) => setPriority(val as RequestPriority)}
            >
              <SelectTrigger id={`${slug}-priority`} className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low — no rush</SelectItem>
                <SelectItem value="medium">Medium — within a few hours</SelectItem>
                <SelectItem value="high">High — soon</SelectItem>
                <SelectItem value="urgent">Urgent — right now</SelectItem>
              </SelectContent>
            </Select>
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
