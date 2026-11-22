# دليل التشغيل والتأمين والرفع — منصة مستر أدهم (النسخة المؤمّنة v2)

هذا الدليل يشرح خطوات تشغيل النسخة المعدّلة محلياً في **VS Code** ثم ربطها بمشروع **Firebase** الخاص بك ورفعها على **Cloudflare Pages**.

## 1. تشغيل المشروع في VS Code
1. فك ضغط المشروع وافتح المجلد في VS Code.
2. انسخ ملف `.env.example` إلى ملف جديد باسم `.env` وضع فيه مفاتيح مشروع Firebase الخاص بك من **Firebase Console > Project Settings > General > Your apps**.
3. شغّل الأوامر التالية في Terminal:
   ```bash
   npm install
   npm run lint
   npm run test
   npm run dev
   ```

## 2. خطوات التأمين الأساسية في Firebase Console (مهم جداً قبل الإطلاق)
1. **تفعيل Authentication:** فعّل **Google Sign-In** (و/أو Email & Password) من `Firebase Console > Authentication > Sign-in method`.
2. **إضافة حسابك كأدمن (بدلاً من كتابة الإيميل في الكود):**
   - سجّل دخول مرة واحدة أو انسخ الـ **User UID** الخاص بحسابك من `Authentication > Users`.
   - افتح `Firestore Database` وأنشئ Collection باسم `admins`، ثم أنشئ مستند الـ **Document ID** بتاعه هو الـ `UID` بتاعك، وضيف فيه حقل:
     - `email`: `"بريدك@gmail.com"`
3. **رفع قواعد الأمان (`firestore.rules` و `storage.rules`):**
   - انسخ محتوى ملف `firestore.rules` في `Firestore Database > Rules` واضغط **Publish**.
   - فعّل **Firebase Storage** وانسخ محتوى `storage.rules` في `Storage > Rules` واضغط **Publish**.
4. **تفعيل Firebase App Check (لمنع البوتات من تجميد المواعيد):**
   - من `Firebase Console > App Check` اربط تطبيق الويب بـ **reCAPTCHA v3**، وضع الـ Site Key في `VITE_RECAPTCHA_SITE_KEY` داخل `.env` (وفي إعدادات Cloudflare Pages).
5. **تقييد الـ API Key على دومينك فقط:**
   - من **Google Cloud Console > APIs & Services > Credentials**، افتح الـ Browser API Key وحدد **HTTP referrers**: `https://adham-teach.online/*` و`http://localhost:3000/*`.
6. **تهيئة البيانات الأساسية والمحافظ:**
   - ادخل `/admin/login` بحسابك، اضغط **"تهيئة البيانات الأساسية"** (مرة واحدة فقط)، ثم من تبويب **الإعدادات** أضف رقم **فودافون كاش** و**إنستا باي** وروابط السوشيال ميديا الحقيقية.

## 3. الرفع على Cloudflare Pages (لتحمل آلاف الزوار مجاناً)
1. ارفع المشروع على مستودع GitHub خاص (Private Repo) وتأكد أن ملف `.env` غير مرفوع (موجود في `.gitignore`).
2. في **Cloudflare Dashboard > Workers & Pages > Create > Pages**:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - أضف جميع متغيرات `.env` (`VITE_FIREBASE_*` و`VITE_RECAPTCHA_SITE_KEY`) في **Environment Variables**.
3. اربط الدومين `adham-teach.online` وفعّل **Bot Fight Mode** من `Security > Bots` في Cloudflare.

## 4. الخطوة التالية (المرحلة القادمة)
بعد ما تتأكد إن الحجز والباقات الديناميكية والـ Storage شغالين تمام عندك، نبدأ نضيف:
- توحيد بوابة الدخول (`Auth` موحد للطلاب والأدمن).
- لوحة الطالب الشخصية + سجل حضور الحصص المتبقية + الإشعارات.
- قناة المدرس الجانبية (Broadcast Channel) ومكتبة الفيديوهات (Demo & Reels).
