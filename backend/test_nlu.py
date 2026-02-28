import sys
import os
import asyncio
from nlu.agent import NLUAgent
import json

async def test():
    print('Initializing NLU agent...')
    agent = NLUAgent()
    res = await agent.extract_booking_info('I need a padel court tomorrow at 8pm')
    print(json.dumps(res, indent=2))

if __name__ == '__main__':
    asyncio.run(test())
