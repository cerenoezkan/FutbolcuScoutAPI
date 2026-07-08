using ClosedXML.Excel;
using System.Reflection;

namespace GenericApi.Services
{
    public class ExcelHelper
    {
        // T: hangi tip olduğu önceden belli olmayan, çağrıldığında belli olacak "yer tutucu"
        public byte[] ListeyiExcelYap<T>(List<T> veriler, string sayfaAdi = "Sayfa1") //dosya direkt RAM de olduğu için 0 ve 1'lerden oluşan byte a çevrilir
        {
            using var workbook = new XLWorkbook(); //boş excel sayfası oluşturma ve değişkene at ki içine bir şeyler yazabil , bellekte boş yer tutmamak için using
            var sheet = workbook.Worksheets.Add(sayfaAdi);  //Worksheet sayfalara erişir , yeni oluşturduğumuz sekmeye de sheet değişkeni ile ulaşıcaz 

            // Reflection: T tipinin (Favori, SportsDbPlayer, ne ise) tüm public
            // property'lerini ÇALIŞMA ANINDA keşfet
            PropertyInfo[] ozellikler = typeof(T).GetProperties(); //T 'nin gerçek  kimliği ve bu bulduğıın sınıf içindeki özellikleri(property) varsa getir

            // Başlık satırı: her property'nin ADINI Excel'in 1. satırına yaz 
            for (int i = 0; i < ozellikler.Length; i++) //tüm özellikler bitene kadar dön
            {
                sheet.Cell(1, i + 1).Value = ozellikler[i].Name; //özelliğin ismini string olarak alır, Buradaki 1 sabit, çünkü 1. satıra (başlıklara) yazıyoruz. i + 1 ise sütun numarasıdır
            }
            sheet.Row(1).Style.Font.Bold = true; //sheet.Row(1): Excel sayfasındaki 1. satırı seçer , .Style.Font.Bold = true: Yazı tipini Kalın yapar.

            // Veri satırları : 2. satırdan itibaren her nesnenin değerlerini yaz 
            int satir = 2; // verileri 2. satırdan yazmaya başlıyoruz 
            foreach (var veri in veriler) //liste içini tek tek ele alır 
            {
                for (int i = 0; i < ozellikler.Length; i++) //onceki adımda bulduğumuz property'lerin üzerinde gezer 
                {
                    //GetValue: bu nesnenin , bu property'sinin Değerini oku
                    object? deger = ozellikler[i].GetValue(veri); //object her türlü veriyi taşıyabilen genel bir kutu olduğu için dönüş tipi object
                    sheet.Cell(satir, i + 1).Value = deger?.ToString() ?? ""; //satir= hangi satırda olduğumuzu, i+1 ise hangi sütunda olduğumuzu ,?? ""-> null ise "" yaz
                }
                satir++; // bir sonraki nesne için
            }

            sheet.Columns().AdjustToContents(); //excel sayfasındaki tüm sütunları tarayıp içindeki en uzun yazıyı bulup sütun genişliğini ayarlar 

            using var stream = new MemoryStream(); //excel'i disk yerine RAM e kaydeder
            workbook.SaveAs(stream); //workbook -> tüm verileri,tabloları,başlıkları EXCEL dosya formatına dönüştürme 
            return stream.ToArray(); //verileri API kolayca göndersin diye byte dizisine çevirir 
        }

        //OKUMA -> Excel dosyasını alıp C# a çevirme 
        public List<T> ExceldenListeOku<T>(Stream dosyaAkisi) where T : new() // dosyayı diskten okumak yerine akıştan okuyup hız kazanma -> stream ; where T : new() -> C#'a T tipi ne olursa olsun o sınıftan nesne üret
        {
            var sonucListesi = new List<T>(); //okunan her satırı buraya ekle

            using var workbook = new XLWorkbook(dosyaAkisi); //excel dosyasını açıyoruz 
            var sheet = workbook.Worksheet(1); //excel'in 1. sekmesini(sayfa) seçiyoruz

            var basliklar = new List<string>(); //başlık isimlerini tutmak için boş bir listeleme defteri 
            var ilkSatir = sheet.Row(1); //excel dosyasının ilk satırını alırız ki veri tabanına hangi sütunlar (property) olucak 
            int sutunSayisi = ilkSatir.CellsUsed().Count(); //CellsUsed - içinde sadece veri olan hücreler 
            for(int i=1; i<= sutunSayisi; i++)
            {
                basliklar.Add(sheet.Cell(1,i).GetString()); //sheet.Cell(1,i) -> 1. satır ve i. sütun , içindeki veriyi string olarak alıyoruz 
            }
            PropertyInfo[] ozellikler = typeof(T).GetProperties(); //T 'nin gerçek  kimliği ve bu bulduğıın sınıf içindeki özellikleri(property) varsa getir

            int sonSatir = sheet.LastRowUsed()!.RowNumber();
            for(int satirNo=2; satirNo <= sonSatir; satirNo++)
            {
                var yeniNesne = new T(); // her bir satır veritabanına tek bir kayıt demek 

                for(int sutunNo= 1; sutunNo <= sutunSayisi; sutunNo++) 
                {
                    string baslikAdi = basliklar[sutunNo - 1];
                    string hucreDegeri = sheet.Cell(satirNo, sutunNo).GetString();

                    var ilgiliOzellik = ozellikler.FirstOrDefault(p => p.Name.Equals(baslikAdi, StringComparison.OrdinalIgnoreCase)); //aynı isme sahip özellik var mı diye bak , OrdinalIgnoreCase-> yazılım farklarını önemseme

                    if (ilgiliOzellik == null || string.IsNullOrEmpty(hucreDegeri)) //veriyle eşleşme yoksa atla 
                        continue;
                    
                    DegeriAta(yeniNesne, ilgiliOzellik, hucreDegeri); //Bulduğumuz hucreDegerini alıp, nesnenin o özelliğine (ilgiliOzellik) yaz
                }

                sonucListesi.Add(yeniNesne); //Satır bitip nesne dolunca, onu devasa sonucListesimize ekliyoruz.
            }
            return sonucListesi;
        }

        private void DegeriAta<T>(T nesne, PropertyInfo ozellik ,string hucreDegeri)
        {
            Type gercekTip = Nullable.GetUnderlyingType(ozellik.PropertyType) ?? ozellik.PropertyType;

            object donusturulmusDeger; // dönüştüreceğimiz yeni veri türünü bilmediğimiz için object tipinde tutuyoruz 

            if (gercekTip == typeof(DateTime))
                donusturulmusDeger = DateTime.Parse(hucreDegeri); //tarihleri dogru şekilde okumak için
            else
                donusturulmusDeger = Convert.ChangeType(hucreDegeri, gercekTip); //tarih değilse gerçek veri tipine dönüştürür

            ozellik.SetValue(nesne, donusturulmusDeger); //hedef nesneye gidip enjekte ediyoruz 
        }

    }
}

