// Opsi checklist untuk jenjang MI dengan Kurikulum Berbasis Cinta (KBC)
// Harus sinkron dengan CHECKLIST_OPTIONS di backend/server.py
export const CHECKLIST_OPTIONS = {
  dimensiProfilLulusan: [
    "Keimanan dan Ketakwaan terhadap Tuhan Yang Maha Esa",
    "Kewargaan",
    "Penalaran Kritis",
    "Kreativitas",
    "Kolaborasi",
    "Kemandirian",
    "Kesehatan",
    "Komunikasi",
  ],
  topikPancaCinta: [
    "Cinta Allah dan Rasul-Nya",
    "Cinta Ilmu",
    "Cinta Lingkungan",
    "Cinta Diri dan Sesama",
    "Cinta Tanah Air",
  ],
  lintasDisiplin: [
    "Al-Qur'an Hadis",
    "Akidah Akhlak",
    "Fikih",
    "SKI",
    "Bahasa Arab",
    "PPKn",
    "Bahasa Indonesia",
    "Matematika",
    "IPAS",
    "Seni Budaya",
    "PJOK",
    "Bahasa Inggris",
    "Muatan Lokal",
  ],
  praktikPedagogik: [
    "Problem Based Learning",
    "Project Based Learning",
    "Discovery Learning",
    "Inquiry Learning",
    "Cooperative Learning",
    "Contextual Teaching and Learning",
  ],
  metodePembelajaran: [
    "Ceramah",
    "Diskusi",
    "Tanya Jawab",
    "Demonstrasi",
    "Penugasan",
    "Eksperimen",
    "Simulasi",
    "Bermain Peran",
    "Karyawisata",
    "Drill/Latihan",
    "Kerja Kelompok",
  ],
  kemitraan: [
    "Orang Tua/Wali",
    "Komite Madrasah",
    "Masyarakat",
    "Tokoh Agama",
    "Instansi/Lembaga terkait",
    "Dunia Usaha & Industri",
    "Alumni",
  ],
};

export const CHECKLIST_KEYS = Object.keys(CHECKLIST_OPTIONS);

// Normalisasi nilai field checklist menjadi array of string
export function toArray(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === "string" && v.trim())
    return v.split(/[;,\n]/).map((s) => s.trim()).filter(Boolean);
  return [];
}
