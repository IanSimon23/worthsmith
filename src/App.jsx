import React, { useState, useEffect } from "react";
import { Lightbulb, Users, AlertTriangle, GitBranch, Target, CheckCircle2, ArrowRight, ArrowLeft, RotateCcw, Sparkles, Eye } from "lucide-react";

export default function WorthsmithApp() {
  const [step, setStep] = useState(1);
  const [showSidebar, setShowSidebar] = useState(true);
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

  useEffect(() => {
    localStorage.setItem("worthsmith-draft", JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    localStorage.setItem("worthsmith-stories", JSON.stringify(savedStories));
  }, [savedStories]);

  function saveStory() {
    const title = prompt("Give this story a title:");
    if (!title) return;

    const story = {
      id: Date.now(),
      title,
      timestamp: new Date().toISOString(),
      ...draft
    };

    setSavedStories(prev => [story, ...prev]);
    alert("Story saved!");
  }

  function loadStory(story) {
    if (confirm(`Load "${story.title}"? This will replace your current draft.`)) {
      const { id, title, timestamp, ...storyData } = story;
      setDraft(storyData);
      setStep(1);
    }
  }

  function deleteStory(storyId, storyTitle) {
    if (confirm(`Delete "${storyTitle}"? This cannot be undone.`)) {
      setSavedStories(prev => prev.filter(s => s.id !== storyId));
    }
  }

  function updateDraft(updates) {
    setDraft(prev => ({ ...prev, ...updates }));
  }

  function resetDraft() {
    if (confirm("Reset all fields? This cannot be undone.")) {
      setDraft(getInitialDraft());
      setStep(1);
    }
  }

  function loadExample() {
    setDraft({
      outcome: "Reduce checkout abandonment for first-time customers by providing clear, upfront shipping cost information before payment details are entered.",
      beneficiary: "First-time customers in checkout flow; Customer Service team handling shipping queries; Marketing team measuring conversion rates",
      nonDelivery: "We continue losing approximately 15% of new users at checkout (estimated £45k/month in lost revenue). CS team continues handling 200+ weekly tickets about unexpected shipping costs. Brand perception suffers due to 'hidden fees' complaints on review sites.",
      alternatives: "Quick copy change to existing checkout page; Add expandable FAQ section; Run 2-week A/B test with simplified flow; Add shipping calculator widget; Do nothing and measure baseline for one sprint; Partner with shipping provider for flat-rate option",
      impact: 8,
      effort: 3,
      confidence: 7
    });
  }

  function nextStep() {
    setStep(s => Math.min(6, s + 1));
  }

  function prevStep() {
    setStep(s => Math.max(1, s - 1));
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
                <p className="text-sm text-slate-500">Value Articulation Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveStory}
                className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                💾 Save Story
              </button>
              <button
                onClick={loadExample}
                className="flex items-center gap-2 px-4 py-2 text-sm text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Load Example</span>
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
        {step < 6 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 transition-all hover:shadow-xl">
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((s, i) => (
                <React.Fragment key={i}>
                  <StepIndicator
                    number={i + 1}
                    label={s.short}
                    active={step === i + 1}
                    completed={step > i + 1}
                    icon={s.icon}
                  />
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded transition-all duration-500 ${step > i + 1 ? 'bg-sky-500' : 'bg-slate-200'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="text-center mt-4">
              <div className="text-xs text-slate-500">
                Step {step} of 5 • {Math.round((step / 5) * 100)}% complete
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className={`${step < 6 && showSidebar ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="bg-white rounded-2xl shadow-lg p-8 transition-all hover:shadow-xl">
              <div className="transition-opacity duration-300">
                {step === 1 && <OutcomeStep value={draft.outcome} onChange={v => updateDraft({ outcome: v })} />}
                {step === 2 && <BeneficiaryStep value={draft.beneficiary} onChange={v => updateDraft({ beneficiary: v })} />}
                {step === 3 && <ImpactStep value={draft.nonDelivery} onChange={v => updateDraft({ nonDelivery: v })} />}
                {step === 4 && <AlternativesStep value={draft.alternatives} onChange={v => updateDraft({ alternatives: v })} />}
                {step === 5 && <ScoringStep draft={draft} onChange={updateDraft} />}
                {step === 6 && <OutputStep draft={draft} onReset={resetDraft} />}
              </div>

              {/* Navigation */}
              {step < 6 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t">
                  <button
                    onClick={prevStep}
                    disabled={step === 1}
                    className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:gap-3"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
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
                  <QuadrantChart impact={draft.impact} effort={draft.effort} />
                </div>
                <div className="col-span-1">
                  <ConfidenceZone confidence={draft.confidence} />
                </div>
              </div>
              <DecisionMatrix impact={draft.impact} effort={draft.effort} confidence={draft.confidence} />
            </div>
          )}
        </div>
      </div>
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

function getInitialDraft() {
  return {
    outcome: "",
    beneficiary: "",
    nonDelivery: "",
    alternatives: "",
    impact: 5,
    effort: 5,
    confidence: 5
  };
}

// Components
function SavedStoriesList({ stories, onLoad, onDelete }) {
  if (stories.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl">
      <h3 className="font-semibold text-slate-800 mb-4">Saved Stories ({stories.length})</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {stories.map(story => (
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
                {new Date(story.timestamp).toLocaleDateString()} • Click to load
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
        ))}
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
            value={`${draft.impact}/${draft.effort}/${draft.confidence}`}
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
          {isScore ? `Impact: ${value.split('/')[0]} • Effort: ${value.split('/')[1]}` : value}
        </p>
      )}
      {!hasContent && !isScore && (
        <p className="text-xs text-slate-400 italic">Not yet filled</p>
      )}
    </div>
  );
}

function QuadrantChart({ impact, effort }) {
  const quadrant = getQuadrant(impact, effort);
  const dotX = (effort / 10) * 100;
  const dotY = 100 - (impact / 10) * 100;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl">
      <h3 className="font-semibold text-slate-800 mb-4">Impact vs Effort</h3>

      <div className="relative aspect-square bg-slate-50 rounded-lg overflow-hidden border-2 border-slate-200">
        {/* Quadrants */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          <div className="bg-emerald-50 border-r border-b border-slate-300 flex items-center justify-center">
            <span className="text-xs text-emerald-700 font-medium">Quick Win</span>
          </div>
          <div className="bg-blue-50 border-b border-slate-300 flex items-center justify-center">
            <span className="text-xs text-blue-700 font-medium">Strategic</span>
          </div>
          <div className="bg-slate-100 border-r border-slate-300 flex items-center justify-center">
            <span className="text-xs text-slate-500 font-medium">Low Value</span>
          </div>
          <div className="bg-amber-50 flex items-center justify-center">
            <span className="text-xs text-amber-700 font-medium">Time Sink</span>
          </div>
        </div>

        {/* Axis Labels - positioned outside the grid */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-500 font-medium">
          Effort →
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

function DecisionMatrix({ impact, effort, confidence }) {
  const getDecision = () => {
    // High Impact scenarios
    if (impact >= 7) {
      if (effort <= 4 && confidence >= 7) {
        return {
          icon: "✅",
          title: "DO NOW",
          desc: "High impact, low effort, high confidence - perfect candidate for immediate action.",
          action: "Add to next sprint",
          color: "emerald"
        };
      }
      if (effort <= 4 && confidence < 7) {
        return {
          icon: "🔍",
          title: "SPIKE FIRST",
          desc: "High impact and low effort, but confidence is low. Run a quick validation before committing.",
          action: "Time-box a spike to reduce uncertainty",
          color: "blue"
        };
      }
      if (effort >= 7 && confidence >= 7) {
        return {
          icon: "🚀",
          title: "STRATEGIC BET",
          desc: "Major initiative with high confidence. Ensure stakeholder alignment and resource commitment.",
          action: "Schedule planning session, break into phases",
          color: "blue"
        };
      }
      if (effort >= 7 && confidence < 7) {
        return {
          icon: "📚",
          title: "RESEARCH NEEDED",
          desc: "High impact but high effort and low confidence. De-risk before investing significant resources.",
          action: "Run discovery, user research, or proof-of-concept",
          color: "amber"
        };
      }
    }

    // Medium Impact scenarios
    if (impact >= 4 && impact < 7) {
      if (confidence < 5) {
        return {
          icon: "⚠️",
          title: "VALIDATE ASSUMPTIONS",
          desc: "Medium impact with low confidence. Clarify the problem before investing effort.",
          action: "Talk to users, review data, challenge assumptions",
          color: "amber"
        };
      }
      return {
        icon: "⚖️",
        title: "EVALUATE FURTHER",
        desc: "Medium impact - could be worthwhile but needs clearer definition or better alternatives.",
        action: "Revisit outcome, explore alternatives, improve confidence",
        color: "slate"
      };
    }

    // Low Impact scenarios
    if (effort >= 7) {
      return {
        icon: "❌",
        title: "SAY NO",
        desc: "Low impact, high effort - this is a time sink. Politely decline or defer indefinitely.",
        action: "Communicate why this isn't worth doing",
        color: "red"
      };
    }

    return {
      icon: "🅿️",
      title: "PARK IT",
      desc: "Low impact overall. Consider batching with similar small items or backlog grooming.",
      action: "Add to backlog for future consideration",
      color: "slate"
    };
  };

  const decision = getDecision();

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl border-2 ${
      decision.color === 'emerald' ? 'border-emerald-200' :
      decision.color === 'blue' ? 'border-blue-200' :
      decision.color === 'amber' ? 'border-amber-200' :
      decision.color === 'red' ? 'border-red-200' :
      'border-slate-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className="text-3xl">{decision.icon}</div>
        <div className="flex-1">
          <h3 className={`font-bold text-lg ${
            decision.color === 'emerald' ? 'text-emerald-700' :
            decision.color === 'blue' ? 'text-blue-700' :
            decision.color === 'amber' ? 'text-amber-700' :
            decision.color === 'red' ? 'text-red-700' :
            'text-slate-700'
          }`}>
            {decision.title}
          </h3>
          <p className="text-sm text-slate-600 mt-2">{decision.desc}</p>
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            decision.color === 'emerald' ? 'bg-emerald-50 text-emerald-800' :
            decision.color === 'blue' ? 'bg-blue-50 text-blue-800' :
            decision.color === 'amber' ? 'bg-amber-50 text-amber-800' :
            decision.color === 'red' ? 'bg-red-50 text-red-800' :
            'bg-slate-50 text-slate-800'
          }`}>
            <strong>Next Action:</strong> {decision.action}
          </div>
        </div>
      </div>
    </div>
  );
}

function OutcomeStep({ value, onChange }) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-6 h-6 text-sky-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800">What outcome are we pursuing?</h2>
          <p className="text-slate-600 mt-2">Describe the user problem or business need you're trying to address. Focus on the change you want to see, not the solution.</p>
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

function AlternativesStep({ value, onChange }) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-start gap-3">
        <GitBranch className="w-6 h-6 text-sky-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800">What alternatives could we consider?</h2>
          <p className="text-slate-600 mt-2">Challenge the default solution. Is there a cheaper, faster, or simpler way? What if we did nothing?</p>
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

      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g., Update checkout copy to clarify costs; Add FAQ section; Run A/B test with simplified flow; Do nothing and measure impact for 2 weeks..."
        className="w-full h-32 px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-sky-500 focus:outline-none resize-none transition-colors"
      />
    </div>
  );
}

function ScoringStep({ draft, onChange }) {
  const decision = getDecisionRecommendation(draft.impact, draft.effort, draft.confidence);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-start gap-3">
        <Target className="w-6 h-6 text-sky-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800">How would you score this?</h2>
          <p className="text-slate-600 mt-2">Rate the expected impact, required effort, and your confidence level on a scale of 0-10.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
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
        <h3 className="font-semibold text-slate-800 mb-3">Recommendation</h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{decision.icon}</span>
          <div className="text-lg font-bold text-sky-600">
            {decision.title}
          </div>
        </div>
        <p className="text-sm text-slate-600 mt-2">{decision.desc}</p>
      </div>
    </div>
  );
}

function ScoreSlider({ label, value, onChange, color, description }) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-semibold text-slate-800">{label}</div>
          <div className="text-xs text-slate-500">{description}</div>
        </div>
        <div className={`text-2xl font-bold transition-all ${
          color === 'emerald' ? 'text-emerald-600' :
          color === 'orange' ? 'text-orange-600' :
          'text-blue-600'
        }`}>
          {value}
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer transition-all"
        style={{
          background: `linear-gradient(to right, ${
            color === 'emerald' ? '#10b981' :
            color === 'orange' ? '#f97316' :
            '#3b82f6'
          } 0%, ${
            color === 'emerald' ? '#10b981' :
            color === 'orange' ? '#f97316' :
            '#3b82f6'
          } ${value * 10}%, #e2e8f0 ${value * 10}%, #e2e8f0 100%)`
        }}
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}

function OutputStep({ draft, onReset }) {
  const output = generateValueStatement(draft);
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Value Statement Ready</h2>
        <p className="text-slate-600 mt-2">Copy this into your Jira story or save for later</p>
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
          onClick={onReset}
          className="px-6 py-3 text-slate-600 hover:text-sky-600 font-medium transition-colors"
        >
          Start New Story
        </button>
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
  if (draft.impact !== 5 || draft.effort !== 5 || draft.confidence !== 5) score += 20;
  return score;
}

function getDecisionRecommendation(impact, effort, confidence) {
  // High Impact scenarios
  if (impact >= 7) {
    if (effort <= 4 && confidence >= 7) {
      return { icon: "✅", title: "DO NOW", desc: "High impact, low effort, high confidence - perfect candidate for immediate action." };
    }
    if (effort <= 4 && confidence < 7) {
      return { icon: "🔍", title: "SPIKE FIRST", desc: "High impact and low effort, but confidence is low. Run a quick validation before committing." };
    }
    if (effort >= 7 && confidence >= 7) {
      return { icon: "🚀", title: "STRATEGIC BET", desc: "Major initiative with high confidence. Ensure stakeholder alignment and resource commitment." };
    }
    if (effort >= 7 && confidence < 7) {
      return { icon: "📚", title: "RESEARCH NEEDED", desc: "High impact but high effort and low confidence. De-risk before investing significant resources." };
    }
  }

  // Medium Impact scenarios
  if (impact >= 4 && impact < 7) {
    if (confidence < 5) {
      return { icon: "⚠️", title: "VALIDATE ASSUMPTIONS", desc: "Medium impact with low confidence. Clarify the problem before investing effort." };
    }
    return { icon: "⚖️", title: "EVALUATE FURTHER", desc: "Medium impact - could be worthwhile but needs clearer definition or better alternatives." };
  }

  // Low Impact scenarios
  if (effort >= 7) {
    return { icon: "❌", title: "SAY NO", desc: "Low impact, high effort - this is a time sink. Politely decline or defer indefinitely." };
  }

  return { icon: "🅿️", title: "PARK IT", desc: "Low impact overall. Consider batching with similar small items or backlog grooming." };
}

function generateValueStatement(draft) {
  const { outcome, beneficiary, nonDelivery, alternatives, impact, effort, confidence } = draft;

  return `**Value Statement**

**Outcome:** ${outcome || '_not specified_'}

**Beneficiary:** ${beneficiary || '_not specified_'}

**Non-delivery Impact:** ${nonDelivery || '_not specified_'}

**Alternatives Considered:** ${alternatives || '_not specified_'}

**Scoring:**
- Impact: ${impact}/10
- Effort: ${effort}/10
- Confidence: ${confidence}/10
- Recommendation: ${getDecisionRecommendation(impact, effort, confidence).title}

---
*Generated by Worthsmith • Ready for Jira*`;
}

function getQuadrant(impact, effort) {
  if (impact >= 7 && effort <= 4) return "🎯 Quick Win";
  if (impact >= 7 && effort >= 7) return "🚀 Strategic Bet";
  if (impact <= 4 && effort <= 4) return "🤔 Low Value";
  if (impact <= 4 && effort >= 7) return "❌ Time Sink";
  return "⚖️ Evaluate Further";
}

function getQuadrantGuidance(impact, effort) {
  if (impact >= 7 && effort <= 4) return "High value, low effort. Prioritize this!";
  if (impact >= 7 && effort >= 7) return "Major initiative. Ensure alignment before committing.";
  if (impact <= 4 && effort <= 4) return "Small task. Consider batching with similar items.";
  if (impact <= 4 && effort >= 7) return "High effort for low return. Reconsider or find alternatives.";
  return "Needs more analysis. Challenge your assumptions.";
}
