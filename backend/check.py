import sys, os
sys.path.append(os.getcwd())
from app.firestore import firestore_db
docs = firestore_db.db.collection('slots').where('status','==','pending').limit(5).stream()
for d in docs:
    data = d.to_dict()
    print("ID:", d.id, "Price:", data.get('price'), "Amount:", data.get('amount'))
