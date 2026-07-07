namespace FutbolcuScoutAPI.Models
{ //API 'ye response olarak gönderilen sınıf modeli ->DTO , MongoDB'ye özel hiçbir şey yok : BsonId, BsonElement gibi ifadeler
    public class FutbolcuDto
    {
        public string? Id { get; set; }
        public string Isim { get; set; } = null!;
        public string Mevki { get; set; } = null!;
        public int Yas { get; set; }
        public string Takim { get; set; } = null!;
        public double Puan { get; set; }
    }
}
