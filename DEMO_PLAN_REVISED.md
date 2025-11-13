# INNARA DEMO - REVISED COMPREHENSIVE BUILD PLAN

> **CRITICAL ISSUES FIXED:**
> - ✅ Demo control mechanism defined
> - ✅ State synchronization strategy specified
> - ✅ Component reusability enforced
> - ✅ All navigation flows documented
> - ✅ Error & loading states defined
> - ✅ Missing TypeScript architecture added
> - ✅ Icon library decided (Lucide React)
> - ✅ Image sources specified
> - ✅ Z-index scale defined
> - ✅ All animation variants detailed

---

## 🎯 Demo Objective
60-second pre-recorded demo showing:
- Guest makes AI chatbot request (housekeeping) + traditional order (room service)
- Hotel dashboard receives requests in real-time with AI-powered insights and time estimates

**Demo Control Method:** Manual clicks with keyboard shortcuts (Space = advance step, R = reset)

---

## 📋 Project Overview

### Tech Stack
- [ ] Next.js 14 (App Router)
- [ ] React 18
- [ ] TypeScript
- [ ] Tailwind CSS
- [ ] Framer Motion (animations)
- [ ] Lucide React (icons) **[DECIDED]**
- [ ] Zustand (lightweight state management) **[NEW]**
- [ ] Vercel (deployment)

### Demo Structure
- Route 1: `/guest` - Mobile guest app (iPhone 14 Pro: 393x852px)
- Route 2: `/dashboard` - Hotel desktop dashboard (1920x1080px)
- Route 3: `/demo-control` - Hidden control panel for advancing demo **[NEW]**

### State Synchronization Strategy **[NEW]**
- Zustand store shared across both routes
- Events dispatched via store actions
- Demo sequencer controls timing
- LocalStorage backup for page refresh recovery

---

## 🎨 DESIGN SYSTEM (COMPLETE)

### Color Palette
- [ ] **Primary Navy**: `#1a1d3a`
- [ ] **Accent Gold**: `#d4af37`
- [ ] **Gold Gradient Start**: `#f4e4b0`
- [ ] **Gold Gradient End**: `#d4af37`
- [ ] **Background Dark**: `#0f1117`
- [ ] **Background Light**: `#ffffff`
- [ ] **Background Gray**: `#f9fafb`
- [ ] **Glass Background**: `rgba(255, 255, 255, 0.1)`
- [ ] **Glass Border**: `rgba(255, 255, 255, 0.2)`
- [ ] **Text Primary**: `#1a1d3a`
- [ ] **Text Secondary**: `#6b7280`
- [ ] **Text Tertiary**: `#9ca3af`
- [ ] **Text Light**: `#ffffff`
- [ ] **Success Green**: `#10b981`
- [ ] **Success Light**: `#d1fae5`
- [ ] **Warning Orange**: `#f59e0b`
- [ ] **Warning Light**: `#fed7aa`
- [ ] **Error Red**: `#ef4444`
- [ ] **Info Blue**: `#3b82f6`
- [ ] **Info Light**: `#eff6ff`
- [ ] **Border Light**: `#e5e7eb`
- [ ] **Border Default**: `#d1d5db`
- [ ] **Hover Navy**: `#252a50` **[NEW]**
- [ ] **Hover Gold**: `#e5be50` **[NEW]**
- [ ] **Disabled Gray**: `#f3f4f6` **[NEW]**
- [ ] **Disabled Text**: `#d1d5db` **[NEW]**
- [ ] **Focus Ring**: `#d4af37` with `0 0 0 3px rgba(212,175,55,0.2)` **[NEW]**

### Typography
- [ ] **Font Primary**: `Inter` (Google Fonts)
- [ ] **Font Fallback**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- [ ] **Heading XL**: `text-4xl font-bold leading-tight` (36px)
- [ ] **Heading Large**: `text-3xl font-bold leading-tight` (30px)
- [ ] **Heading Medium**: `text-2xl font-semibold leading-snug` (24px)
- [ ] **Heading Small**: `text-xl font-semibold leading-snug` (20px)
- [ ] **Body Large**: `text-lg font-normal leading-relaxed` (18px)
- [ ] **Body Regular**: `text-base font-normal leading-normal` (16px)
- [ ] **Body Small**: `text-sm font-normal leading-normal` (14px)
- [ ] **Caption**: `text-xs font-medium leading-tight` (12px)

### Spacing Scale
- [ ] `xs`: 4px (1)
- [ ] `sm`: 8px (2)
- [ ] `md`: 16px (4)
- [ ] `lg`: 24px (6)
- [ ] `xl`: 32px (8)
- [ ] `2xl`: 48px (12)
- [ ] `3xl`: 64px (16)

### Border Radius
- [ ] `rounded-sm`: 4px
- [ ] `rounded-md`: 8px
- [ ] `rounded-lg`: 12px
- [ ] `rounded-xl`: 16px
- [ ] `rounded-2xl`: 24px
- [ ] `rounded-full`: 9999px

### Shadows
- [ ] **Shadow SM**: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- [ ] **Shadow MD**: `0 4px 6px -1px rgb(0 0 0 / 0.1)`
- [ ] **Shadow LG**: `0 10px 15px -3px rgb(0 0 0 / 0.1)`
- [ ] **Shadow XL**: `0 20px 25px -5px rgb(0 0 0 / 0.1)`
- [ ] **Shadow 2XL**: `0 25px 50px -12px rgb(0 0 0 / 0.25)` **[NEW]**
- [ ] **Shadow Inner**: `inset 0 2px 4px 0 rgb(0 0 0 / 0.05)` **[NEW]**
- [ ] **Shadow Glow Gold**: `0 0 20px rgba(212, 175, 55, 0.3)`
- [ ] **Shadow Glow Gold Strong**: `0 0 30px rgba(212, 175, 55, 0.5)` **[NEW]**

### Z-Index Scale **[NEW]**
- [ ] `z-0`: Base layer (0)
- [ ] `z-10`: Elevated elements (10)
- [ ] `z-20`: Sticky headers (20)
- [ ] `z-30`: Floating buttons (30)
- [ ] `z-40`: Dropdowns (40)
- [ ] `z-50`: Modals/overlays (50)
- [ ] `z-60`: Tooltips (60)
- [ ] `z-999`: Demo control panel (999)

### Backdrop Blur Values **[NEW]**
- [ ] `backdrop-blur-sm`: 4px
- [ ] `backdrop-blur`: 8px
- [ ] `backdrop-blur-md`: 12px
- [ ] `backdrop-blur-lg`: 16px
- [ ] `backdrop-blur-xl`: 24px
- [ ] `backdrop-blur-2xl`: 40px

### Transition Easing **[NEW]**
- [ ] **Ease Out**: `cubic-bezier(0, 0, 0.2, 1)` - Opening, appearing
- [ ] **Ease In**: `cubic-bezier(0.4, 0, 1, 1)` - Closing, disappearing
- [ ] **Ease In Out**: `cubic-bezier(0.4, 0, 0.2, 1)` - Smooth both ways
- [ ] **Spring**: `cubic-bezier(0.34, 1.56, 0.64, 1)` - Bouncy effect

### Animation Durations
- [ ] **Instant**: 0ms (no animation)
- [ ] **Fast**: 150ms (micro-interactions)
- [ ] **Normal**: 300ms (standard transitions)
- [ ] **Slow**: 500ms (page transitions)
- [ ] **Slower**: 700ms (dramatic reveals)

### Opacity Scale **[NEW]**
- [ ] `opacity-0`: 0
- [ ] `opacity-10`: 0.1
- [ ] `opacity-20`: 0.2
- [ ] `opacity-50`: 0.5
- [ ] `opacity-70`: 0.7
- [ ] `opacity-80`: 0.8
- [ ] `opacity-90`: 0.9
- [ ] `opacity-100`: 1

---

## 🏗️ ARCHITECTURE & STATE MANAGEMENT **[NEW SECTION]**

### Zustand Store Structure
```typescript
interface DemoStore {
  // Demo control
  currentStep: number
  isPlaying: boolean
  completedSteps: number[]

  // Guest state
  chatMessages: Message[]
  cartItems: CartItem[]
  currentView: 'chat' | 'room-service' | 'checkout'

  // Dashboard state
  requests: Request[]
  stats: Stats
  activities: Activity[]

  // Actions
  nextStep: () => void
  resetDemo: () => void
  addMessage: (message: Message) => void
  addToCart: (item: CartItem) => void
  placeOrder: () => void
  syncToDashboard: () => void
}
```

### TypeScript Interfaces **[NEW]**
```typescript
// /types/index.ts

interface Message {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  timestamp: Date
  aiPrediction?: string
}

interface CartItem {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  image: string
}

interface Request {
  id: string
  guestName: string
  room: string
  item: string
  category: 'housekeeping' | 'room_service' | 'valet' | 'other'
  status: 'pending' | 'in_progress' | 'completed'
  requestedAt: string
  staffName: string
  staffAvatar: string
  estimatedTime?: string
  isNew?: boolean
}

interface Stats {
  totalRequests: number
  housekeeping: number
  roomService: number
  valet: number
}

interface Activity {
  id: string
  text: string
  timestamp: string
  type: string
}

interface FoodItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string
  aiPick: boolean
  estimatedPrepTime: number
}
```

### Demo Sequencer Logic **[NEW]**
```typescript
// /lib/demoSequencer.ts

const DEMO_STEPS = [
  { id: 1, action: 'showChatInput', delay: 0 },
  { id: 2, action: 'typeMessage', delay: 800 },
  { id: 3, action: 'showAIResponse', delay: 1200 },
  { id: 4, action: 'showTimePills', delay: 300 },
  { id: 5, action: 'selectTime', delay: 0 },
  { id: 6, action: 'showConfirmation', delay: 1000 },
  { id: 7, action: 'navigateToRoomService', delay: 500 },
  { id: 8, action: 'addToCart', delay: 0 },
  { id: 9, action: 'openCheckout', delay: 400 },
  { id: 10, action: 'placeOrder', delay: 0 },
  { id: 11, action: 'transitionToDashboard', delay: 800 },
  { id: 12, action: 'showRequest1', delay: 2000 },
  { id: 13, action: 'showRequest2', delay: 2500 },
]
```

---

## 📱 GUEST MOBILE APP - Complete Specification

### Navigation Flow **[NEW]**
```
[Chat View]
  → Click "Room Service" button
  → [Room Service View]
  → Click food item
  → [Floating Cart appears]
  → Click cart
  → [Checkout Modal]
  → Place order
  → [Success Confirmation]
  → Auto-dismiss (3s)
  → Back to [Chat View] (shows order confirmation message)
```

### Page Structure: `/guest`

#### Shared Components **[CLARIFIED]**
- [ ] Create `<AppContainer>` wrapper (handles demo step listening)
- [ ] Create `<GuestLayout>` (includes TopBar + content area)

#### Top Bar (Fixed) - Component: `TopBar.tsx`
- [ ] Height: 60px
- [ ] Background: Glassmorphism (`backdrop-blur-xl bg-white/10`)
- [ ] Border bottom: `1px solid rgba(255,255,255,0.2)`
- [ ] z-index: 20
- [ ] Content:
  - [ ] Left: INNARA logo (32px) - `<Logo size="sm" />`
  - [ ] Center: "Room 1204" (text-sm, gold)
  - [ ] Right: User avatar - `<Avatar initials="SA" size="sm" />`
- [ ] Sticky on scroll
- [ ] Drop shadow on scroll (transition on scroll > 10px)
- [ ] **Props:** `roomNumber: string, userName: string`

#### Welcome Section - Component: `WelcomeSection.tsx`
- [ ] Padding: `32px 20px`
- [ ] Background: Gradient navy to dark (`bg-gradient-to-b from-[#1a1d3a] to-[#0f1117]`)
- [ ] Content:
  - [ ] Greeting: "Welcome back, Sarah" (text-2xl, white, font-semibold)
  - [ ] Subtitle: "How can we help you today?" (text-sm, white/70)
  - [ ] Spacing between: 8px
- [ ] **Props:** `name: string`

#### AI Chat Interface - Component: `ChatInterface.tsx`

##### Container
- [ ] Container padding: `24px 20px`
- [ ] Background: White
- [ ] Border radius top: `32px` (curves over gradient)
- [ ] Position: Negative margin to overlap gradient (-24px)
- [ ] Min height: `calc(100vh - 300px)`
- [ ] Scroll behavior: Auto-scroll to bottom on new message **[NEW]**

##### Chat Input - Component: `ChatInput.tsx`
- [ ] Width: 100% (with 20px horizontal margin)
- [ ] Height: Auto-expand (min 56px, max 120px)
- [ ] Background: White with gold border
- [ ] Border: `2px solid #d4af37`
- [ ] Border radius: `28px` (pill shape)
- [ ] Padding: `16px 60px 16px 20px`
- [ ] Placeholder: "What do you need today?" (text-gray-400)
- [ ] Font: text-base
- [ ] Shadow: Gold glow on focus
- [ ] Focus ring: `ring-2 ring-gold/20`
- [ ] **State:** Controlled input
- [ ] **Props:** `value, onChange, onSubmit, disabled`
- [ ] **Keyboard:** Enter to submit, Shift+Enter for new line **[NEW]**

##### AI Sparkle Button - Component: `AIButton.tsx`
- [ ] Position: Absolute right (16px from edge)
- [ ] Size: 40px circular button
- [ ] Background: Gold gradient (`bg-gradient-to-br from-[#f4e4b0] to-[#d4af37]`)
- [ ] Icon: Sparkles (Lucide) (white, 20px)
- [ ] Animation: Gentle pulse when idle (scale 1 to 1.05, 2s loop)
- [ ] Hover: Scale 1.1, shadow glow strong
- [ ] Active: Scale 0.95
- [ ] Disabled: Opacity 50%, no animation
- [ ] **Props:** `onClick, disabled, loading`

##### Message Bubble - Component: `MessageBubble.tsx`
**Variants: 'user' | 'ai' | 'system'**

**User Message:**
- [ ] Background: `#f3f4f6` (light gray)
- [ ] Padding: `12px 16px`
- [ ] Border radius: `16px 16px 4px 16px`
- [ ] Max width: 80%
- [ ] Align: Right (ml-auto)
- [ ] Font: text-base
- [ ] Color: `#1a1d3a`
- [ ] Animation: Slide up + fade in (300ms ease-out)

**AI Message:**
- [ ] Background: Gold gradient
- [ ] Padding: `14px 18px`
- [ ] Border radius: `16px 16px 16px 4px`
- [ ] Max width: 85%
- [ ] Align: Left (mr-auto)
- [ ] Font: text-base
- [ ] Color: White
- [ ] AI badge: Small "AI" pill (absolute top-left -8px, 20px height, white bg, gold text, text-xs)
- [ ] Animation: Typing indicator → fade in message

**Props:** `type, content, timestamp, aiPrediction?`

##### Typing Indicator - Component: `TypingIndicator.tsx`
- [ ] 3 dots (6px each, gold)
- [ ] Animation: Bounce with 120ms stagger
- [ ] Container: Same as AI message bubble but min-height 40px
- [ ] **Framer Motion variants:**
```typescript
const dotVariants = {
  initial: { y: 0 },
  animate: { y: -8 },
}
// Stagger: 0.12s per dot
```

##### Time Selection Pills - Component: `TimePills.tsx`
- [ ] Appears 300ms after AI message
- [ ] 3 buttons: ["Now", "In 30 min", "In 1 hour"]
- [ ] Layout: Flex row, gap 8px, flex-wrap
- [ ] Each pill:
  - [ ] Background: White
  - [ ] Border: `1px solid #e5e7eb`
  - [ ] Padding: `10px 20px`
  - [ ] Border radius: `20px`
  - [ ] Font: text-sm, semibold
  - [ ] Hover: Gold border + gold text + scale 1.05
  - [ ] Active/Selected: Gold background + white text + scale 0.95
  - [ ] Transition: 150ms ease-out
  - [ ] After selection: Fade out other pills, selected pill morphs into user message **[NEW]**
- [ ] **Props:** `options: string[], onSelect: (value: string) => void`

##### ML Estimate Badge - Component: `MLBadge.tsx` **[NEW]**
- [ ] Size: Small pill (auto-width, 24px height)
- [ ] Background: Transparent
- [ ] Border: `1px solid #d4af37`
- [ ] Text: "AI Predicted" (text-xs, gold)
- [ ] Icon: Sparkles (10px)
- [ ] Padding: `4px 10px`
- [ ] Border radius: `12px`
- [ ] Animation: Fade scale in (200ms)
- [ ] **Props:** `label?: string`

---

#### Quick Actions Section - Component: `QuickActions.tsx`

##### Header
- [ ] Title: "Quick Actions" (text-lg, semibold, padding 24px 20px 12px)

##### Grid
- [ ] Grid: 4 columns, gap 12px
- [ ] Padding: 0 20px 20px
- [ ] **Scroll into view when chat complete** **[NEW]**

##### Action Button - Component: `ActionButton.tsx`
- [ ] Size: Square aspect ratio (responsive)
- [ ] Background: White
- [ ] Border: `1px solid #f3f4f6`
- [ ] Border radius: `16px`
- [ ] Padding: `16px 12px`
- [ ] Flex column, items center, gap 8px
- [ ] Hover: Gold border + shadow-lg + translateY(-2px)
- [ ] Active: Scale 0.95
- [ ] Transition: 200ms ease-out
- [ ] Icon: 24px (gold)
- [ ] Label: text-xs, navy, text-center
- [ ] Badge (optional): Absolute top-right (-4px, -4px), green dot 8px
- [ ] **Props:** `icon: LucideIcon, label: string, badge?: boolean, onClick: () => void, highlight?: boolean`

**8 Buttons:**
1. Housekeeping (Broom icon) - badge: true
2. Room Service (UtensilsCrossed icon) - highlight: true
3. Valet (Car icon)
4. Spa (Flower2 icon)
5. Concierge (Bell icon)
6. Laundry (Shirt icon)
7. Maintenance (Wrench icon)
8. Checkout (Clock icon)

---

#### Room Service View - Component: `RoomServiceMenu.tsx`

##### Transition **[NEW]**
- [ ] Trigger: Click "Room Service" action button
- [ ] Animation sequence:
  1. Quick actions fade out + slide down (200ms)
  2. Room service menu slide up from bottom (400ms ease-out)
  3. Back button fade in (200ms delay)

##### Back Button **[NEW]**
- [ ] Position: Absolute top-left (16px, 16px)
- [ ] Icon: ChevronLeft (Lucide, 20px, navy)
- [ ] Text: "Back" (text-sm, navy)
- [ ] Hover: Opacity 70%
- [ ] Click: Reverse transition back to chat view

##### Menu Header
- [ ] Title: "Room Service" (text-2xl, semibold, navy)
- [ ] Subtitle: "Available 24/7" (text-sm, gray)
- [ ] Padding: 24px 20px 16px

##### AI Suggestion Banner - Component: `AISuggestionBanner.tsx` **[NEW]**
- [ ] Background: Light gold (`#fef9e7`)
- [ ] Border left: `4px solid #d4af37`
- [ ] Padding: `12px 16px`
- [ ] Border radius: `8px`
- [ ] Margin: 0 20px 16px
- [ ] Icon: Sparkles (gold, 16px)
- [ ] Text: "💡 Popular right now: Caesar Salad" (text-sm, navy)
- [ ] Animation: Slide in from left (300ms)
- [ ] **Props:** `suggestion: string`

##### Category Tabs - Component: `CategoryTabs.tsx` **[NEW]**
- [ ] Container: Horizontal scroll, hide scrollbar
- [ ] Padding: 0 20px
- [ ] Margin bottom: 16px
- [ ] Tabs: ["Popular", "Breakfast", "Lunch", "Dinner", "Drinks", "Desserts"]
- [ ] Each tab:
  - [ ] Padding: `10px 20px`
  - [ ] Border radius: `20px`
  - [ ] Border: `1px solid #e5e7eb`
  - [ ] Active: Gold background, white text, border-gold
  - [ ] Inactive: White background, navy text
  - [ ] Hover (inactive): Gold border
  - [ ] Transition: 200ms
- [ ] **Props:** `categories: string[], active: string, onChange: (cat: string) => void`

##### Food Grid
- [ ] Padding: 20px
- [ ] Gap: 16px
- [ ] Flex column (1 column on mobile)

##### Food Card - Component: `FoodCard.tsx`
- [ ] Height: 120px
- [ ] Background: White
- [ ] Border: `1px solid #f3f4f6`
- [ ] Border radius: `16px`
- [ ] Shadow: MD
- [ ] Padding: `12px`
- [ ] Layout: Horizontal (image left, content center, button right)
- [ ] Hover: Shadow-lg + border-gold + translateY(-2px)
- [ ] Transition: 200ms ease-out

**Image Section:**
- [ ] Size: 96x96px
- [ ] Border radius: `12px`
- [ ] Object-fit: cover
- [ ] Loading: Skeleton pulse **[NEW]**
- [ ] Error: Placeholder icon (ImageOff from Lucide, gray) **[NEW]**
- [ ] AI Pick badge (if applicable): Absolute top-right of image
  - Background: Gold
  - Text: "AI Pick" (text-xs, white)
  - Padding: `4px 8px`
  - Border radius: `6px`

**Content Section:**
- [ ] Title: text-base, semibold, navy
- [ ] Description: text-xs, gray, line-clamp-1
- [ ] Price: text-sm, semibold, gold, mt-auto

**Add Button:**
- [ ] Size: 40px circular
- [ ] Background: Gold gradient
- [ ] Icon: Plus (white, 20px)
- [ ] Hover: Scale 1.1
- [ ] Active: Scale 0.95
- [ ] On add:
  - Icon rotates 90deg
  - Changes to Checkmark icon
  - Background changes to green
  - Revert after 1s **[NEW]**

**Props:** `item: FoodItem, onAdd: (item: FoodItem) => void, isAdded?: boolean`

**4 Food Items:**
1. Caesar Salad (aiPick: true) - Image: `/images/caesar-salad.jpg`
2. Margherita Pizza - Image: `/images/margherita-pizza.jpg`
3. Grilled Salmon - Image: `/images/grilled-salmon.jpg`
4. Arabic Mezze Platter - Image: `/images/mezze-platter.jpg`

---

#### Floating Cart Button - Component: `FloatingCart.tsx`
- [ ] Position: Fixed bottom 20px, left 20px, right 20px
- [ ] Width: calc(100% - 40px)
- [ ] Height: 56px
- [ ] Background: Gold gradient
- [ ] Border radius: `28px`
- [ ] Shadow: XL with gold glow
- [ ] z-index: 30
- [ ] Content (flex row, items center, justify between):
  - [ ] Left: ShoppingCart icon (white, 20px)
  - [ ] Center: "View Order • 1 item" (white, text-base, semibold)
  - [ ] Right: "$12" (white, text-lg, bold)
- [ ] Animation: Slide up from bottom (400ms ease-out)
- [ ] Tap: Opens checkout modal
- [ ] Hover: Scale 1.02, shadow 2XL
- [ ] Active: Scale 0.98
- [ ] **Trigger:** Appears when cartItems.length > 0
- [ ] **Props:** `itemCount: number, total: number, onClick: () => void`

---

#### Checkout Modal - Component: `CheckoutModal.tsx`

##### Overlay
- [ ] Background: `rgba(0,0,0,0.6)`
- [ ] Backdrop blur: `backdrop-blur-sm`
- [ ] z-index: 50
- [ ] Click outside to close **[NEW]**

##### Modal (Bottom Sheet)
- [ ] Position: Fixed bottom 0, left 0, right 0
- [ ] Background: White
- [ ] Border radius top: `32px`
- [ ] Height: 60vh
- [ ] Slide animation: Up from bottom (400ms ease-out)
- [ ] Shadow: 2XL
- [ ] Padding: 24px 20px

##### Handle Bar **[NEW]**
- [ ] Width: 40px
- [ ] Height: 4px
- [ ] Background: Gray/30
- [ ] Border radius: Full
- [ ] Centered horizontally
- [ ] Margin bottom: 16px
- [ ] Draggable (optional, for polish)

##### Content
**Header:**
- [ ] Title: "Your Order" (text-xl, semibold, navy)
- [ ] Close button (absolute top-right): X icon, 32px button **[NEW]**

**Order Item:** (Component: `OrderItem.tsx` **[NEW]**)
- [ ] Layout: Horizontal
- [ ] Image: 60x60px, rounded
- [ ] Title + description (text-sm)
- [ ] Quantity controls:
  - [ ] Minus button (32px, border, disabled if qty=1)
  - [ ] Quantity number (text-base, semibold)
  - [ ] Plus button (32px, gold)
- [ ] Price (gold, text-base, semibold)
- [ ] Remove button (text-xs, red, underline) **[NEW]**

**Delivery Estimate Section:**
- [ ] Background: Info light (`#eff6ff`)
- [ ] Border left: `4px solid #3b82f6`
- [ ] Padding: `12px 16px`
- [ ] Border radius: `8px`
- [ ] Margin: 16px 0
- [ ] Icon: Clock (blue, 16px)
- [ ] Text: "⏱️ Estimated delivery: **~32 minutes**" (text-sm, navy)
- [ ] Subtext: "Kitchen is busy" (text-xs, gray)
- [ ] ML badge: `<MLBadge />` aligned right

**Special Instructions:** (Component: `Textarea.tsx` **[NEW]**)
- [ ] Label: "Special requests" (text-sm, gray, mb-2)
- [ ] Placeholder: "Any special requests?"
- [ ] Border: `1px solid #e5e7eb`
- [ ] Border radius: `12px`
- [ ] Padding: `12px 16px`
- [ ] Max height: 80px
- [ ] Resize: vertical
- [ ] Focus: Gold ring
- [ ] Character limit: 200 (show counter) **[NEW]**

**Price Breakdown:**
- [ ] Subtotal: $12 (flex justify-between, text-sm, gray)
- [ ] Service fee: $2 (flex justify-between, text-sm, gray)
- [ ] Border top: 1px solid gray/20
- [ ] Total: $14 (flex justify-between, text-xl, bold, gold)

**Place Order Button:** (Reuse `<Button variant="primary" size="lg" />`)
- [ ] Full width
- [ ] Height: 56px
- [ ] Background: Gold gradient
- [ ] Border radius: `28px`
- [ ] Text: "Place Order" (white, text-lg, semibold)
- [ ] Icon: ArrowRight (white, 20px)
- [ ] Loading state: Spinner icon, text "Placing..." **[NEW]**
- [ ] Disabled state: Gray background, cursor not-allowed **[NEW]**
- [ ] Hover: Darken 10%
- [ ] Active: Scale 0.98

##### Success Confirmation **[NEW]**
- [ ] Replace modal content with:
  - Checkmark circle (green, 80px, scale in animation)
  - Text: "Order Placed! 🎉" (text-2xl, semibold, navy)
  - Subtext: "We'll deliver in ~32 minutes" (text-sm, gray)
  - Button: "Track Order" (gold outline) - **Non-functional for demo**
- [ ] Auto-dismiss: 3 seconds
- [ ] On dismiss:
  - Close modal
  - Return to chat view
  - Add system message: "Your order has been placed! Caesar Salad will arrive in ~32 minutes."

**Props:** `isOpen: boolean, onClose: () => void, cartItems: CartItem[], onPlaceOrder: () => void`

---

## 🖥️ HOTEL DASHBOARD - Complete Specification

### Page Structure: `/dashboard`

#### Layout Component: `DashboardLayout.tsx` **[NEW]**
- [ ] Contains `<TopNav />` + main content area
- [ ] Background: `#f9fafb`
- [ ] Min height: 100vh

#### Top Navigation Bar - Component: `TopNav.tsx`

##### Container
- [ ] Height: 72px
- [ ] Background: Glassmorphism navy (`backdrop-blur-xl bg-[#1a1d3a]/90`)
- [ ] Border bottom: `1px solid rgba(212, 175, 55, 0.2)`
- [ ] Padding: 0 48px
- [ ] Sticky on scroll (z-index: 20)
- [ ] Shadow: MD (appears on scroll)

##### Left Section
- [ ] INNARA logo (40px) + "INNARA" text (text-xl, gold, semibold)
- [ ] Spacing: 12px gap
- [ ] Component: `<Logo size="md" showText />`

##### Center Section - Tabs
- [ ] Tabs: ["Dashboard", "Requests", "Rooms", "Reports"]
- [ ] Spacing: 32px gap
- [ ] Each tab:
  - Text: text-sm, semibold
  - Active: Gold + 3px bottom border + bold
  - Inactive: White/70 + hover white
  - Transition: 200ms
  - Cursor: pointer
  - **Note:** Only "Dashboard" functional for demo **[NEW]**

##### Right Section
- [ ] Notification bell:
  - Icon: Bell (Lucide, 20px, gold)
  - Badge: Absolute top-right, red dot 8px, white border 2px
  - Badge text: "2" (text-xs, white)
  - Hover: Opacity 80%
  - **Note:** Non-functional for demo **[NEW]**
- [ ] User avatar:
  - Component: `<Avatar initials="JM" size="md" name="James Mitchell" />`
  - Dropdown icon: ChevronDown (12px, white/70)
  - Hover: Opacity 80%
  - **Note:** Non-functional for demo **[NEW]**
- [ ] Spacing: 16px gap

**Props:** `activeTab?: string`

---

#### Main Content Grid
- [ ] Padding: 48px
- [ ] Layout: CSS Grid, 12 columns, gap 24px
- [ ] Responsive: Stack on < 1280px (not needed for demo but good practice)

---

#### Stats Cards Row - Component: `StatsRow.tsx`
- [ ] Grid: 4 columns, each 3/12 width
- [ ] Gap: 24px
- [ ] Margin bottom: 24px

##### Stat Card - Component: `StatCard.tsx`
- [ ] Background: White
- [ ] Border: `1px solid #f3f4f6`
- [ ] Border radius: `16px`
- [ ] Padding: `24px`
- [ ] Shadow: MD
- [ ] Transition: All 200ms
- [ ] Hover: Shadow-lg + translateY(-2px)

**Content:**
- [ ] Icon container:
  - Size: 48px circle
  - Background: Gold/10
  - Icon: 24px, gold
  - Margin bottom: 12px
- [ ] Label: text-sm, gray, uppercase, tracking-wide, mb-2
- [ ] Value: text-4xl, semibold, navy, mb-1
- [ ] Change indicator (optional):
  - Text: text-sm, green (if positive) or red (if negative)
  - Icon: TrendingUp or TrendingDown (12px)
  - Format: "+2 today"

**Count-Up Animation:** **[NEW]**
```typescript
// Use react-countup or custom hook
// Duration: 500ms
// Easing: ease-out
// Trigger: On value change
```

**Pulse Animation on Update:** **[NEW]**
```typescript
// Framer Motion variant
const pulseVariant = {
  initial: { scale: 1, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
  pulse: {
    scale: [1, 1.02, 1],
    boxShadow: [
      '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      '0 0 20px rgba(212, 175, 55, 0.3)',
      '0 4px 6px -1px rgb(0 0 0 / 0.1)'
    ],
    transition: { duration: 0.4 }
  }
}
```

**Props:** `icon: LucideIcon, label: string, value: number, change?: {value: number, trend: 'up'|'down'}`

**4 Cards:**
1. Total Requests (ClipboardList icon) - Value: 42 → 44, Change: +2 today (green)
2. Housekeeping (Broom icon) - Value: 14 → 15
3. Room Service (UtensilsCrossed icon) - Value: 9 → 10, Change: +1 today (green)
4. Valet (Car icon) - Value: 7

---

#### Main Dashboard Grid (2 columns)

##### Left Column (8/12 width): Requests Table

**Section Header:**
- [ ] Title: "Active Requests" (text-2xl, semibold, navy)
- [ ] Filter button (right aligned):
  - Text: "Filter" (text-sm, navy)
  - Icon: SlidersHorizontal (16px, navy)
  - Border: 1px solid gold
  - Padding: `8px 16px`
  - Border radius: `8px`
  - Hover: Gold background, white text
  - **Note:** Non-functional for demo **[NEW]**
- [ ] Spacing: 32px margin bottom

**Table Container:** - Component: `RequestsTable.tsx`
- [ ] Background: White
- [ ] Border: `1px solid #f3f4f6`
- [ ] Border radius: `16px`
- [ ] Shadow: MD
- [ ] Padding: 24px
- [ ] Max height: 600px
- [ ] Overflow-y: Auto
- [ ] Custom scrollbar: **[NEW]**
```css
scrollbar-width: thin;
scrollbar-color: #d4af37 #f3f4f6;

::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #f3f4f6; }
::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #e5be50; }
```

**Table Header:**
- [ ] Columns: Guest | Room | Requested Item | Status | Requested | Staff
- [ ] Column widths: 20% | 10% | 25% | 15% | 15% | 15%
- [ ] Text: text-xs, uppercase, gray, semibold, tracking-wide
- [ ] Padding bottom: 16px
- [ ] Border bottom: `1px solid #f3f4f6`

**Table Row:** - Component: `RequestRow.tsx`
- [ ] Height: 64px
- [ ] Border bottom: `1px solid #f9fafb`
- [ ] Hover: Background `#f9fafb`, cursor pointer **[NEW]**
- [ ] Transition: Background 150ms
- [ ] Padding: 12px 0
- [ ] Align items: Center

**Cells:**
- [ ] Guest: text-sm, semibold, navy
- [ ] Room: text-sm, navy, font-mono
- [ ] Item: text-sm, navy
- [ ] Status: `<StatusBadge status={status} />`
- [ ] Requested: text-sm, gray, with "NEW" pill if applicable
- [ ] Staff: `<StaffAvatar {...staff} />`

**New Request Animation:** **[NEW]**
```typescript
const newRequestVariant = {
  initial: { y: -20, opacity: 0, backgroundColor: 'transparent' },
  enter: {
    y: 0,
    opacity: 1,
    backgroundColor: '#fef9e7',
    transition: { duration: 0.6, ease: 'easeOut' }
  },
  settled: {
    backgroundColor: '#ffffff',
    transition: { delay: 2, duration: 0.5 }
  }
}
```

**Props:** `request: Request`

**Status Badge:** - Component: `StatusBadge.tsx`
- [ ] Variants: pending | in_progress | completed
- [ ] Pending: Yellow bg (`#fef3c7`), yellow text (`#d97706`)
- [ ] In Progress: Orange bg (`#fed7aa`), orange text (`#ea580c`)
- [ ] Completed: Green bg (`#d1fae5`), green text (`#059669`)
- [ ] Padding: `6px 12px`
- [ ] Border radius: Full
- [ ] Text: text-xs, semibold, capitalize
- [ ] Icon (optional):
  - Pending: Clock (12px)
  - In Progress: Loader (12px, spinning)
  - Completed: CheckCircle (12px)

**Props:** `status: 'pending' | 'in_progress' | 'completed'`

**Staff Avatar:** - Component: `StaffAvatar.tsx`
- [ ] Size: 32px circle
- [ ] Initials: 2 letters, text-xs, white, uppercase
- [ ] Background: Deterministic color based on name hash **[NEW]**
```typescript
const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b']
const getColor = (name: string) => {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}
```
- [ ] Border: `2px solid white`
- [ ] Tooltip on hover: Full name (optional) **[NEW]**

**Props:** `name: string, initials?: string`

**7 Rows Total:** (5 existing + 2 new)
1. Benjamin Turner, 305, Towels, In Progress, 10 min ago, James
2. Emma Johnson, 420, Margherita Pizza, Pending, 20 min ago, Olivia
3. William Harris, 512, Car Retrieval, Pending, 30 min ago, Ahmed
4. Olivia Martinez, 203, Room Cleaning, Pending, 30 min ago, Michael
5. Michael Brown, 210, Extra Pillows, In Progress, 45 min ago, Sarah
6. **[NEW]** Sarah Ahmed, 1204, Room Cleaning, Pending, Just now, James, ~18 min estimate
7. **[NEW]** Sarah Ahmed, 1204, Caesar Salad, Pending, Just now, Olivia, ~32 min estimate

---

##### Right Column (4/12 width): AI Insights Panel

**Component:** `AIInsightsPanel.tsx`

**Section Header:**
- [ ] Container: Flex row, justify between, items center
- [ ] Title: "AI Insights" (text-xl, semibold, navy)
- [ ] Icon: Sparkles (gold, 20px)
- [ ] Subtitle: "Real-time intelligence" (text-xs, gray, block, mt-1)
- [ ] Margin bottom: 16px

**Insights Container:**
- [ ] Background: Gradient navy to dark (`bg-gradient-to-br from-[#1a1d3a] to-[#0f1117]`)
- [ ] Border radius: `16px`
- [ ] Shadow: XL
- [ ] Padding: 24px
- [ ] Border: `1px solid rgba(212, 175, 55, 0.3)`

**Insight Card:** - Component: `InsightCard.tsx`
- [ ] Background: Glassmorphism (`rgba(255,255,255,0.1)`)
- [ ] Backdrop blur: MD
- [ ] Border: `1px solid rgba(255,255,255,0.2)`
- [ ] Border radius: `12px`
- [ ] Padding: `16px`
- [ ] Margin bottom: 16px (last child: 0)

**Content:**
- [ ] Flex row, items start, gap 12px
- [ ] Icon: Emoji (24px) or Lucide icon (gold, 20px)
- [ ] Content column:
  - Title: text-sm, white, semibold, mb-1
  - Value: text-lg, gold, bold, mb-1
  - Description: text-xs, white/70, leading-relaxed
  - Progress bar (optional): **[NEW]**
    ```tsx
    <div className="w-full h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
      <div className="h-full bg-gradient-to-r from-[#f4e4b0] to-[#d4af37]" style={{width: '75%'}} />
    </div>
    ```
  - Action button (optional):
    - Text: text-xs
    - Border: 1px solid gold
    - Padding: `6px 12px`
    - Border radius: Full
    - Hover: Gold bg, white text
    - Transition: 150ms

**Stagger Animation:** **[NEW]**
```typescript
const containerVariant = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}

const itemVariant = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
}
```

**Props:** `icon: ReactNode, title: string, value: string, description: string, progress?: number, actionLabel?: string, onAction?: () => void`

**3 Insight Cards:**

1. **Peak Demand**
   - Icon: 🔥
   - Title: "Peak Demand"
   - Value: "2-4 PM today"
   - Description: "25% higher request volume"
   - Progress: 75%

2. **Upsell Opportunity**
   - Icon: 💡
   - Title: "Upsell Opportunity"
   - Value: "3 guests"
   - Description: "Viewed spa menu but didn't book"
   - Action: "Send Offer" (non-functional)

3. **Performance Metric**
   - Icon: ⚡
   - Title: "Avg Response Time"
   - Value: "8 minutes" (green color)
   - Description: "↓ 15% from yesterday" (green/70)
   - Mini sparkline chart (optional, use lightweight chart lib)

---

**Live Activity Feed:** - Component: `LiveActivityFeed.tsx`

**Container:**
- [ ] Border top: `1px solid rgba(255,255,255,0.2)`
- [ ] Padding top: 16px
- [ ] Margin top: 16px

**Header:**
- [ ] Title: "Live Activity" (text-sm, white, semibold, mb-3)

**Activity Item:**
- [ ] Flex row, items start, gap 8px
- [ ] Margin bottom: 12px (last: 0)
- [ ] Dot indicator:
  - Size: 6px circle
  - Background: Gold
  - Animation: Pulse (2s loop) **[NEW]**
- [ ] Text content:
  - Text: text-xs, white/80
  - Time: text-xs, white/50, mt-1
- [ ] Animation: Slide from right + fade (300ms) **[NEW]**

**Auto-scroll behavior:** **[NEW]**
- [ ] Max 5 items visible
- [ ] Overflow hidden
- [ ] New items prepend to top
- [ ] Smooth scroll animation

**Props:** `activities: Activity[]`

**Activities:** (2 new + 2 existing)
1. **[NEW]** "Room 1204 • Caesar Salad ordered", Just now
2. **[NEW]** "Room 1204 • Housekeeping requested", Just now
3. "Room 420 • Pizza delivered", 5 min ago
4. "Room 305 • Towels delivered", 12 min ago

---

## 🎬 DEMO CONTROL SYSTEM **[NEW SECTION]**

### Demo Control Panel Component: `DemoControlPanel.tsx`
**Route:** `/demo-control` (hidden, keyboard shortcut to access)

**Features:**
- [ ] Position: Fixed bottom-right
- [ ] Background: Navy with blur
- [ ] Padding: 16px
- [ ] Border radius: 12px
- [ ] Shadow: 2XL
- [ ] z-index: 999
- [ ] Collapsible (toggle with CMD/CTRL + D)

**Controls:**
- [ ] Current step indicator: "Step 3/13"
- [ ] Next button: Advance one step (or press Space)
- [ ] Reset button: Reset to step 0 (or press R)
- [ ] Auto-play toggle: Play through all steps with delays
- [ ] Speed control: 0.5x, 1x, 1.5x, 2x
- [ ] Step list: Jump to specific step

**Keyboard Shortcuts:** **[NEW]**
- [ ] Space: Next step
- [ ] R: Reset
- [ ] CMD/CTRL + D: Toggle control panel
- [ ] Escape: Pause auto-play

### Demo Step Definitions **[NEW]**
```typescript
// /lib/demoSteps.ts

export const DEMO_STEPS: DemoStep[] = [
  {
    id: 1,
    name: 'Initial State',
    route: '/guest',
    actions: ['showChatInterface'],
    delay: 0
  },
  {
    id: 2,
    name: 'User Types Message',
    route: '/guest',
    actions: ['typeMessage', 'showTypingIndicator'],
    delay: 800
  },
  {
    id: 3,
    name: 'AI Response',
    route: '/guest',
    actions: ['hideTypingIndicator', 'showAIMessage'],
    delay: 1200
  },
  {
    id: 4,
    name: 'Show Time Pills',
    route: '/guest',
    actions: ['showTimePills'],
    delay: 300
  },
  {
    id: 5,
    name: 'Select Time',
    route: '/guest',
    actions: ['selectTimePill'],
    delay: 0
  },
  {
    id: 6,
    name: 'Confirmation',
    route: '/guest',
    actions: ['showConfirmation', 'scrollToQuickActions'],
    delay: 1000
  },
  {
    id: 7,
    name: 'Navigate to Room Service',
    route: '/guest',
    actions: ['transitionToRoomService'],
    delay: 500
  },
  {
    id: 8,
    name: 'Add to Cart',
    route: '/guest',
    actions: ['addCaesarSaladToCart', 'showFloatingCart'],
    delay: 0
  },
  {
    id: 9,
    name: 'Open Checkout',
    route: '/guest',
    actions: ['openCheckoutModal'],
    delay: 400
  },
  {
    id: 10,
    name: 'Place Order',
    route: '/guest',
    actions: ['placeOrder', 'showSuccessAnimation'],
    delay: 0
  },
  {
    id: 11,
    name: 'Transition to Dashboard',
    route: '/dashboard',
    actions: ['crossFadeToDashboard'],
    delay: 800
  },
  {
    id: 12,
    name: 'Show Housekeeping Request',
    route: '/dashboard',
    actions: ['addHousekeepingRequest', 'updateStats', 'updateActivityFeed'],
    delay: 2000
  },
  {
    id: 13,
    name: 'Show Room Service Request',
    route: '/dashboard',
    actions: ['addRoomServiceRequest', 'updateStats', 'updateActivityFeed'],
    delay: 2500
  }
]
```

---

## 🛠️ REVISED TECHNICAL IMPLEMENTATION

### File Structure (Complete)
```
/inara-demo
├── /app
│   ├── layout.tsx (root layout, Zustand provider)
│   ├── page.tsx (redirect to /guest)
│   ├── globals.css
│   ├── /guest
│   │   ├── page.tsx (main guest page, listens to demo store)
│   │   └── layout.tsx (guest-specific layout)
│   ├── /dashboard
│   │   ├── page.tsx (main dashboard page, listens to demo store)
│   │   └── layout.tsx (dashboard-specific layout)
│   └── /demo-control
│       └── page.tsx (demo control panel)
│
├── /components
│   ├── /shared
│   │   ├── Logo.tsx
│   │   ├── Avatar.tsx **[NEW]**
│   │   ├── Button.tsx (with variants)
│   │   ├── Badge.tsx
│   │   ├── GlassCard.tsx
│   │   ├── Textarea.tsx **[NEW]**
│   │   ├── MLBadge.tsx **[NEW]**
│   │   └── LoadingSpinner.tsx **[NEW]**
│   │
│   ├── /guest
│   │   ├── TopBar.tsx
│   │   ├── WelcomeSection.tsx
│   │   ├── ChatInterface.tsx
│   │   ├── ChatInput.tsx **[SPLIT]**
│   │   ├── AIButton.tsx **[SPLIT]**
│   │   ├── MessageBubble.tsx
│   │   ├── TypingIndicator.tsx
│   │   ├── TimePills.tsx
│   │   ├── QuickActions.tsx
│   │   ├── ActionButton.tsx **[SPLIT]**
│   │   ├── RoomServiceMenu.tsx
│   │   ├── AISuggestionBanner.tsx **[NEW]**
│   │   ├── CategoryTabs.tsx **[NEW]**
│   │   ├── FoodCard.tsx
│   │   ├── FloatingCart.tsx
│   │   ├── CheckoutModal.tsx
│   │   └── OrderItem.tsx **[NEW]**
│   │
│   ├── /dashboard
│   │   ├── TopNav.tsx
│   │   ├── StatsRow.tsx **[NEW]**
│   │   ├── StatCard.tsx
│   │   ├── RequestsTable.tsx
│   │   ├── RequestRow.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── StaffAvatar.tsx
│   │   ├── AIInsightsPanel.tsx
│   │   ├── InsightCard.tsx
│   │   └── LiveActivityFeed.tsx
│   │
│   └── /demo
│       └── DemoControlPanel.tsx **[NEW]**
│
├── /lib
│   ├── /store
│   │   └── demoStore.ts (Zustand store)
│   ├── /data
│   │   ├── mockRequests.ts
│   │   ├── mockFoodItems.ts
│   │   └── mockStaff.ts
│   ├── demoSteps.ts **[NEW]**
│   ├── demoSequencer.ts **[NEW]**
│   ├── utils.ts (formatCurrency, formatTime, etc.)
│   └── animations.ts (Framer Motion variants)
│
├── /hooks **[NEW]**
│   ├── useCountUp.ts (count-up animation hook)
│   ├── useDemoStep.ts (listen to current demo step)
│   ├── useAutoScroll.ts (auto-scroll chat to bottom)
│   └── useKeyboardShortcuts.ts (demo control shortcuts)
│
├── /types **[NEW]**
│   ├── index.ts (all TypeScript interfaces)
│   └── demo.ts (demo-specific types)
│
├── /constants **[NEW]**
│   ├── colors.ts (design system colors)
│   ├── animations.ts (duration, easing constants)
│   └── config.ts (app configuration)
│
├── /public
│   ├── /images
│   │   ├── logo.svg (INNARA logo)
│   │   ├── caesar-salad.jpg (Unsplash) **[SOURCE SPECIFIED]**
│   │   ├── margherita-pizza.jpg (Unsplash)
│   │   ├── grilled-salmon.jpg (Unsplash)
│   │   └── mezze-platter.jpg (Unsplash)
│   └── favicon.ico
│
├── tailwind.config.ts (extended with design system)
├── next.config.mjs
├── tsconfig.json
├── package.json
└── README.md
```

### Image Sources **[NEW]**
All food images from Unsplash (royalty-free):
- [ ] Caesar Salad: https://unsplash.com/photos/caesar-salad (search "caesar salad restaurant")
- [ ] Margherita Pizza: https://unsplash.com/photos/pizza (search "margherita pizza")
- [ ] Grilled Salmon: https://unsplash.com/photos/salmon (search "grilled salmon fine dining")
- [ ] Mezze Platter: https://unsplash.com/photos/mezze (search "hummus platter")

**Backup Plan:** If images fail to load, show placeholder with ImageOff icon (Lucide)

---

## 📐 FRAMER MOTION VARIANTS (Detailed) **[NEW SECTION]**

```typescript
// /lib/animations.ts

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

export const slideUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { y: -20, opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } }
}

export const slideDown = {
  initial: { y: -20, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
  exit: { y: 20, opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } }
}

export const slideFromBottom = {
  initial: { y: '100%' },
  animate: { y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  exit: { y: '100%', transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } }
}

export const scaleIn = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { scale: 0.8, opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } }
}

export const pulseGlow = {
  initial: { scale: 1, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
  pulse: {
    scale: [1, 1.02, 1],
    boxShadow: [
      '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      '0 0 20px rgba(212, 175, 55, 0.3)',
      '0 4px 6px -1px rgb(0 0 0 / 0.1)'
    ],
    transition: { duration: 0.4 }
  }
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}

export const staggerItem = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
}

export const typingDot = {
  initial: { y: 0 },
  animate: {
    y: [-8, 0],
    transition: {
      duration: 0.4,
      repeat: Infinity,
      repeatType: 'reverse' as const
    }
  }
}

export const newRequest = {
  initial: { y: -20, opacity: 0, backgroundColor: 'transparent' },
  enter: {
    y: 0,
    opacity: 1,
    backgroundColor: '#fef9e7',
    transition: { duration: 0.6, ease: 'easeOut' }
  },
  settled: {
    backgroundColor: '#ffffff',
    transition: { delay: 2, duration: 0.5 }
  }
}
```

---

## ✅ CRITICAL SCENARIOS & ERROR HANDLING **[NEW SECTION]**

### Error States

**Image Load Failure:**
- [ ] Show placeholder: ImageOff icon (Lucide, gray, 48px)
- [ ] Background: Light gray
- [ ] Alt text: Food item name
- [ ] No broken image border

**API Failure Simulation:** (for polish)
- [ ] Toast notification: "Something went wrong. Please try again."
- [ ] Retry button
- [ ] Does not break demo flow

**Slow Network:**
- [ ] Skeleton loaders for images
- [ ] Progressive image loading
- [ ] Spinner on buttons during actions

### Loading States

**Chat Message Sending:**
- [ ] Disable input
- [ ] Show sending indicator on message
- [ ] Re-enable after 500ms

**Cart Actions:**
- [ ] Disable button during add
- [ ] Show checkmark animation
- [ ] Re-enable after animation complete

**Place Order:**
- [ ] Button shows spinner + "Placing..."
- [ ] Disable all modal interactions
- [ ] Success animation after 1.5s

**Dashboard Updates:**
- [ ] Smooth count-up animations
- [ ] No jarring number changes
- [ ] Pulse effect on stat cards

### Edge Cases

**Empty Cart:**
- [ ] Hide floating cart button
- [ ] Checkout modal cannot be opened

**No Requests on Dashboard:**
- [ ] Show empty state: "No active requests"
- [ ] Icon: ClipboardList (gray, 64px)
- [ ] Subtext: "Requests will appear here"

**Demo Reset:**
- [ ] Clear all state
- [ ] Reset to step 0
- [ ] Navigate to /guest
- [ ] No flash or jank

**Page Refresh Mid-Demo:**
- [ ] LocalStorage backup of current step **[NEW]**
- [ ] Show recovery toast: "Resume demo from step X?"
- [ ] Option to restart

---

## 🎬 REVISED DEMO RECORDING SEQUENCE

### Recording Method: Manual with Keyboard Shortcuts

**Setup:**
- [ ] Open /guest in one browser window (393x852px, iPhone frame)
- [ ] Open /dashboard in another browser window (1920x1080px)
- [ ] Open /demo-control in small floating window
- [ ] Position windows side-by-side or use screen recording with scene switching

**Recording Steps:**

**0:00-0:03 | Opening**
- [ ] Show guest app, chat interface
- [ ] Press Space to start

**0:03-0:08 | Chat Interaction**
- [ ] Type message (can be pre-filled, just trigger animation)
- [ ] AI response appears
- [ ] Time pills slide in

**0:08-0:15 | Time Selection & Confirmation**
- [ ] Click "Now" pill
- [ ] Confirmation with ML estimate
- [ ] Scroll to quick actions

**0:15-0:20 | Navigate to Room Service**
- [ ] Click Room Service button
- [ ] Menu slides up
- [ ] AI suggestion banner visible

**0:20-0:25 | Add to Cart**
- [ ] Click Caesar Salad
- [ ] Button checkmark animation
- [ ] Cart button slides up

**0:25-0:30 | Checkout**
- [ ] Click cart button
- [ ] Modal opens
- [ ] ML estimate visible
- [ ] Click Place Order
- [ ] Success animation

**0:30-0:33 | Transition**
- [ ] Cross-fade to dashboard
- [ ] **Recording Technique:** Switch screen capture source OR use OBS scene transition

**0:33-0:38 | Dashboard Overview**
- [ ] Slow pan across interface
- [ ] Stats visible
- [ ] Existing requests table
- [ ] AI Insights panel

**0:38-0:45 | Request 1 Arrives**
- [ ] Housekeeping request slides in
- [ ] Stats count up
- [ ] Activity feed updates
- [ ] Highlight ML estimate

**0:45-0:52 | Request 2 Arrives**
- [ ] Room service request slides in
- [ ] Stats count up again
- [ ] Activity feed updates
- [ ] Pulse animations

**0:52-0:58 | AI Insights Focus**
- [ ] Zoom in on AI panel
- [ ] Highlight each insight card
- [ ] Show live activity feed scrolling

**0:58-1:00 | Closing**
- [ ] Zoom out
- [ ] Fade to logo
- [ ] "Illuminating your stay."

**Post-Production:**
- [ ] Trim any dead time
- [ ] Add subtle background music (optional)
- [ ] Add text overlay for key features (optional):
  - "AI-Powered Time Estimates"
  - "Real-Time Synchronization"
  - "Actionable Insights"
- [ ] Export: 1080p, 60fps, MP4 (H.264)

---

## 🔍 FINAL VERIFICATION CHECKLIST **[EXPANDED]**

### Design System
- [ ] All colors defined and in tailwind.config
- [ ] All typography scales working
- [ ] Z-index scale prevents overlapping issues
- [ ] Focus rings visible and accessible
- [ ] Hover states consistent across all interactive elements
- [ ] Disabled states clearly differentiated
- [ ] Animations run at 60fps
- [ ] No FOUC (Flash of Unstyled Content)

### Component Reusability
- [ ] TopBar and TopNav don't duplicate code (share base if possible)
- [ ] Logo component used consistently
- [ ] Avatar component used in both apps
- [ ] Button component has all needed variants
- [ ] Badge component handles all status types
- [ ] No hardcoded colors (use Tailwind classes or CSS variables)

### State Management
- [ ] Zustand store properly typed
- [ ] State changes trigger correct UI updates
- [ ] Demo sequencer advances steps correctly
- [ ] Guest and dashboard stay in sync
- [ ] No race conditions in state updates
- [ ] LocalStorage backup works on refresh

### Navigation & Flow
- [ ] Chat → Room Service transition smooth
- [ ] Room Service → Checkout flow works
- [ ] Back button returns to correct state
- [ ] Modal open/close animations smooth
- [ ] Dashboard tab navigation (even if non-functional) doesn't break

### Data Integrity
- [ ] All mock data realistic and diverse
- [ ] Timestamps make chronological sense
- [ ] Prices formatted correctly ($12, not 12)
- [ ] ML estimates reasonable (18 min, 32 min)
- [ ] Staff names diverse and professional
- [ ] No placeholder text in final build

### Accessibility (Basic)
- [ ] Color contrast WCAG AA compliant
- [ ] Interactive elements have focus states
- [ ] Buttons have descriptive labels (even if icons)
- [ ] Modals trap focus
- [ ] Images have alt text
- [ ] Semantic HTML used

### Performance
- [ ] Images optimized (<200KB each)
- [ ] Next.js Image component used
- [ ] No unnecessary re-renders
- [ ] Animations use transform/opacity (GPU accelerated)
- [ ] No memory leaks
- [ ] Lighthouse score > 90

### Browser Compatibility
- [ ] Chrome (primary)
- [ ] Safari
- [ ] Firefox
- [ ] No console errors
- [ ] No layout breaks

### Demo Mechanics
- [ ] Space bar advances steps
- [ ] R key resets demo
- [ ] Demo control panel accessible (CMD+D)
- [ ] Auto-play mode works
- [ ] Steps execute in correct order
- [ ] Timing feels natural, not rushed
- [ ] No dead air or awkward pauses

### Recording Quality
- [ ] 1080p resolution
- [ ] 60fps frame rate
- [ ] No screen tearing
- [ ] Smooth cursor movements
- [ ] Audio (if any) clear
- [ ] Export settings correct (H.264, MP4)

---

## 🚀 BUILD SEQUENCE (Step-by-Step)

### Phase 1: Setup (Day 1, 2-3 hours)
1. [ ] Initialize Next.js 14 with TypeScript
2. [ ] Install dependencies (Tailwind, Framer Motion, Zustand, Lucide React)
3. [ ] Configure tailwind.config with full design system
4. [ ] Set up folder structure
5. [ ] Create TypeScript interfaces (/types/index.ts)
6. [ ] Set up Zustand store skeleton
7. [ ] Add Google Fonts (Inter)
8. [ ] Create root layout with providers

### Phase 2: Shared Components (Day 1, 2-3 hours)
9. [ ] Build Logo component
10. [ ] Build Avatar component
11. [ ] Build Button component (all variants)
12. [ ] Build Badge component
13. [ ] Build GlassCard component
14. [ ] Build MLBadge component
15. [ ] Test all shared components in isolation

### Phase 3: Guest App (Day 1-2, 6-8 hours)
16. [ ] Build TopBar
17. [ ] Build WelcomeSection
18. [ ] Build ChatInput + AIButton
19. [ ] Build MessageBubble (user + AI variants)
20. [ ] Build TypingIndicator
21. [ ] Build TimePills
22. [ ] Build ChatInterface (compose above)
23. [ ] Build QuickActions + ActionButton
24. [ ] Build RoomServiceMenu
25. [ ] Build AISuggestionBanner
26. [ ] Build CategoryTabs
27. [ ] Build FoodCard
28. [ ] Build FloatingCart
29. [ ] Build CheckoutModal + OrderItem
30. [ ] Wire up guest app state (Zustand)
31. [ ] Add all animations (Framer Motion)
32. [ ] Test full guest flow manually

### Phase 4: Dashboard (Day 2-3, 6-8 hours)
33. [ ] Build TopNav
34. [ ] Build StatCard
35. [ ] Build StatsRow
36. [ ] Build RequestRow
37. [ ] Build StatusBadge
38. [ ] Build StaffAvatar
39. [ ] Build RequestsTable
40. [ ] Build InsightCard
41. [ ] Build LiveActivityFeed
42. [ ] Build AIInsightsPanel
43. [ ] Wire up dashboard state (Zustand)
44. [ ] Add count-up animations
45. [ ] Add new request slide-in animations
46. [ ] Test full dashboard updates

### Phase 5: Demo Control (Day 3, 3-4 hours)
47. [ ] Build DemoControlPanel
48. [ ] Implement demoSequencer logic
49. [ ] Define all demo steps
50. [ ] Wire up keyboard shortcuts
51. [ ] Test step progression
52. [ ] Test reset functionality
53. [ ] Test auto-play mode

### Phase 6: Integration & Polish (Day 3-4, 4-6 hours)
54. [ ] Connect guest actions to dashboard updates
55. [ ] Test real-time sync (place order → new request appears)
56. [ ] Add all error states
57. [ ] Add all loading states
58. [ ] Download & optimize food images from Unsplash
59. [ ] Test image loading (success & failure)
60. [ ] Fix any animation jank
61. [ ] Remove all console.logs
62. [ ] Add favicon
63. [ ] Test in all browsers

### Phase 7: Recording Prep (Day 4, 2-3 hours)
64. [ ] Practice demo flow 5+ times
65. [ ] Time each section
66. [ ] Adjust timings if needed
67. [ ] Set up recording software
68. [ ] Test recording quality
69. [ ] Prepare browser windows
70. [ ] Write recording script notes

### Phase 8: Record & Edit (Day 4-5, 2-3 hours)
71. [ ] Record demo (multiple takes if needed)
72. [ ] Review footage
73. [ ] Trim and edit
74. [ ] Add music (optional)
75. [ ] Add text overlays (optional)
76. [ ] Export final video
77. [ ] Upload to YouTube (unlisted)
78. [ ] Test playback

### Phase 9: Deployment (Day 5, 1 hour)
79. [ ] Deploy to Vercel
80. [ ] Test live URL
81. [ ] Share demo link

---

## 🎯 SUCCESS CRITERIA (Final)

This demo is complete and successful when:

- [ ] **Visual Impact**: Looks like a $10M+ product, matches modern AI startup aesthetic
- [ ] **AI is Obvious**: ML time estimates prominently displayed, AI badges visible, insights panel highlighted
- [ ] **Real-time is Magic**: Dashboard updates feel instant, animations smooth, sync is seamless
- [ ] **Flow is Seamless**: No jarring transitions, natural pacing, 60 seconds exactly
- [ ] **Branding is Strong**: INNARA identity clear, gold/navy colors consistent, logo visible
- [ ] **Story is Clear**: Problem (manual hotel operations) → Solution (AI automation) evident
- [ ] **Wow Factor**: Viewers say "I want this" or "How can I get this?"
- [ ] **Technical Quality**: No bugs, 60fps, no console errors, works in all browsers
- [ ] **Recording Quality**: 1080p, smooth, professional, ready to submit to YC

---

**Total Checklist Items: 450+**

**Estimated Time to Complete: 4-5 days of focused work**

When every checkbox is checked, the demo is complete and ready to wow YC! 🚀
