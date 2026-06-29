import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MapPin, Sparkles, Flame, Leaf, BookOpen } from "lucide-react";

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const countryMeta = {
  SN: { heritage: "Cuisine sénégalaise inspirée par les Wolof, Sérère et Peul.", ethnicity: "Wolof, Sérère, Peul", cuisine: "Riz, poisson, sauces arachide et légumes." },
  NG: { heritage: "Cuisine nigériane riche en épices, soupes et grillades.", ethnicity: "Yoruba, Igbo, Hausa", cuisine: "Jollof rice, soupes épaisses et brochettes suya." },
  GH: { heritage: "Cuisine ghanéenne marquée par les plats de rue et les sauces aux feuilles.", ethnicity: "Akan, Ewe, Ga", cuisine: "Riz, haricots, plantain, poissons et épices locales." },
  CI: { heritage: "Cuisine ivoirienne conviviale, centrée sur l'attiéké et les plats de rue.", ethnicity: "Baoulé, Bété, Akan", cuisine: "Attiéké, aloco, kedjenou et saveurs côtières." },
  ML: { heritage: "Cuisine malienne influencée par les peuples du Sahel et du fleuve Niger.", ethnicity: "Bambara, Peul, Songhai", cuisine: "Tô, sauce d'arachide, riz au gras et boulettes de poisson." },
  BF: { heritage: "Cuisine burkinabè simple et nourrissante, issue des traditions sahéliennes.", ethnicity: "Mossi, Fulani, Bobo", cuisine: "Tô de mil, sauce gombo, haricots et arachides grillées." },
  GN: { heritage: "Cuisine guinéenne marquée par l'arachide, les feuilles vertes et les viandes grillées.", ethnicity: "Soussou, Malinké, Peul", cuisine: "Sauce feuilles, riz, arachides et poissons fumés." },
  CM: { heritage: "Cuisine camerounaise plurielle, entre saveurs sahéliennes et équatoriales.", ethnicity: "Bamiléké, Bassa, Beti", cuisine: "Fufu, ndolé, brochettes suya et sauces aux arachides." },
  CD: { heritage: "Cuisine congolaise (RDC) riche en feuilles de manioc, poissons du fleuve et épices.", ethnicity: "Kongo, Luba, Mongo", cuisine: "Pondu, fufu, moambe et poissons grillés." },
  CG: { heritage: "Cuisine congolaise (Brazzaville) façonnée par le manioc, le poisson fumé et les sauces.", ethnicity: "Kongo, Teke, Mbochi", cuisine: "Fufu, saka saka, poissons et plats mijotés." },
  GA: { heritage: "Cuisine gabonaise centrée sur les produits de la forêt équatoriale et les sauces locales.", ethnicity: "Fang, Punu, Nzebi", cuisine: "Nyembwe, poissons grillés, manioc et feuilles vertes." },
  "RW-BI": { heritage: "Cuisine des Grands Lacs, simple et nutritive, à base de haricots et de banane plantain.", ethnicity: "Hutu, Tutsi, Twa", cuisine: "Ugali, haricots, isombe et brochettes." },
  MA: { heritage: "Cuisine marocaine raffinée, fruit de siècles de métissage berbère, arabe et andalou.", ethnicity: "Berbères, Arabes", cuisine: "Tagine, couscous, pastilla et thé à la menthe." },
  DZ: { heritage: "Cuisine algérienne généreuse, influencée par les traditions berbères et l'héritage ottoman.", ethnicity: "Berbères, Arabes", cuisine: "Couscous, chorba, msemen et makroud." },
  TN: { heritage: "Cuisine tunisienne épicée et colorée, mêlant influences méditerranéennes et sahariennes.", ethnicity: "Arabes, Berbères", cuisine: "Brik, couscous, harissa et lablabi." },
  LY: { heritage: "Cuisine libyenne au carrefour du Maghreb et du Sahara, simple et généreuse.", ethnicity: "Arabes, Berbères, Touaregs", cuisine: "Asida, bazin, couscous et viandes grillées." },
  MR: { heritage: "Cuisine mauritanienne du désert, centrée sur le thé, la viande et le mil.", ethnicity: "Maures, Haratines, Peul", cuisine: "Thiéboudienne, méchoui, lait caillé et dattes." },
  ET: { heritage: "Cuisine éthiopienne ancienne, servie sur l'injera, pain fermenté commun au partage.", ethnicity: "Oromo, Amhara, Tigrigna", cuisine: "Injera, wat, kitfo et épices berbéré." },
  KE: { heritage: "Cuisine kényane influencée par les cultures côtières swahili et les traditions pastorales.", ethnicity: "Kikuyu, Luo, Kamba", cuisine: "Ugali, nyama choma, sukuma wiki et chai." },
  TZ: { heritage: "Cuisine tanzanienne mêlant influences swahili, indiennes et africaines continentales.", ethnicity: "Sukuma, Chagga, Maasai", cuisine: "Ugali, pilau, mchuzi wa samaki et mandazi." },
  MZ: { heritage: "Cuisine mozambicaine aux accents portugais, indiens et africains, riche en fruits de mer.", ethnicity: "Makua, Tsonga, Shona", cuisine: "Matapa, piri-piri, camarão e xima." },
  ZA: { heritage: "Cuisine sud-africaine arc-en-ciel, fusion de traditions zulu, xhosa, malaise et boer.", ethnicity: "Zulu, Xhosa, Sotho", cuisine: "Braai, bobotie, biltong et pap." },
  ZW: { heritage: "Cuisine zimbabwéenne traditionnelle, centrée sur le maïs, les légumes verts et les haricots.", ethnicity: "Shona, Ndebele", cuisine: "Sadza, muriwo, nyama et matemba." },
  NA: { heritage: "Cuisine namibienne influencée par les traditions san, herero et coloniales allemandes.", ethnicity: "Ovambo, Herero, San", cuisine: "Braaivleis, kapana, oshifima et marula." },
  MG: { heritage: "Cuisine malgache unique, mélange d'influences africaines, malaisiennes et françaises.", ethnicity: "Merina, Betsileo, Sakalava", cuisine: "Romazava, ravitoto, vary amin'anana et mofo." },
};

const AfricanDishDetailPage = () => {
  const { countryCode, dishId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Chargement depuis le fichier statique — fonctionne sans backend
    axios.get("/plats_africains.json")
      .then((response) => setData(response.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const country = useMemo(() => {
    if (!data) return null;
    return data.regions
      .flatMap((region) => region.pays.map((pays) => ({ ...pays, region: region.region })))
      .find((pays) => pays.code.toLowerCase() === countryCode?.toLowerCase());
  }, [data, countryCode]);

  const dish = useMemo(() => {
    if (!country) return null;
    return country.plats.find((plat) => {
      const slug = slugify(plat.nom);
      const slugLocal = slugify(plat.nom_local || plat.nom);
      return slug === dishId || slugLocal === dishId;
    });
  }, [country, dishId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data || !country || !dish) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center px-6 py-8 rounded-3xl bg-white shadow-sm border border-stone-200">
          <h2 className="font-heading text-3xl font-bold text-stone-900">Plat introuvable</h2>
          <p className="mt-3 text-stone-500">Vérifiez que le pays et le plat existent bien dans le répertoire.</p>
          <Link to="/plats-africains">
            <Button variant="outline" className="mt-6">Retour à la carte</Button>
          </Link>
        </div>
      </div>
    );
  }

  const meta = countryMeta[country.code.toUpperCase()] || {
    heritage: "Cuisine locale riche en traditions culinaires.",
    ethnicity: "Multiethnique",
    cuisine: "Spécialités de riz, manioc et sauces épicées.",
  };

  return (
    <div className="min-h-screen bg-amber-50" data-testid="african-dish-detail-page">
      <div className="bg-white border-b border-stone-200">
        <div className="container-custom py-4">
          <Link to="/plats-africains" className="inline-flex items-center gap-2 text-stone-600 hover:text-amber-600">
            <ArrowLeft className="w-4 h-4" /> Retour aux plats africains
          </Link>
        </div>
      </div>

      <div className="container-custom py-12">
        <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-10">
          <div className="space-y-8">
            <section className="rounded-3xl bg-white p-8 shadow-sm border border-stone-200">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-amber-600">Origine</p>
                  <h1 className="font-heading text-4xl font-bold text-stone-900">{dish.nom}</h1>
                  <p className="text-stone-500 mt-2">{dish.nom_local}</p>
                </div>
                <Badge className="bg-amber-100 text-amber-700 border-0 text-sm px-4 py-2">{dish.type}</Badge>
              </div>
              <p className="mt-6 text-stone-600 leading-relaxed">{dish.description}</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-amber-50 p-6 border border-amber-100">
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-700">Pays</p>
                  <p className="mt-2 text-lg font-semibold text-stone-900">{country.pays}</p>
                  <p className="text-sm text-stone-500">{country.region}</p>
                </div>
                <div className="rounded-3xl bg-amber-50 p-6 border border-amber-100">
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-700">Statut</p>
                  <p className="mt-2 text-lg font-semibold text-stone-900">{dish.statut || "Traditionnel"}</p>
                  <p className="text-sm text-stone-500">Place culturelle et historique.</p>
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-5 h-5 text-amber-600" />
                    <h2 className="font-semibold text-lg text-stone-900">Détails du pays</h2>
                  </div>
                  <div className="space-y-3 text-stone-600">
                    <p><span className="font-semibold text-stone-900">Ethnies :</span> {meta.ethnicity}</p>
                    <p><span className="font-semibold text-stone-900">Cuisine :</span> {meta.cuisine}</p>
                    <p>{meta.heritage}</p>
                    <p className="mt-2"><span className="font-semibold text-stone-900">Plats associés :</span> {country.plats.slice(0, 3).map((item) => item.nom).join(', ')}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    <h2 className="font-semibold text-lg text-stone-900">Caractéristiques</h2>
                  </div>
                  <div className="space-y-3 text-stone-600">
                    <p><span className="font-semibold text-stone-900">Régime :</span> {dish.regime || "Omnivore"}</p>
                    {dish.ingredients_principaux && (
                      <p><span className="font-semibold text-stone-900">Ingrédients</span> : {dish.ingredients_principaux.join(', ')}</p>
                    )}
                    {dish.patrimoine && <p><span className="font-semibold text-stone-900">Patrimoine :</span> {dish.patrimoine}</p>}
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="rounded-3xl bg-white p-8 shadow-sm border border-stone-200">
              <div className="flex items-center gap-3 mb-5">
                <BookOpen className="w-5 h-5 text-amber-600" />
                <h2 className="font-semibold text-xl text-stone-900">Histoire culinaire</h2>
              </div>
              <p className="text-stone-600 leading-relaxed">
                {dish.description} Ce plat illustre la richesse des traditions du {country.pays}. Il est préparé avec des ingrédients locaux qui reflètent l'abondance de la région et la transmission intergénérationnelle des recettes.
              </p>
              <p className="mt-4 text-stone-600 leading-relaxed">
                {dish.statut ? `Statut : ${dish.statut}.` : "Classé parmi les plats traditionnels du pays."} Ce qui le rend si singulier : {dish.nom_local || dish.nom} incarne les saveurs authentiques de la cuisine africaine.
              </p>
            </section>
          </div>

          <aside className="space-y-6">
            <Card className="border-0 shadow-sm bg-amber-50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg text-stone-900 mb-3">Recettes à découvrir</h3>
                {country.plats.filter((item) => item.nom !== dish.nom).slice(0, 4).map((item) => (
                  <Link
                    key={item.nom}
                    to={`/plats-africains/${country.code.toLowerCase()}/${slugify(item.nom)}`}
                    className="block rounded-3xl bg-white p-4 mb-3 transition hover:bg-amber-50"
                  >
                    <p className="font-semibold text-stone-900">{item.nom}</p>
                    <p className="text-sm text-stone-500">{item.nom_local}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg text-stone-900 mb-3">Saviez-vous ?</h3>
                <p className="text-stone-600">La version locale de ce plat est souvent partagée lors de grandes occasions, cérémonies familiales ou festivités communautaires.</p>
                <p className="mt-3 text-stone-600">Dans plusieurs pays, la recette est adaptée selon les produits de saison et les traditions régionales.</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AfricanDishDetailPage;
