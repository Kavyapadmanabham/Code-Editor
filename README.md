# 🧠 AI-Powered Code Editor

An intelligent, collaborative code editor built with **React.js**, **Monaco Editor**, **Node.js/Express**, and **Firebase**.  
It supports multiple programming languages, real-time collaboration, and AI-powered code suggestions.

---

## ✨ Features

- 🔤 **Multi-language support** (C, C++, Java, Python, JavaScript, etc.)
- 🎨 **Customizable editor UI** (themes, font size, layout)
- 🤖 **AI-powered suggestions** (bug fixes, code completions)
- 📂 **Recursive file navigation** with drag-and-drop
- 💾 **Cloud storage** with Firebase & Firestore
- 🔍 **IntelliSense-like auto-suggestions** using Monaco


---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/<Kavyapadmanabham>/code-editor.git
cd code-editor

# Node.js Express Gemini (Google Generative AI) Backend

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root with your Gemini API key:
   ```env
   GEMINI_API_KEY=your-gemini-api-key-here
   ```

3. Start the server:
   ```bash
   node index.js
   ```

## API Usage

- **POST** `/api/generate`
  - Request body (JSON):
    ```json
    { "prompt": "Your prompt here" }
    ```
  - Response (JSON):
    ```json
    { "result": "Gemini response" }
