# 📚 Gelişim Paneli - Çocuk Değerlendirme Sistemi

> Modern ve kullanıcı dostu çocuk gelişim değerlendirme ve takip sistemi

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-61dafb)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1-646cff)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.4-orange)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8)](https://tailwindcss.com/)

---

## 🎯 Proje Hakkında

Gelişim Paneli, okul öncesi eğitim kurumları için geliştirilmiş, çocukların günlük gelişimlerini **0-1-2 puanlama sistemi** ile takip eden modern bir web uygulamasıdır.

### ✨ Temel Özellikler

- ✅ **0-1-2 Puanlama Sistemi** - Basit ve etkili değerlendirme
- ✅ **Dönemsel Kazanım Takibi** - 6 ve 12 günlük dönemler
- ✅ **Veto ve İptal Kuralları** - Yapılandırılabilir hesaplama mantığı
- ✅ **Admin ve Personel Rolleri** - Rol bazlı yetkilendirme
- ✅ **Excel ve PDF Export** - Detaylı raporlama
- ✅ **Gelişmiş Grafikler** - Trend ve performans analizi
- ✅ **Dark Mode** - Göz dostu tema
- ✅ **Tam Responsive** - Mobil, tablet ve desktop desteği
- ✅ **PWA Desteği** - Offline çalışma ve ana ekrana ekleme
- ✅ **Otomatik Migration** - 1-5 sisteminden 0-1-2'ye geçiş

---

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js 18+
- npm 9+
- Firebase hesabı

### Kurulum

```bash
# 1. Repository'yi klonlayın
git clone <repository-url>
cd gelisim-paneli

# 2. Dependency'leri yükleyin
npm install

# 3. Environment variables'ı yapılandırın
cp .env.example .env
# .env dosyasını Firebase bilgilerinizle düzenleyin

# 4. Development server'ı başlatın
npm run dev
```

Tarayıcınızda `http://localhost:5173/` adresini açın.

---

## 📋 Available Scripts

| Script | Açıklama |
|--------|----------|
| `npm run dev` | Development server başlatır (port 5173) |
| `npm run build` | Production build oluşturur |
| `npm run lint` | ESLint kontrolü yapar |
| `npm run preview` | Build preview'ı gösterir (port 4173) |

---

## 🏗️ Teknoloji Stack'i

### Frontend

- **React 19.1** - UI kütüphanesi
- **TypeScript 5.9** - Tip güvenli geliştirme
- **Vite 7.1** - Build tool ve dev server
- **Tailwind CSS 4.1** - Utility-first CSS framework
- **React Router DOM** - Sayfa yönlendirme

### Backend & Database

- **Firebase 12.4**
  - Authentication (Email/Password + Anonymous)
  - Firestore Database (NoSQL)
  - Hosting
  - Storage (opsiyonel)

### UI & Charts

- **Recharts 3.3** - Grafik ve chart'lar
- **ExcelJS 4.4** - Excel export
- **jsPDF 3.0** - PDF export
- **html2canvas** - PDF için ekran görüntüsü

### Development Tools

- **ESLint** - Code linting
- **PostCSS** - CSS transformations
- **Autoprefixer** - CSS vendor prefixes
- **Vite PWA Plugin** - Progressive Web App desteği

---

## 📁 Proje Yapısı

```
gelisim-paneli/
├── public/               # Static assets
├── src/
│   ├── components/       # React components (18 adet)
│   │   ├── ui/          # UI primitives (Badge, ProgressBar)
│   │   ├── modals/      # Modal components
│   │   └── ...          # Diğer components
│   ├── contexts/        # React Context providers (3 adet)
│   │   ├── AuthContext.tsx
│   │   ├── EvaluationContext.tsx
│   │   └── ToastContext.tsx
│   ├── pages/           # Route pages (5 adet)
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── EvaluationPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── StatsPage.tsx
│   ├── services/        # Firebase services
│   │   ├── firebase.ts
│   │   ├── childrenService.ts
│   │   └── settingsService.ts
│   ├── utils/           # Utility functions
│   │   ├── calculations.ts
│   │   ├── export.ts
│   │   └── migration.ts
│   ├── types/           # TypeScript type definitions
│   ├── hooks/           # Custom React hooks
│   ├── App.tsx          # Ana uygulama component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── firestore.rules      # Firestore Security Rules
├── storage.rules        # Storage Security Rules
├── firebase.json        # Firebase config
├── vite.config.ts       # Vite configuration
└── package.json         # Dependencies
```

---

## 🎨 Özellikler Detayı

### 1. Kimlik Doğrulama

- **Admin Girişi**: Email ve şifre ile
- **Personel Girişi**: Anonim kullanıcı olarak
- **Rol Tabanlı Erişim**: Admin ve staff yetkileri

### 2. Çocuk Yönetimi

- Çocuk ekleme, düzenleme, silme
- Arşivleme sistemi (soft delete)
- Arama ve filtreleme

### 3. Değerlendirme Sistemi

**0-1-2 Puanlama:**
- **0**: Yetersiz
- **1**: Orta / Gelişmekte
- **2**: Başarılı / Hedef davranış

**Özel Kurallar:**
- **Veto Kuralı**: X tane 0 puanı varsa kazanamaz
- **İptal Kuralı**: Y tane 2 puanı, Z tane 0'ı iptal eder

**Dönemsel Takip:**
- 6 günlük kazanım
- 12 günlük kazanım
- Özelleştirilebilir dönemler

### 4. Raporlama

**Excel Export:**
- Özet rapor (tüm çocuklar)
- Detaylı rapor (çocuk bazlı)
- Stil ve renk kodlama

**PDF Export:**
- Grafik ve chart'larla
- Profesyonel layout
- Çıktı alma ready

### 5. İstatistikler

**Grafikler:**
- Trend analizi (Line chart)
- Kategori performansı (Bar chart)
- Puan dağılımı (Pie chart)
- Dönemsel başarı (Bar chart)

**Filtreler:**
- Tarih aralığı
- Performans seviyesi
- Arşiv durumu

---

## 🔐 Güvenlik

### Firestore Security Rules

```javascript
// Sadece kimlik doğrulaması yapılmış kullanıcılar okuyabilir
// Sadece admin'ler yazabilir
// Audit logs immutable
```

Detaylı kurallar için: `firestore.rules`

### Environment Variables

Hassas bilgiler `.env` dosyasında tutulur:
- Firebase API keys
- Project IDs
- Authentication config

**Önemli**: `.env` dosyası git'e commit edilmez!

---

## 📱 PWA (Progressive Web App)

Uygulama PWA standartlarını destekler:

- ✅ Ana ekrana ekleme
- ✅ Offline çalışma (kısmi)
- ✅ Service Worker caching
- ✅ App-like experience

**Kurulum:**
1. Tarayıcıda uygulamayı açın
2. Adres çubuğunda "Yükle" butonuna tıklayın
3. Ana ekranınıza eklenir

---

## 🎯 Performans Optimizasyonları

- ✅ **Code Splitting** - Route bazlı lazy loading
- ✅ **Manual Chunks** - React, Charts, Export ayrı chunk'lar
- ✅ **Tree Shaking** - Kullanılmayan kod eliminasyonu
- ✅ **Minification** - Terser ile sıkıştırma
- ✅ **PWA Caching** - Workbox ile cache stratejileri
- ✅ **React Memo** - Component re-render optimizasyonu
- ✅ **useMemo** - Expensive calculations cache

---

## 📚 Dokümantasyon

| Doküman | Açıklama |
|---------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Detaylı teknik mimari |
| [ARCHITECTURE_SUMMARY.md](./ARCHITECTURE_SUMMARY.md) | Görsel özet ve diagramlar |
| [ARCHITECTURE_INDEX.md](./ARCHITECTURE_INDEX.md) | Navigasyon rehberi |
| [TEST_REPORT.md](./TEST_REPORT.md) | Kapsamlı test raporu |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment rehberi |
| [ANALIZ_RAPORU.md](./ANALIZ_RAPORU.md) | İyileştirme analizi |

---

## 🚀 Deployment

### Firebase Hosting

```bash
# 1. Build oluştur
npm run build

# 2. Firebase'e deploy et
firebase deploy

# Ya da sadece hosting
firebase deploy --only hosting
```

Detaylı deployment rehberi için: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🔧 Development Workflow

### Branch Strategy

- `main` - Production branch
- `develop` - Development branch
- `feature/*` - Feature branches

### Commit Convention

```
feat: Yeni özellik ekleme
fix: Bug düzeltme
docs: Dokümantasyon değişikliği
style: Code style değişikliği
refactor: Code refactoring
perf: Performance iyileştirmesi
test: Test ekleme/güncelleme
```

---

## 🐛 Bilinen Sorunlar ve Sınırlamalar

1. **Test Coverage %0** - Unit/E2E testler yok (geliştirilecek)
2. **Kullanıcı Yönetimi UI** - Admin panel'de user management yok
3. **i18n Desteği** - Sadece Türkçe (çoklu dil eklenebilir)
4. **2FA** - İki faktörlü kimlik doğrulama yok

Detaylar için: [TEST_REPORT.md](./TEST_REPORT.md)

---

## 📊 Kod İstatistikleri

- **Toplam Dosya**: 33 TypeScript/TSX dosyası
- **Kod Satırı**: ~4,500 satır
- **Components**: 18 adet
- **Pages**: 5 adet
- **Contexts**: 3 adet
- **Services**: 3 adet
- **Utilities**: 3 adet

---

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'feat: Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 📄 Lisans

Bu proje özel kullanım içindir. Herhangi bir lisans bilgisi eklenecek.

---

## 👥 Yazarlar

- **Geliştirme**: Claude Code
- **Mimari**: React + TypeScript + Firebase
- **UI/UX**: Modern gradient design with Tailwind CSS

---

## 📞 Destek

Sorularınız veya sorunlarınız için:

- GitHub Issues kullanın
- Dokümantasyonu inceleyin
- Firebase Console loglarını kontrol edin

---

## 🙏 Teşekkürler

Bu projede kullanılan açık kaynak projelere teşekkürler:

- React Team
- Vite Team
- Firebase/Google
- Tailwind CSS Team
- Recharts Team
- TypeScript Team

---

**Başarılı geliştirmeler! 🚀**

*Son güncellenme: 2025-10-26*
