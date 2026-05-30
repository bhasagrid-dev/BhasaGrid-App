import os
import sys
import zipfile
import shutil
import json
from datetime import datetime
import re
import io

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

# --- CONFIGURATIONS ---
BACKUP_DEST = r"C:\BhasaGrid-BackUps"
STATE_FILE = os.path.join(BACKUP_DEST, ".backup_state.json")
EXCLUDE_DIRS = {
    'node_modules', '.git', '.expo', '.gradle', 'build', 
    'release', 'dist', '.venv', '.idea', '__pycache__',
    'download-portal-react', 'oracle-server-backend', 'backups'
}

def rotate_backups():
    """Keeps only the last 10 backups to preserve disk space."""
    if not os.path.exists(BACKUP_DEST):
        return
    files = []
    for f in os.listdir(BACKUP_DEST):
        full_path = os.path.join(BACKUP_DEST, f)
        if os.path.isfile(full_path) and f.startswith("bhasagrid_backup_") and f.endswith(".zip"):
            files.append((full_path, os.path.getmtime(full_path)))
    files.sort(key=lambda x: x[1])
    if len(files) > 10:
        to_delete = files[:-10]
        for f_path, _ in to_delete:
            try:
                os.remove(f_path)
            except:
                pass

def load_backup_state():
    """Loads the last saved state of modification times and sizes."""
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {}

def save_backup_state(state):
    """Saves the current state of modification times and sizes."""
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    try:
        with open(STATE_FILE, 'w', encoding='utf-8') as f:
            json.dump(state, f, indent=4)
    except:
        pass

def perform_backup(silent=False, force_full=False):
    tools_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(tools_dir)
    
    # Auto-create destination
    if not os.path.exists(BACKUP_DEST):
        try:
            os.makedirs(BACKUP_DEST)
        except Exception as e:
            if not silent:
                print(f"  {C.RED}✘ Failed to create backup folder: {e}{C.RST}")
            return False

    # Scan project files
    current_files = {}
    for root, dirs, files in os.walk(project_root):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for file in files:
            full_path = os.path.join(root, file)
            try:
                current_files[full_path] = {
                    "mtime": os.path.getmtime(full_path),
                    "size": os.path.getsize(full_path)
                }
            except:
                pass

    last_state = load_backup_state()
    
    # Identify new / modified / deleted files
    modified_files = []
    deleted_files = []
    
    for path, meta in current_files.items():
        if path not in last_state:
            modified_files.append((path, "CREATED"))
        elif last_state[path]["mtime"] != meta["mtime"] or last_state[path]["size"] != meta["size"]:
            modified_files.append((path, "MODIFIED"))
            
    for path in last_state:
        if path not in current_files:
            deleted_files.append(path)

    # Determine backup mode
    is_incremental = not force_full and len(last_state) > 0
    
    if is_incremental and not modified_files and not deleted_files:
        if not silent:
            print(f"  {C.GRAY}ℹ No modifications detected. Skipping backup.{C.RST}")
        return True

    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    mode_suffix = "inc" if is_incremental else "full"
    zip_filename = f"bhasagrid_backup_{timestamp}_{mode_suffix}.zip"
    zip_path = os.path.join(BACKUP_DEST, zip_filename)
    
    if not silent:
        mode_label = f"{C.NEON_CYAN}INCREMENTAL{C.RST}" if is_incremental else f"{C.GOLD}FULL BASE{C.RST}"
        print(f"\n  {C.NEON_PURP}{C.BOLD}🌌 BHASAGRID BACKUP ENGINE v10.0{C.RST}")
        print(f"  {C.GRAY}Backup Mode: {mode_label}{C.RST}")
        print(f"  {C.GRAY}Destination: {zip_path}{C.RST}\n")

    file_count = 0
    try:
        # Build file list to package
        files_to_backup = current_files.keys() if not is_incremental else [path for path, _ in modified_files]
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Write backup manifest file inside zip
            manifest = {
                "backup_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "mode": mode_suffix,
                "deleted_files": [os.path.relpath(p, project_root).replace("\\", "/") for p in deleted_files],
                "files": [os.path.relpath(p, project_root).replace("\\", "/") for p in files_to_backup]
            }
            zipf.writestr("backup_manifest.json", json.dumps(manifest, indent=4))
            
            for full_file_path in files_to_backup:
                rel_path = os.path.relpath(full_file_path, project_root)
                if os.path.abspath(full_file_path) == os.path.abspath(zip_path):
                    continue
                zipf.write(full_file_path, rel_path)
                file_count += 1
                
        # Save state database
        save_backup_state(current_files)
        rotate_backups()
        
        if not silent:
            print(f"  {C.NEON_GREEN}✔ SUCCESS: {mode_suffix.upper()} BACKUP COMPLETE!{C.RST}")
            print(f"  {C.GRAY}Packaged {C.WHT}{file_count}{C.RST} {C.GRAY}files into {C.WHT}{os.path.basename(zip_path)}{C.RST}\n")
        return True
        
    except Exception as e:
        if not silent:
            print(f"  {C.RED}✘ Backup failed: {e}{C.RST}")
        return False

def main():
    silent = "--silent" in sys.argv
    force_full = "--full" in sys.argv
    perform_backup(silent=silent, force_full=force_full)

if __name__ == "__main__":
    main()
