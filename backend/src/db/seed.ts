/**
 * Geliştirme verisi: kategoriler, markalar, ürünler, sahte yorumcular ve yorumlar. İdempotent — slug /
 * e-posta üzerinden upsert yapar, tekrar çalıştırınca kopya oluşturmaz. Kullanım: npm run db:seed
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { isProd } from "../config/env.js";
import { PUBLIC_DIR } from "../config/paths.js";
import { tlToKurus } from "../lib/money.js";
import { pool, withTransaction } from "./pool.js";

interface SeedCategory {
  name: string;
  slug: string;
  children: { name: string; slug: string }[];
}

interface SeedProduct {
  category: string; // alt kategori slug'ı
  name: string;
  brand?: string;
  price: number; // TL
  oldPrice?: number; // TL
  stock: number;
  /**
   * Görsel yolları: "/static/..." (backend/public altı) veya tam "http(s)://" URL.
   * Verilmezse public/products/<slug>.jpg, <slug>-2.jpg, <slug>-3.jpg aranır; yoksa ürün görselsizdir.
   */
  images?: string[];
  description: string;
  active?: boolean;
}

const categories: SeedCategory[] = [
  {
    name: "Elektronik",
    slug: "elektronik",
    children: [
      { name: "Telefon", slug: "telefon" },
      { name: "Bilgisayar", slug: "bilgisayar" },
      { name: "Kulaklık", slug: "kulaklik" },
    ],
  },
  {
    name: "Giyim",
    slug: "giyim",
    children: [
      { name: "Kadın", slug: "kadin-giyim" },
      { name: "Erkek", slug: "erkek-giyim" },
      { name: "Ayakkabı", slug: "ayakkabi" },
    ],
  },
  {
    name: "Ev & Yaşam",
    slug: "ev-yasam",
    children: [
      { name: "Mutfak", slug: "mutfak" },
      { name: "Dekorasyon", slug: "dekorasyon" },
    ],
  },
  {
    name: "Spor",
    slug: "spor",
    children: [
      { name: "Fitness", slug: "fitness" },
      { name: "Outdoor", slug: "outdoor" },
    ],
  },
  {
    name: "Kozmetik & Bakım",
    slug: "kozmetik-bakim",
    children: [
      { name: "Cilt Bakımı", slug: "cilt-bakimi" },
      { name: "Makyaj", slug: "makyaj" },
    ],
  },
  {
    name: "Kitap & Hobi",
    slug: "kitap-hobi",
    children: [
      { name: "Kitap", slug: "kitap" },
      { name: "Kırtasiye", slug: "kirtasiye" },
    ],
  },
  {
    name: "Anne & Bebek",
    slug: "anne-bebek",
    children: [
      { name: "Bebek Bakım", slug: "bebek-bakim" },
      { name: "Oyuncak", slug: "oyuncak" },
    ],
  },
  {
    name: "Otomotiv",
    slug: "otomotiv",
    children: [
      { name: "Araç Aksesuarı", slug: "arac-aksesuari" },
      { name: "Araç Bakım", slug: "arac-bakim" },
    ],
  },
];

// Markalar uydurmadır. Listedeki sıra "en yeni" sıralamasını belirler (ilk ürün en yeni).
const products: SeedProduct[] = [
  // Elektronik > Telefon
  {
    category: "telefon", name: "Novabit X5 Akıllı Telefon 128 GB", brand: "Novabit",
    price: 18999.9, oldPrice: 21999, stock: 24,
    description: "6,5 inç AMOLED ekran, 50 MP ana kamera ve 5000 mAh batarya. Gün boyu kullanım için hızlı şarj desteği sunar.",
  },
  {
    category: "telefon", name: "Novabit X5 Pro Akıllı Telefon 256 GB", brand: "Novabit",
    price: 27499, stock: 8,
    description: "120 Hz yenileme hızına sahip ekranı ve optik sabitlemeli üçlü kamerasıyla serinin en güçlü modeli.",
  },
  {
    category: "telefon", name: "Tekvia Lite 4G Akıllı Telefon 64 GB", brand: "Tekvia",
    price: 6499.9, oldPrice: 7999.9, stock: 0,
    description: "Günlük kullanım için uygun fiyatlı, çift SIM destekli ve uzun pil ömürlü giriş seviyesi telefon.",
  },
  {
    category: "telefon", name: "Tekvia Hızlı Şarj Adaptörü 33W", brand: "Tekvia",
    price: 349.9, stock: 150,
    description: "USB-C çıkışlı, aşırı ısınma ve aşırı akım korumalı 33W hızlı şarj adaptörü.",
  },

  // Elektronik > Bilgisayar
  {
    category: "bilgisayar", name: "Pikselon Air 14 Dizüstü Bilgisayar 16 GB RAM 512 GB SSD", brand: "Pikselon",
    price: 32999, oldPrice: 36999, stock: 12,
    description: "1,3 kg ağırlığında metal kasa, 14 inç IPS ekran ve 12 saate kadar pil ömrü. Ofis ve okul için ideal.",
  },
  {
    category: "bilgisayar", name: "Pikselon Oyun Bilgisayarı 15.6 inç 32 GB RAM", brand: "Pikselon",
    price: 54999, stock: 5,
    description: "144 Hz ekran, harici ekran kartı ve gelişmiş soğutma sistemiyle yüksek ayarlarda akıcı oyun deneyimi.",
  },
  {
    category: "bilgisayar", name: "Tekvia Kablosuz Mouse", brand: "Tekvia",
    price: 289.9, oldPrice: 399.9, stock: 200,
    description: "Sessiz tuşlu, 1600 DPI optik sensörlü ve tek pille 12 aya kadar kullanım sunan kablosuz mouse.",
  },
  {
    category: "bilgisayar", name: "Pikselon Mekanik Klavye Türkçe Q", brand: "Pikselon",
    price: 1299.9, oldPrice: 1599.9, stock: 37,
    description: "Kırmızı switch'li, RGB aydınlatmalı ve sökülebilir kablolu Türkçe Q mekanik klavye.",
  },

  // Elektronik > Kulaklık
  {
    category: "kulaklik", name: "Sesval Bluetooth Kulak İçi Kulaklık", brand: "Sesval",
    price: 899.9, oldPrice: 1199.9, stock: 60,
    description: "Şarj kutusuyla 28 saate varan kullanım, dokunmatik kontrol ve suya dayanıklı gövde.",
  },
  {
    category: "kulaklik", name: "Sesval Gürültü Önleyici Kulak Üstü Kulaklık", brand: "Sesval",
    price: 3499, stock: 18,
    description: "Aktif gürültü önleme, yumuşak kulak yastıkları ve katlanabilir tasarım. Uzun yolculuklar için tasarlandı.",
  },
  {
    category: "kulaklik", name: "Sesval Kablolu Oyuncu Kulaklığı", brand: "Sesval",
    price: 649.9, stock: 0,
    description: "Esnek mikrofonlu, 7.1 sanal surround destekli ve hafif gövdeli oyuncu kulaklığı.",
  },

  // Giyim > Kadın
  {
    category: "kadin-giyim", name: "Moda Lale Keten Gömlek Elbise", brand: "Moda Lale",
    price: 799.9, oldPrice: 1099.9, stock: 40,
    description: "Keten karışımlı kumaştan, kuşaklı ve midi boy gömlek elbise. Yaz ayları için serin tutar.",
  },
  {
    category: "kadin-giyim", name: "Moda Lale Yüksek Bel Mom Jean", brand: "Moda Lale",
    price: 649.9, stock: 55,
    description: "Yüksek bel, rahat kalıp ve bilekte biten paça. %100 pamuklu denim kumaş.",
  },
  {
    category: "kadin-giyim", name: "Moda Lale Oversize Triko Kazak", brand: "Moda Lale",
    price: 549.9, oldPrice: 749.9, stock: 30,
    description: "Yumuşak dokulu, düşük omuzlu ve bisiklet yaka oversize triko kazak.",
  },
  {
    category: "kadin-giyim", name: "Moda Lale Trençkot", brand: "Moda Lale",
    price: 1899.9, stock: 9,
    description: "Su itici kumaştan, kruvaze yakalı ve kemerli klasik kesim trençkot.",
  },

  // Giyim > Erkek
  {
    category: "erkek-giyim", name: "Kuzeyhan Slim Fit Oxford Gömlek", brand: "Kuzeyhan",
    price: 459.9, oldPrice: 599.9, stock: 80,
    description: "Pamuklu oxford kumaş, düğmeli yaka ve dar kesim. Ofiste ve günlük kullanımda rahat.",
  },
  {
    category: "erkek-giyim", name: "Kuzeyhan Chino Pantolon", brand: "Kuzeyhan",
    price: 599.9, stock: 65,
    description: "Esnek gabardin kumaştan, yan cepli ve normal bel chino pantolon.",
  },
  {
    category: "erkek-giyim", name: "Kuzeyhan Kapüşonlu Sweatshirt", brand: "Kuzeyhan",
    price: 499.9, oldPrice: 699.9, stock: 0,
    description: "İçi şardonlu, kanguru cepli ve kapüşonlu basic sweatshirt.",
  },
  {
    category: "erkek-giyim", name: "Kuzeyhan Şişme Mont", brand: "Kuzeyhan",
    price: 2199.9, oldPrice: 2999.9, stock: 14,
    description: "Rüzgar geçirmez dış yüzey, elyaf dolgu ve çıkarılabilir kapüşon. Soğuk havalar için hafif mont.",
  },

  // Giyim > Ayakkabı
  {
    category: "ayakkabi", name: "Adımsa Hafif Koşu Ayakkabısı", brand: "Adımsa",
    price: 1899.9, oldPrice: 2399.9, stock: 42,
    description: "Nefes alan file üst yüzey ve darbe emici EVA taban. Günlük koşu ve yürüyüşler için hafif spor ayakkabı.",
  },
  {
    category: "ayakkabi", name: "Adımsa Günlük Beyaz Spor Ayakkabı", brand: "Adımsa",
    price: 1499.9, stock: 60,
    description: "Suni deri üst yüzey, yastıklı iç taban ve kaymaz kauçuk dış taban. Her kombine uyan beyaz sneaker.",
  },
  {
    category: "ayakkabi", name: "Kuzeyhan Su Geçirmez Deri Bot", brand: "Kuzeyhan",
    price: 3299.9, oldPrice: 3999.9, stock: 15,
    description: "Hakiki deri, su geçirmez membran ve içi termal astarlı bağcıklı bot. Dişli tabanı ıslak zeminde kaymayı önler.",
  },
  {
    category: "ayakkabi", name: "Moda Lale Çapraz Bantlı Deri Sandalet", brand: "Moda Lale",
    price: 899.9, stock: 28,
    description: "Hakiki deri çapraz bantlar ve anatomik mantar taban. Bilekten tokalı, gün boyu rahat yazlık sandalet.",
  },

  // Ev & Yaşam > Mutfak
  {
    category: "mutfak", name: "Mutfakça 7 Parça Granit Tencere Seti", brand: "Mutfakça",
    price: 2499.9, oldPrice: 3299.9, stock: 22,
    description: "Yapışmaz granit kaplama, ısıya dayanıklı kulplar ve cam kapaklar. Tüm ocak tiplerine uygundur.",
  },
  {
    category: "mutfak", name: "Mutfakça Cam Demlikli Çay Makinesi", brand: "Mutfakça",
    price: 1399.9, stock: 31,
    description: "1,7 litre su ısıtıcı, 1 litre cam demlik ve sıcak tutma özelliği.",
  },
  {
    category: "mutfak", name: "Mutfakça Bambu Kesme Tahtası 3'lü Set", brand: "Mutfakça",
    price: 329.9, stock: 120,
    description: "Üç farklı boyda, doğal bambudan üretilmiş ve askı delikli kesme tahtası seti.",
  },
  {
    category: "mutfak", name: "Mutfakça 12 Kişilik Porselen Yemek Takımı", brand: "Mutfakça",
    price: 3999, oldPrice: 4999, stock: 6,
    description: "56 parça, bulaşık makinesinde yıkanabilir ve altın yaldız detaylı porselen yemek takımı.",
  },

  // Ev & Yaşam > Dekorasyon
  {
    category: "dekorasyon", name: "Dekoriva El Dokuması Kilim 120x180", brand: "Dekoriva",
    price: 1749.9, oldPrice: 2199.9, stock: 11,
    description: "Pamuk iplikten el dokuması, çift taraflı kullanılabilen geometrik desenli kilim.",
  },
  {
    category: "dekorasyon", name: "Dekoriva Ahşap Ayaklı Lambader", brand: "Dekoriva",
    price: 1099.9, stock: 19,
    description: "Üç ayaklı doğal ahşap gövde ve keten başlık. Salon ve okuma köşeleri için yumuşak ışık sağlar.",
  },
  {
    category: "dekorasyon", name: "Dekoriva 3'lü Seramik Vazo Seti", brand: "Dekoriva",
    price: 449.9, oldPrice: 599.9, stock: 48,
    description: "Mat yüzeyli, farklı boylarda üç parçadan oluşan el yapımı seramik vazo seti.",
  },

  // Spor > Fitness
  {
    category: "fitness", name: "Formda 8 mm Kaymaz Yoga Matı", brand: "Formda",
    price: 399.9, oldPrice: 549.9, stock: 90,
    description: "8 mm kalınlık, kaymaz yüzey ve taşıma askısı. Yoga, pilates ve esneme hareketleri için.",
  },
  {
    category: "fitness", name: "Formda Ayarlanabilir Dambıl Seti 20 kg", brand: "Formda",
    price: 1899.9, stock: 16,
    description: "Sökülüp takılabilen plakalarla 2,5 kg'dan 20 kg'a kadar ayarlanabilen dambıl seti.",
  },
  {
    category: "fitness", name: "Formda Direnç Bandı 5'li Set", brand: "Formda",
    price: 249.9, oldPrice: 349.9, stock: 140,
    description: "Beş farklı direnç seviyesinde lateks bant ve taşıma çantası.",
  },
  {
    category: "fitness", name: "Formda Atlama İpi", brand: "Formda",
    price: 99.9, stock: 300,
    description: "Boyu ayarlanabilir çelik tel ve rulmanlı tutma saplarına sahip hız ipi.",
  },

  // Spor > Outdoor
  {
    category: "outdoor", name: "Zirve Yolu 2 Kişilik Kamp Çadırı", brand: "Zirve Yolu",
    price: 2799.9, oldPrice: 3499.9, stock: 13,
    description: "Çift katmanlı, 3000 mm su geçirmezlik değerine sahip ve 5 dakikada kurulabilen kamp çadırı.",
  },
  {
    category: "outdoor", name: "Zirve Yolu 45 Litre Trekking Sırt Çantası", brand: "Zirve Yolu",
    price: 1599.9, stock: 27,
    description: "Havalandırmalı sırt sistemi, yağmurluk kılıfı ve bel destekli 45 litre trekking çantası.",
  },
  {
    category: "outdoor", name: "Zirve Yolu Eksi 5 Derece Uyku Tulumu", brand: "Zirve Yolu",
    price: 1249.9, oldPrice: 1499.9, stock: 0,
    description: "-5°C konfor sıcaklığına sahip, mumya tipi ve sıkıştırma torbalı uyku tulumu.",
  },
  {
    category: "outdoor", name: "Zirve Yolu Paslanmaz Çelik Termos 1 L", brand: "Zirve Yolu",
    price: 579.9, stock: 75,
    description: "Çift cidarlı vakum yalıtım: içecekleri 24 saat sıcak, 36 saat soğuk tutar.",
  },

  // Yeni kategoriler
  {
    category: "cilt-bakimi", name: "Lumera Nemlendirici Yüz Kremi 50 ml", brand: "Lumera",
    price: 249.9, oldPrice: 329.9, stock: 120,
    description: "Hyaluronik asit içeren, hafif dokulu ve günlük kullanıma uygun nemlendirici yüz kremi.",
  },
  {
    category: "cilt-bakimi", name: "Lumera Temizleme Jeli 200 ml", brand: "Lumera",
    price: 179.9, stock: 90,
    description: "Cildi kurutmadan makyaj ve kiri arındıran, tüm cilt tipleri için nazik temizleme jeli.",
  },
  {
    category: "makyaj", name: "Renkar Mat Ruj Nude", brand: "Renkar",
    price: 199.9, oldPrice: 259.9, stock: 75,
    description: "Uzun süre kalıcı, kuruluk hissi bırakmayan mat bitişli ruj.",
  },
  {
    category: "makyaj", name: "Renkar Hacim Veren Maskara", brand: "Renkar",
    price: 229.9, stock: 64,
    description: "Kirpiklere hacim ve uzunluk veren, topaklanmayan suya dayanıklı maskara.",
  },
  {
    category: "kitap", name: "Sessiz Şehir - Roman", brand: "Yaprak Yayınları",
    price: 129.9, oldPrice: 159.9, stock: 200,
    description: "Küçük bir kasabada geçen, aile sırlarını ve hesaplaşmaları anlatan akıcı bir roman.",
  },
  {
    category: "kitap", name: "Adım Adım Yazılım Öğreniyorum", brand: "Yaprak Yayınları",
    price: 219.9, stock: 85,
    description: "Temel kavramlardan küçük projelere uzanan, yeni başlayanlar için uygulamalı bir yazılım rehberi.",
  },
  {
    category: "kirtasiye", name: "Notal Çizgili Defter A5 3'lü Set", brand: "Notal",
    price: 149.9, oldPrice: 189.9, stock: 300,
    description: "Sert kapaklı, 96 yapraklı, dikişli ciltli A5 çizgili defter seti.",
  },
  {
    category: "kirtasiye", name: "Notal Jel Kalem 12'li Renkli Set", brand: "Notal",
    price: 119.9, stock: 220,
    description: "Akıcı mürekkepli, 0,5 mm uçlu 12 renk jel kalem seti.",
  },
  {
    category: "bebek-bakim", name: "Minik Adım Islak Mendil 12'li Paket", brand: "Minik Adım",
    price: 199.9, oldPrice: 239.9, stock: 180,
    description: "Alkolsüz, parfümsüz ve cilt dostu bebek ıslak mendili, 12'li ekonomik paket.",
  },
  {
    category: "bebek-bakim", name: "Minik Adım Bebek Şampuanı 400 ml", brand: "Minik Adım",
    price: 89.9, stock: 140,
    description: "Gözü yakmayan formülü ile yumuşak temizlik sağlayan bebek şampuanı.",
  },
  {
    category: "oyuncak", name: "Oyunevi Ahşap Blok Seti 100 Parça", brand: "Oyunevi",
    price: 449.9, oldPrice: 549.9, stock: 55,
    description: "Hayal gücünü ve el becerisini destekleyen, boyalı 100 parça ahşap yapı blokları.",
  },
  {
    category: "oyuncak", name: "Oyunevi Uzaktan Kumandalı Araba", brand: "Oyunevi",
    price: 649.9, stock: 30,
    description: "Şarj edilebilir bataryalı, 2,4 GHz kumandalı ve darbeye dayanıklı oyuncak araba.",
  },
  {
    category: "arac-aksesuari", name: "Yolcu Araç İçi Telefon Tutucu", brand: "Yolcu",
    price: 199.9, oldPrice: 249.9, stock: 160,
    description: "Havalandırmaya takılan, 360 derece dönebilen ve tek elle kullanılabilen telefon tutucu.",
  },
  {
    category: "arac-aksesuari", name: "Yolcu Oto Koltuk Kılıfı Seti", brand: "Yolcu",
    price: 1299.9, stock: 22,
    description: "Ön ve arka koltuklara uyumlu, kolay temizlenen deri görünümlü kılıf seti.",
  },
  {
    category: "arac-bakim", name: "Parlak Oto Şampuanı 1 L", brand: "Parlak",
    price: 169.9, oldPrice: 219.9, stock: 95,
    description: "Boyaya zarar vermeden kir ve yağı çözen, köpüren konsantre oto şampuanı.",
  },
  {
    category: "arac-bakim", name: "Parlak Mikrofiber Temizlik Bezi 6'lı", brand: "Parlak",
    price: 129.9, stock: 260,
    description: "Çizmeyen, yüksek emiciliğe sahip 6'lı mikrofiber bez seti.",
  },

  // Pasif ürün: listede ve detayda görünmemeli.
  {
    category: "telefon", name: "Tekvia Eski Model Tablet 7 inç", brand: "Tekvia",
    price: 2999, stock: 0, active: false,
    description: "Üretimi sona eren 7 inç ekranlı tablet.",
  },
];

// Frontend'in sabit bağlantı verdiği kategori slug'ları (bkz. CLAUDE.md). Seed bunların varlığını denetler.
const FIXED_CATEGORY_SLUGS = [
  "giyim", "erkek-giyim", "telefon", "bilgisayar", "kulaklik",
  "makyaj", "kitap", "ev-yasam", "spor", "ayakkabi",
];

// Sahte yorumcular: yorumcu1@example.com ... yorumcu80@example.com (isimler uydurmadır).
// Şifreleri yoktur ve e-postaları doğrulanmamıştır; giriş yapamazlar.
const REVIEWER_COUNT = 80;
const reviewerFirstNames = [
  "Ayşe", "Mehmet", "Zeynep", "Mustafa", "Elif", "Emre", "Fatma", "Burak", "Selin", "Ahmet",
  "Derya", "Can", "Gizem", "Hakan", "İrem", "Kerem", "Merve", "Onur", "Pınar", "Serkan",
];
const reviewerLastNames = [
  "Yılmaz", "Demir", "Kaya", "Çelik", "Şahin", "Öztürk", "Aydın", "Arslan", "Doğan", "Kılıç",
  "Aslan", "Çetin", "Koç", "Kurt", "Özdemir", "Şimşek", "Polat", "Güneş", "Erdoğan", "Yıldız",
];
// Ad ve soyad listeleri kaydırılarak eşlenir: 80 farklı ad soyad çıkar.
const reviewerName = (i: number) =>
  `${reviewerFirstNames[i % 20]} ${reviewerLastNames[(i + Math.floor(i / 20) * 5) % 20]}`;

// Aktif ürünlere sırayla (dönerek) uygulanır. count: yorum sayısı; weights: 1–5 puanların ağırlığı.
// Geniş dağılım: 50+ yorumlu, yüksek/karışık puanlı, 1–3 yorumlu ve yorumsuz ürünler.
interface ReviewPlan {
  count: number;
  weights: [number, number, number, number, number];
}
const reviewPlans: ReviewPlan[] = [
  { count: 58, weights: [0, 1, 3, 16, 38] },
  { count: 24, weights: [1, 2, 5, 9, 7] },
  { count: 52, weights: [1, 2, 6, 20, 23] },
  { count: 3, weights: [0, 0, 1, 1, 1] },
  { count: 41, weights: [6, 8, 10, 10, 7] },
  { count: 0, weights: [0, 0, 0, 0, 1] },
  { count: 55, weights: [0, 0, 3, 14, 38] },
  { count: 12, weights: [2, 3, 4, 2, 1] },
  { count: 33, weights: [0, 1, 5, 13, 14] },
  { count: 1, weights: [0, 0, 0, 0, 1] }, // tek yorumlu, 5 puanlı
  { count: 60, weights: [3, 5, 10, 20, 22] },
  { count: 7, weights: [0, 1, 2, 2, 2] },
  { count: 50, weights: [0, 1, 4, 18, 27] },
  { count: 18, weights: [1, 1, 3, 7, 6] },
  { count: 0, weights: [0, 0, 0, 0, 1] },
  { count: 2, weights: [0, 0, 0, 1, 1] },
  { count: 46, weights: [2, 3, 8, 17, 16] },
  { count: 54, weights: [1, 1, 4, 16, 32] },
];
const MAX_REVIEWS_PER_PRODUCT = 60;
// Bir ürünün yorumcuları başlangıç + adım ile seçilir; adımlar 80 ile aralarında asal olduğundan tekrar etmez.
const REVIEWER_STRIDES = [7, 11, 13, 17, 19, 23, 27, 29];
// Yalnızca puan verip yorum yazmayanların oranı.
const EMPTY_COMMENT_RATIO = 0.25;

const reviewComments: Record<number, string[]> = {
  1: [
    "Hiç memnun kalmadım, iade ettim.",
    "İki hafta dolmadan bozuldu. Tavsiye etmiyorum.",
    "Görseldeki ürünle alakası yok, kalitesi çok kötü.",
    "Paradan tasarruf edeyim derken param çöpe gitti.",
    "Kusurlu geldi, satıcıya ulaşmak da ayrı dert oldu.",
  ],
  2: [
    "Beklediğim gibi çıkmadı, fiyatına göre kalitesi zayıf.",
    "Kargo çok geç geldi, paketleme de özensizdi.",
    "İdare eder ama bir daha almam.",
    "Açıklamada yazanlarla gelen ürün pek uyuşmuyor.",
    "Birkaç kullanımda yıprandı, uzun ömürlü değil.",
  ],
  3: [
    "Fena değil, fiyatına göre idare eder.",
    "Ortalama bir ürün, ne iyi ne kötü.",
    "İşimi görüyor ama malzeme kalitesi daha iyi olabilirdi.",
    "Kargo hızlıydı, ürün vasat.",
    "Beklentiyi yüksek tutmamak lazım, kararında bir ürün.",
    "İndirimde alınırsa mantıklı, tam fiyatına değmez.",
  ],
  4: [
    "Gayet iyi, memnunum. Kargo biraz gecikti sadece.",
    "Kaliteli bir ürün, fiyatı biraz daha uygun olabilirdi.",
    "Beklentimi karşıladı, tavsiye ederim.",
    "Güzel ürün, paketleme özenliydi.",
    "Bir aydır kullanıyorum, şimdilik sorun yok.",
    "Görseldekiyle aynı geldi, işçiliği temiz.",
    "Ufak tefek eksikleri var ama genel olarak başarılı.",
  ],
  5: [
    "Harika bir ürün, kesinlikle tavsiye ederim.",
    "Fiyat performans açısından çok başarılı.",
    "Tam beklediğim gibi geldi, çok memnun kaldım.",
    "Hızlı kargo, sağlam paketleme. Teşekkürler.",
    "İkinci kez alıyorum, kalitesinden şaşmıyor.",
    "Hediye olarak aldım, çok beğenildi.",
    "Uzun süredir aradığım kalitede, gönül rahatlığıyla alabilirsiniz.",
    "Malzemesi çok kaliteli, fiyatını fazlasıyla hak ediyor.",
  ],
};

/** Tohumlu sözde rastgele sayı üreteci (mulberry32): aynı tohum her çalıştırmada aynı diziyi verir. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface SeedReview {
  reviewer: number; // yorumcu sırası (0 tabanlı)
  rating: number;
  comment: string;
  daysAgo: number;
  hoursAgo: number;
}

/** Aktif ürünün sırasına göre yorumlarını üretir. Rastgelelik sıradan tohumlanır: sonuç her çalıştırmada aynıdır. */
function buildReviews(index: number): SeedReview[] {
  const plan = reviewPlans[index % reviewPlans.length]!;
  const cycle = Math.floor(index / reviewPlans.length);
  // Aynı plan tekrar geldiğinde sayılar birebir aynı olmasın; 1–3 yorumlu ve yorumsuz planlar korunur.
  const count = plan.count < 4 ? plan.count : Math.min(MAX_REVIEWS_PER_PRODUCT, plan.count + ((cycle * 3) % 5));

  const random = seededRandom(index + 1);
  const pick = (max: number) => Math.floor(random() * max);
  const totalWeight = plan.weights.reduce((sum, weight) => sum + weight, 0);
  const start = pick(REVIEWER_COUNT);
  const stride = REVIEWER_STRIDES[pick(REVIEWER_STRIDES.length)]!;

  const reviews: SeedReview[] = [];
  for (let k = 0; k < count; k++) {
    let roll = random() * totalWeight;
    let rating = 5;
    for (const [star, weight] of plan.weights.entries()) {
      roll -= weight;
      if (roll < 0) {
        rating = star + 1;
        break;
      }
    }
    const comments = reviewComments[rating]!;
    reviews.push({
      reviewer: (start + k * stride) % REVIEWER_COUNT,
      rating,
      comment: random() < EMPTY_COMMENT_RATIO ? "" : comments[pick(comments.length)]!,
      daysAgo: pick(180), // created_at son 6 aya dağılır
      hoursAgo: pick(24),
    });
  }
  return reviews;
}

const TR_CHARS: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };

function slugify(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşü]/g, (ch) => TR_CHARS[ch] ?? ch)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Ürünün görsel yolları. images verilmişse o kullanılır; verilmemişse public/products altında
 * <slug>.jpg, <slug>-2.jpg, <slug>-3.jpg aranır. Hiçbiri yoksa ürünün görseli olmaz.
 */
function resolveImages(product: SeedProduct, slug: string): string[] {
  if (product.images) return product.images;
  return [`${slug}.jpg`, `${slug}-2.jpg`, `${slug}-3.jpg`]
    .filter((file) => existsSync(path.join(PUBLIC_DIR, "products", file)))
    .map((file) => `/static/products/${file}`);
}

async function main() {
  if (isProd) {
    throw new Error("Seed production ortamında çalıştırılamaz (NODE_ENV=production).");
  }

  const seedSlugs = new Set(categories.flatMap((parent) => [parent.slug, ...parent.children.map((c) => c.slug)]));
  const missingSlugs = FIXED_CATEGORY_SLUGS.filter((slug) => !seedSlugs.has(slug));
  if (missingSlugs.length) {
    console.warn(`UYARI: Frontend'in sabit bağlantı verdiği kategori slug'ları seed'de yok: ${missingSlugs.join(", ")}`);
  }

  await withTransaction(async (db) => {
    const upsertCategory = async (name: string, slug: string, parentId: string | null, sortOrder: number) => {
      const { rows } = await db.query<{ id: string }>(
        `INSERT INTO categories (name, slug, parent_id, sort_order) VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE
           SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order
         RETURNING id`,
        [name, slug, parentId, sortOrder],
      );
      return rows[0]!.id;
    };

    const categoryIds = new Map<string, string>();
    for (const [i, parent] of categories.entries()) {
      const parentId = await upsertCategory(parent.name, parent.slug, null, i);
      for (const [j, child] of parent.children.entries()) {
        categoryIds.set(child.slug, await upsertCategory(child.name, child.slug, parentId, j));
      }
    }

    // Markalar: slug adından üretilir, slug üzerinden upsert edilir.
    const brandIds = new Map<string, string>();
    for (const name of new Set(products.flatMap((product) => (product.brand ? [product.brand] : [])))) {
      const { rows } = await db.query<{ id: string }>(
        `INSERT INTO brands (name, slug) VALUES ($1, $2)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [name, slugify(name)],
      );
      brandIds.set(name, rows[0]!.id);
    }

    const activeProductIds: string[] = [];
    for (const [i, product] of products.entries()) {
      const categoryId = categoryIds.get(product.category);
      if (!categoryId) throw new Error(`Bilinmeyen kategori: ${product.category}`);
      const slug = slugify(product.name);

      // created_at yalnızca ilk eklemede yazılır: sıra birer saat arayla geriye gider.
      const { rows } = await db.query<{ id: string }>(
        `INSERT INTO products
           (category_id, slug, name, description, brand_id, price_kurus, compare_at_price_kurus,
            stock, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now() - make_interval(hours => $10))
         ON CONFLICT (slug) DO UPDATE
           SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, description = EXCLUDED.description,
               brand_id = EXCLUDED.brand_id, price_kurus = EXCLUDED.price_kurus,
               compare_at_price_kurus = EXCLUDED.compare_at_price_kurus, stock = EXCLUDED.stock,
               is_active = EXCLUDED.is_active, updated_at = now()
         RETURNING id`,
        [
          categoryId,
          slug,
          product.name,
          product.description,
          product.brand ? brandIds.get(product.brand) : null,
          tlToKurus(product.price),
          product.oldPrice === undefined ? null : tlToKurus(product.oldPrice),
          product.stock,
          product.active ?? true,
          i,
        ],
      );
      const productId = rows[0]!.id;

      // Görseller her çalıştırmada baştan hesaplanır (eski kayıtlar silinir).
      await db.query("DELETE FROM product_images WHERE product_id = $1", [productId]);
      for (const [n, url] of resolveImages(product, slug).entries()) {
        await db.query("INSERT INTO product_images (product_id, url, alt, sort_order) VALUES ($1, $2, $3, $4)", [
          productId,
          url,
          `${product.name} - görsel ${n + 1}`,
          n,
        ]);
      }

      if (product.active ?? true) activeProductIds.push(productId);
    }

    const reviewerEmails = Array.from({ length: REVIEWER_COUNT }, (_, i) => `yorumcu${i + 1}@example.com`);
    await db.query(
      `INSERT INTO users (email, name, password_hash, email_verified)
       SELECT t.email, t.name, NULL, FALSE FROM unnest($1::text[], $2::text[]) AS t(email, name)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name`,
      [reviewerEmails, reviewerEmails.map((_, i) => reviewerName(i))],
    );
    const { rows: reviewerRows } = await db.query<{ id: string }>(
      "SELECT id FROM users WHERE email = ANY($1::text[]) ORDER BY array_position($1::text[], email)",
      [reviewerEmails],
    );
    const reviewerIds = reviewerRows.map((row) => row.id);

    // Sahte yorumcuların yorumları plana birebir eşitlenir: plandakiler eklenir/güncellenir (created_at
    // korunur), plan dışında kalanlar silinir. Böylece tekrar çalıştırınca sayılar değişmez.
    // Gerçek kullanıcıların yorumlarına dokunulmaz.
    for (const [i, productId] of activeProductIds.entries()) {
      const reviews = buildReviews(i);
      const plannedReviewerIds = reviews.map((review) => reviewerIds[review.reviewer]!);

      await db.query(
        `DELETE FROM reviews
          WHERE product_id = $1 AND user_id = ANY($2::uuid[]) AND user_id <> ALL($3::uuid[])`,
        [productId, reviewerIds, plannedReviewerIds],
      );
      await db.query(
        `INSERT INTO reviews (product_id, user_id, rating, comment, created_at, updated_at)
         SELECT $1, t.user_id, t.rating, t.comment, ts.at, ts.at
           FROM unnest($2::uuid[], $3::smallint[], $4::text[], $5::int[], $6::int[])
                  AS t(user_id, rating, comment, days_ago, hours_ago)
          CROSS JOIN LATERAL (SELECT now() - make_interval(days => t.days_ago, hours => t.hours_ago) AS at) ts
         ON CONFLICT (product_id, user_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment`,
        [
          productId,
          plannedReviewerIds,
          reviews.map((review) => review.rating),
          reviews.map((review) => review.comment),
          reviews.map((review) => review.daysAgo),
          reviews.map((review) => review.hoursAgo),
        ],
      );
    }

    // Puanlar gerçek yorumlardan hesaplanır (uygulamadaki recalculateProductRating ile aynı formül).
    await db.query(
      `UPDATE products p
          SET rating_avg = (SELECT COALESCE(round(avg(rating), 1), 0) FROM reviews WHERE product_id = p.id),
              rating_count = (SELECT count(*)::int FROM reviews WHERE product_id = p.id)`,
    );
  });

  const { rows } = await pool.query<{
    categories: number;
    brands: number;
    products: number;
    images: number;
    reviewers: number;
    reviews: number;
  }>(
    `SELECT (SELECT count(*)::int FROM categories) AS categories,
            (SELECT count(*)::int FROM brands) AS brands,
            (SELECT count(*)::int FROM products) AS products,
            (SELECT count(*)::int FROM product_images) AS images,
            (SELECT count(*)::int FROM users WHERE email LIKE 'yorumcu%@example.com') AS reviewers,
            (SELECT count(*)::int FROM reviews) AS reviews`,
  );
  const c = rows[0]!;
  console.log(
    `Seed tamamlandı: ${c.categories} kategori, ${c.brands} marka, ${c.products} ürün, ${c.images} görsel, ` +
      `${c.reviewers} yorumcu, ${c.reviews} yorum.`,
  );
}

main()
  .catch((err) => {
    console.error("Seed hatası:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
