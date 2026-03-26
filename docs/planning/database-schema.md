# Innara -- Database Schema

## Source
The baseline schema comes from existing Supabase migrations at:
`~/Desktop/innara-service-hub-main/supabase/migrations/`

These migrations contain the core tables. Phase 1 will consolidate and extend them.

## Core Tables (from existing schema)

### profiles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK, FK auth.users) | |
| email | text | |
| full_name | text | |
| role | text | guest, staff, manager, admin |
| hotel_id | uuid (FK hotels) | nullable for admin |
| avatar_url | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### hotels
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| name | text | |
| slug | text (unique) | URL-safe identifier |
| description | text | |
| address | text | |
| city | text | |
| country | text | |
| phone | text | |
| email | text | |
| logo_url | text | |
| settings | jsonb | hotel-specific config |
| created_at | timestamptz | |

### rooms
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| hotel_id | uuid (FK hotels) | |
| room_number | text | |
| room_type | text | |
| floor | integer | |
| status | text | available, occupied, maintenance |
| created_at | timestamptz | |

### stays
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| hotel_id | uuid (FK hotels) | |
| guest_id | uuid (FK profiles) | |
| room_id | uuid (FK rooms) | |
| check_in | timestamptz | |
| check_out | timestamptz | |
| status | text | active, checked_out, cancelled |
| created_at | timestamptz | |

### requests
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| hotel_id | uuid (FK hotels) | |
| guest_id | uuid (FK profiles) | |
| assigned_to | uuid (FK profiles) | nullable |
| type | text | housekeeping, maintenance, etc |
| title | text | |
| description | text | |
| status | text | pending, in_progress, completed, cancelled |
| priority | text | low, medium, high, urgent |
| created_at | timestamptz | |
| completed_at | timestamptz | nullable |

### orders (room service)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| hotel_id | uuid (FK hotels) | |
| guest_id | uuid (FK profiles) | |
| stay_id | uuid (FK stays) | |
| status | text | pending, preparing, delivering, delivered, cancelled |
| total | numeric | |
| notes | text | |
| created_at | timestamptz | |

### messages
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| hotel_id | uuid (FK hotels) | |
| sender_id | uuid (FK profiles) | |
| recipient_id | uuid (FK profiles) | nullable (broadcast) |
| content | text | |
| read | boolean | |
| created_at | timestamptz | |

## New Tables (to be created in Phase 1+)

### ai_conversations
- id, hotel_id, guest_id, stay_id, messages (jsonb array), created_at, updated_at

### shifts
- id, hotel_id, staff_id, start_time, end_time, role, notes, created_at

### analytics_snapshots
- id, hotel_id, date, metric_type, value (jsonb), created_at

### subscriptions
- id, hotel_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_start, current_period_end, created_at

### integrations
- id, hotel_id, type (opera, cloudbeds, etc), config (jsonb encrypted), status, last_sync_at, created_at

### branding
- id, hotel_id, logo_url, primary_color, secondary_color, custom_domain, created_at, updated_at
