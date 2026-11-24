# منصة مستر أدهم لحجز حصص اللغة الإنجليزية (Mr. Adham Booking Platform)

منصة متكاملة لحجز حصص اللغة الإنجليزية للطلاب وأولياء الأمور في مصر (عربي RTL مع إمكانية التبديل للإنجليزية EN)، مبنية باستخدام **React + Vite + TypeScript + Tailwind CSS + Framer Motion (`motion/react`) + React Router + Firebase (Auth, Firestore, Storage)**.

---

## 1. إعداد Firebase وتشغيل المشروع

المشروع متصل تلقائياً بملف الإعداد `firebase-applet-config.json` وقواعد الأمان `firestore.rules`. عند النقل أو النشر على مشروع Firebase خاص بك:

1. أنشئ مشروعاً جديداً في [Firebase Console](https://console.firebase.google.com).
2. فعّل **Cloud Firestore** و **Firebase Authentication** (فعّل Google Sign-In و/أو Email/Password من `Authentication -> Sign-in method`).
3. انسخ إعدادات الـ Web App داخل `firebase-applet-config.json` (أو متغيرات البيئة عند الحاجة).
4. انشر قواعد الأمان **والـ Index** (مهم: من غير الـ Index المواعيد مش هتظهر للزوار):
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```
   ولو بتنشر من الـ Console مش من الـ CLI: افتح `Firestore Database -> Indexes -> Composite -> Add index`
   على Collection ID = `slots` وأضف الحقول بالترتيب: `courseId` (Ascending) ثم `status` (Ascending) ثم `startAt` (Ascending).

## 2. إضافة أول مستخدم أدمن (Admin)

- صاحب المشروع الأساسي (`adhamaohamd@gmail.com`) مفعّل تلقائياً كمسؤول عند الدخول بحساب Google.
- لإضافة أي مسؤول آخر (بريد/كلمة مرور أو حساب Google):
  1. أنشئ المستخدم في **Firebase Console -> Authentication -> Users** وانسخ الـ `UID`.
  2. أضف مستنداً في مجموعة `admins` بالـ `Document ID = <UID>` والحقل:
     ```json
     { "email": "teacher@example.com" }
     ```
- بعد الدخول إلى `/admin` لأول مرة، اضغط على زر **"تجهيز البيانات الافتراضية (Seed)"** لإنشاء الصفوف الـ 5 والمواعيد الافتراضية لـ 4 أسابيع قادمة وآراء الطلاب وإعدادات الموقع تلقائياً.

## 3. تفعيل Firebase Storage لرفع الإيصالات

بشكل افتراضي يعمل رفع الإيصالات بضغط الصورة على المتصفح (بحد أقصى 1280px وأقل من ~680KB) وحفظها مباشرة لضمان العمل حتى لو لم يتم تفعيل Firebase Storage.
لتفعيل الرفع على **Firebase Storage**:
1. فعّل Storage من Firebase Console.
2. افتح `src/lib/firebase.ts` وغيّر:
   ```ts
   export const USE_FIREBASE_STORAGE = true;
   ```

## 4. ربط الدفع الإلكتروني لاحقاً (Paymob / Fawry)

بطاقة الدفع بالفيزا/ميزة (`قريباً`) مهيأة داخل الخطوة 4 في `src/pages/BookingPage.tsx` (تحت التعليق `Future Online Payment Gateway (Paymob / Fawry)`). عند تفعيل بوابة الدفع، أضف Cloud Function أو Endpoint لإنشاء Payment Key ثم وجّه الطالب إلى iframe/checkout قبل إنشاء الحجز بحالة `confirmed`.

## 5. النشر على Firebase Hosting

```bash
npm install
npm run build
npx firebase init hosting   # اختر dist كمجلد public واختر SPA rewrite لـ index.html
npx firebase deploy --only hosting,firestore:rules
```
