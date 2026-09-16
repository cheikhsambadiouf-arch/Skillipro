// Profils fictifs utilisés pour démontrer la recherche publique (visiteurs sans compte).
// À remplacer/compléter par les vrais profils Talent une fois les inscriptions en place.
export interface DemoTalent {
  id: string;
  name: string;
  role: string;
  domain: string;
  location: string;
  years: number;
  skills: string[];
}

export const demoTalents: DemoTalent[] = [
  {
    id: "1",
    name: "Mamadou Diop",
    role: "Technicien électromécanicien",
    domain: "Électromécanique",
    location: "Thiès",
    years: 5,
    skills: ["Électricité", "Maintenance", "Électromécanique"],
  },
  {
    id: "2",
    name: "Fatou Ndiaye",
    role: "Technicienne de maintenance",
    domain: "Maintenance industrielle",
    location: "Dakar",
    years: 3,
    skills: ["Maintenance", "Mécanique", "HSE"],
  },
  {
    id: "3",
    name: "Ibrahima Sarr",
    role: "Électricien industriel",
    domain: "Électricité",
    location: "Thiès",
    years: 7,
    skills: ["Électricité", "Câblage", "Chantier"],
  },
  {
    id: "4",
    name: "Aïssatou Ba",
    role: "Développeuse web",
    domain: "Informatique",
    location: "Dakar",
    years: 4,
    skills: ["JavaScript", "React", "Node.js"],
  },
  {
    id: "5",
    name: "Cheikh Fall",
    role: "Comptable",
    domain: "Finance",
    location: "Saint-Louis",
    years: 6,
    skills: ["Comptabilité", "Fiscalité", "Excel"],
  },
  {
    id: "6",
    name: "Awa Diagne",
    role: "Couturière styliste",
    domain: "Artisanat & mode",
    location: "Kaolack",
    years: 8,
    skills: ["Couture", "Stylisme", "Broderie"],
  },
];
