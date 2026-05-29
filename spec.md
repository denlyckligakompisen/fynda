# Frontend Specification & Standards (Fynda)

This document serves as the absolute source of truth for the technical standards, architectural patterns, and accessibility requirements for the Fynda web application. 

**All future development must adhere to these guidelines.**

---

## 1. Core Technology Stack
The application must always utilize the latest stable versions of the following core technologies to ensure a modern, performant, and secure web experience.

- **Environment**: Node.js (Latest LTS, currently `>=20.x`)
- **Framework**: React (Latest stable, currently `^19.x`)
- **Build Tool**: Vite (Latest stable, currently `^7.x`)
- **UI Component Library**: Material UI (MUI) (Latest stable, currently `^7.x`)
- **Styling**: CSS Modules (`*.module.css`) for scoped component styles, falling back to MUI's `sx` prop for rapid layout adjustments. *CSS-in-JS (like styled-components) should be avoided for new components to minimize runtime overhead.*

---

## 2. Component Standardization
To maintain visual consistency and development speed, we strictly rely on standardized components.

### 2.1. Material UI (MUI) as the Foundation
- **Do not reinvent the wheel.** If a component exists in MUI (e.g., Buttons, Dialogs, Sliders, TextFields, Skeletons), use the MUI component instead of building a custom HTML/CSS version.
- **Customization**: Customize MUI components via the global `ThemeProvider` rather than inline overrides whenever possible.

### 2.2. Functional Components & Hooks
- Use strictly React Functional Components.
- Use `useCallback` and `useMemo` where appropriate to prevent unnecessary re-renders, especially when passing props to heavy child components (like maps or lists).

---

## 3. Accessibility (a11y) - WCAG 2.1 AA Compliance
Accessibility is a first-class requirement. All features must be usable by everyone, regardless of disability.

### 3.1. Keyboard Navigation
- **Focus Management**: All interactive elements (buttons, inputs, links, map markers) must be focusable via the `Tab` key.
- **Visual Focus Indicators**: Never remove the default focus outline without providing a distinct visual alternative (e.g., `:focus-visible`).
- **Skip Links**: The application should provide a way to skip navigation and jump straight to the main content.

### 3.2. Semantic HTML & ARIA
- **Semantic Tags**: Use `<main>`, `<nav>`, `<article>`, `<header>`, and `<footer>` instead of meaningless `<div>` tags.
- **Buttons vs. Links**: 
  - Use `<button>` for actions that change state on the page (e.g., toggling a filter, saving a favorite).
  - Use `<a>` (links) for navigation to new pages or external resources.
- **ARIA Attributes**: 
  - Use `aria-label` or `aria-labelledby` for icon-only buttons (e.g., the favorite heart button).
  - Use `aria-expanded` for accordions and dropdowns.
  - Use `aria-live="polite"` for dynamic content updates (e.g., "0 results found").

### 3.3. Color & Contrast
- **Contrast Ratio**: Text and interactive elements must have a contrast ratio of at least **4.5:1** against their background (WCAG AA standard).
- **Color Independence**: Do not use color as the sole method of conveying information (e.g., an error state should have an icon or text, not just turn red).

---

## 4. Responsive Design & Layouts
The application must provide a flawless experience across all device sizes.

- **Mobile-First Approach**: Design and build for mobile (`< 768px`) first, then scale up to desktop via breakpoints.
- **Split Views**: On desktop (`>= 1024px`), utilize side-by-side layouts (e.g., List on the left, Map on the right) to maximize screen real estate.
- **Touch Targets**: Ensure all interactive elements on mobile are at least `44x44px` to prevent accidental misclicks.

---

## 5. Performance Guidelines
- **Lazy Loading**: Defer loading of non-critical components, images (using `loading="lazy"`), and heavy libraries.
- **Map Optimization**: Use clustering (`react-leaflet-cluster`) for map markers to prevent DOM bloat.
- **Animations**: Keep animations subtle, hardware-accelerated (`transform`, `opacity`), and respect the user's `prefers-reduced-motion` OS setting.
