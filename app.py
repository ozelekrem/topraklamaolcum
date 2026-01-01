"""
Flask Web API - Mobil Topraklama Ölçüm Girişi
============================================
Bu uygulama cep telefonundan topraklama ölçümü girişi yapmak için kullanılır.
Ana masaüstü uygulaması ile aynı PostgreSQL veritabanını kullanır.
"""
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import date, datetime
from config import DATABASE_URL

app = Flask(__name__)
CORS(app)

# --- VERİTABANI BAĞLANTISI ---
def get_db_connection():
    """Veritabanı bağlantısı oluşturur."""
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

# --- ANA SAYFA ---
@app.route('/')
def index():
    """Mobil ölçüm giriş sayfası."""
    return render_template('index.html')

# --- API: ABONE ARAMA ---
@app.route('/api/abone/<abone_no>')
def abone_ara(abone_no):
    """Abone numarasına göre abone bilgilerini getirir."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Abone numarası veya sayaç numarası ile arama
        cursor.execute("""
            SELECT id, abone_no, sayac_no, isim, ilce, mahalle, 
                   daire_baskanligi, kullanim_turu, tarife, acik_adres
            FROM aboneler 
            WHERE abone_no ILIKE %s OR sayac_no ILIKE %s
            LIMIT 1
        """, (f"%{abone_no}%", f"%{abone_no}%"))
        
        abone = cursor.fetchone()
        conn.close()
        
        if abone:
            return jsonify({"success": True, "abone": dict(abone)})
        else:
            return jsonify({"success": False, "message": "Abone bulunamadı"})
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# --- API: SON ÖLÇÜM BİLGİSİ ---
@app.route('/api/abone/<int:abone_id>/son-olcum')
def son_olcum(abone_id):
    """Abonenin son topraklama ölçümünü getirir."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT tarih, deger, olcum_yapan 
            FROM topraklama_takip 
            WHERE abone_id = %s 
            ORDER BY tarih DESC 
            LIMIT 1
        """, (abone_id,))
        
        olcum = cursor.fetchone()
        conn.close()
        
        if olcum:
            return jsonify({"success": True, "olcum": dict(olcum)})
        else:
            return jsonify({"success": True, "olcum": None, "message": "Henüz ölçüm yok"})
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# --- API: ÖLÇÜM KAYDET ---
@app.route('/api/olcum', methods=['POST'])
def olcum_kaydet():
    """Yeni topraklama ölçümü kaydeder."""
    try:
        data = request.get_json()
        
        abone_id = data.get('abone_id')
        tarih = data.get('tarih', date.today().isoformat())
        personel = data.get('personel', 'Mobil Kullanıcı')
        noktalar = data.get('noktalar', [])
        
        if not abone_id:
            return jsonify({"success": False, "message": "Abone ID gerekli"}), 400
        
        if not noktalar:
            return jsonify({"success": False, "message": "En az bir ölçüm noktası gerekli"}), 400
        
        # Ortalama Rx hesapla
        rx_values = []
        for n in noktalar:
            try:
                rx = float(str(n.get('rx', 0)).replace(',', '.').replace('Ohm', '').strip())
                if rx > 0:
                    rx_values.append(rx)
            except:
                pass
        
        ortalama_rx = sum(rx_values) / len(rx_values) if rx_values else 0
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO topraklama_takip (abone_id, tarih, deger, olcum_yapan, aciklama)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            abone_id,
            tarih,
            f"{ortalama_rx:.2f} Ohm",
            personel,
            json.dumps(noktalar, ensure_ascii=False)
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True, 
            "message": "Ölçüm başarıyla kaydedildi",
            "ortalama_rx": f"{ortalama_rx:.2f} Ohm"
        })
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# --- SUNUCUYU BAŞLAT ---
if __name__ == '__main__':
    print("=" * 50)
    print("📱 Mobil Topraklama Ölçüm Girişi")
    print("=" * 50)
    print(f"🌐 http://localhost:5000")
    print(f"📡 Ağdaki diğer cihazlardan: http://<bilgisayar-ip>:5000")
    print("=" * 50)
    
    # host='0.0.0.0' ile aynı ağdaki diğer cihazlardan erişim sağlanır
    app.run(host='0.0.0.0', port=5000, debug=True)
