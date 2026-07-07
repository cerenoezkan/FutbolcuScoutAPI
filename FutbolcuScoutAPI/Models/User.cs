using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace FutbolcuScoutAPI.Models
{
    public class User
    {
        [BsonId] // MongoDB'nin _id alanını buraya bağlar
        [BsonRepresentation(BsonType.ObjectId)] // String'i MongoDB'nin ObjectId formatına çevirir
        public string? Id { get; set; }

        public string Username { get; set; } = null!;
        public string Password { get; set; } = null!;

        //Kullanıcı rolü - Admin veya Scout
        public string Role { get; set; } = "Scout"; //varsayılan mod
    }
}