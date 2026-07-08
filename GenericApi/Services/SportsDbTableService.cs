using GenericApi.Models;
using Newtonsoft.Json;

namespace GenericApi.Services
{
    public class SportsDbTableService
    {
        private readonly HttpClient _httpClient;

        public SportsDbTableService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }
        public async Task<List<SportsDbTable>> GetTablesAsync(string tableId)

        {
            string url = $"https://www.thesportsdb.com/api/v1/json/123/lookuptable.php?l={tableId}";
            var responseMessage = await _httpClient.GetAsync(url);

            if (responseMessage.IsSuccessStatusCode)
            {
                var jsonData = await responseMessage.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<SportsDbTableSearchResponse>(jsonData);
                return result?.table ?? new List<SportsDbTable>();
            }


            return new List<SportsDbTable>();
        }
    }
}
