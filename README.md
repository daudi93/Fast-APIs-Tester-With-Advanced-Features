Fast APIs Tester With Advanced Features

# 🚀 FastAPI Launcher + API Tester GUI (Offline Executable)

## 📜 License

This project is open-source under the [MIT License](LICENSE).  
Feel free to use, fork, and modify it for your kingdom.  
All glory belongs to **Qaisar Baloch 👑**.


This is a beautiful, modern **Tkinter-based GUI tool** designed for developers working with **FastAPI + SQL Server**. It helps you:

- ✅ Start FastAPI servers with one click
- 🧠 Automatically detect `base_url` from the `main.py` file
- 🧪 Launch a fully offline **JSON API Tester (index.html)**
- 🔁 Retry, close, and verify server status easily
- 📄 Export SQL + Python starter files
---

## 📦 Features

| Feature                        | Description |
|-------------------------------|-------------|
| 🎯 Choose `main.py` file       | Select any FastAPI app file |
| ⚡ Auto Base URL Detection      | Detects `--host` & `--port` from code |
| ▶ Start Server                | Starts FastAPI server via `uvicorn` |
| ❌ Close Server               | Gracefully terminates server process |
| 🧪 Launch Tester              | Opens a modern, local HTML JSON API tester |
| 🔁 Retry Button               | Checks server status |
| ℹ️ Info Button                | Displays which file to select and why |
| 📤 Export Demo Files          | Exports working `main.py` + `.sql` files |
| ✅ Fully Offline Mode         | No internet required for testing |

---

## 💻 How to Use

### 📁 Step 1: Choose `main.py`

Click on **📁 Choose main.py File** to select your FastAPI application (usually the file that contains `app = FastAPI()`).

---

### ▶ Step 2: Start the Server

Click on **▶ Start Server** to launch the FastAPI server. It will show you a real-time status.

---

### 🧪 Step 3: Launch API Tester

After the server starts, click **🧪 Open Tester**. This opens a local, beautifully designed JSON API tester in your browser (`index.html`).

You can:

- Select endpoints
- Choose methods (GET, POST, DELETE, etc.)
- Send JSON bodies
- View response and headers

---

### ❌ Step 4: Stop Server

When done, click **❌ Close Server** to terminate the backend.

---

## 🔧 Advanced Options

### 📤 Export Demo Files

Click **📤 Export Starter Files** from the ℹ️ info popup. It will generate:

- `main.py` – with working CRUD code for SQL Server
- `DummyDB.sql` – sample SQL script to create a test database

You can run the `.sql` file in SSMS (SQL Server Management Studio) and then run `main.py` to see it all work.

---

## 🧱 Packaging as `.exe`

The app is packaged using **PyInstaller** with `--onefile` and `--add-data` options.

The tool smartly detects if it's running inside an `.exe` and temporarily copies `index.html` to a secure OS temp directory.

### Important:

If you want to build it yourself:

pyinstaller launcher.py --onefile --add-data "index.html;."
