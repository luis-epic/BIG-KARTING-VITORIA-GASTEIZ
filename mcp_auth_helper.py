import subprocess
import sys
import os
import json
from datetime import datetime, timedelta

AUTH_FILE_PATH = os.path.expanduser("~/.notebooklm-mcp/auth.json")

def check_token_status():
    """Checks the status and modification date of the cached credentials."""
    if not os.path.exists(AUTH_FILE_PATH):
        return "MISSING", "No se encontró el archivo de credenciales en ~/.notebooklm-mcp/auth.json"
    
    try:
        # Check modification time
        mtime = os.path.getmtime(AUTH_FILE_PATH)
        last_modified = datetime.fromtimestamp(mtime)
        age = datetime.now() - last_modified
        
        # Read file contents
        with open(AUTH_FILE_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        cookies_count = len(data.get("cookies", []))
        has_csrf = "csrfToken" in data or "csrf_token" in data
        
        # Typically cookies can expire or be considered stale after 24-48 hours depending on activity
        if age > timedelta(hours=24):
            return "STALE", f"Las credenciales tienen {age.seconds // 3600} horas de antigüedad. Podrían estar expiradas."
        
        return "VALID", f"Credenciales listas ({cookies_count} cookies, CSRF: {'Sí' if has_csrf else 'No'}). Última renovación: {last_modified.strftime('%Y-%m-%d %H:%M:%S')}"
    except Exception as e:
        return "ERROR", f"Error leyendo las credenciales: {str(e)}"

def run_auth():
    """Runs the global notebooklm-mcp-auth tool to refresh credentials."""
    print("[RUN] Iniciando autenticacion automatica de NotebookLM MCP...")
    try:
        # Launch notebooklm-mcp-auth using shell=True for Windows compatibility
        process = subprocess.Popen(
            ["notebooklm-mcp-auth"],
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        
        # Read stdout line by line in real time
        for line in process.stdout:
            print(f"  [Auth] {line.strip()}")
            
        process.wait()
        
        if process.returncode == 0:
            print("[OK] ¡Proceso de autenticacion completado con exito!")
            return True
        else:
            print(f"[ERROR] El proceso termino con codigo de salida: {process.returncode}")
            return False
            
    except FileNotFoundError:
        print("[ERROR] No se encontro el ejecutable 'notebooklm-mcp-auth' en el sistema.")
        print("Asegurate de que esta instalado globalmente en tu terminal.")
        return False
    except Exception as e:
        print(f"[ERROR] Error inesperado ejecutando la autenticacion: {e}")
        return False

def main():
    print("=" * 60)
    print("         NOTEBOOKLM MCP AUTH AUTOMATOR & HELPER")
    print("=" * 60)
    
    status, msg = check_token_status()
    print(f"\nEstado actual: [{status}] - {msg}\n")
    
    # If the user supplied the '--force' flag or if tokens are missing/stale, run the auth
    force_auth = "--force" in sys.argv
    
    if force_auth or status in ["MISSING", "STALE"]:
        if status in ["MISSING", "STALE"]:
            print(f"[WARN] Detectado estado [{status}]. Renovando credenciales automaticamente...")
        else:
            print("[RUN] Forzando renovacion de credenciales...")
            
        success = run_auth()
        if success:
            # Recheck status
            status, msg = check_token_status()
            print(f"\n[OK] Nuevo estado: [{status}] - {msg}")
    else:
        print("[INFO] Las credenciales estan vigentes. No es necesario renovarlas.")
        print("   (Usa 'python mcp_auth_helper.py --force' para forzar la renovacion)")
        
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
