import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Admin user
  const passwordHash = await bcrypt.hash("Admin123!", 12);
  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@klinik.com" },
    update: {},
    create: {
      email: "admin@klinik.com",
      passwordHash,
      name: "Klinik Yönetici",
    },
  });
  console.log("Admin created:", admin.email);

  // Site settings
  const settings = [
    { key: "clinicName", value: "DentaCare Kliniği" },
    { key: "clinicNameEn", value: "DentaCare Clinic" },
    { key: "phone", value: "+90 342 000 00 00" },
    { key: "whatsapp", value: "+905320000000" },
    { key: "email", value: "info@dentacare.com.tr" },
    { key: "address", value: "Şahinbey, Gaziantep, Türkiye" },
    { key: "addressEn", value: "Şahinbey, Gaziantep, Turkey" },
    { key: "mapEmbedUrl", value: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3186.0!2d37.3825!3d37.0662!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDAzJzU4LjMiTiAzN8KwMjInNTcuMCJF!5e0!3m2!1str!2str!4v1600000000000!5m2!1str!2str" },
    { key: "instagram", value: "https://instagram.com/dentacare" },
    { key: "facebook", value: "https://facebook.com/dentacare" },
    { key: "twitter", value: "" },
    { key: "heroTitleTr", value: "Sağlıklı Bir Gülüş İçin Doğru Adres" },
    { key: "heroTitleEn", value: "The Right Address for a Healthy Smile" },
    { key: "heroSubtitleTr", value: "Uzman ekibimiz ve modern teknolojimizle ağız ve diş sağlığınız için en iyi hizmeti sunuyoruz." },
    { key: "heroSubtitleEn", value: "We offer the best dental care with our expert team and modern technology." },
    { key: "aboutTitleTr", value: "Hakkımızda" },
    { key: "aboutTitleEn", value: "About Us" },
    { key: "aboutTextTr", value: "DentaCare Kliniği, 2010 yılından bu yana Gaziantep'te ağız ve diş sağlığı alanında hizmet vermektedir. Modern ekipmanlarımız ve deneyimli uzman kadromuzla hastalarımıza en yüksek kalitede tedavi sunmaktayız." },
    { key: "aboutTextEn", value: "DentaCare Clinic has been providing dental health services in Gaziantep since 2010. With our modern equipment and experienced specialist team, we offer the highest quality treatment to our patients." },
    { key: "seoTitleTr", value: "DentaCare Kliniği - Gaziantep Diş Kliniği" },
    { key: "seoTitleEn", value: "DentaCare Clinic - Gaziantep Dental Clinic" },
    { key: "seoDescTr", value: "Gaziantep'in en güvenilir diş kliniği. Online randevu alın, uzman hekimlerimizle tanışın." },
    { key: "seoDescEn", value: "Gaziantep's most trusted dental clinic. Book online appointments, meet our expert doctors." },
    { key: "primaryColor", value: "#1a6b8a" },
    { key: "accentColor", value: "#f0a500" },
    { key: "logoUrl", value: "" },
    { key: "faviconUrl", value: "" },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log("Settings seeded");

  // Services
  const services = [
    {
      slug: "implant",
      nameTr: "İmplant Tedavisi",
      nameEn: "Implant Treatment",
      shortDescTr: "Eksik dişleriniz için kalıcı çözüm",
      shortDescEn: "Permanent solution for missing teeth",
      descriptionTr: "Dental implant, kaybedilen dişin yerine titanyum vida kullanılarak yerleştirilen yapay bir diş köküdür. İmplant tedavisi, eksik dişlerinizi hem estetik hem de fonksiyonel olarak tamamlamanın en etkili yöntemidir.",
      descriptionEn: "A dental implant is an artificial tooth root placed using a titanium screw in place of a lost tooth. Implant treatment is the most effective method to complete your missing teeth both aesthetically and functionally.",
      iconName: "implant",
      durationMinutes: 60,
      order: 1,
    },
    {
      slug: "ortodonti",
      nameTr: "Ortodonti",
      nameEn: "Orthodontics",
      shortDescTr: "Diş teli ve şeffaf plak tedavileri",
      shortDescEn: "Braces and clear aligner treatments",
      descriptionTr: "Ortodonti, dişlerin ve çenelerin düzenlenmesiyle ilgilenen bir diş hekimliği dalıdır. Diş teli veya şeffaf plak kullanılarak dişler doğru konuma getirilir.",
      descriptionEn: "Orthodontics is a branch of dentistry dealing with the alignment of teeth and jaws. Teeth are brought into the correct position using braces or clear aligners.",
      iconName: "braces",
      durationMinutes: 45,
      order: 2,
    },
    {
      slug: "dis-beyazlatma",
      nameTr: "Diş Beyazlatma",
      nameEn: "Teeth Whitening",
      shortDescTr: "Profesyonel diş beyazlatma uygulamaları",
      shortDescEn: "Professional teeth whitening applications",
      descriptionTr: "Profesyonel diş beyazlatma, dişlerinizin rengini birkaç ton açarak daha parlak ve estetik bir görünüm kazandırır. Klinik ortamında uygulanan yöntemler, ev ürünlerine kıyasla çok daha etkili sonuçlar verir.",
      descriptionEn: "Professional teeth whitening brightens the color of your teeth by several shades, giving you a brighter and more aesthetic appearance. Methods applied in a clinical setting provide much more effective results compared to home products.",
      iconName: "sparkle",
      durationMinutes: 60,
      order: 3,
    },
    {
      slug: "kanal-tedavisi",
      nameTr: "Kanal Tedavisi",
      nameEn: "Root Canal Treatment",
      shortDescTr: "Dişinizi kurtarmak için kanal tedavisi",
      shortDescEn: "Root canal treatment to save your tooth",
      descriptionTr: "Kanal tedavisi, dişin içindeki iltihaplanmış veya enfekte olmuş pulpayı (sinir ve damarları) temizleyerek dişi kurtarmayı amaçlayan bir tedavi yöntemidir.",
      descriptionEn: "Root canal treatment is a treatment method that aims to save the tooth by cleaning the inflamed or infected pulp (nerves and vessels) inside the tooth.",
      iconName: "tooth",
      durationMinutes: 45,
      order: 4,
    },
    {
      slug: "protez",
      nameTr: "Protez Diş",
      nameEn: "Dental Prosthetics",
      shortDescTr: "Tam ve kısmi protez çözümleri",
      shortDescEn: "Full and partial denture solutions",
      descriptionTr: "Protez diş tedavisi, çeşitli nedenlerle kaybedilen dişlerin yerine takılan yapay dişlerdir. Tam veya kısmi protez seçenekleriyle kişinin çiğneme fonksiyonu ve estetik görünümü yeniden kazandırılır.",
      descriptionEn: "Dental prosthetics are artificial teeth placed to replace teeth lost for various reasons. With full or partial denture options, the person's chewing function and aesthetic appearance are restored.",
      iconName: "tooth",
      durationMinutes: 30,
      order: 5,
    },
    {
      slug: "cocuk-dis-hekimligi",
      nameTr: "Çocuk Diş Hekimliği",
      nameEn: "Pediatric Dentistry",
      shortDescTr: "Çocuklar için özel diş bakımı",
      shortDescEn: "Special dental care for children",
      descriptionTr: "Pedodonti (çocuk diş hekimliği), bebek dişlerinden kalıcı dişlere geçiş sürecine kadar çocukların ağız ve diş sağlığıyla ilgilenen bir diş hekimliği uzmanlık alanıdır.",
      descriptionEn: "Pedodontics (pediatric dentistry) is a specialized field of dentistry that deals with the oral and dental health of children from baby teeth to the transition to permanent teeth.",
      iconName: "child",
      durationMinutes: 30,
      order: 6,
    },
  ];

  const createdServices: Record<string, string> = {};
  for (const svc of services) {
    const created = await prisma.service.upsert({
      where: { slug: svc.slug },
      update: svc,
      create: svc,
    });
    createdServices[svc.slug] = created.id;
  }
  console.log("Services seeded");

  // Specialists
  const specialists = [
    {
      slug: "dr-ayse-kaya",
      nameTr: "Dr. Ayşe Kaya",
      nameEn: "Dr. Ayşe Kaya",
      titleTr: "Diş Hekimi, İmplantoloji Uzmanı",
      titleEn: "Dentist, Implantology Specialist",
      biographyTr: "Dr. Ayşe Kaya, Ankara Üniversitesi Diş Hekimliği Fakültesi mezunudur. 10 yılı aşkın deneyimiyle implant ve estetik diş hekimliği alanında uzmanlaşmıştır.",
      biographyEn: "Dr. Ayşe Kaya graduated from Ankara University Faculty of Dentistry. With more than 10 years of experience, she has specialized in implant and cosmetic dentistry.",
      photoUrl: "",
      order: 1,
    },
    {
      slug: "dr-mehmet-yilmaz",
      nameTr: "Dr. Mehmet Yılmaz",
      nameEn: "Dr. Mehmet Yılmaz",
      titleTr: "Ortodonti Uzmanı",
      titleEn: "Orthodontics Specialist",
      biographyTr: "Dr. Mehmet Yılmaz, İstanbul Üniversitesi Ortodonti Anabilim Dalı'ndan uzmanlığını almıştır. Diş teli ve şeffaf plak tedavilerinde geniş deneyime sahiptir.",
      biographyEn: "Dr. Mehmet Yılmaz received his specialization from Istanbul University Department of Orthodontics. He has extensive experience in braces and clear aligner treatments.",
      photoUrl: "",
      order: 2,
    },
    {
      slug: "dr-fatma-demir",
      nameTr: "Dr. Fatma Demir",
      nameEn: "Dr. Fatma Demir",
      titleTr: "Çocuk Diş Hekimi",
      titleEn: "Pediatric Dentist",
      biographyTr: "Dr. Fatma Demir, çocuk diş hekimliği alanında uzman olup küçük hastalarına güven ve konfor içinde en iyi tedaviyi sunmaktadır.",
      biographyEn: "Dr. Fatma Demir is specialized in pediatric dentistry and provides the best treatment to her young patients with confidence and comfort.",
      photoUrl: "",
      order: 3,
    },
  ];

  const createdSpecialists: Record<string, string> = {};
  for (const sp of specialists) {
    const created = await prisma.specialist.upsert({
      where: { slug: sp.slug },
      update: sp,
      create: sp,
    });
    createdSpecialists[sp.slug] = created.id;
  }
  console.log("Specialists seeded");

  // Specialist-Service assignments
  const assignments = [
    { specialist: "dr-ayse-kaya", services: ["implant", "dis-beyazlatma", "kanal-tedavisi", "protez"] },
    { specialist: "dr-mehmet-yilmaz", services: ["ortodonti", "dis-beyazlatma"] },
    { specialist: "dr-fatma-demir", services: ["cocuk-dis-hekimligi", "kanal-tedavisi"] },
  ];

  for (const a of assignments) {
    const specialistId = createdSpecialists[a.specialist];
    for (const svcSlug of a.services) {
      const serviceId = createdServices[svcSlug];
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

  // Working hours for each specialist
  // Mon-Fri 09:00-18:00, Sat 09:00-13:00, Sun closed
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
    for (const h of hours) {
      await prisma.workingHour.upsert({
        where: { specialistId_dayOfWeek: { specialistId, dayOfWeek: h.dayOfWeek } },
        update: h,
        create: { specialistId, ...h, slotMinutes: 30 },
      });
    }
  }
  console.log("Working hours seeded");

  // FAQ
  const faqs = [
    {
      questionTr: "Randevu nasıl alırım?",
      questionEn: "How do I make an appointment?",
      answerTr: "Web sitemiz üzerinden online randevu alabilir, telefonla arayabilir veya WhatsApp üzerinden mesaj gönderebilirsiniz.",
      answerEn: "You can book an online appointment through our website, call by phone, or send a message via WhatsApp.",
      order: 1,
    },
    {
      questionTr: "Randevumu iptal edebilir miyim?",
      questionEn: "Can I cancel my appointment?",
      answerTr: "Evet, randevunuzu en az 24 saat öncesinden telefonla veya WhatsApp üzerinden iptal edebilirsiniz.",
      answerEn: "Yes, you can cancel your appointment by phone or WhatsApp at least 24 hours in advance.",
      order: 2,
    },
    {
      questionTr: "Sigorta kapsamında tedavi yapıyor musunuz?",
      questionEn: "Do you provide treatment under insurance?",
      answerTr: "SGK anlaşmamız bulunmamakla birlikte, özel sağlık sigortalarıyla çalışmaktayız. Detaylı bilgi için kliniğimizi arayınız.",
      answerEn: "We do not have an SGK agreement, but we work with private health insurance. Please call our clinic for detailed information.",
      order: 3,
    },
    {
      questionTr: "Diş beyazlatma kalıcı mıdır?",
      questionEn: "Is teeth whitening permanent?",
      answerTr: "Diş beyazlatma kalıcı bir işlem değildir ancak doğru bakım ve beslenme alışkanlıklarıyla etkisi 1-2 yıl sürebilir.",
      answerEn: "Teeth whitening is not a permanent procedure, but with proper care and dietary habits, the effect can last 1-2 years.",
      order: 4,
    },
    {
      questionTr: "İmplant tedavisi ağrılı mıdır?",
      questionEn: "Is implant treatment painful?",
      answerTr: "İmplant tedavisi lokal anestezi altında yapılmaktadır. İşlem sırasında ağrı hissetmezsiniz. Sonrasında hafif bir rahatsızlık olabilir, ancak ağrı kesicilerle rahatlıkla kontrol altına alınabilir.",
      answerEn: "Implant treatment is performed under local anesthesia. You will not feel pain during the procedure. Afterwards, there may be mild discomfort, but it can be easily controlled with pain relievers.",
      order: 5,
    },
  ];

  for (const faq of faqs) {
    await prisma.fAQItem.create({ data: faq }).catch(() => {});
  }
  console.log("FAQ seeded");

  // Reviews
  const reviews = [
    {
      patientName: "Elif Şahin",
      ratingStars: 5,
      contentTr: "Harika bir klinik! Dr. Ayşe Hanım çok ilgili ve profesyonel. İmplant tedavim kusursuz geçti. Kesinlikle tavsiye ederim.",
      contentEn: "Great clinic! Dr. Ayşe is very attentive and professional. My implant treatment went flawlessly. I highly recommend it.",
      isApproved: true,
      isVisible: true,
    },
    {
      patientName: "Ahmet Çelik",
      ratingStars: 5,
      contentTr: "Çocuğumun ortodonti tedavisi için Dr. Mehmet Bey'e gittik. Çok sabırlı ve anlayışlı bir hoca. Kliniğin temizliği ve konforu da mükemmel.",
      contentEn: "We went to Dr. Mehmet for my child's orthodontic treatment. He is a very patient and understanding doctor. The clinic's cleanliness and comfort are also excellent.",
      isApproved: true,
      isVisible: true,
    },
    {
      patientName: "Zeynep Arslan",
      ratingStars: 5,
      contentTr: "Online randevu sistemi çok kullanışlı. Randevuma zamanında çağrıldım ve tedavim hızlı ve başarılı oldu. Teşekkürler!",
      contentEn: "The online appointment system is very convenient. I was called on time for my appointment and my treatment was quick and successful. Thank you!",
      isApproved: true,
      isVisible: true,
    },
    {
      patientName: "Mustafa Öztürk",
      ratingStars: 4,
      contentTr: "Profesyonel ekip, temiz ortam. Biraz bekleme oldu ama tedavi kalitesi çok iyiydi.",
      contentEn: "Professional team, clean environment. There was some waiting but the quality of treatment was very good.",
      isApproved: true,
      isVisible: true,
    },
  ];

  for (const review of reviews) {
    await prisma.review.create({ data: review }).catch(() => {});
  }
  console.log("Reviews seeded");

  console.log("\nSeed completed successfully!");
  console.log("Admin login: admin@klinik.com / Admin123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
