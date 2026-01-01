"""
Konfigürasyon dosyası - Ana projeden veritabanı ayarlarını yükler.
"""
import os
import json

# Ana proje klasörü
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_database_url():
    """Ana projedeki config.json'dan veritabanı URL'sini yükler."""
    config_path = os.path.join(BASE_DIR, "config.json")
    
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)
            return config.get("DATABASE_URL")
    
    # Fallback: Ortam değişkeni
    return os.environ.get("DATABASE_URL")

DATABASE_URL = load_database_url()
