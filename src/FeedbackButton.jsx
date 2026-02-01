// FeedbackButton.jsx
// Button component to trigger AI feedback request

import React from 'react'

export default function FeedbackButton({
  onClick,
  loading = false,
  disabled = false,
  step
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors bg-purple-50 text-purple-700 hover:bg-purple-100 border-2 border-purple-200 hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
      title={disabled ? "Enter some content first to get feedback" : "Get AI-powered feedback on this step"}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="hidden sm:inline">Getting Feedback...</span>
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <span className="hidden sm:inline">Get AI Feedback</span>
          <span className="sm:hidden">💡</span>
        </>
      )}
    </button>
  )
}
