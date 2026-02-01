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
    it('renders all four score sliders', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate to scoring step (step 5)
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /Next/i }))
      }

      // Check for slider labels - we now have Reach, Impact, Effort, Confidence
      expect(screen.getAllByText('Reach')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Impact')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Effort')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Confidence')[0]).toBeInTheDocument()
    })

    it('shows default scores of 6', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate to scoring step
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /Next/i }))
      }

      const sliders = screen.getAllByRole('slider')
      expect(sliders[0]).toHaveValue('6') // Reach
      expect(sliders[1]).toHaveValue('6') // Impact
      expect(sliders[2]).toHaveValue('6') // Effort
      expect(sliders[3]).toHaveValue('6') // Confidence
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

      // Save a story first
      await user.type(screen.getByPlaceholderText(/Reduce checkout abandonment/i), 'Original outcome')
      await user.click(screen.getByRole('button', { name: /Save Story/i }))

      // Navigate away and change data
      await user.clear(screen.getByPlaceholderText(/Reduce checkout abandonment/i))
      await user.type(screen.getByPlaceholderText(/Reduce checkout abandonment/i), 'New outcome')

      // Load the saved story
      await user.click(screen.getByText('My Story'))

      // Check confirmation was called
      expect(global.confirm).toHaveBeenCalled()

      // Check data was restored
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Reduce checkout abandonment/i)).toHaveValue('Original outcome')
      })
    })

    it('does not load story if cancelled', async () => {
      global.prompt = vi.fn(() => 'My Story')
      global.confirm = vi.fn(() => false)

      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Save a story first
      await user.type(screen.getByPlaceholderText(/Reduce checkout abandonment/i), 'Original outcome')
      await user.click(screen.getByRole('button', { name: /Save Story/i }))

      // Navigate away and change data
      await user.clear(screen.getByPlaceholderText(/Reduce checkout abandonment/i))
      await user.type(screen.getByPlaceholderText(/Reduce checkout abandonment/i), 'New outcome')

      // Try to load the saved story
      await user.click(screen.getByText('My Story'))

      // Check confirmation was called
      expect(global.confirm).toHaveBeenCalled()

      // Check data was NOT restored (stayed with 'New outcome')
      expect(screen.getByPlaceholderText(/Reduce checkout abandonment/i)).toHaveValue('New outcome')
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

      // Wait for story to appear
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
      // Pre-populate localStorage with updated structure (now includes reach, values are 6)
      localStorageMock.setItem('worthsmith-draft', JSON.stringify({
        outcome: 'Loaded outcome',
        beneficiary: '',
        nonDelivery: '',
        alternatives: '',
        reach: 6,
        impact: 6,
        effort: 6,
        confidence: 6
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
    it('shows DO NOW for high reach, high impact, low effort, high confidence', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate to scoring
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /Next/i }))
      }

      // Set scores: Reach=8, Impact=8, Effort=2, Confidence=8
      // Value = 8×8 = 64 (High Value), Effort=2 (Low), Confidence=8 (High) → DO NOW
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '8' } }) // Reach
      fireEvent.change(sliders[1], { target: { value: '8' } }) // Impact
      fireEvent.change(sliders[2], { target: { value: '2' } }) // Effort
      fireEvent.change(sliders[3], { target: { value: '8' } }) // Confidence

      // Check for DO NOW recommendation - use getAllByText since it appears twice
      await waitFor(() => {
        const doNowElements = screen.getAllByText('DO NOW')
        expect(doNowElements.length).toBeGreaterThan(0)
      })
    })

    it('shows SPIKE FIRST for high reach, high impact, low effort, low confidence', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate to scoring
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /Next/i }))
      }

      // Set scores: Reach=8, Impact=8, Effort=2, Confidence=3
      // Value = 8×8 = 64 (High Value), Effort=2 (Low), Confidence=3 (Low) → SPIKE FIRST
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '8' } }) // Reach
      fireEvent.change(sliders[1], { target: { value: '8' } }) // Impact
      fireEvent.change(sliders[2], { target: { value: '2' } }) // Effort
      fireEvent.change(sliders[3], { target: { value: '3' } }) // Confidence

      await waitFor(() => {
        const spikeFirstElements = screen.getAllByText('SPIKE FIRST')
        expect(spikeFirstElements.length).toBeGreaterThan(0)
      })
    })

    it('shows STRATEGIC BET for high value, high effort, high confidence', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate to scoring
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /Next/i }))
      }

      // Set scores: Reach=7, Impact=7, Effort=8, Confidence=8
      // Value = 7×7 = 49 (High Value), Effort=8 (High), Confidence=8 (High) → STRATEGIC BET
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '7' } }) // Reach
      fireEvent.change(sliders[1], { target: { value: '7' } }) // Impact
      fireEvent.change(sliders[2], { target: { value: '8' } }) // Effort
      fireEvent.change(sliders[3], { target: { value: '8' } }) // Confidence

      await waitFor(() => {
        const strategicBetElements = screen.getAllByText('STRATEGIC BET')
        expect(strategicBetElements.length).toBeGreaterThan(0)
      })
    })

    it('shows DE-RISK FIRST for high value, high effort, low confidence', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate to scoring
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /Next/i }))
      }

      // Set scores: Reach=7, Impact=7, Effort=8, Confidence=4
      // Value = 7×7 = 49 (High Value), Effort=8 (High), Confidence=4 (Low) → DE-RISK FIRST
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '7' } }) // Reach
      fireEvent.change(sliders[1], { target: { value: '7' } }) // Impact
      fireEvent.change(sliders[2], { target: { value: '8' } }) // Effort
      fireEvent.change(sliders[3], { target: { value: '4' } }) // Confidence

      await waitFor(() => {
        const deRiskElements = screen.getAllByText('DE-RISK FIRST')
        expect(deRiskElements.length).toBeGreaterThan(0)
      })
    })

    it('shows DO NEXT for high value, medium effort, high confidence', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate to scoring
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /Next/i }))
      }

      // Set scores: Reach=7, Impact=7, Effort=5, Confidence=8
      // Value = 7×7 = 49 (High Value), Effort=5 (Medium), Confidence=8 (High) → DO NEXT
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '7' } }) // Reach
      fireEvent.change(sliders[1], { target: { value: '7' } }) // Impact
      fireEvent.change(sliders[2], { target: { value: '5' } }) // Effort
      fireEvent.change(sliders[3], { target: { value: '8' } }) // Confidence

      await waitFor(() => {
        const doNextElements = screen.getAllByText('DO NEXT')
        expect(doNextElements.length).toBeGreaterThan(0)
      })
    })

    it('shows VALIDATE FIRST for high value, medium effort, low confidence', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate to scoring
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /Next/i }))
      }

      // Set scores: Reach=7, Impact=7, Effort=5, Confidence=5
      // Value = 7×7 = 49 (High Value), Effort=5 (Medium), Confidence=5 (Low) → VALIDATE FIRST
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '7' } }) // Reach
      fireEvent.change(sliders[1], { target: { value: '7' } }) // Impact
      fireEvent.change(sliders[2], { target: { value: '5' } }) // Effort
      fireEvent.change(sliders[3], { target: { value: '5' } }) // Confidence

      await waitFor(() => {
        const validateFirstElements = screen.getAllByText('VALIDATE FIRST')
        expect(validateFirstElements.length).toBeGreaterThan(0)
      })
    })

    it('shows QUICK WIN for medium value, low effort', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate to scoring
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /Next/i }))
      }

      // Set scores: Reach=5, Impact=5, Effort=2, Confidence=7
      // Value = 5×5 = 25 (Medium Value), Effort=2 (Low) → QUICK WIN
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '5' } }) // Reach
      fireEvent.change(sliders[1], { target: { value: '5' } }) // Impact
      fireEvent.change(sliders[2], { target: { value: '2' } }) // Effort
      fireEvent.change(sliders[3], { target: { value: '7' } }) // Confidence

      await waitFor(() => {
        const quickWinElements = screen.getAllByText('QUICK WIN')
        expect(quickWinElements.length).toBeGreaterThan(0)
      })
    })

    it('shows VALIDATE ASSUMPTIONS for medium value, low confidence', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate to scoring
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /Next/i }))
      }

      // Set scores: Reach=5, Impact=5, Effort=4, Confidence=3
      // Value = 5×5 = 25 (Medium Value), Confidence=3 (Low) → VALIDATE ASSUMPTIONS
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '5' } }) // Reach
      fireEvent.change(sliders[1], { target: { value: '5' } }) // Impact
      fireEvent.change(sliders[2], { target: { value: '4' } }) // Effort
      fireEvent.change(sliders[3], { target: { value: '3' } }) // Confidence

      await waitFor(() => {
        const validateAssumptionsElements = screen.getAllByText('VALIDATE ASSUMPTIONS')
        expect(validateAssumptionsElements.length).toBeGreaterThan(0)
      })
    })

    it('shows CONSIDER ALTERNATIVES for medium value, high effort', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate to scoring
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /Next/i }))
      }

      // Set scores: Reach=5, Impact=5, Effort=8, Confidence=7
      // Value = 5×5 = 25 (Medium Value), Effort=8 (High) → CONSIDER ALTERNATIVES
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '5' } }) // Reach
      fireEvent.change(sliders[1], { target: { value: '5' } }) // Impact
      fireEvent.change(sliders[2], { target: { value: '8' } }) // Effort
      fireEvent.change(sliders[3], { target: { value: '7' } }) // Confidence

      await waitFor(() => {
        const considerAlternativesElements = screen.getAllByText('CONSIDER ALTERNATIVES')
        expect(considerAlternativesElements.length).toBeGreaterThan(0)
      })
    })

    it('shows EVALUATE FURTHER for medium value, medium effort, medium confidence', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate to scoring
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /Next/i }))
      }

      // Set scores: Reach=5, Impact=5, Effort=5, Confidence=6
      // Value = 5×5 = 25 (Medium Value), Effort=5 (Medium), Confidence=6 (Medium) → EVALUATE FURTHER
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '5' } }) // Reach
      fireEvent.change(sliders[1], { target: { value: '5' } }) // Impact
      fireEvent.change(sliders[2], { target: { value: '5' } }) // Effort
      fireEvent.change(sliders[3], { target: { value: '6' } }) // Confidence

      await waitFor(() => {
        const evaluateFurtherElements = screen.getAllByText('EVALUATE FURTHER')
        expect(evaluateFurtherElements.length).toBeGreaterThan(0)
      })
    })

    it('shows SAY NO for low reach, low impact, high effort', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate to scoring
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /Next/i }))
      }

      // Set scores: Reach=2, Impact=2, Effort=9
      // Value = 2×2 = 4 (Low Value), Effort=9 (High) → SAY NO
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '2' } }) // Reach
      fireEvent.change(sliders[1], { target: { value: '2' } }) // Impact
      fireEvent.change(sliders[2], { target: { value: '9' } }) // Effort

      await waitFor(() => {
        const sayNoElements = screen.getAllByText('SAY NO')
        expect(sayNoElements.length).toBeGreaterThan(0)
      })
    })

    it('shows PARK IT for low value, low effort', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate to scoring
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /Next/i }))
      }

      // Set scores: Reach=3, Impact=3, Effort=3, Confidence=5
      // Value = 3×3 = 9 (Low Value), Effort=3 (Low) → PARK IT
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '3' } }) // Reach
      fireEvent.change(sliders[1], { target: { value: '3' } }) // Impact
      fireEvent.change(sliders[2], { target: { value: '3' } }) // Effort
      fireEvent.change(sliders[3], { target: { value: '5' } }) // Confidence

      await waitFor(() => {
        const parkItElements = screen.getAllByText('PARK IT')
        expect(parkItElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Comparison View', () => {
    beforeEach(() => {
      // Create some test stories in localStorage
      const testStories = [
        {
          id: 1,
          title: 'High Value Story',
          timestamp: '2024-12-01T10:00:00.000Z',
          outcome: 'Test outcome 1',
          beneficiary: 'Test users 1',
          nonDelivery: 'Test impact 1',
          alternatives: 'Test alternatives 1',
          reach: 8,
          impact: 8,
          effort: 3,
          confidence: 7
        },
        {
          id: 2,
          title: 'Medium Value Story',
          timestamp: '2024-12-01T11:00:00.000Z',
          outcome: 'Test outcome 2',
          beneficiary: 'Test users 2',
          nonDelivery: 'Test impact 2',
          alternatives: 'Test alternatives 2',
          reach: 5,
          impact: 5,
          effort: 2,
          confidence: 7
        },
        {
          id: 3,
          title: 'Low Value Story',
          timestamp: '2024-12-01T12:00:00.000Z',
          outcome: 'Test outcome 3',
          beneficiary: 'Test users 3',
          nonDelivery: 'Test impact 3',
          alternatives: 'Test alternatives 3',
          reach: 3,
          impact: 3,
          effort: 8,
          confidence: 5
        }
      ]
      localStorageMock.setItem('worthsmith-stories', JSON.stringify(testStories))
    })

    it('shows Compare Stories button in header', () => {
      render(<WorthsmithApp />)
      // Use getByText instead of getByRole since it might not have a specific role
      expect(screen.getByText(/Compare Stories/i)).toBeInTheDocument()
    })

    it('switches to comparison view when button clicked', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      const compareButton = screen.getByText(/Compare Stories/i)
      await user.click(compareButton)

      await waitFor(() => {
        expect(screen.getByText('Story Comparison')).toBeInTheDocument()
      })
    })

    it('shows Back to Editor button in comparison view', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      await user.click(screen.getByText(/Compare Stories/i))

      await waitFor(() => {
        expect(screen.getByText(/Back to Editor/i)).toBeInTheDocument()
      })
    })

    it('returns to editor when Back to Editor clicked', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      await user.click(screen.getByText(/Compare Stories/i))

      await waitFor(() => {
        expect(screen.getByText(/Back to Editor/i)).toBeInTheDocument()
      })

      await user.click(screen.getByText(/Back to Editor/i))

      await waitFor(() => {
        expect(screen.getByText(/What outcome are we pursuing/i)).toBeInTheDocument()
      })
    })

    it('displays all saved stories in table', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      await user.click(screen.getByText(/Compare Stories/i))

      await waitFor(() => {
        expect(screen.getByText('High Value Story')).toBeInTheDocument()
        expect(screen.getByText('Medium Value Story')).toBeInTheDocument()
        expect(screen.getByText('Low Value Story')).toBeInTheDocument()
      })
    })

    it('displays correct column headers', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      await user.click(screen.getByText(/Compare Stories/i))

      await waitFor(() => {
        expect(screen.getByText('Story Title')).toBeInTheDocument()
        expect(screen.getByText('Reach')).toBeInTheDocument()
        expect(screen.getByText('Impact')).toBeInTheDocument()
        expect(screen.getByText('Effort')).toBeInTheDocument()
        expect(screen.getByText('Confidence')).toBeInTheDocument()
        expect(screen.getByText('Value (R×I)')).toBeInTheDocument()
        expect(screen.getByText('RICE')).toBeInTheDocument()
        expect(screen.getByText('Recommendation')).toBeInTheDocument()
      })
    })

    it('calculates Value correctly (R×I)', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      await user.click(screen.getByText(/Compare Stories/i))

      await waitFor(() => {
        // High Value Story: 8×8 = 64
        expect(screen.getByText('High Value Story')).toBeInTheDocument()
      })

      const highValueRow = screen.getByText('High Value Story').closest('tr')
      expect(highValueRow).toHaveTextContent('64')
    })

    it('calculates RICE correctly', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      await user.click(screen.getByText(/Compare Stories/i))

      await waitFor(() => {
        expect(screen.getByText('High Value Story')).toBeInTheDocument()
      })

      // High Value Story: (8×8×7)/3 = 149
      const highValueRow = screen.getByText('High Value Story').closest('tr')
      expect(highValueRow).toHaveTextContent('149')
    })

    it('shows correct recommendations', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      await user.click(screen.getByText(/Compare Stories/i))

      await waitFor(() => {
        // High Value (64), Low Effort (3), High Confidence (7) = DO NOW
        expect(screen.getByText('DO NOW')).toBeInTheDocument()

        // Medium Value (25), Low Effort (2), High Confidence (7) = QUICK WIN
        expect(screen.getByText('QUICK WIN')).toBeInTheDocument()
      })
    })

    it('sorts by default (Value descending)', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      await user.click(screen.getByText(/Compare Stories/i))

      await waitFor(() => {
        expect(screen.getByText('High Value Story')).toBeInTheDocument()
      })

      const rows = screen.getAllByRole('row')
      // First row is header, second should be High Value (64)
      expect(rows[1]).toHaveTextContent('High Value Story')
      expect(rows[1]).toHaveTextContent('64')
    })

    it('shows empty state when no stories saved', async () => {
      localStorageMock.clear()
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      await user.click(screen.getByText(/Compare Stories/i))

      await waitFor(() => {
        expect(screen.getByText('No Stories to Compare')).toBeInTheDocument()
      })
    })

    it('hides progress bar in comparison view', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Progress bar should be visible initially
      expect(screen.getAllByText('Outcome').length).toBeGreaterThan(0)

      await user.click(screen.getByText(/Compare Stories/i))

      await waitFor(() => {
        expect(screen.getByText('Story Comparison')).toBeInTheDocument()
      })

      // Progress bar should be hidden in comparison view
      // "Outcome" might still appear in sidebar but not in progress bar
      const outcomeElements = screen.queryAllByText('Outcome')
      // Should be fewer instances when progress bar is hidden
      expect(outcomeElements.length).toBeLessThanOrEqual(1)
    })
  })

  describe('Value Canvas Generation', () => {
    beforeEach(() => {
      // Mock fetch for canvas generation API - configure with default resolution
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ alternatives: [] })
      })
    })

    it('shows Generate Value Canvas button on output step', async () => {
      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate through all steps with form data
      await user.type(screen.getByPlaceholderText(/Reduce checkout abandonment/i), 'Test outcome')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/First-time customers/i), 'Test users')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/We continue losing/i), 'Test impact')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/Update checkout copy/i), 'Test alternatives')
      await user.click(screen.getByRole('button', { name: /Next/i }))

      // On scoring step, set scores and generate
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '6' } })
      await user.click(screen.getByRole('button', { name: /Generate Statement/i }))

      // Wait for output step to load
      await waitFor(() => {
        expect(screen.getByText('Value Statement Ready')).toBeInTheDocument()
      })

      // Look for canvas button using text instead of role
      expect(screen.getByText(/Generate Value Canvas/i)).toBeInTheDocument()
    })

    it('calls API when Generate Value Canvas clicked', async () => {
      const mockCanvasData = {
        customerJobs: ['Job 1', 'Job 2', 'Job 3'],
        pains: ['Pain 1', 'Pain 2', 'Pain 3'],
        gains: ['Gain 1', 'Gain 2', 'Gain 3'],
        solution: 'Test solution',
        painRelievers: ['Reliever 1', 'Reliever 2', 'Reliever 3'],
        gainCreators: ['Creator 1', 'Creator 2', 'Creator 3']
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ canvas: mockCanvasData })
      })

      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate with form data
      await user.type(screen.getByPlaceholderText(/Reduce checkout abandonment/i), 'Test outcome')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/First-time customers/i), 'Test users')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/We continue losing/i), 'Test impact')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/Update checkout copy/i), 'Test alternatives')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '6' } })
      await user.click(screen.getByRole('button', { name: /Generate Statement/i }))

      await waitFor(() => {
        expect(screen.getByText('Value Statement Ready')).toBeInTheDocument()
      })

      const canvasButton = screen.getByText(/Generate Value Canvas/i)
      await user.click(canvasButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/generate-canvas',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
        )
      })
    })

    it('shows loading state while generating canvas', async () => {
      global.fetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          text: async () => JSON.stringify({
            canvas: {
              customerJobs: ['Job 1'],
              pains: ['Pain 1'],
              gains: ['Gain 1'],
              solution: 'Test',
              painRelievers: ['Reliever 1'],
              gainCreators: ['Creator 1']
            }
          })
        }), 100))
      )

      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Wait for component to be ready
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Reduce checkout abandonment/i)).toBeInTheDocument()
      })

      await user.type(screen.getByPlaceholderText(/Reduce checkout abandonment/i), 'Test outcome')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/First-time customers/i), 'Test users')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/We continue losing/i), 'Test impact')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/Update checkout copy/i), 'Test alternatives')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '6' } })
      await user.click(screen.getByRole('button', { name: /Generate Statement/i }))

      await waitFor(() => {
        expect(screen.getByText('Value Statement Ready')).toBeInTheDocument()
      })

      await user.click(screen.getByText(/Generate Value Canvas/i))

      // Check for loading text
      await waitFor(() => {
        expect(screen.getByText(/Generating Canvas/i)).toBeInTheDocument()
      })
    })

    it('displays canvas after successful generation', async () => {
      const mockCanvasData = {
        customerJobs: ['Complete purchase', 'Understand costs', 'Make decision'],
        pains: ['Unexpected fees', 'Cart abandonment', 'Distrust'],
        gains: ['Transparent pricing', 'Confident checkout', 'No surprises'],
        solution: 'Display shipping costs upfront',
        painRelievers: ['Eliminates surprises', 'Provides transparency', 'Reduces friction'],
        gainCreators: ['Builds trust', 'Enables decisions', 'Improves experience']
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ canvas: mockCanvasData })
      })

      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Wait for component to be ready
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Reduce checkout abandonment/i)).toBeInTheDocument()
      })

      await user.type(screen.getByPlaceholderText(/Reduce checkout abandonment/i), 'Test outcome')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/First-time customers/i), 'Test users')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/We continue losing/i), 'Test impact')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/Update checkout copy/i), 'Test alternatives')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '6' } })
      await user.click(screen.getByRole('button', { name: /Generate Statement/i }))

      await waitFor(() => {
        expect(screen.getByText('Value Statement Ready')).toBeInTheDocument()
      })

      await user.click(screen.getByText(/Generate Value Canvas/i))

      await waitFor(() => {
        expect(screen.getByText('Story Value Canvas')).toBeInTheDocument()
      })

      // Check for canvas sections
      expect(screen.getByText('Value Proposition')).toBeInTheDocument()
      expect(screen.getByText('Customer Segment')).toBeInTheDocument()
      expect(screen.getByText('Gain Creators')).toBeInTheDocument()
      expect(screen.getByText('Pain Relievers')).toBeInTheDocument()
      expect(screen.getByText('Customer Jobs')).toBeInTheDocument()
      expect(screen.getByText('Gains')).toBeInTheDocument()
      expect(screen.getByText('Pains')).toBeInTheDocument()
    })

    it('displays canvas content correctly', async () => {
      const mockCanvasData = {
        customerJobs: ['Complete purchase'],
        pains: ['Unexpected fees'],
        gains: ['Transparent pricing'],
        solution: 'Display shipping costs upfront',
        painRelievers: ['Eliminates surprises'],
        gainCreators: ['Builds trust']
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ canvas: mockCanvasData })
      })

      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Wait for component to be ready
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Reduce checkout abandonment/i)).toBeInTheDocument()
      })

      await user.type(screen.getByPlaceholderText(/Reduce checkout abandonment/i), 'Test outcome')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/First-time customers/i), 'Test users')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/We continue losing/i), 'Test impact')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/Update checkout copy/i), 'Test alternatives')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '6' } })
      await user.click(screen.getByRole('button', { name: /Generate Statement/i }))

      await waitFor(() => {
        expect(screen.getByText('Value Statement Ready')).toBeInTheDocument()
      })

      await user.click(screen.getByText(/Generate Value Canvas/i))

      await waitFor(() => {
        expect(screen.getByText('Complete purchase')).toBeInTheDocument()
        expect(screen.getByText('Unexpected fees')).toBeInTheDocument()
        expect(screen.getByText('Transparent pricing')).toBeInTheDocument()
        expect(screen.getByText('Display shipping costs upfront')).toBeInTheDocument()
        expect(screen.getByText('Eliminates surprises')).toBeInTheDocument()
        expect(screen.getByText('Builds trust')).toBeInTheDocument()
      })
    })

    it('shows Back to Value Statement button in canvas view', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          canvas: {
            customerJobs: ['Job'],
            pains: ['Pain'],
            gains: ['Gain'],
            solution: 'Solution',
            painRelievers: ['Reliever'],
            gainCreators: ['Creator']
          }
        })
      })

      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Wait for component to be ready
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Reduce checkout abandonment/i)).toBeInTheDocument()
      })

      await user.type(screen.getByPlaceholderText(/Reduce checkout abandonment/i), 'Test outcome')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/First-time customers/i), 'Test users')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/We continue losing/i), 'Test impact')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/Update checkout copy/i), 'Test alternatives')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '6' } })
      await user.click(screen.getByRole('button', { name: /Generate Statement/i }))

      await waitFor(() => {
        expect(screen.getByText('Value Statement Ready')).toBeInTheDocument()
      })

      await user.click(screen.getByText(/Generate Value Canvas/i))

      await waitFor(() => {
        expect(screen.getByText(/Back to Value Statement/i)).toBeInTheDocument()
      })
    })

    it('returns to output step when Back clicked', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          canvas: {
            customerJobs: ['Job'],
            pains: ['Pain'],
            gains: ['Gain'],
            solution: 'Solution',
            painRelievers: ['Reliever'],
            gainCreators: ['Creator']
          }
        })
      })

      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Wait for component to be ready
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Reduce checkout abandonment/i)).toBeInTheDocument()
      })

      await user.type(screen.getByPlaceholderText(/Reduce checkout abandonment/i), 'Test outcome')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/First-time customers/i), 'Test users')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/We continue losing/i), 'Test impact')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/Update checkout copy/i), 'Test alternatives')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '6' } })
      await user.click(screen.getByRole('button', { name: /Generate Statement/i }))

      await waitFor(() => {
        expect(screen.getByText('Value Statement Ready')).toBeInTheDocument()
      })

      await user.click(screen.getByText(/Generate Value Canvas/i))

      await waitFor(() => {
        expect(screen.getByText(/Back to Value Statement/i)).toBeInTheDocument()
      })

      await user.click(screen.getByText(/Back to Value Statement/i))

      await waitFor(() => {
        expect(screen.getByText('Value Statement Ready')).toBeInTheDocument()
      })
    })

    it('displays error message when API fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ error: 'API error' })
      })

      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Wait for component to be ready
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Reduce checkout abandonment/i)).toBeInTheDocument()
      })

      await user.type(screen.getByPlaceholderText(/Reduce checkout abandonment/i), 'Test outcome')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/First-time customers/i), 'Test users')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/We continue losing/i), 'Test impact')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      await user.type(screen.getByPlaceholderText(/Update checkout copy/i), 'Test alternatives')
      await user.click(screen.getByRole('button', { name: /Next/i }))
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '6' } })
      await user.click(screen.getByRole('button', { name: /Generate Statement/i }))

      await waitFor(() => {
        expect(screen.getByText('Value Statement Ready')).toBeInTheDocument()
      })

      await user.click(screen.getByText(/Generate Value Canvas/i))

      await waitFor(() => {
        expect(screen.getByText(/Could not generate|error/i)).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('includes RICE scores in canvas', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          canvas: {
            customerJobs: ['Job'],
            pains: ['Pain'],
            gains: ['Gain'],
            solution: 'Solution',
            painRelievers: ['Reliever'],
            gainCreators: ['Creator']
          }
        })
      })

      render(<WorthsmithApp />)
      const user = userEvent.setup()

      // Navigate to scoring and set scores
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /Next/i }))
      }

      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '8' } }) // Reach
      fireEvent.change(sliders[1], { target: { value: '8' } }) // Impact
      fireEvent.change(sliders[2], { target: { value: '3' } }) // Effort
      fireEvent.change(sliders[3], { target: { value: '7' } }) // Confidence

      // Click Generate Statement button
      await user.click(screen.getByRole('button', { name: /Generate Statement/i }))

      await waitFor(() => {
        expect(screen.getByText('Value Statement Ready')).toBeInTheDocument()
      })

      await user.click(screen.getByText(/Generate Value Canvas/i))

      await waitFor(() => {
        expect(screen.getByText('Story Value Canvas')).toBeInTheDocument()
      })

      // Check for scores in canvas - they appear multiple times, just verify they exist
      expect(screen.getByText('64')).toBeInTheDocument() // Value (8×8)
      expect(screen.getByText('149')).toBeInTheDocument() // RICE
    })

    it('includes recommendation in canvas', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          canvas: {
            customerJobs: ['Job'],
            pains: ['Pain'],
            gains: ['Gain'],
            solution: 'Solution',
            painRelievers: ['Reliever'],
            gainCreators: ['Creator']
          }
        })
      })

      render(<WorthsmithApp />)
      const user = userEvent.setup()

      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /Next/i }))
      }

      // Set scores for DO NOW: High Value + Low Effort + High Confidence
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '8' } })
      fireEvent.change(sliders[1], { target: { value: '8' } })
      fireEvent.change(sliders[2], { target: { value: '3' } })
      fireEvent.change(sliders[3], { target: { value: '7' } })

      // Click Generate Statement button
      await user.click(screen.getByRole('button', { name: /Generate Statement/i }))

      await waitFor(() => {
        expect(screen.getByText('Value Statement Ready')).toBeInTheDocument()
      })

      await user.click(screen.getByText(/Generate Value Canvas/i))

      await waitFor(() => {
        const doNowElements = screen.getAllByText('DO NOW')
        expect(doNowElements.length).toBeGreaterThan(0)
      })
    })
  })
})
