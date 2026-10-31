import React, { useState, useEffect, useRef } from 'react';
import { Navigation, ScreenId } from './components/Navigation';
import { WelcomeScreen } from './components/WelcomeScreen';
import { LunarHabitatDiagram } from './components/LunarHabitatDiagram';
import { ResourceTelemetryCards } from './components/ResourceTelemetryCards';
import { EngineeringLab } from './components/EngineeringLab';
import { JuniorAstronautAcademy } from './components/JuniorAstronautAcademy';
import { MissionSelectScreen } from './components/MissionSelectScreen';
import { AchievementsView } from './components/AchievementsView';
import { SourcesAndDisclaimer } from './components/SourcesAndDisclaimer';
import { MissionAdvisorPanel } from './components/MissionAdvisorPanel';
import { EmergencyModal } from './components/EmergencyModal';
import { MissionDebriefModal } from './components/MissionDebriefModal';
import { ResourceHelpModal, HelpResourceId } from './components/ResourceHelpModal';
import { GameCentreHub } from './components/gamecentre/GameCentreHub';

import { AlertTriangle } from 'lucide-react';
import { MISSION_SCENARIOS, INITIAL_ACHIEVEMENTS, SOLAR_STORM_EMERGENCY } from './data/missions';
import { ResourceState, EngineeringSettings, MissionScenario, EmergencyEvent, Achievement, TelemetryHistoryPoint, SavedMissionSession } from './types/simulation';
import { tickSimulation } from './utils/simulationEngine';
import { sound } from './utils/audio';

interface LifetimeStats {
  totalSolsCommanded: number;
  missionsCompleted: number;
  emergenciesResolved: number;
  highestRecyclingRate: number;
}

interface SavedMissionSummary {
  scenarioTitle: string;
  sol: number;
  hour: number;
  savedAt: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('welcome');
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());

  // Active Mission & Simulation State
  const [activeScenario, setActiveScenario] = useState<MissionScenario>(MISSION_SCENARIOS[0]);
  const [resourceState, setResourceState] = useState<ResourceState>(() => {
    return {
      ...(MISSION_SCENARIOS[0].initialResources as ResourceState)
    };
  });
  const [settings, setSettings] = useState<EngineeringSettings>(MISSION_SCENARIOS[0].initialSettings);

  // Telemetry History (up to 48 hours recorded)
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryHistoryPoint[]>(() => {
    const res = MISSION_SCENARIOS[0].initialResources as ResourceState;
    const initPoint: TelemetryHistoryPoint = {
      elapsedHour: 0,
      sol: res.missionSol ?? 1,
      hour: res.missionHour ?? 0,
      oxygenKg: res.oxygenKg ?? 100,
      waterLiters: res.waterLiters ?? 250,
      batteryKwh: res.batteryStorageKwh ?? 120,
      foodDays: res.foodRationsDays ?? 30,
      netPowerKw: Number(((res.powerKwGenerated ?? 18) - (res.powerKwConsumed ?? 14.5)).toFixed(2))
    };
    return [initPoint];
  });

  // Autosave and Resume state
  const [savedMissionSummary, setSavedMissionSummary] = useState<SavedMissionSummary | null>(null);
  const [showConfirmNewMissionModal, setShowConfirmNewMissionModal] = useState<boolean>(false);
  const [pendingNewScenario, setPendingNewScenario] = useState<MissionScenario | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const targetDurationHours = activeScenario.durationSols * 24;

  // Active Emergency Modal State & Screen-Shake Animation
  const [activeEmergency, setActiveEmergency] = useState<EmergencyEvent | null>(null);
  const [hasTriggeredScheduledEmergency, setHasTriggeredScheduledEmergency] = useState<boolean>(false);
  const [isScreenShaking, setIsScreenShaking] = useState<boolean>(false);

  // Debrief Modal State
  const [showDebrief, setShowDebrief] = useState<boolean>(false);
  const [isMissionVictory, setIsMissionVictory] = useState<boolean>(false);
  const [missionFailureReason, setMissionFailureReason] = useState<string | undefined>();

  // Telemetry Help Overlay & Modal State
  const [selectedHelpResource, setSelectedHelpResource] = useState<HelpResourceId | null>(null);
  const [isHelpOverlayActive, setIsHelpOverlayActive] = useState<boolean>(false);

  // Achievements State (persisted in localStorage)
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem('lunops_achievements');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_ACHIEVEMENTS;
      }
    }
    return INITIAL_ACHIEVEMENTS;
  });

  // Lifetime Stats (persisted in localStorage)
  const [lifetimeStats, setLifetimeStats] = useState<LifetimeStats>(() => {
    const saved = localStorage.getItem('lunops_lifetime_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { totalSolsCommanded: 1, missionsCompleted: 0, emergenciesResolved: 0, highestRecyclingRate: 88 };
      }
    }
    return { totalSolsCommanded: 1, missionsCompleted: 0, emergenciesResolved: 0, highestRecyclingRate: 88 };
  });

  // Save achievements & stats to localStorage
  useEffect(() => {
    localStorage.setItem('lunops_achievements', JSON.stringify(achievements));
  }, [achievements]);

  useEffect(() => {
    localStorage.setItem('lunops_lifetime_stats', JSON.stringify(lifetimeStats));
  }, [lifetimeStats]);

  // Load saved in-flight mission on initial mount
  useEffect(() => {
    const saved = localStorage.getItem('lunops_active_mission');
    if (saved) {
      try {
        const parsed: SavedMissionSession = JSON.parse(saved);
        if (parsed && parsed.resourceState && parsed.resourceState.totalElapsedHours > 0) {
          const scenario = MISSION_SCENARIOS.find(s => s.id === parsed.scenarioId) || MISSION_SCENARIOS[0];
          setSavedMissionSummary({
            scenarioTitle: scenario.title,
            sol: parsed.resourceState.missionSol,
            hour: parsed.resourceState.missionHour,
            savedAt: new Date(parsed.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
      } catch (err) {
        console.warn('Failed to parse saved mission session:', err);
      }
    }
  }, []);

  // Autosave active in-flight mission progress locally
  useEffect(() => {
    if (resourceState.totalElapsedHours > 0 && !showDebrief) {
      const sessionData: SavedMissionSession = {
        scenarioId: activeScenario.id,
        resourceState,
        settings,
        telemetryHistory,
        hasTriggeredScheduledEmergency,
        savedAt: new Date().toISOString()
      };
      try {
        localStorage.setItem('lunops_active_mission', JSON.stringify(sessionData));
        setSavedMissionSummary({
          scenarioTitle: activeScenario.title,
          sol: resourceState.missionSol,
          hour: resourceState.missionHour,
          savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      } catch (e) {
        console.warn('Autosave error', e);
      }
    }
  }, [resourceState, settings, telemetryHistory, activeScenario, hasTriggeredScheduledEmergency, showDebrief]);
 
  // Trigger subtle screen-shake animation when an emergency event occurs
  useEffect(() => {
    if (activeEmergency) {
      setIsScreenShaking(true);
      const timer = setTimeout(() => {
        setIsScreenShaking(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [activeEmergency]);

  const unlockAchievement = (id: string) => {
    setAchievements(prev =>
      prev.map(a => {
        if (a.id === id && !a.unlocked) {
          sound.playSuccess();
          return { ...a, unlocked: true, unlockedAt: new Date().toLocaleDateString() };
        }
        return a;
      })
    );
  };

  // Helper to resume saved mission from localStorage
  const handleResumeMission = () => {
    const saved = localStorage.getItem('lunops_active_mission');
    if (saved) {
      try {
        const parsed: SavedMissionSession = JSON.parse(saved);
        const scenario = MISSION_SCENARIOS.find(s => s.id === parsed.scenarioId) || MISSION_SCENARIOS[0];
        setActiveScenario(scenario);
        setResourceState(parsed.resourceState);
        setSettings(parsed.settings);
        if (parsed.telemetryHistory && parsed.telemetryHistory.length > 0) {
          setTelemetryHistory(parsed.telemetryHistory);
        }
        setHasTriggeredScheduledEmergency(parsed.hasTriggeredScheduledEmergency || false);
        setIsPlaying(false);
        setActiveEmergency(null);
        setShowDebrief(false);
        setCurrentScreen('mission_control');
        sound.playSuccess();
      } catch (err) {
        console.error('Error resuming mission', err);
      }
    }
  };

  // Switch to a new scenario directly
  const executeSelectScenario = (scenario: MissionScenario) => {
    setActiveScenario(scenario);
    const initialRes = scenario.initialResources as ResourceState;
    setResourceState({ ...initialRes });
    setSettings({ ...scenario.initialSettings });
    const initPoint: TelemetryHistoryPoint = {
      elapsedHour: 0,
      sol: initialRes.missionSol ?? 1,
      hour: initialRes.missionHour ?? 0,
      oxygenKg: initialRes.oxygenKg ?? 100,
      waterLiters: initialRes.waterLiters ?? 250,
      batteryKwh: initialRes.batteryStorageKwh ?? 120,
      foodDays: initialRes.foodRationsDays ?? 30,
      netPowerKw: Number(((initialRes.powerKwGenerated ?? 18) - (initialRes.powerKwConsumed ?? 14.5)).toFixed(2))
    };
    setTelemetryHistory([initPoint]);
    setIsPlaying(false);
    setActiveEmergency(null);
    setHasTriggeredScheduledEmergency(false);
    setShowDebrief(false);
    localStorage.removeItem('lunops_active_mission');
    setSavedMissionSummary(null);
    setCurrentScreen('mission_control');
  };

  // Handle request to start mission (check for active unfinished mission first)
  const handleStartMissionRequest = () => {
    if (savedMissionSummary && resourceState.totalElapsedHours > 0 && !showDebrief) {
      setShowConfirmNewMissionModal(true);
      setPendingNewScenario(null);
    } else {
      setCurrentScreen('mission_control');
    }
  };

  // Handle request to select scenario (check for active unfinished mission first)
  const handleSelectScenarioRequest = (scenario: MissionScenario) => {
    if (savedMissionSummary && resourceState.totalElapsedHours > 0 && !showDebrief) {
      setShowConfirmNewMissionModal(true);
      setPendingNewScenario(scenario);
    } else {
      executeSelectScenario(scenario);
    }
  };

  const confirmReplaceMission = () => {
    setShowConfirmNewMissionModal(false);
    if (pendingNewScenario) {
      executeSelectScenario(pendingNewScenario);
      setPendingNewScenario(null);
    } else {
      executeSelectScenario(activeScenario);
    }
    sound.playClick();
  };

  // Helper to restart active mission
  const restartMission = () => {
    executeSelectScenario(activeScenario);
  };

  // Step simulation 1 hour
  const advanceHour = () => {
    if (showDebrief || activeEmergency) return;

    const result = tickSimulation(resourceState, settings, targetDurationHours);
    setResourceState(result.nextState);

    // Record telemetry point
    const nextPoint: TelemetryHistoryPoint = {
      elapsedHour: result.nextState.totalElapsedHours,
      sol: result.nextState.missionSol,
      hour: result.nextState.missionHour,
      oxygenKg: result.nextState.oxygenKg,
      waterLiters: result.nextState.waterLiters,
      batteryKwh: result.nextState.batteryStorageKwh,
      foodDays: result.nextState.foodRationsDays,
      netPowerKw: Number((result.nextState.powerKwGenerated - result.nextState.powerKwConsumed).toFixed(2))
    };
    setTelemetryHistory(prev => [...prev.slice(-47), nextPoint]);

    // Update stats
    setLifetimeStats(prev => ({
      ...prev,
      totalSolsCommanded: Math.max(prev.totalSolsCommanded, result.nextState.missionSol),
      highestRecyclingRate: Math.max(prev.highestRecyclingRate, result.nextState.waterRecyclingEfficiencyPercent)
    }));

    // Check achievement triggers
    if (result.nextState.waterRecyclingEfficiencyPercent >= 95) {
      unlockAchievement('water-champion');
    }
    if (result.nextState.batteryStorageKwh > 50 && result.nextState.powerKwGenerated > 10) {
      unlockAchievement('power-expert');
    }
    if (result.nextState.foodRationsDays > 22) {
      unlockAchievement('greenhouse-master');
    }

    // Check scheduled emergency trigger
    if (
      !hasTriggeredScheduledEmergency &&
      activeScenario.scheduledEmergency &&
      result.nextState.totalElapsedHours >= activeScenario.scheduledEmergency.triggerHour
    ) {
      setIsPlaying(false);
      setActiveEmergency(activeScenario.scheduledEmergency.emergency);
      setHasTriggeredScheduledEmergency(true);
      sound.playAlert();
      return;
    }

    // Check mission conclusion
    if (result.isMissionOver) {
      setIsPlaying(false);
      setIsMissionVictory(result.victory);
      setMissionFailureReason(result.failureReason);
      setShowDebrief(true);

      if (result.victory) {
        sound.playSuccess();
        setLifetimeStats(prev => ({
          ...prev,
          missionsCompleted: prev.missionsCompleted + 1
        }));
        if (activeScenario.id === 'mission-2-solar-storm') {
          unlockAchievement('solar-storm-hero');
        }
        if (activeScenario.id === 'mission-5-sustainable-base') {
          unlockAchievement('closed-loop-artemis');
        }
      } else {
        sound.playAlert();
      }
    }
  };

  // Step simulation 24 hours (1 Sol)
  const advanceSol = () => {
    if (showDebrief || activeEmergency) return;

    let currentState = resourceState;
    const newHistoryPoints: TelemetryHistoryPoint[] = [];
    let scheduledEmergTriggered = false;

    for (let i = 0; i < 24; i++) {
      const result = tickSimulation(currentState, settings, targetDurationHours);
      currentState = result.nextState;

      newHistoryPoints.push({
        elapsedHour: currentState.totalElapsedHours,
        sol: currentState.missionSol,
        hour: currentState.missionHour,
        oxygenKg: currentState.oxygenKg,
        waterLiters: currentState.waterLiters,
        batteryKwh: currentState.batteryStorageKwh,
        foodDays: currentState.foodRationsDays,
        netPowerKw: Number((currentState.powerKwGenerated - currentState.powerKwConsumed).toFixed(2))
      });

      // Check achievement triggers
      if (currentState.waterRecyclingEfficiencyPercent >= 95) {
        unlockAchievement('water-champion');
      }
      if (currentState.batteryStorageKwh > 50 && currentState.powerKwGenerated > 10) {
        unlockAchievement('power-expert');
      }
      if (currentState.foodRationsDays > 22) {
        unlockAchievement('greenhouse-master');
      }

      // Check scheduled emergency trigger
      if (
        !hasTriggeredScheduledEmergency &&
        activeScenario.scheduledEmergency &&
        currentState.totalElapsedHours >= activeScenario.scheduledEmergency.triggerHour
      ) {
        setIsPlaying(false);
        setActiveEmergency(activeScenario.scheduledEmergency.emergency);
        setHasTriggeredScheduledEmergency(true);
        sound.playAlert();
        scheduledEmergTriggered = true;
        break;
      }

      // Check mission conclusion
      if (result.isMissionOver) {
        setIsPlaying(false);
        setIsMissionVictory(result.victory);
        setMissionFailureReason(result.failureReason);
        setShowDebrief(true);

        if (result.victory) {
          sound.playSuccess();
          setLifetimeStats(prev => ({
            ...prev,
            missionsCompleted: prev.missionsCompleted + 1
          }));
          if (activeScenario.id === 'mission-2-solar-storm') {
            unlockAchievement('solar-storm-hero');
          }
          if (activeScenario.id === 'mission-5-sustainable-base') {
            unlockAchievement('closed-loop-artemis');
          }
        } else {
          sound.playAlert();
        }
        break;
      }
    }

    setResourceState(currentState);
    setTelemetryHistory(prev => [...prev.slice(-Math.max(0, 48 - newHistoryPoints.length)), ...newHistoryPoints]);
    setLifetimeStats(prev => ({
      ...prev,
      totalSolsCommanded: Math.max(prev.totalSolsCommanded, currentState.missionSol),
      highestRecyclingRate: Math.max(prev.highestRecyclingRate, currentState.waterRecyclingEfficiencyPercent)
    }));

    if (!scheduledEmergTriggered) {
      sound.playPing();
    }
  };

  // Keep stable refs to advance functions for keyboard and timer effects
  const advanceSolRef = useRef(advanceSol);
  advanceSolRef.current = advanceSol;

  const advanceHourRef = useRef(advanceHour);
  advanceHourRef.current = advanceHour;

  // Accessible desktop simulation keyboard shortcuts
  // SPACE: Pause / Resume simulation
  // S: Advance simulation by one Sol (reuses existing advanceSol)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Guard: Shortcuts only operate when the main mission simulation is active
      if (currentScreen !== 'mission_control') return;

      // 2. Guard: Block shortcuts if mission is completed or any modal dialog is currently open
      if (showDebrief || activeEmergency || selectedHelpResource || showConfirmNewMissionModal) {
        return;
      }

      // 3. Guard: Prevent triggering while typing in input fields, textareas, search boxes, or editable elements
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
         target.tagName === 'TEXTAREA' ||
         target.tagName === 'SELECT' ||
         target.isContentEditable ||
         target.getAttribute('role') === 'textbox')
      ) {
        return;
      }

      // 4. Guard: Prevent interference when a button or link is focused and user presses Space
      if (target && (target.tagName === 'BUTTON' || target.tagName === 'A')) {
        if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
          return;
        }
      }

      // 5. Guard: Do not intercept browser-level combinations like Ctrl+S, Cmd+S, Alt+S
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      // SHORTCUT 1: SPACEBAR — Pause or resume the active mission
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault(); // Prevent accidental page scrolling
        sound.playClick();
        setIsPlaying(prev => !prev);
        return;
      }

      // SHORTCUT 2: S — Advance simulation by one Sol (using advanceSol)
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        advanceSolRef.current();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    currentScreen,
    showDebrief,
    activeEmergency,
    selectedHelpResource,
    showConfirmNewMissionModal
  ]);

  // Timer interval for real-time simulation play
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying && !activeEmergency && !showDebrief) {
      timer = setInterval(() => {
        advanceHourRef.current();
      }, 1000); // 1 real second = 1 simulation hour
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, activeEmergency, showDebrief]);

  // Handle emergency decision option resolution
  const handleResolveEmergency = (optionId: string) => {
    if (!activeEmergency) return;
    const selectedOption = activeEmergency.options.find(o => o.id === optionId);
    if (selectedOption) {
      const outcome = selectedOption.applyChanges(resourceState, settings);
      setResourceState(prev => ({ ...prev, ...outcome.stateChanges }));
      if (outcome.settingsChanges) {
        setSettings(prev => ({ ...prev, ...outcome.settingsChanges }));
      }
      setLifetimeStats(prev => ({
        ...prev,
        emergenciesResolved: prev.emergenciesResolved + 1
      }));
      sound.playSuccess();
    }
    setActiveEmergency(null);
  };

  const handleUpdateSetting = <K extends keyof EngineeringSettings>(
    key: K,
    value: EngineeringSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Simulate an emergency response drill to test alarm procedures & tactile screen-shake
  const handleTriggerDrill = () => {
    setIsPlaying(false);
    const emergencyToTrigger = activeScenario.scheduledEmergency?.emergency || SOLAR_STORM_EMERGENCY;
    setActiveEmergency(emergencyToTrigger);
    sound.playAlert();
  };

  return (
    <div
      className={`min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 transition-transform ${
        isScreenShaking ? 'animate-screen-shake will-change-transform' : ''
      }`}
    >
      {/* Subtle Emergency Perimeter Glow/Vignette during Screen Shake */}
      {isScreenShaking && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-50 border-4 sm:border-[6px] border-amber-500/50 shadow-[inset_0_0_80px_rgba(245,158,11,0.25)] animate-emergency-vignette"
        />
      )}

      {/* Top Bar Navigation */}
      <Navigation
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(sound.toggleMute())}
        activeMissionTitle={activeScenario.title}
        onRestartMission={restartMission}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {currentScreen === 'welcome' && (
          <WelcomeScreen
            onStartMission={handleStartMissionRequest}
            onResumeMission={handleResumeMission}
            savedMissionSummary={savedMissionSummary}
            onOpenAcademy={() => setCurrentScreen('academy')}
            onOpenAchievements={() => setCurrentScreen('achievements')}
            onOpenScenarios={() => setCurrentScreen('scenarios')}
            onOpenGameCentre={() => setCurrentScreen('game_centre')}
          />
        )}

        {currentScreen === 'mission_control' && (
          <div className="space-y-6">
            {/* Mission Scenario Kicker */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-white uppercase tracking-wider">{activeScenario.title}</span>
                <span className="text-slate-600">·</span>
                <span className="text-cyan-400 font-mono">{activeScenario.difficulty}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">{activeScenario.subtitle}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400 hidden sm:inline">
                  Primary Goal: <span className="text-slate-200">{activeScenario.primaryObjective}</span>
                </span>
                <button
                  onClick={handleTriggerDrill}
                  title="Run an emergency drill to test base telemetry and alarm response"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-colors whitespace-nowrap shadow-xs"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>Alarm Drill</span>
                </button>
              </div>
            </div>

            {/* Time Controls and Core Telemetry Cards */}
            <ResourceTelemetryCards
              state={resourceState}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              onStepHour={advanceHour}
              onStepSol={advanceSol}
              targetDurationHours={targetDurationHours}
              onSelectHelpResource={(resId) => setSelectedHelpResource(resId)}
              isHelpOverlayActive={isHelpOverlayActive}
              onToggleHelpOverlay={() => setIsHelpOverlayActive(prev => !prev)}
              telemetryHistory={telemetryHistory}
            />

            {/* Two-Column Workspace: Habitat Schematic (Left) & Flight Director Advisor (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-8">
                <LunarHabitatDiagram
                  state={resourceState}
                  settings={settings}
                  onNavigateToEngineering={() => setCurrentScreen('engineering')}
                />
              </div>

              <div className="lg:col-span-4 min-h-[420px]">
                <MissionAdvisorPanel
                  state={resourceState}
                  settings={settings}
                />
              </div>
            </div>
          </div>
        )}

        {currentScreen === 'engineering' && (
          <EngineeringLab
            settings={settings}
            state={resourceState}
            onUpdateSetting={handleUpdateSetting}
            onNavigateToControl={() => setCurrentScreen('mission_control')}
          />
        )}

        {currentScreen === 'academy' && (
          <JuniorAstronautAcademy />
        )}

        {currentScreen === 'game_centre' && (
          <GameCentreHub onBackToSim={() => setCurrentScreen('mission_control')} />
        )}

        {currentScreen === 'scenarios' && (
          <MissionSelectScreen
            onSelectMission={handleSelectScenarioRequest}
            activeMissionId={activeScenario.id}
          />
        )}

        {currentScreen === 'achievements' && (
          <AchievementsView
            achievements={achievements}
            lifetimeStats={lifetimeStats}
            onNavigateToMissions={() => setCurrentScreen('scenarios')}
          />
        )}

        {currentScreen === 'sources' && (
          <SourcesAndDisclaimer />
        )}
      </main>

      {/* Confirmation Modal Before Overwriting In-Progress Saved Mission */}
      {showConfirmNewMissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-[#0B132B] border border-amber-500/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl shadow-amber-950/40 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Active Mission in Progress</h3>
                <p className="text-xs text-amber-300 font-mono">Unsaved progress will be replaced</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You have an active mission session at <strong>Sol {resourceState.missionSol} ({String(resourceState.missionHour).padStart(2, '0')}:00)</strong> in <em>"{activeScenario.title}"</em>.
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Starting a new simulation will overwrite this saved flight record. Would you like to keep and resume your current mission instead, or start fresh?
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  sound.playClick();
                  setShowConfirmNewMissionModal(false);
                  setPendingNewScenario(null);
                  handleResumeMission();
                }}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-cyan-950"
              >
                Keep & Resume Mission
              </button>
              <button
                onClick={confirmReplaceMission}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded-lg transition-colors whitespace-nowrap"
              >
                Replace & Start New
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Event Modal */}
      {activeEmergency && (
        <EmergencyModal
          emergency={activeEmergency}
          state={resourceState}
          settings={settings}
          onResolveOption={handleResolveEmergency}
        />
      )}

      {/* Mission Debrief Modal */}
      {showDebrief && (
        <MissionDebriefModal
          scenario={activeScenario}
          finalState={resourceState}
          victory={isMissionVictory}
          failureReason={missionFailureReason}
          onRestart={restartMission}
          onNextMission={() => {
            setShowDebrief(false);
            setCurrentScreen('scenarios');
          }}
          onViewAchievements={() => {
            setShowDebrief(false);
            setCurrentScreen('achievements');
          }}
        />
      )}

      {/* Contextual Resource Telemetry Help Modal */}
      {selectedHelpResource && (
        <ResourceHelpModal
          resourceId={selectedHelpResource}
          onClose={() => setSelectedHelpResource(null)}
          state={resourceState}
          settings={settings}
          telemetryHistory={telemetryHistory}
          onNavigateToEngineering={() => {
            setSelectedHelpResource(null);
            setCurrentScreen('engineering');
          }}
        />
      )}

      {/* Quiet, Clean Footer */}
      <footer className="border-t border-slate-900 bg-[#05070E] py-6 px-4 sm:px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">LUNOPS</span>
            <span>·</span>
            <span>Lunar Operations Simulator</span>
            <span>·</span>
            <span className="text-slate-500">Every Decision Shapes the Mission.</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => {
                sound.playClick();
                setCurrentScreen('sources');
              }}
              className="hover:text-cyan-300 transition-colors"
            >
              NASA References & Disclaimer
            </button>
            <span className="text-slate-700">·</span>
            <span>NASA Space Apps Challenge 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
