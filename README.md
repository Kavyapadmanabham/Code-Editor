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