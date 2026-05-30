import os
import sys
import zipfile
import json
import time
from datetime import datetime
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

BACKUP_DEST = r"C:\BhasaGrid-BackUps"

def list_backups():
    """Lists all zip backups in the backup folder."""
    if not os.path.exists(BACKUP_DEST):
        return []
    backups = []
    for f in os.listdir(BACKUP_DEST):
        full_path = os.path.join(BACKUP_DEST, f)
        if os.path.isfile(full_path) and f.startswith("bhasagrid_backup_") and f.endswith(".zip"):
            backups.append(full_path)
    # Sort by modification time (newest first)
    backups.sort(key=lambda x: os.path.getmtime(x), reverse=True)
    return backups

def perform_restore(zip_path, project_root):
    """Extracts a backup zip into the project root, recovering files."""
    try:
        print(f"\n  {C.NEON_PURP}[*] Launching restoration engine...{C.RST}")
        print(f"  {C.GRAY}Extracting checkpoint: {os.path.basename(zip_path)}{C.RST}")
        print(f"  {C.GRAY}Restoring workspace state at: {project_root}{C.RST}\n")
        
        with zipfile.ZipFile(zip_path, 'r') as zipf:
            # Check for manifest file
            zip_files = zipf.namelist()
            manifest = None
            if "backup_manifest.json" in zip_files:
                try:
                    manifest_data = zipf.read("backup_manifest.json")
                    manifest = json.loads(manifest_data)
                except:
                    pass
            
            # Extract files
            for file_in_zip in zip_files:
                if file_in_zip == "backup_manifest.json":
                    continue
                # Restore file
                zipf.extract(file_in_zip, project_root)
                print(f"  {C.NEON_GREEN}✔ Recovered:{C.RST} {file_in_zip}")
                
            # If deleted files are recorded in manifest, notify user
            if manifest and manifest.get("deleted_files"):
                print(f"\n  {C.GOLD}⚠ INFO: The following files were marked as DELETED in this checkpoint:{C.RST}")
                for df in manifest["deleted_files"]:
                    print(f"    {C.GRAY}● {df}{C.RST}")
                    
        print(f"\n  {C.NEON_GREEN}{C.BOLD}✔ RESTORATION COMPLETE: Uncommitted changes fully recovered!{C.RST}\n")
        return True
    except Exception as e:
        print(f"  {C.RED}✘ Restoration failed: {e}{C.RST}")
        return False

def get_key():
    """Simple key press reader for Windows console selection."""
    if os.name == 'nt':
        import msvcrt
        while not msvcrt.kbhit():
            time.sleep(0.01)
        try:
            return msvcrt.getwch().lower()
        except:
            return None
    else:
        # Fallback for linux/mac
        return input().strip().lower()

def main():
    tools_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(tools_dir)
    
    backups = list_backups()
    
    print(f"\n  {C.NEON_PURP}{C.BOLD}╭─── [ BHASAGRID AUTOMATION — ONE-CLICK RESTORE CONSOLE ] ───╮{C.RST}")
    print(f"  {C.NEON_PURP}{C.BOLD}│{C.RST}  Quick recovery checkpoints for uncommitted modifications. │{C.NEON_PURP}{C.BOLD}│{C.RST}")
    print(f"  {C.NEON_PURP}{C.BOLD}╰─────────────────────────────────────────────────────────────╯{C.RST}\n")
    
    if not backups:
        print(f"  {C.RED}✘ No recovery checkpoints found in {BACKUP_DEST}!{C.RST}\n")
        input("  Press Enter to exit...")
        return
        
    print(f"  {C.WHT}Available Checkpoints (Newest first):{C.RST}\n")
    for i, b_path in enumerate(backups[:10], 1):
        filename = os.path.basename(b_path)
        mtime = datetime.fromtimestamp(os.path.getmtime(b_path)).strftime('%Y-%m-%d %H:%M:%S')
        # Check size
        size_kb = os.path.getsize(b_path) / 1024
        print(f"  {C.NEON_CYAN}[{i}]{C.RST}  {C.WHT}{filename:<38}{C.RST} {C.GRAY}({mtime} | {size_kb:.1f} KB){C.RST}")
        
    print(f"\n  {C.GOLD}[Q] Quit restore menu{C.RST}")
    print(f"\n  {C.BOLD}Select recovery number (1-{min(10, len(backups))}) >{C.RST} ", end='', flush=True)
    
    choice = get_key()
    if choice == 'q' or not choice:
        print(f"\n  {C.GRAY}Restoration aborted.{C.RST}")
        return
        
    try:
        idx = int(choice) - 1
        if 0 <= idx < min(10, len(backups)):
            selected_zip = backups[idx]
            perform_restore(selected_zip, project_root)
        else:
            print(f"\n  {C.RED}✘ Invalid selection.{C.RST}")
    except ValueError:
        print(f"\n  {C.RED}✘ Invalid selection.{C.RST}")
        
    input(f"  {C.GRAY}Press Enter to continue...{C.RST}")

if __name__ == "__main__":
    main()
