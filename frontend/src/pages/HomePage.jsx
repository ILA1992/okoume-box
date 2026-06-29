import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ChefHat, Heart, Leaf, Globe, Sparkles, Clock, Truck, ShieldCheck, Users, Star, MapPin } from "lucide-react";

const COUNTRY_META = {
  gabon: {
    gradient: "from-[#009e60] to-[#fcd116]",
    bg: "bg-gradient-to-br from-[#009e60]/10 to-[#fcd116]/10",
    border: "border-[#009e60]/30",
    accent: "text-[#009e60]",
    dishes: ["Poulet Nyembwe", "Feuilles de Koko"],
    tagline: "Forêt équatoriale",
  },
  cameroun: {
    gradient: "from-[#007a5e] to-[#ce1126]",
    bg: "bg-gradient-to-br from-[#007a5e]/10 to-[#ce1126]/10",
    border: "border-[#ce1126]/30",
    accent: "text-[#ce1126]",
    dishes: ["Ndolé royal", "Poulet DG"],
    tagline: "Afrique en miniature",
  },
  "cote-ivoire": {
    gradient: "from-[#f77f00] to-[#009a44]",
    bg: "bg-gradient-to-br from-[#f77f00]/10 to-[#009a44]/10",
    border: "border-[#f77f00]/30",
    accent: "text-[#f77f00]",
    dishes: ["Garba & Attiéké", "Kédjénou"],
    tagline: "Terre de saveurs",
  },
  congo: {
    gradient: "from-[#009543] to-[#dc241f]",
    bg: "bg-gradient-to-br from-[#009543]/10 to-[#dc241f]/10",
    border: "border-[#009543]/30",
    accent: "text-[#009543]",
    dishes: ["Pondu / Saka Saka", "Liboke"],
    tagline: "Fleuve & traditions",
  },
  senegal: {
    gradient: "from-[#00853f] to-[#fdef42]",
    bg: "bg-gradient-to-br from-[#00853f]/10 to-[#fdef42]/10",
    border: "border-[#00853f]/30",
    accent: "text-[#00853f]",
    dishes: ["Thiéboudienne UNESCO", "Yassa poulet"],
    tagline: "Teranga & élégance",
  },
};

const HomePage = () => {
  const [featuredBoxes, setFeaturedBoxes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/boxes/featured/list`),
      axios.get(`${API}/countries`)
    ]).then(([boxRes, countryRes]) => {
      setFeaturedBoxes(boxRes.data.slice(0, 4));
      setCountries(countryRes.data.filter(c => c.id !== "multi"));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const features = [
    { icon: Heart, title: "Santé Avant Tout", description: "Recettes allégées, -40% de matières grasses" },
    { icon: Globe, title: "5 Pays d'Afrique", description: "Gabon, Cameroun, Côte d'Ivoire, Congo, Sénégal" },
    { icon: Leaf, title: "Ingrédients Authentiques", description: "Épices et produits importés directement" },
    { icon: Sparkles, title: "IA Personnalisée", description: "Adaptez selon votre régime et allergies" }
  ];

  const steps = [
    { icon: ChefHat, title: "Choisissez votre box", desc: "Par pays ou type de plat" },
    { icon: Sparkles, title: "Personnalisez", desc: "Avec notre assistant IA" },
    { icon: Truck, title: "Recevez chez vous", desc: "Livraison fraîcheur garantie" },
    { icon: ShieldCheck, title: "Cuisinez et savourez", desc: "Notices détaillées incluses" }
  ];

  const testimonials = [
    { name: "Aminata D.", city: "Paris", rating: 5, text: "La box Thiéboudienne m'a rappelé les repas chez ma grand-mère au Sénégal. Parfait !" },
    { name: "Jean-Pierre M.", city: "Lyon", rating: 5, text: "Le Ndolé était authentique et bien allégé. Ma femme et moi adorons !" },
    { name: "Sophie K.", city: "Bordeaux", rating: 5, text: "J'avais peur que ce soit trop épicé mais c'était parfaitement dosé. Super découverte !" },
  ];

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-orange-50">
        {/* Decorative African pattern background */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" aria-hidden="true">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="kente" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="30" height="30" fill="#d97706" />
                <rect x="30" y="30" width="30" height="30" fill="#d97706" />
                <rect x="10" y="10" width="10" height="10" fill="#92400e" />
                <rect x="40" y="40" width="10" height="10" fill="#92400e" />
                <rect x="0" y="30" width="10" height="10" fill="#92400e" />
                <rect x="30" y="0" width="10" height="10" fill="#92400e" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#kente)" />
          </svg>
        </div>

        <div className="container-custom py-20 md:py-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-7 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-5 py-2.5 rounded-full text-sm font-semibold border border-orange-200 shadow-sm">
                <Leaf className="w-4 h-4" />
                Cuisine africaine authentique & saine
              </div>
              <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-stone-900 leading-[1.1]">
                <span className="relative inline-block">
                  <span className="text-orange-600">Okoumé Box</span>
                  <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-orange-400 rounded-full" />
                </span>
                <br />
                <span className="text-stone-800">L'Afrique dans</span>
                <br />
                <span className="text-stone-800">votre assiette</span>
              </h1>
              <p className="text-xl text-stone-600 max-w-lg leading-relaxed font-medium">
                Box culinaires du Gabon, Cameroun, Côte d'Ivoire, Congo et Sénégal —
                revisitées healthy, <span className="text-orange-600 font-semibold">-40% de graisses</span>, 100% savoureux.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link to="/catalogue">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-10 py-7 text-lg font-bold shadow-xl shadow-orange-200 hover:shadow-orange-300 hover:scale-105 transition-all" data-testid="hero-cta-btn">
                    Découvrir nos box <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/plats-africains">
                  <Button variant="outline" className="border-2 border-orange-600 text-orange-600 hover:bg-orange-50 rounded-full px-10 py-7 text-lg font-semibold hover:scale-105 transition-all">
                    Plats africains
                  </Button>
                </Link>
              </div>
              {/* Stats rapides */}
              <div className="flex gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-orange-600">5</div>
                  <div className="text-sm text-stone-500 font-medium">Pays africains</div>
                </div>
                <div className="border-l border-stone-200 pl-8">
                  <div className="text-3xl font-bold text-orange-600">200+</div>
                  <div className="text-sm text-stone-500 font-medium">Avis 5 étoiles</div>
                </div>
                <div className="border-l border-stone-200 pl-8">
                  <div className="text-3xl font-bold text-orange-600">-40%</div>
                  <div className="text-sm text-stone-500 font-medium">De graisses</div>
                </div>
              </div>
              {/* Drapeaux pays */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-stone-500 font-medium">Nos pays :</span>
                <div className="flex gap-2 flex-wrap">
                  {countries.map(c => (
                    <button
                      key={c.id}
                      onClick={() => navigate(`/catalogue?country=${c.id}`)}
                      className="flex items-center gap-1.5 bg-white border border-stone-200 hover:border-orange-400 hover:bg-orange-50 rounded-full px-3 py-1.5 text-sm font-semibold text-stone-700 transition-all shadow-sm hover:shadow-md"
                      title={c.name}
                    >
                      <span className="text-base">{c.flag}</span>
                      <span className="hidden sm:inline">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grille d'images */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="rounded-3xl overflow-hidden shadow-2xl hover-lift animate-fade-in stagger-1 group">
                    <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&h=380&fit=crop&q=80" alt="Cuisine africaine" className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="rounded-3xl overflow-hidden shadow-2xl hover-lift animate-fade-in stagger-3 group">
                    <img src="https://images.unsplash.com/photo-1547592180-85f173990554?w=500&h=450&fit=crop&q=80" alt="Plat africain" className="w-full h-60 object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                </div>
                <div className="space-y-4 pt-10">
                  <div className="rounded-3xl overflow-hidden shadow-2xl hover-lift animate-fade-in stagger-2 group">
                    <img src="https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&h=450&fit=crop&q=80" alt="Riz au poisson" className="w-full h-60 object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="rounded-3xl overflow-hidden shadow-2xl hover-lift animate-fade-in stagger-4 group">
                    <img src="https://images.unsplash.com/photo-1567364816519-cbc8c6a73615?w=500&h=380&fit=crop&q=80" alt="Épices africaines" className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-xl animate-fade-in stagger-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">-40% de graisses</p>
                    <p className="text-sm text-stone-500">Recettes allégées</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-2 -right-2 bg-orange-600 text-white rounded-2xl p-3 shadow-lg animate-fade-in stagger-1">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-white" />
                  <span className="font-bold text-sm">4.9/5</span>
                </div>
                <p className="text-xs text-orange-100">200+ avis</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white" data-testid="features-section">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-stone-900 mb-4">Pourquoi Okoumé Box ?</h2>
            <p className="text-stone-600 max-w-2xl mx-auto">La vraie cuisine africaine, revisitée pour votre bien-être</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, idx) => (
              <Card key={idx} className="bg-orange-50/50 border-0 hover:bg-orange-50 hover:shadow-md transition-all group animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 group-hover:scale-110 transition-all">
                    <f.icon className="w-7 h-7 text-orange-600" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-stone-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-stone-600">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== NEW: Explorer par pays ===== */}
      <section className="py-20 bg-stone-900 relative overflow-hidden" data-testid="countries-section">
        {/* Decorative bg */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" aria-hidden="true">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="adinkra" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="40" cy="40" r="30" fill="none" stroke="#d97706" strokeWidth="2" />
                <circle cx="40" cy="40" r="20" fill="none" stroke="#d97706" strokeWidth="1" />
                <line x1="10" y1="40" x2="70" y2="40" stroke="#d97706" strokeWidth="1" />
                <line x1="40" y1="10" x2="40" y2="70" stroke="#d97706" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#adinkra)" />
          </svg>
        </div>

        <div className="container-custom relative z-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <MapPin className="w-4 h-4" />
              Voyage culinaire
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
              Explorer par pays
            </h2>
            <p className="text-stone-400 max-w-2xl mx-auto">
              Chaque pays, une identité culinaire unique. Cliquez sur un pays pour découvrir ses box.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {countries.map((country, idx) => {
              const meta = COUNTRY_META[country.id] || {};
              return (
                <button
                  key={country.id}
                  onClick={() => navigate(`/catalogue?country=${country.id}`)}
                  onMouseEnter={() => setHoveredCountry(country.id)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  className={`relative text-left rounded-2xl border p-5 transition-all duration-300 animate-fade-in group
                    ${meta.bg || "bg-white/5"} ${meta.border || "border-white/10"}
                    ${hoveredCountry === country.id ? "scale-105 shadow-2xl border-orange-400/60" : "hover:opacity-90"}
                  `}
                  style={{ animationDelay: `${idx * 80}ms` }}
                  data-testid={`country-card-${country.id}`}
                >
                  <div className="text-4xl mb-3">{country.flag}</div>
                  <h3 className="font-heading text-white font-bold text-base mb-1">{country.name}</h3>
                  <p className="text-xs text-stone-400 mb-3">{meta.tagline}</p>
                  <div className="space-y-1">
                    {(meta.dishes || []).map((dish, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                        <span className="text-xs text-stone-300">{dish}</span>
                      </div>
                    ))}
                  </div>
                  <div className={`absolute bottom-4 right-4 transition-all duration-300 ${hoveredCountry === country.id ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"}`}>
                    <ArrowRight className="w-4 h-4 text-orange-400" />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link to="/catalogue">
              <Button variant="outline" className="border-amber-500/50 text-orange-400 hover:bg-orange-500/10 hover:border-orange-400 rounded-full px-8 py-3">
                Voir toutes les box <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Boxes */}
      <section className="py-20 bg-orange-50" data-testid="featured-boxes-section">
        <div className="container-custom">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-stone-900 mb-2">Nos Box Signature</h2>
              <p className="text-stone-600">Plats emblématiques de chaque pays</p>
            </div>
            <Link to="/catalogue" className="hidden md:block">
              <Button variant="ghost" className="text-orange-600 hover:text-orange-700 hover:bg-orange-100">
                Voir les 11 box <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-80 skeleton" />)}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredBoxes.map((box, idx) => (
                <Link key={box.id} to={`/box/${box.id}`} className="block">
                  <Card className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border-0 animate-fade-in h-full" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="relative h-44 overflow-hidden">
                      <img src={box.image_url} alt={box.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <Badge className="absolute top-3 left-3 bg-white/95 text-stone-800 border-0 font-semibold">
                        {box.country_flag}
                      </Badge>
                      <div className="absolute bottom-3 right-3 bg-orange-600 text-white rounded-full px-3 py-1">
                        <span className="font-bold">{box.price.toFixed(0)}€</span>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-heading text-base font-bold text-stone-900 mb-1 group-hover:text-orange-600 transition-colors line-clamp-1">
                        {box.name.split("—")[0].trim()}
                      </h3>
                      <p className="text-xs text-stone-500 mb-3 line-clamp-2">{box.description.slice(0, 80)}...</p>
                      <div className="flex items-center gap-3 text-xs text-stone-600 mb-3">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-orange-500" />{box.prep_time}min</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3 text-orange-500" />{box.serves}p</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-orange-600 font-medium group-hover:underline">Voir la box</span>
                        <ArrowRight className="w-3 h-3 text-orange-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-8 md:hidden">
            <Link to="/catalogue">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-8">Voir toutes les box</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white" data-testid="how-it-works-section">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-stone-900 mb-4">Comment ça marche ?</h2>
            <p className="text-stone-500">Simple, rapide, délicieux</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative text-center animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                {idx < steps.length - 1 && <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-orange-200" />}
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4 relative z-10 hover:bg-orange-200 transition-colors">
                  <step.icon className="w-8 h-8 text-orange-600" />
                </div>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center">{idx + 1}</div>
                <h3 className="font-heading text-lg font-semibold text-stone-900 mb-1">{step.title}</h3>
                <p className="text-sm text-stone-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-orange-50" data-testid="testimonials-section">
        <div className="container-custom">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-stone-900 mb-4">Ils adorent Okoumé Box</h2>
            <p className="text-stone-600">Plus de 200 familles satisfaites</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <Card key={idx} className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-orange-400 text-orange-400" />
                    ))}
                  </div>
                  <p className="text-stone-700 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">{t.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900 text-sm">{t.name}</p>
                      <p className="text-xs text-stone-500">{t.city}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-orange-500 relative overflow-hidden" data-testid="cta-section">
        <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="kente2" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="20" height="20" fill="white" />
                <rect x="20" y="20" width="20" height="20" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#kente2)" />
          </svg>
        </div>
        <div className="container-custom text-center relative z-10">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">Prêt à voyager en Afrique ?</h2>
          <p className="text-orange-100 mb-8 max-w-2xl mx-auto">
            Découvrez les saveurs authentiques du continent. Notre assistant IA vous aide à personnaliser vos box.
          </p>
          <div classNa