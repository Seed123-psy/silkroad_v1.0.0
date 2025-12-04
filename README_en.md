# Silk Road Visualization System

>An interactive research platform for exploring Silk Road transport networks across dynasties, combining 3D cartography, GIS analytics, and curated historical datasets.

## Feature Highlights

- Multi-era overlays of Silk Road routes (Liang Han, Meng Yuan, Ming Qing, Tang) with temporal filtering and contextual metadata panels.
- Hybrid 3D/2D visualization: a Three.js globe for macro routes plus Mapbox vector tiles for detail-level inspection.
- Artifact and trade analytics with ECharts-based charts that react to route selection, hand-gesture cues, or timeline scrubbing.
- Dataset processing toolkit that converts shapefiles, spreadsheets, and bibliographic sources into normalized JSON layers.
- Modular Vue 3 architecture with Pinia stores, Composition API hooks, and service layers for data access, exports, and model loading.

## Tech Stack & Architecture

- **Frontend**: Vue 3, Vue Router, Pinia, Vite, TypeScript.
- **Visualization**: Three.js, Mapbox GL JS, ECharts/ECharts-GL, custom shader-friendly textures.
- **Interaction**: GSAP animations, @headlessui/vue, @heroicons/vue icons, optional Mediapipe hand-landmarker with WASM runners (`public/wasm`).
- **Data handling**: shapefile/shpjs, fflate, custom processors in `src/utils/` and `scripts/` for ingestion from GIS shapefiles and Excel sources.
- **Documentation**: multilingual README, data licensing registry, references in GB/T, APA, and BibTeX formats.

See `PROJECT_STRUCTURE.md` for a detailed directory map and module breakdown.

## Prerequisites

- Node.js 18+ (LTS recommended) and npm 9+.
- Mapbox access token exported as `VITE_MAPBOX_TOKEN` in `.env.local` or `.env.development` (required for base maps).
- Optional: GPU/WebGL2 capable browser for Three.js globe rendering.

## Getting Started

```bash
git clone <repository-url>
cd silkroad_v1.0.0
npm ci
npm run dev
```

Visit the Vite dev server address (default `http://localhost:5173`) and allow the application to stream required shapefiles, textures, and WASM bundles from `public/`.

## Development Workflow

- `npm run dev` — Launch the Vite dev server with hot module replacement.
- `npm run build` — Run type checking (`vue-tsc`) and create a production build.
- `npm run preview` — Serve the build output locally for smoke testing.
- `npm run lint` — Execute ESLint across Vue/TS/JS files with autofix enabled.
- `npm run format` — Format the `src/` tree with Prettier for consistent styling.

Coding guidelines:
- Prefer Composition API + TypeScript-first components (`src/components/`).
- Keep dataset-specific transforms in `scripts/` or `src/utils/dataProcessor.ts` to ensure reproducibility.
- Register new Pinia stores under `src/stores/` and expose typed selectors via the central `stores/index.ts`.

## Data Pipeline & Licensing

- Curated datasets live in `public/data/<dynasty>/` with accompanying `README.md` documenting provenance, schema, and usage notes.
- Scripts under `scripts/` assist with data QA (`checkTangData.mjs`), format conversion (`convertLiangHanXlsx.mjs`), metadata harvesting (`extract_pdf_metadata.cjs`), and synthetic trade route generation (`generate_trades.mjs`).
- Aggregated license and usage guidance is maintained in `DATA_LICENSES.md`; cite sources using entries from `REFERENCES.md`, `REFERENCES_APA.md`, or `references.bib`.
- Code is released under MIT (`LICENSE`). Each dataset may carry additional restrictions—verify before redistribution or commercial use.

## Documentation & Supporting Material

- `README_zh.md` — Chinese quickstart and overview.
- `PROJECT_STRUCTURE.md` — Updated directory tree, dependency matrix, and configuration notes.
- `docs/` — Supplementary pages (e.g., curated paper metadata under `docs/pages/`).
- `CONTRIBUTORS.md` — Maintainers roster and contact channels.
- `REFERENCES.md` / `REFERENCES_APA.md` / `references.bib` — Citation formats covering all third-party materials.

## Contributing & Citation

- Review open tasks or propose enhancements via issues.
- Follow the lint/format scripts before submitting pull requests.
- Cite datasets and publications per `REFERENCES.md`, and retain attribution blocks in downstream work.

For questions or collaboration inquiries, refer to contact information listed in `CONTRIBUTORS.md`.
