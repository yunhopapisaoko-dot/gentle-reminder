# AI Development Rules - MagicTalk Community

## Tech Stack
* **Framework:** React 19 with TypeScript for a robust and type-safe frontend architecture.
* **Build Tool:** Vite 6 for high-performance development and optimized production bundling.
* **Styling:** Tailwind CSS with a custom anime-themed configuration for responsive and immersive designs.
* **Backend:** Supabase for integrated Authentication, PostgreSQL Database, and Object Storage (avatars/media).
* **AI Engine:** Google Gemini AI (Gemini 1.5 Flash) for interactive roleplay and dynamic content generation.
* **Iconography:** Material Symbols Rounded for high-quality, consistent UI elements.
* **Typography:** Plus Jakarta Sans for a modern and premium reading experience.

## Library & Development Rules
* **UI Components:** Prioritize custom-built Tailwind components to maintain the specific "MagicTalk" aesthetic. Use shadcn/ui for complex interactive patterns while ensuring they are themed correctly.
* **Database & Auth:** All interactions with Supabase must be abstracted through `src/services/supabaseService.ts`. Do not use the raw `supabase` client directly in UI components.
* **AI Integration:** Centralize all LLM logic within `src/services/geminiService.ts`. Keep system instructions concise and maintain the "JYP" persona for chat interactions. JYP is mysterious, performative, always dances, speaks with "-" before lines and describes actions between "* *".
* **Styling:** Adhere strictly to the design system constants: `primary` (#8B5CF6), `secondary` (#D946EF), and `background-dark` (#070210).
* **Icons:** Exclusively use the Material Symbols Rounded library using the `<span className="material-symbols-rounded">icon_name</span>` pattern.
* **Animations:** Utilize the pre-defined CSS animation classes in `index.html` (e.g., `animate-in`, `zoom-in`, `slide-in-bottom`) to ensure transitions feel "springy" and premium.
* **Routing:** Keep the primary navigation logic within `src/App.tsx`. If moving to a multi-page structure, use `react-router-dom`.
* **State:** Use React Hooks for local state and Supabase Realtime subscriptions for keeping the feed and profile data in sync across clients.