import os
import sys
import json
import base64
import hashlib

# ==========================================
# PURE PYTHON AES-128 CBC IMPLEMENTATION
# ==========================================
# Clean, robust, 100% dependency-free Rijndael block cipher

# Rijndael S-box and Inverse S-box
SBOX = [
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
    0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
    0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
]

INV_SBOX = [
    0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb,
    0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb,
    0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e,
    0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25,
    0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92,
    0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84,
    0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06,
    0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b,
    0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73,
    0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e,
    0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b,
    0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4,
    0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f,
    0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef,
    0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61,
    0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d
]

RCON = [
    0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36
]

def sub_word(word):
    return [SBOX[b] for b in word]

def rot_word(word):
    return word[1:] + word[:1]

def xor_bytes(b1, b2):
    return [x ^ y for x, y in zip(b1, b2)]

def key_expansion(key_bytes):
    # key_bytes is 16 bytes for AES-128
    words = [list(key_bytes[i:i+4]) for i in range(0, 16, 4)]
    
    for i in range(4, 44):
        temp = list(words[i-1])
        if i % 4 == 0:
            temp = sub_word(rot_word(temp))
            temp[0] ^= RCON[i // 4]
        words.append(xor_bytes(words[i-4], temp))
        
    return [b for w in words for b in w]

# State operations
def add_round_key(state, round_key):
    for i in range(16):
        state[i] ^= round_key[i]

def sub_bytes(state):
    for i in range(16):
        state[i] = SBOX[state[i]]

def inv_sub_bytes(state):
    for i in range(16):
        state[i] = INV_SBOX[state[i]]

def shift_rows(state):
    # Left shift rows
    state[1], state[5], state[9], state[13] = state[5], state[9], state[13], state[1]
    state[2], state[6], state[10], state[14] = state[10], state[14], state[2], state[6]
    state[3], state[7], state[11], state[15] = state[15], state[3], state[7], state[11]

def inv_shift_rows(state):
    # Right shift rows
    state[1], state[5], state[9], state[13] = state[13], state[1], state[5], state[9]
    state[2], state[6], state[10], state[14] = state[6], state[10], state[14], state[2]
    state[3], state[7], state[11], state[15] = state[7], state[11], state[15], state[3]

def xtime(a):
    return (((a << 1) ^ 0x1B) & 0xFF) if (a & 0x80) else (a << 1)

def mix_single_column(r):
    t = r[0] ^ r[1] ^ r[2] ^ r[3]
    u = r[0]
    r[0] ^= t ^ xtime(r[0] ^ r[1])
    r[1] ^= t ^ xtime(r[1] ^ r[2])
    r[2] ^= t ^ xtime(r[2] ^ r[3])
    r[3] ^= t ^ xtime(r[3] ^ u)

def mix_columns(state):
    for i in range(0, 16, 4):
        col = state[i:i+4]
        mix_single_column(col)
        state[i:i+4] = col

def multiply(x, y):
    # Russian Peasant multiplication in GF(2^8)
    res = 0
    for i in range(8):
        if y & 1:
            res ^= x
        hi = x & 0x80
        x <<= 1
        if hi:
            x ^= 0x1B
        y >>= 1
    return res & 0xFF

def inv_mix_columns(state):
    for i in range(0, 16, 4):
        col = state[i:i+4]
        c0, c1, c2, c3 = col[0], col[1], col[2], col[3]
        col[0] = multiply(c0, 0x0E) ^ multiply(c1, 0x0B) ^ multiply(c2, 0x0D) ^ multiply(c3, 0x09)
        col[1] = multiply(c0, 0x09) ^ multiply(c1, 0x0E) ^ multiply(c2, 0x0B) ^ multiply(c3, 0x0D)
        col[2] = multiply(c0, 0x0D) ^ multiply(c1, 0x09) ^ multiply(c2, 0x0E) ^ multiply(c3, 0x0B)
        col[3] = multiply(c0, 0x0B) ^ multiply(c1, 0x0D) ^ multiply(c2, 0x09) ^ multiply(c3, 0x0E)
        state[i:i+4] = col

def aes_encrypt_block(block, round_keys):
    state = list(block)
    add_round_key(state, round_keys[0:16])
    
    for r in range(1, 10):
        sub_bytes(state)
        shift_rows(state)
        mix_columns(state)
        add_round_key(state, round_keys[r*16 : (r+1)*16])
        
    sub_bytes(state)
    shift_rows(state)
    add_round_key(state, round_keys[160:176])
    return state

def aes_decrypt_block(block, round_keys):
    state = list(block)
    add_round_key(state, round_keys[160:176])
    
    for r in range(9, 0, -1):
        inv_shift_rows(state)
        inv_sub_bytes(state)
        add_round_key(state, round_keys[r*16 : (r+1)*16])
        inv_mix_columns(state)
        
    inv_shift_rows(state)
    inv_sub_bytes(state)
    add_round_key(state, round_keys[0:16])
    return state

def aes_encrypt_cbc(data_bytes, key_bytes, iv_bytes):
    round_keys = key_expansion(key_bytes)
    # PKCS#7 Padding
    pad_len = 16 - (len(data_bytes) % 16)
    data = list(data_bytes) + [pad_len] * pad_len
    
    ciphertext = []
    prev_block = list(iv_bytes)
    
    for i in range(0, len(data), 16):
        block = data[i:i+16]
        xored = xor_bytes(block, prev_block)
        enc = aes_encrypt_block(xored, round_keys)
        ciphertext.extend(enc)
        prev_block = enc
        
    return bytes(ciphertext)

def aes_decrypt_cbc(cipher_bytes, key_bytes, iv_bytes):
    round_keys = key_expansion(key_bytes)
    if len(cipher_bytes) % 16 != 0:
        raise ValueError("Ciphertext length is not a multiple of 16")
        
    plaintext = []
    prev_block = list(iv_bytes)
    
    for i in range(0, len(cipher_bytes), 16):
        block = list(cipher_bytes[i:i+16])
        dec = aes_decrypt_block(block, round_keys)
        xored = xor_bytes(dec, prev_block)
        plaintext.extend(xored)
        prev_block = block
        
    # Remove PKCS#7 Padding
    pad_len = plaintext[-1]
    if pad_len < 1 or pad_len > 16:
        raise ValueError("Invalid padding bytes")
    # Verify all padding bytes are equal
    for p in plaintext[-pad_len:]:
        if p != pad_len:
            raise ValueError("Padding pattern mismatch")
            
    return bytes(plaintext[:-pad_len])

# ==========================================
# AUTH CONFIGURATION & CORE ENGINE
# ==========================================

MASTER_SECRET = b"BhasaGridSec_2026"  # 16-byte secure AES master key
MASTER_IV     = b"OrbitGateIV__2026"  # 16-byte secure AES initialization vector

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
USERS_FILE = os.path.join(TOOLS_DIR, "auth_users.json")

def encrypt_data(plaintext_str):
    """Encrypts a string using AES-128-CBC and returns a base64 encoded string."""
    cipher_bytes = aes_encrypt_cbc(plaintext_str.encode('utf-8'), MASTER_SECRET, MASTER_IV)
    return base64.b64encode(cipher_bytes).decode('utf-8')

def decrypt_data(base64_str):
    """Decrypts a base64 string using AES-128-CBC and returns a plain string."""
    cipher_bytes = base64.b64decode(base64_str.encode('utf-8'))
    plaintext_bytes = aes_decrypt_cbc(cipher_bytes, MASTER_SECRET, MASTER_IV)
    return plaintext_bytes.decode('utf-8')

def load_users():
    """Decrypts and loads the users from the encrypted JSON configuration."""
    if not os.path.exists(USERS_FILE):
        # Create default user config
        default_config = {"admin": "2026"}
        save_users(default_config)
        return default_config
    
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            encrypted_str = f.read().strip()
        decrypted_str = decrypt_data(encrypted_str)
        return json.loads(decrypted_str)
    except Exception as e:
        # Fallback to defaults if decryption fails
        print(f"[*] WARNING: Failed to decrypt user configurations ({e}). Resetting to default.")
        default_config = {"admin": "2026"}
        save_users(default_config)
        return default_config

def save_users(users_dict):
    """Encrypts and saves the users dictionary to the JSON configuration file."""
    try:
        raw_str = json.dumps(users_dict, indent=4)
        encrypted_str = encrypt_data(raw_str)
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            f.write(encrypted_str)
        return True
    except Exception as e:
        print(f"[!] ERROR: Failed to save encrypted user database: {e}")
        return False

def verify_credentials(username, pin):
    """Verifies if the provided username and pin are valid."""
    users = load_users()
    if username in users:
        return users[username] == str(pin)
    return False

# ==========================================
# TERMINAL AUTHENTICATION GATE
# ==========================================

class C:
    RST  = "\033[0m"
    BOLD = "\033[1m"
    NEON_BLUE = "\033[38;5;75m"
    NEON_CYAN = "\033[38;5;86m"
    NEON_PURP = "\033[38;5;177m"
    NEON_GREEN = "\033[38;5;120m"
    RED  = "\033[38;5;196m"
    YEL  = "\033[38;5;220m"
    GRAY = "\033[38;5;242m"
    WHT  = "\033[38;5;255m"

def draw_auth_box(width=60):
    os.system('cls' if os.name == 'nt' else 'clear')
    print(f"\n  {C.NEON_PURP}{C.BOLD}╭──── [ BHASAGRID AUTOMATION – SECURITY ACCESS CONTROL ] ────╮{C.RST}")
    print(f"  {C.NEON_PURP}{C.BOLD}│{C.RST}  Multi-user security checkpoint. Authentication required.  {C.NEON_PURP}{C.BOLD}│{C.RST}")
    print(f"  {C.NEON_PURP}{C.BOLD}╰────────────────────────────────────────────────────────────╯{C.RST}\n")

def get_masked_input(prompt):
    """Secure masked input for passwords/pins (standard prompt fallback if not terminal)."""
    print(prompt, end='', flush=True)
    if os.name == 'nt':
        import msvcrt
        chars = []
        while True:
            ch = msvcrt.getch()
            if ch in (b'\r', b'\n'):
                print()
                break
            elif ch == b'\x03': # Ctrl+C
                raise KeyboardInterrupt()
            elif ch == b'\x08': # Backspace
                if chars:
                    chars.pop()
                    print('\b \b', end='', flush=True)
            else:
                chars.append(ch.decode('utf-8', errors='ignore'))
                print('*', end='', flush=True)
        return "".join(chars)
    else:
        import getpass
        return getpass.getpass("")

def run_cli_gate():
    """Terminal security check. Blocks execution if credentials mismatch."""
    # Skip auth if --silent is passed (for automated background tasks)
    if "--silent" in sys.argv:
        return
        
    try:
        attempts = 3
        while attempts > 0:
            draw_auth_box()
            print(f"  {C.GRAY}Remaining security attempts: {attempts} / 3{C.RST}\n")
            
            username = input(f"  {C.BOLD}{C.WHT}Username > {C.RST}").strip()
            if not username:
                attempts -= 1
                continue
                
            pin = get_masked_input(f"  {C.BOLD}{C.WHT}PIN / Password > {C.RST}").strip()
            
            if verify_credentials(username, pin):
                print(f"\n  {C.NEON_GREEN}✔ ACCESS GRANTED! Bootstrapping BhasaGrid Hub...{C.RST}")
                time_delay(1.0)
                return
            else:
                print(f"\n  {C.RED}✘ ACCESS DENIED: Invalid username or security credentials.{C.RST}")
                time_delay(1.5)
                attempts -= 1
                
        print(f"\n  {C.RED}[!] CRITICAL: Too many failed security attempts. Terminating session.{C.RST}\n")
        sys.exit(1)
        
    except KeyboardInterrupt:
        print(f"\n\n  {C.GRAY}Session aborted by developer.{C.RST}\n")
        sys.exit(0)

def time_delay(seconds):
    import time
    time.sleep(seconds)

# ==========================================
# CLI UTILITY MAPPING
# ==========================================

def show_cli_help():
    print(f"\n  {C.NEON_BLUE}{C.BOLD}BhasaGrid User Registry Manager v10.0{C.RST}")
    print(f"  {C.GRAY}Manage encrypted accounts in {USERS_FILE}{C.RST}\n")
    print(f"  {C.WHT}Usage:{C.RST}")
    print(f"    python tools/auth.py add <username> <pin>  : Register a new user profile")
    print(f"    python tools/auth.py delete <username>     : Remove an active user profile")
    print(f"    python tools/auth.py list                  : List registered profile usernames")
    print(f"    python tools/auth.py reset                 : Clear all data and reset to default admin/2026")
    print()

def main():
    if len(sys.argv) < 2:
        show_cli_help()
        return

    action = sys.argv[1].lower()
    
    if action == "add":
        if len(sys.argv) < 4:
            print(f"  {C.RED}Error: Missing parameters. Usage: python tools/auth.py add <username> <pin>{C.RST}")
            return
        username = sys.argv[2]
        pin = sys.argv[3]
        
        users = load_users()
        users[username] = str(pin)
        save_users(users)
        print(f"  {C.NEON_GREEN}✔ Success: User '{username}' added/updated inside the encrypted repository!{C.RST}")
        
    elif action == "delete":
        if len(sys.argv) < 3:
            print(f"  {C.RED}Error: Missing parameters. Usage: python tools/auth.py delete <username>{C.RST}")
            return
        username = sys.argv[2]
        
        users = load_users()
        if username in users:
            del users[username]
            save_users(users)
            print(f"  {C.NEON_GREEN}✔ Success: User '{username}' deleted from the encrypted registry.{C.RST}")
        else:
            print(f"  {C.RED}Error: User '{username}' does not exist.{C.RST}")
            
    elif action == "list":
        users = load_users()
        print(f"\n  {C.NEON_BLUE}Active Encrypted User Registry Profile List:{C.RST}")
        for i, username in enumerate(users.keys(), 1):
            print(f"    {C.WHT}[{i}]{C.RST} {C.NEON_CYAN}{username}{C.RST}")
        print()
        
    elif action == "reset":
        confirm = input("  Are you sure you want to restore user registry configuration to defaults? (y/n) > ")
        if confirm.lower() == 'y':
            default_config = {"admin": "2026"}
            save_users(default_config)
            print(f"  {C.NEON_GREEN}✔ Success: Config reset to defaults. 'admin' with pin '2026' active.{C.RST}")
    else:
        show_cli_help()

if __name__ == "__main__":
    main()
