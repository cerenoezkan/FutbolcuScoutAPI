using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using GenericApi.Services;

namespace FutbolcuScoutAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LeagueTableController : ControllerBase
    {
        private readonly SportsDbTableService _sportsDbService;

        public LeagueTableController (SportsDbTableService dbTableService)
        {
            _sportsDbService = dbTableService;
        }

        [HttpGet("{leagueId}")]
        public async Task<IActionResult> GetTable(string leagueId)
        {
            var table = await _sportsDbService.GetTablesAsync(leagueId);

            if (table.Count == 0)

                return NotFound($"'{leagueId}' ID'li lig için puan durumu bulunamadı.");

            return Ok(table);
        }
    }
}
