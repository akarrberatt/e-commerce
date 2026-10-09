import { company } from '@/lib/company'

import type { LegalSection } from './types'

export const privacySections: LegalSection[] = [
  {
    title: 'Veri Sorumlusu',
    blocks: [
      {
        type: 'p',
        text: `Kişisel verileriniz, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla ${company.legalName} ("${company.brand}") tarafından işlenmektedir. Adres: ${company.address}. MERSİS No: ${company.mersisNo}. E-posta: ${company.email}.`,
      },
    ],
  },
  {
    title: 'İşlediğimiz Kişisel Veriler',
    blocks: [
      { type: 'p', text: 'Platformu kullanımınıza bağlı olarak aşağıdaki veriler işlenebilir:' },
      {
        type: 'ul',
        items: [
          'Kimlik ve iletişim bilgileri: ad soyad, e-posta adresi.',
          'Hesap ve güvenlik bilgileri: şifreniz (güvenli biçimde, geri döndürülemez şekilde şifrelenmiş olarak), e-posta doğrulama durumu, oturum bilgileri.',
          'Google ile giriş yapmanız halinde: Google tarafından paylaşılan ad ve e-posta bilgileriniz.',
          'İşlem güvenliği bilgileri: IP adresi, tarayıcı ve cihaz bilgisi, işlem kayıtları (log).',
          'Sipariş verdiğinizde: teslimat ve fatura adresi, telefon numarası, sipariş geçmişi. Kart bilgileriniz ödeme kuruluşu tarafından işlenir; tarafımızca saklanmaz.',
        ],
      },
    ],
  },
  {
    title: 'Verilerin İşlenme Amaçları',
    blocks: [
      {
        type: 'ul',
        items: [
          'Üyelik oluşturmak, kimliğinizi doğrulamak ve hesabınızı yönetmek,',
          'E-posta doğrulama ve şifre sıfırlama gibi hesap işlemlerini gerçekleştirmek,',
          'Siparişlerinizi almak, teslim etmek ve satış sonrası destek sağlamak,',
          'Platformun güvenliğini sağlamak, kötüye kullanımı ve dolandırıcılığı önlemek,',
          'Yasal yükümlülüklerimizi yerine getirmek,',
          'Açık rızanız olması halinde kampanya ve tanıtım iletileri göndermek.',
        ],
      },
    ],
  },
  {
    title: 'Hukuki Sebepler',
    blocks: [
      { type: 'p', text: 'Verileriniz KVKK madde 5 kapsamında şu hukuki sebeplere dayanılarak işlenir:' },
      {
        type: 'ul',
        items: [
          'Bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması (üyelik, sipariş),',
          'Hukuki yükümlülüğün yerine getirilmesi,',
          'Temel hak ve özgürlüklerinize zarar vermemek kaydıyla meşru menfaatlerimiz (güvenlik, hizmet kalitesi),',
          'Gerekli olan hallerde açık rızanız (örneğin ticari elektronik ileti).',
        ],
      },
    ],
  },
  {
    title: 'Verilerin Aktarılması',
    blocks: [
      {
        type: 'p',
        text: 'Verileriniz, yukarıdaki amaçlarla sınırlı olarak; barındırma ve altyapı, e-posta gönderimi, ödeme ve kargo hizmeti sağlayıcılarına, Google gibi giriş hizmeti sunan taraflara ve yasal olarak yetkili kamu kurum ve kuruluşlarına aktarılabilir. Hizmet sağlayıcılarımızın sunucularının yurt dışında bulunması halinde aktarım KVKK madde 9 hükümlerine uygun olarak yapılır.',
      },
    ],
  },
  {
    title: 'Saklama Süresi',
    blocks: [
      {
        type: 'p',
        text: 'Verileriniz, işleme amacının gerektirdiği süre boyunca ve ilgili mevzuatta öngörülen saklama süreleri kadar muhafaza edilir. Bu sürelerin sonunda verileriniz silinir, yok edilir veya anonim hale getirilir.',
      },
    ],
  },
  {
    title: 'Çerezler ve Benzeri Teknolojiler',
    blocks: [
      {
        type: 'p',
        text: 'Platform şu anda yalnızca oturumunuzu güvenle sürdürmek için zorunlu bir çerez kullanır. Bu çerez tarayıcınızdaki betikler tarafından okunamaz. Analitik veya pazarlama amaçlı çerezler eklenirse bu politika güncellenir ve gerekli izinler ayrıca alınır.',
      },
    ],
  },
  {
    title: 'Veri Güvenliği',
    blocks: [
      {
        type: 'p',
        text: 'Verilerinizin hukuka aykırı işlenmesini ve yetkisiz erişimi önlemek için makul teknik ve idari tedbirler alıyoruz. Buna rağmen internet üzerinden iletimin tamamen risksiz olmadığını hatırlatırız.',
      },
    ],
  },
  {
    title: 'KVKK Kapsamındaki Haklarınız',
    blocks: [
      { type: 'p', text: 'KVKK madde 11 uyarınca aşağıdaki haklara sahipsiniz:' },
      {
        type: 'ul',
        items: [
          'Kişisel verilerinizin işlenip işlenmediğini öğrenme ve işlenmişse bilgi talep etme,',
          'İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,',
          'Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,',
          'Eksik veya yanlış işlenmişse düzeltilmesini isteme,',
          'Kanunda öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme ve bunun aktarıldığı üçüncü kişilere bildirilmesini talep etme,',
          'İşlenen verilerin otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonuç doğmasına itiraz etme,',
          'Kanuna aykırı işleme nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme.',
        ],
      },
    ],
  },
  {
    title: 'Başvuru Yöntemi',
    blocks: [
      {
        type: 'p',
        text: `Haklarınıza ilişkin taleplerinizi ${company.email} adresine e-posta ile, ${company.kepAddress} KEP adresine veya ${company.address} adresine yazılı olarak iletebilirsiniz. Başvurunuz niteliğine göre en geç otuz gün içinde sonuçlandırılır.`,
      },
    ],
  },
  {
    title: 'Politikada Değişiklik',
    blocks: [
      {
        type: 'p',
        text: 'Bu politikayı gerektiğinde güncelleyebiliriz. Güncel metin Platformda yayımlandığı tarihten itibaren geçerlidir.',
      },
    ],
  },
]
