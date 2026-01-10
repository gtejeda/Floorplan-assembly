# Feature Specification: Micro Villas Investment Platform

**Feature Branch**: `001-micro-villas-investment`
**Created**: 2026-01-09
**Status**: Draft
**Input**: User description: "Transform floor plan design tool into investment and budgeting platform for Micro Villas projects in Dominican Republic"

## Overview

This feature transforms the existing floor plan design tool into a comprehensive investment and budgeting platform for Micro Villas projects. Micro Villas solve the vacation property affordability problem by subdividing land into smaller lots with centralized social club amenities, allowing investors to own vacation property at a fraction of traditional villa costs and enjoy amenities from day one before building their individual villas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Land Investment Setup (Priority: P1)

An investment developer acquires a large plot of land in Dominican Republic and needs to configure the basic project parameters to evaluate its viability as a Micro Villas development.

**Why this priority**: Core foundation - without defining the land parcel and its characteristics, no other functionality can work. This is the entry point for all investment analysis.

**Independent Test**: Can be fully tested by entering land dimensions, location, cost, and viewing the saved project configuration. Delivers immediate value by capturing investment parameters.

**Acceptance Scenarios**:

1. **Given** a new project, **When** developer enters land dimensions (length/width or total area) in square meters or square feet, **Then** system calculates and displays total land area
2. **Given** land dimensions are entered, **When** developer specifies Dominican Republic province, land cost, urbanization status, and nearby landmarks, **Then** system stores all property characteristics
3. **Given** complete land information, **When** developer saves the project, **Then** all land parameters are persisted for future calculations

---

### User Story 2 - Automatic Subdivision Calculation (Priority: P1)

The developer needs to see all possible ways to subdivide the land parcel into Micro Villa lots plus a centralized social club area, considering 10-30% of land dedicated to the social club.

**Why this priority**: Critical for investment feasibility - developers need to know how many units they can create to calculate revenue potential. This is the core value proposition of the platform.

**Independent Test**: Can be fully tested by providing land dimensions and getting multiple subdivision scenarios showing different lot configurations and social club percentages. Delivers immediate value by showing development potential.

**Acceptance Scenarios**:

1. **Given** a land parcel with defined dimensions, **When** system calculates subdivisions, **Then** system generates multiple scenarios with social club ranging from 10% to 30% of total area
2. **Given** subdivision scenarios, **When** viewing each option, **Then** each scenario shows: number of Micro Villa lots, individual lot dimensions, social club dimensions, and social club location (centralized)
3. **Given** multiple subdivision options, **When** developer selects a preferred scenario, **Then** system uses this configuration for all subsequent calculations
4. **Given** a selected subdivision, **When** system calculates common area percentages, **Then** each Micro Villa lot includes its proportional share of common area ownership

---

### User Story 3 - Social Club Amenities Design (Priority: P2)

The developer needs to design the social club by selecting from a comprehensive list of amenities to attract buyers and differentiate the investment opportunity.

**Why this priority**: Important for marketability and value proposition, but can be added after basic subdivision is determined. Directly impacts project cost and buyer appeal.

**Independent Test**: Can be fully tested by selecting various amenities from a catalog (pool, BBQ area, lounge, pool chairs, umbrellas, etc.) and viewing the selected amenities list. Delivers value by defining the shared facilities that make Micro Villas attractive.

**Acceptance Scenarios**:

1. **Given** a subdivision is selected, **When** developer views amenities catalog, **Then** system displays comprehensive list of available amenities organized by category (aquatic, dining, recreation, storage, etc.)
2. **Given** the amenities catalog, **When** developer selects/deselects amenities, **Then** system updates the social club design configuration
3. **Given** selected amenities, **When** viewing social club design, **Then** system displays all chosen amenities with space requirements
4. **Given** social club design, **When** storage space is needed, **Then** developer can choose between: dedicated storage area in social club OR individual patio storage for each Micro Villa

---

### User Story 4 - Financial Analysis & Pricing (Priority: P2)

The developer needs comprehensive financial analysis showing total project costs, per-square-meter pricing, and individual Micro Villa lot pricing with target profit margins to determine investment viability.

**Why this priority**: Essential for investment decision-making but requires prior configuration (land, subdivision, amenities). This is where the platform proves its business value by showing profitability.

**Independent Test**: Can be fully tested by entering all costs (land, amenities, legal, other) and viewing calculated pricing with different profit margin targets. Delivers value by showing if the investment is financially viable.

**Acceptance Scenarios**:

1. **Given** a subdivision and amenities selection, **When** developer enters land acquisition cost, **Then** system records the base investment amount
2. **Given** selected amenities, **When** developer enters cost for each amenity item, **Then** system calculates total amenities investment
3. **Given** project configuration, **When** developer enters legal costs and other expenses (permits, infrastructure, etc.), **Then** system calculates total project cost
4. **Given** total project cost and number of Micro Villa lots, **When** system performs financial analysis, **Then** system displays: total project cost breakdown, cost per square meter, base lot pricing
5. **Given** base calculations, **When** developer specifies target profit percentage (e.g., 20%, 30%, 40%), **Then** system shows multiple pricing scenarios with different profit margins and final per-lot sale prices
6. **Given** financial analysis, **When** reviewing maintenance structure, **Then** system shows each owner's proportional maintenance contribution based on common area ownership percentage

---

### User Story 5 - AI-Ready Design Descriptions (Priority: P3)

The developer needs detailed textual descriptions of the Micro Villas project suitable for multi-modal AI systems to generate visual concepts and marketing materials.

**Note**: This user story title uses "AI-Ready Design Descriptions" for user-facing documentation; implementation refers to this feature as "AI description" for brevity.

**Why this priority**: Valuable for marketing and visualization but not critical for core investment analysis. Can be added after financial viability is confirmed.

**Independent Test**: Can be fully tested by generating a detailed text description from the configured project and verifying it contains all relevant details (location, lot dimensions, amenities, layout). Delivers value by enabling AI-powered visualization and marketing content generation.

**Acceptance Scenarios**:

1. **Given** a fully configured project (land, subdivision, social club, financials), **When** developer requests AI description, **Then** system generates comprehensive text including: location and province, total land area and lot count, individual lot dimensions, centralized social club description, complete amenities list, common area ownership structure, storage arrangements
2. **Given** an AI description, **When** developer copies the description, **Then** text is formatted optimally for multi-modal AI systems (clear structure, specific dimensions, descriptive details)

---

### User Story 6 - Image Management (Priority: P3)

The developer needs to attach and preview images for the land parcel and individual Micro Villa lots to document the property and visualize the project.

**Why this priority**: Useful for documentation and presentation but not essential for investment calculations. Adds visual context after financial viability is established.

**Independent Test**: Can be fully tested by uploading images to land parcel or specific Micro Villa lots, viewing thumbnails, and opening full previews. Delivers value by providing visual context for presentations.

**Acceptance Scenarios**:

1. **Given** a project, **When** developer uploads image(s) to the land parcel, **Then** system stores and displays image thumbnails associated with the property
2. **Given** a subdivision with Micro Villa lots, **When** developer uploads image(s) to specific lots, **Then** system associates images with individual lots and displays them
3. **Given** stored images, **When** developer clicks an image thumbnail, **Then** system displays full-size image preview
4. **Given** attached images, **When** project is exported, **Then** all images are included in the export

---

### User Story 7 - Project Export to Disk (Priority: P2)

The developer needs to save complete project data (configuration, financials, images) to a disk directory for backup, sharing, or version control.

**Why this priority**: Important for data portability and collaboration, but can function without it initially. Critical for professional use and data safety.

**Independent Test**: Can be fully tested by selecting a directory, exporting a project, and verifying all data (JSON configuration, images, financials) is saved to disk. Delivers value by enabling project backup and sharing.

**Acceptance Scenarios**:

1. **Given** a project with all configurations, **When** developer initiates export, **Then** system prompts to select/create a target directory on disk
2. **Given** a selected directory, **When** export proceeds, **Then** system creates structured folder containing: project JSON file with all configuration and financial data, images subfolder with all project images, clear naming convention for easy identification
3. **Given** completed export, **When** developer reviews the directory, **Then** all project data is present and organized for easy understanding

---

### User Story 8 - Project Import from Disk (Priority: P2)

The developer needs to load a previously exported project from a disk directory to continue work, share with team members, or review past projects.

**Why this priority**: Important for workflow continuity and collaboration, but secondary to creation features. Enables multi-session work and team collaboration.

**Independent Test**: Can be fully tested by selecting a directory containing exported project data and verifying all configuration, financials, and images load correctly. Delivers value by enabling project continuity.

**Acceptance Scenarios**:

1. **Given** an exported project directory, **When** developer initiates import, **Then** system prompts to select a directory containing project data
2. **Given** a valid project directory, **When** import proceeds, **Then** system loads: all land configuration and subdivision details, complete social club and amenities selection, all financial data and calculations, all associated images
3. **Given** a loaded project, **When** developer views the project, **Then** all data displays correctly as if it were the original working session
4. **Given** an invalid or corrupted project directory, **When** import is attempted, **Then** system displays clear error message explaining what is missing or invalid

---

### Edge Cases

- What happens when land dimensions result in awkward subdivision ratios that don't produce practical lot sizes?
  - System filters out scenarios where lots would be smaller than 90 sqm minimum
- How does system handle very small land parcels where 10-30% social club percentage makes lots too small to be viable?
  - System filters out non-viable scenarios; if no viable scenarios exist, user receives message indicating land is too small
- What happens when the developer changes subdivision after amenities and financials are configured?
  - All financial data is preserved and derived calculations automatically update (per FR-045, FR-046)
- How does system handle different units (square meters vs square feet) consistently across all calculations?
  - System converts all measurements to user's selected unit and maintains consistency throughout
- What happens when image files are large (multiple MB) - are there size limits?
  - Images up to 10MB are stored as-is; larger images may be compressed or rejected with notification (per FR-056)
- What happens during import if images referenced in JSON are corrupted or fail to load from blobs?
  - System displays placeholder indicators for corrupted/missing images (per FR-073)
- How does system handle provinces or landmarks with special characters or non-English names?
  - System accepts UTF-8 encoded text for all text inputs supporting international characters
- What happens when social club percentage would result in fractional or impractical dimensions?
  - System rounds dimensions to practical values (e.g., 0.1m precision) and validates minimum viable sizes
- How does system handle very large land parcels that could result in hundreds of Micro Villa lots?
  - System generates all 1% increment scenarios (10-30%) regardless of lot count; UI provides scrolling for large scenario lists

## Requirements *(mandatory)*

### Functional Requirements

#### Land Configuration (Priority: P1)

- **FR-001**: System MUST allow users to input land dimensions via length and width OR total area
- **FR-002**: System MUST support both square meters and square feet with automatic conversion
- **FR-003**: System MUST allow users to specify Dominican Republic province from a predefined list
- **FR-004**: System MUST allow users to input land acquisition cost in Dominican Pesos (DOP) or USD with currency selection
- **FR-005**: System MUST allow users to mark land as urbanized or non-urbanized
- **FR-006**: System MUST allow users to add multiple nearby landmarks (beaches, airports, tourist attractions, etc.) as free-text entries
- **FR-007**: System MUST persist all land configuration data

#### Subdivision Calculation (Priority: P1)

- **FR-008**: System MUST automatically calculate multiple subdivision scenarios varying social club percentage from 10% to 30% of total land area in 1% increments (up to 21 scenarios before filtering; non-viable scenarios with lots <90 sqm are filtered out per FR-019)
- **FR-009**: System MUST default to 20% social club percentage as the initial scenario
- **FR-010**: System MUST allow users to manually adjust social club percentage to any value between 10-30%
- **FR-011**: System MUST calculate optimal Micro Villa lot dimensions for each scenario ensuring rectangular or square lots
- **FR-012**: System MUST calculate and display the number of Micro Villa lots possible in each scenario
- **FR-013**: System MUST position social club in the center of the land parcel in all scenarios
- **FR-014**: System MUST ensure no internal streets are included in subdivision layouts
- **FR-015**: System MUST calculate each Micro Villa's proportional common area percentage based on lot size relative to total Micro Villa area
- **FR-016**: System MUST allow user to select one subdivision scenario as the active configuration
- **FR-017**: System MUST recalculate subdivisions when land dimensions change
- **FR-018**: System MUST enforce minimum lot size of 90 sqm per Micro Villa (including common area percentage)
- **FR-019**: System MUST filter out and not display subdivision scenarios where any lot would be smaller than 90 sqm
- **FR-020**: System MUST display subdivision scenarios as 2D top-down schematic diagrams with labeled rectangles showing lot positions, dimensions, and social club location (no 3D visualization)

#### Data Persistence (Priority: P1)

- **FR-021**: System MUST automatically save project data to browser local storage on every change
- **FR-022**: System MUST persist all project state including: land configuration, subdivision scenarios and selection, social club design, financial data, image file paths
- **FR-023**: System MUST restore project data from local storage when user returns to the application
- **FR-024**: System MUST provide visual indicator when auto-save occurs
- **FR-025**: System MUST allow users to clear local storage and start a new project

#### Social Club Design (Priority: P2)

- **FR-026**: System MUST provide a comprehensive amenities catalog including: aquatic (pools, jacuzzis), dining (BBQ areas, outdoor kitchens, dining pavilions), recreation (lounges, game areas, sports courts), furniture (pool chairs, umbrellas, tables), landscaping (gardens, pathways), utilities (bathrooms, changing rooms), storage facilities
- **FR-027**: System MUST allow users to select/deselect any combination of amenities
- **FR-028**: System MUST allow users to specify storage location: dedicated area in social club OR individual patio space per Micro Villa
- **FR-029**: System MUST display selected amenities with descriptions
- **FR-030**: System MUST persist social club design configuration
- **FR-031**: System MUST provide recommended default costs in USD for all amenities
- **FR-032**: System MUST allow users to override any default amenity cost with custom values

#### Financial Analysis (Priority: P2)

- **FR-033**: System MUST allow users to input cost for each selected amenity (or use recommended defaults)
- **FR-034**: System MUST allow users to input legal costs (notary, permits, registrations)
- **FR-035**: System MUST allow users to input other costs (infrastructure, utilities installation, landscaping, marketing) with custom labels
- **FR-036**: System MUST calculate total project cost: land cost + amenities cost + legal costs + other costs
- **FR-037**: System MUST calculate cost per square meter: total project cost / total land area
- **FR-038**: System MUST calculate base cost per Micro Villa lot: (total project cost - social club cost) / number of lots
- **FR-039**: System MUST allow users to specify target profit margin percentages (e.g., 15%, 20%, 25%, 30%)
- **FR-040**: System MUST calculate final lot sale price for each profit margin scenario: base cost per lot × (1 + profit margin)
- **FR-041**: System MUST display total project revenue for each pricing scenario: lot sale price × number of lots
- **FR-042**: System MUST calculate and display expected profit: total revenue - total project cost
- **FR-043**: System MUST allow users to input estimated total monthly maintenance cost for social club, then calculate each owner's proportional monthly contribution based on their common area ownership percentage (owner contribution = total monthly cost × owner's percentage)
- **FR-044**: System MUST support multi-currency display (DOP and USD) with exchange rate input
- **FR-045**: System MUST preserve all entered financial data when user changes subdivision scenario
- **FR-046**: System MUST automatically recalculate all derived financial values when subdivision scenario changes

#### AI Description Generation (Priority: P3)

- **FR-047**: System MUST generate detailed textual description of complete project including: location details, land dimensions, lot configuration, social club position and size, complete amenities list, lot dimensions and count, common area ownership structure, storage arrangements
- **FR-048**: System MUST format descriptions optimally for multi-modal AI consumption with clear sections and specific measurements
- **FR-049**: System MUST allow users to copy generated description to clipboard

#### Image Management (Priority: P3)

- **FR-050**: System MUST allow users to select multiple image files from disk for the land parcel
- **FR-051**: System MUST allow users to select multiple image files from disk for individual Micro Villa lots
- **FR-052**: System MUST store image data as blobs in IndexedDB with original filename metadata for session persistence
- **FR-053**: System MUST display image thumbnails in the interface by rendering from stored blob data
- **FR-054**: System MUST allow users to click thumbnails to view full-size images
- **FR-055**: System MUST support common image formats (JPEG, PNG, WebP)
- **FR-056**: System SHOULD handle images up to 10MB; larger images MAY be compressed or rejected with user notification
- **FR-057**: System MUST persist image blob associations with land parcels and lots in IndexedDB

#### Project Export (Priority: P2)

- **FR-058**: System MUST allow users to select a directory on disk for project export
- **FR-059**: System MUST create a structured export package containing: single JSON file with all configuration and financial data, images subfolder with all project images copied from their original locations
- **FR-060**: System MUST copy image files from their original disk locations to the export images subfolder
- **FR-061**: System MUST use clear naming conventions for exported files
- **FR-062**: System MUST validate export directory is writable before proceeding
- **FR-063**: System MUST provide success/failure feedback after export

#### Project Import (Priority: P2)

- **FR-064**: System MUST allow users to select a directory on disk for project import
- **FR-065**: System MUST validate directory contains required project files (JSON and images folder)
- **FR-066**: System MUST load all configuration data from JSON file
- **FR-067**: System MUST load all associated images from images subfolder
- **FR-068**: System MUST restore complete project state including: land configuration, selected subdivision, social club design, all financial data and calculations, all images
- **FR-069**: System MUST detect corrupted or invalid JSON fields during import
- **FR-070**: System MUST display detailed error message listing all invalid/corrupted fields when JSON validation fails
- **FR-071**: System MUST offer option to attempt partial recovery (load valid fields, skip invalid ones) when JSON is corrupted
- **FR-072**: System MUST show warning message listing which fields were skipped during partial recovery
- **FR-073**: System MUST handle missing images gracefully by displaying placeholder indicators

### Key Entities

- **Land Parcel**: The main investment property with dimensions (length/width or area), location (province), acquisition cost, urbanization status, nearby landmarks, and measurement unit (sqm/sqft)
- **Subdivision Scenario**: A calculated configuration showing one possible way to divide the land with social club percentage (10-30%), social club dimensions and position, Micro Villa lot count, individual lot dimensions, and common area percentages
- **Micro Villa Lot**: An individual subdivided unit with dimensions, lot number/identifier, common area ownership percentage, associated images, and storage configuration
- **Social Club**: The centralized shared amenities area with dimensions and position, selected amenities from catalog, storage facilities (if applicable), and total cost
- **Amenity**: A social club feature with name and category (aquatic, dining, recreation, etc.), description, space requirements, and individual cost
- **Financial Analysis**: The investment calculation with total project cost breakdown (land, amenities, legal, other), cost per square meter, base lot cost, multiple pricing scenarios with different profit margins, expected revenue and profit, and per-owner maintenance contributions
- **Project**: The complete investment package containing land parcel data, selected subdivision scenario, social club design, financial analysis, associated images (main land and lots), and export/import metadata

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Investment developers can configure complete land parcel parameters (dimensions, location, cost, characteristics) in under 5 minutes
- **SC-002**: System generates up to 21 subdivision scenarios (1% increments from 10-30% social club percentage) within 2 seconds of land configuration, filtering out scenarios with lots smaller than 90 sqm
- **SC-003**: Users can select and configure social club amenities from a catalog of at least 20 different options organized by category
- **SC-004**: System calculates complete financial analysis (total cost, per-sqm pricing, lot pricing, profit margins) automatically when all cost inputs are provided
- **SC-005**: Financial calculations update in real-time (under 1 second) when any cost parameter changes
- **SC-006**: Users can export complete projects (including all images) to disk in under 10 seconds
- **SC-007**: Users can import previously exported projects with 100% data fidelity (all configuration and images restored)
- **SC-008**: System generates AI-ready project descriptions containing all key details in under 3 seconds
- **SC-009**: 90% of users can complete a full project setup (land, subdivision selection, amenities, financials) in under 20 minutes
- **SC-010**: System handles land parcels ranging from 500 sqm to 50,000 sqm without performance degradation
- **SC-011**: All calculations maintain accuracy to 2 decimal places for financial values and areas

## Assumptions

- Dominican Republic provinces list is predefined and maintained separately (can be updated without code changes)
- Exchange rates between DOP and USD are manually entered by users (no automatic fetching)
- Social club is always rectangular and centered within the land parcel
- Micro Villa lots are rectangular (not irregular shapes)
- Maintenance cost calculations are proportional to common area ownership (not based on amenity usage)
- Storage space requirements are defined by the user (no automatic calculation of storage size needed)
- Land parcel is assumed to be rectangular or easily representable as total area
- Minimum lot size of 90 sqm (including common area percentage) is enforced - lots below this threshold are not viable
- Amenity default costs are based on Dominican Republic market research and maintained in a reference database
- When subdivision changes, all financial inputs remain valid and only derived calculations need updating
- Project data is automatically saved to browser local storage on every change for session persistence
- Images are stored as blobs in IndexedDB for persistent access across sessions; large images (>10MB) may be compressed
- Image files are extracted from IndexedDB blobs during export; import stores images back to IndexedDB as blobs
- One user works on one project at a time (no concurrent multi-user editing)
- Project JSON format is version 1.0 (future versions may need migration tools)
- Subdivision scenarios are displayed as 2D top-down schematics (no 3D visualization or rendering)
- Default social club percentage is 20% with 1% increment options from 10-30%

## Scope

### In Scope

- Land parcel configuration with Dominican Republic-specific location data
- Automatic subdivision calculations with centralized social club positioning
- Comprehensive amenities catalog for social club design
- Complete financial analysis with multiple profit margin scenarios
- Multi-currency support (DOP and USD)
- Image management for land parcels and individual lots
- AI-optimized project description generation
- Full project export/import to/from disk directories
- Common area ownership and maintenance calculations

### Out of Scope

- 3D visualization or rendering of subdivisions (existing 3D code should be removed; system uses 2D schematics only)
- Irregular or non-rectangular land parcels (Feature 001 only supports rectangular land; users must provide rectangular dimensions or total area)
- Automatic land valuation based on location (users input known costs)
- Integration with real estate listing platforms
- Legal document generation (contracts, titles, etc.)
- Buyer management or sales tracking
- Construction planning or villa design tools
- Loan/financing calculators or banking integrations
- Cloud storage or online project sharing
- Multi-user collaboration or role-based access
- Automatic zoning/regulatory compliance checking
- Streets or road layout within subdivisions
- Integration with mapping services (Google Maps, etc.)
- Mobile applications (desktop/web only)
- Automatic amenity space requirement calculations
- Property appreciation projections
- Comparison with similar projects or market analysis

## Dependencies

- Access to file system for project export/import operations
- User must provide all cost data (no external pricing databases)
- User must define amenity costs (no predefined pricing)
- User must know or research land acquisition costs
- Image files must be in supported formats and accessible on local system
- User must have basic knowledge of investment terms (profit margin, cost per sqm, etc.)

## Clarifications & Decisions

### Minimum Lot Size Requirements
- System enforces minimum 90 sqm per Micro Villa lot (includes proportional common area percentage)
- Subdivision scenarios that would result in lots smaller than 90 sqm are filtered out and not presented to users
- Ensures all generated lots are viable vacation properties

### Financial Data Handling on Subdivision Changes
- When user changes selected subdivision scenario, all entered financial data (land cost, amenity costs, legal costs, other costs) is preserved
- System automatically recalculates all derived values (per-sqm costs, per-lot pricing, profit scenarios) based on the new subdivision configuration
- Provides user convenience and maintains data continuity across scenario comparisons

### Amenity Pricing Approach
- System provides recommended default costs in USD for all amenities based on Dominican Republic market research
- Users can override any default cost with their specific vendor quotes or quality preferences
- Recommended costs serve as starting point to accelerate financial analysis while maintaining flexibility

### Session 2026-01-09

- Q: How should subdivision scenarios be displayed to users (given 3D code should be removed)? → A: 2D top-down schematic diagram with labeled rectangles (retain existing visualization approach)
- Q: Where should project data be stored when users are actively working (before export)? → A: Browser local storage with automatic save on every change
- Q: What should be the maximum file size allowed for uploaded images? → A: No size limit, store only local file paths (images remain on disk, not in browser cache)
- Q: What increments should the system use when generating subdivision scenarios between 10-30% social club percentage? → A: 1% increments (10-30%), default starting at 20%, with manual adjustment capability
- Q: When importing a project directory with corrupted or invalid JSON, what should happen? → A: Show detailed error message with option to attempt partial recovery (load valid fields, skip invalid ones)
