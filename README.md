# Blackhawk Team — 5-Week Esports Gaming League Website

A premium, competitive esports tournament website designed and built for **Blackhawk Team** as the official host and operator.

---

## 🏆 Brand & Event Specifications

- **Host & Organizer:** Blackhawk Team (*"Hosted by Blackhawk Team"*, *"A Blackhawk Team Gaming Event"*)
- **Total Guaranteed Prize Pool:** ₹2,000 INR
- **Duration:** 5 Weeks + Monthly Finale
- **Featured Disciplines:**
  1. **Week 01:** Free Fire (₹350)
  2. **Week 02:** BGMI (₹350) — *Squad pool clarification included*
  3. **Week 03:** Minecraft (₹350)
  4. **Week 04:** Chess (₹200)
  5. **Week 05:** Scribble (₹150)
  6. **Monthly Cumulative Standings:** ₹600 (8 distinct reward tiers)

---

## 🎨 Visual & UX Highlights

- **Palette:** Pure esports near-black (`#050505` / `#080808`) with deep crimson (`#E10600` / `#FF1E1E`) and dark red gradients.
- **Atmosphere:** Tech-grid scanlines, angular cyber clip-paths, subtle red radial spotlights, and carbon-fiber textures.
- **Typography:** Display fonts (*Barlow Condensed* & *Rajdhani*) paired with ultra-clean modern body typography (*Plus Jakarta Sans*).
- **Interactive Audio:** Built-in Web Audio API micro-sound synthesis for button clicks, hover feedback, and victory fanfares (with mute/unmute control in the navbar).
- **Player Pass Generator:** Registration form validates input and automatically renders a printable/saveable official digital **Athlete Accreditation Pass** with a unique Registration ID (e.g. `BHT-L5-XXXX`).
- **Data Isolation:** All event parameters, game titles, rules, rewards, and FAQs live in [`src/data/tournamentData.ts`](file:///c:/Event%20website/src/data/tournamentData.ts) for easy organizer edits.

---

## 🚀 Getting Started

### 1. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Build for Production
```bash
npm run build
```

### 3. Preview Production Build
```bash
npm run preview
```

---

## 📁 Project Structure

```
├── index.html                   # SEO metadata, Open Graph, Google Fonts
├── src/
│   ├── App.tsx                  # Main single-page application layout
│   ├── index.css                # Tailwind CSS v4 setup & custom esports utilities
│   ├── data/
│   │   └── tournamentData.ts    # Centralized event data & organizer config
│   ├── utils/
│   │   └── sfx.ts               # Web Audio API sound synthesizer
│   └── components/
│       ├── BlackhawkLogo.tsx    # Custom geometric hawk shield crest
│       ├── Navbar.tsx           # Sticky glassmorphism header & mobile menu
│       ├── Hero.tsx             # Cinematic hero with animated counters
│       ├── EventOverview.tsx    # 5-week visual cards & timeline connectors
│       ├── GameEvents.tsx       # 5 battlegrounds cards & reward accordions
│       ├── RewardSystem.tsx     # Five Ways to Win cards
│       ├── EventFlow.tsx        # 9-step tournament operational flow
│       ├── WeeklySchedule.tsx   # 7-day operations schedule (Mon–Sun)
│       ├── MonthlyLeague.tsx    # Standings mockup, Base Point model & ₹600 breakdown
│       ├── RegistrationSection.tsx # Form + Confetti + Athlete Pass generator
│       ├── RulesSection.tsx     # 12 rule accordions & highlighted principles
│       ├── FAQSection.tsx       # 13 questions with real-time search filter
│       ├── BlackhawkSection.tsx # Host & operator brand showcase & socials
│       ├── FinalCTA.tsx         # Conversion footer banner
│       ├── Footer.tsx           # Navigation links, socials, copyright
│       └── MobileStickyCTA.tsx  # Fixed bottom mobile registration bar
```
