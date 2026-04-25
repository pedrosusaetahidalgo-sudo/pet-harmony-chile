"""Helper one-shot: programa el outreach a las 9:30am del dia siguiente."""
import subprocess
import sys

TASK_NAME = "PawFriend Outreach Refugios"
PS1_PATH = r"C:\Users\psusa\Desktop\pet-harmony-chile-main\scripts\run_outreach_scheduled.ps1"
TR = f'powershell.exe -ExecutionPolicy Bypass -File "{PS1_PATH}"'

result = subprocess.run([
    "schtasks.exe",
    "/create",
    "/tn", TASK_NAME,
    "/tr", TR,
    "/sc", "once",
    "/sd", "25/04/2026",
    "/st", "09:30",
    "/f",
], capture_output=True, text=True)

print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
print("RC:", result.returncode)
sys.exit(result.returncode)
