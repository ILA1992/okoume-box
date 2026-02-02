import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BoxCard from "@/components/BoxCard";
import { 
  ArrowRight, ChefHat, Heart, Leaf, Globe, 
  Sparkles, Clock, Truck, ShieldCheck 
} from "lucide-react";

const HomePage = () => {
  const [featuredBoxes, setFeaturedBoxes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBoxes = async () => {
      try {
        const response = await axios.get(`${API}/boxes/featured/list`);
        setFeaturedBoxes(response.data.slice(0, 3));
      } catch (error) {
        console.error("Error fetching boxes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBoxes();
  }, []);

  const features = [
    {
      icon: Heart,
      title: "Santé Avant Tout",
      description: "Des recettes équilibrées, peu grasses et peu sucrées pour une alimentation responsable."
    },
    {
      icon: Globe,
      title: "Toute l'Afrique",
      description: "Explorez les saveurs du Nord au Sud, de l'Est à l'Ouest du continent."
    },
    {
      icon: Leaf,
      title: "Ingrédients Frais",
      description: "Des produits de qualité, locaux et de saison livrés directement chez vous."
    },
    {
      icon: Sparkles,
      title: "IA Personnalisée",
      description: "Un assistant nutrition pour adapter vos plats selon vos besoins spécifiques."
    }
  ];

  const steps = [
    { icon: ChefHat, title: "Choisissez votre box", desc: "Découverte, Famille ou Solo" },
    { icon: Sparkles, title: "Personnalisez", desc: "Selon vos goûts et régime" },
    { icon: Truck, title: "Recevez chez vous", desc: "Livraison rapide et fraîche" },
    { icon: ShieldCheck, title: "Cuisinez et savourez", desc: "Recettes faciles incluses" }
  ];

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="hero-pattern relative overflow-hidden">
        <div className="container-custom py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-medium">
                <Leaf className="w-4 h-4" />
                Cuisine africaine saine et savoureuse
              </div>
              
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 leading-tight">
                Mangez les plats afro{" "}
                <span className="text-amber-600">autrement</span>
              </h1>
              
              <p className="text-lg text-stone-600 max-w-lg">
                Des box alimentaires africaines équilibrées, ni trop grasses ni trop sucrées, 
                mais suffisamment délicieuses pour vous faire découvrir de nouvelles saveurs.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/catalogue">
                  <Button 
                    className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
                    data-testid="hero-cta-btn"
                  >
                    Découvrir nos box
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/blog">
                  <Button 
                    variant="outline"
                    className="border-2 border-amber-600 text-amber-600 hover:bg-amber-50 rounded-full px-8 py-6 text-lg font-semibold"
                    data-testid="hero-blog-btn"
                  >
                    Voir les recettes
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-8">
                <div>
                  <p className="font-heading text-3xl font-bold text-amber-600">50+</p>
                  <p className="text-sm text-stone-500">Recettes</p>
                </div>
                <div>
                  <p className="font-heading text-3xl font-bold text-amber-600">4</p>
                  <p className="text-sm text-stone-500">Régions</p>
                </div>
                <div>
                  <p className="font-heading text-3xl font-bold text-amber-600">100%</p>
                  <p className="text-sm text-stone-500">Équilibré</p>
                </div>
              </div>
            </div>

            {/* Image Grid */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden shadow-lg hover-lift animate-fade-in stagger-1">
                    <img 
                      src="https://images.unsplash.com/photo-1604382440115-5f730e6ede1f?w=400&h=300&fit=crop" 
                      alt="Jollof Rice"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-lg hover-lift animate-fade-in stagger-3">
                    <img 
                      src="https://images.unsplash.com/photo-1651718543197-f567aeaa4fb0?w=400&h=400&fit=crop" 
                      alt="Tagine"
                      className="w-full h-56 object-cover"
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="rounded-2xl overflow-hidden shadow-lg hover-lift animate-fade-in stagger-2">
                    <img 
                      src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop" 
                      alt="African Dish"
                      className="w-full h-56 object-cover"
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-lg hover-lift animate-fade-in stagger-4">
                    <img 
                      src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop" 
                      alt="Healthy Bowl"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                </div>
              </div>
              
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-xl animate-fade-in stagger-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">Diététique</p>
                    <p className="text-sm text-stone-500">100% équilibré</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white" data-testid="features-section">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-stone-900 mb-4">
              Pourquoi choisir AfroBox ?
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Une nouvelle façon de découvrir la richesse culinaire africaine tout en prenant soin de votre santé.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <Card 
                key={idx} 
                className="bg-amber-50/50 border-0 hover:bg-amber-50 transition-colors group animate-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-200 transition-colors">
                    <feature.icon className="w-7 h-7 text-amber-600" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-stone-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-stone-600">
                    {feature.description}
                  </p>
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
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-stone-900 mb-2">
                Nos Box Populaires
              </h2>
              <p className="text-stone-600">
                Découvrez nos créations les plus appréciées
              </p>
            </div>
            <Link to="/catalogue" className="hidden md:block">
              <Button variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-100">
                Voir tout
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl h-96 skeleton" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredBoxes.map((box, idx) => (
                <div key={box.id} className="animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                  <BoxCard box={box} />
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12 md:hidden">
            <Link to="/catalogue">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-8">
                Voir toutes les box
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white" data-testid="how-it-works-section">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-stone-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              En 4 étapes simples, recevez vos box et cuisinez des plats africains sains.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative text-center animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-amber-200" />
                )}
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4 relative z-10">
                  <step.icon className="w-8 h-8 text-amber-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </div>
                <h3 className="font-heading text-lg font-semibold text-stone-900 mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-stone-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-amber-600 to-amber-500" data-testid="cta-section">
        <div className="container-custom text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à découvrir de nouvelles saveurs ?
          </h2>
          <p className="text-amber-100 mb-8 max-w-2xl mx-auto">
            Commencez votre voyage culinaire africain dès aujourd&apos;hui. 
            Personnalisez votre box avec notre assistant IA.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/catalogue">
              <Button 
                className="bg-white text-amber-600 hover:bg-amber-50 rounded-full px-8 py-6 text-lg font-semibold"
                data-testid="cta-catalogue-btn"
              >
                Voir les box
              </Button>
            </Link>
            <Button 
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 rounded-full px-8 py-6 text-lg font-semibold"
              onClick={() => document.querySelector('[data-testid="chat-toggle-btn"]')?.click()}
              data-testid="cta-chat-btn"
            >
              <Sparkles className="mr-2 w-5 h-5" />
              Personnaliser ma box
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
