# AI UI Generator - Backend

The intelligent core of the Deterministic UI Generator system. This service orchestrates a multi-agent pipeline to convert natural language into safe, deterministic React components.

## 🏗️ Architecture

The backend is built with **Node.js**, **Express**, and **TypeScript**, leveraging the **Groq SDK** for high-speed inference with Llama 3 models.

### The Trinity Agent Pipeline
The system uses a sequential chain of three specialized agents:

1.  **🧠 Planner Agent ("The Architect")**
    -   **Input:** User prompt + Current UI State (JSON)
    -   **Responsibility:** Interprets intent and generates a purely structural JSON layout tree.
    -   **Output:** `LayoutNode` JSON object.
    -   **Constraint:** Can only use components defined in the `ComponentManifest`.

2.  **👷 Generator Agent ("The Builder")**
    -   **Input:** Layout JSON from Planner.
    -   **Responsibility:** Converts the abstract JSON tree into valid, executable React JSX code.
    -   **Output:** Raw JSX string.
    -   **Constraint:** Strictly forbidden from using standard HTML tags (`div`, `span`, etc.), inline styles, or custom CSS classes. Must strictly adhere to the component whitelist.

3.  **🗣️ Explainer Agent**
    -   **Input:** User Prompt + Generated Plan.
    -   **Responsibility:** Provides a natural language explanation of the design decisions.
    -   **Output:** Markdown text.

## 🚀 Setup & Installation

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the root of the `backend` directory:
    ```env
    GROQ_API_KEY=your_groq_api_key_here
    PORT=3000
    ```

4.  **Run the server:**
    ```bash
    # Development mode (with hot reload)
    npm run dev

    # Production build
    npm run build
    npm start
    ```

## 🧩 Component System Design

The backend enforces a strict "Deterministic Component System". The AI cannot hallucinate new styles or components. It must select *only* from the allowed manifest defined in `src/agents/componentManifest.ts`.

### Allowed Components
-   **Layout:** `Navbar`, `Sidebar`, `Container`, `Grid`, `HStack`, `VStack`, `Spacer`
-   **Elements:** `Button`, `Input`, `Table`, `Card`, `Modal`, `Chart`

### Safety Mechanisms
-   **Prompt Engineering:** System prompts explicitly forbid HTML/CSS injection.
-   **JSON Validation:** The Planner's output is parsed and validated before being passed to the Generator.
-   **Whitelist Enforcement:** The component manifest serves as the single source of truth for the AI's available tools.

## ⚠️ Known Limitations

-   **State Persistence:** Currently uses in-memory or ephemeral storage; a restart wipes session history.
-   **Complex Interactivity:** Generated components are largely presentation-focused. Complex custom logic hooks are not currently supported by the generator.
-   **Model Dependency:** Heavily optimized for Llama 3 instruction-following capabilities. Other models may require prompt tuning.

## 💡 Architectural Insights

-   **Why multiple agents?**
    Separating concerns allows us to optimize each step. The **Planner** focuses purely on logical structure without getting distracted by syntax. The **Generator** focuses purely on valid syntax without worrying about layout logic.
-   **Why a fixed component list?**
    Restricting the AI to a specific set of components ensures **visual consistency** and **reliability**. It prevents the AI from hallucinating broken CSS or inventing non-existent UI elements, guaranteeing that every generated UI actually renders and looks good.
-   **Prompt Engineering Strategy:**
    We use "chain-of-thought" and strict JSON schema enforcement in our system prompts. This forces the LLM to think structurally before it generates code, significantly reducing errors compared to single-shot generation.
