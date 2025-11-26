# Silk Road Visualization Project (v1.0.0)

This project is a comprehensive data visualization platform exploring the history, geography, and trade of the Silk Road. It leverages modern web technologies to provide interactive 3D maps, data charts, and immersive historical reconstructions.

## 🛠 Tech Stack

- **Core Framework:** [Vue 3](https://vuejs.org/) (Composition API) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **State Management:** [Pinia](https://pinia.vuejs.org/)
- **Routing:** [Vue Router](https://router.vuejs.org/)
- **3D Visualization:** [Three.js](https://threejs.org/) (WebGL)
- **Map Visualization:** [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- **Charts & Data Viz:** [Apache ECharts](https://echarts.apache.org/) + [Vue-ECharts](https://github.com/ecomfe/vue-echarts)
- **Animations:** [GSAP](https://greensock.com/gsap/)
- **GIS Data Parsing:** `shapefile`, `shpjs`, `fflate`
- **UI Components:** Headless UI, Heroicons
- **Styling:** SCSS (Sass)

## 📂 Project Structure

```
silkroad_v1.0.0/
├── public/              # Static assets (GIS data, textures, images)
├── src/
│   ├── assets/          # JSON data, global styles
│   ├── components/      # Reusable Vue components (Globe3D, Charts, etc.)
│   ├── router/          # Route definitions
│   ├── services/        # Data loading and processing services
│   ├── stores/          # Pinia state stores
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Helper functions (Three.js helpers, coordinate utils)
│   ├── views/           # Page views (Home, Transport, Trade, Silkroad, etc.)
│   ├── App.vue          # Root component
│   └── main.ts          # Application entry point
├── index.html           # HTML entry point
├── package.json         # Project dependencies and scripts
├── vite.config.ts       # Vite configuration
└── README.md            # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm or yarn

### Installation

1.  Clone the repository or navigate to the project directory.
2.  Install dependencies:

    ```bash
    npm install
    ```

### Development

Start the development server with hot-reload:

```bash
npm run dev
```

Access the application at `http://localhost:5173` (or the port shown in your terminal).

### Build

Build the project for production:

```bash
npm run build
```

The output will be in the `dist/` directory.

## ✨ Key Features

- **Interactive 3D Globe:** Visualizes Silk Road cities and routes on a 3D Earth model using Three.js.
- **Historical Maps:** Detailed transport and geographical maps using Mapbox GL.
- **Trade Analytics:** Interactive charts and graphs analyzing trade volume, goods, and economic data across different dynasties (Han, Tang, Song, Yuan, Ming, Qing).
-- **Silkroad Page:** The project includes a dedicated page for the Silk Road visualizations (formerly a Daming Palace reconstruction page). It may contain interactive or placeholder content depending on build.
- **GIS Data Support:** Native support for parsing and displaying Shapefile (.shp) and DBF data.

## 📦 Dependencies

The project relies on the following key packages (ensure these are in your `package.json`):

- `three`: For 3D rendering.
- `mapbox-gl`: For map rendering.
- `echarts` & `vue-echarts`: For statistical charts.
- `gsap`: For smooth animations.
- `shapefile` & `shpjs`: For reading GIS data formats.
- `pinia`: For state management.
- `vue-router`: For navigation.

## 📝 Notes

- Ensure you have a valid Mapbox Access Token if you plan to use Mapbox services extensively (configured in `src/views/Transport.vue` or `src/views/MingQing.vue`).
- Large GIS files in `public/data` are loaded asynchronously.
