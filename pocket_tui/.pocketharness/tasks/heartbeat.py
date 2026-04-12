"""
Heartbeat Monitor Task - Pocket Flow Harness

A periodic monitoring agent that stays alive and polls for new work.
Uses nested flows: outer heartbeat loop + inner email processing flow.
"""

import time
import random
from pocketharness.shared_store import get_shared, log

# Simulated email inbox
SIMULATED_INBOX = {"emails": [], "unread_count": 0}

# Example emails to process
SAMPLE_EMAILS = [
    {
        "id": 1,
        "from": "boss@company.com",
        "subject": "Q3 Numbers Request",
        "body": "Hey team, I need the Q3 revenue and expense breakdown by Friday. Please have the finance team prepare the spreadsheets and send them over. This is important for our board presentation next week.",
        "timestamp": "2024-03-15T10:30:00Z",
        "needs_reply": True
    },
    {
        "id": 2,
        "from": "it-support@company.com",
        "subject": "Server Maintenance Alert",
        "body": "Scheduled maintenance window for Production servers tomorrow 2-4 AM EST. Please save all work and avoid heavy operations during this time.",
        "timestamp": "2024-03-15T11:00:00Z",
        "needs_reply": False
    },
    {
        "id": 3,
        "from": "hr@company.com",
        "subject": "Benefits Enrollment Open",
        "body": "Benefits enrollment is now open for Q3 changes. Please log into the portal before April 30th to update your selections. Need assistance? Contact HR at 555-0100.",
        "timestamp": "2024-03-15T11:45:00Z",
        "needs_reply": False
    }
]


def get_email_count() -> int:
    """Check inbox and return unread email count."""
    return len([e for e in SIMULATED_INBOX["emails"] if e.get("needs_reply", True)])


def get_emails() -> list:
    """Get list of unread emails that need processing."""
    unread_indexes = get_shared()["state"].get("processed_indexes", [])
    return [e for i, e in enumerate(SIMULATED_INBOX["emails"]) 
            if e.get("needs_reply", True) and i not in unread_indexes]


def simulate_new_email() -> None:
    """Simulate receiving a new email by adding to inbox."""
    if random.random() < 0.4:
        email_idx = random.randint(0, len(SAMPLE_EMAILS) - 1)
        email = SAMPLE_EMAILS[email_idx]
        email_copy = {
            "id": email["id"] + len(SIMULATED_INBOX["emails"]),
            **email
        }
        SIMULATED_INBOX["emails"].append(email_copy)
        log(f"New email received: {email_copy['subject']}", "info")


def check_email_node() -> dict:
    """CheckEmail: Check inbox for new emails."""
    count = get_email_count()
    email_count = len(SIMULATED_INBOX["emails"])
    
    log(f"Email check: {email_count} total in inbox, {count} unread", "info")
    
    if count == 0:
        log("No new emails to process.", "info")
        shared = get_shared()
        shared["state"]["email_count"] = 0
        return {"has_emails": False, "count": 0}
    
    log(f"{count} new email(s) found for processing!", "info")
    shared = get_shared()
    shared["state"]["email_count"] = count
    return {"has_emails": True, "count": count}


def process_email_node(email_idx: int = None) -> dict:
    """ProcessEmail: Summarize email and suggest action."""
    emails = get_emails()
    
    if email_idx is not None and email_idx < len(emails):
        email = emails[email_idx]
    elif emails:
        email = emails[0]
    else:
        return {"error": "No emails to process"}
    
    index = SIMULATED_INBOX["emails"].index(email)
    
    response = f"Summarized: {email['subject']}: {email['body'][:50]}..."
    action = "Reply if needs response, archive otherwise."
    
    log(f"Processed email {email['id']}: {email['subject']}", "info")
    
    # Track as processed
    shared = get_shared()
    if "processed_indexes" not in shared["state"]:
        shared["state"]["processed_indexes"] = []
    shared["state"]["processed_indexes"].append(index)
    
    return {
        "summary": response,
        "action": action,
        "email_subject": email["subject"],
        "email_id": email["id"]
    }


def heartbeat_main() -> dict:
    """Main entry point for the heartbeat monitor."""
    cycles = get_shared()["state"].get("cycles", 4)
    
    if cycles < 1:
        cycles = 1
    
    cleared_indexes = get_shared()["state"].get("cleared_indexes", set())
    
    log(f"Starting Heartbeat Email Monitor", "info")
    log(f"Polling every 2 seconds for {cycles} cycles...", "info")
    
    shared = get_shared()
    shared["state"] = {
        "cycle": 0,
        "max_cycles": cycles,
        "email_count": 0,
        "emails_processed": 0,
        "processed_indexes": [],
        "cleared_indexes": set()
    }
    
    # Add sample emails initially
    for i, sample_email in enumerate(SAMPLE_EMAILS[:2]):  # Add 2 initially
        email_copy = {
            "id": sample_email["id"] + 1000,
            **sample_email
        }
        SIMULATED_INBOX["emails"].append(email_copy)
    
    # Clear any previous state
    shared["state"]["processed_indexes"] = []
    SIMULATED_INBOX["emails"] = []
    
    # Re-add sample emails
    for i, sample_email in enumerate(SAMPLE_EMAILS[:2]):
        email_copy = {
            "id": sample_email["id"] + 1000,
            **sample_email
        }
        SIMULATED_INBOX["emails"].append(email_copy)
    
    while shared["state"]["cycle"] < cycles:
        cycle = shared["state"]["cycle"] + 1
        shared["state"]["cycle"] = cycle
        
        current_count = get_email_count()
        total_inbox = len(SIMULATED_INBOX["emails"])
        
        print(f"\n--- 💓 Heartbeat {cycle} ---")
        
        if current_count > 0:
            print(f"  📬 {current_count} new email(s)!")
            
            # Process each email
            for i in range(current_count):
                log(f"Processing email {i+1}/{current_count}...", "info")
                result = process_email_node(i)
                if result.get("email_subject"):
                    print(f"  💡 {result['email_subject']}")
                    print(f"     Reply action: {result['action']}")
                    shared["state"]["emails_processed"] += 1
                    
                    # Simulate new email occasionally
                    if shared["state"]["cycle"] % 2 == 0 and random.random() < 0.5:
                        simulate_new_email()
                        # Update processed count
                        current_count = get_email_count()
            
            # Add more emails periodically
            if shared["state"]["cycle"] % 3 == 0 and current_count < 3:
                simulate_new_email()
        
        else:
            print("  📭 No new emails.")
        
        shared["state"]["cycle"] += 1
    
    processed = shared["state"].get("emails_processed", 0)
    print(f"\n🛑 Max cycles reached. Stopping.")
    print(f"✅ Monitor stopped.")
    print(f"📊 Total emails processed: {processed}")
    
    return {
        "status": "complete",
        "cycles_completed": shared["state"]["cycle"] - 1,
        "emails_processed": processed
    }


def demo_task() -> dict:
    """Run the heartbeat monitor demo."""
    # Set cycles if needed
    cycles = get_shared().get("state", {}).get("cycles", 4)
    
    # Run the heartbeat
    result = heartbeat_main()
    
    return result
