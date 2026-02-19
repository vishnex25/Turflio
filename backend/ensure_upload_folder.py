import os

upload_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')

if not os.path.exists(upload_folder):
    print(f"Creating upload folder: {upload_folder}")
    os.makedirs(upload_folder)
else:
    print(f"Upload folder already exists: {upload_folder}")
