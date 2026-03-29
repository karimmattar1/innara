"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { GuestPageShell } from "@/components/innara/GuestPageShell";
import { SectionHeader } from "@/components/innara/SectionHeader";
import { StarRating } from "@/components/innara/StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// ---------------------------------------------------------------------------
// Placeholder submit — real server action comes with feedback feature ticket
// ---------------------------------------------------------------------------

interface FeedbackPayload {
  overallRating: number;
  cleanlinessRating: number;
  serviceRating: number;
  amenitiesRating: number;
  foodRating: number;
  textFeedback: string;
  wouldRecommend: boolean | null;
}

async function submitFeedback(_payload: FeedbackPayload): Promise<{ success: boolean; error?: string }> {
  // Placeholder — real server action wired in a later ticket
  await new Promise((resolve) => setTimeout(resolve, 900));
  return { success: true };
}

// ---------------------------------------------------------------------------
// Category rating config
// ---------------------------------------------------------------------------

interface CategoryRating {
  key: "cleanlinessRating" | "serviceRating" | "amenitiesRating" | "foodRating";
  label: string;
  description: string;
}

const CATEGORY_RATINGS: CategoryRating[] = [
  { key: "cleanlinessRating", label: "Cleanliness", description: "Room and common areas" },
  { key: "serviceRating", label: "Service", description: "Staff responsiveness and friendliness" },
  { key: "amenitiesRating", label: "Amenities", description: "Pool, gym, spa, and facilities" },
  { key: "foodRating", label: "Food & Dining", description: "Room service and restaurant" },
];

const MAX_FEEDBACK_LENGTH = 1000;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GuestFeedbackPage(): React.ReactElement {
  const [overallRating, setOverallRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState<
    Record<CategoryRating["key"], number>
  >({
    cleanlinessRating: 0,
    serviceRating: 0,
    amenitiesRating: 0,
    foodRating: 0,
  });
  const [textFeedback, setTextFeedback] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = overallRating > 0 && !isSubmitting;

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitFeedback({
        overallRating,
        cleanlinessRating: categoryRatings.cleanlinessRating,
        serviceRating: categoryRatings.serviceRating,
        amenitiesRating: categoryRatings.amenitiesRating,
        foodRating: categoryRatings.foodRating,
        textFeedback: textFeedback.trim(),
        wouldRecommend,
      });

      if (result.success) {
        setSubmitted(true);
      } else {
        setSubmitError(result.error ?? "Failed to submit feedback. Please try again.");
      }
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Thank you state
  // ---------------------------------------------------------------------------

  if (submitted) {
    return (
      <GuestPageShell>
        <div className="flex flex-col items-center justify-center py-16 text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-[#1a1d3a]">Thank You!</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Your feedback means a lot to us. We&apos;re always working to make your stay even better.
            </p>
          </div>
          <div className="glass-card p-4 text-sm text-muted-foreground text-left w-full">
            <p>
              We appreciate you taking the time to share your experience at {overallRating >= 4 ? "The Grand Innara" : "our hotel"}. Your feedback helps us improve for all guests.
            </p>
          </div>
        </div>
      </GuestPageShell>
    );
  }

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------

  return (
    <GuestPageShell
      header={
        <div className="px-5 pt-2 pb-1">
          <h1 className="text-2xl font-semibold text-[#1a1d3a]">Share Your Feedback</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Help us make your next stay even better</p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        {/* Overall rating */}
        <section className="glass-card p-4 space-y-3">
          <div>
            <h2 className="text-base font-semibold text-[#1a1d3a]">Overall Experience</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              How would you rate your stay overall?{" "}
              <span className="text-destructive" aria-hidden="true">*</span>
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <StarRating
              value={overallRating}
              onChange={setOverallRating}
              size="lg"
            />
            {overallRating > 0 && (
              <p className="text-sm font-medium text-[#9B7340]">
                {overallRating === 1
                  ? "Poor"
                  : overallRating === 2
                  ? "Fair"
                  : overallRating === 3
                  ? "Good"
                  : overallRating === 4
                  ? "Very Good"
                  : "Excellent"}
              </p>
            )}
          </div>
        </section>

        {/* Category ratings */}
        <section className="mt-4 space-y-1">
          <SectionHeader title="Rate Your Experience" />
          <div className="glass-card p-4 space-y-4">
            {CATEGORY_RATINGS.map((cat) => (
              <div key={cat.key}>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{cat.label}</p>
                    <p className="text-xs text-muted-foreground">{cat.description}</p>
                  </div>
                  <StarRating
                    value={categoryRatings[cat.key]}
                    onChange={(val) =>
                      setCategoryRatings((prev) => ({ ...prev, [cat.key]: val }))
                    }
                    size="sm"
                  />
                </div>
                {cat.key !== "foodRating" && (
                  <div className="border-t border-border/20 mt-3" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Would recommend */}
        <section className="mt-4">
          <SectionHeader title="Would You Recommend Us?" />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setWouldRecommend(true)}
              aria-pressed={wouldRecommend === true}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all border ${
                wouldRecommend === true
                  ? "bg-[#1a1d3a] text-white border-[#1a1d3a]"
                  : "glass-card border-border/30 text-foreground hover:bg-secondary/30"
              }`}
            >
              Yes, I would
            </button>
            <button
              type="button"
              onClick={() => setWouldRecommend(false)}
              aria-pressed={wouldRecommend === false}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all border ${
                wouldRecommend === false
                  ? "bg-[#1a1d3a] text-white border-[#1a1d3a]"
                  : "glass-card border-border/30 text-foreground hover:bg-secondary/30"
              }`}
            >
              Not this time
            </button>
          </div>
        </section>

        {/* Text feedback */}
        <section className="mt-4">
          <SectionHeader title="Tell Us More" />
          <Textarea
            placeholder="Share your experience — what did you love? What could we improve?"
            value={textFeedback}
            onChange={(e) => {
              if (e.target.value.length <= MAX_FEEDBACK_LENGTH) {
                setTextFeedback(e.target.value);
              }
            }}
            rows={5}
            className="resize-none"
            aria-label="Written feedback"
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {textFeedback.length}/{MAX_FEEDBACK_LENGTH}
          </p>
        </section>

        {/* Error */}
        {submitError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm mt-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Submit */}
        <div className="mt-4 pb-2">
          {!canSubmit && overallRating === 0 && (
            <p className="text-xs text-muted-foreground text-center mb-2">
              Please select an overall rating to submit
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </span>
            ) : (
              "Submit Feedback"
            )}
          </Button>
        </div>
      </form>
    </GuestPageShell>
  );
}
