import sys
import os
import asyncio
sys.path.append(os.path.abspath('.'))
from agent.tools import check_availability

async def test():
    print('Testing with 8pm...')
    res = await check_availability('padel', None, '2026-03-01', {'start': '20:00', 'end': '21:00'})
    vendors = res.get('vendors', [])
    print(f"Found {len(vendors)} vendors. Time exact unavailable: {res.get('time_exact_unavailable')}")
    for v in vendors:
        print(f"   {v.get('vendor_name')} has {len(v.get('slots', []))} slots.")

if __name__ == '__main__':
    asyncio.run(test())
