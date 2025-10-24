"""
Conversation Optimizer
Enhances conversation flow and user experience
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class ConversationOptimizer:
    """Optimizes conversation flow and user experience"""
    
    def __init__(self):
        """Initialize conversation optimizer"""
        logger.info("Conversation Optimizer initialized")
    
    async def optimize_response(self, intent: str, entities: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Optimize response based on conversation context
        
        Args:
            intent: Detected intent
            entities: Extracted entities
            context: Conversation context
            
        Returns:
            Optimized response data
        """
        try:
            logger.info(f"Optimizing response for intent: {intent}")
            
            # Analyze conversation context
            optimization_data = await self._analyze_context(intent, entities, context)
            
            # Generate optimized response
            optimized_response = await self._generate_optimized_response(optimization_data)
            
            return optimized_response
            
        except Exception as e:
            logger.error(f"Error optimizing response: {e}")
            return {
                'optimized': False,
                'response': 'I understand. How can I help you with your booking?',
                'suggestions': []
            }
    
    async def _analyze_context(self, intent: str, entities: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze conversation context for optimization"""
        try:
            analysis = {
                'intent': intent,
                'entities': entities,
                'context': context,
                'optimization_opportunities': []
            }
            
            # Check for incomplete information
            if intent == 'booking_request':
                missing_info = self._check_missing_booking_info(entities)
                if missing_info:
                    analysis['optimization_opportunities'].append({
                        'type': 'missing_info',
                        'missing': missing_info,
                        'suggestion': f'Please provide: {", ".join(missing_info)}'
                    })
            
            # Check for user confusion
            if self._detect_confusion(context):
                analysis['optimization_opportunities'].append({
                    'type': 'confusion',
                    'suggestion': 'Let me help clarify. What specific service are you looking for?'
                })
            
            # Check for repeated requests
            if self._detect_repetition(context):
                analysis['optimization_opportunities'].append({
                    'type': 'repetition',
                    'suggestion': 'I notice you\'ve asked about this before. Let me help you with a different approach.'
                })
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing context: {e}")
            return {'intent': intent, 'entities': entities, 'context': context}
    
    def _check_missing_booking_info(self, entities: Dict[str, Any]) -> List[str]:
        """Check for missing booking information"""
        missing = []
        
        if not entities.get('service_type'):
            missing.append('service type')
        if not entities.get('date'):
            missing.append('date')
        if not entities.get('time'):
            missing.append('time')
        
        return missing
    
    def _detect_confusion(self, context: Dict[str, Any]) -> bool:
        """Detect if user is confused"""
        history = context.get('history', [])
        
        # Check for repeated questions
        if len(history) > 3:
            recent_messages = [msg.get('content', '').lower() for msg in history[-3:]]
            if any('what' in msg or 'how' in msg for msg in recent_messages):
                return True
        
        return False
    
    def _detect_repetition(self, context: Dict[str, Any]) -> bool:
        """Detect if user is repeating requests"""
        history = context.get('history', [])
        
        if len(history) > 2:
            # Check if last 2 messages are similar
            last_message = history[-1].get('content', '').lower()
            second_last = history[-2].get('content', '').lower()
            
            # Simple similarity check
            if len(last_message) > 10 and len(second_last) > 10:
                similarity = self._calculate_similarity(last_message, second_last)
                if similarity > 0.7:  # 70% similarity
                    return True
        
        return False
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate text similarity (simple implementation)"""
        words1 = set(text1.split())
        words2 = set(text2.split())
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        if len(union) == 0:
            return 0.0
        
        return len(intersection) / len(union)
    
    async def _generate_optimized_response(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate optimized response based on analysis"""
        try:
            intent = analysis.get('intent', 'unknown')
            entities = analysis.get('entities', {})
            opportunities = analysis.get('optimization_opportunities', [])
            
            # Base response
            response = await self._get_base_response(intent, entities)
            
            # Add optimizations
            suggestions = []
            for opportunity in opportunities:
                if opportunity['type'] == 'missing_info':
                    response += f"\n\n{opportunity['suggestion']}"
                elif opportunity['type'] == 'confusion':
                    response = opportunity['suggestion']
                elif opportunity['type'] == 'repetition':
                    response = opportunity['suggestion']
                
                suggestions.append(opportunity['suggestion'])
            
            return {
                'optimized': len(opportunities) > 0,
                'response': response,
                'suggestions': suggestions,
                'intent': intent,
                'entities': entities
            }
            
        except Exception as e:
            logger.error(f"Error generating optimized response: {e}")
            return {
                'optimized': False,
                'response': 'I understand. How can I help you with your booking?',
                'suggestions': []
            }
    
    async def _get_base_response(self, intent: str, entities: Dict[str, Any]) -> str:
        """Get base response for intent"""
        if intent == 'greeting':
            return "Hello! Welcome to BookForMe. What service would you like to book?"
        elif intent == 'booking_request':
            service = entities.get('service_type', 'service')
            return f"Great! I can help you book {service}. What date would you like?"
        elif intent == 'confirmation':
            return "Perfect! Your booking is confirmed. Thank you!"
        else:
            return "I understand. How can I help you with your booking?"
    
    async def get_conversation_suggestions(self, context: Dict[str, Any]) -> List[str]:
        """
        Get conversation suggestions based on context
        
        Args:
            context: Conversation context
            
        Returns:
            List of suggestions
        """
        try:
            suggestions = []
            
            # Check conversation state
            state = context.get('state', 'greeting')
            
            if state == 'greeting':
                suggestions = [
                    "What service would you like to book?",
                    "Are you looking for futsal, salon, or gym services?",
                    "I can help you book any of our services."
                ]
            elif state == 'select_service':
                suggestions = [
                    "What date would you like to book?",
                    "Are you looking for today, tomorrow, or a specific date?",
                    "I can check availability for any date."
                ]
            elif state == 'select_date':
                suggestions = [
                    "What time would you prefer?",
                    "I can show you available time slots.",
                    "Are you looking for morning, afternoon, or evening?"
                ]
            elif state == 'select_time':
                suggestions = [
                    "Please provide your name and phone number.",
                    "I need your contact details to confirm the booking.",
                    "What's your name and phone number?"
                ]
            elif state == 'confirm_booking':
                suggestions = [
                    "Type 'yes' to confirm your booking.",
                    "Type 'no' to cancel or make changes.",
                    "Your booking details look correct."
                ]
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Error getting conversation suggestions: {e}")
            return ["How can I help you with your booking?"]
