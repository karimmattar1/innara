// ============================================
// CONCIERGE TOOL DEFINITIONS
// Tool schemas passed to the Claude API for the AI concierge.
// Tool execution (create_service_request inserting to DB) is
// implemented in Wave 2 (INN-40). These definitions are registered
// here so Claude knows when to call them and with what parameters.
// ============================================

import type Anthropic from "@anthropic-ai/sdk";

export const conciergeTools: Anthropic.Tool[] = [
  {
    name: "create_service_request",
    description:
      "Create a service request on behalf of the guest. Use when the guest asks for housekeeping, maintenance, or other hotel services that require staff action.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          enum: [
            "housekeeping",
            "maintenance",
            "room_service",
            "concierge",
            "valet",
            "spa",
            "other",
          ],
          description: "Category of the service request",
        },
        item: {
          type: "string",
          description: "Brief title of what is needed (e.g. 'Extra towels')",
        },
        description: {
          type: "string",
          description:
            "Detailed description of the request including any relevant context",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "urgent"],
          description:
            "Priority level — default to medium unless the situation is clearly urgent",
        },
      },
      required: ["category", "item", "description", "priority"],
    },
  },
];
