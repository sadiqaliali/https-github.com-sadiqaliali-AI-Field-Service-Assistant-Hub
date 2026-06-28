import React, { useState, useEffect, useRef } from "react";
import {
  Wrench,
  Users,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  Sparkles,
  RefreshCw,
  Search,
  Cpu,
  Tv,
  FileText,
  UserCheck,
  Zap,
  CheckSquare,
  Square,
  BookOpen,
  Phone,
  Battery,
  Layers,
  Activity,
  PlusCircle,
  Trash2,
  ExternalLink,
  Map,
  Navigation,
  ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Location,
  Technician,
  Task,
  HistoryEvent,
  WorkOrder,
  Asset,
  TelemetryEvent,
  SOP
} from "./types";

export default function App() {
  // Application Views
  type ViewMode = "dispatcher" | "technician" | "assets" | "knowledge";
  const [activeTab, setActiveTab] = useState<ViewMode>("dispatcher");

  // State Management
  const [techs, setTechs] = useState<Technician[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryEvent[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);

  // Selected details
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Copilot interactive state
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotHistory, setCopilotHistory] = useState<{ sender: "user" | "copilot"; text: string; time: string }[]>([
    {
      sender: "copilot",
      text: "Enterprise Copilot Engine ready. Select an active Work Order or report a field symptom to retrieve mechanical diagnostics and isolation procedures.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);

  // Auto-dispatch recommendation state
  const [isAutodispatching, setIsAutodispatching] = useState(false);
  const [autodispatchSuggestion, setAutodispatchSuggestion] = useState<string | null>(null);

  // Mobile Technician simulated view state
  const [simulatedSelectedTechId, setSimulatedSelectedTechId] = useState<string>("T001");
  const [techNotes, setTechNotes] = useState("");
  const [techPartsReplaced, setTechPartsReplaced] = useState("");
  const [isDraftingReport, setIsDraftingReport] = useState(false);
  const [draftedReport, setDraftedReport] = useState<string | null>(null);

  // New Ticket Form state
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketClient, setNewTicketClient] = useState("");
  const [newTicketAssetId, setNewTicketAssetId] = useState("AST-8801");
  const [newTicketPriority, setNewTicketPriority] = useState<"Critical" | "High" | "Medium" | "Low">("Medium");
  const [newTicketDesc, setNewTicketDesc] = useState("");
  const [newTicketLocLabel, setNewTicketLocLabel] = useState("");

  // Map settings
  const [hoveredNode, setHoveredNode] = useState<{ type: "tech" | "asset"; id: string; label: string } | null>(null);

  // System status flags
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [networkOnline, setNetworkOnline] = useState(true);

  // Fetch all core system entities
  const fetchAllData = async () => {
    try {
      setRefreshing(true);
      const [techsRes, woRes, assetsRes, telemetryRes, sopsRes] = await Promise.all([
        fetch("/api/techs"),
        fetch("/api/workorders"),
        fetch("/api/assets"),
        fetch("/api/telemetry"),
        fetch("/api/sops")
      ]);

      const [techsData, woData, assetsData, telemetryData, sopsData] = await Promise.all([
        techsRes.json(),
        woRes.json(),
        assetsRes.json(),
        telemetryRes.json(),
        sopsRes.json()
      ]);

      setTechs(techsData);
      setWorkOrders(woData);
      setAssets(assetsData);
      setTelemetry(telemetryData);
      setSops(sopsData);

      // Keep previously selected items reference valid
      if (selectedWorkOrder) {
        const updatedWo = woData.find((w: WorkOrder) => w.id === selectedWorkOrder.id);
        if (updatedWo) setSelectedWorkOrder(updatedWo);
      } else if (woData.length > 0) {
        setSelectedWorkOrder(woData[0]);
      }

      if (selectedTech) {
        const updatedTech = techsData.find((t: Technician) => t.id === selectedTech.id);
        if (updatedTech) setSelectedTech(updatedTech);
      } else if (techsData.length > 0) {
        setSelectedTech(techsData[0]);
      }

      if (selectedAsset) {
        const updatedAsset = assetsData.find((a: Asset) => a.id === selectedAsset.id);
        if (updatedAsset) setSelectedAsset(updatedAsset);
      } else if (assetsData.length > 0) {
        setSelectedAsset(assetsData[0]);
      }

      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error("Failed to fetch system data from platform backend:", err);
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Poll for simulated telemetry fluctuations and active updates
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      // Background poll for telemetry
      fetch("/api/telemetry")
        .then(res => res.json())
        .then(data => setTelemetry(data))
        .catch(() => {});
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  // Update online status tracker
  useEffect(() => {
    const triggerOnline = () => setNetworkOnline(true);
    const triggerOffline = () => setNetworkOnline(false);
    window.addEventListener("online", triggerOnline);
    window.addEventListener("offline", triggerOffline);
    return () => {
      window.removeEventListener("online", triggerOnline);
      window.removeEventListener("offline", triggerOffline);
    };
  }, []);

  // Soft client-only notification banner
  const [notification, setNotification] = useState<string | null>(null);
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Reset entire simulation pipeline
  const handleResetSimulation = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/system/reset", { method: "POST" });
      if (res.ok) {
        showNotification("Enterprise system state has been restored to seed parameters.");
        await fetchAllData();
      }
    } catch (err) {
      console.error("Failed to reset database parameters:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Assign Technician to specific Work Order
  const handleAssignTechnician = async (workOrderId: string, techId: string) => {
    try {
      const res = await fetch("/api/workorders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: workOrderId,
          technicianId: techId,
          status: techId ? "Assigned" : "Unassigned"
        })
      });

      if (res.ok) {
        const data = await res.json();
        showNotification(`Work Order assigned to ${techId ? techs.find(t => t.id === techId)?.name : 'unassigned'}.`);
        await fetchAllData();
      }
    } catch (err) {
      console.error("Failed to assign technician:", err);
    }
  };

  // Complete specific Task inside Work Order checklist
  const handleToggleTaskStatus = async (wo: WorkOrder, taskId: number) => {
    const updatedTasks = wo.tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );

    // Determine state
    let nextStatus = wo.status;
    const allDone = updatedTasks.every(t => t.completed);
    if (allDone) {
      nextStatus = "Completed";
    } else if (wo.status === "Assigned") {
      nextStatus = "In-Progress";
    }

    try {
      const res = await fetch("/api/workorders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: wo.id,
          tasks: updatedTasks,
          status: nextStatus !== wo.status ? nextStatus : undefined,
          appendLog: `Updated task list checklist feedback on-site.`
        })
      });

      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error("Failed to update task checklist:", err);
    }
  };

  // Update Work Order overall status state
  const handleUpdateStatus = async (workOrderId: string, nextStatus: string) => {
    try {
      const res = await fetch("/api/workorders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: workOrderId,
          status: nextStatus,
          appendLog: `Updated work status level directly to ${nextStatus}.`
        })
      });
      if (res.ok) {
        showNotification(`Success: Status shifted to ${nextStatus}.`);
        await fetchAllData();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Submit dynamic newly crafted Work Order form
  const handleCreateNewTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTicketClient || !newTicketDesc) {
      alert("Please provide the emergency client and diagnostic target details.");
      return;
    }

    const matchedAsset = assets.find(a => a.id === newTicketAssetId);
    const assetName = matchedAsset ? matchedAsset.name : "Field Asset Extension";

    const customX = Math.floor(20 + Math.random() * 60);
    const customY = Math.floor(30 + Math.random() * 50);

    const payload = {
      client: newTicketClient,
      assetId: newTicketAssetId,
      assetName: assetName,
      priority: newTicketPriority,
      description: newTicketDesc,
      location: {
        x: customX,
        y: customY,
        label: newTicketLocLabel || `${newTicketClient} site coordinates`
      }
    };

    try {
      const res = await fetch("/api/workorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        showNotification(`Dynamic Emergency Alert created: ${data.id}`);
        setShowNewTicketModal(false);
        // Reset inputs
        setNewTicketClient("");
        setNewTicketDesc("");
        setNewTicketLocLabel("");
        await fetchAllData();
      }
    } catch (err) {
      console.error("Failed to submit ticket:", err);
    }
  };

  // Trigger Autonomous AI Route Matching & Skill Dispatch logic
  const handleLaunchAIDispatcher = async () => {
    setIsAutodispatching(true);
    setAutodispatchSuggestion(null);

    try {
      const res = await fetch("/api/gemini/auto-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pendingWorkOrders: workOrders.filter(w => !w.technicianId),
          activeTechnicians: techs
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAutodispatchSuggestion(data.text);
      }
    } catch (err) {
      setAutodispatchSuggestion("Error: Failed to fetch AI dispatcher matching telemetry. Check backend key.");
    } finally {
      setIsAutodispatching(false);
    }
  };

  // Auto-fill Copilot on selecting symptom
  const handleDiagnoseWorkOrderIndex = (wo: WorkOrder) => {
    setCopilotQuery(`My supervisor assigned ${wo.id} target ${wo.assetName}. Symptom: ${wo.description}. What standard operating diagnostics should I check?`);
    // Scroll interaction focus to Copilot tab
    const el = document.getElementById("copilot-input-area");
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Post Query to Copilot troubleshooting module
  const handleSendCopilotQuery = async (queryText?: string) => {
    const textToSend = queryText || copilotQuery;
    if (!textToSend.trim()) return;

    const userMsg = {
      sender: "user" as const,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setCopilotHistory(prev => [...prev, userMsg]);
    if (!queryText) setCopilotQuery("");
    setIsCopilotThinking(true);

    try {
      // Find current asset details to anchor context if selected
      const res = await fetch("/api/gemini/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptom: textToSend,
          assetId: selectedWorkOrder?.assetId || "AST-GENERIC",
          assetName: selectedWorkOrder?.assetName || "Field Asset Equipment",
          modelNumber: "V4-Enterprise"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCopilotHistory(prev => [...prev, {
          sender: "copilot",
          text: data.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        throw new Error("Failed response");
      }
    } catch (err) {
      setCopilotHistory(prev => [...prev, {
        sender: "copilot",
        text: "🚨 Hardware dispatch timeout or API credentials missing. Running local cached diagnostic isolation rules standard.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsCopilotThinking(false);
    }
  };

  // Generate automated post-resolution report summary via Gemini model
  const handleGenerateFinalReportSummary = async (wo: WorkOrder) => {
    setIsDraftingReport(true);
    setDraftedReport(null);

    try {
      const res = await fetch("/api/gemini/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workOrder: wo,
          actionTaken: techNotes || "Performed standard diagnostic and re-calibrated sensors to correct drift.",
          partsReplaced: techPartsReplaced || "No hardware swap triggered. Connector leads properly cleaned.",
          timeSpentMin: 45,
          checklist: wo.tasks
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDraftedReport(data.text);
        showNotification("Technician Resolution Summary generated successfully.");
      }
    } catch (err) {
      setDraftedReport("Error: Failed to compile report using model pipeline.");
    } finally {
      setIsDraftingReport(false);
    }
  };

  // Quick Action: Settle & close simulated ticket instantly
  const handleEmergencyAutoResolve = async (woId: string) => {
     try {
       const res = await fetch("/api/workorders/update", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           id: woId,
           status: "Completed",
           appendLog: "On-site Field Resolution validated by engineer."
         })
       });
       if (res.ok) {
         showNotification(`Work Order ${woId} successfully resolved.`);
         await fetchAllData();
       }
     } catch (err) {
       console.error(err);
     }
  };

  // Computed state details
  const unassignedTickets = workOrders.filter(w => !w.technicianId);
  const activeTechnicianObj = techs.find(t => t.id === simulatedSelectedTechId);
  const matchedTechWorkOrders = workOrders.filter(w => w.technicianId === simulatedSelectedTechId);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-white" id="main_root">
      
      {/* Dynamic Notification Banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 bg-slate-900 border-2 border-cyan-500/80 text-cyan-300 shadow-2xl shadow-cyan-950/50 px-5 py-3 rounded-lg flex items-center space-x-3 text-sm"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-cyan-600 to-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-cyan-500/20">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                FIELD-OPS Copilot
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-mono tracking-widest bg-cyan-950 text-cyan-400 border border-cyan-800/80 rounded-full">
                Enterprise AI v3.5
              </span>
            </div>
            <p className="text-xs text-slate-400">Agentic Field Service Optimization & Diagnostics Platform</p>
          </div>
        </div>

        {/* Global Connection Badges & Resets */}
        <div className="flex items-center space-x-3 text-xs self-end md:self-auto">
          {/* Status Indicators */}
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className={`w-2 h-2 rounded-full ${networkOnline ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
            <span className="text-slate-400 font-mono text-[11px]">
              {networkOnline ? 'API ON' : 'OFFLINE MODE'}
            </span>
          </div>

          <button
            onClick={handleResetSimulation}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700/60 flex items-center space-x-2 transition-all active:scale-95"
            title="Settle simulation data back to baseline defaults"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Seed State</span>
          </button>

          <button
            onClick={() => { fetchAllData(); showNotification("Queried enterprise network nodes."); }}
            className="bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/60 text-cyan-400 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Poll Live</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
        
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 flex items-center space-x-3.5 shadow-sm">
            <div className="p-2.5 bg-emerald-950 text-emerald-400 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">First-Time Fix Rate</p>
              <p className="text-lg font-bold text-slate-100 font-mono">94.2%</p>
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 flex items-center space-x-3.5 shadow-sm">
            <div className="p-2.5 bg-cyan-950 text-cyan-400 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Mean Time To Repair</p>
              <p className="text-lg font-bold text-slate-100 font-mono">42 Min</p>
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 flex items-center space-x-3.5 shadow-sm">
            <div className="p-2.5 bg-indigo-950 text-indigo-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Technicians Utilized</p>
              <p className="text-lg font-bold text-slate-100 font-mono">88% <span className="text-xs text-slate-500">({techs.filter(t => t.status !== 'Offline').length}/{techs.length})</span></p>
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 flex items-center space-x-3.5 shadow-sm">
            <div className="p-2.5 bg-amber-950 text-amber-400 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Active Work Orders</p>
              <p className="text-lg font-bold text-slate-100 font-mono">{workOrders.length} <span className="text-xs text-slate-400 font-normal">Active</span></p>
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-cyan-950/40 to-slate-900 p-4 rounded-xl border border-cyan-900/40 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[11px] text-cyan-300 uppercase tracking-wider font-semibold">SLA SLA Compliance Rate</p>
              <p className="text-xl font-black text-cyan-100 font-mono">98.4%</p>
            </div>
            <div className="w-11 h-11 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 flex items-center justify-center text-[11px] font-bold text-cyan-400">
              98%
            </div>
          </div>
        </div>

        {/* View Selection Bar (Dispatcher Control vs Technician On-Site Simulator vs Live Asset Telemetry Twins) */}
        <div className="flex border-b border-slate-800 bg-slate-900/40 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("dispatcher")}
            className={`flex-1 py-3 text-sm font-medium rounded-lg flex items-center justify-center space-x-2 transition-all ${activeTab === "dispatcher" ? "bg-slate-800 text-cyan-400 border border-slate-700/60 shadow-inner font-semibold" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Layers className="w-4 h-4" />
            <span>Smart Dispatch Console</span>
          </button>
          
          <button
            onClick={() => setActiveTab("technician")}
            className={`flex-1 py-3 text-sm font-medium rounded-lg flex items-center justify-center space-x-2 transition-all ${activeTab === "technician" ? "bg-slate-800 text-cyan-400 border border-slate-700/60 shadow-inner font-semibold" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Wrench className="w-4 h-4" />
            <span>Technician Mobile (On-Site)</span>
          </button>

          <button
            onClick={() => setActiveTab("assets")}
            className={`flex-1 py-3 text-sm font-medium rounded-lg flex items-center justify-center space-x-2 transition-all ${activeTab === "assets" ? "bg-slate-800 text-cyan-400 border border-slate-700/60 shadow-inner font-semibold" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Activity className="w-4 h-4" />
            <span>IoT Equipment & Asset Twins</span>
          </button>

          <button
            onClick={() => setActiveTab("knowledge")}
            className={`flex-1 py-3 text-sm font-medium rounded-lg flex items-center justify-center space-x-2 transition-all ${activeTab === "knowledge" ? "bg-slate-800 text-cyan-400 border border-slate-700/60 shadow-inner font-semibold" : "text-slate-400 hover:text-slate-200"}`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Instructional Manuals (SOP)</span>
          </button>
        </div>

        {/* ========================================================== */}
        {/* VIEW 1: SMART DISPATCH CONSOLE                             */}
        {/* ========================================================== */}
        {activeTab === "dispatcher" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* Left Column: Tech Tracking & Live Operations Telemetry */}
            <div className="xl:col-span-3 space-y-6">
              
              {/* Field Technician Roster */}
              <div className="bg-slate-900/80 rounded-xl border border-slate-800/80 p-4 shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-bold text-sm tracking-tight text-slate-100">Live Field Technicians</h3>
                  </div>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono font-bold">
                    {techs.length} Total
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {techs.map((t) => {
                    const activeWorkloadCount = workOrders.filter(w => w.technicianId === t.id && w.status !== "Completed").length;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTech(t)}
                        className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${selectedTech?.id === t.id ? 'bg-slate-850 border-cyan-500/50 shadow-md shadow-cyan-950/20' : 'bg-slate-900/50 border-slate-800/60 hover:border-slate-700'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-black font-mono text-cyan-400 border border-slate-700">
                              {t.avatar}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-100">{t.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{t.role}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-1">
                            {/* Status Indicator */}
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${t.status === 'Active' ? 'bg-emerald-950 text-emerald-300 border border-emerald-900/80' : t.status === 'On-Route' ? 'bg-blue-950 text-blue-300 border border-blue-900/80' : t.status === 'Busy' ? 'bg-amber-950 text-amber-300 border border-amber-900/80' : 'bg-slate-950 text-slate-500 border border-slate-800'}`}>
                              {t.status}
                            </span>
                          </div>
                        </div>

                        {/* Battery, Skills, Workloads summary */}
                        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-2">
                          <div className="flex items-center space-x-1">
                            <Battery className={`w-3.5 h-3.5 ${t.battery < 20 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
                            <span className="font-mono">{t.battery}%</span>
                          </div>
                          <div>
                            <span className="bg-slate-800/80 px-1.5 py-0.5 rounded text-[10px] font-semibold text-cyan-300 font-mono">
                              {activeWorkloadCount} Active WO
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono truncate max-w-[80px]">
                            {t.skills[0]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Technician Detail Drilldown in Panel */}
                {selectedTech && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3.5 bg-slate-950/80 rounded-lg border border-slate-800 text-xs space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-slate-200">Personnel Details Indicator</p>
                      <button onClick={() => setSelectedTech(null)} className="text-slate-500 hover:text-slate-300 text-[10px] uppercase font-bold">Close</button>
                    </div>
                    <div>
                      <table className="w-full space-y-1 text-slate-300">
                        <tbody>
                          <tr>
                            <td className="text-slate-500 font-medium py-0.5">Primary Contact:</td>
                            <td className="text-right py-0.5 font-mono">{selectedTech.contact}</td>
                          </tr>
                          <tr>
                            <td className="text-slate-500 font-medium py-0.5">Geo Zone:</td>
                            <td className="text-right py-0.5 text-cyan-400 font-medium">{selectedTech.location.label}</td>
                          </tr>
                          <tr>
                            <td className="text-slate-500 font-medium py-0.5">Coordinates:</td>
                            <td className="text-right py-0.5 font-mono">({selectedTech.location.x}, {selectedTech.location.y})</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Specialized Certifications</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedTech.skills.map((skill, si) => (
                          <span key={si} className="bg-slate-900 text-slate-300 px-1.5 py-0.5 rounded border border-slate-800 font-mono text-[9px]">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Dynamic Telemetry Event stream */}
              <div className="bg-slate-900/80 rounded-xl border border-slate-800/80 p-4 shadow-md">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
                    <h3 className="font-bold text-sm tracking-tight text-slate-100">Live IoT Telemetry Feed</h3>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <p className="text-[10px] text-slate-400 mb-3">Ingesting streaming industrial events over MQTT telemetry protocols:</p>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {telemetry.slice(0, 10).map((tel, index) => (
                    <div key={`${tel.id}-${index}`} className="p-2.5 rounded bg-slate-950/60 border border-slate-850/80 space-y-1.5 hover:border-slate-800 transition-all">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-slate-300 font-mono truncate max-w-[130px]" title={tel.assetName}>{tel.assetName}</span>
                        <span className={`px-1 rounded font-mono text-[9px] ${tel.status === 'Danger' || tel.status === 'Critical' ? 'bg-red-950 text-red-400 border border-red-900' : tel.status === 'Warning' ? 'bg-amber-950 text-amber-400 border border-amber-900' : 'bg-emerald-950 text-emerald-400 border border-emerald-900'}`}>
                          {tel.value}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight leading-4">{tel.description}</p>
                      <div className="flex justify-between items-center text-[9px] text-slate-500">
                        <span className="font-mono text-cyan-400/80">{tel.parameter}</span>
                        <span>{new Date(tel.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Center Column: Mapping Coordinate System & AI Dispatch Agent */}
            <div className="xl:col-span-5 space-y-6">
              
              {/* Interactive Virtual Operations Map */}
              <div className="bg-slate-900/80 rounded-xl border border-slate-800/80 p-4 shadow-md flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                    <Map className="w-4 h-4 text-cyan-400" />
                    <div>
                      <h3 className="font-bold text-sm tracking-tight text-slate-100">GIS Operations Control Stage</h3>
                      <p className="text-[10px] text-slate-400">Technician (Triangles) & Asset Worksite Locations (Circles)</p>
                    </div>
                  </div>
                  
                  {/* Map Legend */}
                  <div className="flex items-center space-x-3 text-[10px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    <div className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 bg-cyan-400 rounded-sm inline-block" />
                      <span>Tech</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block animate-pulse" />
                      <span>Asset Fault</span>
                    </div>
                  </div>
                </div>

                {/* The Virtualized GIS Grid Canvas */}
                <div 
                  className="relative w-full h-[360px] bg-slate-950 rounded-xl border border-slate-850 overflow-hidden flex items-center justify-center p-4 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"
                  style={{ contentVisibility: "auto" }}
                >
                  
                  {/* Active routing lines between selected technician and selected asset if applicable */}
                  {selectedWorkOrder && selectedWorkOrder.technicianId && (
                    (() => {
                      const matchedTech = techs.find(t => t.id === selectedWorkOrder.technicianId);
                      if (matchedTech) {
                        const x1 = matchedTech.location.x;
                        const y1 = matchedTech.location.y;
                        const x2 = selectedWorkOrder.location.x;
                        const y2 = selectedWorkOrder.location.y;

                        // Calculate simple vectors for drawing an visual SVG path line overlays
                        return (
                          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                            <line 
                              x1={`${x1}%`} 
                              y1={`${y1}%`} 
                              x2={`${x2}%`} 
                              y2={`${y2}%`} 
                              stroke="#06b6d4" 
                              strokeWidth="2" 
                              strokeDasharray="4 4" 
                              className="animate-[dash_6s_linear_infinite]"
                            />
                            <circle cx={`${x1}%`} cy={`${y1}%`} r="4" fill="#06b6d4" />
                            <circle cx={`${x2}%`} cy={`${y2}%`} r="4" fill="#f43f5e" />
                          </svg>
                        );
                      }
                      return null;
                    })()
                  )}

                  {/* Render Technician Nodes dynamically */}
                  {techs.map((t) => {
                    const isSelected = selectedTech?.id === t.id;
                    const styleNode = {
                      left: `${t.location.x}%`,
                      top: `${t.location.y}%`,
                    };
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTech(t)}
                        onMouseEnter={() => setHoveredNode({ type: "tech", id: t.id, label: `${t.name} (${t.role})` })}
                        onMouseLeave={() => setHoveredNode(null)}
                        style={styleNode}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group transition-all"
                      >
                        <div className={`p-1.5 rounded-lg border flex items-center justify-center transition-all ${isSelected ? 'bg-cyan-500 text-white scale-125 shadow-lg shadow-cyan-500/50 border-white' : 'bg-slate-900 text-cyan-400 border-cyan-800/85 hover:border-cyan-400'}`}>
                          <Navigation className="w-3.5 h-3.5 rotate-45" />
                        </div>
                        
                        {/* Always visible ID tag on map */}
                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white border border-slate-800 font-mono text-[8px] px-1 py-0.5 rounded leading-none whitespace-nowrap shadow">
                          {t.avatar}
                        </span>
                      </button>
                    );
                  })}

                  {/* Render Active Work Order Targets on GIS Stage */}
                  {workOrders.map((wo) => {
                    const isSelected = selectedWorkOrder?.id === wo.id;
                    const styleNode = {
                      left: `${wo.location.x}%`,
                      top: `${wo.location.y}%`,
                    };
                    return (
                      <button
                        key={wo.id}
                        onClick={() => { setSelectedWorkOrder(wo); }}
                        onMouseEnter={() => setHoveredNode({ type: "asset", id: wo.id, label: `${wo.client} - ${wo.assetName}` })}
                        onMouseLeave={() => setHoveredNode(null)}
                        style={styleNode}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group transition-all"
                      >
                        <div className={`p-1.5 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-rose-500 text-white scale-125 shadow-lg shadow-rose-500/50 border-white' : 'bg-slate-900 text-rose-400 border-rose-800/60 hover:border-rose-400'} ${wo.priority === 'Critical' ? 'animate-pulse' : ''}`}>
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                        
                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white border border-slate-800 font-mono text-[8px] px-1 py-0.5 rounded leading-none whitespace-nowrap shadow">
                          {wo.id}
                        </span>
                      </button>
                    );
                  })}

                  {/* Hover status tracker box inside GIS */}
                  <AnimatePresence>
                    {hoveredNode && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute bottom-3 left-3 right-3 z-30 bg-slate-900/95 border border-slate-700/80 p-2.5 rounded-lg shadow-2xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${hoveredNode.type === 'tech' ? 'bg-cyan-400' : 'bg-rose-500'}`} />
                          <span className="font-semibold text-slate-100 font-mono">{hoveredNode.id}:</span>
                          <span className="text-slate-300">{hoveredNode.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Interactive GIS Node</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Empty State Help Badge */}
                  {!selectedWorkOrder && (
                    <div className="text-center p-4 bg-slate-900/80 rounded-lg max-w-[240px] border border-slate-850">
                      <p className="text-xs text-slate-400">Interact with coordinate markers to analyze routing alignments.</p>
                    </div>
                  )}

                  {/* Routing Highlight Indicator Box */}
                  {selectedWorkOrder && (
                    <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-800 p-2.5 rounded-lg text-[11px] max-w-[210px] space-y-1">
                      <p className="font-bold text-slate-200 flex items-center gap-1">
                        <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                        Routing Matrix: {selectedWorkOrder.id}
                      </p>
                      <p className="text-slate-400 font-mono text-[10px] truncate">{selectedWorkOrder.client}</p>
                      <p className="text-slate-500 text-[10px] font-mono leading-none">
                        Coords: ({selectedWorkOrder.location.x}, {selectedWorkOrder.location.y})
                      </p>
                      {selectedWorkOrder.technicianId ? (
                        <p className="text-[10px] text-cyan-400 pt-1 font-medium">
                          → Assigned: {techs.find(t => t.id === selectedWorkOrder.technicianId)?.name}
                        </p>
                      ) : (
                        <p className="text-[10px] text-amber-400 pt-1 font-medium animate-pulse">
                          ⚠️ Route Unassigned
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Dispatch Trigger Controls */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowNewTicketModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center space-x-2 shadow shadow-indigo-900/30 transition-all active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Emergency W.O.</span>
                  </button>

                  <button
                    onClick={handleLaunchAIDispatcher}
                    disabled={isAutodispatching}
                    className="bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 animate-bounce" />
                    <span>{isAutodispatching ? "Matching Ops..." : "Agentic AI Dispatch"}</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Autonomous Agentic Match Suggestion Box */}
              {(isAutodispatching || autodispatchSuggestion) && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 border border-indigo-500/30 rounded-xl p-4 shadow-xl text-xs space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-950/40">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-4.5 h-4.5 text-cyan-400" />
                      <h4 className="font-bold text-slate-100 flex items-center gap-1">
                        Agentic Scheduler Dispatch Agent Recommendation
                      </h4>
                    </div>
                    <button
                      onClick={() => setAutodispatchSuggestion(null)}
                      className="text-slate-500 hover:text-slate-300 font-bold"
                    >
                      Clear
                    </button>
                  </div>

                  {isAutodispatching ? (
                    <div className="flex flex-col items-center justify-center py-6 space-y-2">
                      <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                      <p className="text-slate-400 text-xs font-mono">Running automated heuristic matrix evaluation loop on live server...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="prose prose-invert prose-xs text-slate-300 whitespace-pre-line leading-relaxed max-h-[250px] overflow-y-auto pr-2 font-mono text-[11px] bg-slate-950 p-3 rounded-lg border border-slate-800">
                        {autodispatchSuggestion}
                      </div>
                      
                      {/* Interactive Trigger matches logic */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded border border-slate-800">
                        <span>Click to instantly run simulation assignments to optimize live scheduling.</span>
                        <button
                          onClick={async () => {
                            // Automatically assign WO-2026-004 to David Kim (T004) under the hood
                            await handleAssignTechnician("WO-2026-004", "T004");
                            setAutodispatchSuggestion(null);
                          }}
                          className="bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-850 px-2.5 py-1 rounded font-bold transition-all"
                        >
                          Execute Match
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

            </div>

            {/* Right Column: Work Order Dispatch Detail & Assign Panels */}
            <div className="xl:col-span-4 space-y-6">
              
              {/* Work Order Tickets Manifest */}
              <div className="bg-slate-900/80 rounded-xl border border-slate-800/80 p-4 shadow-md flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <Wrench className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-bold text-sm tracking-tight text-slate-100">Live Operating Work Orders</h3>
                  </div>
                  <span className="text-[10px] bg-amber-950 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-900/60">
                    {unassignedTickets.length} Unallocated
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {workOrders.map((wo) => {
                    const isSelected = selectedWorkOrder?.id === wo.id;
                    const assignedTech = techs.find(t => t.id === wo.technicianId);
                    
                    return (
                      <div
                        key={wo.id}
                        onClick={() => setSelectedWorkOrder(wo)}
                        className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${isSelected ? 'bg-slate-850 border-cyan-500/50 shadow shadow-cyan-950/40' : 'bg-slate-900/40 border-slate-850 hover:border-slate-700/80'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono text-xs font-black text-slate-200">{wo.id}</span>
                              <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${wo.priority === 'Critical' ? 'bg-rose-950 text-rose-300 border border-rose-900/80' : wo.priority === 'High' ? 'bg-amber-950 text-amber-300 border border-amber-900/80' : 'bg-slate-850 text-slate-300'}`}>
                                {wo.priority}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-100 mt-1 truncate max-w-[210px]">{wo.client}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[215px]">{wo.assetName}</p>
                          </div>

                          <div className="flex flex-col items-end space-y-1">
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded leading-none ${wo.status === 'Completed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-900' : wo.status === 'In-Progress' ? 'bg-indigo-950 text-indigo-300 border border-indigo-900' : wo.status === 'On-Route' ? 'bg-blue-950 text-blue-300 border border-blue-900' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}>
                              {wo.status}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono mt-1">({wo.location.label})</span>
                          </div>
                        </div>

                        {/* Assignee line */}
                        <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                          {assignedTech ? (
                            <div className="flex items-center space-x-1.5 text-slate-300">
                              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                              <span>{assignedTech.name}</span>
                            </div>
                          ) : (
                            <span className="text-amber-400/90 font-mono font-semibold flex items-center space-x-1 text-[10px]">
                              <span>⚠️ Unassigned (Awaiting Match)</span>
                            </span>
                          )}

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDiagnoseWorkOrderIndex(wo);
                              }}
                              className="bg-slate-850 hover:bg-slate-700 text-cyan-400 px-2 py-0.5 rounded border border-slate-700 font-mono text-[10px] uppercase font-bold transition-all"
                            >
                              Copilot Run
                            </button>

                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm("Remove this work order ticket?")) {
                                  await fetch(`/api/workorders/${wo.id}`, { method: "DELETE" });
                                  setSelectedWorkOrder(null);
                                  await fetchAllData();
                                }
                              }}
                              className="text-slate-500 hover:text-red-400 p-0.5 transition-all"
                              title="Cancel Ticket"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Work Order Diagnostic & Technician Assign Matrix Area */}
                {selectedWorkOrder && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-5 p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3.5 text-xs"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                      <h4 className="font-bold text-slate-200 font-mono">Operations Command Desk ({selectedWorkOrder.id})</h4>
                      <span className="text-[10px] text-slate-500 font-mono">SLA Ref: AWS-9920</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-slate-400 font-bold">Work Description:</p>
                      <p className="text-slate-300 leading-relaxed font-mono text-[11px] bg-slate-900/50 p-2.5 rounded border border-slate-850/60">{selectedWorkOrder.description}</p>
                    </div>

                    {/* Change Assignee manually */}
                    <div className="space-y-2">
                      <p className="text-slate-400 font-bold">Manual Tech Routing Assignment:</p>
                      <div className="flex space-x-2">
                        <select
                          value={selectedWorkOrder.technicianId}
                          onChange={(e) => handleAssignTechnician(selectedWorkOrder.id, e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 rounded-lg p-2 font-mono text-xs focus:ring-1 focus:ring-cyan-500"
                        >
                          <option value="">-- Set to Unassigned --</option>
                          {techs.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.role})
                            </option>
                          ))}
                        </select>
                        
                        {selectedWorkOrder.status !== 'Completed' && (
                          <button
                            onClick={() => handleEmergencyAutoResolve(selectedWorkOrder.id)}
                            className="bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-900 px-3 py-2 rounded-lg font-bold transition-all"
                          >
                            Resolve W.O.
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Incident Log / Ticket history */}
                    <div className="space-y-2">
                      <p className="text-slate-500 hover:text-slate-400 uppercase tracking-widest font-bold text-[9px] mb-2">Ticket Ingestion Journey Logs</p>
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {selectedWorkOrder.history.map((h, hi) => (
                          <div key={hi} className="flex gap-2 text-[10px] text-slate-400 border-l-2 border-slate-800 pl-2">
                            <span className="text-slate-500 font-mono whitespace-nowrap">{new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>{h.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 2: TECHNICIAN MOBILE APP SIMULATOR                  */}
        {/* ========================================================== */}
        {activeTab === "technician" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Box: Simulated Device frame selector */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-slate-900/85 rounded-xl border border-slate-800 p-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-sm tracking-tight">Active Field Technician Profile</h3>
                </div>
                <p className="text-xs text-slate-400">Select which technician device output to simulate for completing diagnostic tasks on-the-scene:</p>
                
                <div className="space-y-1.5">
                  {techs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSimulatedSelectedTechId(t.id);
                        setTechNotes("");
                        setTechPartsReplaced("");
                        setDraftedReport(null);
                      }}
                      className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${simulatedSelectedTechId === t.id ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200 font-medium' : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'}`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span className="text-xs font-mono font-bold">{t.id}:</span>
                        <span className="text-xs truncate max-w-[130px]">{t.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 bg-slate-900 px-1 py-0.5 rounded">{t.role.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>

                {activeTechnicianObj && (
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-850 text-xs space-y-2">
                    <p className="font-bold text-slate-300">Simulated Device State</p>
                    <div className="space-y-1 text-slate-400">
                      <p>🔋 Battery Level: <span className="text-emerald-400 font-mono">{activeTechnicianObj.battery}%</span></p>
                      <p>📡 Connection State: <span className="text-cyan-400 font-mono">WCDMA LTE Secure</span></p>
                      <p>📍 Location Lock: <span className="text-indigo-400">{activeTechnicianObj.location.label}</span></p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Central Simulator Screen Frame */}
            <div className="lg:col-span-6 space-y-6">
              
              <div className="bg-slate-900 rounded-2xl border-4 border-slate-800 p-5 shadow-2xl relative overflow-hidden">
                {/* Simulated Screen Signal header bar */}
                <div className="flex justify-between items-center pb-2.5 mb-4 border-b border-slate-800 text-[10px] text-slate-400 font-mono">
                  <span>📶 FIELD-NET DIRECT LINK v2</span>
                  <span className="bg-slate-950 px-3 py-1 rounded text-cyan-400 font-bold select-none">COPILOT APP SIMULATOR</span>
                  <span>10:36 AM</span>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-150">Welcome Back, {activeTechnicianObj?.name}</h3>
                      <p className="text-xs text-indigo-400 font-mono">{activeTechnicianObj?.role}</p>
                    </div>
                    
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 text-[10px] px-2.5 py-1 rounded font-mono font-bold">
                      🟢 LIVE ON DUTY
                    </span>
                  </div>

                  {/* Operator Task Orders Assigned to simulated device */}
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase tracking-widest font-black text-slate-400">My Allocated Work Assignments</h4>
                    
                    {matchedTechWorkOrders.length === 0 ? (
                      <div className="bg-slate-950 p-6 rounded-xl border border-slate-850 text-center space-y-1">
                        <p className="text-sm font-bold text-slate-300">No active assignments allocated.</p>
                        <p className="text-xs text-slate-500">Go to the Dispatch tab to assign this technician a target ticket.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {matchedTechWorkOrders.map((wo) => {
                          const isSelected = selectedWorkOrder?.id === wo.id;
                          return (
                            <div
                              key={wo.id}
                              onClick={() => setSelectedWorkOrder(wo)}
                              className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${isSelected ? 'bg-slate-800 border-cyan-500 text-cyan-100' : 'bg-slate-950 border-slate-850 hover:bg-slate-900'}`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <span className="bg-slate-905 px-1.5 py-0.5 rounded text-xs font-mono font-black text-slate-200">{wo.id}</span>
                                  <h5 className="font-bold text-xs text-white mt-1">{wo.client}</h5>
                                </div>
                                
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${wo.status === 'Completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-amber-950 text-amber-400 border border-amber-900 animate-pulse'}`}>
                                  {wo.status}
                                </span>
                              </div>

                              <p className="text-xs text-slate-400 leading-normal line-clamp-2">{wo.description}</p>
                              
                              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                                <span className="text-cyan-400 font-mono">📍 {wo.location.label}</span>
                                <span className="bg-slate-900 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-300">SLA: 4 Hrs remaining</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Active Job Task Checklist Checklist for technician */}
                  {selectedWorkOrder && selectedWorkOrder.technicianId === simulatedSelectedTechId && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-indigo-950">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Active Worksite Operations</p>
                          <h4 className="text-xs font-bold text-slate-200 font-mono">{selectedWorkOrder.id} - Verify Checklist</h4>
                        </div>
                        <span className="text-[10px] bg-indigo-950/80 text-cyan-300 px-2.5 py-1 rounded border border-indigo-900/40">
                          {selectedWorkOrder.tasks.filter(t => t.completed).length} / {selectedWorkOrder.tasks.length} Completed
                        </span>
                      </div>

                      {/* Diagnostic Tasks checkboxes */}
                      <div className="space-y-2">
                        {selectedWorkOrder.tasks.map((task) => (
                          <button
                            key={task.id}
                            onClick={() => handleToggleTaskStatus(selectedWorkOrder, task.id)}
                            className="w-full p-2.5 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left flex items-center justify-between text-xs transition-all decoration-none"
                          >
                            <div className="flex items-center space-x-2.5 pr-2">
                              {task.completed ? (
                                <CheckSquare className="w-4.5 h-4.5 text-cyan-400 flex-shrink-0" />
                              ) : (
                                <Square className="w-4.5 h-4.5 text-slate-500 flex-shrink-0" />
                              )}
                              <span className={task.completed ? 'text-slate-500 line-through' : 'text-slate-200'}>
                                {task.text}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono">Task #{task.id}</span>
                          </button>
                        ))}
                      </div>

                      {/* Onsite Symptom diagnostic trigger assist */}
                      <div className="bg-cyan-950/20 border border-cyan-900/40 p-3 rounded-lg flex items-center justify-between text-xs space-x-3">
                        <div className="space-y-0.5">
                          <p className="font-bold text-cyan-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                            Need Instant Isolation Guidance?
                          </p>
                          <p className="text-[11px] text-slate-400">Ask the Copilot system to calculate step-by-step diagnostic actions.</p>
                        </div>
                        <button
                          onClick={() => handleDiagnoseWorkOrderIndex(selectedWorkOrder)}
                          className="bg-cyan-900 hover:bg-cyan-800 text-white font-bold py-1.5 px-3 rounded font-mono text-[11px] uppercase transition-all whitespace-nowrap"
                        >
                          Query Copilot
                        </button>
                      </div>

                      {/* Action Submission Report Compiler form */}
                      <div className="space-y-3 pt-2.5 border-t border-slate-905">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-200">On-Site Resolution Notes Summary</p>
                          <span className="text-[10px] text-slate-500">Auto-draft executive brief in database</span>
                        </div>
                        
                        <div className="space-y-2">
                          <textarea
                            value={techNotes}
                            onChange={(e) => setTechNotes(e.target.value)}
                            placeholder="Enter notes on calibration sequence or fault correction (e.g. Cleared expansion occlusion, thermal reset via BIOS)..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:ring-1 focus:ring-cyan-500 min-h-[70px]"
                          />
                          <input
                            type="text"
                            value={techPartsReplaced}
                            onChange={(e) => setTechPartsReplaced(e.target.value)}
                            placeholder="Replacement hardware part serial # if any..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:ring-1 focus:ring-cyan-500"
                          />
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleGenerateFinalReportSummary(selectedWorkOrder)}
                            disabled={isDraftingReport}
                            className="bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-all w-full"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{isDraftingReport ? "AI Drafting Writeup..." : "Draft Resolution Report via AI"}</span>
                          </button>
                        </div>

                        {/* Generated report preview window */}
                        {draftedReport && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-slate-900 p-3 rounded-lg border border-cyan-800/40 text-[11px] space-y-2.5 text-slate-300"
                          >
                            <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                              <span className="font-bold text-cyan-300 font-mono">DRAFTED AUDIT TICKET: {selectedWorkOrder.id}</span>
                              <button onClick={() => setDraftedReport(null)} className="text-slate-500 hover:text-slate-300 font-bold">dismiss</button>
                            </div>
                            <div className="prose prose-invert prose-xs whitespace-pre-line leading-relaxed max-h-[180px] overflow-y-auto pr-1 select-all font-mono">
                              {draftedReport}
                            </div>
                            <div className="flex justify-end gap-2 text-[10px]">
                              <button
                                onClick={async () => {
                                  // Instantly update status on server and append drafted summary to history logs
                                  await fetch("/api/workorders/update", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      id: selectedWorkOrder.id,
                                      status: "Completed",
                                      appendLog: `Compiled resolution report via Gemini: ${techNotes || "Completed calibration"}`
                                    })
                                  });
                                  setDraftedReport(null);
                                  setTechNotes("");
                                  setTechPartsReplaced("");
                                  showNotification(`Work Order ${selectedWorkOrder.id} completed. Data synchronised.`);
                                  await fetchAllData();
                                }}
                                className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-900/60 px-2.5 py-1 rounded font-bold"
                              >
                                Commit & Close Ticket
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Box: Integrated Voice/Chat Diagnosis Copilot console */}
            <div className="lg:col-span-3 space-y-6">
              
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-md flex flex-col h-[560px]" id="copilot-input-area">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-bold text-sm tracking-tight text-slate-100">AI Diagnostic Copilot</h3>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                </div>
                
                <p className="text-[11px] text-slate-400 leading-tight leading-4 mb-3">Get real-time electrical specs, LOTO instructions, diagnostic check points, and troubleshooting steps:</p>

                {/* Chat Log History list */}
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-[11px] mb-3 select-text">
                  {copilotHistory.map((item, index) => (
                    <div key={index} className={`space-y-1 ${item.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {item.sender === 'user' ? 'Simulated Tech' : 'AI Copilot Engine'} • {item.time}
                      </span>
                      <div className={`p-2.5 rounded-lg whitespace-pre-line leading-relaxed ${item.sender === 'user' ? 'bg-indigo-950/40 border border-indigo-900/60 text-slate-200' : 'bg-slate-950/80 border border-slate-850 text-slate-300 font-mono text-[10.5px]'}`}>
                        {item.text}
                      </div>
                    </div>
                  ))}

                  {isCopilotThinking && (
                    <div className="space-y-1 text-left">
                      <span className="text-[9px] text-slate-500 font-mono">AI Copilot Engine • Processing...</span>
                      <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-850 text-slate-400 flex items-center space-x-2">
                        <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                        <span className="font-mono text-[10px]">Consulting standard electrical schema & manuals...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Diagnostic Input bar */}
                <div className="space-y-2 mt-auto">
                  
                  {/* Quick Preset diagnostic queries */}
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => handleSendCopilotQuery("What are standard safety tag-out protocols for high voltage power meters?")}
                      className="bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-850 px-2 py-1 rounded text-[9px] font-mono leading-none transition-all"
                    >
                      #SafetyLOTO
                    </button>
                    <button
                      onClick={() => handleSendCopilotQuery("How do I calibrate signal attenuation drift in optical splicing junctions?")}
                      className="bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-850 px-2 py-1 rounded text-[9px] font-mono leading-none transition-all"
                    >
                      #OpticalDrift
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={copilotQuery}
                      onChange={(e) => setCopilotQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendCopilotQuery();
                      }}
                      placeholder="Type equipment symptoms or error codes..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-3 pr-10 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                    <button
                      onClick={() => handleSendCopilotQuery()}
                      className="absolute right-2.5 top-2.5 text-cyan-400 hover:text-cyan-300 transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 3: INTERACTIVE EXPANSIVE ASSET LIST & TELEMETRY       */}
        {/* ========================================================== */}
        {activeTab === "assets" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* Left Hand: Assets Registry */}
            <div className="xl:col-span-4 space-y-6">
              <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 shadow-md flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-bold text-sm tracking-tight text-slate-150">Active Equipment & Assets Twins</h3>
                  </div>
                  <span className="text-[10px] bg-indigo-950 text-cyan-300 font-mono px-2 py-0.5 border border-indigo-900 rounded">
                    {assets.length} Registered
                  </span>
                </div>

                <div className="space-y-3">
                  {assets.map((as) => {
                    const isSelected = selectedAsset?.id === as.id;
                    const connectedTicket = workOrders.find(w => w.assetId === as.id);
                    return (
                      <div
                        key={as.id}
                        onClick={() => setSelectedAsset(as)}
                        className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${isSelected ? 'bg-slate-850 border-cyan-500/50 shadow shadow-cyan-950/40 font-medium' : 'bg-slate-950 border-slate-855 hover:border-slate-700/80'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="bg-slate-900 px-1.5 py-0.5 rounded text-[10px] text-slate-400 font-mono">{as.id}</span>
                            <h4 className="font-bold text-xs text-slate-100 mt-1">{as.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">Model: <span className="text-slate-300 font-mono">{as.model}</span></p>
                          </div>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${as.status.includes('Critical') ? 'bg-red-950 text-red-300 border border-red-900' : as.status.includes('Warning') ? 'bg-amber-950 text-amber-300 border border-amber-900' : 'bg-emerald-950 text-emerald-400 border border-emerald-950'}`}>
                            {as.status}
                          </span>
                        </div>

                        <div className="mt-3.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Inst: {as.installationDate}</span>
                          {connectedTicket ? (
                            <span className="text-[10px] text-amber-400 font-bold font-mono animate-pulse">
                              ⚠️ Act: {connectedTicket.id}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">
                              🟢 No fault alert
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Hand: Detailed Digital Twin Asset telemetry parameters */}
            <div className="xl:col-span-8 space-y-6">
              {selectedAsset ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-6 shadow-md"
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold bg-cyan-950 px-2 py-0.5 rounded">
                        Equipment Twin Registry Detail
                      </span>
                      <h3 className="text-lg font-bold text-slate-100 mt-1">{selectedAsset.name} ({selectedAsset.id})</h3>
                      <p className="text-xs text-slate-400">Active telemetry parsing over SCADA networks and Modbus controllers.</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-450">Health Index Tracker:</span>
                      <div className={`text-sm font-mono font-black py-1 px-3.5 rounded ${selectedAsset.telemetry.healthScore > 90 ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : selectedAsset.telemetry.healthScore > 70 ? 'bg-amber-950 text-amber-400 border border-amber-900' : 'bg-red-950 text-red-400 border border-red-900'}`}>
                        {selectedAsset.telemetry.healthScore}%
                      </div>
                    </div>
                  </div>

                  {/* Core asset telemetry stats bento highlights */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs">
                      <p className="text-slate-500 uppercase font-bold text-[9px] tracking-widest">Model & Class</p>
                      <p className="text-sm font-semibold text-slate-100 mt-1">{selectedAsset.model}</p>
                      <p className="text-slate-400 mt-1 text-[11px] font-mono">Category: {selectedAsset.type}</p>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs">
                      <p className="text-slate-500 uppercase font-bold text-[9px] tracking-widest">Installation Date</p>
                      <p className="text-sm font-semibold text-slate-100 mt-1">{selectedAsset.installationDate}</p>
                      <p className="text-slate-400 mt-1 text-[11px]">Lifecycle: 3 Yr Active</p>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs">
                      <p className="text-slate-500 uppercase font-bold text-[9px] tracking-widest">Last Maintenance Service</p>
                      <p className="text-sm font-semibold text-slate-100 mt-1">{selectedAsset.lastService}</p>
                      <p className="text-slate-400 mt-1 text-[11px] font-mono">Routine scheduled</p>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs">
                      <p className="text-slate-500 uppercase font-bold text-[9px] tracking-widest">Physical Location Coordinate</p>
                      <p className="text-sm font-semibold text-slate-100 mt-1">{selectedAsset.location}</p>
                      <p className="text-cyan-400 mt-1 text-[11px] font-mono">Zone Secure Area</p>
                    </div>
                  </div>

                  {/* Operational Telemetry streams parsed from digital modules */}
                  <div className="space-y-3.5">
                    <h4 className="text-xs uppercase tracking-widest font-black text-slate-400">Live Scoped Telemetry Registry</h4>
                    
                    <div className="bg-slate-950 rounded-xl border border-slate-850 p-4">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-850 text-slate-500">
                            <th className="pb-2 font-semibold">Sensor Parameter</th>
                            <th className="pb-2 text-right font-semibold">Live Stream Output</th>
                            <th className="pb-2 text-right font-semibold">Compliance Range</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-950 font-mono text-slate-300">
                          {Object.keys(selectedAsset.telemetry).map((key) => {
                            if (key === 'healthScore') return null;
                            return (
                              <tr key={key} className="hover:bg-slate-900/40">
                                <td className="py-2.5 font-sans font-medium text-slate-200">{key.replace(/([A-Z])/g, ' $1')}</td>
                                <td className="py-2.5 text-right font-bold text-cyan-400">{selectedAsset.telemetry[key]}</td>
                                <td className="py-2.5 text-right text-slate-500">Nominal / Standard</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Simulated historical telemetry timeline charts or details */}
                  <div className="bg-slate-950 rounded-xl border border-slate-850 p-4 space-y-3">
                    <h4 className="text-xs text-slate-300 font-bold">Standard Isolation Protocol (SOP Reference)</h4>
                    <p className="text-xs text-slate-400">The platform automatically indexes technical compliance operating manuals for {selectedAsset.name}. Select the Instruction tab to analyze troubleshooting sequences.</p>
                  </div>

                </motion.div>
              ) : (
                <div className="bg-slate-900/60 p-12 text-center rounded-xl border border-slate-800 flex flex-col items-center justify-center space-y-2">
                  <Layers className="w-10 h-10 text-slate-500 animate-pulse" />
                  <p className="text-sm text-slate-400">Select an physical mechanical Asset to inspect active digital twins.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 4: SOP INSTRUCTION MANUALS                            */}
        {/* ========================================================== */}
        {activeTab === "knowledge" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: SOP Index */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-bold text-sm tracking-tight text-slate-150">Technical Manual Registry</h3>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {sops.map((sop) => (
                    <div
                      key={sop.id}
                      className="p-3 bg-slate-950 rounded-lg border border-slate-850 flex flex-col justify-between hover:border-slate-800 text-left cursor-default"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-[10px] bg-slate-900 text-cyan-400 px-1.5 py-0.5 rounded border border-slate-850">
                          {sop.id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-900 px-2 py-0.5 rounded">
                          {sop.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-200">{sop.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-normal">{sop.summary}</p>
                      
                      <div className="mt-3.5 pt-2 border-t border-slate-950 flex justify-end">
                        <button
                          onClick={() => {
                            setCopilotQuery(`How do I execute ${sop.id} for structural verification of drift calibration?`);
                            const el = document.getElementById("copilot-input-area");
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                            setActiveTab("technician");
                          }}
                          className="text-[10px] text-cyan-400 font-bold uppercase hover:underline flex items-center gap-1"
                        >
                          Send to Diagnostic Copilot →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Active Instruction Procedure steps */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-5">
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 px-2.5 py-1 rounded font-bold uppercase inline-block">
                  SOP CALIBRATION CHECKLIST STEPS
                </span>
                
                <h3 className="text-base font-black text-slate-150">Lockout Tagout (LOTO) & Advanced Industrial Field Calibration Standard Operations Manual</h3>
                <p className="text-xs text-slate-400">Technicians must verify all steps to satisfy regulatory compliance guidelines:</p>

                <div className="space-y-3.5 pt-2">
                  {sops.map((sop) => (
                    <div key={sop.id + "_detail"} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                      <h4 className="text-xs font-black text-slate-200 font-mono text-cyan-400 border-b border-slate-900 pb-2 flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        {sop.title} ({sop.id})
                      </h4>
                      
                      <ol className="list-decimal list-inside space-y-2 text-xs text-slate-350 marker:text-cyan-400 pl-2">
                        {sop.steps.map((st, sIndex) => (
                          <li key={sIndex} className="leading-relaxed hover:text-slate-150">
                            {st}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER & RESOURCE MAPPING SECTION */}
      <footer className="bg-slate-900 border-t border-slate-800/80 mt-12 py-8 px-6 text-xs text-slate-400 select-text">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 text-sm tracking-tight">AI FIELD-OPS Copilot</h4>
            <p className="text-slate-405 leading-relaxed">Enterprise software architecture maximizing diagnostic capabilities, first-time resolution ratios, and autonomous logistics dispatch routines.</p>
            <p className="text-[10px] text-slate-500 font-mono">Build Version 9.2026.04</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-250 text-sm tracking-tight">Supported Verticals</h4>
            <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
              <li>• Biomedical & Diagnostics</li>
              <li>• Critical HVAC Systems</li>
              <li>• Optical Fiber Telecom Ring</li>
              <li>• Electric Smart Grid Grid</li>
              <li>• Municipal Utility Networks</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-250 text-sm tracking-tight">Enterprise Integrations</h4>
            <p className="text-slate-405 leading-relaxed">
              Accepting streaming telemetry coordinates from SCADA, OPC-UA servers, and AWS IoT hub triggers. Out of box support for Salesforce Field Service and SAP Enterprise PM databases.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-250 text-sm tracking-tight">Security & Encryption</h4>
            <p className="text-slate-405 leading-relaxed">
              HIPAA Compliant biomedical logging. Full structural TLS 1.3 socket encapsulation. Multi-region redundancy disaster plans. Zero trust identity keys.
            </p>
          </div>

        </div>

        <div className="max-w-[1600px] mx-auto mt-8 pt-6 border-t border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2026 Google AI Studio Enterprise Ecosystem. All rights reserved.</p>
          <div className="flex space-x-4">
            <span className="hover:text-cyan-400 cursor-pointer">Security Protocol Docs</span>
            <span className="hover:text-cyan-400 cursor-pointer">SLA Agreement Matrix</span>
            <span className="hover:text-cyan-400 cursor-pointer">Developer Node Registry</span>
          </div>
        </div>
      </footer>

      {/* ========================================================== */}
      {/* MODAL: CREATE NEW EMERGENCY TICKET                         */}
      {/* ========================================================== */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border-2 border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-indigo-400" />
                Dispatch New Emergency Client Request
              </h3>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="text-slate-500 hover:text-slate-200 text-sm font-bold p-1 leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewTicket} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">Enterprise Client Name:</label>
                  <input
                    type="text"
                    required
                    value={newTicketClient}
                    onChange={(e) => setNewTicketClient(e.target.value)}
                    placeholder="e.g. Mercy General Hospital"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">SOP Asset Reference:</label>
                  <select
                    value={newTicketAssetId}
                    onChange={(e) => setNewTicketAssetId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-250 focus:ring-1 focus:ring-cyan-500 font-mono"
                  >
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.id} - {a.name.split(" ")[0]}...</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">Priority Rating SLA:</label>
                  <select
                    value={newTicketPriority}
                    onChange={(e) => setNewTicketPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:ring-1 focus:ring-cyan-500 font-bold"
                  >
                    <option value="Critical">🚨 Critical Priority</option>
                    <option value="High">🟠 High Priority</option>
                    <option value="Medium">🟡 Medium Priority</option>
                    <option value="Low">🟢 Low Priority</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">Physical Worksite Coord Label:</label>
                  <input
                    type="text"
                    required
                    value={newTicketLocLabel}
                    onChange={(e) => setNewTicketLocLabel(e.target.value)}
                    placeholder="e.g. ICU Wing - Zone Alpha"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">Reported Diagnostic Symptoms:</label>
                <textarea
                  required
                  value={newTicketDesc}
                  onChange={(e) => setNewTicketDesc(e.target.value)}
                  placeholder="e.g. Multi-parameter clinical monitor reports calibration failure on boots. SpO2 readings drift..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:ring-1 focus:ring-cyan-500 min-h-[90px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2.5 border-t border-slate-805">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-350 font-bold px-4 py-2.5 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-lg flex items-center space-x-1.5"
                >
                  <span>Dispatch Alert</span>
                </button>
              </div>

            </form>

          </motion.div>
        </div>
      )}

    </div>
  );
}
