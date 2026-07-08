using GenericApi.Models;
using Newtonsoft.Json;

namespace GenericApi.Services
{
    public class SportsDbTeamService
    {
        private readonly HttpClient _httpClient;

        public SportsDbTeamService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<List<SportsDbTeam>> GetTeamsAsync(string teamName)
        {
            string url = $"https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t={teamName}";
            var responseMessage = await _httpClient.GetAsync(url);

            if (responseMessage.IsSuccessStatusCode)
            {
                var jsonData = await responseMessage.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<SportsDbTeamSearchResponse>(jsonData);
                return result?.teams ?? new List<SportsDbTeam>();
            }

            return new List<SportsDbTeam>();
        }
    }
}