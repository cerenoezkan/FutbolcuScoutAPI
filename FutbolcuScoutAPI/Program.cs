using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Servisi sisteme tanýtýyoruz
builder.Services.AddHttpClient<GenericApi.Services.SportsDbService>();  //.NET, PlayerSearchController'ýn constructor'ýna hangi SportsDbService nesnesini vereceðini bilir

// 1. Ýzin politikasý tanýmlýyoruz
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll",
        builder => builder.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader());
});

// --- 1. ADIM: JWT Servisini Ekleyelim ---
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"])),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

builder.Services.AddAuthorization();
// ----------------------------------------

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddSingleton<FutbolcuScoutAPI.Services.MongoDBService>(); //veritabaný için MongoDBServices kullanýmý
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection(); //gelen veriyi güvenli (https) kanala sokar 
app.UseCors("AllowAll"); // Bu izin belgesini trafiðe dahil et
// --- 2. ADIM: Güvenlik Görevlilerini (Trafik Polislerini) Devreye Alalým ---
app.UseAuthentication(); // Gelen token'ý kontrol et
app.UseAuthorization();  // Yetki var mý bak
// --------------------------------------------------------------------------
app.MapControllers();

app.Run();
