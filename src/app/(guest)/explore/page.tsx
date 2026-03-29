"use client";

import {
  MapPin,
  Waves,
  Dumbbell,
  Flower2,
  Utensils,
  Wifi,
  Car,
  Coffee,
  Tv2,
  Clock,
  Phone,
  ChevronRight,
} from "lucide-react";
import { GuestPageShell } from "@/components/innara/GuestPageShell";
import { SectionHeader } from "@/components/innara/SectionHeader";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

// ---------------------------------------------------------------------------
// Placeholder data — real hotel data fetch comes with hotel context server action
// ---------------------------------------------------------------------------

const HOTEL_INFO = {
  name: "The Grand Innara",
  description:
    "A sanctuary of modern luxury in the heart of the city. Thoughtfully designed spaces, world-class dining, and personalised service await at every turn.",
  address: "100 Harbour Boulevard, Downtown",
  phone: "+1 (555) 800-1200",
  checkInTime: "3:00 PM",
  checkOutTime: "11:00 AM",
} as const;

interface Amenity {
  icon: React.ElementType;
  label: string;
  detail: string;
}

const AMENITIES: Amenity[] = [
  { icon: Waves, label: "Rooftop Pool", detail: "Open 7am – 10pm" },
  { icon: Dumbbell, label: "Fitness Center", detail: "24 hours" },
  { icon: Flower2, label: "Spa & Wellness", detail: "9am – 9pm" },
  { icon: Utensils, label: "Restaurant", detail: "6am – 11pm" },
  { icon: Wifi, label: "High-Speed WiFi", detail: "Complimentary" },
  { icon: Car, label: "Valet Parking", detail: "$35 / night" },
  { icon: Coffee, label: "Room Service", detail: "24 hours" },
  { icon: Tv2, label: "Smart TV", detail: "All rooms" },
];

interface FAQ {
  question: string;
  answer: string;
}

const FAQS: FAQ[] = [
  {
    question: "What time is check-out?",
    answer:
      "Standard check-out is 11:00 AM. Late check-out until 2:00 PM is available upon request, subject to availability. Please speak with the front desk or ask your AI concierge to arrange this.",
  },
  {
    question: "What is the WiFi password?",
    answer:
      "WiFi is complimentary for all guests. Connect to the network \"Innara-Guest\" and log in using your room number and last name. No password is required.",
  },
  {
    question: "Is parking available?",
    answer:
      "Valet parking is available 24 hours at $35 per night. Self-parking is also available in our underground garage at $25 per night. Please present your room key when retrieving your vehicle.",
  },
  {
    question: "Can I request extra towels or pillows?",
    answer:
      "Absolutely. Use the Requests tab in this app or ask your AI concierge for any housekeeping items. We typically deliver within 15 minutes.",
  },
  {
    question: "What time does the pool close?",
    answer:
      "The rooftop pool is open from 7:00 AM to 10:00 PM daily. Towels and sunscreen are provided. Children under 16 must be accompanied by an adult.",
  },
  {
    question: "How do I arrange airport transportation?",
    answer:
      "Our concierge team can arrange private car transfers to and from the airport. Please contact us at least 2 hours in advance via the Requests tab or by calling the front desk.",
  },
];

interface NearbyPlace {
  name: string;
  category: string;
  distance: string;
}

const NEARBY_PLACES: NearbyPlace[] = [
  { name: "City Art Museum", category: "Culture", distance: "0.3 km" },
  { name: "Harbour Walk", category: "Outdoors", distance: "0.5 km" },
  { name: "Central Market", category: "Food & Drink", distance: "0.8 km" },
  { name: "Botanical Gardens", category: "Outdoors", distance: "1.2 km" },
  { name: "Old Town District", category: "Sightseeing", distance: "1.5 km" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ExplorePage(): React.ReactElement {
  return (
    <GuestPageShell
      header={
        <div className="px-5 pt-2 pb-1">
          <h1 className="text-2xl font-semibold text-[#1a1d3a]">Explore</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your hotel and what&apos;s nearby</p>
        </div>
      }
    >
      {/* Hotel info card */}
      <section>
        <div className="glass-card p-4 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-[#1a1d3a]">{HOTEL_INFO.name}</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {HOTEL_INFO.description}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <MapPin className="w-4 h-4 text-[#9B7340] flex-shrink-0" />
              <span>{HOTEL_INFO.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Phone className="w-4 h-4 text-[#9B7340] flex-shrink-0" />
              <span>{HOTEL_INFO.phone}</span>
            </div>
            <div className="flex items-center gap-4 text-sm mt-2 pt-2 border-t border-border/20">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#9B7340]" />
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">
                    Check-in
                  </p>
                  <p className="font-medium text-[#1a1d3a]">{HOTEL_INFO.checkInTime}</p>
                </div>
              </div>
              <div className="w-px h-8 bg-border/30" aria-hidden="true" />
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#9B7340]" />
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">
                    Check-out
                  </p>
                  <p className="font-medium text-[#1a1d3a]">{HOTEL_INFO.checkOutTime}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section>
        <SectionHeader title="Amenities" />
        <div className="grid grid-cols-2 gap-2">
          {AMENITIES.map((amenity) => (
            <div key={amenity.label} className="glass-card p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1a1d3a]/5 flex items-center justify-center flex-shrink-0">
                <amenity.icon className="w-5 h-5 text-[#1a1d3a]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1a1d3a] leading-tight truncate">
                  {amenity.label}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{amenity.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section>
        <SectionHeader title="Frequently Asked Questions" />
        <div className="glass-card p-4">
          <Accordion>
            {FAQS.map((faq, index) => (
              <AccordionItem key={index} value={String(index)}>
                <AccordionTrigger className="text-sm font-medium text-[#1a1d3a] py-3">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground leading-relaxed pb-1">
                    {faq.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Nearby */}
      <section>
        <SectionHeader title="Nearby" />
        <div className="space-y-2">
          {NEARBY_PLACES.map((place) => (
            <div
              key={place.name}
              className="glass-card p-3 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-[#9B7340]/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-[#9B7340]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{place.name}</p>
                <p className="text-xs text-muted-foreground">{place.category}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-xs text-muted-foreground">{place.distance}</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">
          Ask your AI concierge for personalised local recommendations
        </p>
      </section>
    </GuestPageShell>
  );
}
