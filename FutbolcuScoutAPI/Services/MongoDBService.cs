using FutbolcuScoutAPI.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace FutbolcuScoutAPI.Services
{
    public class MongoDBService
    {
        private readonly IMongoCollection<Futbolcu> _futbolcuCollection;
        // Önce class'ın en başına User koleksiyonunu tanımla
        private readonly IMongoCollection<User> _userCollection;

        public MongoDBService(IConfiguration configuration)
        {
            // Senin appsettings.json dosyanın yapısına göre odaları eşleştiriyoruz
            // Önce ConnectionStrings odasına gir, oradaki MongoDb değerini al dedik
            var connectionString = configuration.GetSection("ConnectionStrings:MongoDb").Value;

            // Veritabanı adını doğrudan senin dosyandaki isimle buraya sabitliyoruz
            var databaseName = "FutbolcuScoutDB";

            // Koleksiyon (tablo) adını da Futbolcular yapıyoruz
            var collectionName = "Futbolcular";

            // MongoDB istemcisini ayağa kaldırıp veritabanına bağlanıyoruz
            var client = new MongoClient(connectionString);
            var database = client.GetDatabase(databaseName);

            // Üzerinde işlem yapacağımız futbolcu koleksiyonunu seçiyoruz
            _futbolcuCollection = database.GetCollection<Futbolcu>(collectionName);
            _userCollection = database.GetCollection<User>("Users"); // kodumuzu veritabanındaki Users isimli koleksiyonla el sıkıştırdık.
        }

        // 3. Buraya kullanıcı sorgulama metodunu ekledik
        public async Task<User?> GetUserAsync(string username, string password) //Bana ismi ve şifresi verdiğim kişiyle eşleşen ilk kaydı getir.
        {
            // Artık sadece username ile buluyoruz, şifreyi MongoDB'de karşılaştırmıyoruz
            var user = await _userCollection.Find(u => u.Username == username).FirstOrDefaultAsync();
            
            if (user == null) return null;

            //Girilen şifre, veritabanındaki hash ile eşleşiyor mu?
            bool sifreDogruMu = BCrypt.Net.BCrypt.Verify(password, user.Password);

            return sifreDogruMu ? user : null;
        } 
        public async Task CreateUserAsync(User yeniKullanici) //HASH Password alanı 
        {
            // BCrypt şifreyi hash'liyor, workFactor(11) ne kadar güçlü olduğunu belirler
            yeniKullanici.Password = BCrypt.Net.BCrypt.HashPassword(yeniKullanici.Password, workFactor: 4);
            await _userCollection.InsertOneAsync(yeniKullanici); //şifresi hazırladığımız kullanıcı veritabanına gönderilir
        }

        public async Task<User?> GetUserByUsernameAsync(string username) =>
            await _userCollection.Find(u => u.Username == username).FirstOrDefaultAsync(); //ilk eşlenen kaydı getirir

        // 1. TÜM FUTBOLCULARI LİSTELEME
        public async Task<List<Futbolcu>> GetAsync() =>
            await _futbolcuCollection.Find(_ => true).ToListAsync();

        // 2. TEK BİR FUTBOLCUYU ID'SİNE GÖRE GETİRME
        public async Task<Futbolcu?> GetAsync(string id) =>
            await _futbolcuCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

        // 3. YENİ FUTBOLCU EKLEME

        public async Task CreateAsync(Futbolcu yeniFutbolcu) =>
            await _futbolcuCollection.InsertOneAsync(yeniFutbolcu);

        // 4. FUTBOLCU GÜNCELLEME
        public async Task UpdateAsync(string id, Futbolcu guncelFutbolcu) =>
            await _futbolcuCollection.ReplaceOneAsync(x => x.Id == id, guncelFutbolcu);

        // 5. FUTBOLCU SİLME
        public async Task RemoveAsync(string id) =>
            await _futbolcuCollection.DeleteOneAsync(x => x.Id == id);

        // 6. FİLTRELİ / DİNAMİK ARAMA
        public async Task<List<Futbolcu>> FiltreleAsync(string? mevki, int? minYas, int? maxYas, double? minPuan) //? null olabileceğini söyler
        {
            var builder = Builders<Futbolcu>.Filter; //Mangodb'nin bize sunduğu karmaşık soeguları kolayca yazmamızı sağlayan araç = builder
            var filtreler = new List<FilterDefinition<Futbolcu>>(); //kullanıcı arama kriteri gönderdiyse buraya paketleyip atıyoruz 

            // Her kriter sadece GÖNDERİLMİŞSE listeye eklenir
            if (!string.IsNullOrWhiteSpace(mevki)) //eğer kullanıcı mevki yazdıysa yani boş veya boşluklardan oluşmuyorsa - sadece string tipindeki veriler için 
                filtreler.Add(builder.Eq(x => x.Mevki, mevki)); // Eq = eşittir demek

            if (minYas.HasValue)
                filtreler.Add(builder.Gte(x => x.Yas, minYas.Value)); // Gte = büyük eşit

            if (maxYas.HasValue)
                filtreler.Add(builder.Lte(x => x.Yas, maxYas.Value)); // Lte = küçük eşit

            if (minPuan.HasValue)
                filtreler.Add(builder.Gte(x => x.Puan, minPuan.Value)); //bunlarda .Value olması içine sayı alması gerektiği ve null de olabileceği için kontrol edilir

            // Hiç kriter yoksa boş filtre (= herkesi getir), varsa hepsini AND ile birleştir
            var sonFiltre = filtreler.Count > 0  //sepetteki kural birikti mi
                ? builder.And(filtreler) //evet isse tüm kuralları birbirine bağla And komutuyla
                : builder.Empty; //kullanıcı filtre seçmediyse her şeyi getir komutunu veriyoruz 

            return await _futbolcuCollection.Find(sonFiltre).ToListAsync(); //elimizde ne istediğimizi tuttuğumuz sonFiltre var , veritabanından sadece buna uyanları getir
        }
    }
}