# Worthsmith

![Worthsmith Logo](public/images/worthsmith-logo.png)

**A Value Articulation Assistant for Product Owners**

Worthsmith is a guided web-based tool that helps Product Owners shift from delivery-first to value-first thinking. It provides a structured workflow to articulate user story value, explore alternatives, and make clearer prioritization decisions before stories reach refinement.

---

## 🎯 Problem Statement

Product teams often approach refinement from a technical delivery perspective rather than a product outcome perspective. This leads to:

- Inconsistently defined story value
- Unexplored alternatives and "do nothing" options
- Output-led rather than outcome-led prioritization
- Refinements that miss the "why" behind the work
- Product Owners overwhelmed with low-value work

**Worthsmith addresses this by providing a lightweight, structured tool that supports value-focused conversations and trade-off analysis.**

---

## ✨ Features

### Current (Stage 2.5)

- **🧭 Value Wizard**: 5-step guided flow to articulate story value
  - Outcome definition (what problem are we solving?)
  - Beneficiary identification (who cares?)
  - Impact analysis (what happens if we don't do it?)
  - Alternatives exploration (can we do less or differently?)
  - Success criteria and scoring

- **📊 Impact vs Effort Matrix**: Visual quadrant chart with real-time classification
  - Quick Win (high impact, low effort)
  - Strategic Bet (high impact, high effort)
  - Low Value (low impact, low effort)
  - Time Sink (low impact, high effort)

- **💾 Story Management**: Save and organize multiple stories locally
  - localStorage-based persistence
  - Multiple story drafts
  - Timestamp tracking

- **📋 Jira-Ready Output**: Generate formatted value statements
  - Copy to clipboard
  - Export as Markdown
  - Paste directly into Jira descriptions

- **📈 Progress Tracking**: Real-time completion overview
  - Visual progress indicators
  - Step-by-step guidance
  - Completion percentage

### Coming Soon (Stage 3)

- 🤖 **AI Coaching**: Challenge assumptions and suggest alternatives
- ⚡ **Express Mode**: 3-step quick assessment for rapid decisions
- 🎯 **Alternative Templates**: Pre-filled common patterns (Do nothing, Copy change, A/B test)
- 💡 **Confidence Calibration**: Tooltips and examples for better scoring

### Future Roadmap (Stage 4+)

- Backend storage with user authentication
- Multi-device sync
- Team collaboration features
- Advanced analytics on PO decision patterns
- "Say No Better" message generator
- Full Story Value Canvas
- Custom templates and workflows

---

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/worthsmith.git
cd worthsmith
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

---

## 🛠️ Tech Stack

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS 3
- **Icons**: Lucide React
- **Storage**: localStorage (client-side only)
- **Language**: JavaScript (ES6+)

---

## 📖 Usage Guide

### Creating a Value Statement

1. **Define the Outcome**: Describe the user problem or business need you're addressing. Focus on the change you want to see, not the solution.

2. **Identify Beneficiaries**: Specify who benefits - users, customers, internal teams. Be concrete about personas or segments.

3. **Assess Non-Delivery Impact**: What happens if you don't do this work? Quantify where possible (lost revenue, support burden, brand damage).

4. **Explore Alternatives**: Challenge the default solution. Consider:
   - **Reduce**: Can we solve this with less effort?
   - **Reuse**: Do we have existing features to leverage?
   - **Reframe**: Is there a different problem that's easier to solve?
   - **Remove**: What if we improved something else instead?

5. **Score & Classify**: Rate Impact, Effort, and Confidence (0-10). The tool automatically classifies your story into a prioritization quadrant.

6. **Generate Output**: Copy the formatted value statement into Jira or export as Markdown.

### Saving Stories

- Click **"Save Story"** in the header
- Enter a descriptive title
- View all saved stories in the sidebar
- Stories persist across browser sessions (localStorage)

### Using the Example

Click **"Load Example"** to see a fully populated story demonstrating best practices.

---

## 🎨 Screenshots

### Value Wizard
*5-step guided workflow with real-time progress tracking*

### Impact vs Effort Matrix
*Visual quadrant chart showing story classification*

### Generated Output
*Jira-ready value statement with one-click copy*

---

## 🤝 Contributing

This is currently a prototype being validated with real Product Owners. Contributions, issues, and feature requests are welcome!

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards

- Use functional React components with hooks
- Follow existing Tailwind CSS patterns
- Keep components small and focused
- Add comments for complex logic
- Test in both desktop and mobile viewports

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with insights from Product Owner pain points in real-world agile teams
- Inspired by the Lean Value Tree and Impact Mapping methodologies
- UI design influenced by modern product tools like Linear and Notion

---

## 📬 Contact

**Project Maintainer**: [Your Name]

**Project Link**: [https://github.com/yourusername/worthsmith](https://github.com/yourusername/worthsmith)

---

## 🗺️ Roadmap

### Stage 1: Core Wizard ✅
- [x] 5-step value articulation flow
- [x] Impact vs Effort scoring
- [x] Jira-ready output generation
- [x] localStorage persistence

### Stage 2: Visual Polish ✅
- [x] Quadrant chart visualization
- [x] Progress sidebar
- [x] Quick-fill example
- [x] Responsive design improvements

### Stage 2.5: Story Management 🚧
- [x] Save multiple stories
- [ ] Load saved stories
- [ ] Delete stories
- [ ] Express mode (3-step quick version)
- [ ] Alternative templates

### Stage 3: AI Integration 📋
- [ ] AI-powered alternative suggestions
- [ ] Assumption challenge prompts
- [ ] Value statement refinement
- [ ] Smart guidance based on inputs

### Stage 4: Backend & Scale 💭
- [ ] User authentication
- [ ] Database persistence
- [ ] Multi-device sync
- [ ] Team collaboration
- [ ] Analytics dashboard

---

## 💡 Philosophy

**Worthsmith is built on these principles:**

1. **Value before delivery**: Understand the "why" before the "how"
2. **Alternatives always exist**: Challenge the default solution
3. **Make "no" easier**: Low-value work should be easy to identify and decline
4. **Product thinking is a skill**: Provide scaffolding to build better habits
5. **Start small, iterate**: A simple tool used consistently beats a complex tool unused

---

Made with ❤️ for Product Owners who want to say "no" better and "yes" smarter.
