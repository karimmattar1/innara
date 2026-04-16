# Innara Database Schema — Complete Production Reference

> **Venture:** Innara (AI-powered hotel guest experience platform)
> **Database:** PostgreSQL via Supabase
> **Last updated:** 2026-03-26
> **Status:** Existing demo schema (16+ tables) + 9 new production tables

---

## Table of Contents

1. [Enums](#enums)
2. [Existing Tables](#existing-tables)
3. [New Production Tables](#new-production-tables)
4. [Security-Definer Functions](#security-definer-functions)
5. [Triggers](#triggers)
6. [Indexes](#indexes)
7. [Row-Level Security Policies](#row-level-security-policies)
8. [Realtime Configuration](#realtime-configuration)
9. [Relationship Diagram](#relationship-diagram)
10. [Migration History](#migration-history)

---

## Enums

```sql
CREATE TYPE app_role AS ENUM ('guest', 'staff', 'front_desk', 'manager', 'super_admin');

CREATE TYPE department_type AS ENUM (
  'housekeeping', 'maintenance', 'fb', 'concierge', 'valet', 'spa', 'front_desk'
);

CREATE TYPE request_status AS ENUM ('new', 'pending', 'in_progress', 'completed', 'cancelled');

CREATE TYPE request_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TYPE request_category AS ENUM (
  'housekeeping', 'maintenance', 'room_service', 'concierge', 'valet', 'spa', 'other'
);

CREATE TYPE stay_status AS ENUM ('upcoming', 'active', 'completed', 'cancelled');

CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled');

CREATE TYPE room_status AS ENUM ('available', 'occupied', 'cleaning', 'maintenance', 'out_of_order');
```

**Total: 8 enums**

---

## Existing Tables

### profiles

User profile data, linked 1:1 to `auth.users`. Auto-created on signup via trigger.

```sql
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text,
  full_name   text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, FK auth.users CASCADE |
| email | text | |
| full_name | text | |
| phone | text | |
| avatar_url | text | |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

**RLS:** All authenticated users can read all profiles. Users can only update their own profile.

---

### user_roles

Role assignments for RBAC. A user can have multiple roles (e.g., staff + manager).

```sql
CREATE TABLE user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       app_role NOT NULL DEFAULT 'guest',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| user_id | uuid | NOT NULL, FK auth.users CASCADE, UNIQUE(user_id, role) |
| role | app_role | NOT NULL DEFAULT 'guest' |
| created_at | timestamptz | NOT NULL DEFAULT now() |

**RLS:** Users can only view their own roles.

---

### hotels

Multi-tenant root table. Each hotel is an isolated tenant.

```sql
CREATE TABLE hotels (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  slug                text NOT NULL UNIQUE,
  type                text,
  location            text,
  address             text,
  description         text,
  rating              numeric,
  price_per_night     numeric,
  amenities           text[],
  image_url           text,
  logo_url            text,
  theme_primary_color text,
  theme_accent_color  text,
  is_active           boolean NOT NULL DEFAULT true,
  settings            jsonb DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| name | text | NOT NULL |
| slug | text | NOT NULL, UNIQUE |
| type | text | |
| location | text | |
| address | text | |
| description | text | |
| rating | numeric | |
| price_per_night | numeric | |
| amenities | text[] | |
| image_url | text | |
| logo_url | text | |
| theme_primary_color | text | |
| theme_accent_color | text | |
| is_active | boolean | NOT NULL DEFAULT true |
| settings | jsonb | DEFAULT '{}' |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

**RLS:** Public read access for active hotels (`WHERE is_active = true`).

---

### rooms

Physical rooms within a hotel.

```sql
CREATE TABLE rooms (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_number     text NOT NULL,
  floor           text,
  room_type       text,
  status          room_status NOT NULL DEFAULT 'available',
  max_occupancy   integer,
  price_per_night numeric,
  amenities       text[],
  description     text,
  image_url       text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, room_number)
);
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| hotel_id | uuid | NOT NULL, FK hotels CASCADE |
| room_number | text | NOT NULL, UNIQUE(hotel_id, room_number) |
| floor | text | |
| room_type | text | |
| status | room_status | NOT NULL DEFAULT 'available' |
| max_occupancy | integer | |
| price_per_night | numeric | |
| amenities | text[] | |
| description | text | |
| image_url | text | |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

**RLS:** Public read access.

---

### staff_assignments

Maps staff members to hotels and departments. Used for request routing and access control.

```sql
CREATE TABLE staff_assignments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id   uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  department department_type NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, hotel_id, department)
);
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| user_id | uuid | NOT NULL, FK auth.users CASCADE |
| hotel_id | uuid | NOT NULL, FK hotels CASCADE |
| department | department_type | NOT NULL |
| is_active | boolean | NOT NULL DEFAULT true |
| created_at | timestamptz | NOT NULL DEFAULT now() |

**Unique constraint:** `uq_staff_assignments_user_hotel_dept (user_id, hotel_id, department)`

---

### bookings

Guest reservations. Confirmation numbers are auto-generated in `INN-XXXXXXXX` format.

```sql
CREATE TABLE bookings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  confirmation_number text NOT NULL UNIQUE DEFAULT generate_confirmation_number(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id            uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id             uuid REFERENCES rooms(id) ON DELETE SET NULL,
  check_in_date       date NOT NULL,
  check_out_date      date NOT NULL,
  guest_count         integer NOT NULL DEFAULT 1,
  status              booking_status NOT NULL DEFAULT 'pending',
  total_amount        numeric,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| confirmation_number | text | NOT NULL, UNIQUE, DEFAULT generate_confirmation_number() |
| user_id | uuid | NOT NULL, FK auth.users CASCADE |
| hotel_id | uuid | NOT NULL, FK hotels CASCADE |
| room_id | uuid | FK rooms SET NULL |
| check_in_date | date | NOT NULL |
| check_out_date | date | NOT NULL |
| guest_count | integer | NOT NULL DEFAULT 1 |
| status | booking_status | NOT NULL DEFAULT 'pending' |
| total_amount | numeric | |
| notes | text | |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

---

### stays

Tracks active guest stays. Created when a guest checks in. Central to the request system.

```sql
CREATE TABLE stays (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id    uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id     uuid REFERENCES rooms(id) ON DELETE SET NULL,
  booking_id  uuid REFERENCES bookings(id) ON DELETE SET NULL,
  room_number text,
  check_in    timestamptz NOT NULL,
  check_out   timestamptz,
  status      stay_status NOT NULL DEFAULT 'active',
  verified_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| user_id | uuid | NOT NULL, FK auth.users CASCADE |
| hotel_id | uuid | NOT NULL, FK hotels CASCADE |
| room_id | uuid | FK rooms SET NULL |
| booking_id | uuid | FK bookings SET NULL |
| room_number | text | |
| check_in | timestamptz | NOT NULL |
| check_out | timestamptz | |
| status | stay_status | NOT NULL DEFAULT 'active' |
| verified_at | timestamptz | |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

---

### requests

**Core table.** Guest service requests — the heart of the Innara platform. Supports realtime updates.

```sql
CREATE TABLE requests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id          uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  stay_id           uuid REFERENCES stays(id) ON DELETE SET NULL,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_number       text,
  category          request_category NOT NULL,
  item              text,
  description       text,
  status            request_status NOT NULL DEFAULT 'new',
  priority          request_priority NOT NULL DEFAULT 'medium',
  assigned_staff_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  eta_minutes       integer,
  completed_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| hotel_id | uuid | NOT NULL, FK hotels CASCADE |
| stay_id | uuid | FK stays SET NULL |
| user_id | uuid | NOT NULL, FK auth.users CASCADE |
| room_number | text | |
| category | request_category | NOT NULL |
| item | text | |
| description | text | |
| status | request_status | NOT NULL DEFAULT 'new' |
| priority | request_priority | NOT NULL DEFAULT 'medium' |
| assigned_staff_id | uuid | FK auth.users SET NULL |
| eta_minutes | integer | |
| completed_at | timestamptz | |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

**Realtime:** ENABLED
**Trigger:** `trg_assign_request_to_staff` — auto-assigns new requests to least-loaded staff in the matching department.
**RLS:** Users can view, create, and update their own requests.

---

### request_events

Immutable audit trail for request status changes.

```sql
CREATE TABLE request_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  status     request_status NOT NULL,
  notes      text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| request_id | uuid | NOT NULL, FK requests CASCADE |
| status | request_status | NOT NULL |
| notes | text | |
| created_by | uuid | FK auth.users SET NULL |
| created_at | timestamptz | NOT NULL DEFAULT now() |

---

### messages

Request-linked messaging between guests, staff, and AI. Supports internal (staff-only) messages.

```sql
CREATE TABLE messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  sender_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('guest', 'staff', 'ai')),
  content     text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| request_id | uuid | NOT NULL, FK requests CASCADE |
| sender_id | uuid | NOT NULL, FK auth.users CASCADE |
| sender_type | text | NOT NULL, CHECK (guest, staff, ai) |
| content | text | NOT NULL |
| is_internal | boolean | NOT NULL DEFAULT false |
| created_at | timestamptz | NOT NULL DEFAULT now() |

**Realtime:** ENABLED
**RLS:** Guests see non-internal messages for their own requests. Staff see all messages for their hotel.

---

### menu_categories

Food and service menu categories per hotel.

```sql
CREATE TABLE menu_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id   uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name       text NOT NULL,
  slug       text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, slug)
);
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| hotel_id | uuid | NOT NULL, FK hotels CASCADE |
| name | text | NOT NULL |
| slug | text | NOT NULL, UNIQUE(hotel_id, slug) |
| description | text | |
| sort_order | integer | NOT NULL DEFAULT 0 |
| is_active | boolean | NOT NULL DEFAULT true |
| created_at | timestamptz | NOT NULL DEFAULT now() |

---

### menu_items

Individual menu items within categories.

```sql
CREATE TABLE menu_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id    uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  category_id uuid REFERENCES menu_categories(id) ON DELETE SET NULL,
  name        text NOT NULL,
  description text,
  price       numeric NOT NULL,
  image_url   text,
  is_popular  boolean NOT NULL DEFAULT false,
  is_available boolean NOT NULL DEFAULT true,
  allergens   text[],
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| hotel_id | uuid | NOT NULL, FK hotels CASCADE |
| category_id | uuid | FK menu_categories SET NULL |
| name | text | NOT NULL |
| description | text | |
| price | numeric | NOT NULL |
| image_url | text | |
| is_popular | boolean | NOT NULL DEFAULT false |
| is_available | boolean | NOT NULL DEFAULT true |
| allergens | text[] | |
| sort_order | integer | NOT NULL DEFAULT 0 |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

---

### orders

Room service orders. Created atomically via `create_order_with_items()`.

```sql
CREATE TABLE orders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stay_id        uuid REFERENCES stays(id) ON DELETE SET NULL,
  request_id     uuid REFERENCES requests(id) ON DELETE SET NULL,
  room_number    text,
  status         text NOT NULL DEFAULT 'pending',
  subtotal       numeric NOT NULL DEFAULT 0,
  tax            numeric NOT NULL DEFAULT 0,
  tip            numeric NOT NULL DEFAULT 0,
  total          numeric NOT NULL DEFAULT 0,
  payment_method text,
  paid_at        timestamptz,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| hotel_id | uuid | NOT NULL, FK hotels CASCADE |
| user_id | uuid | NOT NULL, FK auth.users CASCADE |
| stay_id | uuid | FK stays SET NULL |
| request_id | uuid | FK requests SET NULL |
| room_number | text | |
| status | text | NOT NULL DEFAULT 'pending' |
| subtotal | numeric | NOT NULL DEFAULT 0 |
| tax | numeric | NOT NULL DEFAULT 0 |
| tip | numeric | NOT NULL DEFAULT 0 |
| total | numeric | NOT NULL DEFAULT 0 |
| payment_method | text | |
| paid_at | timestamptz | |
| notes | text | |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

---

### order_items

Line items within an order.

```sql
CREATE TABLE order_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE SET NULL,
  name         text NOT NULL,
  quantity     integer NOT NULL DEFAULT 1,
  unit_price   numeric NOT NULL,
  total_price  numeric NOT NULL,
  modifiers    jsonb DEFAULT '[]',
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| order_id | uuid | NOT NULL, FK orders CASCADE |
| menu_item_id | uuid | FK menu_items SET NULL |
| name | text | NOT NULL |
| quantity | integer | NOT NULL DEFAULT 1 |
| unit_price | numeric | NOT NULL |
| total_price | numeric | NOT NULL |
| modifiers | jsonb | DEFAULT '[]' |
| notes | text | |
| created_at | timestamptz | NOT NULL DEFAULT now() |

---

### ratings

Guest feedback on requests and orders. Supports tipping.

```sql
CREATE TABLE ratings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES requests(id) ON DELETE SET NULL,
  order_id   uuid REFERENCES orders(id) ON DELETE SET NULL,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id   uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  rating     integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment    text,
  tip_amount numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| request_id | uuid | FK requests SET NULL |
| order_id | uuid | FK orders SET NULL |
| user_id | uuid | NOT NULL, FK auth.users CASCADE |
| hotel_id | uuid | NOT NULL, FK hotels CASCADE |
| rating | integer | NOT NULL, CHECK (1-5) |
| comment | text | |
| tip_amount | numeric | |
| created_at | timestamptz | NOT NULL DEFAULT now() |

---

### sla_configs

SLA targets per request category and priority, per hotel.

```sql
CREATE TABLE sla_configs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  category       request_category NOT NULL,
  priority       request_priority NOT NULL,
  target_minutes integer NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, category, priority)
);
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| hotel_id | uuid | NOT NULL, FK hotels CASCADE |
| category | request_category | NOT NULL |
| priority | request_priority | NOT NULL |
| target_minutes | integer | NOT NULL |
| created_at | timestamptz | NOT NULL DEFAULT now() |

**Unique constraint:** `(hotel_id, category, priority)`

---

### hotel_faqs

Hotel-specific FAQ content for the AI concierge knowledge base.

```sql
CREATE TABLE hotel_faqs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id   uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  question   text NOT NULL,
  answer     text NOT NULL,
  keywords   text[],
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| hotel_id | uuid | NOT NULL, FK hotels CASCADE |
| question | text | NOT NULL |
| answer | text | NOT NULL |
| keywords | text[] | GIN indexed |
| is_active | boolean | NOT NULL DEFAULT true |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

**Index:** GIN on `keywords` for full-text/array search.

---

### waitlist

Marketing waitlist for pre-launch signups.

```sql
CREATE TABLE waitlist (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL UNIQUE,
  type       text NOT NULL CHECK (type IN ('hotel', 'guest')),
  created_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  source     text
);
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| email | text | NOT NULL, UNIQUE |
| type | text | NOT NULL, CHECK (hotel, guest) |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| ip_address | text | |
| user_agent | text | |
| source | text | |

---

### service_options

Configurable service offerings per hotel (e.g., spa treatments, valet options).

```sql
CREATE TABLE service_options (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  name         text NOT NULL,
  description  text,
  price        numeric,
  eta_minutes  integer,
  icon_name    text,
  sort_order   integer NOT NULL DEFAULT 0,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| hotel_id | uuid | NOT NULL, FK hotels CASCADE |
| service_type | text | NOT NULL |
| name | text | NOT NULL |
| description | text | |
| price | numeric | |
| eta_minutes | integer | |
| icon_name | text | |
| sort_order | integer | NOT NULL DEFAULT 0 |
| is_active | boolean | NOT NULL DEFAULT true |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

---

### service_time_options

Time slot configurations for schedulable services.

```sql
CREATE TABLE service_time_options (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  label        text NOT NULL,
  minutes      integer NOT NULL,
  sort_order   integer NOT NULL DEFAULT 0,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| hotel_id | uuid | NOT NULL, FK hotels CASCADE |
| service_type | text | NOT NULL |
| label | text | NOT NULL |
| minutes | integer | NOT NULL |
| sort_order | integer | NOT NULL DEFAULT 0 |
| is_active | boolean | NOT NULL DEFAULT true |
| created_at | timestamptz | NOT NULL DEFAULT now() |

---

## New Production Tables

These tables are required for the full production launch and do not yet exist in the database.

### ai_conversations

AI concierge chat sessions per guest per hotel.

```sql
CREATE TABLE ai_conversations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id   uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text,
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id, hotel_id, created_at DESC);

-- Updated_at trigger
CREATE TRIGGER tr_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_ai_conversations_own ON ai_conversations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY insert_ai_conversations_own ON ai_conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY update_ai_conversations_own ON ai_conversations
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Managers can read all conversations for their hotel
CREATE POLICY select_ai_conversations_manager ON ai_conversations
  FOR SELECT USING (
    hotel_id IN (
      SELECT sa.hotel_id FROM staff_assignments sa
      JOIN user_roles ur ON ur.user_id = sa.user_id
      WHERE sa.user_id = auth.uid() AND ur.role = 'manager'
    )
  );

-- Super admins see all
CREATE POLICY select_ai_conversations_super_admin ON ai_conversations
  FOR SELECT USING (has_role(auth.uid(), 'super_admin'));
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| hotel_id | uuid | NOT NULL, FK hotels CASCADE |
| user_id | uuid | NOT NULL, FK auth.users CASCADE |
| title | text | Auto-generated from first message |
| status | text | NOT NULL DEFAULT 'active', CHECK (active, archived) |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

---

### ai_messages

Individual messages within an AI conversation. Tracks token usage and model for cost analysis.

```sql
CREATE TABLE ai_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role            text NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content         text,
  tool_calls      jsonb,
  tool_results    jsonb,
  tokens_input    integer,
  tokens_output   integer,
  model           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id, created_at);

-- RLS (inherits access via conversation ownership)
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_ai_messages_own ON ai_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY insert_ai_messages_own ON ai_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE user_id = auth.uid()
    )
  );

-- Super admins see all
CREATE POLICY select_ai_messages_super_admin ON ai_messages
  FOR SELECT USING (has_role(auth.uid(), 'super_admin'));
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| conversation_id | uuid | NOT NULL, FK ai_conversations CASCADE |
| role | text | NOT NULL, CHECK (user, assistant, system, tool) |
| content | text | |
| tool_calls | jsonb | Claude tool use response payloads |
| tool_results | jsonb | Tool execution results |
| tokens_input | integer | For cost tracking |
| tokens_output | integer | For cost tracking |
| model | text | e.g., haiku-4.5, sonnet-4.6 |
| created_at | timestamptz | NOT NULL DEFAULT now() |

---

### subscriptions

Stripe billing state per hotel. One subscription per hotel (1:1).

```sql
CREATE TABLE subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id                uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id      text UNIQUE,
  stripe_subscription_id  text UNIQUE,
  plan                    text NOT NULL CHECK (plan IN ('starter', 'pro', 'enterprise')),
  status                  text NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'unpaid')),
  room_count              integer,
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean NOT NULL DEFAULT false,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_hotel ON subscriptions(hotel_id);

-- Updated_at trigger
CREATE TRIGGER tr_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Managers see own hotel's subscription
CREATE POLICY select_subscriptions_manager ON subscriptions
  FOR SELECT USING (
    hotel_id IN (
      SELECT sa.hotel_id FROM staff_assignments sa
      JOIN user_roles ur ON ur.user_id = sa.user_id
      WHERE sa.user_id = auth.uid() AND ur.role IN ('manager', 'super_admin')
    )
  );

-- Super admins see all
CREATE POLICY select_subscriptions_super_admin ON subscriptions
  FOR SELECT USING (has_role(auth.uid(), 'super_admin'));

-- Only service role can INSERT/UPDATE (Stripe webhooks)
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| hotel_id | uuid | NOT NULL, FK hotels CASCADE, UNIQUE |
| stripe_customer_id | text | UNIQUE |
| stripe_subscription_id | text | UNIQUE |
| plan | text | NOT NULL, CHECK (starter, pro, enterprise) |
| status | text | NOT NULL, CHECK (trialing, active, past_due, cancelled, unpaid) |
| room_count | integer | For per-room billing calculation |
| current_period_start | timestamptz | |
| current_period_end | timestamptz | |
| cancel_at_period_end | boolean | NOT NULL DEFAULT false |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

**Note:** INSERT and UPDATE are restricted to the service role (Stripe webhook handler). No client-side writes.

---

### audit_logs

Immutable change tracking for compliance and debugging. Populated via database triggers on sensitive tables.

```sql
CREATE TABLE audit_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id   uuid REFERENCES hotels(id) ON DELETE CASCADE,
  actor_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action     text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name text NOT NULL,
  record_id  uuid NOT NULL,
  old_data   jsonb,
  new_data   jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_audit_hotel_time ON audit_logs(hotel_id, created_at DESC);
CREATE INDEX idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Managers see own hotel's logs
CREATE POLICY select_audit_logs_manager ON audit_logs
  FOR SELECT USING (
    hotel_id IN (
      SELECT sa.hotel_id FROM staff_assignments sa
      JOIN user_roles ur ON ur.user_id = sa.user_id
      WHERE sa.user_id = auth.uid() AND ur.role IN ('manager', 'super_admin')
    )
  );

-- Super admins see all
CREATE POLICY select_audit_logs_super_admin ON audit_logs
  FOR SELECT USING (has_role(auth.uid(), 'super_admin'));

-- No client-side writes — populated via triggers only
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| hotel_id | uuid | FK hotels CASCADE |
| actor_id | uuid | FK auth.users SET NULL |
| action | text | NOT NULL, CHECK (INSERT, UPDATE, DELETE) |
| table_name | text | NOT NULL |
| record_id | uuid | NOT NULL |
| old_data | jsonb | Previous row state |
| new_data | jsonb | New row state |
| ip_address | text | |
| created_at | timestamptz | NOT NULL DEFAULT now() |

**Note:** This table is append-only. No UPDATE or DELETE policies. Populated exclusively by database triggers.

---

### hotel_branding

White-label customization per hotel. One record per hotel (1:1).

```sql
CREATE TABLE hotel_branding (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id         uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE UNIQUE,
  logo_url         text,
  logo_light_url   text,
  favicon_url      text,
  primary_color    text,
  accent_color     text,
  background_color text,
  font_heading     text,
  font_body        text,
  custom_css       text,
  welcome_message  text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Updated_at trigger
CREATE TRIGGER tr_hotel_branding_updated_at
  BEFORE UPDATE ON hotel_branding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE hotel_branding ENABLE ROW LEVEL SECURITY;

-- Public read for active hotels (needed for guest-facing theming)
CREATE POLICY select_hotel_branding_public ON hotel_branding
  FOR SELECT USING (
    hotel_id IN (SELECT id FROM hotels WHERE is_active = true)
  );

-- Managers can update their own hotel's branding
CREATE POLICY update_hotel_branding_manager ON hotel_branding
  FOR UPDATE USING (
    hotel_id IN (
      SELECT sa.hotel_id FROM staff_assignments sa
      JOIN user_roles ur ON ur.user_id = sa.user_id
      WHERE sa.user_id = auth.uid() AND ur.role IN ('manager', 'super_admin')
    )
  );

-- Super admins can do everything
CREATE POLICY all_hotel_branding_super_admin ON hotel_branding
  FOR ALL USING (has_role(auth.uid(), 'super_admin'));
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| hotel_id | uuid | NOT NULL, FK hotels CASCADE, UNIQUE |
| logo_url | text | Dark background logo |
| logo_light_url | text | Light background logo |
| favicon_url | text | |
| primary_color | text | Hex color code |
| accent_color | text | Hex color code |
| background_color | text | Hex color code |
| font_heading | text | Google Font name |
| font_body | text | Google Font name |
| custom_css | text | Additional CSS overrides |
| welcome_message | text | Guest-facing welcome text |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

---

### notification_preferences

Per-user, per-hotel notification settings. Stores Web Push subscription for push notifications.

```sql
CREATE TABLE notification_preferences (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id          uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  push_enabled      boolean NOT NULL DEFAULT true,
  email_enabled     boolean NOT NULL DEFAULT true,
  sound_enabled     boolean NOT NULL DEFAULT true,
  push_subscription jsonb,
  preferences       jsonb NOT NULL DEFAULT '{
    "new_request": true,
    "status_update": true,
    "message": true,
    "sla_warning": true
  }',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, hotel_id)
);

-- Updated_at trigger
CREATE TRIGGER tr_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_notification_preferences_own ON notification_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY insert_notification_preferences_own ON notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY update_notification_preferences_own ON notification_preferences
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY delete_notification_preferences_own ON notification_preferences
  FOR DELETE USING (user_id = auth.uid());
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| user_id | uuid | NOT NULL, FK auth.users CASCADE, UNIQUE(user_id, hotel_id) |
| hotel_id | uuid | NOT NULL, FK hotels CASCADE |
| push_enabled | boolean | NOT NULL DEFAULT true |
| email_enabled | boolean | NOT NULL DEFAULT true |
| sound_enabled | boolean | NOT NULL DEFAULT true |
| push_subscription | jsonb | Web Push subscription object |
| preferences | jsonb | Granular notification toggles |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

**preferences JSONB structure:**
```json
{
  "new_request": true,
  "status_update": true,
  "message": true,
  "sla_warning": true
}
```

---

### shifts

Staff scheduling — defines shift time blocks per hotel.

```sql
CREATE TABLE shifts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id   uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name       text NOT NULL,
  start_time time NOT NULL,
  end_time   time NOT NULL,
  date       date NOT NULL,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_shifts_hotel_date ON shifts(hotel_id, date);

-- RLS
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Staff can view shifts for their hotel
CREATE POLICY select_shifts_staff ON shifts
  FOR SELECT USING (
    hotel_id IN (
      SELECT hotel_id FROM staff_assignments
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Managers can CRUD
CREATE POLICY all_shifts_manager ON shifts
  FOR ALL USING (
    hotel_id IN (
      SELECT sa.hotel_id FROM staff_assignments sa
      JOIN user_roles ur ON ur.user_id = sa.user_id
      WHERE sa.user_id = auth.uid() AND ur.role IN ('manager', 'super_admin')
    )
  );

-- Super admins see all
CREATE POLICY all_shifts_super_admin ON shifts
  FOR ALL USING (has_role(auth.uid(), 'super_admin'));
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| hotel_id | uuid | NOT NULL, FK hotels CASCADE |
| name | text | NOT NULL (e.g., "Morning Shift", "Night Shift") |
| start_time | time | NOT NULL |
| end_time | time | NOT NULL |
| date | date | NOT NULL |
| notes | text | |
| created_at | timestamptz | NOT NULL DEFAULT now() |

---

### shift_assignments

Maps staff members to specific shifts. Tracks check-in/check-out for attendance.

```sql
CREATE TABLE shift_assignments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id     uuid NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  staff_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department   department_type,
  status       text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'absent')),
  check_in_at  timestamptz,
  check_out_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(shift_id, staff_id)
);

-- Indexes
CREATE INDEX idx_shift_assignments_staff ON shift_assignments(staff_id, created_at DESC);

-- RLS
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;

-- Staff see own assignments
CREATE POLICY select_shift_assignments_own ON shift_assignments
  FOR SELECT USING (staff_id = auth.uid());

-- Managers see all for their hotel (via shift.hotel_id)
CREATE POLICY select_shift_assignments_manager ON shift_assignments
  FOR SELECT USING (
    shift_id IN (
      SELECT s.id FROM shifts s
      JOIN staff_assignments sa ON sa.hotel_id = s.hotel_id
      JOIN user_roles ur ON ur.user_id = sa.user_id
      WHERE sa.user_id = auth.uid() AND ur.role IN ('manager', 'super_admin')
    )
  );

-- Managers can insert/update/delete
CREATE POLICY all_shift_assignments_manager ON shift_assignments
  FOR ALL USING (
    shift_id IN (
      SELECT s.id FROM shifts s
      JOIN staff_assignments sa ON sa.hotel_id = s.hotel_id
      JOIN user_roles ur ON ur.user_id = sa.user_id
      WHERE sa.user_id = auth.uid() AND ur.role IN ('manager', 'super_admin')
    )
  );

-- Super admins see all
CREATE POLICY all_shift_assignments_super_admin ON shift_assignments
  FOR ALL USING (has_role(auth.uid(), 'super_admin'));
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| shift_id | uuid | NOT NULL, FK shifts CASCADE, UNIQUE(shift_id, staff_id) |
| staff_id | uuid | NOT NULL, FK auth.users CASCADE |
| department | department_type | |
| status | text | NOT NULL DEFAULT 'scheduled', CHECK (scheduled, active, completed, absent) |
| check_in_at | timestamptz | |
| check_out_at | timestamptz | |
| created_at | timestamptz | NOT NULL DEFAULT now() |

---

### integration_configs

PMS and third-party integration settings. Credentials are stored encrypted.

```sql
CREATE TABLE integration_configs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id              uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  provider              text NOT NULL CHECK (provider IN ('mews', 'cloudbeds', 'opera', 'custom')),
  display_name          text,
  credentials_encrypted jsonb,
  settings              jsonb DEFAULT '{}',
  webhook_url           text,
  webhook_secret        text,
  status                text NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'error', 'syncing')),
  last_sync_at          timestamptz,
  last_error            text,
  sync_log              jsonb[] DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, provider)
);

-- Updated_at trigger
CREATE TRIGGER tr_integration_configs_updated_at
  BEFORE UPDATE ON integration_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;

-- Managers see own hotel's integrations
CREATE POLICY select_integration_configs_manager ON integration_configs
  FOR SELECT USING (
    hotel_id IN (
      SELECT sa.hotel_id FROM staff_assignments sa
      JOIN user_roles ur ON ur.user_id = sa.user_id
      WHERE sa.user_id = auth.uid() AND ur.role IN ('manager', 'super_admin')
    )
  );

-- Managers can CRUD own hotel's integrations
CREATE POLICY all_integration_configs_manager ON integration_configs
  FOR ALL USING (
    hotel_id IN (
      SELECT sa.hotel_id FROM staff_assignments sa
      JOIN user_roles ur ON ur.user_id = sa.user_id
      WHERE sa.user_id = auth.uid() AND ur.role IN ('manager', 'super_admin')
    )
  );

-- Super admins see all
CREATE POLICY all_integration_configs_super_admin ON integration_configs
  FOR ALL USING (has_role(auth.uid(), 'super_admin'));
```

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() |
| hotel_id | uuid | NOT NULL, FK hotels CASCADE, UNIQUE(hotel_id, provider) |
| provider | text | NOT NULL, CHECK (mews, cloudbeds, opera, custom) |
| display_name | text | |
| credentials_encrypted | jsonb | Encrypted API keys and tokens |
| settings | jsonb | Sync frequency, field mappings, etc. |
| webhook_url | text | |
| webhook_secret | text | |
| status | text | NOT NULL DEFAULT 'inactive', CHECK (inactive, active, error, syncing) |
| last_sync_at | timestamptz | |
| last_error | text | |
| sync_log | jsonb[] | Last 10 sync results |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

**Security note:** `credentials_encrypted` should use Supabase Vault for encryption at rest. Never expose raw credentials in API responses — use a database function that strips sensitive fields.

---

## Security-Definer Functions

These functions run with elevated privileges and are used by RLS policies and application logic.

### has_role(user_id, role)

Checks if a user has a specific role.

```sql
CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### get_user_role(user_id)

Returns the highest-priority role for a user. Priority: super_admin > manager > front_desk > staff > guest.

```sql
CREATE OR REPLACE FUNCTION get_user_role(_user_id uuid)
RETURNS app_role AS $$
  SELECT role FROM user_roles
  WHERE user_id = _user_id
  ORDER BY
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'manager' THEN 2
      WHEN 'front_desk' THEN 3
      WHEN 'staff' THEN 4
      WHEN 'guest' THEN 5
    END
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### handle_new_user()

Trigger function that auto-creates a profile and guest role when a new user signs up via Supabase Auth.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );

  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'guest');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Applied on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### update_updated_at()

Generic trigger function for maintaining `updated_at` timestamps.

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### generate_confirmation_number()

Generates unique booking confirmation numbers in `INN-XXXXXXXX` format.

```sql
CREATE OR REPLACE FUNCTION generate_confirmation_number()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := 'INN-';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### create_order_with_items(...)

Atomic order creation — creates the order and all line items in a single transaction.

```sql
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_hotel_id uuid,
  p_user_id uuid,
  p_stay_id uuid,
  p_room_number text,
  p_items jsonb,
  p_notes text DEFAULT NULL
)
RETURNS jsonb AS $$
  -- Creates order + order_items atomically
  -- Calculates subtotal, tax (10%), and total
  -- Returns { order_id, confirmation_number, total }
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### cancel_request(request_id, user_id, reason)

Owner-only request cancellation with validation.

```sql
CREATE OR REPLACE FUNCTION cancel_request(
  p_request_id uuid,
  p_user_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb AS $$
  -- Validates ownership
  -- Validates request is not already completed/cancelled
  -- Updates status to 'cancelled'
  -- Creates request_event record
  -- Returns { success, request_id }
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### assign_request_to_staff()

Trigger function for automatic staff assignment based on department and current workload.

```sql
CREATE OR REPLACE FUNCTION assign_request_to_staff()
RETURNS TRIGGER AS $$
  -- Maps request_category to department_type
  -- Finds active staff in that department at the hotel
  -- Assigns to staff member with fewest open requests (load balancing)
  -- Falls back to NULL if no staff available
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Applied on requests
CREATE TRIGGER trg_assign_request_to_staff
  AFTER INSERT ON requests
  FOR EACH ROW EXECUTE FUNCTION assign_request_to_staff();
```

---

## Triggers

| Trigger | Table | Event | Function |
|---------|-------|-------|----------|
| `on_auth_user_created` | auth.users | AFTER INSERT | `handle_new_user()` |
| `trg_assign_request_to_staff` | requests | AFTER INSERT | `assign_request_to_staff()` |
| `tr_profiles_updated_at` | profiles | BEFORE UPDATE | `update_updated_at()` |
| `tr_hotels_updated_at` | hotels | BEFORE UPDATE | `update_updated_at()` |
| `tr_rooms_updated_at` | rooms | BEFORE UPDATE | `update_updated_at()` |
| `tr_bookings_updated_at` | bookings | BEFORE UPDATE | `update_updated_at()` |
| `tr_stays_updated_at` | stays | BEFORE UPDATE | `update_updated_at()` |
| `tr_requests_updated_at` | requests | BEFORE UPDATE | `update_updated_at()` |
| `tr_menu_items_updated_at` | menu_items | BEFORE UPDATE | `update_updated_at()` |
| `tr_orders_updated_at` | orders | BEFORE UPDATE | `update_updated_at()` |
| `tr_hotel_faqs_updated_at` | hotel_faqs | BEFORE UPDATE | `update_updated_at()` |
| `tr_service_options_updated_at` | service_options | BEFORE UPDATE | `update_updated_at()` |
| `tr_ai_conversations_updated_at` | ai_conversations | BEFORE UPDATE | `update_updated_at()` |
| `tr_subscriptions_updated_at` | subscriptions | BEFORE UPDATE | `update_updated_at()` |
| `tr_hotel_branding_updated_at` | hotel_branding | BEFORE UPDATE | `update_updated_at()` |
| `tr_notification_preferences_updated_at` | notification_preferences | BEFORE UPDATE | `update_updated_at()` |
| `tr_integration_configs_updated_at` | integration_configs | BEFORE UPDATE | `update_updated_at()` |

---

## Indexes

### Existing Table Indexes

```sql
-- requests (most queried table)
CREATE INDEX idx_requests_hotel_status ON requests(hotel_id, status, created_at DESC);
CREATE INDEX idx_requests_hotel_category ON requests(hotel_id, category);
CREATE INDEX idx_requests_assigned ON requests(assigned_staff_id) WHERE assigned_staff_id IS NOT NULL;
CREATE INDEX idx_requests_user ON requests(user_id, created_at DESC);

-- stays
CREATE INDEX idx_stays_user_hotel ON stays(user_id, hotel_id, status);
CREATE INDEX idx_stays_hotel_active ON stays(hotel_id) WHERE status = 'active';

-- bookings
CREATE INDEX idx_bookings_user ON bookings(user_id, created_at DESC);
CREATE INDEX idx_bookings_hotel ON bookings(hotel_id, status);

-- orders
CREATE INDEX idx_orders_hotel ON orders(hotel_id, created_at DESC);
CREATE INDEX idx_orders_user ON orders(user_id, created_at DESC);

-- messages
CREATE INDEX idx_messages_request ON messages(request_id, created_at);

-- request_events
CREATE INDEX idx_request_events_request ON request_events(request_id, created_at);

-- rooms
CREATE INDEX idx_rooms_hotel ON rooms(hotel_id);

-- staff_assignments
CREATE INDEX idx_staff_assignments_hotel ON staff_assignments(hotel_id, department);
CREATE INDEX idx_staff_assignments_user ON staff_assignments(user_id);

-- menu_items
CREATE INDEX idx_menu_items_hotel ON menu_items(hotel_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);

-- hotel_faqs
CREATE INDEX idx_hotel_faqs_hotel ON hotel_faqs(hotel_id);
CREATE INDEX idx_hotel_faqs_keywords ON hotel_faqs USING GIN(keywords);

-- ratings
CREATE INDEX idx_ratings_hotel ON ratings(hotel_id, created_at DESC);
CREATE INDEX idx_ratings_user ON ratings(user_id);

-- sla_configs
CREATE INDEX idx_sla_configs_hotel ON sla_configs(hotel_id);
```

### New Table Indexes

```sql
-- ai_conversations
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id, hotel_id, created_at DESC);

-- ai_messages
CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id, created_at);

-- subscriptions
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_hotel ON subscriptions(hotel_id);

-- audit_logs
CREATE INDEX idx_audit_hotel_time ON audit_logs(hotel_id, created_at DESC);
CREATE INDEX idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);

-- shifts
CREATE INDEX idx_shifts_hotel_date ON shifts(hotel_id, date);

-- shift_assignments
CREATE INDEX idx_shift_assignments_staff ON shift_assignments(staff_id, created_at DESC);
```

---

## Row-Level Security Policies

### Policy Summary Matrix

| Table | Guest | Staff | Front Desk | Manager | Super Admin |
|-------|-------|-------|------------|---------|-------------|
| **profiles** | Read all, write own | Read all, write own | Read all, write own | Read all, write own | All |
| **user_roles** | Read own | Read own | Read own | Read hotel's | All |
| **hotels** | Read active | Read assigned | Read assigned | Read+Write own | All |
| **rooms** | Read hotel's | Read hotel's | Read hotel's | Read+Write hotel's | All |
| **staff_assignments** | -- | Read own | Read hotel's | Read+Write hotel's | All |
| **bookings** | CRUD own | Read hotel's | Read+Write hotel's | All hotel's | All |
| **stays** | Read own | Read hotel's | Read+Write hotel's | All hotel's | All |
| **requests** | CRUD own | Read dept/assigned, update assigned | Read+Write hotel's | All hotel's | All |
| **request_events** | Read own request's | Read hotel's | Read hotel's | All hotel's | All |
| **messages** | Read non-internal (own requests) | Read+Write hotel's | Read+Write hotel's | Read+Write hotel's | All |
| **menu_categories** | Read active | Read hotel's | Read hotel's | CRUD hotel's | All |
| **menu_items** | Read available | Read hotel's | Read hotel's | CRUD hotel's | All |
| **orders** | CRUD own | Read hotel's | Read hotel's | Read hotel's | All |
| **order_items** | Read own order's | Read hotel's | Read hotel's | Read hotel's | All |
| **ratings** | CRUD own | Read hotel's | Read hotel's | Read hotel's | All |
| **sla_configs** | -- | Read hotel's | Read hotel's | CRUD hotel's | All |
| **hotel_faqs** | Read active | Read hotel's | Read hotel's | CRUD hotel's | All |
| **waitlist** | -- | -- | -- | -- | All (+ anon insert) |
| **service_options** | Read active | Read hotel's | Read hotel's | CRUD hotel's | All |
| **service_time_options** | Read active | Read hotel's | Read hotel's | CRUD hotel's | All |
| **ai_conversations** | CRUD own | -- | -- | Read hotel's | All |
| **ai_messages** | Read/Write own conversation's | -- | -- | Read hotel's | All |
| **subscriptions** | -- | -- | -- | Read own hotel | All |
| **audit_logs** | -- | -- | -- | Read own hotel | All |
| **hotel_branding** | Read own hotel | Read own hotel | Read own hotel | CRUD own hotel | All |
| **notification_preferences** | CRUD own | CRUD own | CRUD own | CRUD own | All |
| **shifts** | -- | Read own hotel | Read own hotel | CRUD own hotel | All |
| **shift_assignments** | -- | Read own | Read hotel's | CRUD hotel's | All |
| **integration_configs** | -- | -- | -- | CRUD own hotel | All |

### RLS Enforcement Checklist

Every table with user or organization data MUST have:

- [x] RLS ENABLED via `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- [x] SELECT policy that restricts by ownership, org/hotel membership, or role
- [x] INSERT policy with `WITH CHECK` clause where applicable
- [x] UPDATE policy with both `USING` and `WITH CHECK` where applicable
- [x] DELETE policy restricted to appropriate roles
- [x] `SECURITY DEFINER` functions used for cross-table lookups in policies
- [x] Super admin bypass policy on every table
- [x] Unauthenticated requests denied (no anon policies except waitlist insert and public hotel/room reads)

---

## Realtime Configuration

The following tables have Supabase Realtime enabled for live updates:

| Table | Use Case |
|-------|----------|
| **requests** | Live request status updates on guest and staff dashboards |
| **messages** | Real-time chat between guests, staff, and AI |

Enable via:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE requests;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

---

## Relationship Diagram

```
auth.users
  |
  +-- profiles (1:1)
  +-- user_roles (1:many)
  +-- staff_assignments (1:many) --> hotels
  +-- bookings (1:many) --> hotels, rooms
  +-- stays (1:many) --> hotels, rooms, bookings
  |     |
  |     +-- requests (1:many) --> hotels
  |     |     +-- request_events (1:many)
  |     |     +-- messages (1:many)
  |     |     +-- ratings (0:1)
  |     |
  |     +-- orders (1:many) --> hotels, requests
  |           +-- order_items (1:many) --> menu_items
  |
  +-- ai_conversations (1:many) --> hotels
  |     +-- ai_messages (1:many)
  |
  +-- notification_preferences (1:many, one per hotel)
  +-- shift_assignments (1:many) --> shifts
  +-- ratings (1:many) --> hotels

hotels
  |
  +-- rooms (1:many)
  +-- staff_assignments (1:many)
  +-- menu_categories (1:many)
  |     +-- menu_items (1:many)
  +-- sla_configs (1:many)
  +-- hotel_faqs (1:many)
  +-- service_options (1:many)
  +-- service_time_options (1:many)
  +-- hotel_branding (1:1)
  +-- subscriptions (1:1)
  +-- audit_logs (1:many)
  +-- shifts (1:many)
  |     +-- shift_assignments (1:many)
  +-- integration_configs (1:many)
  +-- [all guest data scoped via hotel_id]
```

---

## Migration History

All migrations are stored in `/Users/karimmattar11/Desktop/innara-service-hub-main/supabase/migrations/`.

| Migration | Description |
|-----------|-------------|
| `20260126161446` | Initial schema setup |
| `20260126161528` | Core tables creation |
| `20260126180821` | Additional table setup |
| `20260126192725` | RLS policies |
| `20260126201247` | Functions and triggers |
| `20260126201907` | Extended schema |
| `20260127004954` | Schema refinements |
| `20260127150730` | Additional columns/constraints |
| `20260127171629` | More schema work |
| `20260127180000` | Seed hotels and rooms |
| `20260127180142` | Schema updates |
| `20260127180916` | Additional updates |
| `20260127195228` | Menu/ordering tables |
| `20260127195723` | Ratings and SLA tables |
| `20260127200000` | Seed auth users |
| `20260127200831` | Post-seed schema adjustments |
| `20260127211451` | Final initial schema tweaks |
| `20260128100000` | Atomic order creation function |
| `20260128100001` | Cancel request function |
| `20260128200000` | Import data migration |
| `20260129120000` | Fix auth users |
| `20260129130000` | Cleanup broken auth |
| `20260129160000` | Create waitlist table |
| `20260202100000` | Service options tables |
| `20260202100001` | Seed demo data |
| `20260202100002` | Enhanced demo data |
| `20260203100000` | Fix stays for all users |
| `20260203100002` | Fix demo stats |
| `20260203100003` | Ensure all users have stays |
| `20260203100004` | Update guest names |
| `20260203100005` | Fix request distribution |
| `20260203100006` | Add demo staff and analytics data |
| `20260203100007` | Add demo ratings |
| `20260203100008` | Fix analytics data comprehensive |
| `20260203100009` | Create demo refresh function |
| `20260204193000` | Set guest test name |
| `20260204203000` | Relax profile policy for demo |
| `20260204213000` | Auto-assign requests trigger |
| `20260205170000` | Seed room service options |
| `20260205173000` | Fix auto-assign type casting |
| `20260205180000` | Add demo housekeeping staff |
| `20260205181000` | Cleanup QA test data |
| `20260210100000` | Update domain to innara.app |
| `20260210121500` | Harden auto-assignment fallback |
| `20260210140000` | Ensure demo staff for auto-assign |
| `20260210160000` | Allow reading staff profiles |
| `20260210161000` | Simplify profile RLS |

**Total existing migrations:** 42
**Next migration prefix:** `20260326XXXXXX`

---

## Production Migration Plan (New Tables)

The 9 new production tables should be created in the following order to respect foreign key dependencies:

1. **`ai_conversations`** — depends on: hotels, auth.users
2. **`ai_messages`** — depends on: ai_conversations
3. **`subscriptions`** — depends on: hotels
4. **`audit_logs`** — depends on: hotels, auth.users
5. **`hotel_branding`** — depends on: hotels
6. **`notification_preferences`** — depends on: auth.users, hotels
7. **`shifts`** — depends on: hotels
8. **`shift_assignments`** — depends on: shifts, auth.users
9. **`integration_configs`** — depends on: hotels

Each migration should include: table creation, indexes, triggers, RLS enablement, and RLS policies.

---

## TypeScript Type Generation

After applying all migrations, regenerate types:

```bash
npx supabase gen types typescript --project-id <project-id> > src/types/database.ts
```

Key derived types for application code:

```typescript
import { Database } from '@/types/database'

// Row types (for reading)
type Hotel = Database['public']['Tables']['hotels']['Row']
type Room = Database['public']['Tables']['rooms']['Row']
type Request = Database['public']['Tables']['requests']['Row']
type Stay = Database['public']['Tables']['stays']['Row']
type Booking = Database['public']['Tables']['bookings']['Row']
type Message = Database['public']['Tables']['messages']['Row']
type Order = Database['public']['Tables']['orders']['Row']
type AiConversation = Database['public']['Tables']['ai_conversations']['Row']
type AiMessage = Database['public']['Tables']['ai_messages']['Row']
type Subscription = Database['public']['Tables']['subscriptions']['Row']

// Insert types (for creating)
type InsertRequest = Database['public']['Tables']['requests']['Insert']
type InsertMessage = Database['public']['Tables']['messages']['Insert']
type InsertOrder = Database['public']['Tables']['orders']['Insert']

// Update types (for patching)
type UpdateRequest = Database['public']['Tables']['requests']['Update']
type UpdateHotel = Database['public']['Tables']['hotels']['Update']

// Enum types
type AppRole = Database['public']['Enums']['app_role']
type RequestStatus = Database['public']['Enums']['request_status']
type RequestPriority = Database['public']['Enums']['request_priority']
type RequestCategory = Database['public']['Enums']['request_category']
type BookingStatus = Database['public']['Enums']['booking_status']
type StayStatus = Database['public']['Enums']['stay_status']
type RoomStatus = Database['public']['Enums']['room_status']
type DepartmentType = Database['public']['Enums']['department_type']
```

---

## Table Count Summary

| Category | Count |
|----------|-------|
| Existing tables | 19 |
| New production tables | 9 |
| **Total tables** | **28** |
| Enums | 8 |
| Security-definer functions | 8 |
| Triggers | 17 |
