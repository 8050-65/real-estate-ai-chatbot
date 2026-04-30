import psycopg2
from psycopg2 import sql

conn = psycopg2.connect(
    host="localhost",
    user="postgres",
    password="vikram",
    database="postgres",
    port="5432"
)

conn.autocommit = True
cursor = conn.cursor()

try:
    cursor.execute(sql.SQL("CREATE DATABASE {}").format(
        sql.Identifier("realestate_db")
    ))
    print("✅ Database realestate_db created")
except psycopg2.errors.DuplicateDatabase:
    print("⚠️  Database realestate_db already exists")

try:
    cursor.execute(
        "CREATE USER realestate WITH PASSWORD %s",
        ("password",)
    )
    print("✅ User realestate created")
except psycopg2.errors.DuplicateObject:
    print("⚠️  User realestate already exists")

cursor.execute(
    "GRANT ALL PRIVILEGES ON DATABASE realestate_db TO realestate"
)
print("✅ Privileges granted")

cursor.close()
conn.close()
print("✅ Database setup complete!")
