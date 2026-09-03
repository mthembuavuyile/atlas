---
name: strict-ui-fidelity
description: Guidelines and constraints for maintaining strict UI fidelity in Atlas. Forbids unsolicited AI embellishments, glowing floating badges, cluttered visual gimmicks, or model badge clutter (no "FREE" suffix). Always adhere strictly to the user's crafted design.
---

# Strict UI Fidelity & Anti-Clutter Principles

## Core Constraints

1. **No Unsolicited AI Embellishments or Gimmicks**:
   - Never add decorative floating pills, pulsing/glowing dots, faux status badges, or unnecessary visual noise to "impress".
   - Stick strictly to what the user built and the established layout hierarchy.
   - Every UI element must have direct functional utility and fit the intentional design system.

2. **Clean Model Badging (No "FREE" Suffix)**:
   - Model badges must display clean context/capability indicators only (e.g., `AUTO`, `1.05M`, `1M`, `262K`, `256K`).
   - Never display `FREE` (e.g., forbidden: `AUTO FREE`, `1.05M FREE`, `262K FREE`).
   - Keep badge labels crisp, professional, and uncluttered.

3. **Natural Dynamic Greetings**:
   - Greeting text must be natural, respectful, and context-aware based on the user's local time:
     - 05:00–11:59: "Good morning."
     - 12:00–16:59: "Good afternoon."
     - 17:00–21:59: "Good evening."
     - 22:00–04:59: "Still working?"
   - Keep greetings clean and pair them with a clear, concise inquiry matching the user's active investigation mode. Examples:
     - Default: "What would you like to figure out?"
     - Research/Scientific: "What would you like to investigate?"
     - Coding/Build: "What are we building?"
     - Creative: "What are we creating?"
     - Analysis: "What should we make sense of?"
     - Discover: "Good evening, what cross-domain hypothesis shall we formulate?"
   - Forbidden: robotic juxtaposition like "Good morning — Scientific Reasoning".

4. **Preserve User Architecture & Layout**:
   - Do not redesign or invent UI paradigms unless explicitly requested by the user.
   - Maintain the mobile-first responsive layout, three clean themes (Vylex, Obsidian, Carbon), and clean SVG icon design.
