# THEME.md - Design System (The Aero Omniverse)

## 1. Core Philosophy
* **Vibe:** "Windows Vista at Midnight."
* **Concept:** A unified glass interface that shifts environments.
    * **Light Mode:** "Daylight Aurora." Optimistic, sky blues, white glass.
    * **Dark Mode:** "Midnight Nebula." Mysterious, deep space, obsidian glass, glowing cyan.
* **Key Traits:** High gloss, heavy translucency (`backdrop-blur-xl`), rounded geometry (`rounded-3xl`), and colored shadows (glows).

## 2. Color System (Tailwind Mappings)

### Backgrounds (The Canvas)
* **Light:** `bg-gradient-to-br from-sky-50 via-white to-blue-50`.
* **Dark:** `bg-[#0B0C15]` (Deep Void) or `bg-slate-950`.
* **The "Blobs" (Ambient Light):**
    * *Light:* Sky Blue (`bg-sky-300/30`) and Violet.
    * *Dark:* Cyan (`bg-cyan-500/10`) and Indigo (`bg-indigo-600/20`).

### Surfaces (The Glass)
* **Light:** `bg-white/70` + `border-white/80`.
* **Dark:** `bg-slate-900/60` + `border-slate-800`.
* **Reflections:**
    * *Light:* Top borders are white to catch sunlight.
    * *Dark:* Top borders are `border-white/5` or `border-cyan-500/20` to catch moonlight.

### Accents (The Energy)
* **Primary Brand:**
    * *Light:* Blue/Sky Gradient (`from-sky-400 to-blue-600`).
    * *Dark:* Cyan/Teal Gradient (`from-cyan-600 to-blue-700`).
* **Text:**
    * *Light:* Slate-900 (High Contrast).
    * *Dark:* White (Primary) & Cyan-400 (Data/Highlights).

## 3. UI Components

### Cards ("The Pane")
* **Shape:** `rounded-[2.5rem]` (Hyper-rounded).
* **Glass Effect:**
    * **Light:** `bg-white/70 backdrop-blur-xl border border-white/80 shadow-xl shadow-blue-900/5`.
    * **Dark:** `bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl shadow-black/50`.

### Buttons ("The Lozenge")
* **Primary (Action):**
    * Shape: `rounded-full`.
    * Style: Gradient Background + Inner Shadow (Gloss).
    * **Light:** `shadow-lg shadow-sky-500/30 hover:scale-[1.02]`.
    * **Dark:** `shadow-[0_0_25px_rgba(34,211,238,0.3)] hover:shadow-cyan-400/50`.
* **Secondary (Ghost):**
    * **Light:** `bg-white border border-slate-200 text-slate-600`.
    * **Dark:** `bg-slate-800/50 border border-slate-700 text-slate-300`.

### Inputs ("The Cutout")
* **Shape:** `rounded-2xl`.
* **Style:** Deep, pressed-in look.
    * **Light:** `bg-white/50 border-transparent focus:ring-sky-400`.
    * **Dark:** `bg-black/40 border-slate-800 text-cyan-400 placeholder:text-slate-700 focus:border-cyan-500/50`.

## 4. Typography
* **Font:** `Inter` or `Geist Sans`.
* **Rules:**
    * **Headings:** Tight tracking.
    * **Data (Hashes/IDs):** `font-mono`.
        * *Light:* `text-blue-600`.
        * *Dark:* `text-cyan-400` (The "Hacker" aesthetic).
    * **Prices:** `font-sans`, Bold, Large.

## 5. Animation & Motion
* **Transitions:** `duration-500` or `duration-700` for theme switching (make it feel like a slow sunrise/sunset).
* **Hovers:** Bouncy scale effects (`scale-[1.01]`).

## 6. Iconography
* **Library:** `Lucide React`.
* **Styling:**
    * *Light:* Solid colors or Gradients.
    * *Dark:* Thin strokes with "Glow" effects (Drop shadows on the SVG itself).