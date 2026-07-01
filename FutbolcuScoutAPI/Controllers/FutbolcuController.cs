using FutbolcuScoutAPI.Models;
using FutbolcuScoutAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization; // 1. ADIM: Kütüphaneyi buraya ekledik

namespace FutbolcuScoutAPI.Controllers
{
    [Authorize] // 2. ADIM: sınıfın en tepesine konulduğu için, bu Controller içindeki her metodun (Get, Post, Delete...) girişine bir "güvenlik görevlisi" diker.
    [ApiController]
    [Route("api/[controller]")] // Bu API'ye "api/futbolcu" adresinden ulaşılacağını söyler, otomatik olarak 
    public class FutbolcuController : ControllerBase
    {
        private readonly MongoDBService _mongoDBService;

        // Mutfaktaki aşçımızı (Servisimizi) garsonun eline teslim ediyoruz
        public FutbolcuController(MongoDBService mongoDBService)
        {
            _mongoDBService = mongoDBService;
        }

        // 1. HTTP GET: Tüm Futbolcuları Listele (api/futbolcu) [HttpGet]->"Bana veri OKU/GETİR"
        [HttpGet]
        public async Task<List<Futbolcu>> Get() =>
            await _mongoDBService.GetAsync();

        // 2. HTTP GET: ID'ye Göre Tek Bir Futbolcu Getir (api/futbolcu/id_degeri)
        [HttpGet("{id:length(24)}")] //MongoDB ID'leri 24 karakterli gizli şifreler yapar 
        public async Task<ActionResult<Futbolcu>> Get(string id)
        {
            var futbolcu = await _mongoDBService.GetAsync(id);

            if (futbolcu is null)
            {
                return NotFound(new { message = "Aradığınız futbolcu bulunamadı!" }); // 404 Hatası döner
            }

            return futbolcu;
        }

        // 3. HTTP POST: Yeni Futbolcu Ekle (api/futbolcu) [HttpPost]->"Yeni bir veri OLUŞTUR/EKLE"
        [HttpPost]
        public async Task<IActionResult> Post(Futbolcu yeniFutbolcu)
        {
            await _mongoDBService.CreateAsync(yeniFutbolcu);
            return CreatedAtAction(nameof(Get), new { id = yeniFutbolcu.Id }, yeniFutbolcu); // 201 Başarılı kodu döner CreatedAtAction(...) 
        }

        // 4. HTTP PUT: Futbolcu Güncelle (api/futbolcu/id_degeri) [HttpPut]->"Var olan veriyi GÜNCELLE/DEĞİŞTİR"
        [HttpPut("{id:length(24)}")]
        public async Task<IActionResult> Update(string id, Futbolcu guncelFutbolcu)
        {
            var futbolcu = await _mongoDBService.GetAsync(id);

            if (futbolcu is null)
            {
                return NotFound(new { message = "Güncellenmek istenen futbolcu bulunamadı!" }); //return NotFound(...) ->C#'da -> HTTP 404 koduna çevirir
            }

            guncelFutbolcu.Id = futbolcu.Id;

            await _mongoDBService.UpdateAsync(id, guncelFutbolcu);
            return NoContent(); // 204 Başarılı ama içerik yok kodu döner
        }

        // 5. HTTP DELETE: Futbolcu Sil (api/futbolcu/id_degeri) [HttpDelete]->"Bu veriyi tamamen SİL"
        [HttpDelete("{id:length(24)}")]
        public async Task<IActionResult> Delete(string id)
        {
            var futbolcu = await _mongoDBService.GetAsync(id);

            if (futbolcu is null)
            {
                return NotFound(new { message = "Silinmek istenen futbolcu bulunamadı!" });
            }

            await _mongoDBService.RemoveAsync(futbolcu.Id!);
            return NoContent();
        }
    }
}