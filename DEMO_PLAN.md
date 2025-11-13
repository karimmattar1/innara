# INNARA DEMO - Complete Build Plan

## 🎯 Demo Objective
60-second pre-recorded demo showing:
- Guest makes AI chatbot request (housekeeping) + traditional order (room service)
- Hotel dashboard receives requests in real-time with AI-powered insights and time estimates

---

## 📋 Project Overview

### Tech Stack
- [ ] Next.js 14 (App Router)
- [ ] React 18
- [ ] TypeScript
- [ ] Tailwind CSS
- [ ] Framer Motion (animations)
- [ ] Vercel (deployment)

### Demo Structure
- Route 1: `/guest` - Mobile guest app (iPhone 14 Pro dimensions: 393x852px)
- Route 2: `/dashboard` - Hotel desktop dashboard (1920x1080px)

---

## 🎨 DESIGN SYSTEM

### Color Palette
- [ ] **Primary Navy**: `#1a1d3a` (from deck)
- [ ] **Accent Gold**: `#d4af37` (from deck)
- [ ] **Gold Gradient Start**: `#f4e4b0`
- [ ] **Gold Gradient End**: `#d4af37`
- [ ] **Background Dark**: `#0f1117`
- [ ] **Background Light**: `#ffffff`
- [ ] **Glass Background**: `rgba(255, 255, 255, 0.1)`
- [ ] **Glass Border**: `rgba(255, 255, 255, 0.2)`
- [ ] **Text Primary**: `#1a1d3a`
- [ ] **Text Secondary**: `#6b7280`
- [ ] **Text Light**: `#ffffff`
- [ ] **Success Green**: `#10b981`
- [ ] **Warning Orange**: `#f59e0b`
- [ ] **Error Red**: `#ef4444`
- [ ] **Info Blue**: `#3b82f6`

### Typography
- [ ] **Font Primary**: `Inter` (Google Fonts)
- [ ] **Font Fallback**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- [ ] **Heading XL**: `text-4xl font-bold` (36px)
- [ ] **Heading Large**: `text-3xl font-bold` (30px)
- [ ] **Heading Medium**: `text-2xl font-semibold` (24px)
- [ ] **Heading Small**: `text-xl font-semibold` (20px)
- [ ] **Body Large**: `text-lg font-normal` (18px)
- [ ] **Body Regular**: `text-base font-normal` (16px)
- [ ] **Body Small**: `text-sm font-normal` (14px)
- [ ] **Caption**: `text-xs font-medium` (12px)

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
- [ ] **Shadow Glow Gold**: `0 0 20px rgba(212, 175, 55, 0.3)`

### Animation Durations
- [ ] **Fast**: 150ms (micro-interactions)
- [ ] **Normal**: 300ms (standard transitions)
- [ ] **Slow**: 500ms (page transitions)
- [ ] **Slower**: 700ms (dramatic reveals)

---

## 📱 GUEST MOBILE APP - Detailed Specification

### Page Structure: `/guest`

#### Top Bar (Fixed)
- [ ] Height: 60px
- [ ] Background: Glassmorphism (`backdrop-blur-xl bg-white/10`)
- [ ] Border bottom: `1px solid rgba(255,255,255,0.2)`
- [ ] Content:
  - [ ] Left: INNARA logo (gold lightbulb icon, 32px)
  - [ ] Center: "Room 1204" (text-sm, gold)
  - [ ] Right: User avatar (circular, 36px, "SA" initials)
- [ ] Sticky on scroll
- [ ] Drop shadow on scroll

#### Welcome Section
- [ ] Padding: `32px 20px`
- [ ] Background: Gradient navy to dark (`from-[#1a1d3a] to-[#0f1117]`)
- [ ] Content:
  - [ ] Greeting: "Welcome back, Sarah" (text-2xl, white, font-semibold)
  - [ ] Subtitle: "How can we help you today?" (text-sm, white/70)
  - [ ] Spacing between: 8px

#### AI Chat Interface
- [ ] Container padding: `24px 20px`
- [ ] Background: White
- [ ] Border radius top: `32px` (curves over gradient)
- [ ] Position: Negative margin to overlap gradient (-24px)

##### Chat Input Box (Main Feature)
- [ ] Width: 100% (with 20px horizontal margin)
- [ ] Height: Auto-expand (min 56px)
- [ ] Background: Glassmorphism white with gold border
- [ ] Border: `2px solid #d4af37`
- [ ] Border radius: `28px` (pill shape)
- [ ] Padding: `16px 60px 16px 20px`
- [ ] Placeholder: "What do you need today?" (text-gray-400)
- [ ] Font: text-base
- [ ] Shadow: Gold glow on focus

##### AI Sparkle Icon
- [ ] Position: Absolute right (16px from edge)
- [ ] Size: 32px circular button
- [ ] Background: Gold gradient
- [ ] Icon: Sparkle/stars (white)
- [ ] Animation: Gentle pulse when idle
- [ ] On click: Sends message

##### Chat Message Flow (Demo Sequence)

**Message 1 - User Types:**
- [ ] Text: "I need my room cleaned"
- [ ] Typing indicator appears (3 animated dots, gold)
- [ ] Delay: 800ms
- [ ] Message bubble:
  - Background: `#f3f4f6` (light gray)
  - Padding: `12px 16px`
  - Border radius: `16px 16px 4px 16px`
  - Max width: 80%
  - Align: Right
  - Font: text-base
  - Color: `#1a1d3a`

**Message 2 - AI Response:**
- [ ] Typing indicator duration: 1200ms
- [ ] Fade in animation (300ms)
- [ ] Text: "Of course, Sarah! I'll send housekeeping to Room 1204 right away. 🧹"
- [ ] Second line: "When would you like them to arrive?"
- [ ] Message bubble:
  - Background: Gold gradient
  - Padding: `14px 18px`
  - Border radius: `16px 16px 16px 4px`
  - Max width: 85%
  - Align: Left
  - Font: text-base
  - Color: White
  - AI badge: Small "AI" pill (top-left, 20px, white bg, gold text)

**Message 3 - Time Selection Pills:**
- [ ] Appears 300ms after AI message
- [ ] 3 pill buttons horizontally:
  - "Now"
  - "In 30 min"
  - "In 1 hour"
- [ ] Each pill:
  - Background: White
  - Border: `1px solid #e5e7eb`
  - Padding: `10px 20px`
  - Border radius: `20px`
  - Font: text-sm, semibold
  - Hover: Gold border + gold text
  - Active: Gold background + white text
  - Spacing: 8px gap

**Message 4 - User Selects "Now":**
- [ ] Selected pill animates into chat as user message
- [ ] Same styling as Message 1

**Message 5 - AI Confirmation:**
- [ ] Typing indicator: 1000ms
- [ ] Text: "Perfect! ✨ Housekeeping is on their way."
- [ ] Second line (with icon): "⏱️ Estimated arrival: **~18 minutes**"
- [ ] Third line (smaller, gray): "(2 requests ahead of you)"
- [ ] Message bubble: Same as Message 2
- [ ] ML badge appears: "AI Predicted" (small pill, 16px text, gold outline)

##### Chat Animations
- [ ] Messages slide up with fade (300ms ease-out)
- [ ] Typing indicator: 3 dots bouncing with stagger
- [ ] Time pills: Scale in from 0.9 to 1 (200ms ease-out)
- [ ] Success confirmation: Confetti micro-animation (optional)

---

#### Quick Actions Section
- [ ] Title: "Quick Actions" (text-lg, semibold, padding 24px 20px 12px)
- [ ] Grid: 4 columns, gap 12px
- [ ] Padding: 0 20px

##### Action Buttons (8 total)
Each button:
- [ ] Size: Square aspect ratio
- [ ] Background: White
- [ ] Border: `1px solid #f3f4f6`
- [ ] Border radius: `16px`
- [ ] Padding: `16px 12px`
- [ ] Hover: Gold border + lift shadow
- [ ] Active: Scale 0.95

**Button 1: Housekeeping**
- [ ] Icon: Broom (gold, 24px)
- [ ] Label: "Housekeeping" (text-xs, navy)
- [ ] Badge: Green dot (active - request in progress)

**Button 2: Room Service** ⭐ (Demo focus)
- [ ] Icon: Cloche (gold, 24px)
- [ ] Label: "Room Service" (text-xs, navy)
- [ ] Highlight: Subtle gold glow

**Button 3: Valet**
- [ ] Icon: Car (gold, 24px)
- [ ] Label: "Valet" (text-xs, navy)

**Button 4: Spa**
- [ ] Icon: Spa stones (gold, 24px)
- [ ] Label: "Spa" (text-xs, navy)

**Button 5: Concierge**
- [ ] Icon: Bell (gold, 24px)
- [ ] Label: "Concierge" (text-xs, navy)

**Button 6: Laundry**
- [ ] Icon: Washing machine (gold, 24px)
- [ ] Label: "Laundry" (text-xs, navy)

**Button 7: Maintenance**
- [ ] Icon: Wrench (gold, 24px)
- [ ] Label: "Maintenance" (text-xs, navy)

**Button 8: Checkout**
- [ ] Icon: Clock (gold, 24px)
- [ ] Label: "Checkout" (text-xs, navy)

---

#### Room Service Section (Triggered by Quick Action)

##### Transition Animation
- [ ] Quick actions fade out (200ms)
- [ ] Room service menu slides up (400ms ease-out)
- [ ] Back button appears top-left (< Room Service)

##### Menu Header
- [ ] Title: "Room Service" (text-2xl, semibold, navy)
- [ ] Subtitle: "Available 24/7" (text-sm, gray)
- [ ] Padding: 24px 20px
- [ ] AI suggestion banner:
  - Background: Light gold (`#fef9e7`)
  - Border left: `4px solid #d4af37`
  - Padding: `12px 16px`
  - Icon: Sparkle (gold)
  - Text: "💡 Popular right now: Caesar Salad"
  - Font: text-sm
  - Margin bottom: 16px

##### Category Tabs
- [ ] Horizontal scroll (no scrollbar)
- [ ] Padding: 0 20px
- [ ] Tabs: "Popular", "Breakfast", "Lunch", "Dinner", "Drinks", "Desserts"
- [ ] Each tab:
  - Padding: `10px 20px`
  - Border radius: `20px`
  - Background: Transparent
  - Active: Gold background, white text
  - Inactive: White background, navy text
  - Border: `1px solid #e5e7eb`

##### Food Items Grid
- [ ] Padding: 20px
- [ ] Gap: 16px
- [ ] 1 column on mobile

**Food Card 1: Caesar Salad** ⭐ (Demo selection)
- [ ] Height: 120px
- [ ] Background: White
- [ ] Border radius: `16px`
- [ ] Shadow: MD
- [ ] Layout: Horizontal (image left, content right)
- [ ] Components:
  - [ ] Image: 100x100px, border-radius 12px, object-cover
  - [ ] Image: Caesar salad (high quality)
  - [ ] Badge (top-right of image): "AI Pick" (gold, 12px text)
  - [ ] Title: "Caesar Salad" (text-base, semibold, navy)
  - [ ] Description: "Romaine, croutons, parmesan" (text-xs, gray, truncate 1 line)
  - [ ] Price: "$12" (text-sm, semibold, gold)
  - [ ] Add button: Circular (32px), gold background, "+" icon (white)
- [ ] Hover: Lift shadow LG
- [ ] Add animation: Button rotates 90deg, checkmark appears

**Food Card 2: Margherita Pizza**
- [ ] Same layout as Card 1
- [ ] Title: "Margherita Pizza"
- [ ] Description: "Tomato, mozzarella, basil"
- [ ] Price: "$18"

**Food Card 3: Grilled Salmon**
- [ ] Same layout as Card 1
- [ ] Title: "Grilled Salmon"
- [ ] Description: "Asparagus, herb butter"
- [ ] Price: "$24"

**Food Card 4: Arabic Mezze Platter**
- [ ] Same layout as Card 1
- [ ] Title: "Arabic Mezze Platter"
- [ ] Description: "Hummus, baba ganoush, falafel"
- [ ] Price: "$16"

##### Floating Cart Button (Bottom)
- [ ] Position: Fixed bottom, 20px from edges
- [ ] Width: calc(100% - 40px)
- [ ] Height: 56px
- [ ] Background: Gold gradient
- [ ] Border radius: `28px`
- [ ] Shadow: XL with gold glow
- [ ] Content:
  - [ ] Left: Cart icon (white, 20px)
  - [ ] Center: "View Order • 1 item" (white, text-base, semibold)
  - [ ] Right: "$12" (white, text-lg, bold)
- [ ] Animation: Slides up from bottom (400ms ease-out)
- [ ] Tap: Opens checkout modal

##### Checkout Modal
- [ ] Background overlay: `rgba(0,0,0,0.6)` with backdrop blur
- [ ] Modal:
  - Position: Bottom sheet
  - Background: White
  - Border radius top: `32px`
  - Height: 60vh
  - Slide animation: Up from bottom (400ms)

**Modal Content:**
- [ ] Handle bar (top): 40px wide, 4px tall, gray, centered
- [ ] Title: "Your Order" (text-xl, semibold, padding 24px 20px 16px)
- [ ] Order item:
  - Caesar Salad image (60x60px, rounded)
  - Title + description (text-sm)
  - Quantity selector (-, 1, +)
  - Price: $12 (gold)
- [ ] Delivery estimate section:
  - Background: Light blue (`#eff6ff`)
  - Border left: `4px solid #3b82f6`
  - Padding: `12px 16px`
  - Icon: Clock (blue)
  - Text: "⏱️ Estimated delivery: **~32 minutes**"
  - Subtext: "Kitchen is busy" (text-xs, gray)
  - ML badge: "AI Predicted"
- [ ] Special instructions textarea:
  - Placeholder: "Any special requests?"
  - Border: `1px solid #e5e7eb`
  - Border radius: `12px`
  - Padding: `12px 16px`
  - Max height: 80px
- [ ] Subtotal: $12
- [ ] Service fee: $2
- [ ] Total: $14 (large, bold, gold)
- [ ] Place Order button:
  - Full width
  - Height: 56px
  - Background: Gold gradient
  - Border radius: `28px`
  - Text: "Place Order" (white, text-lg, semibold)
  - Icon: Arrow right (white)
  - Hover: Darken 10%
  - Active: Scale 0.98

**Order Confirmation:**
- [ ] Success animation: Checkmark circle (green, 80px, scale in)
- [ ] Text: "Order Placed! 🎉"
- [ ] Subtext: "We'll deliver in ~32 minutes"
- [ ] Button: "Track Order" (gold outline)
- [ ] Auto-dismiss: 3 seconds

---

## 🖥️ HOTEL DASHBOARD - Detailed Specification

### Page Structure: `/dashboard`

#### Top Navigation Bar
- [ ] Height: 72px
- [ ] Background: Glassmorphism navy (`backdrop-blur-xl bg-[#1a1d3a]/90`)
- [ ] Border bottom: `1px solid rgba(212, 175, 55, 0.2)`
- [ ] Padding: 0 48px
- [ ] Sticky on scroll

**Nav Content:**
- [ ] Left section:
  - [ ] INNARA logo + text (gold, 40px icon, text-xl)
  - [ ] Spacing: 12px gap
- [ ] Center section:
  - [ ] Tab: "Dashboard" (active - gold underline)
  - [ ] Tab: "Requests" (inactive)
  - [ ] Tab: "Rooms" (inactive)
  - [ ] Tab: "Reports" (inactive)
  - [ ] Tab spacing: 32px
  - [ ] Text: text-sm, semibold
  - [ ] Active: Gold + 3px bottom border
  - [ ] Inactive: White/70 + hover white
- [ ] Right section:
  - [ ] Notification bell (gold, with red badge "2")
  - [ ] User avatar: "JM" (James Mitchell, 40px circle)
  - [ ] Dropdown icon (chevron down)
  - [ ] Spacing: 16px gap

---

#### Main Content Grid
- [ ] Padding: 48px
- [ ] Background: Light gray (`#f9fafb`)
- [ ] Layout: 12 column grid, gap 24px

---

#### Stats Cards Row (Top)
4 cards, each 3 columns wide (responsive)

**Card 1: Total Requests**
- [ ] Background: White
- [ ] Border radius: `16px`
- [ ] Padding: `24px`
- [ ] Shadow: MD
- [ ] Content:
  - [ ] Icon: Clipboard (gold, 32px, background gold/10, rounded-full 48px)
  - [ ] Label: "Total Requests" (text-sm, gray, uppercase, tracking-wide)
  - [ ] Value: "42" (text-4xl, semibold, navy)
  - [ ] Change indicator: "+2 today" (text-sm, green, with up arrow)
  - [ ] Spacing: icon→label 12px, label→value 8px

**Animation:**
- [ ] When new request arrives, value animates 42 → 44
- [ ] Number count-up animation (500ms)
- [ ] Card pulse gold glow (300ms)

**Card 2: Housekeeping**
- [ ] Same layout as Card 1
- [ ] Icon: Broom (gold)
- [ ] Label: "Housekeeping"
- [ ] Value: "14"
- [ ] No change indicator

**Animation:**
- [ ] When housekeeping request arrives, value 14 → 15
- [ ] Count-up animation (500ms)

**Card 3: Room Service**
- [ ] Same layout as Card 1
- [ ] Icon: Cloche (gold)
- [ ] Label: "Room Service"
- [ ] Value: "9"
- [ ] Change: "+1 today" (green)

**Animation:**
- [ ] When room service order arrives, value 9 → 10
- [ ] Count-up animation (500ms)

**Card 4: Valet**
- [ ] Same layout as Card 1
- [ ] Icon: Car (gold)
- [ ] Label: "Valet"
- [ ] Value: "7"
- [ ] No change indicator

---

#### Main Dashboard Grid (2 columns)

##### Left Column (8/12 width): Active Requests Table

**Section Header:**
- [ ] Title: "Active Requests" (text-2xl, semibold, navy)
- [ ] Filter button (right aligned): "Filter ⌄" (gold outline, rounded-lg)
- [ ] Spacing: 32px margin bottom

**Table Container:**
- [ ] Background: White
- [ ] Border radius: `16px`
- [ ] Shadow: MD
- [ ] Padding: 24px
- [ ] Max height: 600px
- [ ] Overflow-y: Auto (custom scrollbar gold)

**Table Header:**
- [ ] Columns: Guest | Room | Requested Item | Status | Requested | Staff
- [ ] Text: text-xs, uppercase, gray, semibold, tracking-wide
- [ ] Padding bottom: 16px
- [ ] Border bottom: `1px solid #f3f4f6`

**Table Rows (Demo data - 5 existing + 2 new incoming):**

**Row 1 (Existing):**
- [ ] Guest: "Benjamin Turner"
- [ ] Room: "305"
- [ ] Item: "Towels"
- [ ] Status: "In Progress" (orange badge)
- [ ] Requested: "10 min. ago"
- [ ] Staff: "James" (avatar)
- [ ] Row height: 64px
- [ ] Hover: Light gray background

**Row 2 (Existing):**
- [ ] Guest: "Emma Johnson"
- [ ] Room: "420"
- [ ] Item: "Margherita Pizza"
- [ ] Status: "Pending" (yellow badge)
- [ ] Requested: "20 min. ago"
- [ ] Staff: "Olivia"

**Row 3 (Existing):**
- [ ] Guest: "William Harris"
- [ ] Room: "512"
- [ ] Item: "Car Retrieval"
- [ ] Status: "Pending" (yellow badge)
- [ ] Requested: "30 min. ago"
- [ ] Staff: "Ahmed"

**Row 4 (Existing):**
- [ ] Guest: "Olivia Martinez"
- [ ] Room: "203"
- [ ] Item: "Room Cleaning"
- [ ] Status: "Pending" (yellow badge)
- [ ] Requested: "30 min. ago"
- [ ] Staff: "Michael"

**Row 5 (Existing):**
- [ ] Guest: "Michael Brown"
- [ ] Room: "210"
- [ ] Item: "Extra Pillows"
- [ ] Status: "In Progress" (orange badge)
- [ ] Requested: "45 min. ago"
- [ ] Staff: "Sarah"

**Row 6 (NEW - Housekeeping from Sarah):** ⭐
- [ ] Animation: Slides down from top with gold glow (600ms)
- [ ] Background: Light gold (`#fef9e7`) for 2 seconds, then white
- [ ] Guest: "Sarah Ahmed"
- [ ] Room: "1204"
- [ ] Item: "Room Cleaning"
- [ ] Status: "Pending" (yellow badge)
- [ ] Requested: "Just now" (with "NEW" pill, gold)
- [ ] Staff: Auto-assigned "James"
- [ ] AI estimate badge: "~18 min" (small gold outline pill)

**Row 7 (NEW - Room Service from Sarah):** ⭐
- [ ] Animation: Slides down 400ms after Row 6
- [ ] Background: Light gold for 2 seconds
- [ ] Guest: "Sarah Ahmed"
- [ ] Room: "1204"
- [ ] Item: "Caesar Salad"
- [ ] Status: "Pending" (yellow badge)
- [ ] Requested: "Just now" (with "NEW" pill, gold)
- [ ] Staff: Auto-assigned "Olivia"
- [ ] AI estimate badge: "~32 min" (small gold outline pill)

**Status Badges:**
- [ ] Pending: Yellow background (`#fef3c7`), yellow text (`#d97706`), 8px padding, rounded-full
- [ ] In Progress: Orange background (`#fed7aa`), orange text (`#ea580c`)
- [ ] Completed: Green background (`#d1fae5`), green text (`#059669`)

**Staff Avatars:**
- [ ] Size: 32px circle
- [ ] Initials: 2 letters, text-xs, white
- [ ] Background: Random from [blue, purple, pink, green, orange]
- [ ] Border: `2px solid white`

---

##### Right Column (4/12 width): AI Insights Panel

**Section Header:**
- [ ] Title: "AI Insights" (text-xl, semibold, navy)
- [ ] Subtitle: "Real-time intelligence" (text-xs, gray)
- [ ] Sparkle icon (gold, 20px)
- [ ] Spacing: 24px margin bottom

**Insights Container:**
- [ ] Background: Gradient navy to dark blue
- [ ] Border radius: `16px`
- [ ] Shadow: XL
- [ ] Padding: 24px
- [ ] Border: `1px solid rgba(212, 175, 55, 0.3)`

**Insight Cards (3 total):**

**Insight 1: Peak Demand**
- [ ] Background: Glassmorphism (`rgba(255,255,255,0.1)`)
- [ ] Border: `1px solid rgba(255,255,255,0.2)`
- [ ] Border radius: `12px`
- [ ] Padding: `16px`
- [ ] Margin bottom: 16px
- [ ] Content:
  - [ ] Icon: 🔥 Flame (24px)
  - [ ] Title: "Peak Demand" (text-sm, white, semibold)
  - [ ] Value: "2-4 PM today" (text-lg, gold, bold)
  - [ ] Description: "25% higher request volume" (text-xs, white/70)
  - [ ] Progress bar: 75% filled (gold gradient)
- [ ] Animation: Fade in from bottom (stagger 200ms)

**Insight 2: Upsell Opportunity**
- [ ] Same styling as Insight 1
- [ ] Icon: 💡 Lightbulb
- [ ] Title: "Upsell Opportunity"
- [ ] Value: "3 guests"
- [ ] Description: "Viewed spa menu but didn't book" (text-xs, white/70)
- [ ] Action button: "Send Offer" (gold outline, text-xs, rounded-full)
- [ ] Animation: Fade in (stagger 400ms)

**Insight 3: Performance Metric**
- [ ] Same styling as Insight 1
- [ ] Icon: ⚡ Lightning
- [ ] Title: "Avg Response Time"
- [ ] Value: "8 minutes" (text-lg, green, bold)
- [ ] Description: "↓ 15% from yesterday" (text-xs, green/70, with down arrow)
- [ ] Mini chart: Simple line graph (green, sparkline style)
- [ ] Animation: Fade in (stagger 600ms)

**Live Activity Feed (Bottom of Panel):**
- [ ] Title: "Live Activity" (text-sm, white, semibold)
- [ ] Border top: `1px solid rgba(255,255,255,0.2)`
- [ ] Padding top: 16px
- [ ] Margin top: 16px

**Activity Items (scrolling feed):**
- [ ] Each item:
  - Dot indicator (gold, 6px, pulsing animation)
  - Text: "Room 1204 ordered Caesar Salad" (text-xs, white/80)
  - Time: "Just now" (text-xs, white/50)
  - Spacing: 12px between items
- [ ] Auto-scroll on new activity
- [ ] Max 5 items visible

**Activity 1:** ⭐ (Appears when room service placed)
- [ ] Text: "Room 1204 • Caesar Salad ordered"
- [ ] Time: "Just now"
- [ ] Animation: Fade slide from right (300ms)

**Activity 2:** ⭐ (Appears when housekeeping requested)
- [ ] Text: "Room 1204 • Housekeeping requested"
- [ ] Time: "Just now"
- [ ] Animation: Fade slide from right (300ms)

**Activity 3 (Existing):**
- [ ] Text: "Room 420 • Pizza delivered"
- [ ] Time: "5 min ago"

**Activity 4 (Existing):**
- [ ] Text: "Room 305 • Towels delivered"
- [ ] Time: "12 min ago"

---

#### Analytics Mini-Chart (Bottom Full Width - Optional)
- [ ] Background: White
- [ ] Border radius: `16px`
- [ ] Padding: 24px
- [ ] Shadow: MD
- [ ] Title: "Request Volume (Last 7 Days)"
- [ ] Chart: Simple bar chart (gold bars, grid lines gray/20)
- [ ] Data: [32, 28, 35, 41, 38, 44, 42]
- [ ] Hover: Tooltip with exact number

---

## 🎬 DEMO RECORDING SEQUENCE

### Pre-Recording Setup
- [ ] Clear browser cache
- [ ] Set browser window to 1920x1080 (dashboard) + iPhone 14 frame (guest)
- [ ] Disable browser extensions
- [ ] Hide bookmarks bar
- [ ] Set zoom to 100%
- [ ] Close other tabs/windows
- [ ] Enable "Do Not Disturb" mode
- [ ] Test animations at 60fps
- [ ] Prepare screen recording software (Loom/QuickTime)

### Recording Timeline (60 seconds)

**0:00 - 0:03 | Opening (3s)**
- [ ] Fade in to guest mobile app
- [ ] Welcome screen visible
- [ ] Gentle ambient background music starts (optional)

**0:03 - 0:08 | AI Chat Request (5s)**
- [ ] Cursor/finger hovers over chat input
- [ ] Types: "I need my room cleaned"
- [ ] Taps AI sparkle button
- [ ] Message sends with animation

**0:08 - 0:12 | AI Response (4s)**
- [ ] Typing indicator appears
- [ ] AI message fades in
- [ ] Time selection pills appear
- [ ] Smooth reading pause

**0:12 - 0:15 | Time Selection (3s)**
- [ ] Tap "Now" button
- [ ] Button animates to message
- [ ] AI confirmation appears
- [ ] ML time estimate shows: "~18 minutes"

**0:15 - 0:20 | Switch to Room Service (5s)**
- [ ] Swipe down to see quick actions
- [ ] Tap "Room Service" button
- [ ] Menu slides up with animation
- [ ] Caesar Salad card highlighted (AI Pick)

**0:20 - 0:25 | Add to Cart (5s)**
- [ ] Tap Caesar Salad card
- [ ] Add button rotates to checkmark
- [ ] Floating cart button slides up from bottom
- [ ] Shows "$12 • 1 item"

**0:25 - 0:30 | Checkout (5s)**
- [ ] Tap cart button
- [ ] Modal slides up from bottom
- [ ] Shows order details + ML estimate "~32 minutes"
- [ ] Tap "Place Order" button
- [ ] Success animation plays

**0:30 - 0:33 | Transition (3s)**
- [ ] Smooth cross-fade transition
- [ ] Guest app → Hotel Dashboard
- [ ] Dashboard loads with existing data visible

**0:33 - 0:38 | Dashboard Overview (5s)**
- [ ] Pan across top stats cards
- [ ] Show existing requests table
- [ ] Highlight AI Insights panel
- [ ] Establish the environment

**0:38 - 0:45 | Real-Time Request #1 (7s)**
- [ ] Housekeeping request slides into table (Row 6)
- [ ] Gold glow animation
- [ ] "Total Requests" card updates: 42 → 43
- [ ] "Housekeeping" card updates: 14 → 15
- [ ] AI estimate badge shows "~18 min"
- [ ] Activity feed updates: "Room 1204 • Housekeeping requested"

**0:45 - 0:52 | Real-Time Request #2 (7s)**
- [ ] Room service order slides into table (Row 7)
- [ ] Gold glow animation
- [ ] "Total Requests" card updates: 43 → 44
- [ ] "Room Service" card updates: 9 → 10
- [ ] AI estimate badge shows "~32 min"
- [ ] Activity feed updates: "Room 1204 • Caesar Salad ordered"

**0:52 - 0:58 | AI Insights Showcase (6s)**
- [ ] Camera zooms slightly on AI Insights panel
- [ ] Highlight "Peak Demand: 2-4 PM" card
- [ ] Highlight "Upsell Opportunity: 3 guests"
- [ ] Highlight "Avg Response Time: 8 min ↓15%"
- [ ] Live activity feed scrolling

**0:58 - 1:00 | Closing (2s)**
- [ ] Zoom out to full dashboard view
- [ ] Fade to INNARA logo on navy background
- [ ] Tagline: "Illuminating your stay."
- [ ] Music ends

---

## 🧪 SAMPLE DATA STRUCTURE

### Hotel Information
```json
{
  "name": "The Burj Vista",
  "location": "Dubai, UAE",
  "totalRooms": 450,
  "occupancyRate": "87%"
}
```

### Guest Profile
```json
{
  "id": "guest_001",
  "name": "Sarah Ahmed",
  "room": "1204",
  "checkIn": "2026-11-04",
  "checkOut": "2026-11-08",
  "preferences": ["Extra pillows", "Morning coffee"],
  "vipStatus": false
}
```

### Staff Members
```json
[
  {
    "id": "staff_001",
    "name": "James Mitchell",
    "role": "Housekeeping",
    "avatar": "JM",
    "status": "active"
  },
  {
    "id": "staff_002",
    "name": "Olivia Chen",
    "role": "Room Service",
    "avatar": "OC",
    "status": "active"
  },
  {
    "id": "staff_003",
    "name": "Ahmed Al-Rashid",
    "role": "Valet",
    "avatar": "AA",
    "status": "active"
  },
  {
    "id": "staff_004",
    "name": "Michael Brown",
    "role": "Housekeeping",
    "avatar": "MB",
    "status": "active"
  },
  {
    "id": "staff_005",
    "name": "Sarah Johnson",
    "role": "Concierge",
    "avatar": "SJ",
    "status": "active"
  }
]
```

### Existing Requests (Pre-loaded)
```json
[
  {
    "id": "req_001",
    "guest": "Benjamin Turner",
    "room": "305",
    "item": "Towels",
    "category": "housekeeping",
    "status": "in_progress",
    "requestedAt": "10 min. ago",
    "staff": "James Mitchell",
    "estimatedTime": null
  },
  {
    "id": "req_002",
    "guest": "Emma Johnson",
    "room": "420",
    "item": "Margherita Pizza",
    "category": "room_service",
    "status": "pending",
    "requestedAt": "20 min. ago",
    "staff": "Olivia Chen",
    "estimatedTime": null
  },
  {
    "id": "req_003",
    "guest": "William Harris",
    "room": "512",
    "item": "Car Retrieval",
    "category": "valet",
    "status": "pending",
    "requestedAt": "30 min. ago",
    "staff": "Ahmed Al-Rashid",
    "estimatedTime": null
  },
  {
    "id": "req_004",
    "guest": "Olivia Martinez",
    "room": "203",
    "item": "Room Cleaning",
    "category": "housekeeping",
    "status": "pending",
    "requestedAt": "30 min. ago",
    "staff": "Michael Brown",
    "estimatedTime": null
  },
  {
    "id": "req_005",
    "guest": "Michael Brown",
    "room": "210",
    "item": "Extra Pillows",
    "category": "housekeeping",
    "status": "in_progress",
    "requestedAt": "45 min. ago",
    "staff": "Sarah Johnson",
    "estimatedTime": null
  }
]
```

### New Requests (Demo trigger)
```json
[
  {
    "id": "req_006",
    "guest": "Sarah Ahmed",
    "room": "1204",
    "item": "Room Cleaning",
    "category": "housekeeping",
    "status": "pending",
    "requestedAt": "Just now",
    "staff": "James Mitchell",
    "estimatedTime": "18 min",
    "isNew": true
  },
  {
    "id": "req_007",
    "guest": "Sarah Ahmed",
    "room": "1204",
    "item": "Caesar Salad",
    "category": "room_service",
    "status": "pending",
    "requestedAt": "Just now",
    "staff": "Olivia Chen",
    "estimatedTime": "32 min",
    "isNew": true
  }
]
```

### Room Service Menu Items
```json
[
  {
    "id": "food_001",
    "name": "Caesar Salad",
    "description": "Romaine, croutons, parmesan",
    "price": 12,
    "category": "Popular",
    "image": "/images/caesar-salad.jpg",
    "aiPick": true,
    "estimatedPrepTime": 32
  },
  {
    "id": "food_002",
    "name": "Margherita Pizza",
    "description": "Tomato, mozzarella, basil",
    "price": 18,
    "category": "Dinner",
    "image": "/images/margherita-pizza.jpg",
    "aiPick": false,
    "estimatedPrepTime": 28
  },
  {
    "id": "food_003",
    "name": "Grilled Salmon",
    "description": "Asparagus, herb butter",
    "price": 24,
    "category": "Dinner",
    "image": "/images/grilled-salmon.jpg",
    "aiPick": false,
    "estimatedPrepTime": 35
  },
  {
    "id": "food_004",
    "name": "Arabic Mezze Platter",
    "description": "Hummus, baba ganoush, falafel",
    "price": 16,
    "category": "Lunch",
    "image": "/images/mezze-platter.jpg",
    "aiPick": false,
    "estimatedPrepTime": 20
  }
]
```

### AI Insights Data
```json
{
  "peakDemand": {
    "timeRange": "2-4 PM today",
    "percentageIncrease": 25,
    "icon": "🔥"
  },
  "upsellOpportunity": {
    "count": 3,
    "service": "spa",
    "action": "Send Offer",
    "icon": "💡"
  },
  "avgResponseTime": {
    "current": 8,
    "previous": 9.4,
    "percentageChange": -15,
    "trend": "down",
    "icon": "⚡"
  }
}
```

### Live Activity Feed
```json
[
  {
    "id": "activity_001",
    "text": "Room 1204 • Caesar Salad ordered",
    "timestamp": "Just now",
    "type": "room_service"
  },
  {
    "id": "activity_002",
    "text": "Room 1204 • Housekeeping requested",
    "timestamp": "Just now",
    "type": "housekeeping"
  },
  {
    "id": "activity_003",
    "text": "Room 420 • Pizza delivered",
    "timestamp": "5 min ago",
    "type": "room_service"
  },
  {
    "id": "activity_004",
    "text": "Room 305 • Towels delivered",
    "timestamp": "12 min ago",
    "type": "housekeeping"
  }
]
```

---

## 🛠️ TECHNICAL IMPLEMENTATION CHECKLIST

### Project Setup
- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Install Tailwind CSS + configure
- [ ] Install Framer Motion
- [ ] Set up ESLint + Prettier
- [ ] Configure custom fonts (Inter from Google Fonts)
- [ ] Set up absolute imports (@/ paths)
- [ ] Create `.env.local` for environment variables
- [ ] Initialize Git repository

### File Structure
```
/inara-demo
├── /app
│   ├── layout.tsx
│   ├── page.tsx (redirect to /guest)
│   ├── /guest
│   │   ├── page.tsx
│   │   ├── components/
│   │   │   ├── TopBar.tsx
│   │   │   ├── WelcomeSection.tsx
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   ├── TimePills.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   ├── RoomServiceMenu.tsx
│   │   │   ├── FoodCard.tsx
│   │   │   ├── FloatingCart.tsx
│   │   │   └── CheckoutModal.tsx
│   ├── /dashboard
│   │   ├── page.tsx
│   │   ├── components/
│   │   │   ├── TopNav.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── RequestsTable.tsx
│   │   │   ├── RequestRow.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── StaffAvatar.tsx
│   │   │   ├── AIInsightsPanel.tsx
│   │   │   ├── InsightCard.tsx
│   │   │   └── LiveActivityFeed.tsx
├── /components (shared)
│   ├── Logo.tsx
│   ├── Button.tsx
│   ├── Badge.tsx
│   └── GlassCard.tsx
├── /lib
│   ├── data.ts (sample data exports)
│   ├── utils.ts (helper functions)
│   └── animations.ts (Framer Motion variants)
├── /public
│   ├── /images
│   │   ├── logo.svg
│   │   ├── caesar-salad.jpg
│   │   ├── margherita-pizza.jpg
│   │   ├── grilled-salmon.jpg
│   │   └── mezze-platter.jpg
│   └── /icons (if needed)
├── /styles
│   └── globals.css
├── tailwind.config.js
├── next.config.js
├── tsconfig.json
└── package.json
```

### Component Development Checklist

#### Shared Components
- [ ] Logo.tsx - INNARA logo with lightbulb icon
- [ ] Button.tsx - Reusable button with variants (primary, outline, ghost)
- [ ] Badge.tsx - Status badges (pending, in-progress, completed)
- [ ] GlassCard.tsx - Glassmorphism card wrapper

#### Guest App Components
- [ ] TopBar.tsx - Sticky header with logo, room number, avatar
- [ ] WelcomeSection.tsx - Gradient welcome banner
- [ ] ChatInterface.tsx - Main chat container with state management
- [ ] MessageBubble.tsx - Chat message with variants (user, ai)
- [ ] TypingIndicator.tsx - Animated 3-dot typing indicator
- [ ] TimePills.tsx - Time selection buttons (Now, In 30 min, In 1 hour)
- [ ] QuickActions.tsx - 8-button grid for services
- [ ] RoomServiceMenu.tsx - Menu container with categories
- [ ] FoodCard.tsx - Individual food item card
- [ ] FloatingCart.tsx - Sticky bottom cart button
- [ ] CheckoutModal.tsx - Bottom sheet checkout flow

#### Dashboard Components
- [ ] TopNav.tsx - Dashboard navigation bar
- [ ] StatCard.tsx - Animated stat card with count-up
- [ ] RequestsTable.tsx - Table container with animations
- [ ] RequestRow.tsx - Individual request row with slide-in
- [ ] StatusBadge.tsx - Colored status pill
- [ ] StaffAvatar.tsx - Circular avatar with initials
- [ ] AIInsightsPanel.tsx - Right sidebar AI panel
- [ ] InsightCard.tsx - Individual insight card
- [ ] LiveActivityFeed.tsx - Scrolling activity feed

### Animation Variants (Framer Motion)
- [ ] Fade in from bottom
- [ ] Slide down from top (new request)
- [ ] Scale in (success checkmark)
- [ ] Count-up animation (stats)
- [ ] Pulse glow (gold highlight)
- [ ] Slide up from bottom (modal)
- [ ] Stagger children (insight cards)
- [ ] Typing indicator bounce
- [ ] Button press (scale 0.95)

### State Management
- [ ] Guest app chat state (messages array)
- [ ] Room service cart state (items, total)
- [ ] Dashboard requests state (real-time updates)
- [ ] Dashboard stats state (live counters)
- [ ] Activity feed state (new items prepend)
- [ ] Modal open/close state
- [ ] Loading states for animations

### Timing & Triggers
- [ ] Demo auto-play mode (optional)
- [ ] Manual trigger buttons for demo (hidden, keyboard shortcuts?)
- [ ] Request delay timings (housekeeping → 5s, room service → 8s)
- [ ] Animation completion callbacks
- [ ] State synchronization between guest and dashboard

### Responsive Design
- [ ] Guest app: Mobile-first (393px)
- [ ] Dashboard: Desktop-first (1920px)
- [ ] Tablet breakpoints (optional, not needed for demo)
- [ ] Font scaling
- [ ] Touch targets (44px minimum)

### Performance Optimization
- [ ] Image optimization (Next.js Image component)
- [ ] Lazy load components (React.lazy if needed)
- [ ] Memoize expensive renders (React.memo)
- [ ] Optimize animations (GPU-accelerated properties)
- [ ] Remove console.logs before recording
- [ ] Test at 60fps

### Testing Checklist
- [ ] Test chat flow (type → send → response → selection)
- [ ] Test room service flow (browse → add → checkout)
- [ ] Test dashboard animations (new request slide-in)
- [ ] Test stat card count-ups
- [ ] Test AI insights panel animations
- [ ] Test activity feed updates
- [ ] Test all hover states
- [ ] Test all click states
- [ ] Verify color contrast (WCAG AA)
- [ ] Test on different browsers (Chrome, Safari, Firefox)
- [ ] Test animation performance

### Deployment
- [ ] Create Vercel account (if needed)
- [ ] Connect GitHub repo to Vercel
- [ ] Configure environment variables
- [ ] Deploy to production
- [ ] Test live URL
- [ ] Share link with stakeholders (optional)

### Recording Preparation
- [ ] Write recording script with timestamps
- [ ] Practice demo flow 3+ times
- [ ] Set up screen recording (1080p, 60fps)
- [ ] Set up audio (if needed)
- [ ] Prepare click sequence notes
- [ ] Test recording quality
- [ ] Record final demo
- [ ] Edit video (trim, add music if needed)
- [ ] Export as MP4 (H.264, high quality)

---

## 🎨 ASSETS NEEDED

### Images
- [ ] INNARA logo (SVG) - gold lightbulb icon
- [ ] Caesar Salad photo (high quality, 800x800px)
- [ ] Margherita Pizza photo
- [ ] Grilled Salmon photo
- [ ] Arabic Mezze Platter photo
- [ ] User avatar placeholder (optional)

### Icons (Lucide React or Heroicons)
- [ ] Sparkle (AI indicator)
- [ ] Clipboard (total requests)
- [ ] Broom (housekeeping)
- [ ] Cloche (room service)
- [ ] Car (valet)
- [ ] Bell (concierge)
- [ ] Spa stones (spa)
- [ ] Washing machine (laundry)
- [ ] Wrench (maintenance)
- [ ] Clock (checkout/time)
- [ ] Shopping cart (cart)
- [ ] Arrow right (buttons)
- [ ] Checkmark circle (success)
- [ ] Plus (add to cart)
- [ ] Minus (remove from cart)
- [ ] X (close modal)
- [ ] Chevron down (dropdowns)
- [ ] Notification bell (alerts)
- [ ] Filter (table filter)

### Fonts
- [ ] Inter (Google Fonts) - all weights (400, 500, 600, 700)

### Sound Effects (Optional)
- [ ] Message send "whoosh"
- [ ] Success confirmation "ding"
- [ ] New request notification "chime"

---

## ✅ FINAL CHECKS BEFORE RECORDING

### Visual Polish
- [ ] All colors match brand guidelines
- [ ] All fonts are consistent
- [ ] All spacing is uniform
- [ ] All shadows are consistent
- [ ] All border radiuses are consistent
- [ ] All animations are smooth (60fps)
- [ ] No layout shifts or jank
- [ ] No text overflow
- [ ] No broken images
- [ ] No console errors
- [ ] Favicon is set

### Content Quality
- [ ] All copy is proofread (no typos)
- [ ] All numbers are realistic
- [ ] All names are diverse and professional
- [ ] All timestamps make sense
- [ ] All AI estimates are reasonable
- [ ] All food descriptions are appetizing

### Functional Testing
- [ ] Chat flow works perfectly
- [ ] Room service flow works perfectly
- [ ] Dashboard updates in real-time
- [ ] Stats count up correctly
- [ ] New requests appear with animations
- [ ] Activity feed updates correctly
- [ ] All hover states work
- [ ] All click states work
- [ ] Modal opens and closes smoothly
- [ ] No JavaScript errors

### Demo Flow
- [ ] Timing is exactly 60 seconds
- [ ] Pacing feels natural (not rushed)
- [ ] All "wow moments" are clear
- [ ] AI features are highlighted
- [ ] ML time estimates are visible
- [ ] Real-time updates are dramatic
- [ ] Insights panel is showcased
- [ ] Transition between apps is smooth

---

## 🚀 POST-DEMO DELIVERABLES

### Video Files
- [ ] Raw recording (unedited)
- [ ] Edited demo (60s, MP4)
- [ ] Thumbnail image (1920x1080px)
- [ ] GIF preview (optional, for email)

### Supporting Materials
- [ ] Demo script document
- [ ] Technical architecture doc (optional)
- [ ] Design system guide (optional)
- [ ] GitHub repository (public or private)

### YC Application
- [ ] Upload demo video to YouTube (unlisted)
- [ ] Add video link to YC application
- [ ] Write compelling demo description
- [ ] Highlight key metrics shown in demo
- [ ] Emphasize AI/ML features

---

## 📝 NOTES & CONSIDERATIONS

### Design Inspirations
- [ ] Linear (clean, minimal UI)
- [ ] Vercel (dark mode, gradients)
- [ ] Stripe (glassmorphism, animations)
- [ ] Apple (smooth transitions, polish)
- [ ] Superhuman (speed, delight)

### Potential Challenges
- [ ] Animation performance on lower-end devices
- [ ] Font loading flash (FOUT)
- [ ] Image loading delays
- [ ] State synchronization timing
- [ ] Browser compatibility

### Future Enhancements (Post-Demo)
- [ ] Voice input for chat
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Accessibility improvements (screen reader)
- [ ] Mobile responsive dashboard
- [ ] Real backend integration
- [ ] Authentication flow
- [ ] Push notifications simulation

---

## 🎯 SUCCESS CRITERIA

This demo is successful when:
- [ ] **Visual Impact**: Looks like a $10M+ product
- [ ] **AI is Obvious**: ML time estimates are front and center
- [ ] **Real-time is Magic**: Dashboard updates feel instant and smooth
- [ ] **Flow is Seamless**: No jarring transitions or awkward pauses
- [ ] **Branding is Strong**: INNARA identity is clear throughout
- [ ] **Story is Clear**: Problem → Solution is evident in 60 seconds
- [ ] **Wow Factor**: Viewers say "I want this" after watching

---

**Total Checklist Items: 350+**

When every checkbox is checked, the demo is complete and ready to record! 🎉
