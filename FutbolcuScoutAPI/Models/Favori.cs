using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace FutbolcuScoutAPI.Models
{
    public class Favori
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
       
        [BsonElement("Tur")]
        public string Tur { get; set; } = null!;

        [BsonElement("KaynakId")]
        public string KaynakId { get; set; } = null!;

        [BsonElement("Isim")]
        public string Isim { get; set; } = null!;

        [BsonElement("GorselUrl")]
        public string? GorselUrl { get; set; } = null;

        [BsonElement("EkNot")]
        public string? EkNot { get; set; } = null;

        [BsonElement("EklenmeTarihi")]
        public DateTime EklenmeTarihi { get; set; } = DateTime.UtcNow;

    }
}
