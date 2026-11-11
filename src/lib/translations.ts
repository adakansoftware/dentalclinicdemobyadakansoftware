export const translations = {
  nav: {
    home: { tr: "Ana Sayfa", en: "Home" },
    about: { tr: "Hakkımızda", en: "About Us" },
    services: { tr: "Hizmetler", en: "Services" },
    specialists: { tr: "Uzman Kadro", en: "Our Specialists" },
    reviews: { tr: "Hasta Yorumları", en: "Reviews" },
    faq: { tr: "Sık Sorulanlar", en: "FAQ" },
    contact: { tr: "İletişim", en: "Contact" },
    appointment: { tr: "Online Randevu", en: "Book Appointment" },
  },
  home: {
    servicesTitle: { tr: "Hizmetlerimiz", en: "Our Services" },
    servicesSubtitle: {
      tr: "Ağız ve diş sağlığınız için planlı, güvenli ve modern tedavi seçenekleri",
      en: "Planned, safe, and modern treatment options for your oral health",
    },
    specialistsTitle: { tr: "Uzman Kadromuz", en: "Our Specialists" },
    specialistsSubtitle: {
      tr: "Deneyimli hekimlerimizle güven veren bir tedavi süreci planlayın",
      en: "Plan a reassuring treatment journey with our experienced clinicians",
    },
    reviewsTitle: { tr: "Hasta Yorumları", en: "Patient Reviews" },
    ctaTitle: { tr: "İlk Muayene Adımını Bugün Planlayın", en: "Plan Your First Visit Today" },
    ctaSubtitle: {
      tr: "Online randevu akışıyla hizmet, uzman ve tarih seçimini birkaç adımda tamamlayabilirsiniz.",
      en: "Complete service, specialist, and date selection in just a few steps.",
    },
    ctaButton: { tr: "Online Randevu Al", en: "Book Now" },
    viewAll: { tr: "Tümünü Gör", en: "View All" },
    learnMore: { tr: "Detayları İncele", en: "Learn More" },
  },
  about: {
    title: { tr: "Hakkımızda", en: "About Us" },
    whyUs: { tr: "Neden Adakan Dental?", en: "Why Adakan Dental?" },
    features: {
      experience: { tr: "Planlı Klinik Süreç", en: "Structured Clinical Process" },
      technology: { tr: "Modern Teknoloji", en: "Modern Technology" },
      team: { tr: "Uzman Kadro", en: "Expert Team" },
      comfort: { tr: "Hasta Konforu", en: "Patient Comfort" },
    },
  },
  services: {
    title: { tr: "Tedavi ve Hizmetler", en: "Treatments & Services" },
    subtitle: {
      tr: "Muayeneden estetik uygulamalara kadar farklı ihtiyaçlara uygun klinik çözümler",
      en: "Clinical solutions for different needs, from examinations to aesthetic procedures",
    },
    duration: { tr: "Süre", en: "Duration" },
    minutes: { tr: "dakika", en: "minutes" },
    bookNow: { tr: "Randevu Oluştur", en: "Book Appointment" },
  },
  specialists: {
    title: { tr: "Uzman Kadromuz", en: "Our Specialists" },
    subtitle: { tr: "Klinik alanlarında deneyimli hekimlerimizi yakından tanıyın", en: "Meet our experienced clinicians" },
    bookWith: { tr: "Randevu Al", en: "Book Appointment" },
    services: { tr: "Uzmanlık Alanları", en: "Areas of Expertise" },
  },
  reviews: {
    title: { tr: "Hasta Yorumları", en: "Patient Reviews" },
    subtitle: {
      tr: "Klinik deneyimimize dair hastalarımızdan gelen doğal geri bildirimler",
      en: "Natural feedback from patients about their clinic experience",
    },
    writeReview: { tr: "Yorum Bırak", en: "Write a Review" },
    yourName: { tr: "Adınız Soyadınız", en: "Your Full Name" },
    rating: { tr: "Puanınız", en: "Your Rating" },
    comment: { tr: "Yorumunuz", en: "Your Comment" },
    submit: { tr: "Gönder", en: "Submit" },
    success: {
      tr: "Yorumunuz alındı. İçerik kontrolünden sonra yayına alınacaktır.",
      en: "Your review has been received and will be published after review.",
    },
  },
  faq: {
    title: { tr: "Sık Sorulan Sorular", en: "Frequently Asked Questions" },
    subtitle: {
      tr: "Randevu, tedavi süreci ve klinik işleyişi hakkında en çok merak edilen konular",
      en: "The most frequently asked questions about booking, treatment, and clinic operations",
    },
  },
  contact: {
    title: { tr: "İletişim", en: "Contact" },
    subtitle: { tr: "Kliniğimizle hızlı ve güvenli şekilde iletişime geçin", en: "Reach our clinic quickly and confidently" },
    name: { tr: "Adınız Soyadınız", en: "Full Name" },
    phone: { tr: "Telefon Numaranız", en: "Phone Number" },
    email: { tr: "E-posta Adresiniz", en: "Email Address" },
    subject: { tr: "Konu", en: "Subject" },
    message: { tr: "Mesajınız", en: "Your Message" },
    send: { tr: "Mesajı Gönder", en: "Send Message" },
    success: {
      tr: "Mesajınız kliniğimize ulaştı. En kısa sürede sizinle iletişime geçeceğiz.",
      en: "Your message has been delivered. We will contact you as soon as possible.",
    },
    address: { tr: "Adres", en: "Address" },
    workingHours: { tr: "Çalışma Saatleri", en: "Working Hours" },
    days: {
      0: { tr: "Pazar", en: "Sunday" },
      1: { tr: "Pazartesi", en: "Monday" },
      2: { tr: "Salı", en: "Tuesday" },
      3: { tr: "Çarşamba", en: "Wednesday" },
      4: { tr: "Perşembe", en: "Thursday" },
      5: { tr: "Cuma", en: "Friday" },
      6: { tr: "Cumartesi", en: "Saturday" },
    } as Record<number, { tr: string; en: string }>,
    closed: { tr: "Kapalı", en: "Closed" },
  },
  appointment: {
    title: { tr: "Online Randevu", en: "Online Appointment" },
    step1: { tr: "Hizmet Seçin", en: "Select Service" },
    step2: { tr: "Uzman Seçin", en: "Select Specialist" },
    step3: { tr: "Tarih ve Saat Seçin", en: "Select Date & Time" },
    step4: { tr: "Şikayetinizi Anlatın", en: "Describe Your Complaint" },
    step5: { tr: "Bilgilerinizi Gönderin", en: "Send Your Details" },
    next: { tr: "Devam Et", en: "Next" },
    back: { tr: "Geri Dön", en: "Back" },
    confirm: { tr: "Randevu Talebini Gönder", en: "Confirm Appointment" },
    name: { tr: "Adınız Soyadınız", en: "Full Name" },
    phone: { tr: "Telefon Numaranız", en: "Phone Number" },
    email: { tr: "E-posta Adresiniz (isteğe bağlı)", en: "Email (optional)" },
    complaintLabel: { tr: "Şikayetiniz / Ağrınız", en: "Your Complaint / Pain" },
    complaintHint: {
      tr: "Şikayetinizi kısaca anlatın: ağrı nerede, ne zamandır var, ne tetikliyor? Bu bilgi uzmanınız için hazırlık sağlar.",
      en: "Briefly describe your complaint: where is the pain, how long has it lasted, what triggers it? This helps your specialist prepare.",
    },
    complaintPlaceholder: {
      tr: "Örn: Sağ alt azı dişimde 3 gündür zonklama şeklinde ağrı var, sıcak-soğuk hassasiyeti arttı...",
      en: "E.g. Throbbing pain in my lower right molar for 3 days, increased sensitivity to hot and cold...",
    },
    complaint: { tr: "Şikayet", en: "Complaint" },
    noSlots: { tr: "Bu tarihte uygun saat bulunmuyor.", en: "No available slots on this date." },
    selectDate: { tr: "Tarih seçin", en: "Select a date" },
    success: {
      tr: "Randevu talebiniz alındı. Klinik ekibimiz en kısa sürede sizinle iletişime geçecektir.",
      en: "Your appointment request has been received. Our team will contact you soon.",
    },
    summary: { tr: "Randevu Özeti", en: "Appointment Summary" },
    service: { tr: "Hizmet", en: "Service" },
    specialist: { tr: "Uzman", en: "Specialist" },
    date: { tr: "Tarih", en: "Date" },
    time: { tr: "Saat", en: "Time" },
    noSpecialists: {
      tr: "Bu hizmet için uygun uzman bulunmuyor.",
      en: "No available specialists for this service.",
    },
  },
  common: {
    loading: { tr: "Yükleniyor...", en: "Loading..." },
    error: { tr: "Bir hata oluştu.", en: "An error occurred." },
    required: { tr: "Bu alan zorunludur.", en: "This field is required." },
    close: { tr: "Kapat", en: "Close" },
    save: { tr: "Kaydet", en: "Save" },
    cancel: { tr: "İptal", en: "Cancel" },
    delete: { tr: "Sil", en: "Delete" },
    edit: { tr: "Düzenle", en: "Edit" },
    add: { tr: "Ekle", en: "Add" },
    search: { tr: "Ara", en: "Search" },
    yes: { tr: "Evet", en: "Yes" },
    no: { tr: "Hayır", en: "No" },
  },
  footer: {
    rights: { tr: "Tüm hakları saklıdır.", en: "All rights reserved." },
    quickLinks: { tr: "Hızlı Bağlantılar", en: "Quick Links" },
    contact: { tr: "İletişim", en: "Contact" },
    followUs: { tr: "Bizi Takip Edin", en: "Follow Us" },
  },
};

export type TranslationKey = typeof translations;

export function t<
  S1 extends keyof TranslationKey,
  S2 extends keyof TranslationKey[S1],
>(
  section: S1,
  key: S2,
  lang: "tr" | "en"
): string {
  const entry = translations[section][key] as { tr: string; en: string };
  return entry[lang] ?? entry.tr;
}
