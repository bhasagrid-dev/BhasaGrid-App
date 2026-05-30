import os
import sys
import time
import subprocess
from datetime import datetime
import re
import io
import json

# --- ENCODING FIX ---
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except:
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except:
        pass

# --- STANDALONE ANSI COLOR THEME ---
class C:
    RST  = "\033[0m"
    BOLD = "\033[1m"
    NEON_BLUE = "\033[38;5;75m"
    NEON_PURP = "\033[38;5;177m"
    NEON_CYAN = "\033[38;5;86m"
    NEON_GREEN = "\033[38;5;120m"
    GOLD = "\033[38;5;215m"
    RED  = "\033[38;5;196m"
    GRAY = "\033[38;5;242m"
    WHT  = "\033[38;5;255m"

EXCLUDE_DIRS = {
    'node_modules', '.git', '.expo', '.gradle', 'build', 
    'release', 'dist', '.venv', '.idea', '__pycache__',
    'download-portal-react', 'oracle-server-backend', 'backups'
}

TIPS = [
    "💧 Keep hydrated! Take a sip of water and stretch.",
    "🚀 Pro Tip: Run 'orbit git' to quickly stage, commit, and push your changes to GitHub.",
    "🛡 Safety: Run 'orbit check' to audit your database ports, environments, and Firebase rules.",
    "💡 Speed: Double-click 'orbit' or use the Web GUI console for a visual project dashboard.",
    "📱 Dev Run: Run 'orbit dev' to build your app and start the Metro Server instantly."
]

BUILD_PROCESSES = ["java.exe", "gradle", "eas", "electron-builder", "node.exe"]

def is_build_running(project_root):
    """Detects if compilation or builds are running to automatically throttle CPU."""
    # 1. Check active services registry
    active_services_file = os.path.join(project_root, "tools", ".active_services.json")
    if os.path.exists(active_services_file):
        try:
            with open(active_services_file, 'r') as f:
                services = json.load(f)
                # If there are active services (like full release processes), pause
                if "Full Release Sequence" in services or "Android Build" in services or "Vite Compilation" in services:
                    return True
        except:
            pass
            
    # 2. Check running tasklist on Windows
    if os.name == 'nt':
        try:
            output = subprocess.check_output("tasklist /NH /FI \"STATUS eq RUNNING\"", shell=True, text=True)
            for proc in BUILD_PROCESSES:
                if proc.lower() in output.lower():
                    return True
        except:
            pass
    return False

def scan_files(project_root):
    """Scans project files and returns a dictionary of {file_path: modification_time}."""
    file_map = {}
    for root, dirs, files in os.walk(project_root):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for file in files:
            full_path = os.path.join(root, file)
            try:
                file_map[full_path] = os.path.getmtime(full_path)
            except:
                pass
    return file_map

def main():
    tools_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(tools_dir)
    
    pid_file = os.path.join(tools_dir, ".watcher.pid")
    with open(pid_file, "w") as f:
        f.write(str(os.getpid()))
        
    print(f"\n  {C.NEON_BLUE}{C.BOLD}╭─── [ BHASAGRID AUTOMATION — WATCHER DAEMON v10.0 ] ───╮{C.RST}")
    print(f"  {C.NEON_BLUE}{C.BOLD}│{C.RST}  Real-time change monitor & CPU throttling cockpit.    {C.NEON_BLUE}{C.BOLD}│{C.RST}")
    print(f"  {C.NEON_BLUE}{C.BOLD}╰────────────────────────────────────────────────────────╯{C.RST}\n")
    print(f"  {C.GRAY}Watching project: {project_root}{C.RST}")
    print(f"  {C.GRAY}Backups destination: C:\\BhasaGrid-BackUps{C.RST}\n")
    
    last_snapshot = scan_files(project_root)
    change_accumulator = 0
    last_tip_time = time.time()
    tip_index = 0
    paused = False
    
    print(f"  {C.NEON_GREEN}● [ACTIVE] Watcher running successfully. Standing by...{C.RST}\n")
    
    try:
        while True:
            # Check for heavy build processes to throttle resource usage
            if is_build_running(project_root):
                if not paused:
                    print(f"  {C.GOLD}⏳ [THROTTLING] Heavy compilation process detected. Sleeping for 90s to free CPU...{C.RST}\n")
                    paused = True
                time.sleep(90)
                continue
            elif paused:
                print(f"  {C.NEON_GREEN}🟢 [RESUMING] Compilation complete. Watcher resuming active monitoring!{C.RST}\n")
                paused = False
                # Reset snapshot state after build to avoid false diffs
                last_snapshot = scan_files(project_root)
                
            time.sleep(10)  # Standard polling frequency
            
            current_snapshot = scan_files(project_root)
            modified_files = []
            
            for path, mtime in current_snapshot.items():
                if path not in last_snapshot:
                    modified_files.append((path, "CREATED"))
                elif last_snapshot[path] != mtime:
                    modified_files.append((path, "MODIFIED"))
                    
            for path in list(last_snapshot.keys()):
                if path not in current_snapshot:
                    modified_files.append((path, "DELETED"))
                    
            if modified_files:
                change_accumulator += len(modified_files)
                stamp = datetime.now().strftime("%H:%M:%S")
                print(f"  {C.GRAY}[{stamp}] Code changes detected:{C.RST}")
                for path, change_type in modified_files[:5]:
                    rel_p = os.path.relpath(path, project_root)
                    print(f"    {C.NEON_CYAN}● {change_type:<8}{C.RST} {rel_p}")
                if len(modified_files) > 5:
                    print(f"    {C.GRAY}... and {len(modified_files) - 5} more files.{C.RST}")
                print(f"  {C.GOLD}Total change accumulation index: {change_accumulator} / 3{C.RST}\n")
                
                last_snapshot = current_snapshot
                
                # Capped trigger at 3 modified files for safety
                if change_accumulator >= 3:
                    print(f"  {C.NEON_PURP}{C.BOLD}[AUTO-TRIGGER] Active improvements detected! Spawning background incremental backup...{C.RST}")
                    try:
                        backup_script = os.path.join(tools_dir, "backup_system.py")
                        subprocess.Popen([sys.executable, backup_script, "--silent"])
                        print(f"  {C.NEON_GREEN}✔ SUCCESS: Snapshots saved successfully!{C.RST}\n")
                    except Exception as e:
                        print(f"  {C.RED}✘ Failed to trigger auto-backup: {e}{C.RST}\n")
                    change_accumulator = 0
                    
            # Developer Reminders
            now = time.time()
            if now - last_tip_time >= 900:  # Every 15 minutes
                tip = TIPS[tip_index]
                print(f"  {C.NEON_PURP}{C.BOLD}[💡 WORKSPACE REMINDER]{C.RST} {C.WHT}{tip}{C.RST}\n")
                tip_index = (tip_index + 1) % len(TIPS)
                last_tip_time = now
                
    except KeyboardInterrupt:
        print(f"\n  {C.GRAY}Watcher daemon terminated. Closing...{C.RST}")
        if os.path.exists(pid_file):
            try: os.remove(pid_file)
            except: pass
        sys.exit(0)

if __name__ == "__main__":
    main()
