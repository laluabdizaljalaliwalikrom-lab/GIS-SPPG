from app.database import SessionLocal
from app import crud, schemas

db = SessionLocal()
results = crud.get_kelompoks(db)
print(f"Total results: {len(results)}")
if len(results) > 0:
    first = results[0]
    print(f"First result type: {type(first)}")
    # Convert to dict to see keys
    if hasattr(first, 'model_dump'):
        d = first.model_dump()
        print(f"Keys in model_dump: {list(d.keys())}")
        print(f"Status: {d.get('status')}")
    else:
        print("Result does not have model_dump")
db.close()
