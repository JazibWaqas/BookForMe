import asyncio
from app.firestore import firestore_db

async def check_slots():
    try:
        # Check slots for different vendors
        vendors = ['ace_padel_dha', 'golden_court_dha', 'smash_padel_clifton', 'elite_futsal_clifton']
        
        for vendor_id in vendors:
            query = firestore_db.db.collection('slots')\
                .where('vendor_id', '==', vendor_id)\
                .where('date', '==', '2026-02-07')\
                .limit(5)
            
            docs = list(query.stream())
            print(f'{vendor_id}: {len(docs)} slots for 2026-02-07')
            
            if docs:
                for doc in docs[:2]:
                    data = doc.to_dict()
                    print(f'  - Slot {doc.id}: start_time={data.get("start_time")}, status={data.get("status")}')
            else:
                print(f'  - No slots found')
                
    except Exception as e:
        print(f'Error: {e}')

if __name__ == "__main__":
    asyncio.run(check_slots())
