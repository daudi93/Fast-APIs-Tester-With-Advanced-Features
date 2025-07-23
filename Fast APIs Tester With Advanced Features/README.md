Fast APIs Tester With Advanced Features

# 🌐 FastAPI Launcher GUI

A **graphical launcher tool** for starting FastAPI servers with ease. Built for developers who want to quickly start, monitor, and test their FastAPI apps — **without needing to type any command line instructions**.

---

## 🚀 Features

- 🔍 Auto-detects `main.py` and extracts base URL (host & port)
- 🟢 Starts & Stops FastAPI server with a single click
- 🧪 Opens a **JSON-only API Tester** UI (index.html)
- 🔄 Retry connection and auto-status updates
- 📂 Select your FastAPI `main.py` file
- 📄 Export a basic FastAPI `main.py` + SQL schema
- 💾 One-click `.exe` support for Windows
- 📌 No code exposure — index.html is extracted at runtime from bundled `.exe`

---

## 📁 Project Structure

FastAPI-Launcher/
├── launcher.exe # The final GUI application (Windows)
├── index.html # API tester UI (embedded in exe)
├── README.md # You're reading it!
├── LICENSE # MIT License


---

## 🧠 How It Works

- The GUI allows you to select any `main.py` file containing your FastAPI app.
- It reads the `uvicorn` host/port arguments to generate the **base URL**.
- It launches the backend using `subprocess` and monitors if it is running.
- It opens `index.html` tester (securely extracted at runtime from `.exe`).
- You can also **export** a starter FastAPI project with database config, model, and CRUD endpoints.

---

## 🛠️ How to Use

1. **Double click** on `launcher.exe`
2. Click `📁 Choose main.py File` and select your FastAPI project
3. Click `▶ Start Server`
4. Once running, click `🧪 Open Tester` to test APIs
5. Click `❌ Close Server` when finished
6. Optional: Click `ℹ Info` → `📦 Export FastAPI Project` to generate `main.py` + `schema.sql`

---

## 📦 Exported Project

When you export a project, it includes:

- `main.py` (FastAPI starter)
- `schema.sql` (to create the necessary SQL table)
- Uses SQL Server connection with hardcoded test credentials:

SQL_SERVER = "localhost"
SQL_DATABASE = "Dummy"
SQL_USERNAME = "admin"
SQL_PASSWORD = "01231678"


---

## 🖼️ Icon

You can customize the `.exe` icon by replacing the `icon.ico` before building with:

```bash
pyinstaller --onefile --icon=icon.ico launcher.py
