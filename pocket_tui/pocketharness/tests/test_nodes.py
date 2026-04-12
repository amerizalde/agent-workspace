"""Test node implementations."""

import sys
sys.path.insert(0, '.')
from pocketharness.nodes.context import ContextNode
from pocketharness.nodes.decision import DecisionNode
from pocketharness.nodes.execution import ExecutionNode
from pocketharness.nodes.reflection import ReflectionNode
from pocketharness.shared_store import get_shared

class TestNodes:
    """Test basic node functionality."""
    
    def test_context_node_prep(self):
        """Test context node prep phase."""
        node = ContextNode()
        shared = get_shared()
        
        prep = node.prep(shared)
        
        assert "task" in prep
        assert "context" in prep
    
    def test_decision_node_default(self):
        """Test decision node returns valid action."""
        node = DecisionNode()
        shared = get_shared()
        
        action = node.exec({})
        
        assert action in ["review_and_proceed", "exit"]
    
    def test_reflection_decision(self):
        """Test reflection node returns continue."""
        node = ReflectionNode()
        shared = get_shared()
        
        result = node.exec({
            "last_result": {},
            "shared": shared
        })
        
        assert result == "review_and_proceed"
