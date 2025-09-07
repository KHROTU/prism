# PRISM

PRISM is an open-source, self-hosted tool that automates research. It uses a team of specialized AI agents to go from a single question to a comprehensive, transparent, and well-supported report.

![PRISM Screenshot](/assets/screenshot.png)

## ✨ Features

- **Multi-Agent System**: A team of specialized AI agents collaborate to produce high-quality research.
- **"Glass Box" Philosophy**: The entire research process is transparent. You can see every search query, every website visited, and every piece of information used to construct the final report.
- **Self-Hosted & Private**: Run PRISM on your own machine. Your research queries and results remain private and under your control.
- **Customizable Models**: While PRISM provides a free-to-use default LLM provider, you can easily configure it to use your own API keys for providers like OpenAI, Anthropic, Google Gemini, OpenRouter, or any other OpenAI-compatible API.
- **Secure Code Execution**: The `CodeExecutor` agent runs Python code in a secure, isolated Docker container to perform calculations safely.
- **Modern Tech Stack**: Built with a high-performance Python/FastAPI backend and a sleek, reactive Next.js/React frontend.

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Python** (version 3.11 or newer)
- **Node.js** (version 20.x or newer)
- **Docker Desktop**: Must be running for the `CodeExecutor` agent to function.

## 🚀 Getting Started

Follow these steps to get PRISM up and running on your local machine.

### 1. Clone the Repository

First, clone the PRISM repository to your local machine using Git:

```bash
git clone https://github.com/KHROTU/prism.git
cd prism
```

### 2. Backend Setup

The backend server orchestrates the AI agents and tools.

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:

   - **For Windows**

     ```bash
     python -m venv venv
     .\venv\Scripts\activate
     ```

   - **For macOS/Linux**

     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install the required Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Configure Environment Variables:
   The `ResearcherAgent` requires Google Search API keys to function.

   - Copy the example environment file:

     ```bash
     cp .env.example .env
     ```

   - Open the newly created `.env` file and add your credentials:
     - `GOOGLE_API_KEY`: Get this from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials). You will need to enable the "Custom Search API".
     - `GOOGLE_CX_ID`: This is your Programmable Search Engine ID. You can create one using the [Programmable Search Engine control panel](https://programmablesearchengine.google.com/controlpanel/all). Make sure to configure it to search the entire web and include image search results.

5. Run the Backend Server:

   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

   The backend server is now running on `http://localhost:8000`. Keep this terminal window open.

### 3. Frontend Setup

The frontend is the web interface where you interact with PRISM.

1. Open a new terminal window.

2. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

3. Install the required Node.js dependencies:

   ```bash
   npm install
   ```

4. Run the Frontend Development Server:

   ```bash
   npm run dev
   ```

   The frontend is now running on `http://localhost:3000`.

### 4. Usage

- Open your web browser and navigate to `http://localhost:3000`.
- If both servers are running correctly, the status indicators in the header should be green.
- Enter a research query on the homepage and start your research!
- Go to the **Settings** page to configure custom Large Language Models for each agent if you prefer not to use the default provider.

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements or want to report a bug, please open an issue or submit a pull request on our [GitHub repository](https://github.com/KHROTU/prism).

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
