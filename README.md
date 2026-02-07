# AI-Driven Drug Discovery & Repurposing Platform

A modern, scientific interface for exploring drug repurposing candidates using AI-driven insights. This platform visualizes complex relationships between drugs, targets, and pathways to accelerate discovery.

![Platform Preview](https://via.placeholder.com/800x450?text=AI+Drug+Discovery+Platform)

## 🚀 Features

- **Interactive Network Graph**: visualize drug-target-pathway connections using D3.js.
- **AI Explanations**: Integrated Gemini API for real-time scientific explanations of drug mechanisms.
- **Three-Panel Layout**:
  - **Left**: Disease selection and filtering.
  - **Center**: Network visualization and detailed analysis.
  - **Right**: Ranked drug candidates with confidence scores.
- **Premium Design**: Scientific aesthetic with calm animations and precise typography.
- **Responsive State Management**: Tracks analysis states (Analyzing → Matching → Scoring).

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Framer Motion
- **Visualization**: D3.js
- **AI Integration**: Google Gemini API
- **Icons**: Lucide React

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/drug-detection.git
    cd drug-detection
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**
    Create a `.env` file in the root directory:
    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

## 🔍 Usage

1.  Select a **Disease** from the left panel (e.g., Alzheimer's).
2.  Watch the model analyze and rank candidates.
3.  Select a **Drug** from the list to view its mechanism and graph.
4.  Click **"Explain with Gemini"** for a deep-dive analysis.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
