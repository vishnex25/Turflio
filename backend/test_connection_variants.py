import mysql.connector

user = 'root'
host = 'localhost'
database = 'turn_app'

passwords = ['', 'root', 'password', 'admin', 'admin123']

for pwd in passwords:
    try:
        print(f"Testing with password: '{pwd}' ...")
        cnx = mysql.connector.connect(user=user, password=pwd, host=host, database=database)
        print(f"SUCCESS with password: '{pwd}'")
        cnx.close()
        break
    except mysql.connector.Error as err:
        print(f"FAILED with password '{pwd}': {err}")
