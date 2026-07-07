namespace GenericApi.Models
{
    // TEK BİR oyuncunun bilgilerini tutan sınıf
    public class SportsDbPlayer
    {
        public string? idPlayer { get; set; } //? -> boş alan olabilir demek 
        public string? strPlayer { get; set; }
        public string? strTeam { get; set; }
        public string? strNationality { get; set; }
        public string? strPosition { get; set; }
        public string? dateBorn { get; set; }
        public string? strThumb { get; set; }
    }

    // TheSportsDB ->  API, veriyi doğrudan bir oyuncu olarak değil bir liste içinde gönderiyor
    public class SportsDbSearchResponse
    {
        public List<SportsDbPlayer>? player { get; set; } //SportsDbPlayer türünde , içinde oyuncular olan bir kutu gibi 
    }
}