"""
Example 3: Slack Channel Monitor
====================================

This example shows using the heartbeat pattern for Slack monitoring:
Watch channels and auto-respond to common questions.

Use Case: Customer Support Assistant
- Polls Slack Web API every few seconds
- Detects customer questions about pricing/FAQ
- Auto-replies with canned responses
- Escalates to human agent for complex issues
"""


def categorize_message(message):
    """Categorize incoming Slack message."""
    text = message.get("text", "").lower()
    
    # Common customer questions
    if any(term in text for term in ["price", "cost", "$", "subscription", "plan"]):
        return "pricing"
    if any(term in text for term in ["login", "password", "account"]):
        return "account"
    if any(term in text for term in ["support", "issue", "broken", "error"]):
        return "technical_issue"
    if any(term in text for term in ["cancel", "refund", "billing"]):
        return "billing"
    return "general"


def get_canned_response(category):
    """Get canned response for category."""
    responses = {
        "pricing": "Thanks for your interest! Our plans start at $29/month for Basic, $99 for Pro. Visit pricing.example.com for details.",
        "account": "Please email support@company.com for account access issues. Check your recovery email and try resetting password.",
        "technical_issue": "I'll forward this to our engineering team. Please check our status page at status.example.com for known issues.",
        "billing": "For billing questions, please contact our billing team at billing@company.com. Reference #12345 in your email.",
        "general": "Thanks for your message! A human agent will review this soon. Please hold tight."
    }
    return responses.get(category, "Thanks for your message!")


def slack_flow():
    """Slack monitoring and auto-reply flow."""
    import time
    import random
    
    print("💬 Starting Slack channel monitor...")
    print("Checking for messages every 5 seconds\n")
    
    # Simulated incoming messages
    messages = [
        {"text": "What's your pricing for a team of 10?", "needs_auto_reply": True},
        {"text": "Hi, I can't login to my account", "needs_auto_reply": True},
        {"text": "How do I upgrade to premium?", "needs_auto_reply": True},
        {"text": "Error code 503 when uploading files", "needs_auto_reply": False},  # Escalate
        {"text": "Thanks for the help!", "needs_auto_reply": False},
    ]
    
    for idx, msg in enumerate(messages, 1):
        time.sleep(3)
        
        categories = categorize_message(msg)
        action = "🤖 Auto-reply" if msg.get("needs_auto_reply") else "⬆️ Escalate"
        
        print(f"--- Message {idx} ---")
        print(f"  {msg['text'][:60]}...")
        print(f"  Category: {categories.upper()}")
        print(f"  {action}")
        
        if msg.get("needs_auto_reply"):
            response = get_canned_response(categories)
            print(f"  Response: {response[:80]}...")
    
    # Simulate random message arrival
    if random.random() < 0.5:
        print(f"\n--- Random Customer Message ---")
        print("  'The new feature isn't working on my Mac. Any ideas?'")
        print("  Category: technical_issue")
        print("  ⬆️ Escalate to engineering")
    
    print("\n✅ Monitor stopped")


if __name__ == "__main__":
    slack_flow()
