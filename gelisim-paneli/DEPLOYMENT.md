# 🚀 Gelişim Paneli - Deployment Rehberi

## 📋 İçindekiler

1. [Gereksinimler](#gereksinimler)
2. [Firebase Kurulumu](#firebase-kurulumu)
3. [Yerel Geliştirme](#yerel-geliştirme)
4. [Production Build](#production-build)
5. [Firebase Hosting Deployment](#firebase-hosting-deployment)
6. [Güvenlik Ayarları](#güvenlik-ayarları)
7. [İlk Kullanıcı Oluşturma](#ilk-kullanıcı-oluşturma)
8. [Sorun Giderme](#sorun-giderme)

---

## 🛠️ Gereksinimler

### Yazılım Gereksinimleri

- **Node.js**: v18.0.0 veya üzeri
- **npm**: v9.0.0 veya üzeri
- **Git**: En son sürüm
- **Firebase CLI**: `npm install -g firebase-tools`

### Firebase Hesabı

1. [Firebase Console](https://console.firebase.google.com/) hesabı oluşturun
2. Yeni bir proje oluşturun
3. Firestore Database'i etkinleştirin (Production modda başlayın)
4. Firebase Authentication'ı etkinleştirin:
   - Email/Password provider'ı açın
   - Anonymous provider'ı açın

---

## 🔥 Firebase Kurulumu

### 1. Firebase Projesi Oluşturma

```bash
# Firebase Console'dan:
1. Yeni proje oluşturun: https://console.firebase.google.com/
2. Proje adını girin (örn: "gelisim-paneli")
3. Google Analytics'i etkinleştirin (isteğe bağlı)
```

### 2. Web App Ekleme

```bash
# Firebase Console'da:
1. Project Overview > "Add app" > Web (</>) seçin
2. App nickname girin (örn: "Gelişim Web")
3. Firebase Hosting'i şimdilik atlayabilirsiniz
4. Config bilgilerini kopyalayın
```

### 3. Environment Variables Oluşturma

Proje dizininde `.env` dosyası oluşturun:

```bash
cd gelisim-paneli
cp .env.example .env
```

`.env` dosyasını düzenleyin ve Firebase config bilgilerinizi ekleyin:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 4. Firestore Database Kurulumu

```bash
# Firebase Console'da:
1. Firestore Database > Create database
2. Start in PRODUCTION mode seçin
3. Location seçin (europe-west veya us-central)
4. Enable butonuna tıklayın
```

### 5. Authentication Kurulumu

```bash
# Firebase Console'da:
1. Authentication > Get started
2. Sign-in method tab'ına geçin
3. Email/Password provider'ı Enable edin
4. Anonymous provider'ı Enable edin
5. Save
```

---

## 💻 Yerel Geliştirme

### 1. Dependency'leri Yükleme

```bash
cd gelisim-paneli
npm install
```

### 2. Development Server Başlatma

```bash
npm run dev
```

Tarayıcıda şu adresi açın: `http://localhost:5173/`

### 3. Linting ve Type Checking

```bash
# ESLint kontrolü
npm run lint

# TypeScript type checking
npm run build  # TypeScript compilation yapar
```

---

## 📦 Production Build

### 1. Build Oluşturma

```bash
npm run build
```

Build işlemi şunları yapar:
- TypeScript derleme
- Vite optimizasyonu
- Code splitting
- Minification
- Service Worker oluşturma
- PWA manifest oluşturma

### 2. Build Preview (Yerel Test)

```bash
npm run preview
```

`http://localhost:4173/` adresinde production build'i test edebilirsiniz.

---

## 🌐 Firebase Hosting Deployment

### 1. Firebase CLI Kurulumu

```bash
# Firebase CLI'yi global olarak yükleyin
npm install -g firebase-tools

# Firebase'e login olun
firebase login
```

### 2. Firebase Projesi Başlatma

```bash
# Proje dizininde
cd gelisim-paneli

# Firebase init (zaten yapılandırılmış ama yeniden yapmak için)
firebase init

# Seçenekler:
# - Hosting seçin (Space ile seçim)
# - Existing project: Projenizi seçin
# - Public directory: dist
# - Configure as SPA: Yes
# - Set up automatic builds: No (şimdilik)
# - Overwrite dist/index.html: No
```

### 3. Firestore Security Rules Deploy

```bash
# firestore.rules dosyasını deploy edin
firebase deploy --only firestore:rules

# Storage rules (eğer kullanılıyorsa)
firebase deploy --only storage:rules
```

### 4. Hosting Deploy

```bash
# Build oluşturun
npm run build

# Firebase Hosting'e deploy edin
firebase deploy --only hosting

# Ya da tümünü deploy edin
firebase deploy
```

### 5. Deploy Sonrası

Deploy başarılı olduktan sonra:

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project-id/overview
Hosting URL: https://your-project-id.web.app
```

---

## 🔐 Güvenlik Ayarları

### 1. Firestore Security Rules

`firestore.rules` dosyası zaten hazır. Deploy etmek için:

```bash
firebase deploy --only firestore:rules
```

**Rules özellikleri:**
- ✅ Sadece authenticate edilmiş kullanıcılar veri okuyabilir
- ✅ Sadece admin'ler veri yazabilir
- ✅ Anonymous users (staff) read-only erişim
- ✅ Admin users full access

### 2. Storage Rules (Eğer fotoğraf yükleme eklerseniz)

```bash
firebase deploy --only storage:rules
```

### 3. Firestore Indexes

Eğer complex query'ler eklersen ersiniz, Firebase Console'da otomatik index oluşturulur.

Manuel index oluşturmak için:

```bash
# firestore.indexes.json dosyasını düzenleyin
firebase deploy --only firestore:indexes
```

---

## 👤 İlk Kullanıcı Oluşturma

Uygulama ilk kez deploy edildikten sonra, **Firebase Console'dan** manuel olarak bir admin kullanıcısı oluşturmanız gerekir.

### Yöntem 1: Firebase Console (Önerilen)

```bash
1. Firebase Console > Authentication > Users
2. "Add user" butonuna tıklayın
3. Email ve şifre girin
4. User UID'yi kopyalayın

5. Firestore > Data > users collection oluşturun
6. Document ID = User UID (yukarıdaki adımdan)
7. Fields:
   - email: "admin@example.com"
   - role: "admin"
   - displayName: "Admin User"
   - createdAt: Firestore Timestamp (now)
```

### Yöntem 2: Firebase CLI

```bash
# Node.js script ile (Firebase Admin SDK gerekir)
# scripts/create-admin.js dosyası oluşturun
```

**Örnek Admin Script:**

```javascript
// scripts/create-admin.js
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createAdmin() {
  const email = 'admin@example.com';
  const password = 'secure-password-here';

  try {
    // Create user
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: false,
      disabled: false
    });

    // Add to Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email: email,
      role: 'admin',
      displayName: 'Admin User',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Admin user created successfully!');
    console.log('UID:', userRecord.uid);
    console.log('Email:', email);
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

createAdmin();
```

Çalıştırma:

```bash
node scripts/create-admin.js
```

---

## ⚙️ İsteğe Bağlı Yapılandırmalar

### 1. Custom Domain Bağlama

```bash
# Firebase Console > Hosting > Add custom domain
# DNS ayarlarını yapın (A records veya CNAME)
# SSL sertifikası otomatik oluşturulur
```

### 2. Environment-Specific Builds

**Development ve Production için ayrı .env dosyaları:**

```bash
.env.development
.env.production
```

**package.json scripts:**

```json
{
  "scripts": {
    "dev": "vite --mode development",
    "build": "vite build --mode production",
    "build:staging": "vite build --mode staging"
  }
}
```

### 3. CI/CD Pipeline (GitHub Actions)

`.github/workflows/deploy.yml` oluşturun:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: cd gelisim-paneli && npm ci

      - name: Build
        run: cd gelisim-paneli && npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          # ... diğer env variables

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
```

---

## 🐛 Sorun Giderme

### Build Hataları

**TypeScript errors:**

```bash
# TypeScript cache'i temizle
rm -rf node_modules/.cache
npm run build
```

**Dependency errors:**

```bash
# node_modules'u sil ve yeniden yükle
rm -rf node_modules package-lock.json
npm install
```

### Firebase Bağlantı Sorunları

**CORS hatası:**

```bash
# Firebase projesinin web app config'ini kontrol edin
# .env dosyasındaki değerlerin doğru olduğundan emin olun
```

**Permission denied:**

```bash
# Firestore rules'u kontrol edin
firebase firestore:rules
```

### PWA Sorunları

**Service Worker güncellenmiyor:**

```bash
# Browser cache'i temizleyin
# Ctrl + Shift + R (Hard reload)

# Service Worker'ı unregister edin
# Chrome DevTools > Application > Service Workers > Unregister
```

---

## 📊 Monitoring ve Analytics

### 1. Firebase Performance Monitoring

```bash
# Firebase Console > Performance
# Otomatik olarak aktif
```

### 2. Firebase Crashlytics

```bash
# Web için Crashlytics kurulumu (isteğe bağlı)
```

### 3. Google Analytics

```bash
# Firebase Console > Analytics
# .env'de VITE_FIREBASE_MEASUREMENT_ID ayarlandı
```

---

## 🔄 Güncelleme ve Bakım

### Dependency Updates

```bash
# Outdated package'leri kontrol et
npm outdated

# Güncelle (dikkatli olun, breaking changes olabilir)
npm update

# Major version updates için
npx npm-check-updates -u
npm install
```

### Database Backup

```bash
# Firestore export
gcloud firestore export gs://your-bucket-name

# Scheduled backups (Cloud Scheduler kullanarak)
```

---

## 📞 Destek ve İletişim

Sorun yaşarsanız:

1. GitHub Issues'da sorun bildirin
2. ARCHITECTURE.md dokümanını inceleyin
3. Firebase Console loglarını kontrol edin
4. Browser console'da hata mesajlarını kontrol edin

---

## ✅ Deployment Checklist

Deployment öncesi kontrol listesi:

- [ ] `.env` dosyası yapılandırıldı
- [ ] Firebase projesi oluşturuldu
- [ ] Firestore Database etkinleştirildi
- [ ] Authentication providers açıldı
- [ ] `npm run build` başarılı
- [ ] Firestore rules deploy edildi
- [ ] İlk admin kullanıcısı oluşturuldu
- [ ] Firebase Hosting deploy edildi
- [ ] Production URL'de test edildi
- [ ] PWA install test edildi
- [ ] Dark mode test edildi
- [ ] Mobile responsive test edildi

---

**Başarılı deployment'lar! 🚀**

*Son güncellenme: 2025-10-26*
