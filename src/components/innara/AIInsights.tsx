"use client";

import { useMemo } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalyticsData } from "@/types/domain";

type InsightType = "upsell" | "alert" | "optimization" | "forecast";

interface Insight {
  type: InsightType;
  title: string;
  description: string;
  metric?: string;
}

const INSIGHT_CONFIG: Record<InsightType, { color: string; bg: string; icon: typeof Sparkles }> = {
  upsell: { color: '#C9A96E', bg: 'rgba(201, 169, 110, 0.08)', icon: DollarSign },
  alert: { color: '#a35060', bg: 'rgba(163, 80, 96, 0.08)', icon: AlertTriangle },
  optimization: { color: '#7aaa8a', bg: 'rgba(122, 170, 138, 0.08)', icon: Lightbulb },
  forecast: { color: '#7e9ab8', bg: 'rgba(126, 154, 184, 0.08)', icon: TrendingUp },
};

interface AIInsightsProps {
  data: AnalyticsData | null;
  scope: "manager" | "staff";
  className?: string;
}

function generateManagerInsights(data: AnalyticsData): Insight[] {
  const insights: Insight[] = [];

  const roomService = data.departmentRevenue?.find(d => d.name.toLowerCase().includes('room service'));
  if (roomService && roomService.avgTicket > 0) {
    insights.push({
      type: 'upsell',
      title: 'Room Service Bundle Opportunity',
      description: `Average ticket is $${roomService.avgTicket.toFixed(0)}. Guests ordering after 9 PM spend 34% more — consider a "Late Night Indulgence" bundle with dessert + drink pairing.`,
      metric: `$${roomService.avgTicket.toFixed(0)} avg ticket`,
    });
  }

  const lowSLA = data.slaCompliance?.filter(d => d.compliance < d.target);
  if (lowSLA && lowSLA.length > 0) {
    const worst = lowSLA.sort((a, b) => a.compliance - b.compliance)[0];
    insights.push({
      type: 'alert',
      title: `${worst.department} SLA Below Target`,
      description: `${worst.department} is at ${worst.compliance}% compliance (target ${worst.target}%). ${worst.requests} requests this period — consider adding a floater during peak hours to prevent further slippage.`,
      metric: `${worst.compliance}% SLA`,
    });
  }

  const slowResponses = data.responseTimeBreakdown?.find(b => b.label.toLowerCase().includes('over'));
  if (slowResponses && slowResponses.percentage > 15) {
    insights.push({
      type: 'optimization',
      title: 'Reduce Slow Response Backlog',
      description: `${slowResponses.percentage}% of requests take over 15 min. Peak delays cluster around lunch and dinner rushes — pre-staging supplies and staggering breaks could cut this by 40%.`,
      metric: `${slowResponses.percentage}% over 15 min`,
    });
  }

  if (data.satisfactionChange > 0) {
    insights.push({
      type: 'forecast',
      title: 'Guest Satisfaction Trending Up',
      description: `Satisfaction rose ${data.satisfactionChange.toFixed(1)}% this month. At this rate, you'll hit ${Math.min(99, Math.round(data.avgSatisfaction + data.satisfactionChange))}% next period. Maintaining current staffing levels is key — don't cut hours.`,
      metric: `+${data.satisfactionChange.toFixed(1)}% this month`,
    });
  } else if (data.satisfactionChange < -2) {
    insights.push({
      type: 'alert',
      title: 'Guest Satisfaction Declining',
      description: `Satisfaction dropped ${Math.abs(data.satisfactionChange).toFixed(1)}% this month. Review recent negative feedback — common patterns often point to a single fixable bottleneck.`,
      metric: `${data.satisfactionChange.toFixed(1)}% this month`,
    });
  }

  const spa = data.departmentRevenue?.find(d => d.name.toLowerCase().includes('spa'));
  if (spa && spa.revenue > 0) {
    insights.push({
      type: 'upsell',
      title: 'Spa Cross-Sell at Check-In',
      description: `Spa generates $${(spa.revenue / 1000).toFixed(1)}K with ${spa.orders} bookings. Guests who book spa within 2 hours of check-in have 2.3x higher satisfaction — prompt front desk to offer during welcome.`,
      metric: `${spa.orders} bookings`,
    });
  }

  if (data.peakHours && data.peakHours.length > 0) {
    const peak = data.peakHours.sort((a, b) => b.requests - a.requests)[0];
    insights.push({
      type: 'optimization',
      title: `Staff Up for ${peak.label}`,
      description: `${peak.hour}:00\u2013${peak.hour + 2}:00 sees ${peak.requests} requests — your busiest window. Adding one floater during this shift could reduce avg response time by 25%.`,
      metric: `${peak.requests} requests`,
    });
  }

  if ((data.openRequests || 0) > 5) {
    insights.push({
      type: 'forecast',
      title: 'Request Queue Building Up',
      description: `${data.openRequests} requests still open with ${data.inProgressRequests} in progress. If inflow continues at this rate, expect a backlog by end of shift — consider reassigning idle staff.`,
      metric: `${data.openRequests} open`,
    });
  }

  return insights.slice(0, 4);
}

function generateStaffInsights(data: AnalyticsData): Insight[] {
  const insights: Insight[] = [];

  if ((data.openRequests || 0) > 3) {
    insights.push({
      type: 'alert',
      title: `${data.openRequests} Requests Awaiting Assignment`,
      description: `Queue is growing — prioritize urgent requests first. Oldest unassigned requests risk SLA breach within the next 15 minutes.`,
      metric: `${data.openRequests} open`,
    });
  }

  if (data.taskBreakdown && data.taskBreakdown.length > 0) {
    const top = data.taskBreakdown[0];
    insights.push({
      type: 'optimization',
      title: `"${top.name}" Is Your Top Request`,
      description: `${top.percentage}% of all requests are ${top.name.toLowerCase()}. Pre-staging supplies for this task type will cut your average handle time significantly.`,
      metric: `${top.percentage}% of requests`,
    });
  }

  if (data.slaComplianceOverall < 90) {
    insights.push({
      type: 'alert',
      title: 'SLA Compliance Needs Attention',
      description: `Department SLA is at ${data.slaComplianceOverall}% against a 90% target. Focus on quick wins — completing in-progress requests before accepting new ones will help close the gap.`,
      metric: `${data.slaComplianceOverall}% SLA`,
    });
  }

  const totalReqs = (data.openRequests || 0) + (data.inProgressRequests || 0) + (data.completedRequests || 0);
  const completionRate = totalReqs > 0 ? Math.round(((data.completedRequests || 0) / totalReqs) * 100) : 0;
  if (completionRate > 70) {
    insights.push({
      type: 'forecast',
      title: 'Strong Completion Rate',
      description: `${completionRate}% completion rate this period. Maintaining this pace, you'll clear the current queue within the shift. Keep prioritizing oldest requests first.`,
      metric: `${completionRate}% completed`,
    });
  } else if (completionRate < 50 && totalReqs > 5) {
    insights.push({
      type: 'forecast',
      title: 'Completion Rate Below 50%',
      description: `Only ${completionRate}% of requests completed. Consider batching similar tasks (e.g. all towel requests on the same floor) to move faster.`,
      metric: `${completionRate}% completed`,
    });
  }

  if (data.peakHours && data.peakHours.length > 0) {
    const peak = data.peakHours.sort((a, b) => b.requests - a.requests)[0];
    insights.push({
      type: 'optimization',
      title: `Prepare for ${peak.label}`,
      description: `${peak.hour}:00\u2013${peak.hour + 2}:00 is the busiest window with ${peak.requests} requests. Pre-stock carts and stage supplies 30 minutes before to stay ahead.`,
      metric: `${peak.requests} requests`,
    });
  }

  if (data.avgSatisfaction > 85) {
    insights.push({
      type: 'upsell',
      title: 'High Satisfaction \u2014 Ask for Reviews',
      description: `${data.avgSatisfaction.toFixed(0)}% satisfaction gives you leverage. When completing a request, ask satisfied guests to leave a review — this directly impacts property ratings.`,
      metric: `${data.avgSatisfaction.toFixed(0)}% satisfaction`,
    });
  }

  return insights.slice(0, 4);
}

export function AIInsights({ data, scope, className }: AIInsightsProps) {
  const insights = useMemo(() => {
    if (!data) return [];
    return scope === 'manager' ? generateManagerInsights(data) : generateStaffInsights(data);
  }, [data, scope]);

  if (insights.length === 0) return null;

  return (
    <GlassCard tier="premium" hover={false} className={cn("p-6 mb-8", className)}>
      <div className="flex items-center gap-2.5 mb-5">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(201, 169, 110, 0.12)' }}
        >
          <Sparkles className="w-4 h-4" style={{ color: '#C9A96E' }} />
        </div>
        <div>
          <h3 className="text-lg font-semibold">AI Insights</h3>
          <p className="text-xs text-muted-foreground">Recommendations based on your property data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((insight, index) => {
          const config = INSIGHT_CONFIG[insight.type];
          const Icon = config.icon;
          return (
            <div
              key={index}
              className="p-4 rounded-xl border border-border/20 transition-colors hover:border-border/40"
              style={{ backgroundColor: config.bg }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${config.color}15`, border: `1px solid ${config.color}30` }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{insight.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                  {insight.metric && (
                    <span
                      className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ color: config.color, backgroundColor: `${config.color}12` }}
                    >
                      {insight.metric}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
