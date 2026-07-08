using GenericApi.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FutbolcuScoutAPI.Controllers
{
    [Route("api/[controller]")] // Adresi: api/PlayerSearch olacak
    [ApiController]
    public class PlayerSearchController : ControllerBase //MVC/Web API de miras alınan sınıf -> Ok ve NotFound fonksiyonlarını sağlar 
    {
        // Servis ver onu kullanıcağım demek için: 
        private readonly SportsDbService _sportsDbService;

        public PlayerSearchController(SportsDbService sportsDbService) //Dependency Injection 
        {
            _sportsDbService = sportsDbService;
        }

        // GET: api/PlayerSearch/Messi gibi istekleri karşılar
        [HttpGet("{playerName}")]    //GET isteklerine cevap ve URL sonunda api/PlayerSearch/messi gibi 
        public async Task<IActionResult> GetPlayer(string playerName) // IActionResult : Metodun dönebileceği farklı HTTP cevap türlerini (200, 404, 500 vs.) temsil eden esnek dönüş tipi.
        {
            // Garson olarak mutfağa (Service) gidip, sonucu alıyoruz
            var players = await _sportsDbService.GetPlayersAsync(playerName);

            // Eğer oyuncu bulunamadıysa müşteriye 404 (Not Found) hatası dönüyoruz
            if (players.Count == 0)
                return NotFound($"'{playerName}' isminde bir oyuncu bulunamadı."); //404 değeri 

            // Oyuncuları başarıyla bulduysak 200 (OK) koduyla listeyi müşteriye sunuyoruz
            return Ok(players); //200 HTTP durum kodları
        }

        [HttpGet("export/{playerName}")] //çalışma olmaması için export/player name kullanıldı 
            public async Task<IActionResult> ExportPlayer (string playerName)
        {
            var players = await _sportsDbService.GetPlayersAsync(playerName);
            if(players.Count == 0)
                return NotFound($"'{playerName}' isminde bir oyuncu bulunamadı.");

            var excelHelper = new ExcelHelper();
            byte[] dosyaIcerigi = excelHelper.ListeyiExcelYap(players, "AramaSonuclari");

            string contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            string dosyaAdi = $"arama_{playerName}_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";

            return File(dosyaIcerigi, contentType, dosyaAdi);
        }
        
    }
}