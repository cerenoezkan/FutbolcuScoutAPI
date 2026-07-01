using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FutbolcuScoutAPI.Models;
using FutbolcuScoutAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _config; //appsettings.json dosyanı okur ve bu bilgileri bellekteki bir IConfiguration nesnesinin içine yükler.
    private readonly MongoDBService _mongoService; // Servisi buraya bağladık
    public AuthController(IConfiguration config , MongoDBService mongoService)
    {
       _config = config; //_config appsettings.json dosyamızı okumamızı yarayan özel araç -> Jwt:Key çekip alır
       _mongoService = mongoService;

    } 

    [HttpPost("login")] //KONTROL KAPISI  https://localhost:44313/api/auth/login diyerek girmeyi sağlar 
    public async Task<IActionResult> Login([FromBody] User login) // [FromBody] Gelen JSON paketinin İçindeki Username alanına bakar, senin User.cs sınıfındaki Username değişkenine yerleştirir.Password alanına bakar, Password değişkenine yerleştirir. hazır, dolu bir login nesnesi (User sınıfından bir obje) oluşur
    {
        // ARTIK SORGUMUZU SERVİS YAPIYOR!
        var user = await _mongoService.GetUserAsync(login.Username, login.Password);

        if (user != null) // Eğer veritabanından böyle biri geldiyse
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256); //appsettings.json'daki gizli anahtarını alıp HmacSha256 çok güçlü bir algoritma ile "dijital mühür" hazırlıyoruz

            var token = new JwtSecurityToken(
                claims: new[] { new Claim(ClaimTypes.Name, login.Username) }, //Kart sahibi kim? Name: ceren gibi
                expires: DateTime.Now.AddHours(1), // Kartın ömrü (1 saat sonra geçersiz olacak)
                signingCredentials: creds //hazırladığımız mührü basıyoruz 
            );
            return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) }); //kullanıcıya gönderme
        }
        return Unauthorized(); //401 Hata kodu dön, tanımıyoruz 
    }
}