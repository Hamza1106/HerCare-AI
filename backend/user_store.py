"""
user_store.py — MongoDB-backed user storage for HerCare AI.

Stores users (name, email, password, signup date) plus each user's
health assessment history (a capped list of past BMI/results/health
score/risk snapshots) so the data survives across browsers/devices —
and, critically, survives Render restarts/redeploys/spin-downs, which
a local JSON file on Render's free tier does NOT (Render's filesystem
is ephemeral — any local file changes are wiped on every restart,
redeploy, or free-tier spin-down/spin-up).

Every function here has the EXACT SAME name and signature as the old
JSON-file version, so app.py (and the whole frontend, which only
talks to app.py's routes) needed zero changes for this swap.

Requires an environment variable MONGODB_URI, e.g.:
  mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
Set this in Render: Dashboard → your service → Environment → Add Environment Variable.
"""

import os
import time
from pymongo import MongoClient, ASCENDING
from pymongo.errors import DuplicateKeyError

MAX_ASSESSMENT_HISTORY = 50

MONGODB_URI = os.getenv("MONGODB_URI", "")
if not MONGODB_URI:
    raise RuntimeError(
        "MONGODB_URI environment variable is not set. "
        "Add it in Render → your service → Environment, "
        "or in back/.env for local development."
    )

# Optional: lets you point at a specific DB name via env var too;
# otherwise defaults to "hercare".
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "hercare")

_client = MongoClient(MONGODB_URI)
_db = _client[MONGODB_DB_NAME]
_users = _db["users"]

# Users are keyed by email as the Mongo _id, so lookups are simple
# _id-based finds (fast, and _id is unique by default — no separate
# index needed for the "email already exists" check).
_users.create_index([("_id", ASCENDING)])


def _now_ms():
    return int(time.time() * 1000)


def get_user(email):
    """Return the user record dict for this email, or None."""
    if not email:
        return None
    email = email.strip().lower()
    return _users.find_one({"_id": email})


def email_exists(email):
    return get_user(email) is not None


def create_user(name, email, password):
    """
    Create a new user record. Returns (success, user_dict_or_error_message).
    NOTE: passwords are stored as plain text here, matching what the
    previous localStorage-based auth did. This is fine for a hackathon /
    student-submission demo but should NOT be used in production —
    if this app is ever exposed publicly, hash passwords (e.g. with
    werkzeug.security.generate_password_hash) before storing them.
    """
    email = email.strip().lower()
    doc = {
        "_id": email,
        "name": name.strip(),
        "email": email,
        "password": password,
        "created_at": _now_ms(),
        "assessments": [],
    }
    try:
        _users.insert_one(doc)
    except DuplicateKeyError:
        return False, "An account with this email already exists."
    return True, doc


def verify_login(email, password):
    """Return (success, user_dict_or_error_message)."""
    email = email.strip().lower()
    user = _users.find_one({"_id": email})
    if not user or user.get("password") != password:
        return False, "Incorrect email or password."
    return True, user


def save_assessment(email, bmi, results, health_score, risk_label, top_risk_name):
    """
    Persist a health assessment to the user's history so it survives
    across browsers/devices/cache-clears. Appends to a capped list
    (MAX_ASSESSMENT_HISTORY entries) instead of overwriting, so past
    assessments are kept for trend-tracking rather than only the most
    recent one.

    Uses an atomic $push + $slice, so concurrent requests can't race
    and silently drop each other's writes the way a read-modify-write
    file update could.
    """
    email = email.strip().lower()
    if not get_user(email):
        return False, "User not found."

    entry = {
        "bmi": bmi,
        "results": results,
        "health_score": health_score,
        "risk_label": risk_label,
        "top_risk_name": top_risk_name,
        "timestamp": _now_ms(),
    }

    _users.update_one(
        {"_id": email},
        {
            "$push": {
                "assessments": {
                    "$each": [entry],
                    "$slice": -MAX_ASSESSMENT_HISTORY,
                }
            }
        },
    )
    return True, entry


def save_recovery(email, plan):
    """
    Persist the user's latest discharge-summary-derived recovery plan
    (procedure, medications with reminder_times, restrictions, warning
    signs) so revisiting the Recovery Assistant shows the same plan
    instead of asking to re-upload. Overwrites any previous plan —
    a fresh checklist starts at 0% completed.
    """
    email = email.strip().lower()
    if not get_user(email):
        return False, "User not found."

    recovery = {
        "plan": plan,
        "completed_tasks": {},
        "saved_at": _now_ms(),
    }
    _users.update_one({"_id": email}, {"$set": {"recovery": recovery}})
    return True, recovery


def get_recovery(email):
    """Return {plan, completed_tasks, saved_at} for this user, or None."""
    user = get_user(email)
    if not user:
        return None
    return user.get("recovery")


def update_recovery_tasks(email, completed_tasks):
    """Persist checklist progress (which medication doses have been marked
    taken) against the user's current recovery plan."""
    email = email.strip().lower()
    user = get_user(email)
    if not user or "recovery" not in user:
        return False, "No recovery plan found for this user."

    _users.update_one(
        {"_id": email},
        {"$set": {"recovery.completed_tasks": completed_tasks}},
    )
    return True, get_user(email)["recovery"]


def clear_recovery(email):
    """Remove the saved recovery plan (used when the patient uploads a new
    discharge summary and wants to start fresh)."""
    email = email.strip().lower()
    _users.update_one({"_id": email}, {"$unset": {"recovery": ""}})
    return True


def get_assessment_history(email):
    """Return this user's list of past assessments (oldest -> newest), or []."""
    user = get_user(email)
    if not user:
        return []
    return user.get("assessments", [])


def get_latest_assessment(email):
    """Return this user's most recent assessment dict, or None."""
    history = get_assessment_history(email)
    return history[-1] if history else None


def public_user(user):
    """Strip the password out before sending a user record to the frontend."""
    if not user:
        return None
    assessments = user.get("assessments") or []
    return {
        "name": user.get("name"),
        "email": user.get("email"),
        "created_at": user.get("created_at"),
        "assessments": assessments,
        # Kept for backward compatibility with any code still reading
        # last_assessment directly — always the most recent entry.
        "last_assessment": assessments[-1] if assessments else None,
        "recovery": user.get("recovery"),
    }
