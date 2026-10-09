import { company } from '@/lib/company'

import type { LegalSection } from './types'

export const termsSections: LegalSection[] = [
  {
    title: 'Taraflar ve Kapsam',
    blocks: [
      {
        type: 'p',
        text: `Bu Kullanım Şartları, ${company.legalName} ("${company.brand}") tarafından işletilen alışveriş platformunu (web sitesi ve ilgili hizmetler, birlikte "Platform") kullanımınızı düzenler. Platforma üye olarak ya da Platformu kullanarak bu şartları okuduğunuzu ve kabul ettiğinizi beyan edersiniz. Şartları kabul etmiyorsanız lütfen Platformu kullanmayın.`,
      },
      {
        type: 'p',
        text: `Platformun işletilmesine ilişkin kişisel verileriniz Gizlilik Politikası'nda açıklandığı şekilde işlenir.`,
      },
    ],
  },
  {
    title: 'Üyelik ve Hesap Güvenliği',
    blocks: [
      {
        type: 'ul',
        items: [
          'Üye olabilmek için 18 yaşını doldurmuş olmanız ve fiil ehliyetine sahip bulunmanız gerekir.',
          'Üyelik sırasında verdiğiniz bilgilerin doğru, güncel ve eksiksiz olmasından siz sorumlusunuz.',
          'Hesabınızı kullanabilmek için e-posta adresinizi doğrulamanız gerekir.',
          'Şifrenizin gizliliğini korumak ve hesabınızla yapılan tüm işlemlerden sorumlu olmak size aittir. Hesabınızın yetkisiz kullanıldığını fark ederseniz gecikmeden bize bildirmelisiniz.',
          'Google hesabınızla giriş yapmanız halinde, Google tarafından paylaşılan ad ve e-posta bilgileriniz hesabınızı oluşturmak ve yönetmek için kullanılır.',
        ],
      },
      {
        type: 'p',
        text: `${company.brand}, bu şartlara veya mevzuata aykırı kullanım tespit etmesi halinde hesabı askıya alma veya sonlandırma hakkını saklı tutar.`,
      },
    ],
  },
  {
    title: 'Platformun Kullanımı',
    blocks: [
      { type: 'p', text: 'Platformu kullanırken aşağıdaki davranışlarda bulunmamayı kabul edersiniz:' },
      {
        type: 'ul',
        items: [
          'Hukuka, genel ahlaka veya üçüncü kişilerin haklarına aykırı amaçlarla kullanmak,',
          'Başkası adına hesap açmak veya başkasının hesabına izinsiz erişmeye çalışmak,',
          'Platformun işleyişini bozacak, aşırı yük bindirecek veya güvenliğini tehlikeye atacak girişimlerde bulunmak,',
          'Otomatik araçlarla (bot, tarayıcı vb.) izinsiz veri toplamak,',
          'Yanıltıcı, sahte veya hakaret içeren içerik paylaşmak.',
        ],
      },
    ],
  },
  {
    title: 'Ürünler, Fiyatlar ve Siparişler',
    blocks: [
      {
        type: 'p',
        text: 'Platformda yer alan ürün bilgileri, görseller ve fiyatlar bilgilendirme amaçlıdır ve değiştirilebilir. Açıkça hatalı fiyat, stok veya ürün bilgisi nedeniyle verilen siparişleri iptal etme hakkımız saklıdır; bu durumda ödediğiniz tutar iade edilir.',
      },
      {
        type: 'p',
        text: 'Siparişlere, ödemeye, teslimata, cayma hakkına ve iade koşullarına ilişkin esaslar; 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca sipariş sırasında size sunulacak Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi\'nde belirtilir. Tüketici olarak kanundan doğan haklarınız bu şartlardan etkilenmez.',
      },
    ],
  },
  {
    title: 'Fikri Mülkiyet',
    blocks: [
      {
        type: 'p',
        text: `Platformdaki yazılım, tasarım, logo, marka, metin ve görseller ${company.legalName} veya lisans verenlerine aittir ve fikri mülkiyet mevzuatıyla korunur. Önceden yazılı izin almadan kopyalanamaz, çoğaltılamaz, dağıtılamaz veya ticari amaçla kullanılamaz.`,
      },
    ],
  },
  {
    title: 'Kullanıcı İçerikleri',
    blocks: [
      {
        type: 'p',
        text: `Platformda yorum, değerlendirme gibi içerikler paylaşmanız halinde, bu içeriklerin hukuka uygunluğundan siz sorumlusunuz. ${company.brand}, bu içerikleri Platformda yayımlama, düzenleme ve hukuka veya bu şartlara aykırı olanları kaldırma hakkına sahiptir.`,
      },
    ],
  },
  {
    title: 'Üçüncü Taraf Hizmetler',
    blocks: [
      {
        type: 'p',
        text: 'Platform; kimlik doğrulama (örneğin Google ile giriş), ödeme, kargo ve e-posta gönderimi gibi konularda üçüncü taraf hizmetlerden yararlanabilir. Bu hizmetlerin kullanımı ilgili üçüncü tarafların kendi şart ve politikalarına tabidir.',
      },
    ],
  },
  {
    title: 'Sorumluluğun Sınırlandırılması',
    blocks: [
      {
        type: 'p',
        text: `Platformun kesintisiz veya hatasız çalışacağı garanti edilmez. Bakım, güncelleme veya mücbir sebepler nedeniyle hizmette aksamalar yaşanabilir. ${company.brand}, kanunen sorumluluğun sınırlandırılamadığı haller ve tüketici haklarınız saklı kalmak üzere, Platformun kullanımından doğabilecek dolaylı zararlardan sorumlu değildir.`,
      },
    ],
  },
  {
    title: 'Şartlarda Değişiklik',
    blocks: [
      {
        type: 'p',
        text: 'Bu şartları zaman zaman güncelleyebiliriz. Güncel metin Platformda yayımlandığı tarihten itibaren geçerli olur. Önemli değişiklikleri uygun yöntemlerle size duyurmaya çalışırız. Güncellemeden sonra Platformu kullanmaya devam etmeniz, yeni şartları kabul ettiğiniz anlamına gelir.',
      },
    ],
  },
  {
    title: 'Uygulanacak Hukuk ve Uyuşmazlıkların Çözümü',
    blocks: [
      {
        type: 'p',
        text: `Bu şartlar Türk hukukuna tabidir. Tüketici sıfatıyla yaşanan uyuşmazlıklarda, kanunda belirlenen parasal sınırlar dahilinde Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir. Diğer uyuşmazlıklarda ${company.jurisdictionCity} Mahkemeleri ve İcra Daireleri yetkilidir.`,
      },
    ],
  },
  {
    title: 'İletişim',
    blocks: [
      {
        type: 'p',
        text: `Bu şartlara ilişkin sorularınız için bize ${company.email} adresinden veya ${company.address} adresinden ulaşabilirsiniz.`,
      },
    ],
  },
]
