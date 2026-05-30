"""
BhasaGrid AUTOMATION HUB (manager.py)
======================================
Centralized command center for the BhasaGrid ecosystem.
Provides automated workflows for Android, Web, Desktop, and Cloud Deployment.

USAGE:
  python manager.py <command>
  orbit <command> (if registered globally)

AVAILABLE COMMANDS:
-------------------
  debug     : Build Android Debug APK
  release   : Build Android Release APK (v5.5+ cascading encryption ready)
  android   : Build both Debug & Release APKs
  clean     : Wipe Gradle cache and build folders
  fresh     : Full Android refresh (Clean -> Build Both)
  install   : Deploy the latest Debug APK to a connected ADB device
  phys      : Physical Device Workflow (Build Debug -> Auto-Install)
  dev       : Physical Full Flow (Build -> Install -> Start Expo Server)
  
  start     : Launch Expo Development Server (Metro)
  portal    : Launch Vite-based React Download Portal (Port 5173)
  download  : Launch Legacy Download Portal (Port 5679)
  both      : Simultaneous launch of React & Legacy Portals
  electron  : Launch Desktop environment in Dev Mode (links to localhost:8081)
  
  desktop   : Package production Windows EXE
  web       : Package production Web distribution (dist/)
  mac       : Package production macOS DMG
  linux     : Package production Linux AppImage
  all       : ULTIMATE RELEASE (Android + Desktop + Web + Firebase)

  firebase  : Full Cloud Deployment (Hosting, Functions, Rules)
  rules     : Deploy Firestore Security Rules ONLY
  git       : Interactive Git Menu (Sync, Status, Branching)
  health    : Project integrity audit (Env, Deps, Manifests)
  cleanup   : Remove production 'release/' artifacts
  
  gui       : Launch Premium Flask Dashboard (http://localhost:2004)
  setup     : Launch visual Setup Wizard for new environments
  browser   : Configure preferred browser/incognito mode
  reset     : Clear terminal and browser preferences
  register  : Set up 'orbit' as a global command in User PATH
  exit      : Terminate the Hub session

COMMON WORKFLOWS:
-----------------
1. Physical Debugging: `orbit dev`
   - Builds APK, pushes to phone via ADB, and starts the Metro bundler.
2. Production Release: `orbit all`
   - Runs full multi-platform build chain and prompts for Firebase deployment.
3. Rapid UI/UX Test: `orbit both`
   - Spins up both portals to verify cross-platform portal consistency.

DEBUG SHORTCUTS:
----------------
- Press 'K' in the Hub menu for Kernel Access (Direct Admin Shell).
- Run `orbit health` if Firestore or Auth calls fail (checks .env).
- Use `orbit electron` to test desktop-specific features like "Calc Mode".

AUTOMATION SYSTEM:
------------------
- Self-Bootstrapping: Auto-creates and activates .venv.
- Admin Elevation: Triggers UAC/Sudo prompts when needed.
- Browser Sync: Automatically pushes .env vars to the portal config.
"""


VERSION = "10.1"
LAST_UPDATED = "2026-05-30"

import os
import shutil
import subprocess
import sys
import argparse
import time
import socket
import json
import io
import atexit
from datetime import datetime
import re

# --- ENCODING FIX (Windows) ---
# Ensures Unicode characters (like splash blocks) don't crash legacy terminals
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except:
    # Final fallback for unusual environments
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except:
        pass

# ── ANSI colours (work on Windows 10+ / PowerShell / any modern terminal) ──
class C:
    RST  = "\033[0m"
    BOLD = "\033[1m"
    DIM  = "\033[2m"
    ITALIC = "\033[3m"
    UNDERLINE = "\033[4m"
    
    # Primary theme colors
    BLUE = "\033[38;5;69m"
    PURP = "\033[38;5;135m"
    CYAN = "\033[38;5;51m"
    GRN  = "\033[38;5;82m"
    YEL  = "\033[38;5;220m"
    RED  = "\033[38;5;196m"
    GRAY = "\033[38;5;240m"
    WHT  = "\033[38;5;255m"

    # Futuristic premium colors
    NEON_BLUE = "\033[38;5;75m"
    NEON_CYAN = "\033[38;5;86m"
    NEON_PURP = "\033[38;5;177m"
    NEON_PINK = "\033[38;5;201m"
    NEON_GREEN = "\033[38;5;120m"
    NEON_YELLOW = "\033[38;5;227m"
    
    VIOLET = "\033[38;5;141m"
    LAVENDER = "\033[38;5;147m"
    MINT = "\033[38;5;121m"
    GOLD = "\033[38;5;215m"
    ROSE = "\033[38;5;211m"
    
    DARK_GRAY = "\033[38;5;236m"
    MID_GRAY = "\033[38;5;243m"
    LIGHT_GRAY = "\033[38;5;249m"

def force_delete_readonly(func, path, excinfo):
    """Fallback error handler to force delete locked or read-only files on Windows."""
    import stat
    try:
        os.chmod(path, stat.S_IWRITE)
        func(path)
    except Exception:
        pass

ACTIVE_SERVICES_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tools", ".active_services.json")

def register_active_service(name, pid):
    """Registers an active background service PID to prevent port and socket leaks."""
    services = {}
    if os.path.exists(ACTIVE_SERVICES_FILE):
        try:
            with open(ACTIVE_SERVICES_FILE, 'r') as f:
                services = json.load(f)
        except:
            pass
    services[name] = pid
    try:
        with open(ACTIVE_SERVICES_FILE, 'w') as f:
            json.dump(services, f, indent=4)
    except:
        pass

def unregister_active_service(name):
    """Unregisters a service by name."""
    if os.path.exists(ACTIVE_SERVICES_FILE):
        try:
            with open(ACTIVE_SERVICES_FILE, 'r') as f:
                services = json.load(f)
            if name in services:
                del services[name]
            with open(ACTIVE_SERVICES_FILE, 'w') as f:
                json.dump(services, f, indent=4)
        except:
            pass

def terminate_all_active_services():
    """Kills all registered background processes on exit to prevent lingering port/thread leaks."""
    if not os.path.exists(ACTIVE_SERVICES_FILE):
        return
    try:
        with open(ACTIVE_SERVICES_FILE, 'r') as f:
            services = json.load(f)
    except:
        return

    if not services:
        return

    print(f"\n  {C.YEL}[*] Shutting down active background services...{C.RST}")
    for name, pid in list(services.items()):
        if os.name == 'nt':
            try:
                # Direct check if process exists before killing
                res = subprocess.run(["tasklist", "/FI", f"PID eq {pid}"], capture_output=True, text=True)
                if str(pid) in res.stdout:
                    print(f"  Stopping {C.CYAN}{name}{C.RST} (PID {pid})...")
                    subprocess.run(["taskkill", "/PID", str(pid), "/F", "/T"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except Exception as e:
                pass
        else:
            try:
                os.kill(int(pid), 9)
            except OSError:
                pass

    try:
        os.remove(ACTIVE_SERVICES_FILE)
    except:
        pass

# Automatically run service teardowns on any exit
atexit.register(terminate_all_active_services)

def log_event(category, action, status, message):
    """Unified logger in the requested format."""
    color = C.GRN if status == "SUCCESS" else (C.YEL if status == "WARN" else C.RED)
    print(f"[MANAGER][{category}][{action}] {color}{status}{C.RST}: {message}")

def verify_firebase_project(directory=None):
    """Verify that the currently active Firebase CLI project matches the .env config."""
    project_root = os.path.dirname(os.path.abspath(__file__))
    if directory is None:
        directory = os.path.join(project_root, "BhasaGrid-universal")
        
    env_path = os.path.join(directory, ".env")
    if not os.path.exists(env_path):
        env_path = os.path.join(project_root, ".env")
        
    if not os.path.exists(env_path):
        log_event("firebase", "selectProject", "WARN", f".env file not found. Skipping verification.")
        return True
        
    env_project_id = None
    try:
        with open(env_path, 'r') as f:
            for line in f:
                if line.strip().startswith("FIREBASE_PROJECT_ID"):
                    env_project_id = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    except Exception as e:
        log_event("firebase", "selectProject", "WARN", f"Could not read .env: {e}")
        return True

    if not env_project_id:
        log_event("firebase", "selectProject", "WARN", "FIREBASE_PROJECT_ID not defined in .env.")
        return True

    try:
        # Check active firebase project
        res = subprocess.run(["firebase", "use"], cwd=directory, capture_output=True, text=True, shell=True)
        active_output = res.stdout.strip()
        
        # Matches: "Active project: <id>"
        match = re.search(r"Active project:\s*([a-zA-Z0-9\-_]+)", active_output)
        if match:
            active_project = match.group(1).strip()
            if active_project != env_project_id:
                log_event("firebase", "selectProject", "WARN", f"Active Firebase CLI project is '{active_project}', but .env specifies '{env_project_id}'!")
                confirm = input("  Are you sure you want to deploy anyway? (y/n): ").lower()
                return confirm == 'y'
            else:
                log_event("firebase", "selectProject", "SUCCESS", f"Active Firebase project matches .env config: '{env_project_id}'")
        else:
            log_event("firebase", "selectProject", "WARN", f"Could not parse active Firebase project from CLI. Ensure you ran 'firebase use <project_name>'.")
    except Exception as e:
        log_event("firebase", "selectProject", "WARN", f"Could not execute 'firebase use' to verify active project: {e}")
    return True

# --- VENV BOOTSTRAP ---
def bootstrap_venv():
    """Ensures the script runs within a virtual environment."""
    project_root = os.path.dirname(os.path.abspath(__file__))
    venv_dir = os.path.normpath(os.path.join(project_root, ".venv"))
    
    # Normalize paths for robust comparison (handles Windows casing/slashes)
    current_prefix = os.path.normpath(sys.prefix)
    
    # Check if we are already running in the venv
    if current_prefix.lower() == venv_dir.lower():
        return

    # Create venv if it doesn't exist
    if not os.path.exists(venv_dir):
        print(f"[*] Creating virtual environment in {venv_dir}...")
        subprocess.check_call([sys.executable, "-m", "venv", venv_dir])
        print("[+] Virtual environment created.")

    # Determine the venv python executable
    if os.name == "nt":  # Windows
        venv_python = os.path.join(venv_dir, "Scripts", "python.exe")
    else:  # Linux/macOS
        venv_python = os.path.join(venv_dir, "bin", "python")

    if not os.path.exists(venv_python):
        print(f"[!] Error: Could not find venv python at {venv_python}")
        sys.exit(1)

    # Re-execute the script using the venv python
    print(f"[*] Switching to virtual environment...")
    
    # Use a flag to prevent recursion just in case
    os.environ["SKIP_VENV_BOOTSTRAP"] = "1"
    
    try:
        # On Windows, subprocess is more stable than os.execv for re-execution
        if os.name == 'nt':
            sys.exit(subprocess.call([venv_python] + sys.argv))
        else:
            os.execv(venv_python, [venv_python] + sys.argv)
    except Exception as e:
        # Final fallback
        print(f"[!] Bootstrap failed: {e}")
        sys.exit(1)

# Run bootstrap before anything else
if __name__ == "__main__":
    project_root = os.path.dirname(os.path.abspath(__file__))
    venv_dir = os.path.normpath(os.path.join(project_root, ".venv"))
    current_prefix = os.path.normpath(sys.prefix)
    
    if current_prefix.lower() != venv_dir.lower() and "SKIP_VENV_BOOTSTRAP" not in os.environ:
        print("\n  [*] Warming up BhasaGrid Console...")
        bootstrap_venv()

def main():
    flush_input()
    show_splash()

# ── Enable ANSI and Disable Echo on Windows ──
def set_terminal_mode(echo=True):
    if os.name == "nt":
        import ctypes
        kernel32 = ctypes.windll.kernel32
        h_input = kernel32.GetStdHandle(-10) # STD_INPUT_HANDLE
        mode = ctypes.c_uint32()
        kernel32.GetConsoleMode(h_input, ctypes.byref(mode))
        
        ENABLE_ECHO_INPUT = 0x0004
        if echo:
            mode.value |= ENABLE_ECHO_INPUT
        else:
            mode.value &= ~ENABLE_ECHO_INPUT
            
        kernel32.SetConsoleMode(h_input, mode)

if os.name == "nt":
    import ctypes
    # Enable ANSI
    ctypes.windll.kernel32.SetConsoleMode(
        ctypes.windll.kernel32.GetStdHandle(-11), 7
    )
    # Start with echo OFF
    set_terminal_mode(False)

def _type(text, delay=0):
    """Typing effect for text output."""
    if delay > 0:
        for char in text:
            sys.stdout.write(char)
            sys.stdout.flush()
            time.sleep(delay)
        sys.stdout.write('\n')
    else:
        print(text)

def flush_input():
    """Aggressively clears the terminal input buffer."""
    try:
        if os.name == 'nt':
            import msvcrt
            # Drain the buffer completely
            while msvcrt.kbhit():
                msvcrt.getch()
        else:
            import sys, termios
            termios.tcflush(sys.stdin, termios.TCIFLUSH)
    except:
        pass

def get_key():
    """Gets a single keypress without echoing it to the screen."""
    if os.name == 'nt':
        import msvcrt
        # Wait for a key to be pressed
        while not msvcrt.kbhit():
            time.sleep(0.01)
        
        try:
            # Read the key
            char = msvcrt.getwch().lower()
            # Immediately flush any accidental trailing repeats
            while msvcrt.kbhit():
                msvcrt.getch()
            return char
        except:
            return None
    else:
        import tty, termios
        fd = sys.stdin.fileno()
        old_settings = termios.tcgetattr(fd)
        try:
            tty.setraw(sys.stdin.fileno())
            ch = sys.stdin.read(1)
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
        return ch.lower()

def _loading_bar(label, total=30, width=36, color=None, fill_char='█', empty_char='░'):
    """Renders a smooth animated loading bar in-place."""
    bar_color = color or C.PURP
    for i in range(total + 1):
        filled = int(width * i / total)
        bar = fill_char * filled + empty_char * (width - filled)
        pct = int(100 * i / total)
        sys.stdout.write(f"\r  {bar_color}{bar}{C.RST}  {C.GRAY}{pct:3d}%{C.RST}  {C.DIM}{label}{C.RST}")
        sys.stdout.flush()
        time.sleep(0.03)
    print()

def show_splash(restarted=False):
    os.system('cls' if os.name == 'nt' else 'clear')

    logo_fast = os.environ.get("ORBIT_FAST_MODE") == "1" or restarted

    if restarted:
        print(f"{C.CYAN}{'=' * 62}{C.RST}")
        print(f"  {C.BOLD}BhasaGrid PROJECT HUB{C.RST} {C.GRAY}│ v{VERSION}{C.RST} {C.GRN}(QUICK RELOAD){C.RST}")
        print(f"{C.CYAN}{'=' * 62}{C.RST}\n")
        return

    # ── Cinematic first-boot sequence ──────────────────────────────
    # Phase 1: Boot messages fade in
    boot_msgs = [
        (C.GRAY,  "  Initializing BhasaGrid runtime..."),
        (C.GRAY,  "  Loading project manifests..."),
        (C.GRAY,  "  Resolving module graph..."),
        (C.CYAN,  "  Activating virtual environment..."),
        (C.PURP,  "  Warming up automation hub..."),
    ]
    for color, msg in boot_msgs:
        _type(f"{color}{msg}{C.RST}", delay=0.012)
        time.sleep(0.06)

    print()
    # Phase 2: Loading bar
    _loading_bar("Bootstrapping core modules", total=35, color=C.PURP)
    time.sleep(0.15)

    # Phase 3: Clear and reveal logo
    os.system('cls' if os.name == 'nt' else 'clear')

    term_width = shutil.get_terminal_size((80, 20)).columns

    if term_width >= 82:
        logo = [
            f"{C.BLUE}{C.BOLD}  ╔═════════════════════════════════════════════════════════════════════════╗{C.RST}",
            f"{C.BLUE}{C.BOLD}  ║   ██████╗ ██╗  ██╗ █████╗ ███████╗ █████╗  ██████╗ ██████╗ ██╗██████╗   ║{C.RST}",
            f"{C.CYAN}{C.BOLD}  ║   ██╔══██╗██║  ██║██╔══██╗██╔════╝██╔══██╗██╔════╝ ██╔══██╗██║██╔══██╗   ║{C.RST}",
            f"{C.PURP}{C.BOLD}  ║   ██████╦╝███████║███████║███████╗███████║██║  ███╗██████╔╝██║██║  ██║   ║{C.RST}",
            f"{C.PURP}{C.BOLD}  ║   ██╔══██╗██╔══██║██╔══██║╚════██║██╔══██║██║   ██║██╔══██╗██║██║  ██║   ║{C.RST}",
            f"{C.BLUE}{C.BOLD}  ║   ██████╦╝██║  ██║██║  ██║███████║██║  ██║╚██████╔╝██║  ██║██║██████╔╝   ║{C.RST}",
            f"{C.BLUE}{C.BOLD}  ║   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝╚═════╝   ║{C.RST}",
            f"{C.BLUE}{C.BOLD}  ╚═════════════════════════════════════════════════════════════════════════╝{C.RST}",
        ]
    else:
        # Responsive fallback for narrow terminal windows
        box_width = max(34, term_width - 8)
        padding = (box_width - 23) // 2
        pad_str = " " * padding
        pad_str_right = " " * (box_width - 23 - padding)
        logo = [
            f"{C.BLUE}{C.BOLD}  ╔{'═' * box_width}╗{C.RST}",
            f"{C.CYAN}{C.BOLD}  ║{pad_str}B H A S A G R I D   H U B{pad_str_right}║{C.RST}",
            f"{C.BLUE}{C.BOLD}  ╚{'═' * box_width}╝{C.RST}",
        ]
    for line in logo:
        print(line)
        time.sleep(0.07)  # Smooth scan-line reveal

    print()
    _type(f"  {C.GRAY}Project Console  ·  v{VERSION}  ·  BhasaGrid Dev Tools{C.RST}", delay=0.018)
    print(f"  {C.GRAY}{'─' * 62}{C.RST}")
    time.sleep(0.2)

    # Phase 4: Status indicators
    status_items = [
        (C.GRN,  "●", "Environment ready"),
        (C.BLUE, "●", "All modules loaded"),
        (C.PURP, "●", "Automation hub online"),
    ]
    for color, dot, label in status_items:
        _type(f"  {color}{dot}{C.RST}  {label}", delay=0.01)
        time.sleep(0.1)

    time.sleep(0.3)
    print()

def self_upgrade_version():
    """Allows the script to modify its own version and restart."""
    global VERSION
    print(f"\n  {C.CYAN}{C.BOLD}--- [SYSTEM UPGRADE] ---{C.RST}")
    print(f"  Current Version: {C.WHT}{VERSION}{C.RST}")
    
    try:
        next_v = f"{float(VERSION) + 1.0:.1f}"
    except:
        next_v = "1.0"
        
    print(f"  Suggested Next:  {C.GRN}{next_v}{C.RST}")
    print(f"  {C.GRAY}(Press Enter for suggested, or type a new version){C.RST}")
    
    new_v = input(f"  New Version > ").strip()
    if not new_v: new_v = next_v
    
    confirm = input(f"  Confirm upgrade to v{new_v}? (y/n): ").lower()
    if confirm != 'y': return False
    
    # Modify manager.py
    script_path = os.path.abspath(__file__)
    try:
        with open(script_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        with open(script_path, 'w', encoding='utf-8') as f:
            for line in lines:
                if line.startswith('VERSION ='):
                    f.write(f'VERSION = "{new_v}"\n')
                elif line.startswith('LAST_UPDATED ='):
                    today = datetime.now().strftime('%Y-%m-%d')
                    f.write(f'LAST_UPDATED = "{today}"\n')
                else:
                    f.write(line)
        
        print(f"\n  {C.GRN}✔ Version upgraded to v{new_v}! Restarting...{C.RST}")
        time.sleep(1)
        os.execv(sys.executable, [sys.executable] + sys.argv)
    except Exception as e:
        print(f"  {C.RED}✘ Failed to modify source: {e}{C.RST}")
        return False

def is_admin():
    """Checks if the script is running with administrative privileges."""
    try:
        if os.name == 'nt':
            return ctypes.windll.shell32.IsUserAnAdmin() != 0
        else:
            return os.getuid() == 0
    except:
        return False

def elevate_privileges():
    """Restarts the current script with administrative privileges."""
    if os.name == 'nt':
        print(f"\n  {C.YEL}[*] Attempting to elevate to Administrator...{C.RST}")
        script = os.path.abspath(__file__)
        params = ' '.join([f'"{arg}"' for arg in sys.argv[1:]])
        try:
            # ShellExecuteW with 'runas' verb triggers the UAC prompt
            ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, f'"{script}" {params}', None, 1)
            sys.exit(0)
        except Exception as e:
            print(f"  {C.RED}✘ Elevation failed: {e}{C.RST}")
            return False
    else:
        print(f"\n  {C.YEL}[*] Please restart with 'sudo python manager.py'{C.RST}")
        return False

def launch_system_shell():
    """Allows manual command entry with a persistent terminal feel."""
    if not is_admin():
        print(f"\n  {C.RED}✘ Access Denied.{C.RST} System Shell requires Administrative privileges.")
        print(f"  {C.CYAN}Would you like to elevate this terminal? (y/n):{C.RST} ", end='', flush=True)
        if get_key() == 'y':
            elevate_privileges()
        return False
    
    print(f"\n  {C.RED}{C.BOLD}--- [KERNEL ACCESS: ADMINISTRATIVE SHELL] ---{C.RST}")
    print(f"  {C.GRAY}Interactive mode active. Type 'exit' to return to Hub.{C.RST}")
    
    while True:
        try:
            cwd = os.getcwd()
            # Modern prompt style
            prompt = f"\n  {C.BLUE}{C.BOLD}ADMIN{C.RST} {C.GRAY}in{C.RST} {C.CYAN}{cwd}{C.RST}\n  {C.RED}#{C.RST} "
            cmd = input(prompt).strip()
            
            if cmd.lower() in ['exit', 'quit', 'back']: break
            if not cmd: continue
            
            # Execute and keep terminal context
            subprocess.call(cmd, shell=True)
        except KeyboardInterrupt:
            print("\n  Use 'exit' to leave the shell.")
            continue
        except Exception as e:
            print(f"  {C.RED}Error: {e}{C.RST}")
    return True



def get_terminal_choice():
    """Retrieves the user's preferred terminal mode from JSON."""
    if os.path.exists(TERMINAL_CHOICE_FILE):
        try:
            with open(TERMINAL_CHOICE_FILE, 'r') as f:
                content = f.read().strip()
                if not content: return None
                # Check if it's JSON or legacy plain text
                if content.startswith('{'):
                    data = json.loads(content)
                    return data.get("choice")
                else:
                    return content # Legacy support
        except:
            return None
    return None

def reset_terminal_choice():
    """Clears the saved terminal preference."""
    if os.path.exists(TERMINAL_CHOICE_FILE):
        os.remove(TERMINAL_CHOICE_FILE)
        print(f"  {C.GRN}✔ Terminal preference reset. You will be asked on next launch.{C.RST}")
    else:
        print(f"  {C.YEL}! No saved preference found.{C.RST}")

def ask_terminal():
    """Ask user whether to run in current terminal or open a new window."""
    saved_choice = get_terminal_choice()
    
    if saved_choice:
        choice = saved_choice
    else:
        print(f"  {C.YEL}{C.BOLD}Where would you like to run?{C.RST}")
        print(f"  {C.WHT} 1{C.RST}  {C.CYAN}Current terminal{C.RST}   {C.GRAY}(interactive menu here){C.RST}")
        print(f"  {C.WHT} 2{C.RST}  {C.PURP}New terminal window{C.RST} {C.GRAY}(opens a fresh cmd/pwsh tab){C.RST}")
        print(f"  {C.WHT} G{C.RST}  {C.BLUE}Launch GUI Console{C.RST}  {C.GRAY}(visual project manager){C.RST}")
        print()
        set_terminal_mode(True)
        choice = input(f"  {C.BOLD}>{C.RST} ").strip().lower()
        
        if choice in ['1', '2', 'g']:
            save = input(f"\n  {C.CYAN}Save this choice for future? (y/n):{C.RST} ").strip().lower()
            if save == 'y':
                labels = {"1": "Current Terminal", "2": "New Terminal Window", "g": "GUI Console"}
                data = {
                    "choice": choice,
                    "label": labels.get(choice, "Unknown"),
                    "saved_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
                with open(TERMINAL_CHOICE_FILE, 'w') as f:
                    json.dump(data, f, indent=4)
                print(f"  {C.GRN}✔ Preference saved to .terminal_choice{C.RST}")
        set_terminal_mode(False)

    if choice == '2':
        script = os.path.abspath(__file__)
        if os.name == 'nt':
            wt = shutil.which('wt')
            if wt:
                subprocess.Popen([wt, 'new-tab', '--title', 'BhasaGrid Manager',
                                  sys.executable, script])
            else:
                os.system(f'start cmd /k "{sys.executable} {script}"')
        else:
            os.system(f'gnome-terminal -- {sys.executable} {script} &')
        print(f"\n  {C.GRN}Launched in new window.{C.RST}")
        sys.exit(0)
    elif choice == 'g':
        print(f"\n  {C.YEL}{C.BOLD}Which GUI version would you like to launch?{C.RST}")
        print(f"  {C.WHT} 1{C.RST}  {C.BLUE}Premium Flask GUI{C.RST}  {C.GRAY}(Web-based, Glassy Design){C.RST}")
        print(f"  {C.WHT} 2{C.RST}  {C.PURP}Classic Desktop GUI{C.RST} {C.GRAY}(Native Tkinter Window){C.RST}")
        
        set_terminal_mode(True)
        g_choice = input(f"\n  {C.BOLD}>{C.RST} ").strip()
        set_terminal_mode(False)
        if g_choice == '1':
            launch_flask_gui()
        else:
            launch_tkinter_gui()
        sys.exit(0)

# Configuration
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(PROJECT_ROOT)  # Force active working directory synchronization to fix Windows UAC System32 resets
DOWNLOAD_PORTAL_DIR = os.path.join(PROJECT_ROOT, "download-portal")  # legacy static portal
REACT_PORTAL_DIR = os.path.join(PROJECT_ROOT, "download-portal-react")  # new Vite/React portal
UNIVERSAL_DIR = os.path.join(PROJECT_ROOT, "BhasaGrid-universal")
ANDROID_DIR = os.path.join(UNIVERSAL_DIR, "android")
TOOLS_DIR = os.path.join(PROJECT_ROOT, "tools")
GUI_DIR = os.path.join(TOOLS_DIR, "gui")
BROWSER_CHOICE_FILE = os.path.join(TOOLS_DIR, ".browser_choice")
TERMINAL_CHOICE_FILE = os.path.join(TOOLS_DIR, ".terminal_choice")

def clear_terminal():
    os.system('cls' if os.name == 'nt' else 'clear')
    return False

def draw_card(title, items, footer="", color_theme=C.PURP, width=78):
    """Draws a beautiful accented terminal panel with perfect closed borders on all sides."""
    import unicodedata
    T = color_theme + C.BOLD
    R = C.RST
    
    def visible_len(text):
        clean_text = re.sub(r'\033\[[0-9;]*m', '', text)
        length = 0
        for char in clean_text:
            if unicodedata.east_asian_width(char) in ('W', 'F'):
                length += 2
            else:
                length += 1
        return length
    
    # Dynamically expand width to fit long items if needed
    max_item_len = max(visible_len(item) for item in items) if items else 0
    width = max(width, max_item_len + 6)
    
    title_clean = re.sub(r'\033\[[0-9;]*m', '', title)
    title_len = len(title_clean)
    
    dash_count = max(2, width - title_len - 10)
    border_top = f"  {color_theme}╭═══ {T}[ {title} ]{color_theme}{'═' * dash_count}╮{R}"
    print(border_top)
    
    for item in items:
        item_len = visible_len(item)
        padding = max(0, width - item_len - 6)
        print(f"  {color_theme}║{R}  {item}{' ' * padding}  {color_theme}║{R}")
        
    if footer:
        footer_clean = re.sub(r'\033\[[0-9;]*m', '', footer)
        visible_foot_len = len(footer_clean)
        foot_dash_count = max(2, width - visible_foot_len - 6)
        border_bot = f"  {color_theme}╚═══ {C.BOLD}{footer}{C.RST}{color_theme}{'═' * foot_dash_count}╝{R}"
    else: 
        border_bot = f"  {color_theme}╚{'═' * (width - 2)}╝{R}"
    print(border_bot)
def print_hub_header(active_tab=""):
    clear_terminal()
    registered = f"{C.NEON_GREEN}ACTIVE{C.RST}" if shutil.which("orbit") else f"{C.GRAY}NOT INSTALLED{C.RST}"
    admin_status = f"  {C.NEON_RED}{C.BOLD}[ADMIN MODE]{C.RST}" if is_admin() else ""
    
    print(f"\n  {C.NEON_BLUE}{C.BOLD}BHASAGRID AUTOMATION HUB{C.RST} {C.GRAY}│ v{VERSION}{admin_status}{C.RST}")
    print(f"  {C.GRAY}CLI PATH: {registered}  ·  DATE: {LAST_UPDATED}  ·  TAB: {active_tab}{C.RST}")
    print(f"  {C.GRAY}{'─' * 78}{C.RST}\n")

def ask_server_terminal(label):
    """Asks user whether to run a long-running server in current or new window."""
    print(f"\n  {C.YEL}{C.BOLD}Launch Mode: {label}{C.RST}")
    print(f"  {C.WHT} 1.{C.RST} {C.CYAN}Current terminal{C.RST}   {C.GRAY}(Blocks this menu until server stops){C.RST}")
    print(f"  {C.WHT} 2.{C.RST} {C.PURP}New external window{C.RST} {C.GRAY}(Recommended for multi-tasking){C.RST}")
    
    print(f"\n  {C.BOLD}Select (1-2) [Default 2] >{C.RST} ", end='', flush=True)
    choice = get_key()
    return choice if choice in ['1', '2'] else '2'

def wait_for_port(port, host='localhost', timeout=15.0):
    """Wait until a port is open on a host."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.create_connection((host, port), timeout=1.0):
                return True
        except (socket.timeout, ConnectionRefusedError, OSError):
            time.sleep(0.5)
    return False

def get_preferred_browser_config(trigger_setup=False):
    """Retrieves the browser config. Optionally triggers setup if missing."""
    if os.path.exists(BROWSER_CHOICE_FILE):
        try:
            with open(BROWSER_CHOICE_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
            
    if trigger_setup:
        print(f"\n  {C.YEL}! No browser preference found.{C.RST}")
        set_preferred_browser()
        return get_preferred_browser_config(trigger_setup=False)
        
    return {"browser": "default", "incognito": False}

def get_preferred_browser():
    """Retrieves just the browser ID."""
    return get_preferred_browser_config().get("browser", "default")

def update_browser_config(new_data):
    """Updates the browser JSON config with new keys."""
    data = get_preferred_browser_config()
    data.update(new_data)
    with open(BROWSER_CHOICE_FILE, 'w') as f:
        json.dump(data, f, indent=4)

def sync_env_to_portal():
    """Syncs .env variables to the Download Portal's JS config file."""
    # Prioritize download-portal/.env, fall back to project root/.env
    env_path = os.path.join(DOWNLOAD_PORTAL_DIR, ".env")
    if not os.path.exists(env_path):
        env_path = os.path.join(PROJECT_ROOT, ".env")
    
    if not os.path.exists(env_path):
        print(f"  {C.RED}! .env file not found at {env_path}{C.RST}")
        return False

    # Read .env
    env_data = {}
    try:
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'): continue
                if '=' in line:
                    key, val = line.split('=', 1)
                    env_data[key.strip()] = val.strip()
    except Exception as e:
        print(f"  {C.RED}! Failed to read .env for Virtual Sync: {e}{C.RST}")
        return False

    # Extract keys with fallback (supports both portal-specific and general keys)
    api_key = env_data.get('PORTAL_FIREBASE_API_KEY') or env_data.get('FIREBASE_API_KEY', '')
    auth_domain = env_data.get('PORTAL_FIREBASE_AUTH_DOMAIN') or env_data.get('FIREBASE_AUTH_DOMAIN', '')
    project_id = env_data.get('PORTAL_FIREBASE_PROJECT_ID') or env_data.get('FIREBASE_PROJECT_ID', '')
    storage_bucket = env_data.get('PORTAL_FIREBASE_STORAGE_BUCKET') or env_data.get('FIREBASE_STORAGE_BUCKET', '')
    messaging_sender_id = env_data.get('PORTAL_FIREBASE_MESSAGING_SENDER_ID') or env_data.get('FIREBASE_MESSAGING_SENDER_ID', '')
    app_id = env_data.get('PORTAL_FIREBASE_APP_ID') or env_data.get('FIREBASE_APP_ID', '')
    measurement_id = env_data.get('PORTAL_FIREBASE_MEASUREMENT_ID') or env_data.get('FIREBASE_MEASUREMENT_ID', '')

    js_content = f"""/**
 * BhasaGrid Firebase Configuration (Automatically Sync'd)
 */
window.BhasaGrid_FIREBASE_CONFIG = {{
    apiKey: "{api_key}",
    authDomain: "{auth_domain}",
    projectId: "{project_id}",
    storageBucket: "{storage_bucket}",
    messagingSenderId: "{messaging_sender_id}",
    appId: "{app_id}",
    measurementId: "{measurement_id}"
}};

// Auto-Init
(function() {{
    try {{
        if (typeof firebase !== 'undefined') {{
            if (!firebase.apps || !firebase.apps.length) {{
                firebase.initializeApp(window.BhasaGrid_FIREBASE_CONFIG);
                console.log("[Firebase] App initialized successfully");
            }}
            if (typeof firebase.auth === 'function') window.auth = firebase.auth();
            if (typeof firebase.firestore === 'function') window.db = firebase.firestore();
        }}
    }} catch (error) {{
        console.error("[Firebase] Init error:", error);
    }}
}})();
"""

    # Escape for BrowserSync JSON config
    js_content_escaped = js_content.replace('"', '\\"').replace('\n', '\\n')
    
    bs_config = f"""
module.exports = {{
    server: "src",
    port: 5679,
    files: ["src"],
    noNotify: true,
    ui: false,
    open: false,
    middleware: [
        {{
            route: "/js/firebase-config.js",
            handle: function (req, res, next) {{
                res.setHeader("Content-Type", "application/javascript");
                res.end("{js_content_escaped}");
            }}
        }}
    ]
}};
"""
    try:
        # 1. Write BrowserSync config
        bs_config_path = os.path.join(DOWNLOAD_PORTAL_DIR, "bs-config.js")
        with open(bs_config_path, 'w') as f:
            f.write(bs_config)
        
        # 2. Write physical config to src/js/firebase-config.js to ensure deployment contains it
        physical_file = os.path.join(DOWNLOAD_PORTAL_DIR, "src", "js", "firebase-config.js")
        os.makedirs(os.path.dirname(physical_file), exist_ok=True)
        with open(physical_file, 'w', encoding='utf-8') as f:
            f.write(js_content)
            
        print(f"  {C.GRN}✔ Synced .env config to both local middleware and physical config file!{C.RST}")
        return True
    except Exception as e:
        print(f"  {C.RED}! Failed to generate Sync Config: {e}{C.RST}")
        return False

def detect_browsers():
    """Detects which browsers are installed on the system."""
    browsers = []
    
    # Common Windows paths and commands
    known_browsers = [
        {"id": "chrome", "name": "Google Chrome", "exec": "chrome"},
        {"id": "msedge", "name": "Microsoft Edge", "exec": "msedge"},
        {"id": "firefox", "name": "Mozilla Firefox", "exec": "firefox"},
        {"id": "brave", "name": "Brave Browser", "exec": "brave"},
        {"id": "opera", "name": "Opera", "exec": "opera"},
    ]
    
    for b in known_browsers:
        # Check if it's in PATH or if the 'start' command can find it
        if shutil.which(b["exec"]):
            browsers.append(b)
        elif os.name == 'nt':
            # On Windows, 'start' can often find these even if not in PATH
            # We'll do a quick check in common Program Files paths as well
            paths = [
                os.path.expandvars(f"%ProgramFiles%\\Google\\Chrome\\Application\\{b['exec']}.exe"),
                os.path.expandvars(f"%ProgramFiles(x86)%\\Google\\Chrome\\Application\\{b['exec']}.exe"),
                os.path.expandvars(f"%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\{b['exec']}.exe"),
                os.path.expandvars(f"%ProgramFiles%\\Mozilla Firefox\\{b['exec']}.exe"),
                os.path.expandvars(f"%ProgramFiles%\\BraveSoftware\\Brave-Browser\\Application\\{b['exec']}.exe"),
            ]
            if any(os.path.exists(p) for p in paths) or b['id'] in ['chrome', 'msedge']:
                # Chrome and Edge are almost always available via 'start' on modern Windows
                browsers.append(b)
                
    return browsers

def set_preferred_browser():
    """Asks the user to select from detected browsers."""
    available = detect_browsers()
    
    print(f"\n  {C.YEL}{C.BOLD}Detected Browsers on your system:{C.RST}")
    for i, b in enumerate(available, 1):
        print(f"  {C.WHT} {i}{C.RST}  {C.CYAN}{b['name']}{C.RST}")
    
    print(f"  {C.WHT} D{C.RST}  {C.GRAY}System Default{C.RST}")
    
    choice = input(f"\n  {C.BOLD}Select choice (1-{len(available)} or D):{C.RST} ").strip().lower()
    
    browser_id = "default"
    label = "System Default"
    incognito = False
    
    if choice != 'd':
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(available):
                browser_id = available[idx]['id']
                label = available[idx]['name']
                
                # Ask about incognito
                inc_choice = input(f"  {C.CYAN}Use Private/Incognito mode? (y/n):{C.RST} ").strip().lower()
                incognito = (inc_choice == 'y')
        except ValueError:
            pass
            
    data = {
        "browser": browser_id,
        "label": label,
        "incognito": incognito,
        "saved_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    with open(BROWSER_CHOICE_FILE, 'w') as f:
        json.dump(data, f, indent=4)
    
    mode_str = " (Incognito)" if incognito else ""
    print(f"  {C.GRN}✔ Preference saved: {label}{mode_str}{C.RST}")
    return browser_id

def open_url(url, force_incognito=None):
    """Opens a URL with optional incognito support. Triggers setup if no config exists."""
    config = get_preferred_browser_config(trigger_setup=True)
    browser = config.get("browser", "default")
    incognito = config.get("incognito", False)
    
    if force_incognito is not None:
        incognito = force_incognito
    
    if os.name == 'nt':
        if browser == "default":
            os.system(f'start "" "{url}"')
        else:
            # Browser-specific flags
            flags = ""
            if incognito:
                if browser == "chrome": flags = "--incognito"
                elif browser == "msedge": flags = "-inprivate"
                elif browser == "firefox": flags = "-private-window"
                elif browser == "brave": flags = "--incognito"
                elif browser == "opera": flags = "--private"
            
            os.system(f'start {browser} {flags} "{url}"')
    else:
        # Linux/macOS
        if browser == "default":
            os.system(f'open "{url}"' if sys.platform == "darwin" else f'xdg-open "{url}"')
        else:
            flags = ""
            if incognito:
                if browser == "chrome": flags = "--incognito"
                elif browser == "firefox": flags = "--private-window"
            os.system(f'{browser} {flags} "{url}" &')

def clear_terminal():
    os.system('cls' if os.name == 'nt' else 'clear')

def check_dual_messenger_compatibility():
    manifest_path = os.path.join(ANDROID_DIR, "app", "src", "main", "AndroidManifest.xml")
    if not os.path.exists(manifest_path):
        return False, "AndroidManifest.xml not found."
    
    try:
        with open(manifest_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'com.samsung.android.dualmessenger.ENABLED' in content and 'value="true"' in content:
                return True, "Dual Messenger compatibility is ENABLED in AndroidManifest.xml."
            else:
                return False, "Dual Messenger compatibility meta-data NOT found in AndroidManifest.xml."
    except Exception as e:
        return False, f"Error checking manifest: {e}"

def auto_heal_android_sdk():
    """Checks for missing local.properties and ANDROID_HOME, and automatically generates/heals it."""
    lp_path = os.path.join(ANDROID_DIR, "local.properties")
    if os.path.exists(lp_path):
        return True, f"local.properties already exists at {lp_path}"

    log_event("health", "checkAndroidSDK", "WARN", "local.properties file is missing in android project.")
    
    # Check environment variables
    sdk_path = os.environ.get("ANDROID_HOME") or os.environ.get("ANDROID_SDK_ROOT")
    if sdk_path and os.path.isdir(sdk_path):
        log_event("health", "checkAndroidSDK", "INFO", f"Detected Android SDK via env ANDROID_HOME: {sdk_path}")
    else:
        # Let's try to guess the default SDK path based on current user / OS
        user_home = os.path.expanduser("~")
        possible_paths = []
        if os.name == 'nt': # Windows
            possible_paths.append(os.path.join(user_home, "AppData", "Local", "Android", "Sdk"))
            # Fallback to sreya explicitly since we know it's there
            possible_paths.append(r"C:\Users\sreya\AppData\Local\Android\Sdk")
        elif sys.platform == "darwin": # macOS
            possible_paths.append(os.path.join(user_home, "Library", "Android", "sdk"))
        else: # Linux
            possible_paths.append(os.path.join(user_home, "Android", "Sdk"))
            possible_paths.append(os.path.join(user_home, "android-sdk"))
            possible_paths.append("/usr/lib/android-sdk")

        for path in possible_paths:
            if os.path.isdir(path):
                sdk_path = path
                break

    if sdk_path:
        try:
            # Format path correctly for properties files (requires double backslashes in properties file for Windows)
            formatted_path = sdk_path.replace("\\", "/")
            with open(lp_path, 'w', encoding='utf-8') as f:
                f.write(f"# Auto-generated by BhasaGrid Manager Hub\n")
                f.write(f"sdk.dir={formatted_path}\n")
            log_event("health", "autoHealSDK", "SUCCESS", f"Generated local.properties pointing to: {sdk_path}")
            return True, f"Successfully created local.properties pointing to {sdk_path}"
        except Exception as e:
            log_event("health", "autoHealSDK", "FAILED", f"Failed to write local.properties: {e}")
            return False, f"Failed to write local.properties: {e}"
    else:
        log_event("health", "autoHealSDK", "FAILED", "Could not locate Android SDK path. Please configure ANDROID_HOME environment variable.")
        return False, "Could not locate Android SDK path."

def check_project_health():
    """Runs a deep series of security, network, and environmental checks."""
    print(f"\n{C.BOLD}--- [DEEP PROJECT DIAGNOSTIC HUB] ---{C.RST}")
    
    issues = []
    warnings = []
    
    # 1. Check for .env file (Required for Firebase security)
    env_path = os.path.join(UNIVERSAL_DIR, ".env")
    if not os.path.exists(env_path):
        issues.append(f"config: .env file missing in {UNIVERSAL_DIR}. Firebase will not work.")
    else:
        print(f"  {C.GRN}✔{C.RST} Environment: .env file found.")

    # 2. Check for google-services.json (Ignored by git but needed for build)
    gs_path = os.path.join(ANDROID_DIR, "app", "google-services.json")
    if not os.path.exists(gs_path):
        warnings.append(f"build: google-services.json missing in {os.path.dirname(gs_path)}. Android builds may fail.")
    else:
        print(f"  {C.GRN}✔{C.RST} Firebase Android: google-services.json found.")

    # 3. Check for node_modules
    for d in [UNIVERSAL_DIR, REACT_PORTAL_DIR, DOWNLOAD_PORTAL_DIR]:
        nm_path = os.path.join(d, "node_modules")
        if not os.path.exists(nm_path):
            issues.append(f"deps: node_modules missing in {os.path.basename(d)}. Run 'npm install'.")
        else:
            print(f"  {C.GRN}✔{C.RST} Dependencies: node_modules found in {os.path.basename(d)}.")

    # 4. Check Dual Messenger
    compat, msg = check_dual_messenger_compatibility()
    if compat:
        print(f"  {C.GRN}✔{C.RST} Dual Messenger: {msg}")
    else:
        print(f"  {C.YEL}!{C.RST} Dual Messenger: {msg}")

    # 5. Check Browser Choice
    browser = get_preferred_browser()
    print(f"  {C.GRN}✔{C.RST} Browser Sync: Preferred browser is '{browser}'.")

    # 6. Check & Auto-Heal Android SDK Location
    sdk_ok, sdk_msg = auto_heal_android_sdk()
    if sdk_ok:
        print(f"  {C.GRN}✔{C.RST} Android SDK: {sdk_msg}")
    else:
        issues.append(f"sdk: {sdk_msg}")

    # 7. Active Network Diagnostic Check
    print(f"\n  {C.CYAN}[*] Running Active Port Scanner...{C.RST}")
    ports_to_check = [
        (5173, "React Portal (Vite)"),
        (5679, "Legacy Portal (BrowserSync)"),
        (8081, "Expo Metro Server"),
        (5000, "Flask GUI API"),
        (2004, "Flask GUI Console")
    ]
    for port, label in ports_to_check:
        active = wait_for_port(port, timeout=0.1)
        status_str = f"{C.GRN}ACTIVE{C.RST}" if active else f"{C.GRAY}INACTIVE{C.RST}"
        print(f"    - Port {port:<5} | {label:<30} : {status_str}")

    # 8. E2EE Security Bypass Diagnostics
    print(f"\n  {C.CYAN}[*] Running Cryptographic Security Audit...{C.RST}")
    auth_js_path = os.path.join(DOWNLOAD_PORTAL_DIR, "src", "js", "authentication.js")
    if os.path.exists(auth_js_path):
        try:
            with open(auth_js_path, 'r', encoding='utf-8') as f:
                auth_content = f.read()
            if "return unlockPortal();" in auth_content:
                warnings.append(f"security: Active dev bypass gate found in '{auth_js_path}'!")
                print(f"    - Auth Gate State    : {C.RED}{C.BOLD}BYPASSED (INSECURE FOR PRODUCTION){C.RST}")
            else:
                print(f"    - Auth Gate State    : {C.GRN}SECURE (Gate Active - Login Required){C.RST}")
        except Exception as e:
            print(f"    - Auth Gate State    : {C.YEL}UNABLE TO AUDIT ({e}){C.RST}")
    else:
        print(f"    - Auth Gate State    : {C.GRAY}NOT FOUND (Legacy structure){C.RST}")

    if issues or warnings:
        if issues:
            print(f"\n{C.RED}{C.BOLD}🚨 Found {len(issues)} critical issue(s):{C.RST}")
            for i in issues:
                print(f"  - {C.RED}{i}{C.RST}")
        if warnings:
            print(f"\n{C.YEL}{C.BOLD}⚠️ Found {len(warnings)} security/build warning(s):{C.RST}")
            for w in warnings:
                print(f"  - {C.YEL}{w}{C.RST}")
    else:
        print(f"\n{C.GRN}{C.BOLD}All systems green! BhasaGrid is production ready.{C.RST}")
    
    return len(issues) == 0

def run_command(command, cwd, label=None):
    if label:
        print(f"\n>>> {label}")
    print(f"Running: {' '.join(command)}")
    captured_output = []
    try:
        process = subprocess.Popen(
            command,
            cwd=cwd,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True,
            encoding='utf-8',
            errors='replace'
        )
        
        for line in process.stdout:
            captured_output.append(line)
            try:
                print(line, end='')
            except UnicodeEncodeError:
                # Handle cases where the terminal cannot encode some characters
                print(line.encode(sys.stdout.encoding or 'utf-8', errors='replace').decode(sys.stdout.encoding or 'utf-8'), end='')
            
        process.wait()
        return process.returncode, "".join(captured_output)
    except KeyboardInterrupt:
        print(f"\n  {C.YEL}[!] Build interrupted by user (Ctrl+C){C.RST}")
        try:
            process.terminate()
            process.wait(timeout=5)
        except Exception:
            process.kill()
        return -1, "".join(captured_output)
    except Exception as e:
        print(f"Error executing command: {e}")
        return 1, "".join(captured_output)

def handle_android_build_failure(build_type="Debug", log_output=""):
    """Smartest recovery analyzing logs to perform precise surgical repairs."""
    print(f"\n{C.YEL}{C.BOLD}[⚠️ AUTOMATED SMART BUILD RECOVERY] Analyzing build failure...{C.RST}")
    
    repaired_issues = []
    
    # 0. Inspect for missing SDK location / local.properties issue
    if "SDK location not found" in log_output or "local.properties" in log_output or "Failed to apply plugin" in log_output:
        print(f"  {C.CYAN}Detected missing/invalid Android SDK location! Healing SDK setup...{C.RST}")
        sdk_ok, sdk_msg = auto_heal_android_sdk()
        if sdk_ok:
            repaired_issues.append("Auto-healed missing Android SDK by generating local.properties")
        else:
            print(f"    {C.RED}✘ Auto-healing SDK failed: {sdk_msg}{C.RST}")
    
    # 1. Inspect for Gradle Out of Memory issue
    if "Out of Memory" in log_output or "GC overhead limit" in log_output or "Java heap space" in log_output:
        print(f"  {C.CYAN}Detected JVM Out of Memory error! Increasing Gradle heap size...{C.RST}")
        prop_path = os.path.join(ANDROID_DIR, "gradle.properties")
        if os.path.isfile(prop_path):
            try:
                with open(prop_path, 'r') as f:
                    lines = f.readlines()
                new_lines = []
                jvm_replaced = False
                for line in lines:
                    if line.strip().startswith("org.gradle.jvmargs"):
                        new_lines.append("org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g -XX:+HeapDumpOnOutOfMemoryError\n")
                        jvm_replaced = True
                    else:
                        new_lines.append(line)
                if not jvm_replaced:
                    new_lines.append("org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g -XX:+HeapDumpOnOutOfMemoryError\n")
                with open(prop_path, 'w') as f:
                    f.writelines(new_lines)
                repaired_issues.append("JVM Memory Limit increased to 4GB in gradle.properties")
            except Exception as e:
                print(f"    Failed to edit gradle.properties: {e}")

    # 2. Inspect for prefab / ReactAndroid::jsi transforms issues
    if "ReactAndroid::jsi" in log_output or "prefab" in log_output:
        print(f"  {C.CYAN}Detected corrupt ReactAndroid/jsi Gradle transforms! Purging caches...{C.RST}")
        _purge_cxx_caches()
        repaired_issues.append("Stale/Corrupted C++ & Gradle transforms wiped clean")

    # 3. Clean local build cache
    print(f"  {C.CYAN}Step 2: Clearing temp build folders...{C.RST}")
    app_build_dir = os.path.join(ANDROID_DIR, "app", "build")
    root_build_dir = os.path.join(ANDROID_DIR, "build")
    for d in [app_build_dir, root_build_dir]:
        if os.path.isdir(d):
            try:
                shutil.rmtree(d, onerror=force_delete_readonly)
                print(f"    {C.GRN}✔ Removed {os.path.basename(d)}{C.RST}")
            except Exception:
                pass

    # 4. Clean Metro & Expo caches
    print(f"  {C.CYAN}Step 3: Cleaning Metro and Expo caches...{C.RST}")
    temp_dir = os.environ.get("TEMP", os.environ.get("TMP", "C:\\temp"))
    metro_cache = os.path.join(temp_dir, "metro-cache")
    if os.path.isdir(metro_cache):
        shutil.rmtree(metro_cache, onerror=force_delete_readonly)
    expo_cache = os.path.join(UNIVERSAL_DIR, ".expo")
    if os.path.isdir(expo_cache):
        shutil.rmtree(expo_cache, onerror=force_delete_readonly)

    # 5. Check Port 8081 conflicts
    port_conflict = False
    if os.name == 'nt':
        # Probe port 8081
        try:
            import socket
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.5)
            s.connect(("127.0.0.1", 8081))
            s.close()
            port_conflict = True
        except Exception:
            pass

    if port_conflict:
        print(f"  {C.CYAN}Detected active server/process locking port 8081. Liberating...{C.RST}")
        # Kill whatever process is holding 8081
        os.system("taskkill /f /im node.exe 2>nul")
        os.system("taskkill /f /im java.exe 2>nul")
        repaired_issues.append("Liberated port 8081 by terminating lingering servers")

    print(f"\n{C.GRN}{C.BOLD}[✔ SMART RECOVERY RUN COMPLETED]{C.RST}")
    if repaired_issues:
        print(f"  {C.GRN}Resolved issues:{C.RST}")
        for ri in repaired_issues:
            print(f"    - {ri}")
    else:
        print(f"  {C.WHT}Performed baseline cleanup (Cleared caches & unlocked directories).{C.RST}")
    
    print(f"\n  {C.PURP}{C.BOLD}RECOMMENDED ACTION:{C.RST} Choose option 6 (Clean + Build Debug APK) to retry the build. A manual restart is NOT required!")

def build_android_debug():
    print("\n--- [BUILD ANDROID DEBUG] ---")
    rc, out = run_command(["gradlew", "assembleDebug"], ANDROID_DIR, "Building Debug APK")
    if rc == 0:
        apk_path = os.path.join(ANDROID_DIR, "app", "build", "outputs", "apk", "debug", "app-debug.apk")
        log_event("build.py", "androidBuild", "SUCCESS", f"Debug APK Generated: {apk_path}")
        return True
    log_event("build.py", "androidBuild", "FAILED", "assembleDebug compilation failed.")
    handle_android_build_failure("Debug", out)
    return False

def build_android_release():
    print("\n--- [BUILD ANDROID RELEASE] ---")
    rc, out = run_command(["gradlew", "assembleRelease"], ANDROID_DIR, "Building Release APK")
    if rc == 0:
        apk_path = os.path.join(ANDROID_DIR, "app", "build", "outputs", "apk", "release", "app-release.apk")
        print(f"\n[SUCCESS] Release APK Generated: {apk_path}")
        
        is_compat, msg = check_dual_messenger_compatibility()
        if is_compat:
            print(f" - Note: {msg}")
        else:
            print(f" - WARNING: {msg}")
        return True
    handle_android_build_failure("Release", out)
    return False

def build_android_both():
    print("\n--- [BUILD BOTH ANDROID APKS] ---")
    if build_android_debug() and build_android_release():
        print("\n[SUCCESS] Both Android APKs Generated.")
        return True
    return False

def _purge_cxx_caches():
    """Delete all stale .cxx CMake cache directories and corrupt Gradle transforms before clean."""
    count = 0
    # App-level .cxx
    app_cxx = os.path.join(ANDROID_DIR, "app", ".cxx")
    if os.path.isdir(app_cxx):
        shutil.rmtree(app_cxx, onerror=force_delete_readonly)
        count += 1
    # node_modules native module .cxx dirs
    nm_dir = os.path.join(UNIVERSAL_DIR, "node_modules")
    if os.path.isdir(nm_dir):
        for root, dirs, _ in os.walk(nm_dir):
            for d in dirs:
                if d == ".cxx":
                    cxx_path = os.path.join(root, d)
                    shutil.rmtree(cxx_path, onerror=force_delete_readonly)
                    count += 1
            dirs[:] = [d for d in dirs if d != ".cxx"]
    # Clear stale Gradle transform caches (ReactAndroid::jsi missing headers issue)
    gradle_home = os.path.join(os.path.expanduser("~"), ".gradle", "caches")
    if os.path.isdir(gradle_home):
        for cache_ver in os.listdir(gradle_home):
            transforms_dir = os.path.join(gradle_home, cache_ver, "transforms")
            if os.path.isdir(transforms_dir):
                # Check for broken react-android prefab transforms
                for t in os.listdir(transforms_dir):
                    t_path = os.path.join(transforms_dir, t, "transformed")
                    if os.path.isdir(t_path):
                        for item in os.listdir(t_path):
                            if item.startswith("react-android-") and item.endswith("-release"):
                                jsi_include = os.path.join(t_path, item, "prefab", "modules", "jsi", "include")
                                if not os.path.isdir(jsi_include):
                                    print(f"  {C.YEL}Found corrupt Gradle transform: {t} (missing jsi/include){C.RST}")
                                    shutil.rmtree(os.path.join(transforms_dir, t), onerror=force_delete_readonly)
                                    count += 1
    if count:
        print(f"  {C.GRAY}Purged {count} stale cache(s) (.cxx + Gradle transforms){C.RST}")

def clean_android():
    print("\n--- [CLEAN ANDROID PROJECT] ---")
    _purge_cxx_caches()
    rc, _ = run_command(["gradlew", "clean"], ANDROID_DIR, "Cleaning Gradle Build Files")
    if rc == 0:
        log_event("cleanup", "clearCache", "SUCCESS", "Android project cleaned successfully.")
        return True
    log_event("cleanup", "clearCache", "FAILED", f"Gradle clean failed (exit code: {rc}).")
    print(f"  {C.YEL}Tip: Run with --stacktrace for details, or clear ~/.gradle/caches/*/transforms{C.RST}")
    return False

def fresh_build_android():
    print("\n--- [FRESH ANDROID BUILD] ---")
    if clean_android():
        return build_android_both()
    return False

def clean_build_android_debug():
    print("\n--- [CLEAN + BUILD DEBUG APK] ---")
    if clean_android():
        return build_android_debug()
    print(f"  {C.YEL}Skipping build step because clean failed.{C.RST}")
    return False

def build_desktop():
    print("\n--- [BUILD DESKTOP] ---")
    # Electron build
    rc, _ = run_command(["npm", "run", "electron:build"], UNIVERSAL_DIR, "Generating Windows EXE")
    if rc != 0:
        return False
    
    print(f"\n[SUCCESS] Desktop EXE Generated in {os.path.join(UNIVERSAL_DIR, 'release')}")
    return True

def build_web():
    print("\n--- [BUILD WEB] ---")
    rc, _ = run_command(["npm", "run", "build:web"], UNIVERSAL_DIR, "Generating Web Build")
    if rc != 0:
        return False
    
    print(f"\n[SUCCESS] Web Build Generated in {os.path.join(UNIVERSAL_DIR, 'dist')}")
    return True

def build_mac():
    print("\n--- [BUILD MACOS STANDALONE] ---")
    rc, _ = run_command(["npm", "run", "build:mac"], UNIVERSAL_DIR, "Generating macOS .dmg")
    if rc != 0: return False
    print(f"\n[SUCCESS] macOS Build generated in {os.path.join(UNIVERSAL_DIR, 'dist')}")
    return True

def build_linux():
    print("\n--- [BUILD LINUX STANDALONE] ---")
    rc, _ = run_command(["npm", "run", "build:linux"], UNIVERSAL_DIR, "Generating Linux .AppImage")
    if rc != 0: return False
    print(f"\n[SUCCESS] Linux Build generated in {os.path.join(UNIVERSAL_DIR, 'dist')}")
    return True

def launch_electron_dev():
    print(f"\n--- [LAUNCH ELECTRON (DEV MODE)] ---")
    print(f"  {C.GRAY}Requires Expo web server on port 8081{C.RST}")

    # Check if Expo web dev server is already running
    expo_running = wait_for_port(8081, timeout=0.5)

    if not expo_running:
        print(f"\n  {C.YEL}! Expo web server is NOT running on port 8081.{C.RST}")
        print(f"  {C.WHT}Electron:dev needs the web server at http://localhost:8081{C.RST}")
        print(f"\n  {C.BOLD}Start Expo server now in a new window and then launch Electron? (y/n):{C.RST} ", end='', flush=True)
        ans = get_key()
        print()
        if ans != 'y':
            print(f"  {C.RED}Cancelled.{C.RST}")
            return False

        # Start Expo web server in background window
        cmd = f'start cmd /k "cd /d {UNIVERSAL_DIR} && npm start"'
        os.system(cmd)
        print(f"  {C.CYAN}Expo server launching... waiting for port 8081...{C.RST}")
        if not wait_for_port(8081, timeout=30):
            print(f"  {C.RED}Timed out waiting for Expo server. Try again after it starts.{C.RST}")
            return False
        print(f"  {C.GRN}✔ Expo server ready.{C.RST}")
    else:
        print(f"  {C.GRN}✔ Expo server already running on port 8081.{C.RST}")

    # Launch Electron dev (always in new window — it's a GUI app)
    print(f"\n  {C.BLUE}Launching Electron in dev mode...{C.RST}")
    cmd = f'start cmd /k "cd /d {UNIVERSAL_DIR} && npm run electron:dev"'
    os.system(cmd)
    print(f"\n  {C.GRN}✔ Electron window launched (dev mode → http://localhost:8081){C.RST}")
    return True

def deploy_firebase(target=None):
    print("\n--- [FIREBASE DEPLOY] ---")
    
    if not target:
        print(f"  {C.YEL}{C.BOLD}Select Firebase Deployment Target:{C.RST}")
        print(f"  {C.WHT} 1.{C.RST} {C.CYAN}Main Application{C.RST}   {C.GRAY}(bhasagrid-universal){C.RST}")
        print(f"  {C.WHT} 2.{C.RST} {C.PURP}Download Portal{C.RST}    {C.GRAY}(download-portal){C.RST}")
        print(f"  {C.WHT} 3.{C.RST} {C.BLUE}Both Targets{C.RST}")
        print(f"  {C.WHT} C.{C.RST} {C.GRAY}Cancel{C.RST}")
        print(f"\n  Select option (1-3) [Default 1] > ", end="", flush=True)
        set_terminal_mode(True)
        opt = input().strip().lower()
        set_terminal_mode(False)
        
        if opt == '2':
            target = "portal"
        elif opt == '3':
            target = "both"
        elif opt == 'c':
            print("  Deployment cancelled.")
            return False
        else:
            target = "app"
            
    targets_to_deploy = []
    if target in ["app", "main", "application"]:
        targets_to_deploy.append(("Main Application", UNIVERSAL_DIR))
    elif target in ["portal", "landing"]:
        targets_to_deploy.append(("Download Portal", DOWNLOAD_PORTAL_DIR))
    elif target == "both":
        targets_to_deploy.append(("Main Application", UNIVERSAL_DIR))
        targets_to_deploy.append(("Download Portal", DOWNLOAD_PORTAL_DIR))
    else:
        print(f"  Unknown target: '{target}'. Use 'app', 'portal', or 'both'.")
        return False
        
    success = True
    for name, directory in targets_to_deploy:
        print(f"\n>>> Deploying {name} from {directory}...")
        
        # Read the project ID directly from the directory's .env
        env_project_id = None
        env_path = os.path.join(directory, ".env")
        if not os.path.exists(env_path):
            env_path = os.path.join(PROJECT_ROOT, ".env")
        if os.path.exists(env_path):
            try:
                with open(env_path, 'r') as f:
                    for line in f:
                        if line.strip().startswith("FIREBASE_PROJECT_ID"):
                            env_project_id = line.split("=", 1)[1].strip().strip('"').strip("'")
                            break
            except:
                pass
                
        if not env_project_id:
            if name == "Download Portal":
                env_project_id = "innerorbit-portal"
            else:
                env_project_id = "innerorbit-bc8ce"
                
        # Safety Gate: Audit for active dev auth bypasses in portal deployment
        if "Download Portal" in name:
            auth_js_path = os.path.join(DOWNLOAD_PORTAL_DIR, "src", "js", "authentication.js")
            if os.path.exists(auth_js_path):
                try:
                    with open(auth_js_path, 'r', encoding='utf-8') as f:
                        auth_content = f.read()
                    if "return unlockPortal();" in auth_content:
                        print(f"\n  {C.RED}{C.BOLD}🚨 SECURITY AUDIT ALERT: ACTIVE DEVELOPMENT BYPASS FOUND!{C.RST}")
                        print(f"  {C.RED}The authentication security gate is currently bypassed in authentication.js!{C.RST}")
                        print(f"  {C.YEL}Deploying with the bypass active exposes the landing/download portal to open public access.{C.RST}")
                        set_terminal_mode(True)
                        confirm = input(f"\n  {C.BOLD}Do you wish to abort and activate the gate first? (y/n) [Default y]: {C.RST}").strip().lower()
                        set_terminal_mode(False)
                        if confirm != 'n':
                            print(f"  {C.RED}Deployment aborted. Activating gate...{C.RST}")
                            toggle_portal_auth(enable=True)
                            return False
                except Exception as e:
                    print(f"  {C.YEL}⚠️ Security bypass audit skipped due to read error: {e}{C.RST}")

        print(f"  Forcing target Firebase Project: '{env_project_id}'")
        
        if not verify_firebase_project(directory):
            log_event("firebase", "deploy", "FAILED", f"Deployment aborted for {name} due to project mismatch.")
            success = False
            continue

        rc, _ = run_command(["firebase", "deploy", "--project", env_project_id], directory, f"Deploying {name} to Firebase")
        if rc != 0:
            log_event("firebase", "deploy", "FAILED", f"{name} deploy command execution failed.")
            success = False
        else:
            log_event("firebase", "deploy", "SUCCESS", f"{name} Deployment Complete.")
            
            print(f"\n  {C.NEON_GREEN}✔ {name} successfully deployed!{C.RST}")
            if name == "Download Portal":
                print(f"  {C.CYAN}🌐 Live URL (Custom Domain): {C.BOLD}https://bhasagrid.com{C.RST}")
                print(f"  {C.GRAY}   (Firebase Default: https://{env_project_id}.web.app){C.RST}")
            else:
                print(f"  {C.CYAN}🌐 Live URL (Custom Domain): {C.BOLD}https://web.bhasagrid.com{C.RST}")
                print(f"  {C.GRAY}   (Firebase Default: https://{env_project_id}.web.app){C.RST}")
                
    return success

def deploy_firestore_rules():
    print("\n--- [FIREBASE RULES-ONLY DEPLOY] ---")
    if not verify_firebase_project():
        log_event("firebase", "deploy", "FAILED", "Deployment aborted due to project mismatch.")
        return False
    rc, _ = run_command(["firebase", "deploy", "--only", "firestore:rules"], UNIVERSAL_DIR, "Deploying Firestore Rules")
    if rc != 0:
        log_event("firebase", "deploy", "FAILED", "Firestore rules deploy failed.")
        return False
    log_event("firebase", "deploy", "SUCCESS", "Firestore Security Rules Updated.")
    return True

def toggle_portal_auth(enable=None):
    """Toggles authentication bypass in the portal's authentication.js."""
    print(f"\n--- [PORTAL SECURITY CONFIGURATION] ---")
    auth_js_path = os.path.join(DOWNLOAD_PORTAL_DIR, "src", "js", "authentication.js")
    
    if not os.path.exists(auth_js_path):
        print(f"  {C.RED}! File not found: {auth_js_path}{C.RST}")
        return False
        
    try:
        with open(auth_js_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        bypass_string = "return unlockPortal(); // Bypass authentication completely for direct main-portal access"
        is_bypassed = bypass_string in content
        
        if enable is None:
            # Interactive toggle
            print(f"  Current Status: " + (f"{C.RED}DEACTIVATED (Auth Bypassed - Open Access){C.RST}" if is_bypassed else f"{C.GRN}ACTIVATED (Auth Gate Active - Login Required){C.RST}"))
            print(f"  {C.WHT} 1.{C.RST} Activate Security Auth Gate (Login Required)")
            print(f"  {C.WHT} 2.{C.RST} Deactivate Security Auth Gate (Bypass / Open Access)")
            print(f"  {C.WHT} C.{C.RST} Cancel")
            print(f"\n  Select option (1-2) > ", end="", flush=True)
            set_terminal_mode(True)
            opt = input().strip()
            set_terminal_mode(False)
            
            if opt == '1':
                enable = True
            elif opt == '2':
                enable = False
            else:
                print("Cancelled.")
                return False
                
        if enable:
            # Activate auth gate (remove bypass)
            if is_bypassed:
                new_content = content.replace("        " + bypass_string + "\n", "")
                if new_content == content:
                    new_content = content.replace(bypass_string, "")
                with open(auth_js_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"  {C.GRN}✔ Authentication gate ACTIVATED successfully!{C.RST}")
            else:
                print(f"  {C.YEL}! Security auth gate is already active.{C.RST}")
        else:
            # Deactivate auth gate (add bypass)
            if not is_bypassed:
                target_str = "    function checkAuthentication() {"
                replacement = target_str + "\n        " + bypass_string
                new_content = content.replace(target_str, replacement)
                with open(auth_js_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"  {C.RED}✔ Authentication gate DEACTIVATED successfully! (Bypass active){C.RST}")
            else:
                print(f"  {C.YEL}! Authentication gate is already bypassed.{C.RST}")
                
        # Automatically sync env and physical files
        sync_env_to_portal()
        
        # Ask to redeploy
        print(f"\n  Would you like to deploy this security change to Firebase now? (y/n): ", end="", flush=True)
        ans = get_key()
        if ans == 'y':
            deploy_firebase("portal")
            
        return True
    except Exception as e:
        print(f"  {C.RED}! Failed to update security settings: {e}{C.RST}")
        return False

def backup_project_config():
    """Unified local backup utility delegated to the secure tools/backup_system.py subscript."""
    subscript_path = os.path.join(TOOLS_DIR, "backup_system.py")
    if os.path.exists(subscript_path):
        try:
            import subprocess
            rc = subprocess.call([sys.executable, subscript_path])
            return rc == 0
        except Exception as e:
            print(f"  {C.RED}✘ Failed to launch backup subscript: {e}{C.RST}")
            return False
    else:
        print(f"  {C.RED}✘ Backup subscript not found at: {subscript_path}{C.RST}")
        return False

def install_decoy_dependencies():
    """Installs node modules for CalcX calculator application."""
    print("\n--- [INSTALL CALCX DECOY DEPENDENCIES] ---")
    calc_dir = os.path.join(PROJECT_ROOT, "CalcX -- A Master Calculator")
    rc, _ = run_command(["npm", "install"], calc_dir, "Installing CalcX Packages")
    if rc == 0:
        print(f"\n  {C.GRN}✔ Decoy app dependencies installed successfully!{C.RST}")
        return True
    return False

def clean_decoy_app():
    """Clears caches and performs fresh dependency installation for CalcX decoy."""
    print("\n--- [CLEAN CALCX DECOY APP] ---")
    calc_dir = os.path.join(PROJECT_ROOT, "CalcX -- A Master Calculator")
    
    for folder in [".expo", "node_modules"]:
        full_p = os.path.join(calc_dir, folder)
        if os.path.exists(full_p):
            print(f"  Cleaning {folder}...")
            shutil.rmtree(full_p, onerror=force_delete_readonly)
            
    print(f"\n  {C.GRN}✔ Decoy application clean complete!{C.RST}")
    return install_decoy_dependencies()

def cleanup_release():
    print("\n--- [CLEANUP RELEASE FILES] ---")
    release_dir = os.path.join(UNIVERSAL_DIR, "release")
    if os.path.exists(release_dir):
        try:
            shutil.rmtree(release_dir, onerror=force_delete_readonly)
            print(f"\n[SUCCESS] Cleaned up: {release_dir}")
            return True
        except Exception as e:
            print(f"\n[ERROR] Failed to cleanup release: {e}")
            return False
    else:
        print(f"\n[INFO] Release directory does not exist: {release_dir}")
        return True

def launch_tkinter_gui():
    print("\n--- [LAUNCHING GUI PROJECT CONSOLE] ---")
    gui_path = os.path.join(GUI_DIR, "gui_manager.py")
    if os.path.exists(gui_path):
        try:
            # Use DETACHED_PROCESS on Windows so no blank console window appears
            creation_flags = subprocess.DETACHED_PROCESS if os.name == 'nt' else 0
            subprocess.Popen(
                [sys.executable, gui_path],
                creationflags=creation_flags,
                close_fds=True
            )
            print("\n[SUCCESS] GUI Project Console launched.")
            return True
        except Exception as e:
            print(f"\n[ERROR] Failed to launch GUI: {e}")
            return False
    else:
        print(f"\n[ERROR] GUI script not found: {gui_path}")
        return False

def launch_flask_gui():
    print("\n--- [LAUNCHING PREMIUM FLASK MANAGER] ---")
    flask_app_path = os.path.join(TOOLS_DIR, "flask_manager", "app.py")
    if os.path.exists(flask_app_path):
        try:
            # Check for Flask
            try:
                import flask
            except ImportError:
                print(f"  {C.YEL}! Flask not found. Installing dependencies...{C.RST}")
                subprocess.check_call([sys.executable, "-m", "pip", "install", "flask"])

            # Launch in background console
            if os.name == 'nt':
                # CREATE_NO_WINDOW = 0x08000000
                p = subprocess.Popen([sys.executable, flask_app_path], 
                                     creationflags=0x08000000, 
                                     close_fds=True)
            else:
                p = subprocess.Popen([sys.executable, flask_app_path], 
                                     stdout=subprocess.DEVNULL, 
                                     stderr=subprocess.DEVNULL, 
                                     start_new_session=True)
            register_active_service("Flask GUI", p.pid)
            
            print(f"\n  {C.GRN}✔ Flask Manager started at http://localhost:5000{C.RST}")
            
            # Smart Launch Question
            current_b = get_preferred_browser_config()
            print(f"\n  {C.YEL}{C.BOLD}How would you like to open the dashboard?{C.RST}")
            print(f"  {C.GRAY}Current Browser: {C.WHT}{current_b.get('label', 'Default')}{C.RST}")
            print(f"  {C.WHT} 1{C.RST}  {C.CYAN}Normal Window{C.RST}")
            print(f"  {C.WHT} 2{C.RST}  {C.PURP}Incognito / Private{C.RST}")
            print(f"  {C.WHT} B{C.RST}  {C.BLUE}Change Browser Selection{C.RST}")
            print(f"  {C.WHT} S{C.RST}  {C.GRAY}Skip (Manually open http://localhost:2004){C.RST}")
            
            choice = input(f"\n  {C.BOLD}Launch Mode >{C.RST} ").strip().lower()
            
            if choice == '1':
                open_url("http://localhost:2004", force_incognito=False)
            elif choice == '2':
                open_url("http://localhost:2004", force_incognito=True)
            elif choice == 'b':
                set_preferred_browser()
                # Re-run the question after setting
                return launch_flask_gui()
            elif choice == 's':
                print(f"  {C.GRAY}Dashboard is running. Open it manually.{C.RST}")
            else:
                open_url("http://localhost:2004") # Use default from config
            
            return True
        except Exception as e:
            print(f"\n[ERROR] Failed to launch Flask GUI: {e}")
            return False
    else:
        print(f"\n[ERROR] Flask manager script not found at {flask_app_path}")
        return False

def launch_gui():
    print(f"\n  {C.YEL}{C.BOLD}Which GUI version would you like to launch?{C.RST}")
    print(f"  {C.WHT} 1{C.RST}  {C.BLUE}Premium Flask GUI{C.RST}  {C.GRAY}(Web-based, Glassy Design){C.RST}")
    print(f"  {C.WHT} 2{C.RST}  {C.PURP}Classic Desktop GUI{C.RST} {C.GRAY}(Native Tkinter Window){C.RST}")
    
    g_choice = input(f"\n  {C.BOLD}>{C.RST} ").strip()
    if g_choice == '1':
        return launch_flask_gui()
    else:
        return launch_tkinter_gui()

def launch_installer():
    print("\n--- [LAUNCHING PREMIUM SETUP WIZARD] ---")
    setup_path = os.path.join(GUI_DIR, "setup_wizard.py")
    if os.path.exists(setup_path):
        try:
            creation_flags = subprocess.DETACHED_PROCESS if os.name == 'nt' else 0
            subprocess.Popen(
                [sys.executable, setup_path],
                creationflags=creation_flags,
                close_fds=True
            )
            print("\n[SUCCESS] Premium Setup Wizard launched.")
            return True
        except Exception as e:
            print(f"\n[ERROR] Failed to launch Installer: {e}")
            return False
    else:
        print(f"\n[ERROR] Setup script not found: {setup_path}")
        return False

def git_sync(interactive=True):
    print("\n--- [GIT SYNC (ADD, COMMIT, PUSH)] ---")
    
    # 1. Check Status
    output = subprocess.run(["git", "status", "--porcelain"], cwd=PROJECT_ROOT, capture_output=True, text=True)
    if not output.stdout.strip():
        print("Working tree clean, nothing to commit.")
        return True
        
    # 2. Add all
    rc, _ = run_command(["git", "add", "."], PROJECT_ROOT, "Staging all changes")
    if rc != 0: return False
    
    # 3. Commit
    if interactive:
        msg = input("Enter commit message: ").strip()
    else:
        msg = ""

    if not msg:
        msg = "Auto-sync from manager.py"
        
    rc, _ = run_command(["git", "commit", "-m", msg], PROJECT_ROOT, f"Committing: '{msg}'")
    if rc != 0: return False
    
    # 4. Push
    rc, _ = run_command(["git", "push"], PROJECT_ROOT, "Pushing to remote")
    if rc != 0: return False
    
    print("\n[SUCCESS] Git Sync Complete.")
    return True

def git_ops_menu():
    print(f"\n  {C.PURP}{C.BOLD}GIT OPERATIONS{C.RST}")
    print(f"  1. Quick Sync (Add + Commit + Push)")
    print(f"  2. View Status")
    print(f"  3. List Branches")
    print(f"  4. Checkout Branch")
    print(f"  5. Pull Latest")
    print(f"  6. Hard Reset to Head {C.RED}(Careful!){C.RST}")
    print(f"\n  [B] Back to Hub")
    
    print(f"\n  {C.BOLD}Git >{C.RST} ", end='', flush=True)
    c = get_key()
    if c == 'b': return
    
    if c == '1': git_sync()
    elif c == '2': subprocess.call(["git", "status"], cwd=PROJECT_ROOT)
    elif c == '3': subprocess.call(["git", "branch"], cwd=PROJECT_ROOT)
    elif c == '4':
        branch = input("Enter branch name: ").strip()
        if branch:
            # Enforce strictly alphanumeric, hyphens, slashes, and dots
            sanitized_branch = re.sub(r'[^\w\-\/\.]', '', branch)
            if sanitized_branch:
                subprocess.call(["git", "checkout", sanitized_branch], cwd=PROJECT_ROOT)
    elif c == '5': subprocess.call(["git", "pull"], cwd=PROJECT_ROOT)
    elif c == '6':
        confirm = input("Are you sure? This wipes uncommitted changes (y/n): ").lower()
        if confirm == 'y': subprocess.call(["git", "reset", "--hard", "HEAD"], cwd=PROJECT_ROOT)
    
    input(f"\n  {C.GRAY}Press Enter to continue...{C.RST}")

def install_on_device():
    print(f"\n  {C.BLUE}{C.BOLD}--- [ADB DEVICE DEPLOYMENT] ---{C.RST}")
    apk_path = os.path.join(ANDROID_DIR, "app", "build", "outputs", "apk", "debug", "app-debug.apk")
    package_name = "com.BhasaGrid.calcx"
    
    if not os.path.exists(apk_path):
        print(f"  {C.RED}✘ Error:{C.RST} Debug APK not found at {apk_path}")
        print(f"  {C.GRAY}Please run 'Build Debug APK' first.{C.RST}")
        return False
    
    print(f"  {C.CYAN}[*] Scanning for connected devices...{C.RST}")
    try:
        devices_output = subprocess.check_output(["adb", "devices"], text=True)
        
        if "unauthorized" in devices_output:
            print(f"\n  {C.RED}{C.BOLD}⚠ DEVICE UNAUTHORIZED{C.RST}")
            print(f"  {C.WHT}Please check your physical device and tap 'Allow USB Debugging'.{C.RST}")
            return False
            
        if "device\n" not in devices_output and "device\r\n" not in devices_output:
            print(f"\n  {C.RED}{C.BOLD}⚠ NO DEVICE DETECTED{C.RST}")
            print(f"  {C.GRAY}Ensure your device is connected via USB and 'USB Debugging' is enabled.{C.RST}")
            return False

        # Check if already installed
        print(f"  {C.CYAN}[*] Checking application state...{C.RST}")
        check_install = subprocess.run(["adb", "shell", "pm", "list", "packages", package_name], capture_output=True, text=True)
        
        if package_name in check_install.stdout:
            print(f"  {C.YEL}● Existing installation found. Performing upgrade...{C.RST}")
        else:
            print(f"  {C.GRN}● No existing installation found. Performing fresh install...{C.RST}")

        rc, _ = run_command(["adb", "install", "-r", apk_path], PROJECT_ROOT, "Deploying APK")
        
        if rc == 0:
            print(f"\n  {C.GRN}{C.BOLD}✔ SUCCESS: App deployed to physical device.{C.RST}")
            return True
        else:
            print(f"\n  {C.RED}{C.BOLD}✘ FAILED: ADB installation failed.{C.RST}")
            return False
            
    except FileNotFoundError:
        print(f"  {C.RED}✘ Error:{C.RST} ADB command not found. Is Android SDK platform-tools in your PATH?")
        return False
    except Exception as e:
        print(f"  {C.RED}✘ Error during ADB operation: {e}{C.RST}")
        return False

def debug_physical_device_workflow():
    """Combined build and install flow for physical devices."""
    print(f"\n  {C.PURP}{C.BOLD}============================================={C.RST}")
    print(f"  {C.PURP}{C.BOLD}       PHYSICAL DEVICE DEBUG WORKFLOW        {C.RST}")
    print(f"  {C.PURP}{C.BOLD}============================================={C.RST}\n")
    
    if not build_android_debug():
        print(f"\n  {C.RED}✘ Build Failed. Deployment aborted.{C.RST}")
        return False
        
    time.sleep(1) # Pacing
    
    if not install_on_device():
        print(f"\n  {C.RED}✘ Installation Failed.{C.RST}")
        return False
        
    print(f"\n  {C.GRN}{C.BOLD}✔ Workflow Complete! You can now run the app on your device.{C.RST}")
    return True

def start_dev_server():
    print("\n--- [START EXPO DEV SERVER] ---")
    
    choice = ask_server_terminal("Expo Development Server")
    
    if choice == '1':
        print(f"{C.CYAN}Starting in current terminal. Press Ctrl+C to stop.{C.RST}")
        p = subprocess.Popen(["npm", "start"], cwd=UNIVERSAL_DIR, shell=True)
        register_active_service("Expo Server", p.pid)
        try:
            p.wait()
        except KeyboardInterrupt:
            p.terminate()
        unregister_active_service("Expo Server")
    else:
        print("Launching in a new console window...")
        if os.name == 'nt':
            p = subprocess.Popen(
                ["cmd.exe", "/k", "npm start"],
                cwd=UNIVERSAL_DIR,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
        else:
            p = subprocess.Popen(
                ["gnome-terminal", "--", "bash", "-c", f"cd '{UNIVERSAL_DIR}' && npm start"],
                start_new_session=True
            )
        register_active_service("Expo Server", p.pid)
        print(f"\n[SUCCESS] Dev server launched in new window.")
    return True

def ask_for_alternate_port(default_port):
    next_port = default_port + 1
    while next_port < 65535:
        if not wait_for_port(next_port, timeout=0.05):
            break
        next_port += 1

    while True:
        response = input(f"  Enter alternate port [default {next_port}]: ").strip()
        if response == '':
            return next_port
        if not response.isdigit():
            print(f"  {C.RED}Please enter a valid numeric port number.{C.RST}")
            continue
        port = int(response)
        if port < 1024 or port > 65535:
            print(f"  {C.RED}Port must be between 1024 and 65535.{C.RST}")
            continue
        if wait_for_port(port, timeout=0.05):
            print(f"  {C.RED}Port {port} is already in use. Pick another one.{C.RST}")
            continue
        return port


def kill_process_on_port(port):
    if os.name != 'nt':
        return False
    try:
        output = subprocess.check_output('netstat -ano', shell=True, text=True)
    except subprocess.CalledProcessError:
        return False

    pids = set()
    for line in output.splitlines():
        parts = line.split()
        if len(parts) >= 5:
            local_addr = parts[1]
            pid = parts[-1]
            # Parse address like "127.0.0.1:8081" or "[::]:8081"
            if local_addr.endswith(f":{port}"):
                pids.add(pid)

    if not pids:
        return False

    for pid in pids:
        try:
            subprocess.check_call(f'taskkill /PID {pid} /F', shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except subprocess.CalledProcessError:
            pass
    return True


def _smart_launch_portal(name, port, directory, dev_cmd, url):
    # 0. Sync Environment variables first
    sync_env_to_portal()
    
    start_port = port
    target_url = url

    # 1. Check if port is already active
    if wait_for_port(port, timeout=0.1):
        print(f"  {C.YEL}! {name} is already running on port {port}.{C.RST}")

        config = get_preferred_browser_config()
        pref = config.get("tab_action")
        if pref == "skip":
            print(f"  {C.GRAY}Skipping tab (per saved preference).{C.RST}")
            return True
        if pref == "open":
            open_url(target_url)
            return True

        choice = input(f"  Port {port} is in use. [O]pen existing / [R]estart same port / [C]hange port / [S]kip: ").strip().lower()
        if choice.startswith('o'):
            open_url(target_url)
            return True
        if choice.startswith('r'):
            print(f"  Attempting to stop the process using port {port}...")
            if kill_process_on_port(port):
                print(f"  {C.GRN}Stopped process on port {port}.{C.RST}")
            else:
                print(f"  {C.RED}Could not stop process on port {port}. Please free it manually and retry.{C.RST}")
                return False
        elif choice.startswith('c'):
            port = ask_for_alternate_port(port)
            target_url = f"http://localhost:{port}"
            print(f"  Starting {name} on alternate port {port}.")
        else:
            return True

    # 2. Not running - Start the server
    actual_cmd = dev_cmd.format(port=port)
    print(f"Launching {name} dev server on port {port}...")
    
    choice = ask_server_terminal(f"{name} Server")
    
    if choice == '1':
        print(f"{C.CYAN}Starting in current terminal. Portals will block this menu. Press Ctrl+C to stop.{C.RST}")
        p = subprocess.Popen(actual_cmd, cwd=directory, shell=True)
        register_active_service(name, p.pid)
        try:
            p.wait()
        except KeyboardInterrupt:
            p.terminate()
        unregister_active_service(name)
    else:
        print("Launching in a new console window...")
        if os.name == 'nt':
            p = subprocess.Popen(
                ["cmd.exe", "/k", actual_cmd],
                cwd=directory,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
        else:
            p = subprocess.Popen(
                ["gnome-terminal", "--", "bash", "-c", f"cd '{directory}' && {actual_cmd}"],
                start_new_session=True
            )
        register_active_service(name, p.pid)
    
    # 3. Wait for port and open browser
    print(f"Waiting for {name} to become active...")
    if wait_for_port(port):
        open_url(target_url)
        print(f"\n[SUCCESS] {name} started and browser opened.")
        return True
    else:
        print(f"\n[WARNING] {name} started but port {port} timed out.")
        return False

def start_download_portal_server():
    return _smart_launch_portal(
        "Legacy Portal", 5679, DOWNLOAD_PORTAL_DIR,
        "node check-port.js --port {port}",
        "http://localhost:5679"
    )

def start_react_portal_server():
    return _smart_launch_portal(
        "React Portal", 5173, REACT_PORTAL_DIR, 
        "npm run dev",
        "http://localhost:5173"
    )

def start_both_portals():
    print("\n--- [STARTING BOTH PORTALS] ---")
    
    # We use a trick: if both are running, we'll ask a unified question first
    # to avoid the _smart_launch_portal from asking twice individually.
    react_running = wait_for_port(5173, timeout=0.1)
    legacy_running = wait_for_port(5679, timeout=0.1)
    
    if react_running and legacy_running:
        config = get_preferred_browser_config()
        pref = config.get("tab_action")
        if pref == "skip": 
            print(f"  {C.GRAY}Both portals running. Skipping tabs (per preference).{C.RST}")
            return True
        if pref == "open":
            open_url("http://localhost:5173")
            open_url("http://localhost:5679")
            return True
            
        print(f"  {C.YEL}! Both portals (React & Legacy) are already running.{C.RST}")
        choice = input("  Re-open both browser tabs? (y/n/always_open/always_skip): ").strip().lower()
        if 'skip' in choice or choice == 'n':
            if 'always' in choice: update_browser_config({"tab_action": "skip"})
            return True
        if 'always' in choice or 'y' in choice or 'open' in choice:
            if 'always' in choice: update_browser_config({"tab_action": "open"})
            open_url("http://localhost:5173")
            open_url("http://localhost:5679")
            return True
        
        # If they just hit enter or invalid, treat as 'n' but don't save
        return True

    # If we get here, either they aren't both running or they aren't both skip/open
    start_react_portal_server()
    start_download_portal_server()
    return True

def physical_dev_flow():
    print("\n===============================")
    print("   PHYSICAL DEVICE DEV FLOW")
    print("===============================\n")
    
    if not build_android_debug():
        print("Build failed.")
        return
    
    if not install_on_device():
        print("Installation failed.")
        return
        
    start_dev_server()
    print("\n[DONE] Build, Install & Server Start complete.")

def full_release():
    print("\n===============================")
    print("      ULTIMATE PROJECT RELEASE")
    print("===============================\n")
    
    # 1. Android
    if not build_android_both():
        print("Build failed at Android stage.")
        return
    
    # 2. Desktop (EXE)
    if not build_desktop():
        print("Build failed at Desktop stage.")
        return
    
    # 3. macOS
    if not build_mac():
        print("Build failed at macOS stage.")
        # We continue here as mac build might need a mac to succeed 
        # but we'll report it
    
    # 4. Linux
    if not build_linux():
        print("Build failed at Linux stage.")
        
    # 5. Web
    if not build_web():
        print("Build failed at Web stage.")
        return
        
    # 6. Deployment
    print(f"\n{C.YEL}{C.BOLD}All builds complete.{C.RST}")
    print(f"Would you like to deploy to Firebase now? (y/n): ", end="", flush=True)
    ans = get_key()
    if ans == 'y':
        if not deploy_firebase():
            print("Failed at Firebase Deployment stage.")
            return

    print("\n===============================")
    print("  ULTIMATE RELEASE COMPLETE!")
    print("===============================")

def register_globally():
    print(f"\n--- [REGISTER MANAGER GLOBALLY] ---")
    project_root = os.path.dirname(os.path.abspath(__file__))
    # We'll use 'orbit' as the command name for efficiency and coolness
    bat_path = os.path.join(project_root, "orbit.bat")
    
    try:
        with open(bat_path, "w") as f:
            # We use %* to pass all arguments to the python script
            f.write('@echo off\npython "%~dp0manager.py" %*\n')
        
        print(f"  {C.GRN}✔ Created '{C.BOLD}orbit.bat{C.RST}{C.GRN}' in {project_root}{C.RST}")
        
        # Automate PATH addition using PowerShell (safer than setx)
        print(f"  {C.CYAN}[*] Attempting to automate PATH registration...{C.RST}")
        
        ps_script = f'''
        $newPath = "{project_root}"
        $oldPath = [Environment]::GetEnvironmentVariable("Path", "User")
        if ($oldPath -split ';' -notcontains $newPath) {{
            [Environment]::SetEnvironmentVariable("Path", $oldPath + ";" + $newPath, "User")
            Write-Host "ADDED"
        }} else {{
            Write-Host "EXISTS"
        }}
        '''
        
        res = subprocess.run(["powershell", "-Command", ps_script], capture_output=True, text=True)
        
        if "ADDED" in res.stdout:
            print(f"  {C.GRN}✔ Project root added to User PATH successfully.{C.RST}")
        elif "EXISTS" in res.stdout:
            print(f"  {C.GRAY}ℹ Project root is already in your PATH.{C.RST}")
        else:
            print(f"  {C.YEL}⚠ Could not automate PATH change. Please add it manually:{C.RST}")
            print(f"    Path: {project_root}")

        print(f"\n  {C.WHT}{C.BOLD}DONE!{C.RST} Just {C.BOLD}RESTART{C.RST} your terminal.")
        print(f"  Then you can type {C.CYAN}{C.BOLD}orbit{C.RST} from any folder!")
    except Exception as e:
        print(f"  {C.RED}✘ Error during registration: {e}{C.RST}")

def show_help_shortcuts():
    """Displays all available CLI shortcuts in a friendly, grouped format."""
    clear_terminal()

    P = C.PURP; B = C.BOLD; R = C.RST; Y = C.YEL
    CY = C.CYAN; GR = C.GRAY; W = C.WHT; RD = C.RED

    def section(title, emoji):
        print(f"\n  {P}{B}{'─'*52}{R}")
        print(f"  {P}{B}  {emoji}  {title}{R}")
        print(f"  {P}{'─'*52}{R}")

    def cmd(name, desc, example=None, tip=None):
        print(f"  {CY}{B}{name:<22}{R} {GR}{desc}{R}")
        if example:
            print(f"  {'':22} {GR}eg: {W}{example}{R}")
        if tip:
            print(f"  {'':22} {Y}>> {tip}{R}")

    print(f"\n  {P}{B}{'='*52}{R}")
    print(f"  {P}{B}      BhasaGrid Orbit Manager  —  Help{R}")
    print(f"  {P}{B}{'='*52}{R}")
    print(f"  {GR}  Usage:{R}  {W}orbit <command>{R}   or   {W}python manager.py <command>{R}")

    # ─── FIREBASE DEPLOY ────────────────────────────────────────────────────
    section("FIREBASE  DEPLOY", "🔥")
    print(f"\n  {W}To deploy the Download Portal website to Firebase:{R}\n")
    cmd("orbit firebase portal",  "Deploy ONLY the download portal site",
        "orbit firebase portal")
    cmd("orbit firebase app",     "Deploy ONLY the main app hosting",
        "orbit firebase app")
    cmd("orbit firebase both",    "Deploy portal + app hosting together",
        "orbit firebase both")
    cmd("orbit firebase",         "Full deploy (Hosting + Functions + Rules)",
        "orbit firebase")
    cmd("orbit rules",            "Deploy ONLY Firestore security rules",
        "orbit rules")
    print(f"\n  {Y}  Tip:{R} {GR}Run {W}firebase login{GR} first if not authenticated.{R}")
    print(f"  {Y}  Tip:{R} {GR}Bypass checks run automatically before every deploy.{R}")

    # ─── LOCAL DEV SERVERS ──────────────────────────────────────────────────
    section("LOCAL DEV SERVERS", "🌐")
    cmd("orbit portal",     "React download portal   (localhost:5173)",
        "orbit portal")
    cmd("orbit download",   "Legacy download portal  (localhost:5679)",
        "orbit download")
    cmd("orbit both",       "Both portals at once",
        "orbit both")
    cmd("orbit start",      "Expo Metro server (mobile app dev)",
        "orbit start")
    cmd("orbit electron",   "Electron desktop in dev mode",
        "orbit electron")

    # ─── ANDROID ────────────────────────────────────────────────────────────
    section("ANDROID BUILDS", "📱")
    cmd("orbit dev",        "Build + push to phone + start Expo  [most used]",
        "orbit dev")
    cmd("orbit debug",      "Build debug APK only",       "orbit debug")
    cmd("orbit release",    "Build release APK (signed)", "orbit release")
    cmd("orbit android",    "Build debug + release both", "orbit android")
    cmd("orbit install",    "Push latest debug APK to phone via ADB",
        "orbit install")
    cmd("orbit clean",      "Wipe Gradle cache + build folders",
        "orbit clean")
    cmd("orbit fresh",      "Clean + full rebuild",       "orbit fresh")

    # ─── DESKTOP / WEB ──────────────────────────────────────────────────────
    section("DESKTOP & WEB BUILDS", "🖥")
    cmd("orbit desktop",    "Build Windows .exe installer", "orbit desktop")
    cmd("orbit web",        "Build production web bundle",  "orbit web")
    cmd("orbit mac",        "Build macOS DMG",              "orbit mac")
    cmd("orbit all",        "FULL RELEASE: Android + Desktop + Web + Firebase",
        "orbit all", "Takes 10-20 min. Confirms before each step.")

    # ─── UTILITIES ──────────────────────────────────────────────────────────
    section("UTILITIES & TOOLS", "🔧")
    cmd("orbit git",        "Git menu: commit, push, branch, status",
        "orbit git")
    cmd("orbit health",     "Audit ports, env vars, firebase config",
        "orbit health")
    cmd("orbit backup",     "Zip + save your .env config files",
        "orbit backup")
    cmd("orbit calcx",      "Manage CalcX decoy app dependencies",
        "orbit calcx")
    cmd("orbit calcx clean","Clean CalcX build artifacts",
        "orbit calcx clean")
    cmd("orbit gui",        "Open Flask web dashboard (localhost:2004)",
        "orbit gui")
    cmd("orbit register",   "Register 'orbit' as a global PATH command",
        "orbit register")

    # ─── QUICK RECIPES ──────────────────────────────────────────────────────
    section("QUICK WORKFLOW RECIPES", "📋")
    print(f"""
  {W}Deploy portal website:{R}
  {CY}  orbit firebase portal{R}

  {W}Test portal locally, then deploy:{R}
  {CY}  orbit portal{R}          {GR}# open localhost:5173, check everything{R}
  {CY}  orbit firebase portal{R}  {GR}# deploy when ready{R}

  {W}Code on phone:{R}
  {CY}  orbit dev{R}

  {W}Full production release:{R}
  {CY}  orbit all{R}
""")

    print(f"  {P}{B}{'='*52}{R}")
    print(f"  {Y}  Press ENTER to go back   |   [Q] to quit{R}\n")

    while True:
        choice = get_key()
        if choice == 'q':
            print(f"\n  {RD}[*] Exiting BhasaGrid Manager...{R}")
            time.sleep(0.2)
            sys.exit(0)
        elif choice in ['\r', '\n']:
            break

    print(f"  {CY}[*] Rebooting BhasaGrid Hub...{R}")
    time.sleep(0.5)
    os.execv(sys.executable, [sys.executable] + sys.argv + ["--restarted"])



def show_cheat_sheet():
    """Dead-simple top-10 command cheat card — easy to remember."""
    clear_terminal()
    P = C.PURP; B = C.BOLD; R = C.RST; CY = C.CYAN
    GR = C.GRAY; W = C.WHT; Y = C.YEL; G = C.GRN

    print(f"\n  {P}{B}{'='*54}{R}")
    print(f"  {P}{B}    BhasaGrid — Cheat Sheet  (most used commands){R}")
    print(f"  {P}{B}{'='*54}{R}")
    print()

    rows = [
        ("What do you want to do?",        "Command to type",           ""),
        ("─"*32,                            "─"*22,                       ""),
        ("Run app on my phone",             "orbit run",                 "= orbit dev"),
        ("Open the download portal locally","orbit portal",              "localhost:5173"),
        ("Open both portals locally",       "orbit test",                "= orbit both"),
        ("Deploy portal to internet",       "orbit ship",                "= firebase portal"),
        ("Deploy everything to Firebase",   "orbit deploy",              "= firebase all"),
        ("Check if everything is OK",       "orbit check",               "= orbit health"),
        ("Something broken? Full rebuild",  "orbit fix",                 "= orbit fresh"),
        ("Build Android APK (debug)",       "orbit debug",               ""),
        ("Build Android APK (release)",     "orbit release",             ""),
        ("Git commit / push / status",      "orbit git",                 ""),
        ("Full production release",         "orbit all",                 "Android+Web+Firebase"),
        ("─"*32,                            "─"*22,                       ""),
        ("See ALL commands",                "orbit help",                ""),
    ]

    for what, cmd_str, note in rows:
        if what.startswith("─"):
            print(f"  {GR}{what}  {cmd_str}{R}")
        elif what.startswith("What"):
            print(f"  {Y}{B}{what:<34}{R}  {Y}{B}{cmd_str:<22}{R}  {Y}{B}{note}{R}")
        else:
            print(f"  {W}{what:<34}{R}  {CY}{B}{cmd_str:<22}{R}  {GR}{note}{R}")

    print(f"\n  {P}{B}{'='*54}{R}")
    print(f"  {Y}  Press ENTER to go back   |   [Q] to quit{R}\n")

    while True:
        choice = get_key()
        if choice == 'q':
            print(f"\n  {C.RED}[*] Exiting...{R}")
            time.sleep(0.2)
            sys.exit(0)
        elif choice in ['\r', '\n']:
            break

    print(f"  {CY}[*] Rebooting BhasaGrid Hub...{R}")
    time.sleep(0.5)
    os.execv(sys.executable, [sys.executable] + sys.argv + ["--restarted"])


def main():
    flush_input()
    
    # High-speed manual version check to bypass argparse optional-argument errors
    for arg in sys.argv[1:]:
        if arg.lower() in ["version", "--version", "-version", "-v", "--v"]:
            print(f"BhasaGrid Manager Version: {C.GRN}{VERSION}{C.RST}")
            sys.exit(0)
            
    # Persistent launch tracking to detect recent restarts even after exit
    last_launch_file = os.path.join(TOOLS_DIR, ".last_launch")
    recent_launch = False
    now = time.time()
    
    if os.path.exists(last_launch_file):
        try:
            with open(last_launch_file, "r") as f:
                last_time = float(f.read().strip())
                # If started again within 30 minutes, treat as a quick reload
                if now - last_time < 1800:
                    recent_launch = True
        except:
            pass

    parser = argparse.ArgumentParser(description="BhasaGrid Project Manager")
    parser.add_argument("task", nargs="?", help="Task to run")
    parser.add_argument("target", nargs="?", help="Target for the task (e.g. app, portal, both)")
    parser.add_argument("--restarted", action="store_true", help="Skip animations on restart")
    args = parser.parse_args()

    # Quick boot if flag is passed OR if we detected a recent manual launch
    is_restarted = args.restarted or recent_launch
    
    if args.task:
        task = args.task.lower()
        if task in ["version", "--version", "-version", "-v", "--v"]:
            print(f"BhasaGrid Manager Version: {C.GRN}{VERSION}{C.RST}")
            sys.exit(0)
        # ── Intuitive aliases (easy to remember) ─────────────────────────
        # orbit run    = orbit dev    (run app on phone)
        # orbit ship   = firebase portal  (deploy portal to internet)
        # orbit deploy = firebase (full firebase deploy)
        # orbit test   = both portals locally
        # orbit phone  = orbit phys
        # orbit check  = orbit health
        # orbit fix    = orbit fresh (clean rebuild)
        # orbit decoy  = orbit calcx
        ALIASES = {
            "run":    "dev",
            "ship":   "firebase",   # handled specially below
            "deploy": "firebase",
            "test":   "both",
            "phone":  "phys",
            "check":  "health",
            "fix":    "fresh",
            "decoy":  "calcx",
            "react":  "start",
            "prod":   "release",
        }
        if task in ALIASES:
            # ship = firebase portal specifically
            if task == "ship":
                args.target = "portal"
            task = ALIASES[task]

        # ── Main command routing ──────────────────────────────────────────
        if task == "debug": build_android_debug()
        elif task == "release": build_android_release()
        elif task == "android": build_android_both()
        elif task == "clean": clean_android()
        elif task == "fresh": fresh_build_android()
        elif task in ["cleandebug", "clean-debug"]: clean_build_android_debug()
        elif task == "install": install_on_device()
        elif task == "phys": debug_physical_device_workflow()
        elif task == "start": start_dev_server()
        elif task == "portal": start_react_portal_server()
        elif task == "download": start_download_portal_server()
        elif task == "both": start_both_portals()
        elif task == "dev": physical_dev_flow()
        elif task == "desktop": build_desktop()
        elif task == "web": build_web()
        elif task == "electron": launch_electron_dev()
        elif task == "firebase": deploy_firebase(args.target)
        elif task == "rules": deploy_firestore_rules()
        elif task == "auth":
            status = None
            if args.target:
                status = args.target.lower() in ["on", "active", "activate", "true", "1"]
            toggle_portal_auth(status)
        elif task == "git": git_ops_menu()
        elif task == "health": check_project_health()
        elif task == "cleanup": cleanup_release()
        elif task == "gui": launch_gui()
        elif task == "setup": launch_installer()
        elif task == "browser": set_preferred_browser()
        elif task == "reset": reset_terminal_choice()
        elif task == "register": register_globally()
        elif task == "backup": backup_project_config()
        elif task == "calcx":
            if args.target == "clean": clean_decoy_app()
            else: install_decoy_dependencies()
        elif task == "exit": sys.exit(0)
        elif task in ["help", "h"]: show_help_shortcuts()
        elif task in ["cheat", "quick", "ref"]: show_cheat_sheet()
        elif task == "all": full_release()
        else:
            log_event("cli", "runTask", "FAILED", f"Unknown task/command '{args.task}'")
            import difflib
            all_cmds = ["debug", "release", "android", "clean", "fresh", "install",
                        "phys", "start", "portal", "download", "both", "dev",
                        "desktop", "web", "electron", "firebase", "rules", "git",
                        "health", "cleanup", "gui", "setup", "browser", "reset",
                        "register", "exit", "help", "cheat", "all", "auth",
                        "backup", "calcx",
                        # aliases
                        "run", "ship", "deploy", "test", "phone", "check", "fix", "decoy"]
            matches = difflib.get_close_matches(task, all_cmds, n=1)
            if matches:
                print(f"  Did you mean: {C.CYAN}{matches[0]}{C.RST}?")
            print(f"  Run {C.CYAN}orbit cheat{C.RST} for quick reference  |  {C.CYAN}orbit help{C.RST} for all commands.")
            sys.exit(1)
        sys.exit(0)

    # --- INTERACTIVE HUB SYSTEM ---
    # Register this run in the launch tracker to cache future boot sequences
    try:
        with open(last_launch_file, "w") as f:
            f.write(str(now))
    except:
        pass

    if not is_restarted:
        time.sleep(0.5) # Smooth transition
    
    show_splash(restarted=is_restarted)
    if not is_restarted:
        ask_terminal()
    
    current_cat = "HUB"
    
    try:
        while True:
            choice = None
            flush_input()
            
            # Rendering elegant tabbed header and clean dashboard card UI
            print_hub_header(active_tab=current_cat)

            if current_cat == "HUB":
                items = [
                    f"{C.NEON_GREEN}[A] 📱  Android Console{C.RST}              {C.LIGHT_GRAY}Build debug/release APKs, install to phone{C.RST}",
                    f"{C.NEON_PURP}[B] 🖥   Build & Release{C.RST}             {C.LIGHT_GRAY}Windows desktop apps, production web, macOS{C.RST}",
                    f"{C.NEON_BLUE}[D] ⚙️   Development Hub{C.RST}             {C.LIGHT_GRAY}Start Expo Metro bundler, Electron local test{C.RST}",
                    f"{C.NEON_CYAN}[P] 🌐  Portals & Browsers{C.RST}           {C.LIGHT_GRAY}Vite React/Legacy portal host, browser choice{C.RST}",
                    f"{C.GOLD}[O] 🚀  Ops & Deployment{C.RST}              {C.LIGHT_GRAY}Firebase hosting, Firestore rules, Git sync{C.RST}",
                    f"{C.LIGHT_GRAY}[X] 🛠   Advanced Options{C.RST}            {C.LIGHT_GRAY}Setup wizard, version self-upgrade, CalcX{C.RST}",
                    "",
                    f"{C.LAVENDER}[G] 💎  LAUNCH PREMIUM WEB GUI{C.RST}        {C.MINT}[Recomm. Glassmorphic Web Dashboard]{C.RST}",
                    f"{C.ROSE}[R] 🔄  Reboot Hub console{C.RST}           {C.RED}[Q] 🚪  Quit Terminal Session{C.RST}",
                    f"{C.NEON_YELLOW}[H] 💡  Quick Cheat Sheet{C.RST}"
                ]
                draw_card("NAVIGATION DASHBOARD", items, f"SELECT TAB KEY (A, B, D, P, O, X, G, R, Q, H)", color_theme=C.NEON_PURP, width=78)
                
                print(f"\n  {C.NEON_PURP}orbit {C.NEON_CYAN}❯{C.RST} ", end='', flush=True)
                choice = get_key()
                
                if choice == 'a': current_cat = "ANDROID"
                elif choice == 'b': current_cat = "BUILD"
                elif choice == 'd': current_cat = "DEV"
                elif choice == 'p': current_cat = "PORTAL"
                elif choice == 'o': current_cat = "OPS"
                elif choice == 'x': current_cat = "ADV"
                elif choice == 'k': launch_system_shell()
                elif choice == 'e': elevate_privileges()
                elif choice == 'g': launch_gui()
                elif choice == 'h': show_cheat_sheet()
                elif choice == 'r':
                    print(f"\n  {C.CYAN}[*] Shutting down services...{C.RST}")
                    time.sleep(0.8)
                    print(f"  {C.CYAN}[*] Rebooting BhasaGrid Hub...{C.RST}")
                    time.sleep(0.7)
                    os.execv(sys.executable, [sys.executable] + sys.argv + ["--restarted"])
                elif choice == 'q': break
                continue

            elif current_cat == "ANDROID":
                items = [
                    f"{C.NEON_CYAN}1.{C.RST} {C.WHT}Build Debug APK{C.RST}             {C.GRAY}(Standard debug output){C.RST}",
                    f"{C.NEON_CYAN}2.{C.RST} {C.WHT}Build Release APK{C.RST}           {C.GRAY}(Signed production ready){C.RST}",
                    f"{C.NEON_CYAN}3.{C.RST} {C.WHT}Build Debug + Release{C.RST}       {C.GRAY}(Both targets cascaded){C.RST}",
                    f"{C.NEON_CYAN}4.{C.RST} {C.WHT}Clean Project Gradle Cache{C.RST}  {C.GRAY}(Removes locks/caches){C.RST}",
                    f"{C.NEON_CYAN}5.{C.RST} {C.WHT}Fresh Rebuild Full Chain{C.RST}    {C.GRAY}(Clean → Build both APKs){C.RST}",
                    f"{C.NEON_GREEN}6. Clean & Build Debug APK{C.RST}        {C.NEON_BLUE}{C.BOLD}[MOST POPULAR DEV FLOW]{C.RST}",
                    f"{C.NEON_CYAN}7.{C.RST} {C.WHT}Install APK to Phone via ADB{C.RST}   {C.GRAY}(Requires USB Debugging){C.RST}",
                    f"{C.NEON_GREEN}8. Physical Dev Run (Build+Push){C.RST}   {C.LAVENDER}[Auto-deploy device hook]{C.RST}",
                    "",
                    f"{C.ROSE}[B] ⬅  Back to Navigation Dashboard{C.RST}"
                ]
                draw_card("ANDROID AUTOMATION WORKSPACE", items, f"PRESS KEY (1-8, B)", color_theme=C.NEON_GREEN, width=78)
                
                print(f"\n  {C.NEON_GREEN}orbit {C.NEON_CYAN}❯{C.RST} ", end='', flush=True)
                c = get_key()
                if c == 'b': current_cat = "HUB"; continue
                if c == '1': build_android_debug()
                elif c == '2': build_android_release()
                elif c == '3': build_android_both()
                elif c == '4': clean_android()
                elif c == '5': fresh_build_android()
                elif c == '6': clean_build_android_debug()
                elif c == '7': install_on_device()
                elif c == '8': debug_physical_device_workflow()
                
                if c: 
                    set_terminal_mode(True)
                    input(f"\n  {C.GRAY}Press Enter to continue...{C.RST}")
                    set_terminal_mode(False)

            elif current_cat == "BUILD":
                items = [
                    f"{C.NEON_CYAN}1.{C.RST} {C.WHT}Build Windows Desktop App{C.RST}     {C.GRAY}(Native Win32 portable executable){C.RST}",
                    f"{C.NEON_CYAN}2.{C.RST} {C.WHT}Build macOS DMG Package{C.RST}       {C.GRAY}(Standalone app bundle installer){C.RST}",
                    f"{C.NEON_CYAN}3.{C.RST} {C.WHT}Build Linux Standalone App{C.RST}    {C.GRAY}(Portable universal AppImage){C.RST}",
                    f"{C.NEON_CYAN}4.{C.RST} {C.WHT}Build Production Web Bundle{C.RST}   {C.GRAY}(Highly optimized web dist/ assets){C.RST}",
                    f"{C.GOLD}5. FULL CASCADE PRODUCTION RELEASE{C.RST}  {C.NEON_PINK}[Android + Desktop + Web + Cloud]{C.RST}",
                    "",
                    f"{C.ROSE}[B] ⬅  Back to Navigation Dashboard{C.RST}"
                ]
                draw_card("CROSS-PLATFORM COMPILATION ENGINE", items, f"PRESS KEY (1-5, B)", color_theme=C.NEON_PINK, width=78)
                
                print(f"\n  {C.NEON_PINK}orbit {C.NEON_CYAN}❯{C.RST} ", end='', flush=True)
                c = get_key()
                if c == 'b': current_cat = "HUB"; continue
                if c == '1': build_desktop()
                elif c == '2': build_mac()
                elif c == '3': build_linux()
                elif c == '4': build_web()
                elif c == '5': full_release()
                
                if c: 
                    set_terminal_mode(True)
                    input(f"\n  {C.GRAY}Press Enter to continue...{C.RST}")
                    set_terminal_mode(False)

            elif current_cat == "DEV":
                items = [
                    f"{C.NEON_CYAN}1.{C.RST} {C.WHT}Start Expo Metro Dev Server{C.RST}   {C.GRAY}(Port 8081 - Live hot-reloads){C.RST}",
                    f"{C.NEON_CYAN}2.{C.RST} {C.WHT}Launch Electron Local Test{C.RST}    {C.GRAY}(Integrates desktop modules){C.RST}",
                    f"{C.NEON_CYAN}3.{C.RST} {C.WHT}Physical Device Dev Flow{C.RST}      {C.GRAY}(Build APK + Install + Expo Server){C.RST}",
                    "",
                    f"{C.ROSE}[B] ⬅  Back to Navigation Dashboard{C.RST}"
                ]
                draw_card("ACTIVE DEVELOPMENT & EMULATION", items, f"PRESS KEY (1-3, B)", color_theme=C.NEON_BLUE, width=78)
                
                print(f"\n  {C.NEON_BLUE}orbit {C.NEON_CYAN}❯{C.RST} ", end='', flush=True)
                c = get_key()
                if c == 'b': current_cat = "HUB"; continue
                if c == '1': start_dev_server()
                elif c == '2': launch_electron_dev()
                elif c == '3': physical_dev_flow()
                
                if c: 
                    set_terminal_mode(True)
                    input(f"\n  {C.GRAY}Press Enter to continue...{C.RST}")
                    set_terminal_mode(False)

            elif current_cat == "PORTAL":
                items = [
                    f"{C.NEON_CYAN}1.{C.RST} {C.WHT}Start React Download Portal{C.RST}   {C.MINT}[Modern Vite - Port 5173]{C.RST}",
                    f"{C.NEON_CYAN}2.{C.RST} {C.WHT}Start Legacy Static Portal{C.RST}    {C.GRAY}[Legacy Static - Port 5679]{C.RST}",
                    f"{C.NEON_CYAN}3.{C.RST} {C.WHT}Launch Both Portals in Dev{C.RST}    {C.GRAY}(Simultaneous test environment){C.RST}",
                    f"{C.NEON_CYAN}4.{C.RST} {C.WHT}Configure Target Browser{C.RST}       {C.GRAY}(Incognito / specific browser select){C.RST}",
                    "",
                    f"{C.ROSE}[B] ⬅  Back to Navigation Dashboard{C.RST}"
                ]
                draw_card("PORTAL CONTROLLERS & WEBSERVER HOSTS", items, f"PRESS KEY (1-4, B)", color_theme=C.NEON_CYAN, width=78)
                
                print(f"\n  {C.NEON_CYAN}orbit {C.NEON_CYAN}❯{C.RST} ", end='', flush=True)
                c = get_key()
                if c == 'b': current_cat = "HUB"; continue
                if c == '1': start_react_portal_server()
                elif c == '2': start_download_portal_server()
                elif c == '3': start_both_portals()
                elif c == '4': set_preferred_browser()
                
                if c: 
                    set_terminal_mode(True)
                    input(f"\n  {C.GRAY}Press Enter to continue...{C.RST}")
                    set_terminal_mode(False)

            elif current_cat == "OPS":
                items = [
                    f"{C.NEON_CYAN}1.{C.RST} {C.WHT}Deploy Application to Firebase{C.RST} {C.GRAY}(Hosting, Functions & Assets){C.RST}",
                    f"{C.NEON_CYAN}2.{C.RST} {C.WHT}Deploy Firestore Security Rules{C.RST} {C.GRAY}(Rapid Firestore permissions push){C.RST}",
                    f"{C.NEON_CYAN}3.{C.RST} {C.WHT}Toggle Portal Access Gateway{C.RST}   {C.GRAY}(Turn auth requirement ON / OFF){C.RST}",
                    f"{C.NEON_CYAN}4.{C.RST} {C.WHT}Interactive Version Git Menu{C.RST}   {C.GRAY}(Commits, push, branch, sync status){C.RST}",
                    f"{C.NEON_CYAN}5.{C.RST} {C.WHT}Run Project Diagnostic Audit{C.RST}   {C.GRAY}(Ports, environment vars, integrity){C.RST}",
                    "",
                    f"{C.ROSE}[B] ⬅  Back to Navigation Dashboard{C.RST}"
                ]
                draw_card("OPERATIONS, DEPLOYMENT & SYSTEMS CLOUD", items, f"PRESS KEY (1-5, B)", color_theme=C.GOLD, width=78)
                
                print(f"\n  {C.GOLD}orbit {C.NEON_CYAN}❯{C.RST} ", end='', flush=True)
                c = get_key()
                if c == 'b': current_cat = "HUB"; continue
                if c == '1': deploy_firebase()
                elif c == '2': deploy_firestore_rules()
                elif c == '3': toggle_portal_auth()
                elif c == '4': git_ops_menu()
                elif c == '5': check_project_health()
                
                if c: 
                    set_terminal_mode(True)
                    input(f"\n  {C.GRAY}Press Enter to continue...{C.RST}")
                    set_terminal_mode(False)

            elif current_cat == "ADV":
                items = [
                    f"{C.NEON_CYAN}1.{C.RST} {C.WHT}Open Legacy Desktop GUI{C.RST}        {C.GRAY}(Native Tkinter Windows app window){C.RST}",
                    f"{C.NEON_CYAN}2.{C.RST} {C.WHT}Launch Initial Setup Wizard{C.RST}    {C.GRAY}(Deletes configs & rebuilds settings){C.RST}",
                    f"{C.NEON_CYAN}3.{C.RST} {C.WHT}Cleanup Old Dist/Release Folders{C.RST}{C.GRAY}(Reclaims hard drive space){C.RST}",
                    f"{C.NEON_CYAN}4.{C.RST} {C.WHT}Reset Global Terminal Choice{C.RST}    {C.GRAY}(Resets window launch options){C.RST}",
                    f"{C.NEON_CYAN}5.{C.RST} {C.WHT}Register 'orbit' Globally{C.RST}      {C.GRAY}(Adds PATH hook to run from anywhere){C.RST}",
                    f"{C.NEON_CYAN}6.{C.RST} {C.WHT}Upgrade Version & Self-Config{C.RST}   {C.GRAY}(Modifies source file version hook){C.RST}",
                    f"{C.NEON_CYAN}7.{C.RST} {C.WHT}Start CalcX Decoy Expo Server{C.RST}  {C.GRAY}(Calculator disguise app dev host){C.RST}",
                    f"{C.NEON_CYAN}8.{C.RST} {C.WHT}Switch Project Stealth Level{C.RST}   {C.GRAY}(Dev/Stealth environment stealth swap){C.RST}",
                    f"{C.NEON_CYAN}9.{C.RST} {C.WHT}Clean & Install CalcX Decoy{C.RST}    {C.GRAY}(Calculator build cascade wipe){C.RST}",
                    f"{C.NEON_CYAN}0.{C.RST} {C.WHT}Backup System Env Configs{C.RST}      {C.GRAY}(Saves active setups into single ZIP){C.RST}",
                    "",
                    f"{C.ROSE}[B] ⬅  Back to Navigation Dashboard{C.RST}"
                ]
                draw_card("SYSTEM KERNEL & ADVANCED DIAGNOSTICS", items, f"PRESS KEY (0-9, B)", color_theme=C.LIGHT_GRAY, width=78)
                
                print(f"\n  {C.LIGHT_GRAY}orbit {C.NEON_CYAN}❯{C.RST} ", end='', flush=True)
                c = get_key()
                if c == 'b': current_cat = "HUB"; continue
                if c == '1': launch_tkinter_gui()
                elif c == '2': launch_installer()
                elif c == '3': cleanup_release()
                elif c == '4': reset_terminal_choice()
                elif c == '5': register_globally()
                elif c == '6': self_upgrade_version()
                elif c == '7':
                    print("\n--- [START CALCX EXPO SERVER] ---")
                    calc_dir = os.path.join(PROJECT_ROOT, "CalcX -- A Master Calculator")
                    choice = ask_server_terminal("CalcX Master Calculator")
                    if choice == '1':
                        print(f"{C.CYAN}Starting in current terminal. Press Ctrl+C to stop.{C.RST}")
                        p = subprocess.Popen(["npm", "start"], cwd=calc_dir, shell=True)
                        register_active_service("CalcX Decoy Server", p.pid)
                        try:
                            p.wait()
                        except KeyboardInterrupt:
                            p.terminate()
                        unregister_active_service("CalcX Decoy Server")
                    else:
                        print("Launching in a new console window...")
                        if os.name == 'nt':
                            p = subprocess.Popen(
                                ["cmd.exe", "/k", "npm start"],
                                cwd=calc_dir,
                                creationflags=subprocess.CREATE_NEW_CONSOLE
                            )
                        else:
                            p = subprocess.Popen(
                                ["gnome-terminal", "--", "bash", "-c", f"cd '{calc_dir}' && npm start"],
                                start_new_session=True
                            )
                        register_active_service("CalcX Decoy Server", p.pid)
                        print(f"\n[SUCCESS] CalcX Expo server launched in new window.")
                elif c == '8':
                    print("\n--- [SWITCH ENVIRONMENT] ---")
                    env_path = os.path.join(UNIVERSAL_DIR, ".env")
                    if os.path.exists(env_path):
                        try:
                            with open(env_path, 'r') as f:
                                env_data = f.read()
                            if "EXCLUDE_PRIVACY_STEALTH = true" in env_data or "STEALTH_MODE = true" in env_data:
                                env_data = env_data.replace("EXCLUDE_PRIVACY_STEALTH = true", "EXCLUDE_PRIVACY_STEALTH = false")
                                env_data = env_data.replace("STEALTH_MODE = true", "STEALTH_MODE = false")
                                print(f"  {C.GRN}✔ Switched Environment to Standard Dev/Prod mode.{C.RST}")
                            else:
                                env_data += "\nEXCLUDE_PRIVACY_STEALTH = true\n"
                                print(f"  {C.CYAN}✔ Switched Environment to Custom Private/Isolated mode.{C.RST}")
                            with open(env_path, 'w') as f:
                                f.write(env_data)
                        except Exception as e:
                            print(f"  {C.RED}Error updating .env: {e}{C.RST}")
                    else:
                        print(f"  {C.RED}.env file not found in {UNIVERSAL_DIR}!{C.RST}")
                elif c == '9':
                    clean_decoy_app()
                elif c == '0':
                    backup_project_config()
                
                if c: 
                    set_terminal_mode(True)
                    input(f"\n  {C.GRAY}Press Enter to continue...{C.RST}")
                    set_terminal_mode(False)

            # Final safety check to prevent loop runaway
            if not choice and current_cat == "HUB":
                time.sleep(0.1)

    except KeyboardInterrupt:
        print(f"\n  {C.GRAY}Exiting Hub...{C.RST}")
        set_terminal_mode(True)
        sys.exit(0)
    except Exception as e:
        print(f"\n  {C.RED}[CRITICAL ERROR] Hub crashed: {e}{C.RST}")
        print(f"  {C.YEL}Attempting emergency restart...{C.RST}")
        set_terminal_mode(True)
        time.sleep(2)
        os.execv(sys.executable, [sys.executable] + sys.argv)
if __name__ == "__main__":
    main()
