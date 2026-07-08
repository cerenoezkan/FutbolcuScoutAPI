import { useEffect, useRef, useState } from 'react';
import './App.css';

const BASE_URL = 'https://localhost:44313';
const BOS_FORM = { Isim: '', Mevki: '', Yas: '', Takim: '', Puan: '' };
const BOS_FILTRE = { mevki: '', minYas: '', maxYas: '', minPuan: '' };
const MEVKI_ONAYILAR = ['Kaleci', 'Defans', 'Orta Saha', 'Forvet'];

// Mevki metnini saha pozisyon rengine eşler (Kaleci/Defans/Orta Saha/Forvet)
function mevkiSinifi(mevki) {
    const m = (mevki || '').toLocaleLowerCase('tr-TR');
    if (m.includes('kale')) return 'pos-gk';
    if (m.includes('def') || m.includes('bek') || m.includes('stoper')) return 'pos-def';
    if (m.includes('orta') || m.includes('mid')) return 'pos-mid';
    if (m.includes('for') || m.includes('kanat') || m.includes('att')) return 'pos-fwd';
    return 'pos-default';
}

function App() {
    const [token, setToken] = useState(() => localStorage.getItem('userToken') || '');
    const [kullaniciAdi, setKullaniciAdi] = useState(() => localStorage.getItem('userName') || '');
    const [rol, setRol] = useState(() => localStorage.getItem('userRole') || '');

    if (!token) {
        return <AuthEkrani onGiris={(t, kullanici, kullaniciRol) => {
            localStorage.setItem('userToken', t);
            localStorage.setItem('userName', kullanici);
            localStorage.setItem('userRole', kullaniciRol);
            setToken(t);
            setKullaniciAdi(kullanici);
            setRol(kullaniciRol);
        }} />;
    }

    return (
        <ScoutPaneli
            token={token}
            kullaniciAdi={kullaniciAdi}
            rol={rol}
            onCikis={() => {
                localStorage.removeItem('userToken');
                localStorage.removeItem('userName');
                localStorage.removeItem('userRole');
                setToken('');
                setKullaniciAdi('');
                setRol('');
            }}
        />
    );
}

// --- GİRİŞ / KAYIT EKRANI ---
function AuthEkrani({ onGiris }) {
    const [mod, setMod] = useState('giris');

    return mod === 'giris'
        ? <GirisEkrani onGiris={onGiris} onKayitaGec={() => setMod('kayit')} />
        : <KayitEkrani onGiriseDon={() => setMod('giris')} />;
}

// --- GİRİŞ FORMU ---
function GirisEkrani({ onGiris, onKayitaGec }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [hata, setHata] = useState('');
    const [yukleniyor, setYukleniyor] = useState(false);

    const girisYap = async (e) => {
        e.preventDefault();
        setHata('');
        setYukleniyor(true);
        try {
            const res = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Username: username, Password: password }),
            });
            if (res.status === 401) {
                setHata('Kullanıcı adı veya şifre hatalı.');
                return;
            }
            if (!res.ok) {
                setHata(`Sunucu hatası: ${res.status}`);
                return;
            }
            const data = await res.json();
            onGiris(data.token, username, data.role);
        } catch {
            setHata('Sunucuya ulaşılamadı. API çalışıyor mu?');
        } finally {
            setYukleniyor(false);
        }
    };

    return (
        <div className="auth-screen">
            <form className="auth-card" onSubmit={girisYap}>
                <span className="eyebrow">Scout Sistemi</span>
                <h1>Giriş Yap</h1>
                <p className="auth-sub">Oyuncu kadrosuna erişmek için hesabınla giriş yap.</p>

                <label className="field">
                    <span>Kullanıcı Adı</span>
                    <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
                </label>
                <label className="field">
                    <span>Şifre</span>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </label>

                {hata && <div className="auth-error">{hata}</div>}

                <button className="send-btn" type="submit" disabled={yukleniyor}>
                    {yukleniyor ? 'Giriş yapılıyor…' : 'Giriş Yap'}
                </button>

                <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--ink-soft)' }}>
                    Hesabın yok mu?{' '}
                    <button type="button" onClick={onKayitaGec}
                        style={{ background: 'none', border: 'none', color: 'var(--pitch-line)', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                        Kayıt Ol
                    </button>
                </p>
            </form>
        </div>
    );
}

// --- KAYIT FORMU ---
function KayitEkrani({ onGiriseDon }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [tekrar, setTekrar] = useState('');
    const [hata, setHata] = useState('');
    const [basari, setBasari] = useState('');
    const [yukleniyor, setYukleniyor] = useState(false);

    const kayitOl = async (e) => {
        e.preventDefault();
        setHata('');
        setBasari('');

        if (password !== tekrar) {
            setHata('Şifreler eşleşmiyor!');
            return;
        }
        if (password.length < 6) {
            setHata('Şifre en az 6 karakter olmalı.');
            return;
        }

        setYukleniyor(true);
        try {
            const res = await fetch(`${BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Username: username, Password: password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setHata(data.message || `Hata: ${res.status}`);
                return;
            }

            setBasari('Hesap oluşturuldu! Giriş ekranına yönlendiriliyorsun…');
            setTimeout(() => onGiriseDon(), 2000);
        } catch {
            setHata('Sunucuya ulaşılamadı.');
        } finally {
            setYukleniyor(false);
        }
    };

    return (
        <div className="auth-screen">
            <form className="auth-card" onSubmit={kayitOl}>
                <span className="eyebrow">Scout Sistemi</span>
                <h1>Kayıt Ol</h1>
                <p className="auth-sub">Yeni bir hesap oluştur.</p>

                <label className="field">
                    <span>Kullanıcı Adı</span>
                    <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
                </label>
                <label className="field">
                    <span>Şifre</span>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </label>
                <label className="field">
                    <span>Şifre Tekrar</span>
                    <input type="password" value={tekrar} onChange={(e) => setTekrar(e.target.value)} required />
                </label>

                {hata && <div className="auth-error">{hata}</div>}

                {basari && (
                    <div style={{
                        background: 'var(--pos-mid-soft)',
                        border: '1px solid rgba(33,120,90,0.25)',
                        color: 'var(--pos-mid)',
                        fontSize: 13,
                        borderRadius: 10,
                        padding: '11px 14px',
                        marginBottom: 16
                    }}>
                        {basari}
                    </div>
                )}

                <button className="send-btn" type="submit" disabled={yukleniyor}>
                    {yukleniyor ? 'Hesap oluşturuluyor…' : 'Kayıt Ol'}
                </button>

                <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--ink-soft)' }}>
                    Zaten hesabın var mı?{' '}
                    <button type="button" onClick={onGiriseDon}
                        style={{ background: 'none', border: 'none', color: 'var(--pitch-line)', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                        Giriş Yap
                    </button>
                </p>
            </form>
        </div>
    );
}

// --- SCOUT PANELİ ---
function ScoutPaneli({ token, kullaniciAdi, rol, onCikis }) {
    const [futbolcular, setFutbolcular] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [hata, setHata] = useState('');
    const [form, setForm] = useState(BOS_FORM);
    const [duzenlenenId, setDuzenlenenId] = useState(null);
    const [kaydediliyor, setKaydediliyor] = useState(false);

    // --- FİLTRELEME İÇİN YENİ STATE'LER ---
    const [filtre, setFiltre] = useState(BOS_FILTRE);       // formdaki anlık input değerleri
    const [filtreAktif, setFiltreAktif] = useState(false);  // en son uygulanan sorgu filtreli mi?

    // --- SCOUT ARAMA (TheSportsDB) İÇİN YENİ STATE'LER ---
    const [scoutAramaAdi, setScoutAramaAdi] = useState('');
    const [scoutSonuclari, setScoutSonuclari] = useState([]);
    const [scoutAraniyor, setScoutAraniyor] = useState(false);
    const [scoutHata, setScoutHata] = useState('');

    // --- TAKIM ARAMA (TheSportsDB) İÇİN YENİ STATE'LER ---
    const [takimAramaAdi, setTakimAramaAdi] = useState('');
    const [takimSonuclari, setTakimSonuclari] = useState([]);
    const [takimAraniyor, setTakimAraniyor] = useState(false);
    const [takimHata, setTakimHata] = useState('');

    // --- LİG PUAN DURUMU (TheSportsDB) İÇİN YENİ STATE'LER ---
    const [ligIdGirdi, setLigIdGirdi] = useState('');
    const [puanDurumu, setPuanDurumu] = useState([]);
    const [puanDurumuAraniyor, setPuanDurumuAraniyor] = useState(false);
    const [puanDurumuHata, setPuanDurumuHata] = useState('');

    // --- FAVORİLER İÇİN YENİ STATE'LER ---
    const [favoriler, setFavoriler] = useState([]);
    const [favorilerYukleniyor, setFavorilerYukleniyor] = useState(true);
    const [favoriHata, setFavoriHata] = useState('');
    const [favoriIslemdekiId, setFavoriIslemdekiId] = useState(null); // hangi KaynakId/favoriId üzerinde işlem yapılıyor

    // --- FAVORİLER EXCEL EXPORT / IMPORT İÇİN YENİ STATE'LER ---
    const [disaAktariliyor, setDisaAktariliyor] = useState(false);   // export butonu "beklet" durumu
    const [iceAktariliyor, setIceAktariliyor] = useState(false);     // import işlemi sürerken "beklet" durumu
    const [iceAktarimMesaji, setIceAktarimMesaji] = useState('');    // "12 favori eklendi" gibi bilgi mesajı
    const dosyaInputRef = useRef(null);                              // gizli <input type="file"> öğesine erişim için

    const yetkiliBasliklar = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };

    // filtreParam verilmezse (ya da tüm alanları boşsa) eski davranış: tüm listeyi getirir.
    // filtreParam doluysa /api/futbolcu/filtrele endpoint'ine query string kurup gider.
    const listeyiGetir = async (filtreParam = null) => {
        setYukleniyor(true);
        setHata('');
        try {
            let url = `${BASE_URL}/api/futbolcu`;

            if (filtreParam) {
                const q = new URLSearchParams();
                if (filtreParam.mevki) q.append('mevki', filtreParam.mevki);
                if (filtreParam.minYas !== '') q.append('minYas', filtreParam.minYas);
                if (filtreParam.maxYas !== '') q.append('maxYas', filtreParam.maxYas);
                if (filtreParam.minPuan !== '') q.append('minPuan', filtreParam.minPuan);

                const queryString = q.toString();
                if (queryString) {
                    url = `${BASE_URL}/api/futbolcu/filtrele?${queryString}`;
                }
            }

            const res = await fetch(url, { headers: yetkiliBasliklar });
            if (res.status === 401) { onCikis(); return; }
            const data = await res.json();
            setFutbolcular(data);
        } catch {
            setHata('Liste alınamadı, sunucu çalışmıyor olabilir.');
        } finally {
            setYukleniyor(false);
        }
    };

    useEffect(() => { listeyiGetir(); }, []);

    // Filtre formu gönderildiğinde çalışır
    const filtreUygula = (e) => {
        e.preventDefault();
        const hepsiBos = !filtre.mevki && filtre.minYas === '' && filtre.maxYas === '' && filtre.minPuan === '';
        setFiltreAktif(!hepsiBos);
        listeyiGetir(filtre);
    };

    // "Temizle" butonuna basınca filtreyi sıfırlar ve tam listeye döner
    const filtreTemizle = () => {
        setFiltre(BOS_FILTRE);
        setFiltreAktif(false);
        listeyiGetir();
    };

    // Hızlı mevki seçim çipleri — tıklanınca doğrudan o mevkiyle filtreler
    const mevkiOnayiSec = (mevki) => {
        const secilenMevki = filtre.mevki === mevki ? '' : mevki; // aynısına tekrar basınca kaldır
        const yeniFiltre = { ...filtre, mevki: secilenMevki };
        setFiltre(yeniFiltre);
        const hepsiBos = !yeniFiltre.mevki && yeniFiltre.minYas === '' && yeniFiltre.maxYas === '' && yeniFiltre.minPuan === '';
        setFiltreAktif(!hepsiBos);
        listeyiGetir(yeniFiltre);
    };

    const formuTemizle = () => { setForm(BOS_FORM); setDuzenlenenId(null); };

    const formuGonder = async (e) => {
        e.preventDefault();
        setKaydediliyor(true);
        setHata('');
        const govde = {
            Isim: form.Isim,
            Mevki: form.Mevki,
            Yas: Number(form.Yas) || 0,
            Takim: form.Takim,
            Puan: Number(form.Puan) || 0,
        };
        try {
            const url = duzenlenenId
                ? `${BASE_URL}/api/futbolcu/${duzenlenenId}`
                : `${BASE_URL}/api/futbolcu`;
            const res = await fetch(url, {
                method: duzenlenenId ? 'PUT' : 'POST',
                headers: yetkiliBasliklar,
                body: JSON.stringify(govde),
            });
            if (!res.ok) { setHata(`Kaydedilemedi (${res.status}).`); return; }
            formuTemizle();
            listeyiGetir();
        } catch {
            setHata('Kaydetme sırasında bağlantı hatası oluştu.');
        } finally {
            setKaydediliyor(false);
        }
    };

    const duzenlemeyeBasla = (oyuncu) => {
        setDuzenlenenId(oyuncu.id || oyuncu.Id);
        setForm({
            Isim: oyuncu.isim ?? oyuncu.Isim ?? '',
            Mevki: oyuncu.mevki ?? oyuncu.Mevki ?? '',
            Yas: oyuncu.yas ?? oyuncu.Yas ?? '',
            Takim: oyuncu.takim ?? oyuncu.Takim ?? '',
            Puan: oyuncu.puan ?? oyuncu.Puan ?? '',
        });
    };

    // dateBorn ("1985-02-05" gibi) alanından yaklaşık yaş hesaplar
    const yasHesapla = (dateBorn) => {
        if (!dateBorn) return '';
        const dogum = new Date(dateBorn);
        if (isNaN(dogum.getTime())) return '';
        const simdi = new Date();
        let yas = simdi.getFullYear() - dogum.getFullYear();
        const ayFarki = simdi.getMonth() - dogum.getMonth();
        if (ayFarki < 0 || (ayFarki === 0 && simdi.getDate() < dogum.getDate())) yas--;
        return yas;
    };

    // TheSportsDB üzerinden isimle oyuncu arar
    const scoutAra = async (e) => {
        e.preventDefault();
        if (!scoutAramaAdi.trim()) return;
        setScoutAraniyor(true);
        setScoutHata('');
        try {
            const res = await fetch(`${BASE_URL}/api/PlayerSearch/${encodeURIComponent(scoutAramaAdi.trim())}`, {
                headers: yetkiliBasliklar,
            });
            if (res.status === 404) {
                setScoutSonuclari([]);
                setScoutHata(`'${scoutAramaAdi}' isminde bir oyuncu bulunamadı.`);
                return;
            }
            if (!res.ok) {
                setScoutSonuclari([]);
                setScoutHata(`Arama başarısız (${res.status}).`);
                return;
            }
            const data = await res.json();
            setScoutSonuclari(data);
        } catch {
            setScoutSonuclari([]);
            setScoutHata('Scout arama sırasında bağlantı hatası oluştu.');
        } finally {
            setScoutAraniyor(false);
        }
    };

    // Arama sonucundaki bir oyuncuyu doğrudan Kadro formuna aktarır
    const kadroyaEkleFormaAktar = (oyuncu) => {
        setDuzenlenenId(null);
        setForm({
            Isim: oyuncu.strPlayer ?? '',
            Mevki: oyuncu.strPosition ?? '',
            Yas: yasHesapla(oyuncu.dateBorn),
            Takim: oyuncu.strTeam ?? '',
            Puan: '',
        });
    };

    // TheSportsDB üzerinden isimle takım arar
    const takimAra = async (e) => {
        e.preventDefault();
        if (!takimAramaAdi.trim()) return;
        setTakimAraniyor(true);
        setTakimHata('');
        try {
            const res = await fetch(`${BASE_URL}/api/TeamSearch/${encodeURIComponent(takimAramaAdi.trim())}`, {
                headers: yetkiliBasliklar,
            });
            if (res.status === 404) {
                setTakimSonuclari([]);
                setTakimHata(`'${takimAramaAdi}' isminde bir takım bulunamadı.`);
                return;
            }
            if (!res.ok) {
                setTakimSonuclari([]);
                setTakimHata(`Arama başarısız (${res.status}).`);
                return;
            }
            const data = await res.json();
            setTakimSonuclari(data);
        } catch {
            setTakimSonuclari([]);
            setTakimHata('Takım arama sırasında bağlantı hatası oluştu.');
        } finally {
            setTakimAraniyor(false);
        }
    };

    // TheSportsDB üzerinden lig ID'siyle puan durumunu getirir
    const puanDurumuGetir = async (e) => {
        e.preventDefault();
        if (!ligIdGirdi.trim()) return;
        setPuanDurumuAraniyor(true);
        setPuanDurumuHata('');
        try {
            const res = await fetch(`${BASE_URL}/api/LeagueTable/${encodeURIComponent(ligIdGirdi.trim())}`, {
                headers: yetkiliBasliklar,
            });
            if (res.status === 404) {
                setPuanDurumu([]);
                setPuanDurumuHata(`'${ligIdGirdi}' ID'li lig için puan durumu bulunamadı.`);
                return;
            }
            if (!res.ok) {
                setPuanDurumu([]);
                setPuanDurumuHata(`Arama başarısız (${res.status}).`);
                return;
            }
            const data = await res.json();
            setPuanDurumu(data);
        } catch {
            setPuanDurumu([]);
            setPuanDurumuHata('Puan durumu alınırken bağlantı hatası oluştu.');
        } finally {
            setPuanDurumuAraniyor(false);
        }
    };

    // Favorileri sunucudan çeker
    const favorileriGetir = async () => {
        setFavorilerYukleniyor(true);
        setFavoriHata('');
        try {
            const res = await fetch(`${BASE_URL}/api/Favori`, { headers: yetkiliBasliklar });
            if (res.status === 401) { onCikis(); return; }
            if (!res.ok) {
                setFavoriHata(`Favoriler alınamadı (${res.status}).`);
                return;
            }
            const data = await res.json();
            setFavoriler(data);
        } catch {
            setFavoriHata('Favoriler alınırken bağlantı hatası oluştu.');
        } finally {
            setFavorilerYukleniyor(false);
        }
    };

    useEffect(() => { favorileriGetir(); }, []);

    // Bir oyuncu/takım kartından favorilere ekler. tur: "Oyuncu" | "Takim"
    const favorilereEkle = async (favori) => {
        setFavoriIslemdekiId(favori.KaynakId);
        try {
            const res = await fetch(`${BASE_URL}/api/Favori`, {
                method: 'POST',
                headers: yetkiliBasliklar,
                body: JSON.stringify(favori),
            });
            if (res.status === 400) {
                const data = await res.json().catch(() => null);
                setFavoriHata(data?.message || 'Bu zaten favorilerde ekli.');
                return;
            }
            if (!res.ok) {
                setFavoriHata(`Favorilere eklenemedi (${res.status}).`);
                return;
            }
            setFavoriHata('');
            await favorileriGetir();
        } catch {
            setFavoriHata('Favorilere eklerken bağlantı hatası oluştu.');
        } finally {
            setFavoriIslemdekiId(null);
        }
    };

    // Favorilerim panelindeki "Çıkar" butonuna basınca çalışır
    const favoridenCikar = async (id) => {
        setFavoriIslemdekiId(id);
        try {
            const res = await fetch(`${BASE_URL}/api/Favori/${id}`, {
                method: 'DELETE',
                headers: yetkiliBasliklar,
            });
            if (!res.ok) {
                setFavoriHata(`Favoriden çıkarılamadı (${res.status}).`);
                return;
            }
            setFavoriler((oncekiler) => oncekiler.filter((f) => (f.id ?? f.Id) !== id));
        } catch {
            setFavoriHata('Favoriden çıkarma sırasında bağlantı hatası oluştu.');
        } finally {
            setFavoriIslemdekiId(null);
        }
    };

    // Halihazırda favoride olan kaynakların hızlı kontrolü (buton durumunu belirlemek için)
    const favoriKaynakIdleri = new Set(favoriler.map((f) => f.kaynakId ?? f.KaynakId));

    // --- EXCEL'E AKTAR (EXPORT) ---
    // GET /api/Favori/export normal bir <a href="..."> linkiyle indirilemez,
    // çünkü endpoint [Authorize] ile korunuyor ve token'ı Authorization header'ında istiyor.
    // Bu yüzden fetch ile isteği kendimiz atıp, dönen veriyi (blob) tarayıcıya "indir" diye sunuyoruz.
    const favorileriDisaAktar = async () => {
        setDisaAktariliyor(true);
        setFavoriHata('');
        try {
            const res = await fetch(`${BASE_URL}/api/Favori/export`, {
                method: 'GET',
                headers: yetkiliBasliklar, // Authorization: Bearer <token> burada gidiyor
            });
            if (res.status === 401) { onCikis(); return; }
            if (!res.ok) {
                setFavoriHata(`Excel indirilemedi (${res.status}).`);
                return;
            }

            // Cevabın gövdesi artık JSON değil, ham dosya baytları (blob)
            const blob = await res.blob();

            // Sunucunun Content-Disposition header'ından gerçek dosya adını okumayı dene,
            // bulamazsan yedek/varsayılan bir isim kullan.
            const contentDisposition = res.headers.get('Content-Disposition') || '';
            const eslesme = contentDisposition.match(/filename="?([^"]+)"?/);
            const dosyaAdi = eslesme ? eslesme[1] : `favoriler_${Date.now()}.xlsx`;

            // Tarayıcıda "sahte" bir indirme linki oluşturup otomatik tıklatıyoruz.
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = dosyaAdi;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url); // belleği temizle
        } catch {
            setFavoriHata('Excel indirilirken bağlantı hatası oluştu.');
        } finally {
            setDisaAktariliyor(false);
        }
    };

    // --- EXCEL'DEN İÇE AKTAR (IMPORT) ---
    // Kullanıcı dosya seçtiğinde tarayıcı bunu otomatik çağırır (bkz. <input type="file" onChange=...>)
    const favorileriIceAktar = async (e) => {
        const dosya = e.target.files?.[0];
        if (!dosya) return;

        setIceAktariliyor(true);
        setFavoriHata('');
        setIceAktarimMesaji('');
        try {
            // Dosya yüklerken JSON değil, "multipart/form-data" kullanılır.
            // Bu yüzden Content-Type header'ını ELLE eklemiyoruz;
            // FormData + fetch bunu sınır (boundary) bilgisiyle birlikte kendisi ayarlar.
            const formData = new FormData();
            formData.append('dosya', dosya); // backend'deki parametre adıyla ("IFormFile dosya") birebir aynı olmalı

            const res = await fetch(`${BASE_URL}/api/Favori/import`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }, // Content-Type YOK, tarayıcı otomatik ekliyor
                body: formData,
            });
            if (res.status === 401) { onCikis(); return; }

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                setFavoriHata(data?.mesaj || data?.message || `İçe aktarma başarısız (${res.status}).`);
                return;
            }

            setIceAktarimMesaji(data?.mesaj || 'İçe aktarma tamamlandı.');
            await favorileriGetir(); // listeyi tazele, yeni eklenenler görünsün
        } catch {
            setFavoriHata('İçe aktarma sırasında bağlantı hatası oluştu.');
        } finally {
            setIceAktariliyor(false);
            e.target.value = ''; // aynı dosyayı tekrar seçebilmek için input'u sıfırla
        }
    };

    const sil = async (id) => {
        if (!window.confirm('Bu oyuncuyu silmek istediğine emin misin?')) return;
        try {
            const res = await fetch(`${BASE_URL}/api/futbolcu/${id}`, {
                method: 'DELETE',
                headers: yetkiliBasliklar,
            });
            if (!res.ok) { setHata(`Silinemedi (${res.status}).`); return; }
            listeyiGetir();
        } catch {
            setHata('Silme sırasında bağlantı hatası oluştu.');
        }
    };

    return (
        <div className="dossier">
            <header className="dossier-head">
                <div>
                    <span className="eyebrow">Saha Operasyon Konsolu</span>
                    <h1>Futbolcu Kadrosu</h1>
                </div>
                <div className="token-strip">
                    <span className="token-label">Giriş yapan</span>
                    <code className="token-value">{kullaniciAdi}</code>
                    <span className={`role-badge ${rol === 'Admin' ? 'admin' : 'scout'}`}>
                        {rol}
                    </span>
                    <button className="link-btn" onClick={onCikis}>Çıkış Yap</button>
                </div>
            </header>

            <section className="panel favori-panel">
                <div className="panel-title">
                    ⭐ Favorilerim
                    <span className="panel-count">{favoriler.length} kayıt</span>
                </div>

                <div className="excel-actions">
                    <button
                        type="button"
                        className="filter-btn"
                        onClick={favorileriDisaAktar}
                        disabled={disaAktariliyor || favoriler.length === 0}
                    >
                        {disaAktariliyor ? 'İndiriliyor…' : '📤 Excel\'e Aktar'}
                    </button>

                    <button
                        type="button"
                        className="filter-btn ghost"
                        onClick={() => dosyaInputRef.current?.click()}
                        disabled={iceAktariliyor}
                    >
                        {iceAktariliyor ? 'Yükleniyor…' : '📥 Excel\'den İçe Aktar'}
                    </button>
                    <input
                        type="file"
                        ref={dosyaInputRef}
                        accept=".xlsx,.xls"
                        style={{ display: 'none' }}
                        onChange={favorileriIceAktar}
                    />
                </div>

                {iceAktarimMesaji && <div className="excel-basari">{iceAktarimMesaji}</div>}
                {favoriHata && <div className="auth-error">{favoriHata}</div>}

                {favorilerYukleniyor ? (
                    <div className="skeleton-rows">
                        <div className="skeleton-row">
                            <div className="skeleton-bar" style={{ width: '40%' }} />
                            <div className="skeleton-bar" style={{ width: '25%' }} />
                        </div>
                    </div>
                ) : favoriler.length === 0 ? (
                    <div className="empty-state">Henüz favorilere eklenmiş bir takım veya oyuncu yok.</div>
                ) : (
                    <div className="favori-grid">
                        {favoriler.map((f) => {
                            const id = f.id ?? f.Id;
                            const tur = f.tur ?? f.Tur;
                            const isim = f.isim ?? f.Isim;
                            const gorselUrl = f.gorselUrl ?? f.GorselUrl;
                            const ekNot = f.ekNot ?? f.EkNot;
                            return (
                                <div className="favori-card" key={id}>
                                    <div className="favori-card-media">
                                        {gorselUrl ? (
                                            <img src={gorselUrl} alt={isim} />
                                        ) : (
                                            <span>{tur === 'Takim' ? '🛡️' : '🔎'}</span>
                                        )}
                                    </div>
                                    <div className="favori-card-body">
                                        <span className={`favori-badge ${tur === 'Takim' ? 'favori-badge-takim' : 'favori-badge-oyuncu'}`}>
                                            {tur === 'Takim' ? 'Takım' : 'Oyuncu'}
                                        </span>
                                        <div className="favori-card-name">{isim}</div>
                                        {ekNot && <div className="favori-card-note">{ekNot}</div>}
                                    </div>
                                    <button
                                        className="link-btn danger favori-remove-btn"
                                        disabled={favoriIslemdekiId === id}
                                        onClick={() => favoridenCikar(id)}
                                    >
                                        {favoriIslemdekiId === id ? '…' : 'Favoriden Çıkar'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            <div className={`dossier-body${rol !== 'Admin' ? ' dossier-body--solo' : ''}`}>
                {rol === 'Admin' && (
                    <aside className="panel">
                        <div className="panel-title">
                            {duzenlenenId ? 'Oyuncuyu Güncelle' : 'Yeni Oyuncu Ekle'}
                        </div>
                        <form onSubmit={formuGonder}>
                            <label className="field">
                                <span>İsim</span>
                                <input value={form.Isim} onChange={(e) => setForm({ ...form, Isim: e.target.value })} required />
                            </label>
                            <label className="field">
                                <span>Mevki</span>
                                <input value={form.Mevki} onChange={(e) => setForm({ ...form, Mevki: e.target.value })} placeholder="Örn: Forvet, Kaleci" required />
                            </label>
                            <label className="field">
                                <span>Yaş</span>
                                <input type="number" value={form.Yas} onChange={(e) => setForm({ ...form, Yas: e.target.value })} required />
                            </label>
                            <label className="field">
                                <span>Takım</span>
                                <input value={form.Takim} onChange={(e) => setForm({ ...form, Takim: e.target.value })} required />
                            </label>
                            <label className="field">
                                <span>Scout Puanı</span>
                                <input type="number" step="0.1" value={form.Puan} onChange={(e) => setForm({ ...form, Puan: e.target.value })} required />
                            </label>

                            <button className="send-btn" type="submit" disabled={kaydediliyor}>
                                {kaydediliyor ? 'Kaydediliyor…' : duzenlenenId ? 'Güncellemeyi Kaydet' : 'Kadroya Ekle'}
                            </button>

                            {duzenlenenId && (
                                <button type="button" className="preset-chip"
                                    style={{ marginTop: 10, width: '100%' }} onClick={formuTemizle}>
                                    Vazgeç
                                </button>
                            )}
                        </form>
                    </aside>
                )}

                <main className="panel response-panel">
                    <div className="panel-title">
                        Kadro Listesi
                        <span className="panel-count">
                            {futbolcular.length} oyuncu{filtreAktif ? ' (filtreli)' : ''}
                        </span>
                    </div>

                    {/* --- FİLTRELEME ÇUBUĞU --- */}
                    <form className="filter-bar" onSubmit={filtreUygula}>
                        <label className="filter-field">
                            <span>Mevki</span>
                            <input
                                value={filtre.mevki}
                                onChange={(e) => setFiltre({ ...filtre, mevki: e.target.value })}
                                placeholder="Örn: Forvet"
                            />
                        </label>
                        <label className="filter-field">
                            <span>Min Yaş</span>
                            <input
                                type="number"
                                value={filtre.minYas}
                                onChange={(e) => setFiltre({ ...filtre, minYas: e.target.value })}
                                placeholder="18"
                            />
                        </label>
                        <label className="filter-field">
                            <span>Maks Yaş</span>
                            <input
                                type="number"
                                value={filtre.maxYas}
                                onChange={(e) => setFiltre({ ...filtre, maxYas: e.target.value })}
                                placeholder="25"
                            />
                        </label>
                        <label className="filter-field">
                            <span>Min Puan</span>
                            <input
                                type="number"
                                step="0.1"
                                value={filtre.minPuan}
                                onChange={(e) => setFiltre({ ...filtre, minPuan: e.target.value })}
                                placeholder="7.5"
                            />
                        </label>

                        <div className="filter-presets">
                            {MEVKI_ONAYILAR.map((m) => (
                                <button
                                    type="button"
                                    key={m}
                                    className={`filter-preset ${filtre.mevki === m ? 'active' : ''}`}
                                    onClick={() => mevkiOnayiSec(m)}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>

                        <div className="filter-actions">
                            {filtreAktif && (
                                <button type="button" className="filter-btn ghost" onClick={filtreTemizle}>
                                    Temizle
                                </button>
                            )}
                            <button type="submit" className="filter-btn">Filtrele</button>
                        </div>
                    </form>

                    {hata && <div className="auth-error" style={{ margin: '0 26px 14px' }}>{hata}</div>}

                    {yukleniyor ? (
                        <div className="skeleton-rows">
                            {[0, 1, 2, 3, 4].map((i) => (
                                <div className="skeleton-row" key={i}>
                                    <div className="skeleton-bar" style={{ width: '70%' }} />
                                    <div className="skeleton-bar" style={{ width: '55%' }} />
                                    <div className="skeleton-bar" style={{ width: '30%' }} />
                                    <div className="skeleton-bar" style={{ width: '60%' }} />
                                    <div className="skeleton-bar" style={{ width: '45%' }} />
                                    <div className="skeleton-bar" style={{ width: '50%' }} />
                                </div>
                            ))}
                        </div>
                    ) : futbolcular.length === 0 ? (
                        <div className="empty-state">Henüz kadroya eklenmiş oyuncu yok.</div>
                    ) : (
                        <div className="table-scroll">
                            <table className="player-table">
                                <thead>
                                    <tr>
                                        <th>İsim</th>
                                        <th>Mevki</th>
                                        <th>Yaş</th>
                                        <th>Takım</th>
                                        <th>Puan</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {futbolcular.map((f) => {
                                        const mevki = f.mevki ?? f.Mevki ?? '';
                                        const puan = Number(f.puan ?? f.Puan ?? 0);
                                        const puanYuzde = Math.max(0, Math.min(100, (puan / 10) * 100));
                                        return (
                                            <tr key={f.id || f.Id}
                                                className={duzenlenenId === (f.id || f.Id) ? 'active-row' : ''}>
                                                <td className="player-name">{f.isim ?? f.Isim}</td>
                                                <td>
                                                    <span className={`pos-pill ${mevkiSinifi(mevki)}`}>{mevki}</span>
                                                </td>
                                                <td>{f.yas ?? f.Yas}</td>
                                                <td>{f.takim ?? f.Takim}</td>
                                                <td>
                                                    <div className="rating-cell">
                                                        <div className="rating-track">
                                                            <div className="rating-fill" style={{ width: `${puanYuzde}%` }} />
                                                        </div>
                                                        <span className="rating-value">{puan}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="row-actions">
                                                        {rol === 'Admin' && (
                                                            <>
                                                                <button className="link-btn" onClick={() => duzenlemeyeBasla(f)}>Düzenle</button>
                                                                <button className="link-btn danger" onClick={() => sil(f.id || f.Id)}>Sil</button>
                                                            </>
                                                        )}
                                                        {rol !== 'Admin' && (
                                                            <span className="view-only-tag">👁 Görüntüleme</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>

            {rol === 'Admin' && (
                <section className="panel scout-panel">
                    <div className="scout-panel-head">
                        <div className="scout-panel-icon">🔎</div>
                        <div>
                            <div className="panel-title" style={{ padding: 0, border: 'none' }}>Scout Arama</div>
                            <p className="scout-panel-sub">TheSportsDB üzerinden oyuncu ara, tek tıkla kadro formuna aktar.</p>
                        </div>
                    </div>

                    <form className="filter-bar" onSubmit={scoutAra} style={{ padding: '18px 26px 0' }}>
                        <label className="filter-field" style={{ flex: 1 }}>
                            <span>Oyuncu Adı</span>
                            <input
                                value={scoutAramaAdi}
                                onChange={(e) => setScoutAramaAdi(e.target.value)}
                                placeholder="Oyuncu Adı Gir (Messi, Ronaldo...)"
                            />
                        </label>
                        <div className="filter-actions">
                            <button type="submit" className="filter-btn" disabled={scoutAraniyor}>
                                {scoutAraniyor ? 'Aranıyor…' : 'Ara'}
                            </button>
                        </div>
                    </form>

                    {scoutHata && <div className="auth-error" style={{ margin: '14px 26px 0' }}>{scoutHata}</div>}

                    {scoutSonuclari.length > 0 && (
                        <div className="table-scroll" style={{ marginTop: 18 }}>
                            <div style={{ padding: '0 26px 10px', fontWeight: 600, color: 'var(--ink-soft)', fontSize: 13 }}>
                                Arama Sonuçları
                            </div>
                            <table className="player-table">
                                <thead>
                                    <tr>
                                        <th>İsim</th>
                                        <th>Takım</th>
                                        <th>Mevki</th>
                                        <th>Uyruk</th>
                                        <th>Doğum Tarihi</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scoutSonuclari.map((oyuncu) => (
                                        <tr key={oyuncu.idPlayer}>
                                            <td className="player-name">{oyuncu.strPlayer}</td>
                                            <td>{oyuncu.strTeam}</td>
                                            <td>
                                                <span className={`pos-pill ${mevkiSinifi(oyuncu.strPosition)}`}>
                                                    {oyuncu.strPosition}
                                                </span>
                                            </td>
                                            <td>{oyuncu.strNationality}</td>
                                            <td>{oyuncu.dateBorn}</td>
                                            <td>
                                                <div className="row-actions">
                                                    <button className="link-btn" onClick={() => kadroyaEkleFormaAktar(oyuncu)}>
                                                        Kadroya Ekle
                                                    </button>
                                                    <button
                                                        className="link-btn favori-btn"
                                                        disabled={favoriKaynakIdleri.has(oyuncu.idPlayer) || favoriIslemdekiId === oyuncu.idPlayer}
                                                        onClick={() => favorilereEkle({
                                                            Tur: 'Oyuncu',
                                                            KaynakId: oyuncu.idPlayer,
                                                            Isim: oyuncu.strPlayer,
                                                            GorselUrl: oyuncu.strThumb || oyuncu.strCutout || null,
                                                            EkNot: oyuncu.strTeam || null,
                                                        })}
                                                    >
                                                        {favoriKaynakIdleri.has(oyuncu.idPlayer)
                                                            ? '⭐ Favoride'
                                                            : favoriIslemdekiId === oyuncu.idPlayer
                                                                ? 'Ekleniyor…'
                                                                : '☆ Favorilere Ekle'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            {rol === 'Admin' && (
                <section className="panel scout-panel team-panel">
                    <div className="scout-panel-head">
                        <div className="scout-panel-icon team-icon">🛡️</div>
                        <div>
                            <div className="panel-title" style={{ padding: 0, border: 'none' }}>Takım Ara</div>
                            <p className="scout-panel-sub">TheSportsDB üzerinden takım ara, kulüp detaylarına göz at.</p>
                        </div>
                    </div>

                    <form className="filter-bar" onSubmit={takimAra} style={{ padding: '18px 26px 0' }}>
                        <label className="filter-field" style={{ flex: 1 }}>
                            <span>Takım Adı</span>
                            <input
                                value={takimAramaAdi}
                                onChange={(e) => setTakimAramaAdi(e.target.value)}
                                placeholder="Takım Adı Gir (Barcelona, Fenerbahçe...)"
                            />
                        </label>
                        <div className="filter-actions">
                            <button type="submit" className="filter-btn" disabled={takimAraniyor}>
                                {takimAraniyor ? 'Aranıyor…' : 'Ara'}
                            </button>
                        </div>
                    </form>

                    {takimHata && <div className="auth-error" style={{ margin: '14px 26px 0' }}>{takimHata}</div>}

                    {takimSonuclari.length > 0 && (
                        <div className="team-result-grid">
                            {takimSonuclari.map((t) => {
                                const anaRenk = t.strColour1 ? `#${t.strColour1.replace('#', '')}` : null;
                                return (
                                    <div className="team-card" key={t.idTeam}>
                                        <div
                                            className="team-card-banner"
                                            style={{
                                                backgroundImage: t.strBanner ? `url(${t.strBanner})` : undefined,
                                                background: !t.strBanner && anaRenk ? anaRenk : undefined,
                                            }}
                                        >
                                            <div className="team-card-banner-veil" />
                                            {t.strBadge ? (
                                                <img className="team-badge" src={t.strBadge} alt={t.strTeam} />
                                            ) : (
                                                <div className="team-badge team-badge-fallback">🛡️</div>
                                            )}
                                        </div>

                                        <div className="team-card-body">
                                            <div className="team-card-name-row">
                                                <div className="team-card-name">{t.strTeam}</div>
                                                <button
                                                    className="link-btn favori-btn"
                                                    disabled={favoriKaynakIdleri.has(t.idTeam) || favoriIslemdekiId === t.idTeam}
                                                    onClick={() => favorilereEkle({
                                                        Tur: 'Takim',
                                                        KaynakId: t.idTeam,
                                                        Isim: t.strTeam,
                                                        GorselUrl: t.strBadge || null,
                                                        EkNot: t.strLeague || null,
                                                    })}
                                                >
                                                    {favoriKaynakIdleri.has(t.idTeam)
                                                        ? '⭐ Favoride'
                                                        : favoriIslemdekiId === t.idTeam
                                                            ? 'Ekleniyor…'
                                                            : '☆ Favorilere Ekle'}
                                                </button>
                                            </div>
                                            <div className="team-card-meta">
                                                {t.strLeague && <span className="team-chip">{t.strLeague}</span>}
                                                {t.strCountry && <span className="team-chip">{t.strCountry}</span>}
                                                {t.intFormedYear && <span className="team-chip">Kuruluş {t.intFormedYear}</span>}
                                            </div>

                                            {t.strStadium && (
                                                <div className="team-card-stadium">
                                                    🏟️ {t.strStadium}
                                                    {t.intStadiumCapacity && (
                                                        <span className="team-card-capacity">
                                                            {Number(t.intStadiumCapacity).toLocaleString('tr-TR')} kişi
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {t.strDescriptionEN && (
                                                <p className="team-card-desc">
                                                    {t.strDescriptionEN.length > 170
                                                        ? `${t.strDescriptionEN.slice(0, 170)}…`
                                                        : t.strDescriptionEN}
                                                </p>
                                            )}

                                            {(t.strWebsite || t.strYoutube || t.strInstagram) && (
                                                <div className="team-card-links">
                                                    {t.strWebsite && (
                                                        <a
                                                            className="team-link-chip"
                                                            href={t.strWebsite.startsWith('http') ? t.strWebsite : `https://${t.strWebsite}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            🌐 Site
                                                        </a>
                                                    )}
                                                    {t.strInstagram && (
                                                        <a
                                                            className="team-link-chip"
                                                            href={t.strInstagram.startsWith('http') ? t.strInstagram : `https://${t.strInstagram}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            📷 Instagram
                                                        </a>
                                                    )}
                                                    {t.strYoutube && (
                                                        <a
                                                            className="team-link-chip"
                                                            href={t.strYoutube.startsWith('http') ? t.strYoutube : `https://${t.strYoutube}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            ▶️ YouTube
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}

            {rol === 'Admin' && (
                <section className="panel scout-panel table-panel">
                    <div className="scout-panel-head">
                        <div className="scout-panel-icon table-icon">🏆</div>
                        <div>
                            <div className="panel-title" style={{ padding: 0, border: 'none' }}>Lig Puan Durumu</div>
                            <p className="scout-panel-sub">TheSportsDB üzerinden lig ID'siyle güncel puan durumunu getir.</p>
                        </div>
                    </div>

                    <form className="filter-bar" onSubmit={puanDurumuGetir} style={{ padding: '18px 26px 0' }}>
                        <label className="filter-field" style={{ flex: 1 }}>
                            <span>Lig ID</span>
                            <input
                                value={ligIdGirdi}
                                onChange={(e) => setLigIdGirdi(e.target.value)}
                                placeholder="Lig ID Gir (Örn: 4328 = Premier Lig)"
                            />
                        </label>
                        <div className="filter-actions">
                            <button type="submit" className="filter-btn" disabled={puanDurumuAraniyor}>
                                {puanDurumuAraniyor ? 'Getiriliyor…' : 'Getir'}
                            </button>
                        </div>
                    </form>

                    {puanDurumuHata && <div className="auth-error" style={{ margin: '14px 26px 0' }}>{puanDurumuHata}</div>}

                    {puanDurumu.length > 0 && (
                        <div className="table-scroll" style={{ marginTop: 18 }}>
                            <div className="scout-results-label">
                                {puanDurumu[0]?.strLeague ?? 'Puan Durumu'}
                                {puanDurumu[0]?.strSeason && (
                                    <span className="scout-results-season">{puanDurumu[0].strSeason}</span>
                                )}
                            </div>
                            <table className="player-table standings-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Takım</th>
                                        <th title="Oynanan">O</th>
                                        <th title="Galibiyet">G</th>
                                        <th title="Beraberlik">B</th>
                                        <th title="Mağlubiyet">M</th>
                                        <th title="Averaj">AV</th>
                                        <th>Puan</th>
                                        <th>Form</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {puanDurumu.map((satir) => {
                                        const sira = Number(satir.intRank);
                                        return (
                                            <tr key={satir.idStanding ?? satir.idTeam}>
                                                <td>
                                                    <span className={`rank-badge ${sira <= 4 ? 'rank-top' : ''}`}>
                                                        {satir.intRank}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="standings-team">
                                                        {satir.strBadge ? (
                                                            <img className="standings-badge" src={satir.strBadge} alt={satir.strTeam} />
                                                        ) : (
                                                            <div className="standings-badge standings-badge-fallback">🛡️</div>
                                                        )}
                                                        <span className="player-name">{satir.strTeam}</span>
                                                    </div>
                                                </td>
                                                <td>{satir.intPlayed}</td>
                                                <td>{satir.intWin}</td>
                                                <td>{satir.intDraw}</td>
                                                <td>{satir.intLoss}</td>
                                                <td>{satir.intGoalDifference}</td>
                                                <td>
                                                    <span className="points-pill">{satir.intPoints}</span>
                                                </td>
                                                <td>
                                                    <div className="form-dots">
                                                        {(satir.strForm ?? '').split('').map((harf, i) => (
                                                            <span
                                                                key={i}
                                                                className={`form-dot ${harf === 'W' ? 'form-w' : harf === 'D' ? 'form-d' : harf === 'L' ? 'form-l' : ''}`}
                                                                title={harf === 'W' ? 'Galibiyet' : harf === 'D' ? 'Beraberlik' : harf === 'L' ? 'Mağlubiyet' : ''}
                                                            >
                                                                {harf}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            <footer className="dossier-foot">
                Tüm istekler JWT token ile Authorization başlığında gönderiliyor.
            </footer>
        </div>
    );
}

export default App;
