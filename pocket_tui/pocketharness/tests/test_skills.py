"""Test skill implementations."""

import sys
sys.path.insert(0, '.')
from pocketharness.skills.action import InspectShared, ReviewAndProceed, ExitExecution
from pocketharness.shared_store import get_shared

class TestSkills:
    """Test basic skill functionality."""
    
    def test_inspect_shared(self):
        """Test inspect skill returns status."""
        skill = InspectShared()
        shared = get_shared()
        
        result = skill.exec({
            "shared": shared,
            "state": shared.get("state", {})
        })
        
        assert "status" in result
        assert result["status"] == "success"
    
    def test_review_and_proceed(self):
        """Test review action returns continue."""
        skill = ReviewAndProceed()
        shared = get_shared()
        
        result = skill.exec({
            "shared": shared,
            "state": shared.get("state", {})
        })
        
        assert result.get("next") == "review_and_proceed"
    
    def test_exit_action(self):
        """Test exit action sets running to False."""
        skill = ExitExecution()
        shared = get_shared()
        
        result = skill.exec({
            "shared": shared,
            "state": shared.get("state", {})
        })
        
        assert result.get("next") == "exit"
