"""
Example 1: Email Monitor for a Startup Team
===========================================

This example shows a typical use case for the heartbeat pattern:
A startup team's email monitor that processes incoming messages
and suggests reply actions.

Use Case: Startup Email Triage
- Polls for new emails every few seconds to minutes
- Uses LLM to summarize and suggest reply actions
- Tracks processed vs unprocessed emails
- Graceful shutdown after maintenance window
"""

# Configuration
EMAIL_POLL_INTERVAL = 5  # seconds
MAX_CYCLES = 12  # 2-minute maintenance window
PRIORITY_EMAIL_SOURCES = {"boss@company.com", "investor@vc.com"}


def summarize_email(email):
    """Simulate LLM-based email summarization."""
    subject = email.get("subject", "Untitled")
    from_addr = email.get("from", "unknown")
    
    # Determine priority
    is_priority = from_addr in PRIORITY_EMAIL_SOURCES
    priority = "HIGH" if is_priority else "NORMAL"
    
    # Generate appropriate action
    body_preview = email.get("body", "")[:100]
    needs_reply = "Yes" if "please" in body_preview.lower() else "No"
    
    response = f"""
    ┌─ Email Summary ────────────────────────┐
    │ Subject: {subject}                          │
    │ From: {priority} ({from_addr})                │
    │ Body Preview: {body_preview}...             │
    │ Action: {priority.lower()} priority          │
    │ Reply needed: {needs_reply.lower()}          │
    └────────────────────────────────────────────┘
    """
    
    return {
        "summary": response.strip(),
        "priority": priority,
        "needs_reply": needs_reply.lower() == "yes",
        "subject": subject,
        "from": from_addr
    }


def check_for_emails() -> list:
    """Check inbox and return new emails that need processing."""
    # Simulated inbox - in real world, this would query API
    import random
    inbox = [
        {
            "id": 1,
            "from": "boss@company.com",
            "subject": "Board meeting prep",
            "body": "Need the Q3 numbers by EOD. Finance team should have the spreadsheets ready."
        },
        {
            "id": 2,
            "from": "it@company.com",
            "subject": "Server maintenance",
            "body": "Scheduled maintenance at 2:00 AM EST. Save all work."
        }
    ]
    return inbox


def process_emails(emails):
    """Process batch of emails."""
    print(f"\nProcessing {len(emails)} email(s)")
    for email in emails:
        summary = summarize_email(email)
        print(summary)
        # Here you'd typically mark as read or archive


if __name__ == "__main__":
    emails = check_for_emails()
    process_emails(emails)
