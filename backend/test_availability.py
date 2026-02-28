import sys
import os
import asyncio
from agent.tools import check_availability

async def test():
    dates = ['2026-02-28', '2026-03-01']
    sports = ['padel', 'futsal']
    
    for date in dates:
        for sport in sports:
            print(f'\n--- Checking {sport} on {date} ---')
            res = await check_availability(sport, None, date)
            print(f'Success: {res.get("success")}, Error: {res.get("error")}')
            vendors = res.get('vendors', [])
            print(f'Found {len(vendors)} vendors.')
            for v in vendors:
                slots = v.get('slots', [])
                print(f'   Vendor {v.get("vendor_name")} has {len(slots)} slots.')

if __name__ == '__main__':
    asyncio.run(test())
