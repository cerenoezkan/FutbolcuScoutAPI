using FutbolcuScoutAPI.Models;
using FutbolcuScoutAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GenericApi.Services;
using System.Data;

namespace FutbolcuScoutAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FavoriController : ControllerBase
    {
        private readonly MongoDBService _mongoDBService;
        public FavoriController(MongoDBService mongoDBService)
        {
            _mongoDBService = mongoDBService;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var favoriler = await _mongoDBService.GetFavorilerAsync();
            return Ok(favoriler);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Favori yeniFavori) // FromBody -> otomatik JSON'u C#'a çevirir 
        {
            var zatenVarMi = await _mongoDBService.FavoriVarMiAsync(yeniFavori.KaynakId);
            if (zatenVarMi)
                return BadRequest(new { message = "Bu zaten favorilerde ekli." });
            await _mongoDBService.CreateFavoriAsync(yeniFavori);
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            await _mongoDBService.RemoveFavoriAsync(id);
            return NoContent();
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportExcel()
        {
            var favoriler = await _mongoDBService.GetFavorilerAsync();

            var excelHelper = new ExcelHelper(); //GenericApi projesindeki yazdığımız kısımdan bir örnek oluştur
            byte[] dosyaIcerigi = excelHelper.ListeyiExcelYap(favoriler, "Favoriler"); //favoriler listesini oluşturuyoruz, o da bize byte dizisini veriyor 

            string contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"; //internet dünyasının "Bu bir Excel (.xlsx) dosyasıdır, bunu Excel ile aç!" deme şeklidir
            string dosyaAdi = $"favoriler_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx"; // Kullanıcının dosyayı indirdiğinde göreceği isim 

            return File(dosyaIcerigi, contentType, dosyaAdi);// ASP.NET Core'un en güçlü silahlarından biridir. File metodu, elindeki ham veriyi (dosyaIcerigi), dosya türü (contentType) ve kullanıcıya görünecek isimle (dosyaAdi) birleştirir ve tarayıcıya "Bu bir dosyadır, al bunu indir!"
        }

        [HttpPost("import")]
        public async Task<IActionResult> ImportExcel(IFormFile dosya)
        {
            if (dosya == null || dosya.Length == 0)
                return BadRequest("Lütfen bir Excel dosyası yükleyin.");

            var excelHelper = new ExcelHelper();

            using var stream = dosya.OpenReadStream();
            List<Favori> yeniFavoriler = excelHelper.ExceldenListeOku<Favori>(stream);

            int eklenenSayisi = 0;
            foreach (var favori in yeniFavoriler)
            {
                favori.Id = null;
                await _mongoDBService.CreateFavoriAsync(favori);
                eklenenSayisi++;
            }

            return Ok(new { mesaj = $"{eklenenSayisi} favori başarıyla eklendi." });
        }

    }

}
