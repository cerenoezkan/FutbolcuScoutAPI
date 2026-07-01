import { useEffect, useState } from 'react';
import './App.css';

const BASE_URL = 'https://localhost:44313';

const BOS_FORM = { Isim: '', Mevki: '', Yas: '', Takim: '', Puan: '' };

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('userToken') || '');
  const [kullaniciAdi, setKullaniciAdi] = useState(() => localStorage.getItem('userName') || '');

  if (!token) {
    return <GirisEkrani onGiris={(t, kullanici) => {
      localStorage.setItem('userToken', t);
      localStorage.setItem('userName', kullanici);
      setToken(t);
      setKullaniciAdi(kullanici);
    }} />;
  }

  return (
    <ScoutPaneli
      token={token}
      kullaniciAdi={kullaniciAdi}
      onCikis={() => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userName');
        setToken('');
        setKullaniciAdi('');
      }}
    />
  );
}

function GirisEkrani({ onGiris }) {
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
        setHata('Kullanıcı adı veya şifre hatalı. (Bu kullanıcının veritabanında kayıtlı olması gerekir.)');
        return;
      }
      if (!res.ok) {
        setHata(`Sunucu hatası: ${res.status}`);
        return;
      }
      const data = await res.json();
      onGiris(data.token, username);
    } catch (err) {
      setHata('Sunucuya ulaşılamadı. API çalışıyor mu ve adres doğru mu kontrol et.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={girisYap}>
        <span className="eyebrow">Scout Sistemi</span>
        <h1>Giriş Yap</h1>
        <p className="auth-sub">Oyuncu kadrosuna erişmek için kayıtlı hesabınla giriş yap.</p>

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
      </form>
    </div>
  );
}

function ScoutPaneli({ token, kullaniciAdi, onCikis }) {
  const [futbolcular, setFutbolcular] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [form, setForm] = useState(BOS_FORM);
  const [duzenlenenId, setDuzenlenenId] = useState(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const yetkiliBasliklar = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const listeyiGetir = async () => {
    setYukleniyor(true);
    setHata('');
    try {
      const res = await fetch(`${BASE_URL}/api/futbolcu`, { headers: yetkiliBasliklar });
      if (res.status === 401) {
        setHata('Oturum süresi dolmuş olabilir, lütfen tekrar giriş yap.');
        onCikis();
        return;
      }
      const data = await res.json();
      setFutbolcular(data);
    } catch (err) {
      setHata('Liste alınamadı, sunucu çalışmıyor olabilir.');
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => {
    listeyiGetir();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formuTemizle = () => {
    setForm(BOS_FORM);
    setDuzenlenenId(null);
  };

  const formuGonder = async (e) => {
    e.preventDefault();
    setKaydediliyor(true);
    setHata('');

    const gövde = {
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
      const method = duzenlenenId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: yetkiliBasliklar,
        body: JSON.stringify(gövde),
      });

      if (!res.ok) {
        setHata(`Kaydedilemedi (${res.status}).`);
        return;
      }

      formuTemizle();
      listeyiGetir();
    } catch (err) {
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
      if (!res.ok) {
        setHata(`Silinemedi (${res.status}).`);
        return;
      }
      listeyiGetir();
    } catch (err) {
      setHata('Silme sırasında bağlantı hatası oluştu.');
    }
  };

  return (
    <div className="dossier">
      <header className="dossier-head">
        <div className="dossier-head-left">
          <span className="eyebrow">Saha Operasyon Konsolu</span>
          <h1>Futbolcu Kadrosu</h1>
        </div>
        <div className="token-strip">
          <span className="token-label">Giriş yapan</span>
          <code className="token-value">{kullaniciAdi}</code>
          <button className="link-btn" onClick={onCikis}>Çıkış Yap</button>
        </div>
      </header>

      <div className="dossier-body">
        <aside className="panel request-panel">
          <div className="panel-title">{duzenlenenId ? 'Oyuncuyu Güncelle' : 'Yeni Oyuncu Ekle'}</div>

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
              <button type="button" className="preset-chip" style={{ marginTop: 10, width: '100%' }} onClick={formuTemizle}>
                Vazgeç
              </button>
            )}
          </form>
        </aside>

        <main className="panel response-panel">
          <div className="panel-title">Kadro Listesi ({futbolcular.length})</div>

          {hata && <div className="auth-error" style={{ marginBottom: 14 }}>{hata}</div>}

          {yukleniyor ? (
            <div className="empty-state">Liste yükleniyor…</div>
          ) : futbolcular.length === 0 ? (
            <div className="empty-state">Henüz kadroya eklenmiş oyuncu yok. Soldan ilk oyuncuyu ekleyebilirsin.</div>
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
                  {futbolcular.map((f) => (
                    <tr key={f.id || f.Id} className={duzenlenenId === (f.id || f.Id) ? 'active-row' : ''}>
                      <td>{f.isim ?? f.Isim}</td>
                      <td>{f.mevki ?? f.Mevki}</td>
                      <td>{f.yas ?? f.Yas}</td>
                      <td>{f.takim ?? f.Takim}</td>
                      <td><span className="puan-badge">{f.puan ?? f.Puan}</span></td>
                      <td className="row-actions">
                        <button className="link-btn" onClick={() => duzenlemeyeBasla(f)}>Düzenle</button>
                        <button className="link-btn danger" onClick={() => sil(f.id || f.Id)}>Sil</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      <footer className="dossier-foot">
        Tüm istekler, giriş sırasında alınan JWT token ile Authorization başlığında gönderiliyor.
      </footer>
    </div>
  );
}

export default App;
