using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace FutbolcuScoutAPI.Models
{
    public class Futbolcu
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("Isim")]
        public string Isim { get; set; } = null!;

        [BsonElement("Mevki")]
        public string Mevki { get; set; } = null!;

        [BsonElement("Yas")]
        public int Yas { get; set; }

        [BsonElement("Takim")]
        public string Takim { get; set; } = null!;

        [BsonElement("Puan")]
        public double Puan { get; set; }
    }
}