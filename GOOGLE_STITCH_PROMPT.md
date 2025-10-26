# Gelişim Paneli - Google Stitch Prompt

## Uygulama Özeti

**Gelişim Paneli**, çocuk gelişimini takip etmek ve değerlendirmek için tasarlanmış bir web uygulamasıdır. Eğitmenler, belirli kategorilerde çocukları günlük olarak değerlendirerek gelişimlerini izler, analiz eder ve raporlar.

### Temel İşlev
Öğretmenler ve yöneticiler, çocukları önceden tanımlanmış kategorilerde (örn: iletişim, sosyal beceriler, motor beceriler, bilişsel gelişim) 0-1-2 puan sistemiyle değerlendirirler. Sistem, bu değerlendirmeleri analiz ederek performans istatistikleri, trendler ve kazanım durumlarını otomatik hesaplar.

---

## 🎯 Ana Özellikler

### 1. **Çocuk Yönetimi**
- Çocuk ekleme, düzenleme, silme
- Arşivleme sistemi (silinen çocuklar geri kurtarılabilir)
- Çocuk başına detaylı profil ve değerlendirme geçmişi
- Toplu işlemler (içe/dışa aktarma)

### 2. **Değerlendirme Sistemi**
- **Puanlama:** 0-1-2 sistemi
  - **0:** Hedeflenen davranış gözlemlenmedi
  - **1:** Kısmen gözlemlendi veya destek ile yapıldı
  - **2:** Tam olarak ve bağımsız şekilde gerçekleşti
- **Kategoriler:** 4 ana kategori (ayarlardan özelleştirilebilir)
  - İletişim Becerileri
  - Sosyal Beceriler
  - Motor Beceriler
  - Bilişsel Gelişim
- **Tarih ve Değerlendirici Kaydı:** Her değerlendirme, yapıldığı tarih ve değerlendiriciyle birlikte saklanır
- **Açıklama/Not Sistemi:** Her kategori için opsiyonel metin notları

### 3. **Gelişmiş Hesaplama Kuralları**

#### a. Veto Kuralı
Belirli sayıda **0** alan çocuklar, o dönem kazanım alamazlar.
```typescript
interface VetoRule {
  enabled: boolean;
  zeroCount: number; // Örn: 3 veya daha fazla 0 varsa veto
}
```

#### b. İptal Kuralı (Cancellation)
Yüksek puanlar (2), düşük puanları (0) iptal edebilir.
```typescript
interface CancelRule {
  enabled: boolean;
  highScore: 2;    // İptal eden puan
  highCount: 1;    // Kaç tane 2 gerekli
  lowScore: 0;     // İptal edilen puan
  lowCount: 1;     // Kaç tane 0 iptal edilir
}
```
**Örnek:** 1 tane **2** puanı, 1 tane **0** puanını iptal eder → 0'lar düşürülür.

#### c. Kazanım Eşiği
Çocukların ortalamasının **threshold** değerinin üzerinde olması gerekir (varsayılan: 1.5).

#### d. Dönemsel Analiz
Belirli gün aralıklarında (örn: son 7 gün, 14 gün, 30 gün) performansı ayrı ayrı hesaplar.

```typescript
interface Period {
  days: number;  // 7, 14, 30
  name: string;  // "Son 1 Hafta", "Son 2 Hafta", "Son 1 Ay"
}
```

### 4. **Rol Tabanlı Erişim**
- **Admin:** Tüm yetkilere sahip
  - Ayarları düzenleyebilir
  - İstatistikleri görüntüleyebilir
  - Çocuk ekleyip silebilir
- **Staff (Personel):** Kısıtlı yetkiler
  - Değerlendirme yapabilir
  - Dashboard'u görüntüleyebilir
  - Ayarları değiştiremez
- **Viewer:** Salt okunur (henüz tam implemente edilmedi)

### 5. **İstatistik ve Analiz**
- **Dashboard:**
  - Toplam çocuk sayısı
  - Toplam değerlendirme sayısı
  - Genel ortalama puan
  - Başarı oranı (eşik üstü çocuk yüzdesi)
  - Son değerlendirmeler (son 7 gün)
  - En başarılı çocuklar (sıralı liste)
- **Grafik Sayfası (Stats):**
  - Çocuk başına ilerleme grafikleri (Recharts line/bar charts)
  - Kategori bazlı performans dağılımı
  - Zaman serisi analizleri
  - Dönemsel karşılaştırmalar

### 6. **Export/Import**
- **Excel (.xlsx):** ExcelJS kullanarak tam veri dışa aktarımı
  - Tüm çocuklar, değerlendirmeler, tarihler
  - Formatlanmış tablo yapısı
- **PDF:** jsPDF ile rapor çıktıları
  - Özet istatistikler
  - Çocuk bazlı değerlendirme raporları

### 7. **Dark Mode**
- Kullanıcı tercihine göre light/dark tema
- Local storage ile kalıcı tercih
- Tailwind CSS dark: sınıfları ile implemente edilmiş

---

## 🏗️ Teknik Mimari

### **Frontend Stack**
```json
{
  "framework": "React 19.1.1",
  "language": "TypeScript 5.9",
  "buildTool": "Vite 7.1.7",
  "styling": "Tailwind CSS 4.1",
  "router": "React Router DOM 7.9",
  "charts": "Recharts 3.3",
  "excel": "ExcelJS 4.4.0",
  "pdf": "jsPDF 3.0.3"
}
```

### **Backend/Database**
- **Firebase 12.4.0:**
  - **Authentication:** Email/password authentication
  - **Firestore:** NoSQL veritabanı
    - Collections:
      - `children`: Çocuk verileri ve değerlendirmeler
      - `settings`: Uygulama ayarları (kategoriler, eşikler, kurallar)
      - `users`: Kullanıcı rolleri

### **Veri Modelleri**

#### Child (Çocuk)
```typescript
interface Child {
  id: string;
  name: string;
  scores: ScoreEntry[];
  archived?: boolean;
  createdAt?: string;
}
```

#### ScoreEntry (Değerlendirme Kaydı)
```typescript
interface ScoreEntry {
  date: string;              // "YYYY-MM-DD"
  evaluator: string;         // Değerlendirici adı
  s1?: number;               // Kategori 1 puanı (0, 1, 2)
  s2?: number;               // Kategori 2 puanı
  s3?: number;               // Kategori 3 puanı
  s4?: number;               // Kategori 4 puanı
  descriptions?: {
    [categoryIndex: number]: string
  };
}
```

#### AppSettings
```typescript
interface AppSettings {
  categories: string[];      // ["İletişim", "Sosyal", "Motor", "Bilişsel"]
  threshold: number;         // Kazanım eşiği (1.5)
  scoreSystem: {
    min: 0;
    max: 2;
  };
  vetoRule: VetoRule;
  cancelRule: CancelRule;
  periods: Period[];
}
```

### **Klasör Yapısı**
```
gelisim-paneli/
├── src/
│   ├── components/       # UI bileşenleri
│   │   ├── ChildCard.tsx
│   │   ├── AddChildModal.tsx
│   │   ├── DarkModeToggle.tsx
│   │   └── ui/
│   ├── contexts/         # React Context API
│   │   ├── AuthContext.tsx
│   │   ├── EvaluationContext.tsx
│   │   └── ToastContext.tsx
│   ├── pages/            # Sayfa bileşenleri
│   │   ├── DashboardPage.tsx
│   │   ├── EvaluationPage.tsx
│   │   ├── StatsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── services/         # API ve Firebase servisleri
│   │   ├── firebase.ts
│   │   ├── childrenService.ts
│   │   └── settingsService.ts
│   ├── utils/            # Yardımcı fonksiyonlar
│   │   ├── calculations.ts
│   │   ├── export.ts
│   │   └── migration.ts
│   └── types/            # TypeScript tipleri
├── public/
└── ...config files
```

---

## 🔄 Ana İş Akışları

### **1. Değerlendirme Yapma**
1. Dashboard'dan "Değerlendirme Yap" butonu
2. Tarih seçimi (modal)
3. Değerlendirici adı girişi (modal)
4. Çocuk listesi gösterilir
5. Her çocuk için kategorilere puan girişi
6. Opsiyonel açıklama ekleme
7. "Kaydet" ile Firestore'a yazılır
8. Otomatik istatistikler güncellenir

### **2. İstatistik Hesaplama (calculations.ts)**
```typescript
function calculateChildStats(child: Child, settings: AppSettings): ChildStats {
  // 1. Tüm puanları al
  // 2. İptal kuralını uygula (yüksek puanlar düşük puanları iptal eder)
  // 3. Veto kuralını kontrol et (çok fazla 0 varsa veto)
  // 4. Ortalamaları hesapla
  // 5. Dönem bazlı analizler
  // 6. Kazanım durumunu belirle (average >= threshold)
  return stats;
}
```

### **3. Veri Migrasyonu**
Eski **1-5 puan sistemi** yeni **0-1-2 sistemine** otomatik dönüştürme:
- 1 → 0
- 2,3 → 1
- 4,5 → 2

`migration.ts` dosyası bu dönüşümleri yönetir.

---

## ⚠️ Bilinen Sorunlar ve Sınırlamalar

### **Kritik Sorunlar**
1. **Bundle Boyutu:** 1.8 MB (çok büyük)
   - **Neden:** Tüm kütüphaneler tek bir chunk'ta
   - **Çözüm:** Lazy loading zaten uygulanmış, daha fazla code splitting gerekebilir

2. **Offline Destek Yok**
   - Firebase bağlantısı kesilirse uygulama çalışmaz
   - PWA desteği eksik

3. **Gelişmiş Filtreleme Eksik**
   - Tarih aralığı, değerlendirici, kategori bazlı filtreleme yok

### **Eksik Özellikler**
- Arşiv UI'ı (backend var, frontend eksik)
- Bildirim sistemi
- Çoklu dil desteği (sadece Türkçe)
- Şifre sıfırlama
- İki faktörlü kimlik doğrulama
- Audit log

---

## 🔐 Güvenlik

### **Firestore Kuralları (Tavsiye Edilen)**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin check
    function isAdmin() {
      return request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Authenticated check
    function isAuthenticated() {
      return request.auth != null;
    }

    // Children: Staff can read/write, Admin can delete
    match /children/{childId} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated();
      allow delete: if isAdmin();
    }

    // Settings: Only admin
    match /settings/{document=**} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Users: Only admin
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
  }
}
```

---

## 📊 Kullanım Senaryoları

### **Senaryo 1: Günlük Değerlendirme**
**Persona:** Öğretmen Ayşe

1. Dashboard'a giriş yapar
2. "Değerlendirme Yap" butonuna tıklar
3. Bugünün tarihini seçer
4. Adını "Ayşe Öğretmen" olarak girer
5. 20 çocuğun her biri için 4 kategoride puan verir
6. Bazı çocuklar için özel notlar ekler (örn: "Bugün iletişim konusunda çok istekliydi")
7. Kaydeder → Veriler Firestore'a yazılır

### **Senaryo 2: Aylık Rapor Çıkarma**
**Persona:** Yönetici Mehmet

1. Stats sayfasına gider
2. Son 30 günlük performansı inceler
3. "Excel'e Aktar" butonuna tıklar
4. Tüm çocukların verilerini içeren Excel dosyasını indirir
5. Üst yönetime sunar

### **Senaryo 3: Kazanım Durumu Kontrolü**
**Persona:** Veli Zeynep (Admin hesabı aldığını varsayalım)

1. Dashboard'da "En Başarılılar" listesine bakar
2. Çocuğunun sıralamadaki yerini görür
3. Stats sayfasına gider
4. Çocuğunun ilerleme grafiğini inceler
5. Hangi kategorilerde daha iyi olduğunu görür

---

## 🚀 Gelecek Geliştirme Önerileri

### **Yüksek Öncelik**
1. **Offline PWA Desteği**
   - Service Worker
   - IndexedDB cache
   - Sync when online

2. **Gelişmiş Filtreleme**
   - Tarih aralığı seçici
   - Değerlendirici filtresi
   - Kategori bazlı arama

3. **Arşiv Yönetimi UI**
   - Arşivlenmiş çocukları görüntüleme
   - Geri yükleme
   - Kalıcı silme

### **Orta Öncelik**
4. **Bildirim Sistemi**
   - E-posta bildirimleri
   - Push notifications (PWA)
   - Düşük performans uyarıları

5. **Kullanıcı Yönetimi**
   - Admin panelinden kullanıcı ekleme
   - Rol düzenleme
   - Şifre sıfırlama

### **Düşük Öncelik**
6. **Çoklu Dil (i18n)**
   - İngilizce desteği
   - react-i18next entegrasyonu

7. **AI Önerileri**
   - Çocukların gelişim trendlerinden tahminler
   - Risk analizi
   - Kişiselleştirilmiş öneriler

---

## 🧪 Test Stratejisi

### **Mevcut Durum**
- ❌ Unit testler yok
- ❌ E2E testler yok
- ❌ Integration testler yok

### **Önerilen Test Yapısı**
```typescript
// Unit Tests (Vitest)
describe('calculateChildStats', () => {
  it('should apply cancel rule correctly', () => {
    // Test iptal kuralının doğru çalıştığını
  });

  it('should apply veto rule when zeroCount exceeds limit', () => {
    // Test veto kuralının doğru çalıştığını
  });
});

// E2E Tests (Playwright)
test('user can evaluate children', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('text=Değerlendirme Yap');
  // ... test senaryosu
});
```

---

## 📝 API ve Entegrasyon Noktaları

### **Firebase Functions (Önerilen Eklemeler)**
```typescript
// functions/src/index.ts

// 1. E-posta bildirimleri
exports.sendWeeklyReport = functions.pubsub
  .schedule('every monday 09:00')
  .onRun(async (context) => {
    // Haftalık rapor e-postaları gönder
  });

// 2. Otomatik yedekleme
exports.dailyBackup = functions.pubsub
  .schedule('every day 02:00')
  .onRun(async (context) => {
    // Firestore'u Google Cloud Storage'a yedekle
  });

// 3. Veri validasyonu
exports.validateEvaluation = functions.firestore
  .document('children/{childId}')
  .onWrite((change, context) => {
    // Skorların 0-2 arasında olduğunu kontrol et
  });
```

### **Webhook Desteği (İsteğe Bağlı)**
```typescript
// Dış sistemlere bildirim
POST /api/webhooks/evaluation-created
{
  "childId": "abc123",
  "date": "2025-10-25",
  "evaluator": "Ayşe Öğretmen",
  "averageScore": 1.75,
  "achievedGoal": true
}
```

---

## 🎨 Tasarım Sistemi

### **Renk Paleti**
```css
/* Light Mode */
--background: #f5f5f7;
--text: #1d1d1f;
--text-muted: #6e6e73;
--accent: #8b5cf6;
--success: #10b981;
--warning: #f59e0b;
--danger: #ef4444;

/* Dark Mode */
--background: #1a1a1a;
--text: #f5f5f7;
--text-muted: #a1a1a6;
/* ... */
```

### **Tipografi**
- **Font Family:** system-ui, -apple-system, sans-serif
- **Başlıklar:** font-bold, font-extrabold
- **Body:** font-normal

### **Bileşen Stili**
- **Cards:** Rounded-lg, shadow, border
- **Buttons:** Rounded-lg, bold text, hover states
- **Inputs:** Rounded-lg, border, focus ring

---

## 🔗 Yararlı Linkler

- **Firebase Console:** https://console.firebase.google.com
- **React Docs:** https://react.dev
- **TypeScript:** https://www.typescriptlang.org
- **Tailwind CSS:** https://tailwindcss.com
- **Recharts:** https://recharts.org

---

## 📞 Destek ve İletişim

Bu uygulama, çocuk gelişim uzmanları, öğretmenler ve eğitim kurumları için tasarlanmıştır. Herhangi bir sorunuz veya öneriniz için:

- **GitHub Issues:** Proje deposunda issue açabilirsiniz
- **Teknik Dokümantasyon:** ANALIZ_RAPORU.md dosyasına bakın
- **Deployment:** Firebase Hosting üzerinden deploy edilebilir

---

## 🏁 Başlangıç Adımları

### **Geliştirme Ortamı Kurulumu**
```bash
# 1. Bağımlılıkları yükle
cd gelisim-paneli
npm install

# 2. Firebase config oluştur
cp .env.example .env
# .env dosyasını düzenle ve Firebase credentials'ı ekle

# 3. Development server başlat
npm run dev

# 4. Tarayıcıda aç
# http://localhost:5173
```

### **İlk Admin Kullanıcısı Oluşturma**
```javascript
// Firebase Console > Authentication > Users > Add User
// Email: admin@example.com
// Password: güçlü-şifre

// Firestore Console > users collection > Yeni Belge
{
  "uid": "firebase-auth-uid",
  "email": "admin@example.com",
  "role": "admin"
}
```

### **Production Build**
```bash
# Build
npm run build

# Firebase'e deploy
firebase deploy
```

---

## 💡 Google Stitch İçin Özel Notlar

Bu uygulama için Google Stitch kullanırken aşağıdaki konulara dikkat edilmesi önerilir:

### **1. Veri Senkronizasyonu**
- Firestore real-time listeners kullanılıyor
- Değerlendirmeler anında güncelleniyor
- Çoklu kullanıcı aynı anda değerlendirme yapabilir

### **2. Performans İyileştirmeleri**
- Lazy loading sayfalara uygulanmış
- Recharts grafikleri ağır olabilir → memoization kullanılmalı
- Firestore query'leri optimize edilmeli (index'ler eklenebilir)

### **3. Analytics Entegrasyonu**
```typescript
// Google Analytics için
import { getAnalytics, logEvent } from 'firebase/analytics';

const analytics = getAnalytics(app);
logEvent(analytics, 'evaluation_completed', {
  childCount: 20,
  evaluator: 'Ayşe',
  date: '2025-10-25'
});
```

### **4. Crash Reporting**
- ErrorBoundary mevcut
- Firebase Crashlytics eklenebilir
- Sentry entegrasyonu önerilir

### **5. A/B Testing**
- Firebase Remote Config kullanılabilir
- Farklı hesaplama yöntemleri test edilebilir
- UI varyasyonları denenebilir

---

## 🎓 Eğitim Kaynakları

### **Yeni Geliştiriciler İçin**
1. `src/types/index.ts` → Veri yapılarını anlamak için
2. `src/utils/calculations.ts` → İş mantığını anlamak için
3. `src/contexts/EvaluationContext.tsx` → State management için
4. `ANALIZ_RAPORU.md` → Detaylı analiz raporu

### **Sistem Akışı Şeması**
```
User Login → Dashboard → Değerlendirme Yap
                ↓
            Tarih Seç → Değerlendirici Gir
                ↓
            Çocuk Listesi → Her Çocuğa Puan Ver
                ↓
            Kaydet → Firestore'a Yaz
                ↓
            Otomatik Hesaplama → İstatistikler Güncellenir
                ↓
            Stats/Dashboard Güncellenir
```

---

**Son Güncelleme:** 2025-10-25
**Versiyon:** 2.0 (0-1-2 Puan Sistemi)
**Durum:** Production Ready (bazı iyileştirmeler önerilir)
