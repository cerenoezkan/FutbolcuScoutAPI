namespace GenericApi.Models
{
    public class SportsDbTeam
    {
        public string? idTeam { get; set; }
        public string? idESPN { get; set; }
        public string? idAPIfootball { get; set; }
        public string? intLoved { get; set; }
        public string? strTeam { get; set; }
        public string? strTeamAlternate { get; set; }
        public string? strTeamShort { get; set; }
        public string? intFormedYear { get; set; }
        public string? strSport { get; set; }
        public string? strLeague { get; set; }
        public string? idLeague { get; set; }
        public string? strLeague2 { get; set; }
        public string? idLeague2 { get; set; }
        public string? strLeague3 { get; set; }
        public string? idLeague3 { get; set; }
        public string? strLeague4 { get; set; }
        public string? idLeague4 { get; set; }
        public string? strLeague5 { get; set; }
        public string? idLeague5 { get; set; }
        public string? strLeague6 { get; set; }
        public string? idLeague6 { get; set; }
        public string? strLeague7 { get; set; }
        public string? idLeague7 { get; set; }
        public string? strDivision { get; set; }
        public string? idVenue { get; set; }
        public string? strStadium { get; set; }
        public string? strKeywords { get; set; }
        public string? strRSS { get; set; }
        public string? strLocation { get; set; }
        public string? intStadiumCapacity { get; set; }
        public string? strWebsite { get; set; }
        public string? strFacebook { get; set; }
        public string? strTwitter { get; set; }
        public string? strInstagram { get; set; }
        public string? strDescriptionEN { get; set; }
        public string? strDescriptionDE { get; set; }
        public string? strDescriptionFR { get; set; }
        public string? strDescriptionCN { get; set; }
        public string? strDescriptionIT { get; set; }
        public string? strDescriptionJP { get; set; }
        public string? strDescriptionRU { get; set; }
        public string? strDescriptionES { get; set; }
        public string? strDescriptionPT { get; set; }
        public string? strDescriptionSE { get; set; }
        public string? strDescriptionNL { get; set; }
        public string? strDescriptionHU { get; set; }
        public string? strDescriptionNO { get; set; }
        public string? strDescriptionIL { get; set; }
        public string? strDescriptionPL { get; set; }
        public string? strColour1 { get; set; }
        public string? strColour2 { get; set; }
        public string? strColour3 { get; set; }
        public string? strGender { get; set; }
        public string? strCountry { get; set; }
        public string? strBadge { get; set; }
        public string? strLogo { get; set; }
        public string? strFanart1 { get; set; }
        public string? strFanart2 { get; set; }
        public string? strFanart3 { get; set; }
        public string? strFanart4 { get; set; }
        public string? strBanner { get; set; }
        public string? strEquipment { get; set; }
        public string? strYoutube { get; set; }
        public string? strLocked { get; set; }
    }

    
    public class SportsDbTeamSearchResponse
    {
        public List<SportsDbTeam>? teams { get; set; }
    }
}