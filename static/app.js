/**
 * MOBİL TOPRAKLAMA ÖLÇÜM UYGULAMASI - JavaScript
 * ================================================
 * Abone arama, ölçüm satırları yönetimi ve kaydetme
 */

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function () {
    // Bugünün tarihini ayarla
    document.getElementById('tarihInput').value = new Date().toISOString().split('T')[0];

    // İlk ölçüm satırını ekle
    satirEkle();

    // Enter tuşu ile arama
    document.getElementById('aboneNoInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') aboneAra();
    });
});

// Ölçüm noktası sayacı
let noktaSayaci = 0;

/**
 * Abone Arama
 */
async function aboneAra() {
    const aboneNo = document.getElementById('aboneNoInput').value.trim();
    const hataEl = document.getElementById('aramaHata');

    if (!aboneNo) {
        hataEl.textContent = 'Lütfen abone veya sayaç numarası girin';
        return;
    }

    hataEl.textContent = '';

    try {
        const response = await fetch(`/api/abone/${encodeURIComponent(aboneNo)}`);
        const data = await response.json();

        if (data.success && data.abone) {
            aboneBilgileriniGoster(data.abone);
            sonOlcumGetir(data.abone.id);
        } else {
            hataEl.textContent = data.message || 'Abone bulunamadı';
            document.getElementById('aboneBilgiSection').classList.add('hidden');
            document.getElementById('olcumSection').classList.add('hidden');
        }
    } catch (error) {
        hataEl.textContent = 'Bağlantı hatası: ' + error.message;
    }
}

/**
 * Abone Bilgilerini Göster
 */
function aboneBilgileriniGoster(abone) {
    document.getElementById('aboneIdInput').value = abone.id;
    document.getElementById('aboneIsim').textContent = abone.isim || '-';
    document.getElementById('aboneNo').textContent = abone.abone_no || '-';
    document.getElementById('sayacNo').textContent = abone.sayac_no || '-';
    document.getElementById('aboneKonum').textContent = `${abone.ilce || ''} / ${abone.mahalle || ''}`;
    document.getElementById('aboneTur').textContent = abone.kullanim_turu || '-';

    document.getElementById('aboneBilgiSection').classList.remove('hidden');
    document.getElementById('olcumSection').classList.remove('hidden');
}

/**
 * Son Ölçümü Getir
 */
async function sonOlcumGetir(aboneId) {
    try {
        const response = await fetch(`/api/abone/${aboneId}/son-olcum`);
        const data = await response.json();

        if (data.success && data.olcum) {
            const tarih = data.olcum.tarih || 'Bilinmiyor';
            const deger = data.olcum.deger || '-';
            document.getElementById('sonOlcum').textContent = `${tarih} - ${deger}`;
        } else {
            document.getElementById('sonOlcum').textContent = 'Henüz ölçüm yok';
        }
    } catch (error) {
        document.getElementById('sonOlcum').textContent = 'Yüklenemedi';
    }
}

/**
 * Yeni Ölçüm Satırı Ekle
 */
function satirEkle() {
    noktaSayaci++;
    const container = document.getElementById('noktalarContainer');

    const satir = document.createElement('div');
    satir.className = 'nokta-satir';
    satir.id = `nokta_${noktaSayaci}`;

    satir.innerHTML = `
        <div class="satir-header">
            <span class="satir-title">Nokta ${noktaSayaci}</span>
            <button type="button" class="btn-remove" onclick="satirSil(${noktaSayaci})">×</button>
        </div>
        <div class="satir-inputs">
            <input type="text" placeholder="Nokta Adı" class="inp-nokta" value="Nokta ${noktaSayaci}">
            <select class="inp-kesit">
                <option value="">Kesit</option>
                <option value="1.5">1.5 mm²</option>
                <option value="2.5">2.5 mm²</option>
                <option value="4">4 mm²</option>
                <option value="6">6 mm²</option>
                <option value="10">10 mm²</option>
                <option value="16">16 mm²</option>
                <option value="25">25 mm²</option>
                <option value="35">35 mm²</option>
            </select>
            <input type="text" placeholder="In (A)" class="inp-in" inputmode="decimal">
            <select class="inp-egri">
                <option value="">Eğri</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="K">K</option>
                <option value="Z">Z</option>
            </select>
            <input type="text" placeholder="Rx (Ω)" class="inp-rx" inputmode="decimal">
            <input type="text" placeholder="Ra Sınır" class="inp-ra" inputmode="decimal">
            <select class="inp-sonuc sonuc-select">
                <option value="Uygun">✅ Uygun</option>
                <option value="Uygun Değil">❌ Uygun Değil</option>
            </select>
        </div>
    `;

    container.appendChild(satir);
}

/**
 * Ölçüm Satırı Sil
 */
function satirSil(id) {
    const satir = document.getElementById(`nokta_${id}`);
    if (satir) {
        satir.remove();
    }
}

/**
 * Ölçümü Kaydet
 */
async function olcumKaydet() {
    const aboneId = document.getElementById('aboneIdInput').value;
    const personel = document.getElementById('personelInput').value.trim();
    const tarih = document.getElementById('tarihInput').value;

    if (!aboneId) {
        alert('Lütfen önce abone arayın');
        return;
    }

    if (!personel) {
        alert('Lütfen personel adını girin');
        return;
    }

    // Tüm ölçüm noktalarını topla
    const noktalar = [];
    const satirlar = document.querySelectorAll('.nokta-satir');

    satirlar.forEach(satir => {
        const rx = satir.querySelector('.inp-rx').value.trim();
        if (rx) {
            noktalar.push({
                nokta: satir.querySelector('.inp-nokta').value,
                kesit: satir.querySelector('.inp-kesit').value,
                in_a: satir.querySelector('.inp-in').value,
                egri: satir.querySelector('.inp-egri').value,
                rx: rx,
                ra_sinir: satir.querySelector('.inp-ra').value,
                sonuc: satir.querySelector('.inp-sonuc').value
            });
        }
    });

    if (noktalar.length === 0) {
        alert('En az bir ölçüm noktası girin (Rx değeri zorunlu)');
        return;
    }

    try {
        const response = await fetch('/api/olcum', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                abone_id: parseInt(aboneId),
                tarih: tarih,
                personel: personel,
                noktalar: noktalar
            })
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('successMessage').textContent =
                `Ölçüm kaydedildi. Ortalama: ${data.ortalama_rx}`;
            document.getElementById('successModal').classList.remove('hidden');
        } else {
            alert('Hata: ' + data.message);
        }
    } catch (error) {
        alert('Bağlantı hatası: ' + error.message);
    }
}

/**
 * Formu Temizle
 */
function temizle() {
    if (confirm('Tüm verileri temizlemek istediğinize emin misiniz?')) {
        document.getElementById('noktalarContainer').innerHTML = '';
        noktaSayaci = 0;
        satirEkle();
        document.getElementById('personelInput').value = '';
    }
}

/**
 * Yeni Ölçüm (Modal kapatma)
 */
function yeniOlcum() {
    document.getElementById('successModal').classList.add('hidden');
    document.getElementById('noktalarContainer').innerHTML = '';
    noktaSayaci = 0;
    satirEkle();
    document.getElementById('personelInput').value = '';
    document.getElementById('aboneNoInput').value = '';
    document.getElementById('aboneBilgiSection').classList.add('hidden');
    document.getElementById('olcumSection').classList.add('hidden');
    document.getElementById('aboneNoInput').focus();
}
