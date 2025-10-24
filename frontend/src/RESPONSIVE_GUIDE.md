# BookForMe - Responsive Design Guide

## 📐 Breakpoint System

BookForMe uses a **mobile-first responsive design** that adapts seamlessly across all devices.

### Breakpoints

| Device | Breakpoint | Tailwind Class | Width Range |
|--------|-----------|----------------|-------------|
| 📱 Mobile | Default | (none) | < 640px |
| 📱 Large Mobile | sm | `sm:` | ≥ 640px |
| 💻 Tablet | md | `md:` | ≥ 768px |
| 💻 Desktop | lg | `lg:` | ≥ 1024px |
| 🖥️ Large Desktop | xl | `xl:` | ≥ 1280px |

---

## 🎨 Layout Transformations

### Navigation
```
Mobile (< 1024px):           Desktop (≥ 1024px):
┌─────────────────┐          ┌──────┬──────────────┐
│  [≡] BookForMe  │          │      │  Page Title  │
├─────────────────┤          │      ├──────────────┤
│                 │          │  S   │              │
│                 │          │  I   │              │
│    Content      │          │  D   │   Content    │
│                 │          │  E   │              │
│                 │          │  B   │              │
│                 │          │  A   │              │
├─────────────────┤          │  R   │              │
│ [🏠][💬][👥][👤] │          │      │              │
└─────────────────┘          └──────┴──────────────┘
 Bottom Nav Bar               Fixed Sidebar
```

### Content Grid
```
Mobile:                     Desktop:
┌─────────────┐            ┌─────┬─────┬─────┐
│   Item 1    │            │  1  │  2  │  3  │
├─────────────┤            ├─────┼─────┼─────┤
│   Item 2    │            │  4  │  5  │  6  │
├─────────────┤            └─────┴─────┴─────┘
│   Item 3    │            grid-cols-1 → lg:grid-cols-3
└─────────────┘
```

---

## 🎯 Component Patterns

### 1. Spacing
```tsx
// Mobile: smaller padding → Desktop: larger padding
className="p-4 lg:p-8"

// Mobile: tight spacing → Desktop: comfortable spacing
className="space-y-4 lg:space-y-8"

// Mobile: compact → Desktop: spacious
className="gap-3 lg:gap-6"
```

### 2. Typography
```tsx
// Mobile: smaller text → Desktop: larger text
className="text-sm lg:text-base"

// Headers scale up on desktop
className="text-lg lg:text-2xl"
```

### 3. Layout
```tsx
// Stack vertically on mobile → Row on desktop
className="flex flex-col lg:flex-row"

// Full width on mobile → Limited width on desktop
className="w-full lg:w-1/2"

// Single column → Multi-column
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
```

### 4. Visibility
```tsx
// Show only on mobile
className="block lg:hidden"

// Show only on desktop
className="hidden lg:block"

// Different on mobile vs desktop
<div className="text-center lg:text-left">
```

---

## 📱 Mobile-Specific Features

### Bottom Navigation
- **Location**: Fixed at bottom of screen
- **Items**: 4 main navigation items
- **Height**: ~64px with safe area
- **Behavior**: Always visible, scrolls with content on iOS

### Hamburger Menu
- **Trigger**: Top-left menu icon
- **Type**: Slide-out drawer from left
- **Content**: Full navigation + settings
- **Backdrop**: Semi-transparent overlay

### Touch Interactions
- **Tap Targets**: Minimum 44x44px
- **Swipe**: Enabled on carousels
- **Long Press**: Context menus
- **Pull-to-Refresh**: Ready for implementation

---

## 💻 Desktop-Specific Features

### Sidebar Navigation
- **Width**: 320px (80 in Tailwind)
- **Position**: Fixed left
- **Content**: 
  - Brand header
  - Navigation links with icons + descriptions
  - Theme toggle
  - User menu at bottom
- **Behavior**: Always visible, non-collapsible

### Top Bar
- **Height**: ~80px
- **Content**:
  - Page title + description
  - Location indicator
  - Notifications
  - User dropdown menu

### Hover States
```tsx
// Subtle elevation on hover
className="hover:shadow-lg transition-shadow"

// Color change on hover
className="hover:bg-gray-100 dark:hover:bg-gray-800"

// Scale effect
className="hover:scale-105 transition-transform"
```

---

## 🎨 Common Responsive Patterns

### Card Layout
```tsx
// Mobile: Full width cards in stack
// Desktop: Grid of cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
  <Card className="dark:bg-gray-800">
    {/* Content */}
  </Card>
</div>
```

### Search Bar
```tsx
// Mobile: Stacked input + button
// Desktop: Inline input + button
<div className="flex flex-col sm:flex-row gap-3">
  <Input className="flex-1" />
  <Button className="w-full sm:w-auto">Search</Button>
</div>
```

### Stats Grid
```tsx
// Mobile: 2 columns
// Tablet: 3 columns  
// Desktop: 4 columns
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {stats.map(stat => <StatCard key={stat.id} {...stat} />)}
</div>
```

### Modal/Dialog
```tsx
// Mobile: Full screen
// Desktop: Centered with max width
<DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-auto">
  {/* Content */}
</DialogContent>
```

### Image Galleries
```tsx
// Mobile: 1 column
// Tablet: 2 columns
// Desktop: 3-4 columns
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {images.map(img => <Image key={img.id} />)}
</div>
```

---

## 🌓 Dark Mode Integration

Every responsive component must also support dark mode:

```tsx
// Complete responsive + dark mode example
<div className="
  p-4 lg:p-8                    // Responsive padding
  bg-white dark:bg-gray-800     // Dark mode background
  border-gray-200 dark:border-gray-700  // Dark mode borders
  text-gray-900 dark:text-white  // Dark mode text
  grid grid-cols-1 lg:grid-cols-3  // Responsive grid
">
  <Card className="
    hover:shadow-lg               // Interaction
    dark:bg-gray-800             // Dark mode
    transition-all               // Smooth transitions
  ">
    <CardContent className="p-4 lg:p-6">
      {/* Content */}
    </CardContent>
  </Card>
</div>
```

---

## 📏 Size Guidelines

### Tap Targets (Mobile)
- **Minimum**: 44x44px (Apple HIG)
- **Recommended**: 48x48px (Material Design)
- **Comfortable**: 56x56px

### Font Sizes
| Element | Mobile | Desktop |
|---------|--------|---------|
| H1 | 1.5rem (24px) | 2rem (32px) |
| H2 | 1.25rem (20px) | 1.5rem (24px) |
| H3 | 1.125rem (18px) | 1.25rem (20px) |
| Body | 1rem (16px) | 1rem (16px) |
| Small | 0.875rem (14px) | 0.875rem (14px) |

### Spacing Scale
| Size | Mobile | Desktop |
|------|--------|---------|
| xs | 0.5rem | 0.5rem |
| sm | 0.75rem | 1rem |
| md | 1rem | 1.5rem |
| lg | 1.5rem | 2rem |
| xl | 2rem | 3rem |

---

## ✅ Responsive Checklist

When building a new component:

- [ ] Works at 320px (smallest mobile)
- [ ] Works at 375px (iPhone SE)
- [ ] Works at 768px (tablet portrait)
- [ ] Works at 1024px (tablet landscape/small desktop)
- [ ] Works at 1920px (large desktop)
- [ ] Touch targets ≥ 44px on mobile
- [ ] No horizontal scroll on any breakpoint
- [ ] Images scale appropriately
- [ ] Text remains readable at all sizes
- [ ] Navigation accessible on all devices
- [ ] Dark mode works at all breakpoints

---

## 🔧 Testing Tools

### Browser DevTools
```
1. Open DevTools (F12)
2. Click device toolbar icon
3. Test these presets:
   - iPhone SE (375×667)
   - iPhone 14 Pro (393×852)
   - iPad Mini (768×1024)
   - iPad Pro (1024×1366)
   - Desktop (1920×1080)
```

### Tailwind Breakpoint Indicator
Add this to debug responsive layouts:

```tsx
// Add to App.tsx during development
{process.env.NODE_ENV === 'development' && (
  <div className="fixed bottom-4 left-4 bg-black text-white p-2 rounded text-xs z-50">
    <span className="sm:hidden">xs</span>
    <span className="hidden sm:inline md:hidden">sm</span>
    <span className="hidden md:inline lg:hidden">md</span>
    <span className="hidden lg:inline xl:hidden">lg</span>
    <span className="hidden xl:inline">xl</span>
  </div>
)}
```

---

## 🎯 Best Practices

### 1. Mobile First
Always write styles for mobile first, then add larger breakpoints:

```tsx
// ✅ Good: Mobile first
<div className="p-4 lg:p-8">

// ❌ Bad: Desktop first (requires more code)
<div className="p-8 lg:p-4">
```

### 2. Progressive Enhancement
```tsx
// Start simple, add complexity on larger screens
<div className="
  flex flex-col          // Simple stack on mobile
  lg:flex-row           // Row layout on desktop
  lg:items-center       // Center alignment on desktop
  lg:justify-between    // Space between on desktop
">
```

### 3. Consistent Spacing
Use Tailwind's spacing scale consistently:

```tsx
// ✅ Good: Consistent scaling
<div className="p-4 lg:p-6 xl:p-8">

// ❌ Bad: Arbitrary values
<div className="p-[13px] lg:p-[27px]">
```

### 4. Performance
```tsx
// Use CSS Grid for better performance on large grids
<div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

// Instead of flexbox wrapping
<div className="flex flex-wrap gap-4">
```

---

## 📚 Resources

- **Tailwind Responsive Design**: https://tailwindcss.com/docs/responsive-design
- **Mobile First**: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Responsive/Mobile_first
- **Touch Guidelines**: https://developer.apple.com/design/human-interface-guidelines/designing-for-ios

---

## 🎉 Quick Reference

```tsx
// Comprehensive responsive component template
export function ResponsiveComponent() {
  return (
    <div className="
      // Spacing
      p-4 lg:p-8
      space-y-4 lg:space-y-8
      
      // Layout
      grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
      gap-4 lg:gap-6
      
      // Colors
      bg-white dark:bg-gray-800
      text-gray-900 dark:text-white
      border border-gray-200 dark:border-gray-700
      
      // Interactions
      hover:shadow-lg
      transition-all duration-300
      
      // Visibility
      // Mobile-only: block lg:hidden
      // Desktop-only: hidden lg:block
    ">
      <h2 className="text-lg lg:text-2xl font-semibold">
        Responsive Heading
      </h2>
      
      <p className="text-sm lg:text-base text-muted-foreground">
        Responsive description text
      </p>
    </div>
  );
}
```

Now your components will look great on any device! 🚀
