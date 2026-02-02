import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ChefHat, Heart, Leaf, Globe, Sparkles, Clock, Truck, ShieldCheck, Users, Flame } from "lucide-react";

const HomePage = () => {
  const [featuredBoxes, setFeaturedBoxes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/boxes/featured/list`),
      axios.get(`${API}/countries`)
    ]).then(([boxRes, countryRes]) => {
      setFeaturedBoxes(boxRes.data.slice(0, 4));
      setCountries(countryRes.data);
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

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="hero-pattern relative overflow-hidden">
        <div className="container-custom py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-medium">
                <Leaf className="w-4 h-4" />
                Cuisine africaine authentique & saine
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 leading-tight">
                Box Téré — <span className="text-amber-600">L'Afrique dans votre assiette</span>
              </h1>
              <p className="text-lg text-stone-600 max-w-lg">
                Des box de plats authentiques du Gabon, Cameroun, Côte d'Ivoire, Congo et Sénégal. 
                Revisités healthy : moins gras, moins sucrés, mais tout aussi savoureux !
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/catalogue">
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg" data-testid="hero-cta-btn">
                    Découvrir nos box <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/blog">
                  <Button variant="outline" className="border-2 border-amber-600 text-amber-600 hover:bg-amber-50 rounded-full px-8 py-6 text-lg font-semibold">
                    Voir les recettes
                  </Button>
                </Link>
              </div>
              {/* Country flags */}
              <div className="flex items-center gap-4 pt-6">
                <span className="text-sm text-stone-500">Nos pays :</span>
                <div className="flex gap-2">
                  {countries.filter(c => c.id !== "multi").map(c => (
                    <span key={c.id} className="text-2xl" title={c.name}>{c.flag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Image Grid */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden shadow-lg hover-lift animate-fade-in stagger-1">
                    <img src="https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop" alt="Nyembwe" className="w-full h-48 object-cover" />
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-lg hover-lift animate-fade-in stagger-3">
                    <img src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop" alt="Ndolé" className="w-full h-56 object-cover" />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="rounded-2xl overflow-hidden shadow-lg hover-lift animate-fade-in stagger-2">
                    <img src="https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop" alt="Thiéboudienne" className="w-full h-56 object-cover" />
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-lg hover-lift animate-fade-in stagger-4">
                    <img src="https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400&h=300&fit=crop" alt="Poulet DG" className="w-full h-48 object-cover" />
                  </div>
                </div>
              </div>
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
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white" data-testid="features-section">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-stone-900 mb-4">Pourquoi Box Téré ?</h2>
            <p className="text-stone-600 max-w-2xl mx-auto">La vraie cuisine africaine, revisitée pour votre bien-être</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, idx) => (
              <Card key={idx} className="bg-amber-50/50 border-0 hover:bg-amber-50 transition-colors group animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-200 transition-colors">
                    <f.icon className="w-7 h-7 text-amber-600" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-stone-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-stone-600">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Boxes */}
      <section className="py-20 bg-amber-50" data-testid="featured-boxes-section">
        <div className="container-custom">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-stone-900 mb-2">Nos Box Signature</h2>
              <p className="text-stone-600">Plats emblématiques de chaque pays</p>
            </div>
            <Link to="/catalogue" className="hidden md:block">
              <Button variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-100">
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
                <Card key={box.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all overflow-hidden border-0 animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="relative h-40 overflow-hidden">
                    <img src={box.image_url} alt={box.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <Badge className="absolute top-3 left-3 bg-white/95 text-stone-800 border-0 font-semibold">
                      {box.country_flag}
                    </Badge>
                    <div className="absolute bottom-3 right-3 bg-amber-600 text-white rounded-full px-3 py-1">
                      <span className="font-bold">{box.price.toFixed(0)}€</span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-heading text-base font-bold text-stone-900 mb-1 line-clamp-1">{box.name.split("—")[0]}</h3>
                    <p className="text-xs text-stone-500 mb-3 line-clamp-2">{box.description.slice(0, 80)}...</p>
                    <div className="flex items-center gap-3 text-xs text-stone-600 mb-3">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-500" />{box.prep_time}min</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3 text-amber-500" />{box.serves}p</span>
                    </div>
                    <Link to={`/box/${box.id}`}>
                      <Button size="sm" variant="ghost" className="w-full text-amber-600 hover:bg-amber-50">
                        Voir <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-8 md:hidden">
            <Link to="/catalogue">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-8">Voir toutes les box</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white" data-testid="how-it-works-section">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-stone-900 mb-4">Comment ça marche ?</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative text-center animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                {idx < steps.length - 1 && <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-amber-200" />}
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4 relative z-10">
                  <step.icon className="w-8 h-8 text-amber-600" />
                </div>
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">{idx + 1}</div>
                <h3 className="font-heading text-lg font-semibold text-stone-900 mb-1">{step.title}</h3>
                <p className="text-sm text-stone-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-amber-600 to-amber-500" data-testid="cta-section">
        <div className="container-custom text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">Prêt à voyager en Afrique ?</h2>
          <p className="text-amber-100 mb-8 max-w-2xl mx-auto">Découvrez les saveurs authentiques du continent. Notre assistant IA vous aide à personnaliser vos box.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/catalogue">
              <Button className="bg-white text-amber-600 hover:bg-amber-50 rounded-full px-8 py-6 text-lg font-semibold" data-testid="cta-catalogue-btn">
                Explorer les box
              </Button>
            </Link>
            <Button variant="outline" className="border-2 border-white text-white hover:bg-white/10 rounded-full px-8 py-6 text-lg font-semibold" onClick={() => document.querySelector('[data-testid="chat-toggle-btn"]')?.click()} data-testid="cta-chat-btn">
              <Sparkles className="mr-2 w-5 h-5" />Personnaliser
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
