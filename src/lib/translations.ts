export const translations = {
  nav: {
    home: { tr: "Ana Sayfa", en: "Home" },
    about: { tr: "Hakkımızda", en: "About Us" },
    services: { tr: "Hizmetler", en: "Services" },
    specialists: { tr: "Uzman Kadro", en: "Our Specialists" },
    reviews: { tr: "Yorumlar", en: "Reviews" },
    faq: { tr: "SSS", en: "FAQ" },
    contact: { tr: "İletişim", en: "Contact" },
    appointment: { tr: "Online Randevu", en: "Book Appointment" },
  },
  home: {
    servicesTitle: { tr: "Hizmetlerimiz", en: "Our Services" },
    servicesSubtitle: {
      tr: "Ağız ve diş sağlığınız için kapsamlı tedavi seçenekleri",
      en: "Comprehensive treatment options for your oral and dental health",
    },
    specialistsTitle: { tr: "Uzman Kadromuz", en: "Our Specialists" },
    specialistsSubtitle: {
      tr: "Deneyimli ve uzman hekimlerimizle tanışın",
      en: "Meet our experienced and specialist doctors",
    },
    reviewsTitle: { tr: "Hasta Yorumları", en: "Patient Reviews" },
    ctaTitle: { tr: "Randevu Almak İster misiniz?", en: "Would You Like to Book an Appointment?" },
    ctaSubtitle: {
      tr: "Online randevu sistemi ile hızlıca randevunuzu oluşturun.",
      en: "Create your appointment quickly with our online appointment system.",
    },
    ctaButton: { tr: "Hemen Randevu Al", en: "Book Now" },
    viewAll: { tr: "Tümünü Gör", en: "View All" },
    learnMore: { tr: "Devamını Oku", en: "Learn More" },
  },
  about: {
    title: { tr: "Hakkımızda", en: "About Us" },
    whyUs: { tr: "Neden Biz?", en: "Why Us?" },
    features: {
      experience: { tr: "10+ Yıl Deneyim", en: "10+ Years Experience" },
      technology: { tr: "Modern Teknoloji", en: "Modern Technology" },
      team: { tr: "Uzman Kadro", en: "Expert Team" },
      comfort: { tr: "Hasta Konforu", en: "Patient Comfort" },
    },
  },
  services: {
    title: { tr: "Hizmetlerimiz", en: "Our Services" },
    subtitle: {
      tr: "Ağız ve diş sağlığı için kapsamlı çözümler",
      en: "Comprehensive solutions for oral and dental health",
    },
    duration: { tr: "Süre", en: "Duration" },
    minutes: { tr: "dakika", en: "minutes" },
    bookNow: { tr: "Randevu Al", en: "Book Appointment" },
  },
  specialists: {
    title: { tr: "Uzman Kadromuz", en: "Our Specialists" },
    subtitle: { tr: "Deneyimli hekimlerimizle tanışın", en: "Meet our experienced doctors" },
    bookWith: { tr: "Randevu Al", en: "Book Appointment" },
    services: { tr: "Uzmanlık Alanları", en: "Areas of Expertise" },
  },
  reviews: {
    title: { tr: "Hasta Yorumları", en: "Patient Reviews" },
    subtitle: {
      tr: "Hastalarımızın deneyimleri",
      en: "Experiences of our patients",
    },
    writeReview: { tr: "Yorum Yaz", en: "Write a Review" },
    yourName: { tr: "Adınız", en: "Your Name" },
    rating: { tr: "Puanınız", en: "Your Rating" },
    comment: { tr: "Yorumunuz", en: "Your Comment" },
    submit: { tr: "Gönder", en: "Submit" },
    success: {
      tr: "Yorumunuz alındı. Onaylandıktan sonra yayınlanacaktır.",
      en: "Your review has been received. It will be published after approval.",
    },
  },
  faq: {
    title: { tr: "Sıkça Sorulan Sorular", en: "Frequently Asked Questions" },
    subtitle: {
      tr: "Merak ettiğiniz soruların cevapları",
      en: "Answers to questions you wonder about",
    },
  },
  contact: {
    title: { tr: "İletişim", en: "Contact" },
    subtitle: { tr: "Bizimle iletişime geçin", en: "Get in touch with us" },
    name: { tr: "Adınız Soyadınız", en: "Full Name" },
    phone: { tr: "Telefon Numaranız", en: "Phone Number" },
    email: { tr: "E-posta Adresiniz", en: "Email Address" },
    subject: { tr: "Konu", en: "Subject" },
    message: { tr: "Mesajınız", en: "Your Message" },
    send: { tr: "Gönder", en: "Send" },
    success: {
      tr: "Mesajınız iletildi. En kısa sürede dönüş yapacağız.",
      en: "Your message has been sent. We will get back to you as soon as possible.",
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
    step3: { tr: "Tarih & Saat Seçin", en: "Select Date & Time" },
    step4: { tr: "Kişisel Bilgiler", en: "Personal Information" },
    next: { tr: "İleri", en: "Next" },
    back: { tr: "Geri", en: "Back" },
    confirm: { tr: "Randevuyu Onayla", en: "Confirm Appointment" },
    name: { tr: "Adınız Soyadınız", en: "Full Name" },
    phone: { tr: "Telefon Numaranız", en: "Phone Number" },
    email: { tr: "E-posta (isteğe bağlı)", en: "Email (optional)" },
    note: { tr: "Not (isteğe bağlı)", en: "Note (optional)" },
    noSlots: { tr: "Bu tarihte uygun slot yok.", en: "No available slots on this date." },
    selectDate: { tr: "Tarih seçin", en: "Select a date" },
    success: {
      tr: "Randevunuz alındı! En kısa sürede sizi arayacağız.",
      en: "Your appointment has been received! We will call you as soon as possible.",
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
