 using FutbolcuScoutAPI.Models;
using FutbolcuScoutAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization; // 1. ADIM: Kütüphaneyi buraya ekledik

namespace FutbolcuScoutAPI.Controllers
{
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

        // 1. HTTP GET: Tüm Futbolcuları Listele (api/futbolcu) [HttpGet]->"Bana veri OKU/GETİR" - artık List<FutbolcuDto> dönüyor - ADMIN + SCOUT 
        [Authorize (Roles ="Admin,Scout")]
        [HttpGet]
        public async Task<List<FutbolcuDto>> Get()
        {
            var futbolcular = await _mongoDBService.GetAsync();
            //Her futbolcu nesnesini FutbolcuDto'ya çeviriyoruz
            return futbolcular.Select(f => DtoYeDonustur(f)).ToList();
        }

        // 2. HTTP GET: Filtreli Arama (api/futbolcu/filtrele?mevki=Forvet&minYas=18&maxYas=25&minPuan=7.5) - ADMIN + SCOUT
        // ÖNEMLİ: Bu metot, {id:length(24)} route'undan ÖNCE tanımlanmalı. Aksi halde ASP.NET Core
        // "filtrele" kelimesini bir id sanmaya çalışabilir (24 karakter olmadığı için zaten eşleşmez,
        // ama okunabilirlik ve sıra karışıklığını önlemek için üstte tutuyoruz).
        [Authorize(Roles = "Admin,Scout")]
        [HttpGet("filtrele")] // bu metodun bir "GET" isteği olduğunu söyler 
        public async Task<List<FutbolcuDto>> Filtrele(
            [FromQuery] string? mevki,  // [FromQuery]= ? den sonraki gelen bilgiyi otomatik olarak alıp mevki değişkenine "kopyalar" 
            [FromQuery] int? minYas, // ? koyulması boş da gelebilir hata verme ve sadece tek filtrelemelerde ayrı metodlar yazma
            [FromQuery] int? maxYas,
            [FromQuery] double? minPuan)
        {
            var sonuclar = await _mongoDBService.FiltreleAsync(mevki, minYas, maxYas, minPuan); //aldığı verileri paketleyip gönderir
            return sonuclar.Select(f => DtoYeDonustur(f)).ToList(); //müşteriye göstermemek için bu metod lazım 
        }

        // 2. HTTP GET: ID'ye Göre Tek Bir Futbolcu Getir (api/futbolcu/id_degeri) -artık FutbolcuDto dönüyor - ADMIN + SCOUT
        [Authorize(Roles ="Admin,Scout")]
        [HttpGet("{id:length(24)}")] //MongoDB ID'leri 24 karakterli gizli şifreler yapar 
        public async Task<ActionResult<FutbolcuDto>> Get(string id)
        {
            var futbolcu = await _mongoDBService.GetAsync(id);

            if (futbolcu is null)
            {
                return NotFound(new { message = "Aradığınız futbolcu bulunamadı!" }); // 404 Hatası döner
            }

            return DtoYeDonustur(futbolcu);
        }

        // 3. HTTP POST: Yeni Futbolcu Ekle (api/futbolcu) [HttpPost]->"Yeni bir veri OLUŞTUR/EKLE" - ADMIN
        [Authorize(Roles ="Admin")]
        [HttpPost]
        public async Task<IActionResult> Post(Futbolcu yeniFutbolcu)
        {
            await _mongoDBService.CreateAsync(yeniFutbolcu);
            return CreatedAtAction(nameof(Get), new { id = yeniFutbolcu.Id }, DtoYeDonustur(yeniFutbolcu)); // 201 Başarılı kodu döner CreatedAtAction(...) 
        }

        // 4. HTTP PUT: Futbolcu Güncelle (api/futbolcu/id_degeri) [HttpPut]->"Var olan veriyi GÜNCELLE/DEĞİŞTİR" -ADMIN
        [Authorize(Roles ="Admin")]
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
        [Authorize(Roles = "Admin")]
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
        // Çevirmen metodu — Futbolcu → FutbolcuDto
        private static FutbolcuDto DtoYeDonustur(Futbolcu f) => new FutbolcuDto
        {
            Id = f.Id,
            Isim = f.Isim,
            Mevki = f.Mevki,
            Yas = f.Yas,
            Takim = f.Takim,
            Puan = f.Puan
        };
    }
}