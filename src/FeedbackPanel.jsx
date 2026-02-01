// FeedbackPanel.jsx
// Display panel for AI feedback with questions, suggestions, and strengths

import React from 'react'

export default function FeedbackPanel({ feedback, onClose, error }) {
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 animate-slide-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              Feedback Error
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close feedback"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <p className="font-medium mb-1">Could not generate feedback</p>
            <p className="text-sm">{error}</p>
            <p className="text-sm mt-2">Please try again in a moment.</p>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!feedback) {
    return null
  }

  const { questions = [], suggestions = [], working = [] } = feedback

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-slide-in">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            AI Feedback
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close feedback"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Questions Section */}
        {questions.length > 0 && !questions[0].toLowerCase().includes('n/a') && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="text-xl">🤔</span>
              Questions to Consider
            </h4>
            <div className="space-y-3">
              {questions.map((question, index) => (
                <div
                  key={index}
                  className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg"
                >
                  <p className="text-slate-700">{question}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions Section */}
        {suggestions.length > 0 && !suggestions[0].toLowerCase().includes('n/a') && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="text-xl">✨</span>
              Suggestions
            </h4>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-lg"
                >
                  <p className="text-slate-700">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What's Working Section */}
        {working.length > 0 && !working[0].toLowerCase().includes('n/a') && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="text-xl">✅</span>
              What's Working
            </h4>
            <div className="space-y-3">
              {working.map((item, index) => (
                <div
                  key={index}
                  className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg"
                >
                  <p className="text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-between items-center pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            💡 Use this feedback to strengthen your story
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
          >
            Got it, thanks!
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
