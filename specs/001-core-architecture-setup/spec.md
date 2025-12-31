# Feature Specification: Core Architecture Setup

**Feature Branch**: `001-core-architecture-setup`
**Created**: 2025-12-30
**Status**: Draft
**Input**: User description: "Core architecture with 2D floorplan editor and 3D viewer for lot planning with game-like experience"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Base Floorplan (Priority: P1)

As a property planner, I want to create a new floorplan by defining my lot dimensions so that I have a working canvas representing my real-world property boundaries.

**Why this priority**: Without a base floorplan canvas, no other features can function. This is the foundation for all planning activities.

**Independent Test**: Can be fully tested by launching the app, entering lot dimensions (e.g., 50m x 30m), and seeing an empty canvas with a visible grid representing the lot at the correct scale.

**Acceptance Scenarios**:

1. **Given** the application is launched, **When** I enter lot dimensions (width: 50m, height: 30m), **Then** I see a 2D canvas with a grid overlay showing the lot boundaries with visible dimension labels.
2. **Given** I have created a lot, **When** I hover over any point on the canvas, **Then** I see the exact X,Y coordinates in meters from the lot origin.
3. **Given** I have created a lot, **When** I use zoom controls, **Then** the grid scale adjusts and dimension labels remain readable at all zoom levels.

---

### User Story 2 - Add and Manage Areas (Priority: P2)

As a property planner, I want to add named areas (pool, house, court, etc.) to my floorplan with specific dimensions so that I can visualize how different zones fit within my lot.

**Why this priority**: Areas are the core building blocks for planning. Users need to place and organize spaces before any visualization or import features become useful.

**Independent Test**: Can be fully tested by creating a base lot, adding 3-5 areas of different types/sizes, repositioning them, and verifying all dimensions display correctly.

**Acceptance Scenarios**:

1. **Given** I have an empty lot, **When** I add an area with name "Pool Area" and dimensions 10m x 5m, **Then** a rectangle appears on the canvas labeled "Pool Area" showing "10m x 5m = 50 m²".
2. **Given** I have placed an area, **When** I drag it to a new position, **Then** the area moves and its new X,Y coordinates update in real-time.
3. **Given** I have placed an area, **When** I resize it by dragging corner handles, **Then** the dimensions update in real-time showing the new width, height, and total square meters.
4. **Given** I have multiple areas, **When** two areas overlap, **Then** the system visually indicates the overlap and calculates the overlapping area in square meters.
5. **Given** I have areas on the lot, **When** I view the lot summary, **Then** I see total used area, remaining area, and a breakdown by area type.

---

### User Story 3 - View in 3D with Game-Like Navigation (Priority: P3)

As a property planner, I want to switch to a 3D view of my floorplan and navigate through it like a game so that I can understand spatial relationships and get an immersive feel for the layout.

**Why this priority**: 3D visualization brings the plan to life but requires the 2D foundation and areas to be meaningful. The game-like experience differentiates this tool from CAD software.

**Independent Test**: Can be fully tested by creating a lot with 3-4 areas, switching to 3D view, and navigating using WASD keys, mouse orbit, and zoom controls while verifying areas render as 3D blocks.

**Acceptance Scenarios**:

1. **Given** I have a 2D floorplan with areas, **When** I click "View in 3D", **Then** the view transitions to a 3D perspective showing all areas as extruded blocks on a ground plane.
2. **Given** I am in 3D view, **When** I use WASD keys, **Then** I can walk/fly through the scene smoothly at a consistent speed.
3. **Given** I am in 3D view, **When** I click and drag with the mouse, **Then** I can orbit around the scene and look in any direction.
4. **Given** I am in 3D view, **When** I use the scroll wheel, **Then** I can zoom in/out smoothly with the view remaining centered.
5. **Given** I am in 3D view, **When** I hover over an area, **Then** a tooltip shows the area name, dimensions, and square meters.
6. **Given** I modify an area in 2D, **When** I switch to 3D view, **Then** the changes are immediately reflected without manual sync.

---

### User Story 4 - Import and Position Assets (Priority: P4)

As a property planner, I want to import 2D or 3D images/models and place them in my floorplan with explicit real-world dimensions so that I can visualize specific structures or objects in context.

**Why this priority**: Asset import adds richness to plans but is enhancement over core planning. Requires the foundation (lot, areas, 3D view) to be complete first.

**Independent Test**: Can be fully tested by importing a sample image, specifying its real-world size (e.g., 8m x 6m for a house footprint), placing it on the lot, and verifying it displays at correct scale in both 2D and 3D.

**Acceptance Scenarios**:

1. **Given** I have a floorplan, **When** I import a 2D image file, **Then** I am prompted to enter the real-world dimensions (width and height in meters) before placement.
2. **Given** I have imported an asset, **When** I place it on the canvas, **Then** it displays at the correct scale relative to other areas and the lot grid.
3. **Given** I have a 2D image asset, **When** I view it in 3D, **Then** it appears as a textured plane or extruded shape at the correct position and scale.
4. **Given** I import a 3D model file, **When** I specify dimensions and place it, **Then** it renders in 3D view at the correct scale and position.
5. **Given** I have placed an asset, **When** I select it in 2D view, **Then** I can reposition, resize (maintaining aspect ratio or freely), or delete it.

---

### User Story 5 - Save and Load Projects (Priority: P5)

As a property planner, I want to save my floorplan project and load it later so that I can work on it across multiple sessions and share it with others.

**Why this priority**: Persistence is essential for real use but can be deferred until core editing features work. Export/import enables sharing and backup.

**Independent Test**: Can be fully tested by creating a complete floorplan with areas and assets, saving it, closing the app, reopening, loading the project, and verifying all data matches exactly.

**Acceptance Scenarios**:

1. **Given** I have a floorplan with areas and assets, **When** I click "Save", **Then** the project is saved locally and I receive confirmation.
2. **Given** I have saved projects, **When** I click "Load", **Then** I see a list of my saved projects with names and dates.
3. **Given** I load a project, **When** the project opens, **Then** all lot dimensions, areas, assets, and their positions are restored exactly.
4. **Given** I have a project, **When** I export it, **Then** I can download a project file that can be shared with others.
5. **Given** I receive an exported project file, **When** I import it, **Then** the project loads with all data intact.

---

### Edge Cases

- What happens when an area is placed partially outside the lot boundaries? (System warns but allows, or constrains to lot bounds?)
- What happens when the user tries to create a lot with zero or negative dimensions? (Validation prevents it)
- How does the system handle very large lots (1000m x 1000m) in terms of rendering performance? (Progressive loading, LOD)
- What happens if an imported 3D model is corrupted or in an unsupported format? (Error message with supported formats listed)
- How does the system handle extremely small areas (0.1m x 0.1m) vs very large areas (100m x 100m)? (Zoom adapts, labels scale)
- What happens during 2D-to-3D transition if there are many areas (100+)? (Performance maintained at 30+ FPS)

## Requirements *(mandatory)*

### Functional Requirements

**Core Canvas & Lot**
- **FR-001**: System MUST allow users to create a new floorplan by specifying lot dimensions in meters (width and height)
- **FR-002**: System MUST display a 2D canvas with a grid overlay scaled to real-world meters
- **FR-003**: System MUST show dimension labels that remain readable at all zoom levels
- **FR-004**: System MUST display real-time X,Y coordinates (in meters) when hovering over the canvas

**Area Management**
- **FR-005**: System MUST allow users to add rectangular areas with custom names and dimensions
- **FR-006**: System MUST display area labels showing name, dimensions (W x H), and calculated square meters
- **FR-007**: System MUST support area types/categories (pool, house, court, lounge, custom)
- **FR-008**: System MUST allow drag-and-drop repositioning of areas with real-time coordinate updates
- **FR-009**: System MUST allow resize of areas via corner/edge handles with real-time dimension updates
- **FR-010**: System MUST visually indicate overlapping areas and calculate overlap in square meters
- **FR-011**: System MUST support multi-story areas with elevation/height property for 3D representation
- **FR-012**: System MUST calculate and display total used area vs remaining lot area

**3D Visualization**
- **FR-013**: System MUST render areas as 3D extruded blocks with height based on elevation property
- **FR-014**: System MUST provide game-like navigation: WASD movement, mouse orbit, scroll zoom
- **FR-015**: System MUST maintain 30+ FPS during 3D navigation with 100 areas on screen
- **FR-016**: System MUST synchronize 2D and 3D views from a single data source (no divergence)
- **FR-017**: System MUST show tooltips in 3D view with area details on hover

**Asset Import**
- **FR-018**: System MUST require explicit dimension specification (meters) when importing any asset
- **FR-019**: System MUST support 2D image import (PNG, JPG, SVG) with user-specified real-world size
- **FR-020**: System MUST support 3D model import (GLTF/GLB format) with user-specified scale
- **FR-021**: Imported assets MUST display at correct scale relative to lot and areas in both views

**Data Persistence**
- **FR-022**: System MUST save projects locally with all lot, area, and asset data
- **FR-023**: System MUST support export to a portable file format for sharing
- **FR-024**: System MUST restore all data exactly when loading a saved project

**Performance & Precision**
- **FR-025**: System MUST store all measurements internally with millimeter precision (0.001m)
- **FR-026**: System MUST respond to user interactions within 100ms
- **FR-027**: System MUST handle lots up to 1000m x 1000m without degradation

### Key Entities

- **Project**: Container for a complete floorplan. Has lot dimensions, list of areas, list of assets, metadata (name, created date, modified date).

- **Lot**: The base property boundary. Has width (meters), height (meters), origin point. Defines the working canvas.

- **Area**: A defined zone within the lot. Has id, name, type (pool/house/court/lounge/custom), position (x, y in meters), dimensions (width, height in meters), elevation (height for 3D, in meters), color/style.

- **Asset**: An imported visual element. Has id, name, source file reference, specified dimensions (width, height in meters), position (x, y in meters), asset type (2D image or 3D model), scale factor.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a complete lot layout with 5+ areas in under 5 minutes
- **SC-002**: All dimension displays are accurate to centimeter precision (0.01m displayed, 0.001m stored)
- **SC-003**: 3D view maintains 30+ frames per second with 100 areas during navigation
- **SC-004**: 2D-to-3D view switch completes in under 1 second
- **SC-005**: User interactions (drag, resize, zoom) respond within 100 milliseconds
- **SC-006**: Saved projects load with 100% data fidelity (no dimension drift or position changes)
- **SC-007**: Users can navigate the 3D scene using game-like controls (WASD + mouse) without training
- **SC-008**: Imported assets display at the exact user-specified dimensions with zero scaling errors
- **SC-009**: System handles lots from 10m x 10m to 1000m x 1000m without performance degradation
- **SC-010**: Overlapping area detection is 100% accurate with correct overlap calculation

## Assumptions

- Users work primarily on modern desktop browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
- Users have basic familiarity with 2D drawing tools (drag, resize, click)
- Game-like 3D navigation (WASD, mouse look) is intuitive for the target user base
- Local storage (IndexedDB) is sufficient for MVP; cloud sync is a future enhancement
- GLTF/GLB is the primary 3D model format (industry standard, well-supported)
- Metric system (meters) is the default; imperial units are a potential future enhancement
