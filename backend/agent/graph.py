"""
LangGraph StateGraph Definition
"""

import logging
import sys
import os

# Add backend directory to path for imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from langgraph.graph import StateGraph, START, END
from agent.state import AgentState
from agent.nodes import classify_intent_node, query_node, generate_response_node

logger = logging.getLogger(__name__)


class BookingAgent:
    """LangGraph-based booking agent"""
    
    def __init__(self):
        """Initialize the booking agent with LangGraph workflow"""
        logger.info("Initializing LangGraph Booking Agent...")
        
        # Build the graph
        self.workflow = StateGraph(AgentState)
        
        # Add nodes
        self.workflow.add_node("classify_intent", classify_intent_node)
        self.workflow.add_node("query", query_node)
        self.workflow.add_node("generate_response", generate_response_node)
        
        # Define edges
        self.workflow.add_edge(START, "classify_intent")
        self.workflow.add_edge("classify_intent", "query")
        self.workflow.add_edge("query", "generate_response")
        self.workflow.add_edge("generate_response", END)
        
        # Compile the graph
        self.app = self.workflow.compile()
        
        logger.info("LangGraph Booking Agent initialized successfully")
    
    async def process(self, user_phone: str, message: str, conversation_history: list = None) -> str:
        """
        Process a user message and return response
        
        Args:
            user_phone: User's phone number
            message: User's message
            conversation_history: Previous conversation messages
        
        Returns:
            Agent response string
        """
        try:
            logger.info(f"Processing message from {user_phone}: {message}")
            
            # Initialize state
            if conversation_history is None:
                conversation_history = []
            
            # Add current message to history
            messages = conversation_history + [
                {"role": "user", "content": message}
            ]
            
            initial_state: AgentState = {
                "messages": messages,
                "user_phone": user_phone,
                "current_intent": "",
                "entities": {},
                "vendor_id": "ace_padel_club",
                "vendor_data": None,
                "query_result": None,
                "response": ""
            }
            
            # Run the graph
            final_state = await self.app.ainvoke(initial_state)
            
            # Get response
            response = final_state.get("response", "Sorry, I couldn't process that.")
            
            logger.info(f"Agent response: {response[:100]}...")
            
            return response
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return "Sorry, I encountered an error. Please try again."

