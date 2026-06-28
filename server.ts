import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Ensure Express 4 or 5 is safe
const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize GoogleGenAI SDK safely
let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY && API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Successfully initialized GoogleGenAI with Gemini API Key.");
  } catch (err) {
    console.error("Error creating GoogleGenAI client:", err);
  }
} else {
  console.warn("No GEMINI_API_KEY found or it is default placeholder. AI features will run in Sandbox Simulation Mode.");
}

// Global In-Memory Store
let technicians = [
  { id: "T001", name: "Marcus Thorne", role: "Biomedical Specialist", status: "Active", location: { x: 30, y: 40, label: "Zone Alpha" }, contact: "+1 (555) 019-2811", skills: ["Biomedical Tech", "Ventilators", "MRI Systems", "Calibration"], battery: 92, avatar: "MT" },
  { id: "T002", name: "Carlos Santana", role: "HVAC Senior Tech", status: "Active", location: { x: 75, y: 35, label: "Zone Beta" }, contact: "+1 (555) 019-3289", skills: ["HVAC", "Compressors", "Energy Auditing", "Chillers"], battery: 84, avatar: "CS" },
  { id: "T003", name: "Sarah Jenkins", role: "Fiber & Telecom Engineer", status: "On-Route", location: { x: 45, y: 70, label: "Zone Delta" }, contact: "+1 (555) 019-4501", skills: ["Optical Fiber", "Splicing", "Network Routing", "GPON"], battery: 76, avatar: "SJ" },
  { id: "T004", name: "David Kim", role: "Smart Grid Electrician", status: "Busy", location: { x: 20, y: 80, label: "Zone Gamma" }, contact: "+1 (555) 019-7123", skills: ["Power Grid", "Substation Protection", "Smart Meters"], battery: 52, avatar: "DK" },
  { id: "T005", name: "Elena Rostova", role: "Water Systems Engineer", status: "Offline", location: { x: 80, y: 85, label: "Out of Bounds" }, contact: "+1 (555) 019-9023", skills: ["Hydrodynamics", "Flow Regulation", "Valve Actuation"], battery: 12, avatar: "ER" }
];

let workOrders = [
  {
    id: "WO-2026-001",
    client: "Mercy General Hospital",
    assetId: "AST-8801",
    assetName: "GE Carescape B105 Patient Monitor",
    description: "Multi-parameter patient monitor failing self-calibration on boot. SpO2 readings drifting.",
    priority: "Critical",
    status: "Assigned",
    technicianId: "T001",
    location: { x: 32, y: 42, label: "Mercy Gen ICU Wing" },
    scheduledDate: "2026-06-19T13:00:00.000Z",
    slaGraceMs: 14400000, // 4 hours
    createdAt: "2026-06-19T08:30:00.000Z",
    tasks: [
      { id: 1, text: "Verify Power Rails & Calibration Check", completed: false },
      { id: 2, text: "Conduct optical signal-to-noise check", completed: false },
      { id: 3, text: "Perform diagnostic firmware reset", completed: false },
      { id: 4, text: "Execute final safety leak test", completed: false }
    ],
    history: [
      { date: "2026-06-19T08:30:00.000Z", label: "Work order created automatically via API request ingestion." },
      { date: "2026-06-19T09:00:00.000Z", label: "Assigned to Marcus Thorne based on Biomedical Tech skill match." }
    ]
  },
  {
    id: "WO-2026-002",
    client: "Apex Manufacturing Plant 4",
    assetId: "AST-1049",
    assetName: "Carrier Sentinel Twin Scroll Compressor",
    description: "Excessive vibration and periodic high discharge temperature alerts from SCADA node 12.",
    priority: "High",
    status: "In-Progress",
    technicianId: "T002",
    location: { x: 72, y: 38, label: "Apex Plant B - Sector 3" },
    scheduledDate: "2026-06-19T11:00:00.000Z",
    slaGraceMs: 28800000, // 8 hours
    createdAt: "2026-06-19T07:15:00.000Z",
    tasks: [
      { id: 1, text: "Conduct vibration spectrum analysis", completed: true },
      { id: 2, text: "Check lubricant viscosity & oil level", completed: true },
      { id: 3, text: "Clear thermo-expansion valve occlusion", completed: false },
      { id: 4, text: "Calibrate thermistor tolerances", completed: false }
    ],
    history: [
      { date: "2026-06-19T07:15:00.000Z", label: "Work order flagged by automated IoT Predictive Maintenance Agent." },
      { date: "2026-06-19T08:00:00.000Z", label: "Dispatcher Carlos confirmed routing scheduled." },
      { date: "2026-06-19T11:15:00.000Z", label: "Carlos Santana set status to In-Progress." }
    ]
  },
  {
    id: "WO-2026-003",
    client: "Metro Fiber Ring Delta",
    assetId: "AST-3021",
    assetName: "Nokia OptiX OSN Splicing Node",
    description: "Optical attenuation dropped by 6dB near splice bay B14. Suspect micro-bend or physical strain.",
    priority: "Medium",
    status: "On-Route",
    technicianId: "T003",
    location: { x: 44, y: 68, label: "Subway Shaft Entrance 4C" },
    scheduledDate: "2026-06-19T14:30:00.000Z",
    slaGraceMs: 86400000, // 24 hours
    createdAt: "2026-06-19T10:00:00.000Z",
    tasks: [
      { id: 1, text: "OTDR (Optical Time Domain Reflectometer) test", completed: false },
      { id: 2, text: "Inspect fiber ribbon for acute bending strain", completed: false },
      { id: 3, text: "Re-splice degraded fiber leads", completed: false }
    ],
    history: [
      { date: "2026-06-19T10:00:00.000Z", label: "Customer service intake team submitted broadband outage alert." },
      { date: "2026-06-19T10:30:00.000Z", label: "Dispatched to Sarah Jenkins; on-route route calculation active." }
    ]
  },
  {
    id: "WO-2026-004",
    client: "City Substations Group",
    assetId: "AST-9040",
    assetName: "Siemens SPS Smart Meter Hub",
    description: "Routine firmware synchronization and inspection of protective relay settings.",
    priority: "Low",
    status: "Unassigned",
    technicianId: "",
    location: { x: 18, y: 82, label: "Substation South 2" },
    scheduledDate: "2026-06-20T09:00:00.000Z",
    slaGraceMs: 172800000, // 48 hours
    createdAt: "2026-06-19T11:00:00.000Z",
    tasks: [
      { id: 1, text: "Verify backup lithium battery capacity", completed: false },
      { id: 2, text: "Synchronize local clock to NTP", completed: false },
      { id: 3, text: "Install physical polycarbonate shield", completed: false }
    ],
    history: [
      { date: "2026-06-19T11:00:00.000Z", label: "Scheduled maintenance ticket generated." }
    ]
  }
];

const mockAssets = [
  { id: "AST-8801", name: "GE Carescape B105 Patient Monitor", type: "Biomedical", model: "B105-V3", installationDate: "2023-11-12", location: "Mercy General ICU Wing", status: "Degraded", lastService: "2026-02-14", telemetry: { currentTemp: 39.4, vibration: "Normal", dutyCycle: "88%", healthScore: 78 } },
  { id: "AST-1049", name: "Carrier Sentinel Twin Scroll Compressor", type: "HVAC", model: "CS-TwinScroll", installationDate: "2021-04-18", location: "Apex Plant B - Sector 3", status: "Critical Alert", lastService: "2026-05-10", telemetry: { currentTemp: 84.8, vibration: "Over Limits (4.2 mm/s)", dutyCycle: "95%", healthScore: 48 } },
  { id: "AST-3021", name: "Nokia OptiX OSN Splicing Node", type: "Telecom", model: "OSN-9800", installationDate: "2024-08-01", location: "Metro Ring Delta", status: "Warning", lastService: "2025-11-20", telemetry: { attenuation: "8.4 dB/km (Max 2.0)", errorRate: "1.4e-5", healthScore: 68 } },
  { id: "AST-9040", name: "Siemens SPS Smart Meter Hub", type: "Utilities", model: "SPS-M4", installationDate: "2022-01-15", location: "Substation South 2", status: "Operational", lastService: "2025-06-19", telemetry: { batteryVoltage: "3.62V (Good)", loadFactor: "42%", healthScore: 99 } }
];

const mockSOPs = [
  { id: "SOP-BIO-401", title: "GE Carescape Drifting Calibration Protocol", category: "Biomedical", summary: "Step-by-step diagnostic sequence for correcting calibration drifting error on GE Carescape patient monitors.", steps: ["Disconnect clinical transducers", "Measure 5V reference voltage at test point TP14", "Execute thermal reset via BIOS diagnostic override menu", "Re-engage oxygen sensor array and test with gas calibrator."] },
  { id: "SOP-HVAC-90", title: "Scroll Compressor Thermal Overload Bypass & Vibration Mitigation", category: "HVAC", summary: "Resolving thermal overload errors and mechanical stress in Carrier twin-scroll compressor configurations.", steps: ["Shut down compressor electrical feeds and perform Lock-Out Tag-Out (LOTO)", "Check cooling bypass valves for physical mechanical debris", "Retorque anchor mounting harness bolts to specified 120 Nm", "Introduce high-viscosity coolant additive and evaluate sensor feedback."] },
  { id: "SOP-TEL-102", title: "OTDR Fiber Bend Splicing Calibration", category: "Telecom", summary: "Guidance on identifying physical fiber micro-bending versus degradation issues and running high precision fusion splicing.", steps: ["Launch OTDR scan at 1310nm and 1550nm waves", "Locate spike distance marker indicating mechanical stress points", "Carefully unbind strain cables and run core-alignment splicing with Arc clean."] }
];

// Operational and IoT Predictive Telemetry State
let telemetryFeed = [
  { id: "E001", timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(), assetId: "AST-1049", assetName: "Carrier Sentinel Twin Scroll Compressor", parameter: "Vibration Index", value: "4.8 mm/s", status: "Danger", description: "Vibration threshold exceeded 3.5 mm/s maximum tolerances on twin scroll housing." },
  { id: "E002", timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), assetId: "AST-8801", assetName: "GE Carescape B105 Patient Monitor", parameter: "Internal Thermistor", value: "39.4°C", status: "Warning", description: "Internal chassis temperature elevating above baseline normal parameters." },
  { id: "E003", timestamp: new Date(Date.now() - 1000 * 60 * 32).toISOString(), assetId: "AST-3021", assetName: "Nokia OptiX OSN Splicing Node", parameter: "Optical Loss Bandwidth", value: "-6.2 dB Drop", status: "Critical", description: "Acute attenuation deflection detected. Suspected fiber strain in micro-duct sector Delta." }
];

// Helper to push random events
setInterval(() => {
  const randomAsset = mockAssets[Math.floor(Math.random() * mockAssets.length)];
  let parameter = "";
  let value = "";
  let status = "Healthy";
  let description = "";

  if (randomAsset.type === "HVAC") {
    parameter = "discharge_temp";
    const v = (70 + Math.random() * 25).toFixed(1);
    value = `${v}°C`;
    status = parseFloat(v) > 82 ? "Warning" : "Healthy";
    description = status === "Warning" ? "Chamber discharge thermal range drifting above nominal parameters." : "Normal operational telemetry verified.";
  } else if (randomAsset.type === "Biomedical") {
    parameter = "ref_voltage";
    const v = (4.8 + Math.random() * 0.4).toFixed(2);
    value = `${v} V`;
    status = parseFloat(v) < 4.9 || parseFloat(v) > 5.1 ? "Warning" : "Healthy";
    description = status === "Warning" ? "Referral sensor regulator reports rail voltage fluctuations." : "Power rails within standard calibration thresholds.";
  } else {
    parameter = "signal_attenuation";
    const v = (1.5 + Math.random() * 5.0).toFixed(2);
    value = `${v} dB/km`;
    status = parseFloat(v) > 3.0 ? "Warning" : "Healthy";
    description = status === "Warning" ? "Optical degradation exceeding nominal design limits." : "Signal integrity verified.";
  }

  const newEvent = {
    id: "E" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    assetId: randomAsset.id,
    assetName: randomAsset.name,
    parameter,
    value,
    status,
    description
  };
  telemetryFeed.unshift(newEvent);
  if (telemetryFeed.length > 50) telemetryFeed.pop();
}, 25000); // Add simulated events periodically

// ==========================================
// REST API ENDPOINTS
// ==========================================

// Get all technicians
app.get("/api/techs", (req, res) => {
  res.json(technicians);
});

// Update technician status/location
app.post("/api/techs/update", (req, res) => {
  const { id, status, battery, location } = req.body;
  const tech = technicians.find(t => t.id === id);
  if (tech) {
    if (status) tech.status = status;
    if (battery !== undefined) tech.battery = battery;
    if (location) tech.location = location;
    return res.json({ success: true, technician: tech });
  }
  res.status(404).json({ error: "Technician not found" });
});

// Get all work orders
app.get("/api/workorders", (req, res) => {
  res.json(workOrders);
});

// Create new work order
app.post("/api/workorders", (req, res) => {
  const { client, assetId, assetName, description, priority, location } = req.body;
  
  const ids = workOrders.map(w => {
    const match = w.id.match(/WO-2026-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  });
  const maxId = ids.length > 0 ? Math.max(...ids) : 0;
  const nextId = maxId + 1;
  const newWoId = `WO-2026-${String(nextId).padStart(3, "0")}`;

  const newWo = {
    id: newWoId,
    client: client || "Enterprise Customer",
    assetId: assetId || "AST-GENERIC",
    assetName: assetName || "Field Utility Asset",
    description: description || "No detailed service description supplied.",
    priority: priority || "Medium",
    status: "Unassigned",
    technicianId: "",
    location: location || { x: 50, y: 50, label: "Assigned Coordinates" },
    scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow
    slaGraceMs: priority === "Critical" ? 14400000 : priority === "High" ? 28800000 : 86400000,
    createdAt: new Date().toISOString(),
    tasks: [
      { id: 1, text: "Perform general visual site verification & audit", completed: false },
      { id: 2, text: "Execute component diagnostic routines", completed: false },
      { id: 3, text: "Draft comprehensive resolution checkoff log", completed: false }
    ],
    history: [
      { date: new Date().toISOString(), label: "Work order initialized manually by Dispatcher Office." }
    ]
  };
  workOrders.unshift(newWo);
  res.status(201).json(newWo);
});

// Update single work order (status, active tasks)
app.post("/api/workorders/update", (req, res) => {
  const { id, status, technicianId, tasks, appendLog } = req.body;
  const wo = workOrders.find(w => w.id === id);
  if (wo) {
    if (status) {
      wo.status = status;
      wo.history.unshift({ date: new Date().toISOString(), label: `Status updated to [${status}].` });
    }
    if (technicianId !== undefined) {
      wo.technicianId = technicianId;
      const tech = technicians.find(t => t.id === technicianId);
      if (tech) {
        wo.history.unshift({ date: new Date().toISOString(), label: `Assigned technician: ${tech.name} (${tech.role}).` });
      } else if (technicianId === "") {
        wo.history.unshift({ date: new Date().toISOString(), label: "Work order set to unassigned." });
      }
    }
    if (tasks) {
      wo.tasks = tasks;
    }
    if (appendLog) {
      wo.history.unshift({ date: new Date().toISOString(), label: appendLog });
    }
    return res.json({ success: true, workOrder: wo });
  }
  res.status(404).json({ error: "Work order not found" });
});

// Delete or cancel work order
app.delete("/api/workorders/:id", (req, res) => {
  const { id } = req.params;
  const index = workOrders.findIndex(w => w.id === id);
  if (index !== -1) {
    workOrders.splice(index, 1);
    return res.json({ success: true, message: `Work order ${id} removed successfully.` });
  }
  res.status(404).json({ error: "Work order not found" });
});

// Reset simulation to fresh defaults
app.post("/api/system/reset", (req, res) => {
  technicians = [
    { id: "T001", name: "Marcus Thorne", role: "Biomedical Specialist", status: "Active", location: { x: 30, y: 40, label: "Zone Alpha" }, contact: "+1 (555) 019-2811", skills: ["Biomedical Tech", "Ventilators", "MRI Systems", "Calibration"], battery: 92, avatar: "MT" },
    { id: "T002", name: "Carlos Santana", role: "HVAC Senior Tech", status: "Active", location: { x: 75, y: 35, label: "Zone Beta" }, contact: "+1 (555) 019-3289", skills: ["HVAC", "Compressors", "Energy Auditing", "Chillers"], battery: 84, avatar: "CS" },
    { id: "T003", name: "Sarah Jenkins", role: "Fiber & Telecom Engineer", status: "On-Route", location: { x: 45, y: 70, label: "Zone Delta" }, contact: "+1 (555) 019-4501", skills: ["Optical Fiber", "Splicing", "Network Routing", "GPON"], battery: 76, avatar: "SJ" },
    { id: "T004", name: "David Kim", role: "Smart Grid Electrician", status: "Busy", location: { x: 20, y: 80, label: "Zone Gamma" }, contact: "+1 (555) 019-7123", skills: ["Power Grid", "Substation Protection", "Smart Meters"], battery: 52, avatar: "DK" },
    { id: "T005", name: "Elena Rostova", role: "Water Systems Engineer", status: "Offline", location: { x: 80, y: 85, label: "Out of Bounds" }, contact: "+1 (555) 019-9023", skills: ["Hydrodynamics", "Flow Regulation", "Valve Actuation"], battery: 12, avatar: "ER" }
  ];

  workOrders = [
    {
      id: "WO-2026-001",
      client: "Mercy General Hospital",
      assetId: "AST-8801",
      assetName: "GE Carescape B105 Patient Monitor",
      description: "Multi-parameter patient monitor failing self-calibration on boot. SpO2 readings drifting.",
      priority: "Critical",
      status: "Assigned",
      technicianId: "T001",
      location: { x: 32, y: 42, label: "Mercy Gen ICU Wing" },
      scheduledDate: "2026-06-19T13:00:00.000Z",
      slaGraceMs: 14400000,
      createdAt: "2026-06-19T08:30:00.000Z",
      tasks: [
        { id: 1, text: "Verify Power Rails & Calibration Check", completed: false },
        { id: 2, text: "Conduct optical signal-to-noise check", completed: false },
        { id: 3, text: "Perform diagnostic firmware reset", completed: false },
        { id: 4, text: "Execute final safety leak test", completed: false }
      ],
      history: [
        { date: "2026-06-19T08:30:00.000Z", label: "Work order created automatically via API request ingestion." },
        { date: "2026-06-19T09:00:00.000Z", label: "Assigned to Marcus Thorne based on Biomedical Tech skill match." }
      ]
    },
    {
      id: "WO-2026-002",
      client: "Apex Manufacturing Plant 4",
      assetId: "AST-1049",
      assetName: "Carrier Sentinel Twin Scroll Compressor",
      description: "Excessive vibration and periodic high discharge temperature alerts from SCADA node 12.",
      priority: "High",
      status: "In-Progress",
      technicianId: "T002",
      location: { x: 72, y: 38, label: "Apex Plant B - Sector 3" },
      scheduledDate: "2026-06-19T11:00:00.000Z",
      slaGraceMs: 28800000,
      createdAt: "2026-06-19T07:15:00.000Z",
      tasks: [
        { id: 1, text: "Conduct vibration spectrum analysis", completed: true },
        { id: 2, text: "Check lubricant viscosity & oil level", completed: true },
        { id: 3, text: "Clear thermo-expansion valve occlusion", completed: false },
        { id: 4, text: "Calibrate thermistor tolerances", completed: false }
      ],
      history: [
        { date: "2026-06-19T07:15:00.000Z", label: "Work order flagged by automated IoT Predictive Maintenance Agent." },
        { date: "2026-06-19T08:00:00.000Z", label: "Dispatcher Carlos confirmed routing scheduled." },
        { date: "2026-06-19T11:15:00.000Z", label: "Carlos Santana set status to In-Progress." }
      ]
    },
    {
      id: "WO-2026-003",
      client: "Metro Fiber Ring Delta",
      assetId: "AST-3021",
      assetName: "Nokia OptiX OSN Splicing Node",
      description: "Optical attenuation dropped by 6dB near splice bay B14. Suspect micro-bend or physical strain.",
      priority: "Medium",
      status: "On-Route",
      technicianId: "T003",
      location: { x: 44, y: 68, label: "Subway Shaft Entrance 4C" },
      scheduledDate: "2026-06-19T14:30:00.000Z",
      slaGraceMs: 86400000,
      createdAt: "2026-06-19T10:00:00.000Z",
      tasks: [
        { id: 1, text: "OTDR (Optical Time Domain Reflectometer) test", completed: false },
        { id: 2, text: "Inspect fiber ribbon for acute bending strain", completed: false },
        { id: 3, text: "Re-splice degraded fiber leads", completed: false }
      ],
      history: [
        { date: "2026-06-19T10:00:00.000Z", label: "Customer service intake team submitted broadband outage alert." },
        { date: "2026-06-19T10:30:00.000Z", label: "Dispatched to Sarah Jenkins; on-route route calculation active." }
      ]
    },
    {
      id: "WO-2026-004",
      client: "City Substations Group",
      assetId: "AST-9040",
      assetName: "Siemens SPS Smart Meter Hub",
      description: "Routine firmware synchronization and inspection of protective relay settings.",
      priority: "Low",
      status: "Unassigned",
      technicianId: "",
      location: { x: 18, y: 82, label: "Substation South 2" },
      scheduledDate: "2026-06-20T09:00:00.000Z",
      slaGraceMs: 172800000,
      createdAt: "2026-06-19T11:00:00.000Z",
      tasks: [
        { id: 1, text: "Verify backup lithium battery capacity", completed: false },
        { id: 2, text: "Synchronize local clock to NTP", completed: false },
        { id: 3, text: "Install physical polycarbonate shield", completed: false }
      ],
      history: [
        { date: "2026-06-19T11:00:00.000Z", label: "Scheduled maintenance ticket generated." }
      ]
    }
  ];

  res.json({ success: true, workOrders, technicians });
});

// Get Assets
app.get("/api/assets", (req, res) => {
  res.json(mockAssets);
});

// Get Telemetry Feed
app.get("/api/telemetry", (req, res) => {
  res.json(telemetryFeed);
});

// Get SOP reference content
app.get("/api/sops", (req, res) => {
  res.json(mockSOPs);
});

// ==========================================
// GEMINI INTELLIGENCE API ROUTE AGENTS
// ==========================================

// Model preference: Use the recommended gemini-3.5-flash for standard full-stack tasks
const LLM_MODEL = "gemini-3.5-flash";

// 1. Diagnostics, Isolation, and Troubleshoot Copilot for mobile technician
app.post("/api/gemini/copilot", async (req, res) => {
  const { symptom, assetId, assetName, modelNumber } = req.body;

  if (!symptom) {
    return res.status(400).json({ error: "Symptom or issue description is required" });
  }

  // Retrieve relevant SOP if available
  const matchingSop = mockSOPs.find(
    s => s.title.toLowerCase().includes(assetName?.toLowerCase()) ||
         s.summary.toLowerCase().includes(assetName?.toLowerCase())
  );

  const prompt = `You are the Expert Agentic Field Service Copilot assisting a certified field technician on-site.
Asset ID: ${assetId || "Unknown"}
Asset Name: ${assetName || "Generic Industrial Machinery"}
Asset Model Number: ${modelNumber || "N/A"}
On-Site Technician Reported Symptom: "${symptom}"

${matchingSop ? `Reference Standard Manual SOP Context: 
Title: ${matchingSop.title}
Key Steps: ${matchingSop.steps.join(", ")}` : ""}

Provide a precise, highly tactical industrial calibration & repair sequence.
Follow these constraints:
1. Include "Immediate Safety Check" first (vital safety procedures or Lock-Out Tag-Out LOTO directives).
2. Outline "Isolation Diagnostics" (which diagnostic variables, test points, or voltmeter checks to measure).
3. Provide "Repair Actions" (specific calibration or physical replacement recommendations).
4. Outline "Functional Validation" tests to verify nominal performance before restoring online service.
5. Format the output in clean, readable Markdown without conversational filler. Keep it compact, highly visible on a field mobile screens.`;

  try {
    if (ai) {
      const response = await ai.models.generateContent({
        model: LLM_MODEL,
        contents: prompt,
      });

      res.json({ text: response.text });
    } else {
      // Sandbox Simulation Fallback
      const fallbackText = `### ⚠️ [Sandbox Simulation Mode Active] 
To enable full AI diagnostics, add your \`GEMINI_API_KEY\` to **Settings > Secrets** in the AI Studio platform.

#### 🛠️ Field Service Diagnostic Sequence (Simulated)
**For: ${assetName || "Field Asset"} (${modelNumber || "All Models"})**
**Symptom:** *"${symptom}"*

1. **Immediate Safety Action (LOTO)**
   - De-energize the main line circuit breaker. 
   - Apply standard Lock-Out Tag-Out padlock on the auxiliary supply bus.
   - Ground any storage capacitors or pressure relief loops.

2. **Isolation & Check Diagnostics**
   - Use a calibrated voltmeter to verify zero power state across primary terminals.
   - Inspect internal sensor contacts (thermistor arrays, optical connectors) for high resistance thermal soot.
   - Measure 5V auxiliary rail and calibration outputs. Verify drift tolerances.

3. **Recommended Remedial Action**
   - Recalibrate drift scaling using standard multi-meter test procedures.
   - If attenuation or resistance exceeds limit tolerances, swap physical transducer connector blocks.
   - Clean optical and mechanical terminal pathways with specialized anhydrous isopropyl alcohol solver.

4. **Functional Site Performance Validation**
   - Restore nominal loop circuit supply breaker safely.
   - Run autonomous manufacturer self-calibration startup diagnostics cycle.
   - Log compliance metrics into telemetry system, confirm health is >90% before closing ticket.`;

      res.json({ text: fallbackText });
    }
  } catch (error: any) {
    console.error("Gemini Copilot Error:", error);
    res.status(500).json({ error: "Gemini Copilot execution failed", details: error.message });
  }
});

// 2. Technician work report compiler (Auto-drafting a professional final ticket writeup)
app.post("/api/gemini/report", async (req, res) => {
  const { workOrder, actionTaken, partsReplaced, timeSpentMin, checklist } = req.body;

  if (!workOrder) {
    return res.status(400).json({ error: "Work Order details are required" });
  }

  const prompt = `You are an operational inspector AI agent auditing field service completions.
Compile a professional summary report for dispatch supervisors and customer transparency.

Work Order ID: ${workOrder.id}
Client: ${workOrder.client}
Asset: ${workOrder.assetName}
Description of Work: ${workOrder.description}
Technician Remediation Actions Triggered: "${actionTaken}"
Parts Replaced: "${partsReplaced || "None"}"
Total Working Duration: ${timeSpentMin || 60} Minutes
Checklist Completed: ${JSON.stringify(checklist || [])}

Provide:
1. **Executive Operational Summary**: What was resolved?
2. **Technical Details**: Parts replacement, calibration numbers, or electrical values verified.
3. **SLA & Compliance Analysis**: Highlight safe completion, physical inspections fulfilled, and adherence.
4. **Maintenance Recommendations**: Proactive suggestions or next scheduled inspection date (6 months out).

Format in a clean, highly structured professional executive report with bold labels. No chatty conversational introduction.`;

  try {
    if (ai) {
      const response = await ai.models.generateContent({
        model: LLM_MODEL,
        contents: prompt,
      });
      res.json({ text: response.text });
    } else {
      const fallbackText = `### 📋 [Sandbox Simulation Mode Active] 
*Add your \`GEMINI_API_KEY\` to AI Studio Secrets for automated AI report drafting.*

#### 🏢 FIELD SERVICE RESOLUTION REPORT — ${workOrder.id}
*Ref: ${workOrder.assetName} at ${workOrder.client}*

**1. Executive Operational Summary**
The technician successfully resolved the primary fault described in work instruction **${workOrder.id}**. Reported symptoms of drift, thermal stress, or attenuation have been corrected utilizing standardized field calibration procedures. Nominal loop telemetry and structural output parameters are fully restored.

**2. Remedial Technical Details**
* **Action Taken:** ${actionTaken || "Default calibration repair and compliance physical audit performed."}
* **Components Replaced/Reconfigured:** ${partsReplaced || "Direct wiring harnesses checked; optical pins re-aligned."}
* **Repair Operations Speed:** Evaluated at ${timeSpentMin || 45} mins.
* **Safety & Field Checklists**: All critical functional checks have been certified by technician on-site.

**3. SLA Alignment & Compliance Outcome**
The ticket was resolved within the allocated SLA compliance timing constraints, ensuring zero customer penalty. Operational compliance is in alignment with regional safety standards.

**4. Forward Mechanical Recommendations**
- Recommend running an automated software self-diagnostic test stream in 30 days.
- Schedule the next comprehensive hardware lifecycle preventive service for October 2026.`;
      res.json({ text: fallbackText });
    }
  } catch (error: any) {
    console.error("Gemini Report Error:", error);
    res.status(500).json({ error: "Gemini Report drafting failed", details: error.message });
  }
});

// 3. Automated dispatch recommendation algorithm
app.post("/api/gemini/auto-dispatch", async (req, res) => {
  const { pendingWorkOrders, activeTechnicians } = req.body;

  const prompt = `You are the Autonomous Scheduling and Route Dispatcher AI Agent.
Analyze the outstanding, unassigned work-orders and match them with the best live technician based on:
1. Skill matching: Match the technician's unique expertise (e.g. HVAC, Biomedical, optical, telecom) with the equipment type.
2. Status availability: Only match active, available, or on-route technicians (Online and not overwhelmed).
3. Priority emergency optimization: Prioritize critical and high-priority orders first.
4. Logistics/Zones context: Check technician location Zone delta (Alpha, Beta, Delta, Gamma, etc.).

Outstanding Work Orders:
${JSON.stringify(pendingWorkOrders || workOrders)}

Live Technicians State:
${JSON.stringify(activeTechnicians || technicians)}

Output your dispatch assignment recommendation. For each match, provide:
- Work Order ID & Asset Name
- Selected Technician & clear reasoning (matching skills and location zone logistics)
- Recommended route routing priority index (High/Med/Low)

Provide output in clean, highly structured Markdown. Avoid any conversational preambling.`;

  try {
    if (ai) {
      const response = await ai.models.generateContent({
        model: LLM_MODEL,
        contents: prompt,
      });
      res.json({ text: response.text });
    } else {
      const fallbackText = `### 🧭 Autonomous Scheduling Match & Optimal Routing (Simulation)
*To utilize real Gemini matching models, define a \`GEMINI_API_KEY\` in your enterprise Secrets panel.*

#### 🚀 AI Dispatch Core Engine Recommendations:

* **WO-2026-004 (Siemens SPS Smart Meter Hub at Utility Substation South 2)**
  * **Priority:** Low (Routine Firmware sync)
  * **Matched Technician:** **David Kim** (Smart Grid Electrician)
  * **Match Strategy Match-Level: Outstanding (98%)**
    * *Reasoning:* David is located in **Zone Gamma** (Coordinate 20, 80) which is adjacent to Substation South 2 (Coordinate 18, 82). Additionally, David possesses the necessary "Smart Meters" and "Power Grid" skill set.
    * *Routing urgency:* Medium routing priority.

* **WO-2026-001 (GE Carescape B105 Drifting Calibration at Mercy General ICU Wing)**
  * **Priority:** Critical (Life Care Monitor)
  * **Matched Technician:** **Marcus Thorne** (Biomedical Specialist)
  * **Match Strategy Match-Level: Complete (100%)**
    * *Reasoning:* Marcus is already assigned but is near the location Zone Alpha. No other technician has the clinical "Biomedical Tech" and "Ventilators" certification required for patient-life indicators.
    * *Routing urgency:* Immediate direct dispatch routing prioritized.`;
      res.json({ text: fallbackText });
    }
  } catch (error: any) {
    console.error("Gemini Dispatch Error:", error);
    res.status(500).json({ error: "Autonomous dispatch routing failure", details: error.message });
  }
});

// ==========================================
// VITE DEV SERVER OR STATIC ASSETS
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server mounted as Express middleware.");
  } else {
    // Production serving from compiled bundle
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static server enabled, routing index.html for SPA fallback.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Field Service Assistant Hub Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
