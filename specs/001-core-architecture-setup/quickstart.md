# Quickstart Guide: Floorplan Assembly

**Feature**: 001-core-architecture-setup
**Date**: 2025-12-30

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ or pnpm 8+
- Modern browser (Chrome, Firefox, Safari, Edge - latest 2 versions)

---

## Installation

### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd floorplan-assembly

# Install dependencies
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

---

## Project Structure

```
floorplan-assembly/
├── src/
│   ├── components/           # React components
│   │   ├── canvas/          # 2D canvas components (Konva)
│   │   ├── viewer/          # 3D viewer components (Babylon)
│   │   ├── panels/          # Sidebar panels
│   │   ├── dialogs/         # Modal dialogs
│   │   └── ui/              # Shared UI components
│   ├── features/            # Feature-specific logic
│   │   ├── areas/           # Area management
│   │   ├── assets/          # Asset import/management
│   │   └── project/         # Project save/load
│   ├── models/              # TypeScript type definitions
│   ├── store/               # Zustand store
│   │   ├── slices/          # Store slices
│   │   └── index.ts         # Combined store
│   ├── lib/                 # Utility functions
│   │   ├── coordinates.ts   # Unit conversion
│   │   ├── geometry.ts      # Overlap detection
│   │   └── storage.ts       # IndexedDB helpers
│   ├── App.tsx              # Root component
│   └── main.tsx             # Entry point
├── public/                  # Static assets
├── specs/                   # Feature specifications
├── tests/                   # Test files
└── package.json
```

---

## Quick Start Usage

### Creating Your First Floorplan

1. **Launch the Application**
   - Open http://localhost:5173 in your browser
   - You'll see an empty canvas

2. **Set Lot Dimensions**
   - In the sidebar, find "Lot Settings"
   - Enter width (e.g., 50m) and height (e.g., 30m)
   - The canvas grid updates automatically

3. **Add an Area**
   - Click the "Add Area" button (A) in the toolbar
   - Click on the canvas where you want to place it
   - Enter name, type, and dimensions in the dialog
   - Click "Create"

4. **Edit Area Properties**
   - Click on an area to select it
   - Blue handles appear for resizing
   - Drag to reposition
   - Edit properties in the sidebar panel

5. **View in 3D**
   - Click the "3D" button in the view toggle
   - Use WASD keys to move around
   - Click and drag to look around
   - Scroll to zoom in/out

6. **Save Your Project**
   - Press Ctrl+S or click "Save"
   - Project is saved locally to browser storage

---

## Development Commands

```bash
# Start development server with hot reload
npm run dev

# Run TypeScript type checking
npm run typecheck

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

---

## Configuration

### Environment Variables

Create a `.env.local` file for local configuration:

```bash
# Optional: Enable debug logging
VITE_DEBUG=true

# Optional: Custom storage key prefix
VITE_STORAGE_PREFIX=floorplan
```

### Vite Configuration

See `vite.config.ts` for build configuration:

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@store': '/src/store',
      '@models': '/src/models',
      '@lib': '/src/lib',
    },
  },
});
```

---

## Key Concepts

### Coordinate System

- **Internal storage**: Millimeters (integers for precision)
- **Display/API**: Meters (3 decimal places)
- **Canvas**: Pixels (converted via scale factor)

```typescript
// Conversion utilities (src/lib/coordinates.ts)
import { metersToPixels, pixelsToMeters, metersToMm, mmToMeters } from '@lib/coordinates';

// Default: 50 pixels = 1 meter
const PIXELS_PER_METER = 50;
```

### Store Architecture

Single Zustand store with slices:

```typescript
// Access store in components
import { useFloorplanStore } from '@store';

function MyComponent() {
  // Subscribe to specific state
  const areas = useFloorplanStore(state => state.project?.areas);

  // Get actions
  const addArea = useFloorplanStore(state => state.addArea);

  return <button onClick={() => addArea({ ... })}>Add</button>;
}
```

### Undo/Redo

Automatic history tracking via Zundo:

```typescript
const { undo, redo } = useFloorplanStore.temporal.getState();

// Or via keyboard shortcuts: Ctrl+Z, Ctrl+Shift+Z
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- Canvas2D.test.tsx

# Run with UI
npm run test:ui

# Watch mode
npm run test -- --watch
```

### Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── store/              # Store slice tests
│   ├── lib/                # Utility function tests
│   └── components/         # Component unit tests
├── integration/            # Integration tests
│   ├── canvas/             # 2D canvas interactions
│   └── viewer/             # 3D viewer interactions
└── e2e/                    # End-to-end tests (Playwright)
    └── floorplan.spec.ts
```

---

## Troubleshooting

### Common Issues

**Canvas not rendering**
- Check browser console for WebGL errors
- Ensure Konva is properly imported
- Verify store has valid lot dimensions

**3D view shows black screen**
- Babylon.js requires WebGL 2.0
- Check if hardware acceleration is enabled
- Try updating graphics drivers

**Project not saving**
- Check browser's IndexedDB quota
- Clear site data and retry
- Check console for storage errors

**Performance issues with many areas**
- Enable layer caching: `layer.cache()`
- Disable grid on large lots
- Reduce label rendering frequency

### Debug Mode

Enable debug logging:

```typescript
// In browser console
localStorage.setItem('floorplan:debug', 'true');
location.reload();
```

---

## API Reference

See detailed contracts in:
- `specs/001-core-architecture-setup/contracts/store-api.md`
- `specs/001-core-architecture-setup/contracts/component-api.md`
- `specs/001-core-architecture-setup/data-model.md`

---

## Next Steps

After completing the quickstart:

1. **Read the Specification**: `specs/001-core-architecture-setup/spec.md`
2. **Understand the Data Model**: `specs/001-core-architecture-setup/data-model.md`
3. **Review Research Decisions**: `specs/001-core-architecture-setup/research.md`
4. **Check Implementation Tasks**: `specs/001-core-architecture-setup/tasks.md` (after `/speckit.tasks`)
