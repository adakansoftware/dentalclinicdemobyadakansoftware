import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const LEGACY_ADMIN_EMAIL = "admin@klinik.com";

function getSeedAdminConfig() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  const name = process.env.ADMIN_NAME?.trim() || "Clinic Admin";

  if (!email) {
    throw new Error("ADMIN_EMAIL is required for prisma seed");
  }

  if (!password || password.length < 12) {
    throw new Error("ADMIN_PASSWORD is required for prisma seed and must be at least 12 characters");
  }

  return { email, password, name };
}

async function main() {
  const adminConfig = getSeedAdminConfig();
  const passwordHash = await bcrypt.hash(adminConfig.password, 12);
  const admin = await prisma.adminUser.upsert({
    where: { email: adminConfig.email },
    update: {
      passwordHash,
      name: adminConfig.name,
    },
    create: {
      email: adminConfig.email,
      passwordHash,
      name: adminConfig.name,
    },
  });

  await prisma.adminUser.deleteMany({
    where: {
      email: {
        in: [LEGACY_ADMIN_EMAIL],
      },
      NOT: {
        email: adminConfig.email,
      },
    },
  });
  console.log("Admin created:", admin.email);

  const settings = [
    { key: "clinicName", value: "Adakan Dental Klinik" },
    { key: "clinicNameEn", value: "Adakan Dental Clinic" },
    { key: "phone", value: "+90 539 941 65 21" },
    { key: "whatsapp", value: "+90 539 941 65 21" },
    { key: "email", value: "info@adakandental.com" },
    { key: "address", value: "İncilipınar Mah., Şehitkamil / Gaziantep" },
    { key: "addressEn", value: "Incilipinar Mah., Sehitkamil / Gaziantep" },
    { key: "mapEmbedUrl", value: "" },
    { key: "instagram", value: "https://instagram.com/adakansoftware" },
    { key: "facebook", value: "https://facebook.com/adakansoftware" },
    { key: "twitter", value: "" },
    { key: "heroTitleTr", value: "Sağlıklı, Estetik ve Güvenli Gülüşler İçin Modern Diş Kliniği" },
    { key: "heroTitleEn", value: "Trusted Dental Care for Healthy Smiles" },
    {
      key: "heroSubtitleTr",
      value: "Uzman kadro, dijital randevu deneyimi ve kişiye özel tedavi planlarıyla ağız ve diş sağlığınız için yanınızdayız.",
    },
    {
      key: "heroSubtitleEn",
      value: "We provide attentive and transparent care across general dentistry, aesthetic treatments, and preventive oral health services.",
    },
    { key: "aboutTitleTr", value: "Adakan Dental Klinik Hakkında" },
    { key: "aboutTitleEn", value: "About Us" },
    {
      key: "aboutTextTr",
      value:
        "Adakan Dental Klinik, muayeneden tedavi planlamasına kadar her adımda güven veren, sakin ve şeffaf bir hasta deneyimi sunmak için kurgulanmıştır. Estetik diş hekimliği, implant planlaması, çocuk diş sağlığı ve koruyucu bakım süreçleri kişiye özel değerlendirme ile ele alınır.",
    },
    {
      key: "aboutTextEn",
      value:
        "At our clinic, each patient is welcomed with a careful examination, clear communication, and a treatment plan tailored to individual needs. Our goal is not only to solve the current complaint, but also to support long-term oral health through reliable care.",
    },
    { key: "seoTitleTr", value: "Adakan Dental Klinik | Modern Diş Kliniği Demo" },
    { key: "seoTitleEn", value: "Adakan" },
    {
      key: "seoDescTr",
      value: "Diş klinikleri için modern, mobil uyumlu, online randevu destekli web sitesi demosu.",
    },
    {
      key: "seoDescEn",
      value: "Adakan dental clinic official website for examinations, aesthetic treatments, and preventive care appointments.",
    },
    { key: "primaryColor", value: "#1a6b8a" },
    { key: "accentColor", value: "#f0a500" },
    { key: "logoUrl", value: "" },
    { key: "faviconUrl", value: "" },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log("Settings seeded");

  const services = [
    {
      slug: "implant",
      nameTr: "İmplant Tedavisi",
      nameEn: "Implant Treatment",
      shortDescTr: "Eksik dişler için planlı, estetik ve kalıcı çözüm",
      shortDescEn: "A reliable and lasting solution for missing teeth",
      descriptionTr:
        "İmplant tedavisi, eksik dişlerin yerine uzun ömürlü ve güvenli bir çözüm sunmak için planlanır. Kemik yapısı, estetik beklenti ve çiğneme konforu birlikte değerlendirilir.",
      descriptionEn:
        "A dental implant is an artificial root structure placed to replace missing teeth. It is a dependable treatment option that supports both aesthetics and chewing function.",
      iconName: "implant",
      durationMinutes: 60,
      order: 1,
    },
    {
      slug: "ortodonti",
      nameTr: "Ortodonti",
      nameEn: "Orthodontics",
      shortDescTr: "Diş teli ve şeffaf plak ile düzenli gülüş planlaması",
      shortDescEn: "Braces and clear aligner planning",
      descriptionTr:
        "Ortodonti tedavileri, dişlerin ve çene yapısının daha dengeli hale gelmesini hedefler. Tel ya da şeffaf plak seçenekleri kişiye özel planlanır.",
      descriptionEn:
        "Orthodontics focuses on improving the alignment of teeth and jaw structure. Braces or clear aligners can support both function and appearance.",
      iconName: "braces",
      durationMinutes: 45,
      order: 2,
    },
    {
      slug: "dis-beyazlatma",
      nameTr: "Diş Beyazlatma",
      nameEn: "Teeth Whitening",
      shortDescTr: "Daha parlak ve doğal bir gülüş için klinik beyazlatma uygulaması",
      shortDescEn: "In-clinic whitening for a brighter smile",
      descriptionTr:
        "Profesyonel diş beyazlatma uygulaması, diş tonunu daha canlı ve temiz bir görünüme taşımak için klinik ortamında kontrollü şekilde uygulanır.",
      descriptionEn:
        "Professional teeth whitening aims to improve tooth shade for a cleaner and brighter appearance. It is performed in a controlled clinical setting.",
      iconName: "sparkle",
      durationMinutes: 60,
      order: 3,
    },
    {
      slug: "kanal-tedavisi",
      nameTr: "Kanal Tedavisi",
      nameEn: "Root Canal Treatment",
      shortDescTr: "Doğal dişi korumaya odaklanan kök kanal tedavisi",
      shortDescEn: "Treatment focused on preserving the natural tooth",
      descriptionTr:
        "Kanal tedavisi, dişin iç kısmındaki enfekte ya da hasarlı dokuyu temizleyerek doğal dişi mümkün olduğunca korumayı hedefler.",
      descriptionEn:
        "Root canal treatment is a procedure designed to preserve the tooth by removing infected or damaged tissue from inside it.",
      iconName: "tooth",
      durationMinutes: 45,
      order: 4,
    },
    {
      slug: "protez",
      nameTr: "Protez Diş",
      nameEn: "Dental Prosthetics",
      shortDescTr: "Eksik dişler için tamamlayıcı protez çözümleri",
      shortDescEn: "Prosthetic solutions for missing teeth",
      descriptionTr:
        "Protez uygulamaları, eksik dişlerin tamamlanması ve çiğneme konforunun artırılması amacıyla planlanır. Tam ve kısmi seçenekler değerlendirilir.",
      descriptionEn:
        "Dental prosthetics are planned to restore missing teeth and improve chewing comfort. Both full and partial options can be evaluated.",
      iconName: "tooth",
      durationMinutes: 30,
      order: 5,
    },
    {
      slug: "cocuk-dis-hekimligi",
      nameTr: "Çocuk Diş Hekimliği",
      nameEn: "Pediatric Dentistry",
      shortDescTr: "Çocuklar için sakin ve koruyucu diş bakımı",
      shortDescEn: "Calm and preventive dental care for children",
      descriptionTr:
        "Çocuk diş hekimliği, süt dişlerinden kalıcı dişlere geçiş sürecine kadar çocukların ağız ve diş sağlığını korumaya odaklanır.",
      descriptionEn:
        "Pediatric dentistry focuses on protecting children's oral health from early teeth through the transition to permanent teeth.",
      iconName: "child",
      durationMinutes: 30,
      order: 6,
    },
  ];

  const createdServices: Record<string, string> = {};
  for (const service of services) {
    const created = await prisma.service.upsert({
      where: { slug: service.slug },
      update: service,
      create: service,
    });
    createdServices[service.slug] = created.id;
  }
  console.log("Services seeded");

  const specialists = [
    {
      slug: "dr-ayse-kaya",
      nameTr: "Dr. Ayşe Kaya",
      nameEn: "Dr. Ayse Kaya",
      titleTr: "Diş Hekimi, İmplantoloji Uzmanı",
      titleEn: "Dentist, Implantology Specialist",
      biographyTr:
        "Dr. Ayşe Kaya, implant planlaması ve estetik diş hekimliği alanlarında deneyimli bir klinik uzmandır. Açık bilgilendirme ve planlı tedavi sürecini önceliklendirir.",
      biographyEn:
        "Dr. Ayse Kaya is an experienced clinician in implant and aesthetic dentistry. She prioritizes clear communication and a structured treatment process.",
      photoUrl: "/images/specialists/doctor-ayse.jpg",
      order: 1,
    },
    {
      slug: "dr-mehmet-yilmaz",
      nameTr: "Dr. Mehmet Yılmaz",
      nameEn: "Dr. Mehmet Yilmaz",
      titleTr: "Ortodonti Uzmanı",
      titleEn: "Orthodontics Specialist",
      biographyTr:
        "Dr. Mehmet Yılmaz, ortodontik planlama, diş teli ve şeffaf plak süreçlerinde hastalarına düzenli takip ve anlaşılır yönlendirme sağlar.",
      biographyEn:
        "Dr. Mehmet Yilmaz provides structured follow-up and clear guidance across orthodontic planning, braces, and clear aligner treatments.",
      photoUrl: "/images/specialists/doctor-mehmet.jpg",
      order: 2,
    },
    {
      slug: "dr-fatma-demir",
      nameTr: "Dr. Fatma Demir",
      nameEn: "Dr. Fatma Demir",
      titleTr: "Çocuk Diş Hekimi",
      titleEn: "Pediatric Dentist",
      biographyTr:
        "Dr. Fatma Demir, çocuk hastalar için sakin, güven veren ve koruyucu bakım odaklı bir yaklaşım benimser.",
      biographyEn:
        "Dr. Fatma Demir takes a calm, reassuring, and preventive care-focused approach for pediatric patients.",
      photoUrl: "/images/specialists/doctor-fatma.jpg",
      order: 3,
    },
  ];

  const createdSpecialists: Record<string, string> = {};
  for (const specialist of specialists) {
    const created = await prisma.specialist.upsert({
      where: { slug: specialist.slug },
      update: specialist,
      create: specialist,
    });
    createdSpecialists[specialist.slug] = created.id;
  }
  console.log("Specialists seeded");

  const assignments = [
    { specialist: "dr-ayse-kaya", services: ["implant", "dis-beyazlatma", "kanal-tedavisi", "protez"] },
    { specialist: "dr-mehmet-yilmaz", services: ["ortodonti", "dis-beyazlatma"] },
    { specialist: "dr-fatma-demir", services: ["cocuk-dis-hekimligi", "kanal-tedavisi"] },
  ];

  for (const assignment of assignments) {
    const specialistId = createdSpecialists[assignment.specialist];
    for (const serviceSlug of assignment.services) {
      const serviceId = createdServices[serviceSlug];
      if (specialistId && serviceId) {
        await prisma.specialistService.upsert({
          where: { specialistId_serviceId: { specialistId, serviceId } },
          update: {},
          create: { specialistId, serviceId },
        });
      }
    }
  }
  console.log("Specialist-Service assignments seeded");

  const specialistIds = Object.values(createdSpecialists);
  for (const specialistId of specialistIds) {
    const hours = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isOpen: true },
      { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isOpen: true },
      { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isOpen: true },
      { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isOpen: true },
      { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isOpen: true },
      { dayOfWeek: 6, startTime: "09:00", endTime: "13:00", isOpen: true },
      { dayOfWeek: 0, startTime: "09:00", endTime: "18:00", isOpen: false },
    ];

    for (const hour of hours) {
      await prisma.workingHour.upsert({
        where: { specialistId_dayOfWeek: { specialistId, dayOfWeek: hour.dayOfWeek } },
        update: hour,
        create: { specialistId, ...hour, slotMinutes: 30 },
      });
    }
  }
  console.log("Working hours seeded");

  await prisma.fAQItem.deleteMany();
  const faqs = [
    {
      questionTr: "Online randevu nasıl alabilirim?",
      questionEn: "How do I make an appointment?",
      answerTr:
        "Web sitesi üzerinden hizmet, uzman ve uygun tarih seçerek online randevu talebi oluşturabilirsiniz. İsterseniz telefon veya WhatsApp üzerinden de bize ulaşabilirsiniz.",
      answerEn: "You can create an online request through the website, call by phone, or contact us via WhatsApp.",
      order: 1,
    },
    {
      questionTr: "Randevumu iptal edebilir miyim?",
      questionEn: "Can I cancel my appointment?",
      answerTr: "Evet. Aktif randevunuzu ad-soyad, telefon numarası ve randevu tarihiniz ile sistem üzerinden iptal edebilirsiniz.",
      answerEn: "Yes, you can cancel your active appointment through the system using your phone number and full name.",
      order: 2,
    },
    {
      questionTr: "Tedavi ücretleri ve ödeme seçenekleri hakkında nasıl bilgi alabilirim?",
      questionEn: "Do you provide treatment under insurance?",
      answerTr: "Muayene sonrası oluşturulan tedavi planına göre ücretlendirme paylaşılır. Detaylı bilgi için kliniğimizle doğrudan iletişime geçebilirsiniz.",
      answerEn: "Please contact the clinic directly for information about insurance and payment details.",
      order: 3,
    },
    {
      questionTr: "Diş beyazlatma kalıcı mıdır?",
      questionEn: "Is teeth whitening permanent?",
      answerTr: "Diş beyazlatma kalıcı bir işlem değildir; ancak kişisel bakım alışkanlıklarına göre etkisi uzun süre korunabilir.",
      answerEn: "Teeth whitening is not permanent, but the effect can be preserved for a long time depending on care habits.",
      order: 4,
    },
    {
      questionTr: "İmplant tedavisi ağrılı mıdır?",
      questionEn: "Is implant treatment painful?",
      answerTr: "İmplant uygulamaları lokal anestezi altında planlanır. Süreç öncesinde ve sonrasında konforu artırmak için ayrıntılı bilgilendirme yapılır.",
      answerEn: "Implant procedures are planned under local anesthesia. Detailed guidance is provided about comfort during and after treatment.",
      order: 5,
    },
  ];

  for (const faq of faqs) {
    await prisma.fAQItem.create({ data: faq }).catch(() => {});
  }
  console.log("FAQ seeded");

  await prisma.review.deleteMany();
  const reviews = [
    {
      patientName: "Elif Şahin",
      ratingStars: 5,
      contentTr: "İlk muayeneden itibaren süreç çok düzenli ilerledi. Tedavi planı ve seans içeriği açık şekilde anlatıldı.",
      contentEn: "The appointment flow was very organized. Every step of the treatment was explained clearly beforehand.",
      isApproved: true,
      isVisible: true,
    },
    {
      patientName: "Ahmet Çelik",
      ratingStars: 5,
      contentTr: "Klinik ortamı temiz ve sakindi. Hekim ve ekip, iletişim konusunda oldukça ilgiliydi.",
      contentEn: "The clinic environment was calm and clean. The clinician and team were very attentive in communication.",
      isApproved: true,
      isVisible: true,
    },
    {
      patientName: "Zeynep Arslan",
      ratingStars: 5,
      contentTr: "Online randevu talebi oluşturmak kolaydı. Kısa sürede dönüş sağlandı ve süreç net şekilde aktarıldı.",
      contentEn: "Creating an online appointment request was easy. The follow-up was quick and clear.",
      isApproved: true,
      isVisible: true,
    },
    {
      patientName: "Mustafa Öztürk",
      ratingStars: 4,
      contentTr: "Tedavi öncesi bilgilendirme güven vericiydi. Süreç planlı şekilde ilerledi ve kontrol randevuları düzenli hatırlatıldı.",
      contentEn: "The pre-treatment guidance was reassuring. The process moved forward in a planned way.",
      isApproved: true,
      isVisible: true,
    },
  ];

  for (const review of reviews) {
    await prisma.review.create({ data: review }).catch(() => {});
  }
  console.log("Reviews seeded");

  console.log("\nSeed completed successfully!");
  console.log(`Admin login ready for: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
