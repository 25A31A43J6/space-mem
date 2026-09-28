import React, { useState } from 'react';
import {
  Zap,
  Sparkles,
  AlertTriangle,
  RotateCw,
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AnalysisResult, NewAnomalySubmission, SubsystemType, TestType, SeverityLevel } from '../types/spaceMem.ts';
import { submitInvestigation } from '../api.ts';

interface NewInvestigationViewProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
  initialScenario?: string;
}

export const NewInvestigationView: React.FC<NewInvestigationViewProps> = ({
  onAnalysisComplete,
  initialScenario
}) => {
  const [formData, setFormData] = useState<NewAnomalySubmission>(() => {
    return getPreloadedScenario(initialScenario || 'pcdu_voltage');
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Progressive disclosure accordion states
  const [openSection1, setOpenSection1] = useState(true);
  const [openSection2, setOpenSection2] = useState(true);
  const [openSection3, setOpenSection3] = useState(true);

  function getPreloadedScenario(type: string): NewAnomalySubmission {
    const timestamp = new Date().toISOString();
    switch (type) {
      case 'reaction_wheel':
        return {
          caseId: `CASE-${Date.now().toString().slice(-4)}`,
          satellite: 'Orion-Surveyor-3B',
          component: 'Reaction Wheel Assembly (RWA-3) - High-Momentum Unit',
          subsystem: 'Attitude & Orbit Control (ADCS)',
          testType: 'Vibration & Acoustic Test',
          failureTime: timestamp,
          severity: 'HIGH',
          temperature: 22.0,
          voltage: 28.0,
          current: 1.92,
          pressure: 'Ambient shaker cleanroom',
          vibration: '9.4 g RMS (Random vibration 20 - 2000 Hz)',
          duration: 'Post-shake functional spin up',
          telemetryObservations: 'Tachometer jitter of 138 RPM peak-to-peak at 3200 RPM; motor current draw jumped to 1.92A (idle baseline is 0.32A). 420 Hz harmonic resonance on accelerometer.',
          errorCodes: 'ERR-ADCS-310, RWA_SPEED_JITTER, DRAG_TORQUE_EXCEEDED',
          symptoms: 'Post-vibration spin test exhibited severe speed jitter and high drag current. Micro-vibration sensor detects resonance coupling into attitude bench.',
          engineerNotes: 'Need to isolate whether optical tachometer encoder board was cracked by vibration or mechanical bearings settled.'
        };
      case 'transponder':
        return {
          caseId: `CASE-${Date.now().toString().slice(-4)}`,
          satellite: 'Polaris-Comms-3',
          component: 'S-Band Transponder Transmitter/Receiver (XTR-02)',
          subsystem: 'Telemetry & Telecommand (TT&C)',
          testType: 'EMI/EMC Qualification',
          failureTime: timestamp,
          severity: 'MEDIUM',
          temperature: 25.0,
          voltage: 28.1,
          current: 3.5,
          pressure: 'Ambient EMC chamber',
          vibration: '0.0 g RMS',
          duration: 'High power RF burst at 10W',
          telemetryObservations: 'Downlink frame error rate jumped to 17.8% during 10W burst mode. Uplink command receiver experienced bit slips. Ground offset of 320mV observed.',
          errorCodes: 'ERR-TTC-104, FRAME_SYNC_LOSS, RX_BIT_SLIP_WARN',
          symptoms: 'Downlink packet loss occurs only when transmitter operates in high-power 10W RF mode. Command receiver loses frame synchronization.',
          engineerNotes: 'Team is debating whether diplexer seal leaked or grounding loop exists.'
        };
      case 'star_tracker':
        return {
          caseId: `CASE-${Date.now().toString().slice(-4)}`,
          satellite: 'Orion-Surveyor-4',
          component: 'Autonomous Star Tracker Optical Head (STR-B)',
          subsystem: 'Attitude & Orbit Control (ADCS)',
          testType: 'Thermal Vacuum (TVAC)',
          failureTime: timestamp,
          severity: 'MEDIUM',
          temperature: 44.0,
          voltage: 5.0,
          current: 0.65,
          pressure: '1.8e-6 Torr',
          vibration: '0.0 g RMS',
          duration: 'Rapid thermal transit with solar lamp heating',
          telemetryObservations: 'Star count plummeted from 18 to 3 stars. Attitude residual jumped from 4.5 arcsec to 64 arcsec. Periodic loss of quaternion solution.',
          errorCodes: 'ERR-ADCS-702, STR_STAR_COUNT_LOW, ATTITUDE_LOST_LOCK',
          symptoms: 'Star tracker loses lock whenever baffle-to-detector temperature gradient exceeds 25°C. PSF centroiding error increases drastically.',
          engineerNotes: 'Investigate if optical barrel is defocussing or if external stray light is penetrating baffle.'
        };
      case 'pcdu_voltage':
      default:
        return {
          caseId: `CASE-${Date.now().toString().slice(-4)}`,
          satellite: 'AeroSat-4C',
          component: 'Power Control & Distribution Unit (PCDU) - Main Bus Converter',
          subsystem: 'Electrical Power (EPS)',
          testType: 'Thermal Vacuum (TVAC)',
          failureTime: timestamp,
          severity: 'CRITICAL',
          temperature: -24.5,
          voltage: 23.6,
          current: 14.5,
          pressure: '1.1e-6 Torr',
          vibration: '0.0 g RMS (Static TVAC)',
          duration: '36 hrs cold soak plateau at -25°C',
          telemetryObservations: 'Regulated 28V spacecraft bus collapsed to 23.6V. High-frequency 650mV ripple on EPS_BUS_VMON. Triggered autonomous UVLO trip threshold at 24.0V.',
          errorCodes: 'ERR-PWR-4029, FAULT_BUS_UVLO_ASSERT, PCDU_REG_INSTABILITY',
          symptoms: 'Spacecraft main bus collapsed to 23.6V triggering UVLO restart loop during -25°C thermal soak. Severe ripple observed on power lines.',
          engineerNotes: 'GSE technician suspects cryogenic chamber umbilical harness resistance. Check before replacing expensive chamber cables.'
        };
    }
  }

  const handleScenarioSelect = (scenario: string) => {
    setFormData(getPreloadedScenario(scenario));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzing(true);
    setErrorMessage(null);
    setCurrentStep(1);

    try {
      await new Promise(r => setTimeout(r, 600));
      setCurrentStep(2);

      await new Promise(r => setTimeout(r, 700));
      setCurrentStep(3);

      const result = await submitInvestigation(formData);
      await new Promise(r => setTimeout(r, 500));

      setAnalyzing(false);
      onAnalysisComplete(result);
    } catch (err: any) {
      console.error('Investigation submission error:', err);
      setErrorMessage(err.message || 'Failed to complete analysis.');
      setAnalyzing(false);
      setCurrentStep(0);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12 font-sans text-slate-100">
      {/* Title & Context */}
      <div className="border-b border-white/10 pb-5">
        <div className="flex items-center gap-2 text-sky-400 font-mono text-xs mb-1.5 font-bold">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <span>MISSION INVESTIGATION WORKFLOW</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-['Inter'] font-light text-white tracking-tight">
          New Spacecraft Failure Investigation
        </h1>
        <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed font-normal">
          Enter anomaly telemetry and test observations. SPACE-MEM will analyze the symptoms, perform a <strong className="text-white font-semibold">Hindsight RECALL</strong> across historical failure records, and <strong className="text-white font-semibold">REFLECT</strong> to recommend proven investigation steps.
        </p>
      </div>

      {/* Quick Scenario Pre-fill Bar */}
      <div className="p-4 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 shadow-2xl space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>PRE-FILL TEST SCENARIOS (FOR RAPID DEMONSTRATION):</span>
          </span>
          <span className="text-[11px] font-mono text-sky-300 bg-sky-500/20 border border-sky-400/30 px-2.5 py-0.5 rounded-md font-semibold">1-click populated</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleScenarioSelect('pcdu_voltage')}
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-sky-400/40 text-slate-200 font-mono cursor-pointer transition-colors shadow-sm backdrop-blur-md"
          >
            ⚡ PCDU Bus Voltage Instability (-25°C TVAC)
          </button>
          <button
            type="button"
            onClick={() => handleScenarioSelect('reaction_wheel')}
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-sky-400/40 text-slate-200 font-mono cursor-pointer transition-colors shadow-sm backdrop-blur-md"
          >
            🔄 Reaction Wheel Tach Jitter (Post Vibe)
          </button>
          <button
            type="button"
            onClick={() => handleScenarioSelect('transponder')}
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-sky-400/40 text-slate-200 font-mono cursor-pointer transition-colors shadow-sm backdrop-blur-md"
          >
            📡 S-Band Transponder Frame Drops (10W EMC)
          </button>
          <button
            type="button"
            onClick={() => handleScenarioSelect('star_tracker')}
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-sky-400/40 text-slate-200 font-mono cursor-pointer transition-colors shadow-sm backdrop-blur-md"
          >
            ⭐ Star Tracker Lost Lock (Thermal Gradient)
          </button>
        </div>
      </div>

      {/* Multi-Step Analysis Loading Modal */}
      {analyzing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900/90 border border-white/15 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center backdrop-blur-xl">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center mx-auto text-sky-400 shadow-sm">
              <RotateCw className="w-8 h-8 animate-spin" />
            </div>

            <div>
              <h3 className="text-xl font-['Inter'] font-semibold text-white mb-1">
                ANALYZING WITH SPACE-MEM
              </h3>
              <p className="text-xs text-slate-300 font-sans">
                Correlating current telemetry with Hindsight engineering memory...
              </p>
            </div>

            {/* Stepper */}
            <div className="space-y-3 text-left text-xs font-sans">
              <div className={`p-3.5 rounded-xl border flex items-center gap-3 backdrop-blur-md ${
                currentStep >= 1 ? 'bg-sky-500/20 border-sky-400/40 text-white font-medium' : 'bg-white/[0.05] border-white/10 text-slate-400'
              }`}>
                {currentStep > 1 ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin shrink-0" />}
                <div>
                  <div className="font-semibold text-sm text-white">STEP 1: Analyze Current Failure</div>
                  <div className="text-xs text-slate-300">Groq parsing telemetry, symptoms &amp; error codes</div>
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border flex items-center gap-3 backdrop-blur-md ${
                currentStep >= 2 ? 'bg-sky-500/20 border-sky-400/40 text-white font-medium' : 'bg-white/[0.05] border-white/10 text-slate-400'
              }`}>
                {currentStep > 2 ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : currentStep === 2 ? <div className="w-4 h-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />}
                <div>
                  <div className="font-semibold text-sm text-white">STEP 2: Hindsight Memory RECALL</div>
                  <div className="text-xs text-slate-300">Searching bank: space-mem-engineering for precedents</div>
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border flex items-center gap-3 backdrop-blur-md ${
                currentStep >= 3 ? 'bg-sky-500/20 border-sky-400/40 text-white font-medium' : 'bg-white/[0.05] border-white/10 text-slate-400'
              }`}>
                {currentStep === 3 ? <div className="w-4 h-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />}
                <div>
                  <div className="font-semibold text-sm text-white">STEP 3: Historical Reasoning &amp; REFLECT</div>
                  <div className="text-xs text-slate-300">Synthesizing previous root causes &amp; what failed first</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Form in Dark Glassmorphism */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-sm flex items-center gap-3 shadow-lg backdrop-blur-md">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Section 1: Identification */}
        <div className="rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-md overflow-hidden shadow-2xl">
          <div 
            onClick={() => setOpenSection1(!openSection1)}
            className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.05] transition-colors border-b border-white/10"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-300 font-mono text-xs font-bold flex items-center justify-center border border-sky-400/30">
                01
              </span>
              <h2 className="font-sans text-sm font-bold tracking-wider text-white uppercase">
                Spacecraft &amp; Subsystem Identification
              </h2>
            </div>
            {openSection1 ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>

          {openSection1 && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Case / Anomaly ID</label>
                  <input
                    type="text"
                    value={formData.caseId || ''}
                    onChange={e => setFormData({ ...formData, caseId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-sm font-mono focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/30 transition-all placeholder-slate-400"
                    placeholder="CASE-2026-089"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Satellite / Spacecraft</label>
                  <input
                    type="text"
                    value={formData.satellite}
                    onChange={e => setFormData({ ...formData, satellite: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/30 transition-all placeholder-slate-400"
                    placeholder="AeroSat-4C"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Subsystem</label>
                  <select
                    value={formData.subsystem}
                    onChange={e => setFormData({ ...formData, subsystem: e.target.value as SubsystemType })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-white/15 text-white text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/30 transition-all"
                    required
                  >
                    <option value="Electrical Power (EPS)" className="bg-slate-900 text-white">Electrical Power (EPS)</option>
                    <option value="Attitude & Orbit Control (ADCS)" className="bg-slate-900 text-white">Attitude & Orbit Control (ADCS)</option>
                    <option value="Telemetry & Telecommand (TT&C)" className="bg-slate-900 text-white">Telemetry & Telecommand (TT&C)</option>
                    <option value="Thermal Control (TCS)" className="bg-slate-900 text-white">Thermal Control (TCS)</option>
                    <option value="On-Board Computer (OBC)" className="bg-slate-900 text-white">On-Board Computer (OBC)</option>
                    <option value="Propulsion (PROP)" className="bg-slate-900 text-white">Propulsion (PROP)</option>
                    <option value="Optical Payload (PL)" className="bg-slate-900 text-white">Optical Payload (PL)</option>
                    <option value="Structures & Mechanisms (SMA)" className="bg-slate-900 text-white">Structures & Mechanisms (SMA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Test Type / Regime</label>
                  <select
                    value={formData.testType}
                    onChange={e => setFormData({ ...formData, testType: e.target.value as TestType })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-white/15 text-white text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/30 transition-all"
                    required
                  >
                    <option value="Thermal Vacuum (TVAC)" className="bg-slate-900 text-white">Thermal Vacuum (TVAC)</option>
                    <option value="Vibration & Acoustic Test" className="bg-slate-900 text-white">Vibration & Acoustic Test</option>
                    <option value="Hardware-in-the-Loop (HIL)" className="bg-slate-900 text-white">Hardware-in-the-Loop (HIL)</option>
                    <option value="EMI/EMC Qualification" className="bg-slate-900 text-white">EMI/EMC Qualification</option>
                    <option value="On-Orbit Commissioning" className="bg-slate-900 text-white">On-Orbit Commissioning</option>
                    <option value="Thermal Cycling" className="bg-slate-900 text-white">Thermal Cycling</option>
                    <option value="Integrated System Test" className="bg-slate-900 text-white">Integrated System Test</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Component / Unit Name</label>
                  <input
                    type="text"
                    value={formData.component}
                    onChange={e => setFormData({ ...formData, component: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/30 transition-all placeholder-slate-400"
                    placeholder="e.g. Power Control & Distribution Unit (PCDU)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Severity Level</label>
                  <div className="flex gap-2">
                    {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as SeverityLevel[]).map(sev => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setFormData({ ...formData, severity: sev })}
                        className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer backdrop-blur-md ${
                          formData.severity === sev
                            ? sev === 'CRITICAL' ? 'bg-red-500/25 text-red-200 border-red-500/50 shadow-sm' :
                              sev === 'HIGH' ? 'bg-amber-500/25 text-amber-200 border-amber-500/50 shadow-sm' :
                              sev === 'MEDIUM' ? 'bg-sky-500/25 text-sky-200 border-sky-500/50 shadow-sm' :
                              'bg-white/20 text-white border-white/30 shadow-sm'
                            : 'bg-white/[0.05] text-slate-400 border-white/10 hover:border-white/25 hover:text-slate-200'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Environmental & Telemetry Conditions */}
        <div className="rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-md overflow-hidden shadow-2xl">
          <div 
            onClick={() => setOpenSection2(!openSection2)}
            className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.05] transition-colors border-b border-white/10"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-300 font-mono text-xs font-bold flex items-center justify-center border border-sky-400/30">
                02
              </span>
              <h2 className="font-sans text-sm font-bold tracking-wider text-white uppercase">
                Test Conditions &amp; Telemetry Delta
              </h2>
            </div>
            {openSection2 ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>

          {openSection2 && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={e => setFormData({ ...formData, temperature: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-sm font-mono focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/30 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Bus Voltage (V)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.voltage}
                    onChange={e => setFormData({ ...formData, voltage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-sm font-mono focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/30 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Current Draw (A)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.current}
                    onChange={e => setFormData({ ...formData, current: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-sm font-mono focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/30 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Chamber Pressure</label>
                  <input
                    type="text"
                    value={formData.pressure}
                    onChange={e => setFormData({ ...formData, pressure: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-sm font-mono focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/30 transition-all placeholder-slate-400"
                    placeholder="1.2e-6 Torr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Vibration Level</label>
                  <input
                    type="text"
                    value={formData.vibration}
                    onChange={e => setFormData({ ...formData, vibration: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-sm font-mono focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/30 transition-all placeholder-slate-400"
                    placeholder="9.4 g RMS"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Test Phase &amp; Duration Context</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={e => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/30 transition-all placeholder-slate-400"
                  placeholder="36 hrs cold soak plateau at -25°C"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Telemetry Observations (Specific sensor readings &amp; waveforms)</label>
                <textarea
                  rows={3}
                  value={formData.telemetryObservations}
                  onChange={e => setFormData({ ...formData, telemetryObservations: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-sm font-mono focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/30 transition-all leading-relaxed placeholder-slate-400"
                  placeholder="Regulated 28V spacecraft bus collapsed to 23.6V..."
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Symptoms & Diagnostic Observations */}
        <div className="rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-md overflow-hidden shadow-2xl">
          <div 
            onClick={() => setOpenSection3(!openSection3)}
            className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.05] transition-colors border-b border-white/10"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-300 font-mono text-xs font-bold flex items-center justify-center border border-sky-400/30">
                03
              </span>
              <h2 className="font-sans text-sm font-bold tracking-wider text-white uppercase">
                Symptoms &amp; Diagnostic Observations
              </h2>
            </div>
            {openSection3 ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>

          {openSection3 && (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Anomaly Symptoms Summary</label>
                <textarea
                  rows={2}
                  value={formData.symptoms}
                  onChange={e => setFormData({ ...formData, symptoms: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/30 transition-all leading-relaxed placeholder-slate-400"
                  placeholder="Summarize the anomaly symptoms..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Error Codes &amp; Triggered Flags</label>
                  <input
                    type="text"
                    value={formData.errorCodes}
                    onChange={e => setFormData({ ...formData, errorCodes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-sm font-mono focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/30 transition-all placeholder-slate-400"
                    placeholder="ERR-PWR-4029, FAULT_BUS_UVLO_ASSERT"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Investigating Engineer Notes / Suspected Hypotheses</label>
                  <input
                    type="text"
                    value={formData.engineerNotes}
                    onChange={e => setFormData({ ...formData, engineerNotes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/30 transition-all placeholder-slate-400"
                    placeholder="Suspected harness resistance or cold temperature component shift..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button & Target Bank Bar */}
        <div className="p-6 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Target Memory Bank: <strong className="text-white font-mono font-bold">space-mem-engineering</strong></span>
          </div>

          <button
            type="submit"
            disabled={analyzing}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-sky-200" />
            <span>Correlate &amp; Investigate with SPACE-MEM</span>
          </button>
        </div>
      </form>
    </div>
  );
};
