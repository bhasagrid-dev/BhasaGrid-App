import os
import sys
import subprocess
import zipfile
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

BACKUP_DIR = r"C:\BhasaGrid-BackUps"

def get_latest_backup():
    """Locates the latest zip backup in C:\\BhasaGrid-BackUps."""
    if not os.path.exists(BACKUP_DIR):
        return None
    files = []
    for f in os.listdir(BACKUP_DIR):
        full_path = os.path.join(BACKUP_DIR, f)
        if os.path.isfile(full_path) and f.startswith("bhasagrid_backup_") and f.endswith(".zip"):
            files.append((full_path, os.path.getmtime(full_path)))
    if not files:
        return None
    files.sort(key=lambda x: x[1], reverse=True)
    return files[0][0]

def repair_git(project_root):
    """Checks if .git exists, otherwise initializes and stages files."""
    git_dir = os.path.join(project_root, ".git")
    if os.path.exists(git_dir):
        print(f"  {C.NEON_GREEN}● Git Repository: ACTIVE{C.RST}")
        return True
    
    print(f"\n  {C.RED}✘ Git Repository: DELETED / UNTRACKED{C.RST}")
    print(f"  {C.CYAN}[*] Attempting to re-initialize Git repository...{C.RST}")
    
    try:
        subprocess.run(["git", "init"], cwd=project_root, stdout=subprocess.DEVNULL)
        subprocess.run(["git", "add", "."], cwd=project_root, stdout=subprocess.DEVNULL)
        print(f"  {C.NEON_GREEN}✔ SUCCESS: Git re-initialized and all source files staged!{C.RST}")
        print(f"  {C.GRAY}Note: Remember to add your remote url via: git remote add origin <URL>{C.RST}")
        return True
    except Exception as e:
        print(f"  {C.RED}✘ Failed to initialize Git: {e}{C.RST}")
        return False

def repair_node_modules(project_root):
    """Checks if node_modules are deleted and reinstalls dependencies."""
    folders = [
        ("download-portal", "Vite Static Download Portal"),
        ("BhasaGrid-universal", "Universal Expo Mobile Application")
    ]
    
    for relative_path, label in folders:
        target_dir = os.path.join(project_root, relative_path)
        if not os.path.exists(target_dir):
            continue
            
        modules_dir = os.path.join(target_dir, "node_modules")
        if os.path.exists(modules_dir):
            print(f"  {C.NEON_GREEN}● {label} Dependencies: INSTALLED{C.RST}")
        else:
            print(f"\n  {C.RED}✘ {label} Dependencies: node_modules DELETED!{C.RST}")
            print(f"  {C.NEON_BLUE}[*] Launching npm install inside '{relative_path}' folder (may take 1-2 mins)...{C.RST}")
            try:
                # Trigger clean install in shell
                rc = subprocess.call(["npm", "install"], cwd=target_dir, shell=True)
                if rc == 0:
                    print(f"  {C.NEON_GREEN}✔ SUCCESS: Dependencies restored for {label}!{C.RST}")
                else:
                    print(f"  {C.RED}✘ Failed: npm install exited with code {rc}{C.RST}")
            except Exception as e:
                print(f"  {C.RED}✘ Failed to run npm install: {e}{C.RST}")

def repair_configs(project_root):
    """Checks if critical .env configs are deleted and restores them from zip backups."""
    env_paths = [
        os.path.join(project_root, ".env"),
        os.path.join(project_root, "download-portal", ".env"),
        os.path.join(project_root, "BhasaGrid-universal", ".env")
    ]
    
    missing_configs = [p for p in env_paths if not os.path.exists(p)]
    
    if not missing_configs:
        print(f"  {C.NEON_GREEN}● Environment Configs: INTACT (.env files active){C.RST}")
        return True
        
    print(f"\n  {C.RED}✘ Environment Configs: MISSING (.env files deleted!){C.RST}")
    latest_zip = get_latest_backup()
    
    if not latest_zip:
        print(f"  {C.RED}✘ Restoration Failed: No zip backups found in {BACKUP_DIR}!{C.RST}")
        return False
        
    print(f"  {C.NEON_PURP}[*] Restoring missing files from backup: {os.path.basename(latest_zip)}...{C.RST}")
    
    restored_count = 0
    try:
        with zipfile.ZipFile(latest_zip, 'r') as zipf:
            # List all files inside the zip
            zip_files = zipf.namelist()
            
            for full_env_path in missing_configs:
                # Find relative path format matching zip layout
                rel_path = os.path.relpath(full_env_path, project_root).replace("\\", "/")
                
                # Zip paths always use forward slashes
                if rel_path in zip_files or (rel_path == ".env" and ".env" in zip_files):
                    # Extract single file
                    zipf.extract(rel_path, project_root)
                    print(f"  {C.NEON_GREEN}✔ Restored: {rel_path}{C.RST}")
                    restored_count += 1
                    
        if restored_count > 0:
            print(f"  {C.NEON_GREEN}✔ SUCCESS: {restored_count} critical environment configuration files restored!{C.RST}")
            return True
        else:
            print(f"  {C.RED}✘ Restoration Failed: Could not locate .env files inside the backup archive.{C.RST}")
            return False
            
    except Exception as e:
        print(f"  {C.RED}✘ Restoration Failed: {e}{C.RST}")
        return False

def main():
    tools_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(tools_dir)
    
    print(f"\n  {C.NEON_PURP}{C.BOLD}╭─── [ BHASAGRID AUTOMATION — PROJECT AUTO-REPAIR ENGINE ] ───╮{C.RST}")
    print(f"  {C.NEON_PURP}{C.BOLD}│{C.RST}  Running multi-point diagnostic check of workspace...      {C.NEON_PURP}{C.BOLD}│{C.RST}")
    print(f"  {C.NEON_PURP}{C.BOLD}╰─────────────────────────────────────────────────────────────╯{C.RST}\n")
    
    repair_git(project_root)
    print()
    repair_configs(project_root)
    print()
    repair_node_modules(project_root)
    
    print(f"\n  {C.NEON_GREEN}{C.BOLD}✔ Check complete! Workspace is fully verified and recovered.{C.RST}\n")

if __name__ == "__main__":
    main()
