# 🚀 FIELD-OPS Copilot — Enterprise AI Field Service Assistant Platform

An enterprise-grade, production-ready, AI-native Field Service Assistant and Dispatch Optimization Platform. Built for Telecommunications, HVAC, Biomedical, Utilities, and Facility Management companies, this platform connects dispatchers, field technicians, and connected IoT assets with context-aware agentic AI pipelines.

---

## 🌟 Key Features & Capabilities

### 1. Smart Dispatcher Center (GIS Operations Control)
* **Real-time GIS Tracking**: Interactive visual board rendering active field technicians (direction triangles) and degraded asset sites (critical indicator pulses).
* **Autonomous AI Dispatcher**: Leverages Gemini (via `@google/genai`) to parse pending work orders, analyze technician skill matrix levels, locate nearest logistics zones, and deliver dynamic routing assignments.
* **Work Order Creator**: On-demand emergency ticket intake form dynamically updating the live operating scheduler pipeline.

### 2. Field Technician Mobile App (On-site Simulator)
* **Digital Checklists**: Live checkoff tasks tracking on-site diagnostic steps with automated status propagation.
* **On-Site AI Copilot Assistant**: Instantly fetches diagnostic isolation checks, Lock-Out Tag-Out (LOTO) protocols, and restoration guidelines.
* **Automated Ticket Reporter**: AI-generated client-facing resolution report compiling technician actions, parts replaced, and next maintenance scheduling dates.

### 3. IoT Equipment & Asset Twins
* **Connected Asset Registry**: In-depth hardware registry tracking biomedical monitors, HVAC scroll compressors, optical nodes, and smart grids.
* **MQTT Telemetry Simulation Feed**: A high-fidelity streaming background loop publishing temperature spikes, power rails voltage fluctuations, and signal attenuation metrics.

### 4. SOP Knowledge Library
* **Semantic Search & Manual Access**: Built-in repository of Standard Operating Procedures (SOPs) matching equipment models to enforce safety compliance.

---

## 🛠️ Technology Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS, Motion (Animations), Lucide-React Icons
* **Backend**: Express (Node.js), Tsx, Esbuild (CJS Standalone Bundler)
* **Intelligence Layer**: Google GenAI SDK (`gemini-3.5-flash`)
* **Transport**: Mock MQTT/SCADA streaming telemetry simulation over WebSockets/REST boundaries

---

## 🚀 Quick Start Guide

### Prerequisites
* Node.js v18+
* npm or yarn

### Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/field-ops-copilot.git
   cd field-ops-copilot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory (using `.env.example` as a template):
   ```env
   GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"
   ```

4. Run the Development Server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the live dashboard.

### Compilation / Production Build
To build and package the Express server and Vite frontend bundle into a production-ready container-compatible format:
```bash
npm run build
npm start
```

---

## 🧬 Project Structure

```text
├── server.ts               # Express Backend server with REST APIs & Gemini SDK pipelines
├── src/
│   ├── main.tsx            # React application entry point
│   ├── App.tsx             # Main Dashboard, Mobile app, Asset Twins, and SOP UI layout
│   ├── index.css           # Global typography & Tailwind configuration
│   └── types.ts            # Enterprise TypeScript types (Technician, WorkOrder, SOP, etc.)
├── metadata.json           # Platform requirements & frame permissions
├── package.json            # Deployment scripts, Node modules and build configurations
└── tsconfig.json           # TypeScript compilation guidelines
```

---

## 🛡️ License
Distributed under the Apache-2.0 License. See `LICENSE` for more information.
