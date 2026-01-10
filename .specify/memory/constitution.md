<!--
SYNC IMPACT REPORT
==================
Version change: 0.0.0 → 1.0.0
Change type: MAJOR (Initial constitution creation)

Modified principles: N/A (initial creation)
Added sections:
  - Core Principles (5 principles)
  - Technology Stack
  - Development Workflow
  - Governance

Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ Compatible (no changes needed)
  - .specify/templates/spec-template.md: ✅ Compatible (no changes needed)
  - .specify/templates/tasks-template.md: ✅ Compatible (no changes needed)
  - .specify/templates/commands/*.md: No command templates found

Follow-up TODOs: None
==================
-->

# Floorplan Assembly Constitution

## Core Principles

### I. Measurement Accuracy First

Real-world dimensional accuracy is the PRIMARY constraint for all features. Every element
MUST store and display precise metric measurements (square meters, linear meters). Visual
representation quality is secondary to measurement integrity. All calculations, snapping,
and placement logic MUST preserve sub-centimeter precision internally (stored as millimeters
or equivalent).

**Rationale**: The application exists to help users understand spatial possibilities within
real lot dimensions. Inaccurate measurements render the tool useless for planning purposes.

### II. Single Source of Truth for Visual Representation

A single, canonical data model MUST govern all visual representations (2D canvas, export
formats, print layouts, etc.). Changes to the underlying data model MUST immediately reflect
in all active views. The application MUST NOT maintain separate, potentially divergent state
for different visualization modes. All transforms (position, scale, rotation) MUST use a
unified coordinate system.

**Rationale**: Users rely on consistent visual feedback across different views and export
formats. Data inconsistency destroys trust and causes planning errors.

**Note**: As of Feature 001 (2026-01-09), 3D visualization has been removed from the investment
platform. This principle now applies to 2D canvas rendering, export formats, and any future
visualization modes.

### III. Performance Over Fidelity

The application MUST prioritize responsive interaction (< 100ms for user actions) over
visual fidelity. The 2D editor MUST handle 100+ areas without lag. Progressive loading and
level-of-detail (LOD) strategies SHOULD be employed for complex scenes where applicable.

**Rationale**: Fast, intuitive floorplan creation requires immediate visual feedback. Users
will abandon a slow tool regardless of how good it looks.

### IV. Area-Centric Architecture

The core data primitive is the **Area** - a defined region with explicit dimensions (width,
height in meters), position, type/label, and optional attached assets. All features MUST
operate on Areas as the primary unit. Global operations (total area calculation, overlap
detection, export) MUST derive from the Area collection. Areas MUST support nesting for
multi-story structures.

**Rationale**: The user's mental model centers on "areas" (pool area, house area, etc.).
The architecture MUST mirror this conceptual model for intuitive operation.

### V. Import Flexibility with Explicit Dimensions

Imported assets (2D images, 3D models) MUST require explicit dimension specification at
import time. The system MUST NOT guess or auto-scale imported content without user
confirmation. Imported assets MUST be convertible between representations where possible
(2D footprint → 3D extrusion, 3D model → 2D projection). All imports MUST preserve or
request real-world scale.

**Rationale**: Without explicit dimensions, imported assets break measurement accuracy.
Users MUST consciously associate real-world size with every visual element.

## Technology Stack

**Frontend Framework**: React 18+ with TypeScript (strict mode)
**2D Rendering**: Konva.js with react-konva for object manipulation
**State Management**: Zustand for unified application state with Zundo undo/redo middleware
**Build System**: Vite for fast development iteration
**Testing**: Vitest for unit tests, Playwright for E2E tests
**Styling**: Tailwind CSS or CSS Modules

**Note**: Prior to Feature 001, the application included Babylon.js for 3D visualization. This
has been intentionally removed to focus on investment analysis capabilities and reduce bundle size.

**Storage**: IndexedDB for local persistence, JSON export/import, optional cloud sync
**File Formats**: JSON (native), optional DXF/SVG export for CAD interoperability

## Development Workflow

### Code Organization

- Feature-based folder structure under `src/features/`
- Shared utilities in `src/lib/`
- Core data models in `src/models/`
- 2D/3D rendering engines isolated in `src/rendering/`

### Quality Gates

1. **Type Safety**: TypeScript strict mode with no `any` types in core models
2. **Measurement Tests**: All dimension-related functions MUST have unit tests verifying
   precision preservation
3. **Performance Budget**: Core interactions MUST pass performance benchmarks before merge
4. **Browser Compatibility**: Support latest 2 versions of Chrome, Firefox, Safari, Edge

### Review Requirements

- All changes to measurement/coordinate systems require explicit reviewer approval
- Rendering performance changes MUST include performance impact assessment
- Data model changes MUST maintain backward compatibility or include migration

## Governance

This constitution represents the non-negotiable principles for the Floorplan Assembly
project. All implementation decisions, feature proposals, and code reviews MUST verify
compliance with these principles.

### Amendment Process

1. Proposed amendments MUST be documented with rationale
2. Breaking changes to principles require explicit user/stakeholder approval
3. All amendments MUST update the version and amendment date

### Versioning Policy

- **MAJOR**: Removal or fundamental redefinition of a principle
- **MINOR**: Addition of new principles or significant expansion of existing guidance
- **PATCH**: Clarifications, typo fixes, non-semantic refinements

### Compliance

- Every pull request MUST include a Constitution Check section
- Violations MUST be documented with justification if accepted
- Unreviewed violations block merge

**Version**: 1.1.0 | **Ratified**: 2025-12-30 | **Last Amended**: 2026-01-09

**Amendment History**:
- v1.1.0 (2026-01-09): Updated Principle II to reflect 2D-only architecture; removed 3D rendering from technology stack and performance requirements (Feature 001: Micro Villas Investment Platform)
