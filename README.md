# Aura AI — Premium OS for Athletic Performance

Aura AI is a high-performance, full-stack athletic operating system built for elite athletes and fitness enthusiasts. Combining advanced metrics tracking, real-time Vision AI macro analysis, and a specialized AI Athletic Coach, Aura represents the modern standard in physical performance software.

---

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Motion (formerly Framer Motion), Lucide Icons
- **Backend**: Node.js, Express
- **AI Engine**: Gemini AI (Multimodal text & vision models)
- **Database / Auth**: Supabase DB & Supabase Authentication (with complete seamless development sandbox fallbacks)
- **Notifications**: Resend API Integration

---

## 📦 Folder Structure

Our codebase is meticulously partitioned into two primary, self-contained directories:

```text
/
├── api/
│   └── server.ts          # Express Server with Gemini AI, Vision & Resend endpoints
│
└── frontend/
    ├── assets/            # Static assets and illustration configurations
    ├── components/        # High-performance UI components (Navbar, Sidebar)
    ├── context/           # AuthContext managing session states
    ├── pages/             # Layout screens (LandingPage, LoginPage, Dashboard, etc.)
    ├── routes/            # Route wrapper (ProtectedRoute)
    ├── services/          # Client API services (supabase.ts, authService.ts, groq.ts)
    ├── utils/             # Helper utilities
    ├── App.tsx            # Main routes orchestrator
    ├── main.tsx           # Client entry point
    └── index.css          # Core styles, fonts and custom glassmorphism declarations
```

---

## ⚡ Key Features

1. **Stripe-Grade Landing Page**: Immerse yourself in our premium, high-contrast dark space with responsive aurora glow backdrops, interactive mockup panels, and fluid typography.
2. **Double-State Authentication**: Real-time Supabase signups and sign-ins backed by an instant-access Sandbox Demo button.
3. **Advanced Training Dashboard**: Review workout schedules, water hydration metrics, and macro budgets dynamically with custom SVG interactive charts.
4. **AI Athletic Coach**: Consult with a personalized AI coach on custom hyperbolic workout splits, macronutrient counts, and sleep hygiene advice.
5. **Vision Food Macro Scanner**: Scan pictures of your meal to instantly estimate calorie levels and protein breakdowns using advanced multimodal vision models.

---

## ⚙️ Installation & Development

To initiate the workspace locally:

1. Clone the project.
2. Install standard dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
4. Configure optional environment variables for Supabase in your client bundle:
   ```env
   VITE_SUPABASE_URL=YOUR_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```
5. Launch the local dev environment:
   ```bash
   npm run dev
   ```
   *Express server will launch on port 3000.*

---

## 🔗 Project Links

- **Live Preview**: [Development App URL](https://ais-dev-2xl53hclxgbntikz5glsgy-93288701512.asia-southeast1.run.app)
- **Shared App**: [Shared App URL](https://ais-pre-2xl53hclxgbntikz5glsgy-93288701512.asia-southeast1.run.app)
