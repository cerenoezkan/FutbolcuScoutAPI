import { useEffect, useState } from 'react';
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

            <div className="dossier-body">
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
                                                            <span className="view-only-tag">Sadece görüntüleme</span>
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

            <footer className="dossier-foot">
                Tüm istekler JWT token ile Authorization başlığında gönderiliyor.
            </footer>
        </div>
    );
}

export default App;
