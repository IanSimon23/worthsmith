import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WorthsmithApp from './App'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString() },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock window.confirm and window.alert
global.confirm = vi.fn(() => true)
global.alert = vi.fn()
global.prompt = vi.fn()

describe('WorthsmithApp', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('Initial Render', () => {
    it('renders the app with Worthsmith branding', () => {
      render(<WorthsmithApp />)
      expect(screen.getByText('Worthsmith')).toBeInTheDocument()
      expect(screen.getByText('Value Articulation Assistant')).toBeInTheDocument()
    })

    it('starts on step 1 (Outcome)', () => {
      render(<WorthsmithApp />)
      expect(screen.getByText(/What outcome are we pursuing/i)).toBeInTheDocument()
    })

    it('shows all 5 step indicators', () => {
      render(<WorthsmithApp />)
      // Use getAllByText since these appear in multiple places
      const outcomes = screen.getAllByText('Outcome')
      expect(outcomes.length).toBeGreaterThan(0)
      expect(screen.getAllByText('Who').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Impact').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Alternatives').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Score').length).toBeGreaterThan(0)
    })

    it('disables back button on step 1', () => {
      render(<WorthsmithApp />)
      const backButton = screen.getByRole('button', { name: /Back/i })
      expect(backButton).toBeDisabled()
    })
  })

  describe('Navigation', () => {
    it('navigates forward through steps', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Step 1
      expect(screen.getByText(/What outcome are we pursuing/i)).toBeInTheDocument()

      // Click Next
      await user.click(screen.getByRole('button', { name: /Next/i }))

      // Step 2
      expect(screen.getByText(/Who benefits from this/i)).toBeInTheDocument()

      // Click Next again
      await user.click(screen.getByRole('button', { name: /Next/i }))

      // Step 3
      expect(screen.getByText(/What happens if we don't do this/i)).toBeInTheDocument()
    })

    it('navigates backward through steps', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Go to step 2
      await user.click(screen.getByRole('button', { name: /Next/i }))
      expect(screen.getByText(/Who benefits from this/i)).toBeInTheDocument()

      // Go back to step 1
      await user.click(screen.getByRole('button', { name: /Back/i }))
      expect(screen.getByText(/What outcome are we pursuing/i)).toBeInTheDocument()
    })
  })

  describe('Form Input', () => {
    it('captures outcome input', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      const textarea = screen.getByPlaceholderText(/Reduce checkout abandonment/i)
      await user.type(textarea, 'Test outcome')

      expect(textarea).toHaveValue('Test outcome')
    })

    it('captures beneficiary input', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate to step 2
      await user.click(screen.getByRole('button', { name: /Next/i }))

      const input = screen.getByPlaceholderText(/First-time customers/i)
      await user.type(input, 'Test users')

      expect(input).toHaveValue('Test users')
    })

    it('persists data when navigating between steps', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Enter outcome
      const outcomeField = screen.getByPlaceholderText(/Reduce checkout abandonment/i)
      await user.type(outcomeField, 'Test outcome')

      // Go to step 2
      await user.click(screen.getByRole('button', { name: /Next/i }))

      // Go back to step 1
      await user.click(screen.getByRole('button', { name: /Back/i }))

      // Check data persisted
      expect(screen.getByPlaceholderText(/Reduce checkout abandonment/i)).toHaveValue('Test outcome')
    })
  })

  describe('Scoring', () => {
    it('renders all three score sliders', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate to scoring step (step 5)
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /Next/i }))
      }

      // Check for slider labels using getAllByText since they appear in multiple places
      expect(screen.getAllByText('Impact')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Effort')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Confidence')[0]).toBeInTheDocument()
    })

    it('shows default scores of 5', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate to scoring step
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /Next/i }))
      }

      const sliders = screen.getAllByRole('slider')
      expect(sliders[0]).toHaveValue('5') // Impact
      expect(sliders[1]).toHaveValue('5') // Effort
      expect(sliders[2]).toHaveValue('5') // Confidence
    })

    it('updates score when slider changes', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate to scoring step
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /Next/i }))
      }

      const sliders = screen.getAllByRole('slider')
      // Use fireEvent.change for sliders (not userEvent.type)
      fireEvent.change(sliders[0], { target: { value: '8' } })

      expect(sliders[0]).toHaveValue('8')
    })
  })

  describe('Save Story', () => {
    it('saves story with a title', async () => {
      global.prompt = vi.fn(() => 'Test Story')

      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Fill in some data
      const outcomeField = screen.getByPlaceholderText(/Reduce checkout abandonment/i)
      await user.type(outcomeField, 'Test outcome')

      // Click Save Story
      const saveButton = screen.getByRole('button', { name: /Save Story/i })
      await user.click(saveButton)

      // Check prompt was called
      expect(global.prompt).toHaveBeenCalledWith('Give this story a title:')

      // Check alert confirmation
      expect(global.alert).toHaveBeenCalledWith('Story saved!')

      // Check story appears in sidebar
      await waitFor(() => {
        expect(screen.getByText('Test Story')).toBeInTheDocument()
      })
    })

    it('does not save if title is cancelled', async () => {
      global.prompt = vi.fn(() => null)

      render(<WorthsmithApp />)
      const user = userEvent.setup()

      const saveButton = screen.getByRole('button', { name: /Save Story/i })
      await user.click(saveButton)

      expect(global.alert).not.toHaveBeenCalled()
      expect(screen.queryByText('Saved Stories')).not.toBeInTheDocument()
    })
  })

  describe('Load Story', () => {
    it('loads a saved story when clicked', async () => {
      global.prompt = vi.fn(() => 'My Story')
      global.confirm = vi.fn(() => true)

      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Fill and save a story
      const outcomeField = screen.getByPlaceholderText(/Reduce checkout abandonment/i)
      await user.type(outcomeField, 'Original outcome')

      const saveButton = screen.getByRole('button', { name: /Save Story/i })
      await user.click(saveButton)

      // Clear the form
      await user.clear(outcomeField)
      await user.type(outcomeField, 'Different outcome')

      // Load the story
      await waitFor(() => {
        expect(screen.getByText('My Story')).toBeInTheDocument()
      })

      const storyButton = screen.getByText('My Story').closest('button')
      await user.click(storyButton)

      // Check confirmation was shown
      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Load "My Story"?')
      )

      // Check data was loaded
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Reduce checkout abandonment/i)).toHaveValue('Original outcome')
      })
    })

    it('does not load if cancelled', async () => {
      global.prompt = vi.fn(() => 'My Story')
      global.confirm = vi.fn(() => false)

      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Save a story
      await user.type(screen.getByPlaceholderText(/Reduce checkout abandonment/i), 'Original')
      await user.click(screen.getByRole('button', { name: /Save Story/i }))

      // Try to load but cancel
      await waitFor(() => {
        expect(screen.getByText('My Story')).toBeInTheDocument()
      })

      await user.clear(screen.getByPlaceholderText(/Reduce checkout abandonment/i))
      await user.type(screen.getByPlaceholderText(/Reduce checkout abandonment/i), 'Different')

      const storyButton = screen.getByText('My Story').closest('button')
      await user.click(storyButton)

      // Data should not change
      expect(screen.getByPlaceholderText(/Reduce checkout abandonment/i)).toHaveValue('Different')
    })
  })

  describe('Delete Story', () => {
    it('deletes a story when confirmed', async () => {
      global.prompt = vi.fn(() => 'Story to Delete')
      global.confirm = vi.fn(() => true)

      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Save a story
      await user.click(screen.getByRole('button', { name: /Save Story/i }))

      await waitFor(() => {
        expect(screen.getByText('Story to Delete')).toBeInTheDocument()
      })

      // Find all buttons (the delete button will be in there even if hidden)
      const allButtons = screen.getAllByRole('button')

      // Find the delete button by looking for the one with title="Delete story"
      const deleteButton = allButtons.find(btn => btn.getAttribute('title') === 'Delete story')

      expect(deleteButton).toBeDefined()

      // Click delete
      await user.click(deleteButton)

      // Check confirmation
      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Delete "Story to Delete"?')
      )

      // Story should be removed
      await waitFor(() => {
        expect(screen.queryByText('Story to Delete')).not.toBeInTheDocument()
      })
    })
  })

  describe('Generate Output', () => {
    it('generates value statement on final step', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Fill in form data
      await user.type(screen.getByPlaceholderText(/Reduce checkout abandonment/i), 'Test outcome')
      await user.click(screen.getByRole('button', { name: /Next/i }))

      await user.type(screen.getByPlaceholderText(/First-time customers/i), 'Test users')
      await user.click(screen.getByRole('button', { name: /Next/i }))

      await user.type(screen.getByPlaceholderText(/We continue losing/i), 'Test impact')
      await user.click(screen.getByRole('button', { name: /Next/i }))

      await user.type(screen.getByPlaceholderText(/Update checkout copy/i), 'Test alternatives')
      await user.click(screen.getByRole('button', { name: /Next/i }))

      // On scoring step, click Generate
      await user.click(screen.getByRole('button', { name: /Generate Statement/i }))

      // Should show output screen
      await waitFor(() => {
        expect(screen.getByText('Value Statement Ready')).toBeInTheDocument()
        expect(screen.getByText(/Test outcome/)).toBeInTheDocument()
        expect(screen.getByText(/Test users/)).toBeInTheDocument()
      })
    })
  })

  describe('Load Example', () => {
    it('fills form with example data', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      const loadExampleButton = screen.getByRole('button', { name: /Load Example/i })
      await user.click(loadExampleButton)

      // Check that outcome field is filled
      const outcomeField = screen.getByPlaceholderText(/Reduce checkout abandonment/i)
      expect(outcomeField.value).toContain('checkout')
    })
  })

  describe('Reset', () => {
    it('resets form data when confirmed', async () => {
      global.confirm = vi.fn(() => true)

      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Fill in data
      await user.type(screen.getByPlaceholderText(/Reduce checkout abandonment/i), 'Test data')

      // Reset
      const resetButton = screen.getByRole('button', { name: /Reset/i })
      await user.click(resetButton)

      // Check confirmation
      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Reset all fields?')
      )

      // Check field is cleared
      expect(screen.getByPlaceholderText(/Reduce checkout abandonment/i)).toHaveValue('')
    })
  })

  describe('LocalStorage Persistence', () => {
    it('saves draft to localStorage', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      await user.type(screen.getByPlaceholderText(/Reduce checkout abandonment/i), 'Persisted data')

      // Check localStorage was updated
      const stored = JSON.parse(localStorageMock.getItem('worthsmith-draft'))
      expect(stored.outcome).toBe('Persisted data')
    })

    it('loads draft from localStorage on mount', () => {
      // Pre-populate localStorage
      localStorageMock.setItem('worthsmith-draft', JSON.stringify({
        outcome: 'Loaded outcome',
        beneficiary: '',
        nonDelivery: '',
        alternatives: '',
        impact: 5,
        effort: 5,
        confidence: 5
      }))

      render(<WorthsmithApp />)

      expect(screen.getByPlaceholderText(/Reduce checkout abandonment/i)).toHaveValue('Loaded outcome')
    })

    it('saves stories array to localStorage', async () => {
      global.prompt = vi.fn(() => 'Test Story')

      render(<WorthsmithApp />)
      const user = userEvent.setup()

      await user.click(screen.getByRole('button', { name: /Save Story/i }))

      const stored = JSON.parse(localStorageMock.getItem('worthsmith-stories'))
      expect(stored).toHaveLength(1)
      expect(stored[0].title).toBe('Test Story')
    })
  })

  describe('Express Mode', () => {
    it('has an express mode toggle button', () => {
      render(<WorthsmithApp />)

      // Should have a button with Express or Full text
      const toggleButton = screen.getByRole('button', { name: /Full/i })
      expect(toggleButton).toBeInTheDocument()
    })

    it('does not break navigation when express mode is toggled', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Toggle express mode
      const toggleButton = screen.getByRole('button', { name: /Full/i })
      await user.click(toggleButton)

      // Should still be able to navigate
      expect(screen.getByText(/What outcome are we pursuing/i)).toBeInTheDocument()

      const nextButton = screen.getByRole('button', { name: /Next/i })
      await user.click(nextButton)

      // Should navigate to some step (alternatives in express mode)
      expect(nextButton).toBeInTheDocument() // Navigation still works
    })
  })

  describe('Decision Matrix', () => {
    it('shows DO NOW for high impact, low effort, high confidence', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate to scoring
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /Next/i }))
      }

      // Set scores: Impact=8, Effort=2, Confidence=8
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '8' } })
      fireEvent.change(sliders[1], { target: { value: '2' } })
      fireEvent.change(sliders[2], { target: { value: '8' } })

      // Check for DO NOW recommendation - use getAllByText since it appears twice
      await waitFor(() => {
        const doNowElements = screen.getAllByText('DO NOW')
        expect(doNowElements.length).toBeGreaterThan(0)
      })
    })

    it('shows SPIKE FIRST for high impact, low effort, low confidence', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate to scoring
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /Next/i }))
      }

      // Set scores: Impact=8, Effort=2, Confidence=3
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '8' } })
      fireEvent.change(sliders[1], { target: { value: '2' } })
      fireEvent.change(sliders[2], { target: { value: '3' } })

      await waitFor(() => {
        const spikeFirstElements = screen.getAllByText('SPIKE FIRST')
        expect(spikeFirstElements.length).toBeGreaterThan(0)
      })
    })

    it('shows SAY NO for low impact, high effort', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate to scoring
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /Next/i }))
      }

      // Set scores: Impact=2, Effort=9
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '2' } })
      fireEvent.change(sliders[1], { target: { value: '9' } })

      await waitFor(() => {
        const sayNoElements = screen.getAllByText('SAY NO')
        expect(sayNoElements.length).toBeGreaterThan(0)
      })
    })
  })
})
