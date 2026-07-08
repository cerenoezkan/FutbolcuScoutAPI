using GenericApi.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FutbolcuScoutAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TeamSearchController : ControllerBase
    {
        private readonly SportsDbTeamService _sportsDbService;

        public TeamSearchController(SportsDbTeamService sportsDbTeamService)
        {
            _sportsDbService = sportsDbTeamService;
        }

        [HttpGet("{teamName}")]
        public async Task<IActionResult> GetTeam(string teamName)
        {
            var teams = await _sportsDbService.GetTeamsAsync(teamName);

            if (teams.Count == 0)

                return NotFound($"'{teamName}' isminde bir takım bulunamadı.");


            return Ok(teams);
        }
    }
}
