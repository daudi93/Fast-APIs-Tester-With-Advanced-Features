# Copyright (c) 2025 Qaisar Daud
# Licensed under the MIT License. See LICENSE file in the root for details.

import subprocess
import time
import tkinter as tk
from tkinter import ttk, filedialog
import threading
import webbrowser
import requests
import psutil
import os
import re

server_process = None
server_pid = None
main_file_path = None
base_url = "http://127.0.0.1:8000"
TESTER_PAGE = "index.html"

# 🔘 "ℹ️ Info" Button — shows a detailed popup with information on:

def show_info_popup():
    def export_basic_main_py():
        """Export a basic main.py file with FastAPI setup."""
        pythonContent = '''from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import pyodbc

app = FastAPI()

# SQL Server connection info
SQL_SERVER = "localhost"
SQL_DATABASE = "Dummy"
SQL_USERNAME = "admin"
SQL_PASSWORD = "01231678"

# DB connection
def get_connection():
    return pyodbc.connect(
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={{SQL_SERVER}};"
        f"DATABASE={{SQL_DATABASE}};"
        f"UID={{SQL_USERNAME}};"
        f"PWD={{SQL_PASSWORD}}"
    )

# Model
class User(BaseModel):
    userId: int
    name: str
    email: str

# Root endpoint
@app.get("/")
def root():
    return {"message": "🚀 Welcome to Dummy FastAPI Project!"}

# Create User
@app.post("/users", response_model=User)
def create_user(user: User):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO UserTbl (userId, name, email) VALUES (?, ?, ?)",
                       user.userId, user.name, user.email)
        conn.commit()
        return user
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

# Read All Users
@app.get("/users", response_model=List[User])
def get_users():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT userId, name, email FROM UserTbl")
    rows = cursor.fetchall()
    conn.close()
    return [User(userId=row[0], name=row[1], email=row[2]) for row in rows]

# Read Single User
@app.get("/users/{userId}", response_model=User)
def get_user(userId: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT userId, name, email FROM UserTbl WHERE userId = ?", userId)
    row = cursor.fetchone()
    conn.close()
    if row:
        return User(userId=row[0], name=row[1], email=row[2])
    raise HTTPException(status_code=404, detail="User not found")

# Update User
@app.put("/users/{userId}", response_model=User)
def update_user(userId: int, user: User):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE UserTbl SET name = ?, email = ? WHERE userId = ?",
                   user.name, user.email, userId)
    conn.commit()
    conn.close()
    return user

# Delete User
@app.delete("/users/{userId}")
def delete_user(userId: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM UserTbl WHERE userId = ?", userId)
    conn.commit()
    conn.close()
    return {"message": "User deleted"}

'''

        # SQL content for creating UserTbl and inserting dummy data
        sql_content = '''-- SQL Table for FastAPI Project

CREATE DATABASE Dummy;

USE Dummy;
        
CREATE TABLE UserTbl (
    userId INT PRIMARY KEY,
    name NVARCHAR(100),
    email NVARCHAR(100)
);

-- Insert dummy data
INSERT INTO UserTbl (userId, name, email) VALUES
(1, 'Alice', 'alice@example.com'),
(2, 'Bob', 'bob@example.com'),
(3, 'Charlie', 'charlie@example.com');

SELECT * FROM UserTbl;

'''

        file_path = filedialog.asksaveasfilename(
            defaultextension=".py",
            filetypes=[("Python Files", "*.py")],
            title="Save Basic main.py"
        )
        if file_path:
            base_path = os.path.splitext(file_path)[0]

        # Save main.py
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(pythonContent)

        # Save .sql file
        sql_path = base_path + ".sql"
        with open(sql_path, 'w', encoding='utf-8') as f:
            f.write(sql_content)

    def toggle_section(frame, btn):
        if frame.winfo_viewable():
            frame.pack_forget()
            btn.config(text=btn.cget("text").replace("▼", "▶"))
        else:
            frame.pack(fill="x", padx=20, pady=(0, 10))
            btn.config(text=btn.cget("text").replace("▶", "▼"))

    info_window = tk.Toplevel(root)
    info_window.title("ℹ️ FastAPI Launcher Info")
    info_window.geometry("550x500")
    info_window.configure(bg="#ffffff")

    canvas = tk.Canvas(info_window, borderwidth=0, background="#ffffff")
    frame = tk.Frame(canvas, background="#ffffff")
    scrollbar = ttk.Scrollbar(info_window, orient="vertical", command=canvas.yview)
    canvas.configure(yscrollcommand=scrollbar.set)

    scrollbar.pack(side="right", fill="y")
    canvas.pack(side="left", fill="both", expand=True)
    canvas.create_window((0, 0), window=frame, anchor="nw")

    def on_configure(event):
        canvas.configure(scrollregion=canvas.bbox("all"))
    frame.bind("<Configure>", on_configure)

    # ---------- Collapsible Sections ----------
    sections = [
        ("▶ 📂 How to Use FastAPI Launcher", 
         "1. Click '📁 Choose main.py File'\n"
         "2. Select your FastAPI main application file\n"
         "3. Click '▶ Start Server'\n"
         "4. Click '🧪 Open Tester' to test APIs"),

        ("▶ 📘 What should main.py contain?", 
         "from fastapi import FastAPI\n\n"
         "app = FastAPI()\n\n"
         "@app.get('/')\n"
         "def root():\n"
         "    return {'message': 'Hello World'}"),

        ("▶ ⚠️ Important Notes", 
         "- Make sure your file is named 'main.py' or similar\n"
         "- It should be inside a folder\n"
         "- Uvicorn must be installed\n"
         "- No port conflict on 8000"),

        ("▶ 💡 Tips", 
         "- Launcher auto-detects host & port from code\n"
         "- If server crashes, only '🔁 Retry' will be enabled")
    ]

    for title, content in sections:
        section_btn = ttk.Button(frame, text=title, command=lambda f=content: toggle_section(section_frames[f], section_buttons[f]))
        section_btn.pack(fill="x", padx=10, pady=(10, 0))

        section = tk.Frame(frame, background="#ffffff")
        label = tk.Label(section, text=content, justify="left", anchor="w", bg="#ffffff", font=("Segoe UI", 10), wraplength=480)
        label.pack(anchor="w", padx=10, pady=5)

        section_frames = {} if 'section_frames' not in locals() else section_frames
        section_buttons = {} if 'section_buttons' not in locals() else section_buttons
        section_frames[content] = section
        section_buttons[content] = section_btn

    # Export main.py Button
    export_btn = ttk.Button(frame, text="📤 Export Basic Pyhton & SQL File", command=export_basic_main_py)
    export_btn.pack(pady=20)

# ***************
# ***************

def extract_base_url(path):
    """Extract host and port from file like start_server.py or any script."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        host_match = re.search(r'--host[=\s]+([0-9\.]+)', content)
        port_match = re.search(r'--port[=\s]+([0-9]+)', content)
        host = host_match.group(1) if host_match else '127.0.0.1'
        port = port_match.group(1) if port_match else '8000'
        return f"http://{host}:{port}"
    except Exception:
        return "http://127.0.0.1:8000"

def is_server_running():
    try:
        res = requests.get(base_url, timeout=2)
        return res.status_code == 200
    except:
        return False

def start_server():
    global server_process, server_pid, main_file_path, base_url
    if not main_file_path:
        status_var.set("⚠️ Please select a main.py file")
        status_label.config(foreground="#dc3545")
        return

    module_name = os.path.splitext(os.path.basename(main_file_path))[0]
    base_url = extract_base_url(main_file_path)

    try:
        server_process = subprocess.Popen([
            "uvicorn", f"{module_name}:app", "--reload", "--host", base_url.split('//')[1].split(':')[0],
            "--port", base_url.split(':')[-1]
        ], cwd=os.path.dirname(main_file_path))
        server_pid = server_process.pid
        time.sleep(2)
    except Exception as e:
        status_var.set(f"❌ Failed to start: {e}")
        status_label.config(foreground="#dc3545")

def close_server():
    global server_process, server_pid
    if server_pid:
        try:
            proc = psutil.Process(server_pid)
            proc.terminate()
            proc.wait(timeout=5)
            server_pid = None
            server_process = None
            status_var.set("🛑 Server Closed")
            status_label.config(foreground="#dc3545")
            launch_button["state"] = "disabled"
        except Exception as e:
            status_var.set("⚠️ Error closing server")
            status_label.config(foreground="orange")
            print("Error terminating process:", e)

def launch_tester():
    webbrowser.open(TESTER_PAGE)

def check_status():
    if is_server_running():
        status_var.set(f"✅ Server is Running on {base_url}")
        status_label.config(foreground="#28a745")
        launch_button["state"] = "normal"
    else:
        status_var.set("❌ Server is NOT Running")
        status_label.config(foreground="#dc3545")
        launch_button["state"] = "disabled"

def threaded_check():
    threading.Thread(target=check_status, daemon=True).start()

def threaded_start_server():
    status_var.set("⏳ Starting Server...")
    status_label.config(foreground="#007bff")
    launch_button["state"] = "disabled"
    threading.Thread(target=start_and_verify, daemon=True).start()

def start_and_verify():
    start_server()
    for _ in range(10):
        time.sleep(1)
        if is_server_running():
            break
    root.after(100, check_status)

def select_main_file():
    global main_file_path
    path = filedialog.askopenfilename(
        filetypes=[("Python Files", "*.py")],
        title="Select Your FastAPI main.py file"
    )
    if path:
        main_file_path = path
        file_label_var.set(f"📄 Selected: {os.path.basename(path)}")
        threaded_check()

# GUI Setup
root = tk.Tk()
root.title("🌐 Test FastAPI with Auto Base URL")
root.geometry("500x430")
root.configure(bg="#f4f4f4")
root.resizable(False, False)

style = ttk.Style()
style.theme_use("clam", )
style.configure("TButton", font=("Segoe UI", 12), padding=10)
style.configure("TLabel", font=("Segoe UI", 14), background="#f4f4f8")

# Title Frame
title_frame = ttk.Frame(root)
title_frame.pack(pady=10, padx=20, fill="x", expand=True)

title_label = ttk.Label(title_frame, text="🚀 FastAPI Server Launcher", font=("Segoe UI", 18, "bold"))
title_label.pack(side="left", padx=20)

info_btn = ttk.Button(title_frame, text="ℹ️", width=3, command=show_info_popup)
info_btn.pack(side="left", padx=14, pady=6)

# File selection
file_btn = ttk.Button(root, text="📁 Choose main.py File", command=select_main_file)
file_btn.pack(pady=5)

# File Status
file_label_var = tk.StringVar()
file_label_var.set("❌ No file selected")
file_label = ttk.Label(root, textvariable=file_label_var, font=("Segoe UI", 11, "italic"), foreground="#666")
file_label.pack()

# Status label
status_var = tk.StringVar()
status_var.set("❔ Waiting for file...")
status_label = ttk.Label(root, textvariable=status_var, foreground="#ffc107")
status_label.pack(pady=10)

# Buttons
button_frame = ttk.Frame(root)
button_frame.pack(pady=20)

# Start, Retry, Close Server Buttons
start_btn = ttk.Button(button_frame, text="▶ Start Server", command=threaded_start_server)
start_btn.grid(row=0, column=0, padx=10)

retry_btn = ttk.Button(button_frame, text="🔁 Retry", command=threaded_check)
retry_btn.grid(row=0, column=1, padx=10)

close_btn = ttk.Button(button_frame, text="❌ Close Server", command=close_server)
close_btn.grid(row=0, column=2, padx=10)

launch_button = ttk.Button(root, text="🧪 Open Tester", command=launch_tester)
launch_button.pack(pady=10)
launch_button["state"] = "disabled"

# Footer
footer = ttk.Label(root, text="Qaisar Daud 👑", font=("Segoe UI", 10), foreground="#888")
footer.pack(side="bottom", pady=10)

root.mainloop()
