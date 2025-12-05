import React, { useState, useEffect } from "react";
import { Lightbulb, Users, AlertTriangle, GitBranch, Target, CheckCircle2, ArrowRight, ArrowLeft, RotateCcw, Sparkles, Eye, ArrowUpDown } from "lucide-react";
import FeedbackButton from "./FeedbackButton";
import FeedbackPanel from "./FeedbackPanel";

export default function WorthsmithApp() {
  const [step, setStep] = useState(1);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [expressMode, setExpressMode] = useState(() => {
    try {
      const saved = localStorage.getItem("worthsmith-express-mode");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [scoringMethod, setScoringMethod] = useState(() => {
    try {
      const saved = localStorage.getItem("worthsmith-scoring-method");
      return saved || "RICE"; // Default to RICE for existing users
    } catch {
      return "RICE";
    }
  });
  const [savedStories, setSavedStories] = useState(() => {
    try {
      const raw = localStorage.getItem("worthsmith-stories");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [draft, setDraft] = useState(() => {
    try {
      const raw = localStorage.getItem("worthsmith-draft");
      return raw ? JSON.parse(raw) : getInitialDraft();
    } catch {
      return getInitialDraft();
    }
  });

  // AI Feedback state
  const [feedback, setFeedback] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Story management state
  const [currentStoryId, setCurrentStoryId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });

  useEffect(() => {
    localStorage.setItem("worthsmith-draft", JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    localStorage.setItem("worthsmith-stories", JSON.stringify(savedStories));
  }, [savedStories]);

  useEffect(() => {
    localStorage.setItem("worthsmith-express-mode", JSON.stringify(expressMode));
  }, [expressMode]);

  useEffect(() => {
    localStorage.setItem("worthsmith-scoring-method", scoringMethod);
  }, [scoringMethod]);

  // Track unsaved changes
  useEffect(() => {
    if (!currentStoryId) {
      setHasUnsavedChanges(false);
      return;
    }

    const loadedStory = savedStories.find(s => s.id === currentStoryId);
    if (!loadedStory) return;

    const isDifferent =
      draft.outcome !== loadedStory.outcome ||
      draft.beneficiary !== loadedStory.beneficiary ||
      draft.nonDelivery !== loadedStory.nonDelivery ||
      draft.alternatives !== loadedStory.alternatives ||
      draft.reach !== loadedStory.reach ||
      draft.impact !== loadedStory.impact ||
      draft.effort !== loadedStory.effort ||
      draft.confidence !== loadedStory.confidence ||
      draft.valueScore !== loadedStory.valueScore ||
      draft.urgencyScore !== loadedStory.urgencyScore ||
      draft.sizeScore !== loadedStory.sizeScore;

    setHasUnsavedChanges(isDifferent);
  }, [draft, currentStoryId, savedStories]);

  // Helper function for toast notifications
  function showToast(message, duration = 3000) {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), duration);
  }

  // Helper function for relative time formatting
  function formatRelativeTime(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return then.toLocaleDateString();
  }

  // Update existing story
  function updateStory() {
    if (!currentStoryId) return;

    setSavedStories(prev => prev.map(s =>
      s.id === currentStoryId
        ? {
            ...s,
            ...draft,
            lastModified: new Date().toISOString()
          }
        : s
    ));
    setHasUnsavedChanges(false);
    showToast("✓ Story updated!");
  }

  // Save as new story
  function saveAsNew() {
    const title = prompt(currentStoryId ? "Title for new copy:" : "Give this story a title:");
    if (!title) return;

    const story = {
      id: Date.now(),
      title,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      ...draft
    };

    setSavedStories(prev => [story, ...prev]);
    setCurrentStoryId(story.id);
    setHasUnsavedChanges(false);
    showToast(currentStoryId ? "✓ Saved as new story!" : "✓ Story saved!");
  }

  // Load existing story
  function loadStory(story) {
    if (hasUnsavedChanges) {
      if (!confirm(`You have unsaved changes. Load "${story.title}" anyway?`)) {
        return;
      }
    }

    const { id, title, created, lastModified, timestamp, ...storyData } = story;
    setDraft(storyData);
    setCurrentStoryId(id);
    setStep(1);
    setHasUnsavedChanges(false);
    showToast(`Loaded "${title}"`);
  }

  // Start new story
  function startNewStory() {
    if (hasUnsavedChanges) {
      if (!confirm("You have unsaved changes. Start new story anyway?")) {
        return;
      }
    }

    setDraft(getInitialDraft());
    setCurrentStoryId(null);
    setStep(1);
    setHasUnsavedChanges(false);
    showToast("Started new story");
  }

  // Delete story
  function deleteStory(storyId, storyTitle) {
    if (confirm(`Delete "${storyTitle}"? This cannot be undone.`)) {
      setSavedStories(prev => prev.filter(s => s.id !== storyId));
      if (currentStoryId === storyId) {
        setCurrentStoryId(null);
        setHasUnsavedChanges(false);
      }
      showToast("Story deleted");
    }
  }

  function updateDraft(updates) {
    setDraft(prev => ({ ...prev, ...updates }));
  }

  function resetDraft() {
    if (confirm("Reset all fields? This cannot be undone.")) {
      setDraft(getInitialDraft());
      setCurrentStoryId(null);
      setStep(1);
      setHasUnsavedChanges(false);
    }
  }

  function loadExample() {
    setDraft({
      outcome: "Reduce checkout abandonment for first-time customers by providing clear, upfront shipping cost information before payment details are entered.",
      beneficiary: "First-time customers in checkout flow; Customer Service team handling shipping queries; Marketing team measuring conversion rates",
      nonDelivery: "We continue losing approximately 15% of new users at checkout (estimated £45k/month in lost revenue). CS team continues handling 200+ weekly tickets about unexpected shipping costs. Brand perception suffers due to 'hidden fees' complaints on review sites.",
      alternatives: "Quick copy change to existing checkout page; Add expandable FAQ section; Run 2-week A/B test with simplified flow; Add shipping calculator widget; Do nothing and measure baseline for one sprint; Partner with shipping provider for flat-rate option",
      reach: 8,
      impact: 8,
      effort: 3,
      confidence: 7
    });
    setCurrentStoryId(null);
    setHasUnsavedChanges(false);
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyPress(e) {
      // Cmd+S / Ctrl+S = Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentStoryId && hasUnsavedChanges) {
          updateStory();
        } else if (!currentStoryId) {
          saveAsNew();
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentStoryId, hasUnsavedChanges]);

  // AI Feedback functions
  async function handleGetFeedback() {
    setFeedbackLoading(true);
    setFeedbackError(null);
    setShowFeedback(false);

    try {
      // Map step numbers to step names
      const stepNames = {
        1: 'outcome',
        2: 'beneficiary',
        3: 'current-method',
        4: 'alternatives',
        5: 'scoring'
      };
      const currentStepName = stepNames[step];

      // Build form data
      const formData = {
        outcome: draft.outcome,
        beneficiary: draft.beneficiary,
        currentMethod: draft.nonDelivery, // Note: nonDelivery is the current method field
        alternatives: draft.alternatives,
        scores: {
          reach: draft.reach,
          impact: draft.impact,
          effort: draft.effort,
          confidence: draft.confidence
        }
      };

      console.log('Requesting feedback for step:', currentStepName);

      // Call the API
      const response = await fetch('/api/get-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          step: currentStepName,
          formData: formData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get feedback');
      }

      const data = await response.json();
      console.log('Feedback received:', data);

      setFeedback(data.feedback);
      setShowFeedback(true);

    } catch (error) {
      console.error('Feedback error:', error);
      setFeedbackError(error.message || 'Could not get feedback. Please try again.');
      setShowFeedback(true);
    } finally {
      setFeedbackLoading(false);
    }
  }

  function isFeedbackAvailable() {
    switch (step) {
      case 1: // Outcome
        return draft.outcome && draft.outcome.trim().length > 10;
      case 2: // Beneficiary
        return draft.beneficiary && draft.beneficiary.trim().length > 5;
      case 3: // Current Method (nonDelivery)
        return draft.nonDelivery && draft.nonDelivery.trim().length > 10;
      case 4: // Alternatives
        return draft.alternatives && draft.alternatives.trim().length > 10;
      case 5: // Scoring
        return true; // Always available on scoring step
      default:
        return false;
    }
  }

  function nextStep() {
    if (expressMode) {
      // Express mode: 1 -> 4 -> 5 -> 6
      if (step === 1) setStep(4);
      else if (step === 4) setStep(5);
      else setStep(s => Math.min(6, s + 1));
    } else {
      setStep(s => Math.min(6, s + 1));
    }
  }

  function prevStep() {
    if (expressMode) {
      // Express mode: 6 -> 5 -> 4 -> 1
      if (step === 4) setStep(1);
      else if (step === 5) setStep(4);
      else setStep(s => Math.max(1, s - 1));
    } else {
      setStep(s => Math.max(1, s - 1));
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 transition-all hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/images/worthsmith-logo.png"
                alt="Worthsmith"
                className="w-14 h-14 object-contain drop-shadow-md"
              />
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Worthsmith</h1>
                {currentStoryId ? (
                  <p className="text-sm text-slate-500">
                    Editing: {savedStories.find(s => s.id === currentStoryId)?.title}
                    {hasUnsavedChanges && (
                      <span className="ml-2 text-orange-600 font-medium">● Unsaved changes</span>
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">Value Articulation Assistant</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border-2 border-indigo-200 hover:border-indigo-300"
              >
                📊 {showComparison ? 'Back to Editor' : 'Compare Stories'}
              </button>
              <button
                onClick={() => setExpressMode(!expressMode)}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                  expressMode
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                    : 'text-slate-600 border-2 border-slate-200 hover:border-slate-300'
                }`}
                title={expressMode ? 'Switch to Full Mode (5 steps)' : 'Switch to Express Mode (3 steps)'}
              >
                ⚡ {expressMode ? 'Express' : 'Full'}
              </button>
              <button
                onClick={() => setScoringMethod(scoringMethod === 'RICE' ? 'BA' : 'RICE')}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors border-2 ${
                  scoringMethod === 'BA'
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                    : 'bg-sky-100 text-sky-700 border-sky-300'
                }`}
                title={`Switch to ${scoringMethod === 'RICE' ? 'BA' : 'RICE'} scoring`}
              >
                🎯 <span className="hidden sm:inline">{scoringMethod}</span>
              </button>

              {/* Story management buttons */}
              {currentStoryId ? (
                <>
                  <button
                    onClick={updateStory}
                    disabled={!hasUnsavedChanges}
                    className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                      hasUnsavedChanges
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                    title={hasUnsavedChanges ? 'Save changes (Cmd+S)' : 'No changes to save'}
                  >
                    💾 Update
                  </button>
                  <button
                    onClick={saveAsNew}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-sky-600 hover:bg-sky-50 rounded-lg transition-colors border-2 border-sky-200 hover:border-sky-300"
                  >
                    ➕ <span className="hidden sm:inline">Save As Copy</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={saveAsNew}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors shadow-md"
                  title="Save this story (Cmd+S)"
                >
                  💾 Save Story
                </button>
              )}

              <button
                onClick={startNewStory}
                className="flex items-center gap-2 px-4 py-2 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors border-2 border-violet-200 hover:border-violet-300"
              >
                ✨ <span className="hidden sm:inline">New</span>
              </button>
              <button
                onClick={loadExample}
                className="flex items-center gap-2 px-4 py-2 text-sm text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Example</span>
              </button>
              <button
                onClick={resetDraft}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {!showComparison && step < 6 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 transition-all hover:shadow-xl">
            <div className="flex items-center justify-between mb-2">
              {(expressMode ? EXPRESS_STEPS : STEPS).map((s, i) => {
                const stepNum = expressMode ? EXPRESS_STEP_NUMBERS[i] : i + 1;
                const isActive = step === stepNum;
                const isCompleted = step > stepNum;

                return (
                  <React.Fragment key={i}>
                    <StepIndicator
                      number={stepNum}
                      label={s.short}
                      active={isActive}
                      completed={isCompleted}
                      icon={s.icon}
                    />
                    {i < (expressMode ? EXPRESS_STEPS : STEPS).length - 1 && (
                      <div className={`flex-1 h-1 mx-2 rounded transition-all duration-500 ${isCompleted ? 'bg-sky-500' : 'bg-slate-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            <div className="text-center mt-4">
              <div className="text-xs text-slate-500">
                {expressMode ? (
                  <>Express Mode: Step {step === 1 ? '1' : step === 4 ? '2' : step === 5 ? '3' : step} of 3 • Quick assessment</>
                ) : (
                  <>Step {step} of 5 • {Math.round((step / 5) * 100)}% complete</>
                )}
              </div>
            </div>
          </div>
        )}

        {showComparison ? (
          <ComparisonView stories={savedStories} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className={`${step < 6 && showSidebar ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="bg-white rounded-2xl shadow-lg p-8 transition-all hover:shadow-xl">
              <div className="transition-opacity duration-300">
                {step === 1 && <OutcomeStep value={draft.outcome} onChange={v => updateDraft({ outcome: v })} expressMode={expressMode} />}
                {step === 2 && !expressMode && <BeneficiaryStep value={draft.beneficiary} onChange={v => updateDraft({ beneficiary: v })} />}
                {step === 3 && !expressMode && <ImpactStep value={draft.nonDelivery} onChange={v => updateDraft({ nonDelivery: v })} />}
                {step === 4 && <AlternativesStep value={draft.alternatives} onChange={v => updateDraft({ alternatives: v })} expressMode={expressMode} outcome={draft.outcome} />}
                {step === 5 && <ScoringStep draft={draft} onChange={updateDraft} scoringMethod={scoringMethod} />}
                {step === 6 && <OutputStep draft={draft} onReset={resetDraft} expressMode={expressMode} scoringMethod={scoringMethod} />}
              </div>

              {/* Navigation */}
              {step < 6 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t">
                  <div className="flex items-center gap-3">
                    <FeedbackButton
                      onClick={handleGetFeedback}
                      loading={feedbackLoading}
                      disabled={!isFeedbackAvailable()}
                      step={step}
                    />
                    <button
                      onClick={prevStep}
                      disabled={step === 1}
                      className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:gap-3"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                  </div>
                  <button
                    onClick={nextStep}
                    className="flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all hover:gap-3"
                  >
                    {step === 5 ? 'Generate Statement' : 'Next'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          {step < 6 && showSidebar && (
            <div className="lg:col-span-1 space-y-6">
              <SavedStoriesList stories={savedStories} onLoad={loadStory} onDelete={deleteStory} />
              <SummarySidebar draft={draft} currentStep={step} />
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <ValueMatrix reach={draft.reach} impact={draft.impact} />
                </div>
                <div className="col-span-1">
                  <ConfidenceZone confidence={draft.confidence} />
                </div>
              </div>
              <DecisionMatrix reach={draft.reach} impact={draft.impact} effort={draft.effort} confidence={draft.confidence} />
            </div>
          )}
        </div>
        )}
      </div>

      {/* AI Feedback Panel */}
      {showFeedback && (
        <FeedbackPanel
          feedback={feedbackError ? null : feedback}
          error={feedbackError}
          onClose={() => setShowFeedback(false)}
        />
      )}

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in-right z-50">
          {toast.message}
        </div>
      )}
    </div>
  );
}

// Constants
const STEPS = [
  { short: "Outcome", icon: Lightbulb },
  { short: "Who", icon: Users },
  { short: "Impact", icon: AlertTriangle },
  { short: "Alternatives", icon: GitBranch },
  { short: "Score", icon: Target }
];

const EXPRESS_STEPS = [
  { short: "Outcome", icon: Lightbulb },
  { short: "Alternatives", icon: GitBranch },
  { short: "Score", icon: Target }
];

const EXPRESS_STEP_NUMBERS = [1, 4, 5]; // Map express steps to actual step numbers

function getInitialDraft() {
  return {
    outcome: "",
    beneficiary: "",
    nonDelivery: "",
    alternatives: "",
    // RICE fields
    reach: 6,
    impact: 6,
    effort: 6,
    confidence: 6,
    // BA fields
    valueScore: 3,
    urgencyScore: 1,
    sizeScore: 3
  };
}

// Components
function SavedStoriesList({ stories, onLoad, onDelete }) {
  if (stories.length === 0) return null;

  // Helper function for relative time
  function formatRelativeTime(timestamp) {
    if (!timestamp) return '';
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return then.toLocaleDateString();
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl">
      <h3 className="font-semibold text-slate-800 mb-4">Saved Stories ({stories.length})</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {stories.map(story => {
          const hasBeenModified = story.lastModified && story.created && story.lastModified !== story.created;
          const displayTime = story.lastModified || story.timestamp || story.created;

          return (
            <div
              key={story.id}
              className="group relative p-3 bg-slate-50 hover:bg-sky-50 rounded-lg border border-slate-200 hover:border-sky-300 transition-all"
            >
              <button
                onClick={() => onLoad(story)}
                className="w-full text-left"
              >
                <div className="font-medium text-sm text-slate-800 pr-8">{story.title}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {hasBeenModified ? (
                    <>Modified {formatRelativeTime(story.lastModified)}</>
                  ) : (
                    <>Created {formatRelativeTime(displayTime)}</>
                  )}
                  <span className="mx-2">•</span>
                  Click to load
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(story.id, story.title);
                }}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 rounded p-1"
                title="Delete story"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepIndicator({ number, label, active, completed, icon: Icon }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
        active ? 'bg-sky-600 text-white shadow-lg scale-110' :
        completed ? 'bg-emerald-500 text-white shadow-md' :
        'bg-slate-200 text-slate-400'
      }`}>
        {completed ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
      </div>
      <span className={`text-xs font-medium transition-colors hidden sm:block ${active ? 'text-sky-600' : completed ? 'text-emerald-600' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  );
}

function SummarySidebar({ draft, currentStep }) {
  const completeness = calculateCompleteness(draft);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-sky-600" />
        <h3 className="font-semibold text-slate-800">Progress Overview</h3>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600">Completion</span>
            <span className="font-semibold text-sky-600">{completeness}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t">
          <SummaryItem
            label="Outcome"
            value={draft.outcome}
            completed={currentStep > 1}
            active={currentStep === 1}
          />
          <SummaryItem
            label="Beneficiary"
            value={draft.beneficiary}
            completed={currentStep > 2}
            active={currentStep === 2}
          />
          <SummaryItem
            label="Impact"
            value={draft.nonDelivery}
            completed={currentStep > 3}
            active={currentStep === 3}
          />
          <SummaryItem
            label="Alternatives"
            value={draft.alternatives}
            completed={currentStep > 4}
            active={currentStep === 4}
          />
          <SummaryItem
            label="Scoring"
            value={`R:${draft.reach} I:${draft.impact} E:${draft.effort} C:${draft.confidence}`}
            completed={currentStep > 5}
            active={currentStep === 5}
            isScore
          />
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value, completed, active, isScore }) {
  const hasContent = isScore || (value && value.length > 0);

  return (
    <div className={`p-3 rounded-lg transition-all ${
      active ? 'bg-sky-50 border-2 border-sky-200' :
      completed ? 'bg-emerald-50 border border-emerald-200' :
      'bg-slate-50 border border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-medium ${
          active ? 'text-sky-700' :
          completed ? 'text-emerald-700' :
          'text-slate-500'
        }`}>
          {label}
        </span>
        {completed && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
      </div>
      {hasContent && (
        <p className="text-xs text-slate-600 line-clamp-2">
          {isScore ? `Reach: ${value.split(' ')[0].split(':')[1]} • Impact: ${value.split(' ')[1].split(':')[1]} • Effort: ${value.split(' ')[2].split(':')[1]} • Confidence: ${value.split(' ')[3].split(':')[1]}` : value}
        </p>
      )}
      {!hasContent && !isScore && (
        <p className="text-xs text-slate-400 italic">Not yet filled</p>
      )}
    </div>
  );
}

function ValueMatrix({ reach, impact }) {
  // This shows Reach vs Impact to visualize VALUE
  const dotX = (reach / 10) * 100;
  const dotY = 100 - (impact / 10) * 100;
  const value = reach * impact;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl">
      <h3 className="font-semibold text-slate-800 mb-2">Value (Reach × Impact)</h3>
      <p className="text-xs text-slate-500 mb-4">Value score: {value} {value >= 49 ? '(High)' : value >= 16 ? '(Medium)' : '(Low)'}</p>

      <div className="relative aspect-square bg-slate-50 rounded-lg overflow-hidden border-2 border-slate-200">
        {/* Quadrants - color coded by value tier */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {/* Top-left: Low Reach, High Impact = Medium Value */}
          <div className="bg-amber-50 border-r border-b border-slate-300 flex items-center justify-center">
            <span className="text-xs text-amber-700 font-medium">Med Value</span>
          </div>
          {/* Top-right: High Reach, High Impact = High Value */}
          <div className="bg-emerald-50 border-b border-slate-300 flex items-center justify-center">
            <span className="text-xs text-emerald-700 font-medium">High Value</span>
          </div>
          {/* Bottom-left: Low Reach, Low Impact = Low Value */}
          <div className="bg-slate-100 border-r border-slate-300 flex items-center justify-center">
            <span className="text-xs text-slate-500 font-medium">Low Value</span>
          </div>
          {/* Bottom-right: High Reach, Low Impact = Medium Value */}
          <div className="bg-amber-50 flex items-center justify-center">
            <span className="text-xs text-amber-700 font-medium">Med Value</span>
          </div>
        </div>

        {/* Axis Labels */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-500 font-medium">
          Reach →
        </div>
        <div className="absolute -left-10 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-slate-500 font-medium whitespace-nowrap">
          Impact →
        </div>

        {/* Dot */}
        <div
          className="absolute w-4 h-4 bg-sky-600 rounded-full border-2 border-white shadow-lg transition-all duration-300 -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ left: `${dotX}%`, top: `${dotY}%` }}
        >
          <div className="absolute inset-0 bg-sky-600 rounded-full animate-ping opacity-75" />
        </div>
      </div>
    </div>
  );
}

function ConfidenceZone({ confidence }) {
  const getZone = (conf) => {
    if (conf >= 7) return { label: "High", color: "emerald" };
    if (conf >= 4) return { label: "Medium", color: "amber" };
    return { label: "Low", color: "red" };
  };

  const zone = getZone(confidence);
  const barHeight = (confidence / 10) * 100;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl h-full flex flex-col">
      <h3 className="font-semibold text-slate-800 mb-4 text-center">Confidence</h3>

      <div className="flex flex-col items-center justify-center flex-1">
        <div className="relative w-20 h-48 bg-slate-100 rounded-lg overflow-hidden">
          {/* Zones background (bottom to top) */}
          <div className="absolute inset-0 flex flex-col-reverse">
            <div className="h-[30%] bg-red-50 border-t border-slate-300" />
            <div className="h-[30%] bg-amber-50 border-t border-slate-300" />
            <div className="h-[40%] bg-emerald-50" />
          </div>

          {/* Confidence bar (fills from bottom) */}
          <div
            className={`absolute bottom-0 left-0 w-full transition-all duration-300 flex items-center justify-center ${
              zone.color === 'emerald' ? 'bg-emerald-500' :
              zone.color === 'amber' ? 'bg-amber-500' :
              'bg-red-500'
            }`}
            style={{ height: `${barHeight}%` }}
          >
            {/* Score in colored block */}
            {barHeight > 15 && (
              <span className="text-xl font-bold text-white">{confidence}</span>
            )}
          </div>

          {/* Score above block if too small */}
          {barHeight <= 15 && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2">
              <span className="text-xl font-bold text-slate-700">{confidence}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DecisionMatrix({ reach, impact, effort, confidence }) {
  const decision = getDecisionRecommendation(reach, impact, effort, confidence);
  const value = reach * impact;

  const getColorClass = (title) => {
    if (title === "DO NOW" || title === "QUICK WIN") return "emerald";
    if (title === "DO NEXT" || title === "STRATEGIC BET" || title === "SPIKE FIRST") return "blue";
    if (title === "VALIDATE FIRST" || title === "VALIDATE ASSUMPTIONS" || title === "CONSIDER ALTERNATIVES" || title === "EVALUATE FURTHER") return "amber";
    if (title === "SAY NO") return "red";
    return "slate";
  };

  const color = getColorClass(decision.title);

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl border-2 ${
      color === 'emerald' ? 'border-emerald-200' :
      color === 'blue' ? 'border-blue-200' :
      color === 'amber' ? 'border-amber-200' :
      color === 'red' ? 'border-red-200' :
      'border-slate-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className="text-3xl">{decision.icon}</div>
        <div className="flex-1">
          <h3 className={`font-bold text-lg ${
            color === 'emerald' ? 'text-emerald-700' :
            color === 'blue' ? 'text-blue-700' :
            color === 'amber' ? 'text-amber-700' :
            color === 'red' ? 'text-red-700' :
            'text-slate-700'
          }`}>
            {decision.title}
          </h3>
          <div className="text-xs text-slate-500 mt-1">
            Value: {value} (R:{reach} × I:{impact}) • Effort: {effort} • Confidence: {confidence}
          </div>
          <p className="text-sm text-slate-600 mt-2">{decision.desc}</p>
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            color === 'emerald' ? 'bg-emerald-50 text-emerald-800' :
            color === 'blue' ? 'bg-blue-50 text-blue-800' :
            color === 'amber' ? 'bg-amber-50 text-amber-800' :
            color === 'red' ? 'bg-red-50 text-red-800' :
            'bg-slate-50 text-slate-800'
          }`}>
            <strong>Next Action:</strong> {decision.action}
          </div>
        </div>
      </div>
    </div>
  );
}

function OutcomeStep({ value, onChange, expressMode }) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-6 h-6 text-sky-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800">What outcome are we pursuing?</h2>
          <p className="text-slate-600 mt-2">
            {expressMode
              ? "Quickly describe the problem or opportunity. What change do you want to see?"
              : "Describe the user problem or business need you're trying to address. Focus on the change you want to see, not the solution."
            }
          </p>
        </div>
      </div>

      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 text-sm text-slate-700">
        <strong>Tip:</strong> Start with "Reduce..." "Increase..." "Enable..." or "Improve..." Focus on the problem, not the feature.
      </div>

      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g., Reduce checkout abandonment for first-time users by providing clearer shipping cost information upfront..."
        className="w-full h-32 px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-sky-500 focus:outline-none resize-none transition-colors"
      />

      <div className="text-xs text-slate-500 text-right">
        {value.length} characters
      </div>
    </div>
  );
}

function BeneficiaryStep({ value, onChange }) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-start gap-3">
        <Users className="w-6 h-6 text-sky-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800">Who benefits from this?</h2>
          <p className="text-slate-600 mt-2">Identify the specific users, customers, or teams who will experience the value. Be specific about the persona or segment.</p>
        </div>
      </div>

      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 text-sm text-slate-700">
        <strong>Tip:</strong> Think about primary beneficiaries (end users) and secondary beneficiaries (support teams, partners, internal stakeholders).
      </div>

      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g., First-time customers in the checkout flow; CS team dealing with shipping queries"
        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-sky-500 focus:outline-none transition-colors"
      />
    </div>
  );
}

function ImpactStep({ value, onChange }) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800">What happens if we don't do this?</h2>
          <p className="text-slate-600 mt-2">Describe the consequences of inaction. What pain continues? What opportunity is missed?</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-slate-700">
        <strong>Tip:</strong> Quantify where possible. Consider both direct costs (lost revenue) and indirect costs (support burden, brand damage).
      </div>

      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g., We continue losing 15% of new users at checkout (approx £45k/month), and CS continues handling 200+ shipping-related tickets weekly..."
        className="w-full h-32 px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-sky-500 focus:outline-none resize-none transition-colors"
      />
    </div>
  );
}

function AlternativesStep({ value, onChange, expressMode, outcome }) {
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState(null);

  async function suggestAlternatives() {
    setIsLoadingAI(true);
    setAiError(null);

    try {
      console.log("Calling backend API...");

      const response = await fetch("/api/suggest-alternatives", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          outcome: outcome || "",
          existingAlternatives: value || ""
        })
      });

      console.log("Response status:", response.status);

      const responseText = await response.text();
      console.log("Response body:", responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText };
        }
        console.error("API error response:", errorData);
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = JSON.parse(responseText);
      console.log("API response received");

      const aiSuggestions = data.suggestions;

      // Append AI suggestions with clear separator
      const separator = value ? "\n\n---\n🤖 AI Suggestions:\n" : "🤖 AI Suggestions:\n";
      onChange(value + separator + aiSuggestions);

    } catch (error) {
      console.error("AI suggestion error:", error);
      setAiError(error.message || "Could not generate suggestions. Please try again.");
    } finally {
      setIsLoadingAI(false);
    }
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-start gap-3">
        <GitBranch className="w-6 h-6 text-sky-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800">What alternatives could we consider?</h2>
          <p className="text-slate-600 mt-2">
            {expressMode
              ? "Think fast: Is there a cheaper, simpler way? What if we did nothing?"
              : "Challenge the default solution. Is there a cheaper, faster, or simpler way? What if we did nothing?"
            }
          </p>
        </div>
      </div>

      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 text-sm">
        <strong>Consider:</strong>
        <ul className="mt-2 space-y-1 text-slate-700">
          <li>• <strong>Reduce:</strong> Can we solve this with less effort or scope?</li>
          <li>• <strong>Reuse:</strong> Do we have existing features we could leverage?</li>
          <li>• <strong>Reframe:</strong> Is there a different problem statement that's easier to solve?</li>
          <li>• <strong>Remove:</strong> What if we improved something else instead?</li>
        </ul>
      </div>

      <div className="relative">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="e.g., Update checkout copy to clarify costs; Add FAQ section; Run A/B test with simplified flow; Do nothing and measure impact for 2 weeks..."
          className="w-full h-32 px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-sky-500 focus:outline-none resize-none transition-colors"
          disabled={isLoadingAI}
        />

        <div className="mt-3 flex items-start gap-3">
          <button
            onClick={suggestAlternatives}
            disabled={isLoadingAI}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingAI ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                AI Thinking...
              </>
            ) : (
              <>
                ✨ Suggest Alternatives
              </>
            )}
          </button>

          {aiError && (
            <div className="flex-1 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {aiError}
            </div>
          )}
        </div>

        <div className="mt-2 text-xs text-slate-500">
          💡 Tip: Type your own alternatives first, then use AI to generate more ideas. Use bullets: "• " or "- "
        </div>
      </div>
    </div>
  );
}

function ScoringStep({ draft, onChange, scoringMethod }) {
  if (scoringMethod === 'BA') {
    return <BAScoringStep draft={draft} onChange={onChange} />;
  } else {
    return <RICEScoringStep draft={draft} onChange={onChange} />;
  }
}

function RICEScoringStep({ draft, onChange }) {
  const decision = getDecisionRecommendation(draft.reach, draft.impact, draft.effort, draft.confidence);
  const riceScore = calculateRICE(draft.reach, draft.impact, draft.confidence, draft.effort);
  const value = draft.reach * draft.impact;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-start gap-3">
        <Target className="w-6 h-6 text-sky-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800">How would you score this? (RICE)</h2>
          <p className="text-slate-600 mt-2">Rate the reach, impact, effort, and confidence on a scale of 1-10.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <ScoreSlider
          label="Reach"
          value={draft.reach}
          onChange={v => onChange({ reach: v })}
          color="purple"
          description="How many people affected?"
        />
        <ScoreSlider
          label="Impact"
          value={draft.impact}
          onChange={v => onChange({ impact: v })}
          color="emerald"
          description="Expected value delivered"
        />
        <ScoreSlider
          label="Effort"
          value={draft.effort}
          onChange={v => onChange({ effort: v })}
          color="orange"
          description="Time & resources required"
        />
        <ScoreSlider
          label="Confidence"
          value={draft.confidence}
          onChange={v => onChange({ confidence: v })}
          color="blue"
          description="How certain are you?"
        />
      </div>

      <div className="bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200 rounded-xl p-6">
        <div className="grid md:grid-cols-2 gap-6 mb-4">
          <div>
            <h3 className="font-semibold text-slate-800">Value Score</h3>
            <p className="text-xs text-slate-500 mt-1">Reach × Impact</p>
            <div className="text-3xl font-bold text-sky-600 mt-2">
              {value}
            </div>
            <p className="text-sm text-slate-600 mt-1">
              {value >= 49 ? 'High Value' : value >= 16 ? 'Medium Value' : 'Low Value'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">RICE Score</h3>
            <p className="text-xs text-slate-500 mt-1">(R × I × C) / E (reference)</p>
            <div className="text-3xl font-bold text-slate-600 mt-2">
              {riceScore}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-300">
          <h4 className="font-semibold text-slate-800 mb-2">Recommendation</h4>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{decision.icon}</span>
            <div className="text-lg font-bold text-sky-600">
              {decision.title}
            </div>
          </div>
          <p className="text-sm text-slate-600">{decision.desc}</p>
        </div>
      </div>
    </div>
  );
}

function BAScoringStep({ draft, onChange }) {
  const netPriorityScore = calculateBA(draft.valueScore, draft.urgencyScore, draft.sizeScore);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-start gap-3">
        <Target className="w-6 h-6 text-emerald-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800">How would you score this? (BA Method)</h2>
          <p className="text-slate-600 mt-2">Select value, urgency, and size using t-shirt sizing.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Value Score */}
        <TShirtPicker
          label="Value Score"
          description="Commercial value + experience impact"
          value={draft.valueScore}
          onChange={v => onChange({ valueScore: v })}
          color="teal"
          options={[
            { value: 1, label: 'XS', description: 'Low impact or <€10k/month' },
            { value: 2, label: 'S', description: '€10k-€30k/month' },
            { value: 3, label: 'M', description: '€31k-€60k/month' },
            { value: 4, label: 'L', description: '€61k-€120k/month' },
            { value: 5, label: 'XL', description: '€121k-€250k/month' },
            { value: 6, label: 'XXL', description: '€250k+/month' }
          ]}
        />

        {/* Urgency Score */}
        <TShirtPicker
          label="Urgency Score"
          description="Time criticality"
          value={draft.urgencyScore}
          onChange={v => onChange({ urgencyScore: v })}
          color="red"
          options={[
            { value: 1, label: 'Normal', description: 'Needed as soon as we can have it' },
            { value: 2, label: 'High', description: 'Needed in increment for external need / key business outcome' },
            { value: 3, label: 'Very High', description: 'Needed very urgently must be in increment' }
          ]}
        />

        {/* Size Score */}
        <TShirtPicker
          label="Size"
          description="Full team capacity sprints (duration as % of team)"
          value={draft.sizeScore}
          onChange={v => onChange({ sizeScore: v })}
          color="blue"
          options={[
            { value: 1, label: 'XS', description: '0.2 - 1 Sprint' },
            { value: 2, label: 'S', description: '0.5 - 2 Sprints' },
            { value: 3, label: 'M', description: '1 - 3 Sprints' },
            { value: 4, label: 'L', description: '2 - 4 Sprints' },
            { value: 5, label: 'XL', description: '4 - 6 Sprints' },
            { value: 6, label: 'XXL', description: '6+ Sprints (too long...)' }
          ]}
        />
      </div>

      {/* Net Priority Score Display */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6">
        <div className="text-center">
          <h3 className="font-semibold text-slate-800 mb-1">Net Priority Score</h3>
          <p className="text-xs text-slate-500 mb-3">(Value × Urgency) / Size</p>
          <div className="text-5xl font-bold text-emerald-600 mb-2">
            {netPriorityScore.toFixed(2)}
          </div>
          <p className="text-sm text-slate-600">
            ({draft.valueScore} × {draft.urgencyScore}) / {draft.sizeScore}
          </p>
          <div className="mt-4 pt-4 border-t border-emerald-200">
            <p className="text-sm font-medium text-slate-700">
              {netPriorityScore >= 3 ? '🟢 High Priority' :
               netPriorityScore >= 1.5 ? '🟡 Medium Priority' :
               '🔴 Low Priority'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreSlider({ label, value, onChange, color, description }) {
  const colorClasses = {
    purple: 'text-purple-600',
    emerald: 'text-emerald-600',
    orange: 'text-orange-600',
    blue: 'text-blue-600'
  };

  const gradientColors = {
    purple: '#9333ea',
    emerald: '#10b981',
    orange: '#f97316',
    blue: '#3b82f6'
  };

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-semibold text-slate-800">{label}</div>
          <div className="text-xs text-slate-500">{description}</div>
        </div>
        <div className={`text-2xl font-bold transition-all ${colorClasses[color]}`}>
          {value}
        </div>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer transition-all"
        style={{
          background: `linear-gradient(to right, ${gradientColors[color]} 0%, ${gradientColors[color]} ${((value - 1) / 9) * 100}%, #e2e8f0 ${((value - 1) / 9) * 100}%, #e2e8f0 100%)`
        }}
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}

function TShirtPicker({ label, description, value, onChange, color, options }) {
  const colorClasses = {
    teal: {
      selected: 'bg-teal-600 text-white border-teal-600',
      unselected: 'bg-white text-slate-700 border-slate-300 hover:border-teal-400 hover:bg-teal-50'
    },
    red: {
      selected: 'bg-red-600 text-white border-red-600',
      unselected: 'bg-white text-slate-700 border-slate-300 hover:border-red-400 hover:bg-red-50'
    },
    blue: {
      selected: 'bg-blue-600 text-white border-blue-600',
      unselected: 'bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:bg-blue-50'
    }
  };

  const colors = colorClasses[color] || colorClasses.teal;

  return (
    <div className="bg-white border-2 border-slate-200 rounded-xl p-5">
      <div className="mb-3">
        <h3 className="font-semibold text-slate-800 text-lg">{label}</h3>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {options.map(option => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              p-4 rounded-lg border-2 transition-all text-left
              ${value === option.value ? colors.selected : colors.unselected}
            `}
          >
            <div className="font-bold text-lg mb-1">{option.label}</div>
            <div className={`text-xs ${value === option.value ? 'text-white/90' : 'text-slate-500'}`}>
              {option.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ValueCanvas({ data, draft, onBack }) {
  const decision = getDecisionRecommendation(draft.reach, draft.impact, draft.effort, draft.confidence);
  const value = draft.reach * draft.impact;
  const riceScore = calculateRICE(draft.reach, draft.impact, draft.confidence, draft.effort);

  function downloadCanvas() {
    // For now, we'll just copy the content. In the future, could generate PDF/PNG
    alert("Canvas download feature coming soon! For now, use your browser's print-to-PDF feature.");
    window.print();
  }

  return (
    <div className="space-y-6 animate-fadeIn print:p-8">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Value Statement
        </button>
        <button
          onClick={downloadCanvas}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
        >
          📄 Print / Save as PDF
        </button>
      </div>

      {/* Canvas Container */}
      <div className="bg-white rounded-2xl shadow-lg p-8 print:shadow-none">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Story Value Canvas</h1>
          <p className="text-slate-600">{draft.outcome || 'Untitled Story'}</p>
        </div>

        {/* Main Canvas - Two Sides */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* LEFT SIDE: Value Proposition */}
          <div className="border-4 border-sky-500 rounded-2xl p-6 bg-sky-50">
            <h2 className="text-xl font-bold text-sky-800 mb-6 text-center">Value Proposition</h2>
            <div className="space-y-6">
              {/* Gain Creators */}
              <div className="bg-white rounded-lg p-4 border-2 border-emerald-200">
                <h3 className="font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                  <span className="text-xl">📈</span>
                  Gain Creators
                </h3>
                <ul className="space-y-2">
                  {data.gainCreators.map((item, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex gap-2">
                      <span className="text-emerald-600 font-bold">+</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Products & Services */}
              <div className="bg-white rounded-lg p-4 border-2 border-sky-200">
                <h3 className="font-semibold text-sky-700 mb-3 flex items-center gap-2">
                  <span className="text-xl">📦</span>
                  Products & Services
                </h3>
                <p className="text-sm text-slate-700 font-medium">{data.solution}</p>
              </div>

              {/* Pain Relievers */}
              <div className="bg-white rounded-lg p-4 border-2 border-red-200">
                <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <span className="text-xl">💊</span>
                  Pain Relievers
                </h3>
                <ul className="space-y-2">
                  {data.painRelievers.map((item, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex gap-2">
                      <span className="text-red-600 font-bold">−</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Customer Segment */}
          <div className="border-4 border-purple-500 rounded-2xl p-6 bg-purple-50">
            <h2 className="text-xl font-bold text-purple-800 mb-6 text-center">Customer Segment</h2>
            <div className="mb-4 text-center">
              <span className="inline-block bg-purple-200 text-purple-800 px-4 py-2 rounded-lg font-semibold">
                {draft.beneficiary || 'Target Users'}
              </span>
            </div>
            <div className="space-y-6">
              {/* Gains */}
              <div className="bg-white rounded-lg p-4 border-2 border-emerald-200">
                <h3 className="font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                  <span className="text-xl">😊</span>
                  Gains
                </h3>
                <ul className="space-y-2">
                  {data.gains.map((item, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex gap-2">
                      <span className="text-emerald-600">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Customer Jobs */}
              <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
                <h3 className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  Customer Jobs
                </h3>
                <ul className="space-y-2">
                  {data.customerJobs.map((item, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex gap-2">
                      <span className="text-purple-600">→</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pains */}
              <div className="bg-white rounded-lg p-4 border-2 border-red-200">
                <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <span className="text-xl">😞</span>
                  Pains
                </h3>
                <ul className="space-y-2">
                  {data.pains.map((item, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex gap-2">
                      <span className="text-red-600">✗</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Alternatives & Metrics */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Alternatives Considered */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Alternatives Considered
            </h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{draft.alternatives || 'Not specified'}</p>
          </div>

          {/* Value Metrics */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-sky-200 rounded-xl p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Value Metrics & Recommendation
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-xs text-slate-600">Reach</div>
                  <div className="text-lg font-bold text-purple-600">{draft.reach}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600">Impact</div>
                  <div className="text-lg font-bold text-emerald-600">{draft.impact}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600">Effort</div>
                  <div className="text-lg font-bold text-orange-600">{draft.effort}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600">Confidence</div>
                  <div className="text-lg font-bold text-blue-600">{draft.confidence}</div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-600">Value Score (R×I):</span>
                  <span className="font-bold text-sky-600">{value}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-slate-600">RICE Score:</span>
                  <span className="font-bold text-slate-600">{riceScore}</span>
                </div>
                <div className="bg-white rounded-lg p-3 border-2 border-sky-300">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{decision.icon}</span>
                    <span className="font-bold text-sky-700">{decision.title}</span>
                  </div>
                  <p className="text-xs text-slate-600">{decision.desc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center text-sm text-slate-500">
          Generated by Worthsmith • {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

function OutputStep({ draft, onReset, expressMode, scoringMethod }) {
  const output = generateValueStatement(draft, expressMode, scoringMethod);
  const [copied, setCopied] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [canvasData, setCanvasData] = useState(null);
  const [isGeneratingCanvas, setIsGeneratingCanvas] = useState(false);
  const [canvasError, setCanvasError] = useState(null);

  function copyToClipboard() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadMarkdown() {
    const blob = new Blob([output], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'worthsmith-value-statement.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function generateValueCanvas() {
    setIsGeneratingCanvas(true);
    setCanvasError(null);

    try {
      console.log("Calling backend API for canvas generation...");

      const response = await fetch("/api/generate-canvas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          outcome: draft.outcome || 'Not specified',
          beneficiary: draft.beneficiary || 'Not specified',
          nonDelivery: draft.nonDelivery || 'Not specified',
          alternatives: draft.alternatives || 'Not specified'
        })
      });

      console.log("Response status:", response.status);

      const responseText = await response.text();
      console.log("Response body:", responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText };
        }
        console.error("API error response:", errorData);
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = JSON.parse(responseText);
      console.log("API response received");

      setCanvasData(data.canvas);
      setShowCanvas(true);

    } catch (error) {
      console.error("Canvas generation error:", error);
      setCanvasError(error.message || "Could not generate Value Canvas. Please try again.");
    } finally {
      setIsGeneratingCanvas(false);
    }
  }

  if (showCanvas && canvasData) {
    return <ValueCanvas data={canvasData} draft={draft} onBack={() => setShowCanvas(false)} />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Value Statement Ready</h2>
        <p className="text-slate-600 mt-2">
          {expressMode
            ? "Quick assessment complete - copy this into your Jira story"
            : "Copy this into your Jira story or save for later"
          }
        </p>
      </div>

      <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6">
        <pre className="whitespace-pre-wrap text-sm font-mono text-slate-700">{output}</pre>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={copyToClipboard}
          className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
        >
          {copied ? '✓ Copied!' : 'Copy to Clipboard'}
        </button>
        <button
          onClick={downloadMarkdown}
          className="px-6 py-3 bg-white border-2 border-slate-300 hover:border-slate-400 text-slate-700 rounded-lg font-medium transition-all"
        >
          Download .md
        </button>
        <button
          onClick={generateValueCanvas}
          disabled={isGeneratingCanvas}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingCanvas ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating Canvas...
            </span>
          ) : (
            '🎨 Generate Value Canvas'
          )}
        </button>
        <button
          onClick={onReset}
          className="px-6 py-3 text-slate-600 hover:text-sky-600 font-medium transition-colors"
        >
          Start New Story
        </button>
      </div>

      {canvasError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-center">
          {canvasError}
        </div>
      )}
    </div>
  );
}

function ComparisonView({ stories }) {
  const [sortConfig, setSortConfig] = useState({ key: 'value', direction: 'desc' });

  if (stories.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">No Stories to Compare</h2>
        <p className="text-slate-600">Save some stories first to see them compared here.</p>
      </div>
    );
  }

  // Prepare stories with calculated values
  const enrichedStories = stories.map(story => ({
    ...story,
    value: story.reach * story.impact,
    riceScore: calculateRICE(story.reach, story.impact, story.confidence, story.effort),
    recommendation: getDecisionRecommendation(story.reach, story.impact, story.effort, story.confidence)
  }));

  // Sort stories
  const sortedStories = [...enrichedStories].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    // Handle recommendation sorting by title
    if (sortConfig.key === 'recommendation') {
      aVal = a.recommendation.title;
      bVal = b.recommendation.title;
    }

    if (aVal < bVal) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aVal > bVal) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getRecommendationColor = (title) => {
    if (title === "DO NOW" || title === "QUICK WIN") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (title === "DO NEXT" || title === "STRATEGIC BET" || title === "SPIKE FIRST") return "bg-blue-50 text-blue-700 border-blue-200";
    if (title === "VALIDATE FIRST" || title === "VALIDATE ASSUMPTIONS" || title === "CONSIDER ALTERNATIVES" || title === "EVALUATE FURTHER") return "bg-amber-50 text-amber-700 border-amber-200";
    if (title === "SAY NO") return "bg-red-50 text-red-700 border-red-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  const SortButton = ({ column, label }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center gap-1 hover:text-sky-600 transition-colors"
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === column ? 'text-sky-600' : 'text-slate-400'}`} />
    </button>
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Story Comparison</h2>
        <p className="text-slate-600 mt-1">Compare and prioritize your saved stories • Click column headers to sort</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-3 px-4 font-semibold text-slate-700">
                <SortButton column="title" label="Story Title" />
              </th>
              <th className="text-center py-3 px-4 font-semibold text-slate-700">
                <SortButton column="reach" label="Reach" />
              </th>
              <th className="text-center py-3 px-4 font-semibold text-slate-700">
                <SortButton column="impact" label="Impact" />
              </th>
              <th className="text-center py-3 px-4 font-semibold text-slate-700">
                <SortButton column="effort" label="Effort" />
              </th>
              <th className="text-center py-3 px-4 font-semibold text-slate-700">
                <SortButton column="confidence" label="Confidence" />
              </th>
              <th className="text-center py-3 px-4 font-semibold text-slate-700">
                <SortButton column="value" label="Value (R×I)" />
              </th>
              <th className="text-center py-3 px-4 font-semibold text-slate-700">
                <SortButton column="riceScore" label="RICE" />
              </th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">
                <SortButton column="recommendation" label="Recommendation" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStories.map((story, idx) => (
              <tr
                key={story.id}
                className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
              >
                <td className="py-4 px-4">
                  <div className="font-medium text-slate-800">{story.title}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(story.timestamp).toLocaleDateString()}
                  </div>
                </td>
                <td className="text-center py-4 px-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-semibold text-sm">
                    {story.reach}
                  </span>
                </td>
                <td className="text-center py-4 px-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm">
                    {story.impact}
                  </span>
                </td>
                <td className="text-center py-4 px-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-semibold text-sm">
                    {story.effort}
                  </span>
                </td>
                <td className="text-center py-4 px-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                    {story.confidence}
                  </span>
                </td>
                <td className="text-center py-4 px-4">
                  <div className="font-bold text-slate-800 text-lg">{story.value}</div>
                  <div className="text-xs text-slate-500">
                    {story.value >= 49 ? 'High' : story.value >= 16 ? 'Med' : 'Low'}
                  </div>
                </td>
                <td className="text-center py-4 px-4">
                  <div className="font-bold text-slate-800 text-lg">{story.riceScore}</div>
                </td>
                <td className="py-4 px-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${getRecommendationColor(story.recommendation.title)}`}>
                    <span>{story.recommendation.icon}</span>
                    <span className="font-semibold text-sm">{story.recommendation.title}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-200 text-sm text-slate-600">
        <strong>Tip:</strong> Click column headers to sort. Default sort is by Value (highest first).
      </div>
    </div>
  );
}

// Helpers
function calculateCompleteness(draft) {
  let score = 0;
  if (draft.outcome?.length > 0) score += 20;
  if (draft.beneficiary?.length > 0) score += 20;
  if (draft.nonDelivery?.length > 0) score += 20;
  if (draft.alternatives?.length > 0) score += 20;
  if (draft.reach !== 6 || draft.impact !== 6 || draft.effort !== 6 || draft.confidence !== 6) score += 20;
  return score;
}

function calculateRICE(reach, impact, confidence, effort) {
  if (effort === 0 || effort < 1) return 0;
  return Math.round((reach * impact * confidence) / effort);
}

function calculateBA(valueScore, urgencyScore, sizeScore) {
  if (sizeScore === 0 || sizeScore < 1) return 0;
  return (valueScore * urgencyScore) / sizeScore;
}

function getDecisionRecommendation(reach, impact, effort, confidence) {
  // Calculate value tier based on Reach × Impact
  const value = reach * impact;

  // High Value (R×I ≥ 49)
  if (value >= 49) {
    if (effort <= 3 && confidence >= 7) {
      return {
        icon: "✅",
        title: "DO NOW",
        desc: "High value, low effort, high confidence - perfect candidate for immediate action.",
        action: "Add to next sprint"
      };
    }
    if (effort <= 3 && confidence < 7) {
      return {
        icon: "🔍",
        title: "SPIKE FIRST",
        desc: "High value and low effort, but confidence is low. Run a quick validation before committing.",
        action: "Time-box a spike to reduce uncertainty"
      };
    }
    if (effort >= 7 && confidence >= 7) {
      return {
        icon: "🚀",
        title: "STRATEGIC BET",
        desc: "Major initiative with high confidence. Ensure stakeholder alignment and resource commitment.",
        action: "Schedule planning session, break into phases"
      };
    }
    if (effort >= 7 && confidence < 7) {
      return {
        icon: "📚",
        title: "DE-RISK FIRST",
        desc: "High value but too much uncertainty for this investment. Run discovery or proof-of-concept first.",
        action: "Run discovery, user research, or proof-of-concept"
      };
    }
    if (effort >= 4 && effort <= 6 && confidence >= 7) {
      return {
        icon: "🎯",
        title: "DO NEXT",
        desc: "Solid high-value project. Queue it up after current priorities.",
        action: "Add to backlog, prioritize after current sprint"
      };
    }
    if (effort >= 4 && effort <= 6 && confidence < 7) {
      return {
        icon: "⚠️",
        title: "VALIDATE FIRST",
        desc: "Worth doing if we can confirm our assumptions. Reduce uncertainty before committing.",
        action: "Talk to users, review data, challenge assumptions"
      };
    }
  }

  // Medium Value (R×I 16-48)
  if (value >= 16 && value < 49) {
    if (confidence < 5) {
      return {
        icon: "⚠️",
        title: "VALIDATE ASSUMPTIONS",
        desc: "Medium value with low confidence. Clarify the problem before investing effort.",
        action: "Talk to users, review data, challenge assumptions"
      };
    }
    if (effort >= 7) {
      return {
        icon: "🤔",
        title: "CONSIDER ALTERNATIVES",
        desc: "ROI is questionable for this effort level. Look for an easier path to similar value.",
        action: "Revisit outcome, explore alternatives, reduce scope"
      };
    }
    if (effort <= 3) {
      return {
        icon: "💨",
        title: "QUICK WIN",
        desc: "Easy enough with decent value. Why not do it?",
        action: "Add to next sprint or batch with similar tasks"
      };
    }
    return {
      icon: "⚖️",
      title: "EVALUATE FURTHER",
      desc: "Could be worthwhile but needs clearer definition or better alternatives.",
      action: "Revisit outcome, improve confidence, or find alternatives"
    };
  }

  // Low Value (R×I < 16)
  if (effort >= 7) {
    return {
      icon: "❌",
      title: "SAY NO",
      desc: "Low value, high effort - this is a time sink. Politely decline or defer indefinitely.",
      action: "Communicate why this isn't worth doing"
    };
  }

  return {
    icon: "🅿️",
    title: "PARK IT",
    desc: "Low value overall. Consider batching with similar small items or backlog grooming.",
    action: "Add to backlog for future consideration"
  };
}

function generateValueStatement(draft, expressMode = false, scoringMethod = 'RICE') {
  const { outcome, beneficiary, nonDelivery, alternatives, reach, impact, effort, confidence, valueScore, urgencyScore, sizeScore } = draft;

  let scoringSection = '';
  let recommendation = '';

  if (scoringMethod === 'BA') {
    const netPriorityScore = calculateBA(valueScore, urgencyScore, sizeScore);
    const priority = netPriorityScore >= 3 ? 'High Priority' : netPriorityScore >= 1.5 ? 'Medium Priority' : 'Low Priority';

    scoringSection = `**Scoring (BA Method):**
- Value Score: ${valueScore}/6
- Urgency Score: ${urgencyScore}/3
- Size: ${sizeScore}/6
- **Net Priority Score: ${netPriorityScore.toFixed(2)}** (${priority})

Formula: (${valueScore} × ${urgencyScore}) / ${sizeScore} = ${netPriorityScore.toFixed(2)}`;

    recommendation = `**Priority: ${priority}**
${netPriorityScore >= 3 ? 'This initiative should be prioritized for immediate action.' :
  netPriorityScore >= 1.5 ? 'This initiative has medium priority and should be scheduled accordingly.' :
  'This initiative has lower priority and should be reviewed against higher-priority work.'}`;
  } else {
    // RICE scoring
    const riceScore = calculateRICE(reach, impact, confidence, effort);
    const value = reach * impact;
    const decision = getDecisionRecommendation(reach, impact, effort, confidence);

    scoringSection = `**Scoring (RICE):**
- Value Score: ${value} (Reach: ${reach} × Impact: ${impact}) - ${value >= 49 ? 'High Value' : value >= 16 ? 'Medium Value' : 'Low Value'}
- Effort: ${effort}/10
- Confidence: ${confidence}/10
- RICE Score: ${riceScore} (reference)`;

    recommendation = `**Recommendation: ${decision.title}**
${decision.desc}

**Next Action:** ${decision.action}`;
  }

  if (expressMode) {
    // Shorter format for express mode
    return `**Value Statement (Express)**

**Outcome:** ${outcome || '_not specified_'}

**Alternatives Considered:** ${alternatives || '_not specified_'}

${scoringSection}

${recommendation}

---
*Generated by Worthsmith Express Mode • Quick Assessment*`;
  }

  // Full format
  return `**Value Statement**

**Outcome:** ${outcome || '_not specified_'}

**Beneficiary:** ${beneficiary || '_not specified_'}

**Non-delivery Impact:** ${nonDelivery || '_not specified_'}

**Alternatives Considered:** ${alternatives || '_not specified_'}

${scoringSection}

${recommendation}

---
*Generated by Worthsmith • Ready for Jira*`;
}
