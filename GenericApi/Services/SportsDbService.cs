using Newtonsoft.Json; // JSON a çevirme sağlar
using GenericApi.Models; //Model sınıfı içeriklerine erişmek için 

namespace GenericApi.Services
{
    public class SportsDbService
    {
        private readonly HttpClient _httpClient; //internete istek atayacak aracı (client)

        public SportsDbService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<List<SportsDbPlayer>> GetPlayersAsync(string playerName)
        {
            string url = $"https://www.thesportsdb.com/api/v1/json/123/searchplayers.php?p={playerName}";  //arama yapacağımız url 

            // 1. Adım: İsteği at ve cevabı al
            var responseMessage = await _httpClient.GetAsync(url); //belirlediğimiz adrese internetten istek atıp cevabı bekliyoruz 

            // 2. Adım: Cevap başarılı mı kontrol et -- cevabın 200-299 aralığında olup olmadığını kontrol etme
            if (responseMessage.IsSuccessStatusCode) 
            {
                // 3. Adım: İçeriği metin (string) olarak oku
                var jsonData = await responseMessage.Content.ReadAsStringAsync(); //API den gelen veri ham metin olarak okunur

                // 4. Adım: Metni nesneye çevir (Deserialize)
                var result = JsonConvert.DeserializeObject<SportsDbSearchResponse>(jsonData); //TERCÜME KISMI - JSON'U C#'a çevirme 

                return result?.player ?? new List<SportsDbPlayer>(); //Eğer sonuçta oyuncu varsa onu döndürüyoruz yoksa API boş gönderdiyse, hata almamak için geriye "boş ama çalışan" bir liste döndür
            }

            return new List<SportsDbPlayer>(); 
        }
    }
}