"""
Seed script: creates default Admin and Standard users.
Run with: python seed.py
"""
from database import SessionLocal, Base, engine
from models import User, UserRole, UserStatus
from auth import get_password_hash

# Ensure tables exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()

DEFAULT_PASSWORD = "secure@123"

users_to_seed = [
    {
        "username": "admin1",
        "email": "admin@securedata.com",
        "role": UserRole.Admin,
    },
    {
        "username": "john_doe",
        "email": "john@securedata.com",
        "role": UserRole.Standard,
    },
]

for user_data in users_to_seed:
    existing = db.query(User).filter(User.username == user_data["username"]).first()
    if existing:
        print(f"  [SKIP] User '{user_data['username']}' already exists (id={existing.id})")
    else:
        user = User(
            username=user_data["username"],
            email=user_data["email"],
            password_hash=get_password_hash(DEFAULT_PASSWORD),
            role=user_data["role"],
            status=UserStatus.Active,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"  [CREATED] User '{user.username}' (id={user.id}, role={user.role.value})")

db.close()
print("\nSeed complete.")
