namespace GenericApi.Models
{
    public class SportsDbTable
    {
        public string? idStanding { get; set; }
        public string? intRank { get; set; }
        public string? idTeam { get; set; }
        public string? strTeam { get; set; }
        public string? strBadge { get; set; }
        public string? idLeague { get; set; }
        public string? strLeague { get; set; }
        public string? strSeason { get; set; }
        public string? strGroup { get; set; }
        public string? strForm { get; set; }
        public string? strDescription { get; set; }
        public string? intPlayed { get; set; }
        public string? intWin { get; set; }
        public string? intLoss { get; set; }
        public string? intDraw { get; set; }
        public string? intGoalsFor { get; set; }
        public string? intGoalsAgainst { get; set; }
        public string? intGoalDifference { get; set; }
        public string? intPoints { get; set; }
        public string? dateUpdated { get; set; }
    }
    public class SportsDbTableSearchResponse
    {
        public List<SportsDbTable>? table { get; set; }
    }
}
