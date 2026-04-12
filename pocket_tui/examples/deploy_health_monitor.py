"""
Example 2: Deployment Health Monitor
===========================================

This example shows using the heartbeat pattern for health checking:
Monitor deployment endpoints and alert on failures.

Use Case: DevOps Health Monitoring
- Polls health endpoints every 30 seconds
- Detects deployment failures or errors
- Alerts to Slack or sends PagerDuty notifications
- Graceful shutdown during maintenance windows
"""

import time


def check_health_endpoint(endpoint, expected_status=200):
    """
    Check a deployment health endpoint.
    
    Returns True if healthy, False if unhealthy.
    """
    # Simulate health check
    # In real world: use requests.get(endpoint).status_code
    import random
    if random.random() < 0.95:  # 95% chance of healthy
        return True
    return False


def alert_on_failure(endpoint, status):
    """Send alert for unhealthy endpoint."""
    # Simulate sending alert
    print(f"  🚨 ALERT: {endpoint} returned {status}")
    # In real world: send Slack message, PagerDuty alert, etc.


def health_flow():
    """Health monitoring flow that checks endpoints."""
    # Endpoints to monitor
    endpoints = [
        "https://api.company.com/health",
        "https://auth.company.com/status",
        "https://database.company.com/ping"
    ]
    
    print("🔍 Starting health monitoring...")
    print("Checking endpoints every 30 seconds")
    print(f"Monitoring {len(endpoints)} endpoints\n")
    
    # Simulate some failures
    for cycle in range(6):
        time.sleep(3)
        
        failures = []
        for endpoint in endpoints:
            healthy = check_health_endpoint(endpoint)
            if not healthy:
                print(f"  ❌ {endpoint} is unhealthy")
                alert_on_failure(endpoint, 503)
                failures.append(endpoint)
        
        if not failures:
            print(f"  ✅ All endpoints healthy")
        
        # Simulate random failure
        if random.random() < 0.3:
            import random
            failed_endpoint = random.choice(endpoints)
            alert_on_failure(failed_endpoint, 503)
    
    print("\n🛑 Maintenance window complete")


if __name__ == "__main__":
    health_flow()
