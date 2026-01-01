"""
Konfigürasyon dosyası - Veritabanı ayarlarını yükler.
Önce ortam değişkenini kontrol eder, yoksa config.json'dan okur.
"""
import os
import json

# Önce ortam değişkeninden oku (Render/Production için)
DATABASE_URL = os.environ.get("DATABASE_URL")

# Yoksa config.json'dan oku (Lokal geliştirme için)
if not DATABASE_URL:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config_path = os.path.join(BASE_DIR, "config.json")
    
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)
            DATABASE_URL = config.get("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL bulunamadı! Ortam değişkeni veya config.json gerekli.")

