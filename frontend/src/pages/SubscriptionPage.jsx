import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Check, Crown, Sparkles, Gift, Truck, ChefHat, Pause, Play, X, MapPin, Phone } from "lucide-react";

const SubscriptionPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [mySubscription, setMySubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState([]);
  
  // Form state
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredCountries, setPreferredCountries] = useState([]);
  const [subscribing, setSubscribing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/subscriptions/plans`),
      axios.get(`${API}/countries`),
      user ? axios.get(`${API}/subscriptions/my`, { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve({ data: null })
    ]).then(([plansRes, countriesRes, subRes]) => {
      setPlans(plansRes.data);
      setCountries(countriesRes.data.filter(c => c.id !== "multi"));
      setMySubscription(subRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user, token]);

  const handleSelectPlan = (plan) => {
    if (!user) {
      toast.error("Veuillez vous connecter pour vous abonner");
      navigate("/auth");
      return;
    }
    setSelectedPlan(plan);
    setShowForm(true);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!deliveryAddress || !phone) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    setSubscribing(true);
    try {
      const response = await axios.post(`${API}/subscriptions`, {
        plan_id: selectedPlan.id,
        billing_cycle: billingCycle,
        delivery_address: deliveryAddress,
        phone: phone,
        preferred_countries: preferredCountries
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMySubscription(response.data);
      setShowForm(false);
      toast.success("Abonnement activé avec succès !");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'abonnement");
    } finally {
      setSubscribing(false);
    }
  };

  const handlePause = async () => {
    try {
      await axios.put(`${API}/subscriptions/pause`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setMySubscription({ ...mySubscription, status: "paused" });
      toast.success("Abonnement mis en pause");
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const handleResume = async () => {
    try {
      await axios.put(`${API}/subscriptions/resume`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setMySubscription({ ...mySubscription, status: "active" });
      toast.success("Abonnement réactivé");
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const handleCancel = async () => {
    if (!confirm("Êtes-vous sûr de vouloir annuler votre abonnement ?")) return;
    try {
      await axios.delete(`${API}/subscriptions/cancel`, { headers: { Authorization: `Bearer ${token}` } });
      setMySubscription(null);
      toast.success("Abonnement annulé");
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const getPrice = (plan) => {
    if (!plan) return 0;
    if (billingCycle === "monthly") return plan.price_monthly;
    if (billingCycle === "quarterly") return plan.price_quarterly;
    return plan.price_yearly;
  };

  const getSavings = (plan) => {
    if (!plan) return 0;
    if (billingCycle === "monthly") return 0;
    if (billingCycle === "quarterly") return Math.round((plan.price_monthly * 3 - plan.price_quarterly) * 100) / 100;
    return Math.round((plan.price_monthly * 12 - plan.price_yearly) * 100) / 100;
  };

  if (loading) return <div className="min-h-screen bg-orange-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-orange-50" data-testid="subscription-page">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white">
        <div className="container-custom py-16 text-center">
          <Badge className="bg-white/20 text-white border-0 mb-4">
            <Sparkles className="w-4 h-4 mr-1" /> Économisez jusqu'à 25%
          </Badge>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">Abonnement Okoumé Box</h1>
          <p className="text-lg text-orange-100 max-w-2xl mx-auto">
            Recevez chaque mois vos box de plats africains authentiques. Plus vous vous abonnez longtemps, plus vous économisez !
          </p>
        </div>
      </div>

      <div className="container-custom py-12">
        {/* Current Subscription */}
        {mySubscription && (
          <Card className="border-0 shadow-lg mb-12 bg-gradient-to-r from-green-50 to-emerald-50" data-testid="my-subscription">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="font-heading text-xl">Votre Abonnement {mySubscription.plan_name}</CardTitle>
                    <CardDescription>
                      {mySubscription.status === "active" ? "Actif" : "En pause"} • Prochaine livraison: {mySubscription.next_delivery_date}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={mySubscription.status === "active" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                  {mySubscription.status === "active" ? "Actif" : "En pause"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="text-sm"><strong>Cycle:</strong> {mySubscription.billing_cycle === "monthly" ? "Mensuel" : mySubscription.billing_cycle === "quarterly" ? "Trimestriel" : "Annuel"}</div>
                <div className="text-sm"><strong>Prix:</strong> {mySubscription.price.toFixed(2)}€</div>
                <div className="text-sm"><strong>Adresse:</strong> {mySubscription.delivery_address}</div>
              </div>
              <div className="flex gap-3 mt-6">
                {mySubscription.status === "active" ? (
                  <Button variant="outline" onClick={handlePause} className="border-orange-600 text-orange-600">
                    <Pause className="w-4 h-4 mr-2" />Mettre en pause
                  </Button>
                ) : (
                  <Button onClick={handleResume} className="bg-green-600 hover:bg-green-700">
                    <Play className="w-4 h-4 mr-2" />Réactiver
                  </Button>
                )}
                <Button variant="outline" onClick={handleCancel} className="border-red-300 text-red-600 hover:bg-red-50">
                  <X className="w-4 h-4 mr-2" />Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing Cycle Selector */}
        {!mySubscription && (
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-full p-1 shadow-sm border border-stone-200 inline-flex">
              <button onClick={() => setBillingCycle("monthly")} className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${billingCycle === "monthly" ? "bg-orange-600 text-white" : "text-stone-600 hover:text-orange-600"}`}>
                Mensuel
              </button>
              <button onClick={() => setBillingCycle("quarterly")} className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${billingCycle === "quarterly" ? "bg-orange-600 text-white" : "text-stone-600 hover:text-orange-600"}`}>
                Trimestriel <span className="text-xs ml-1">-10%</span>
              </button>
              <button onClick={() => setBillingCycle("yearly")} className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${billingCycle === "yearly" ? "bg-orange-600 text-white" : "text-stone-600 hover:text-orange-600"}`}>
                Annuel <span className="text-xs ml-1">-20%</span>
              </button>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        {!mySubscription && (
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative border-0 shadow-lg overflow-hidden transition-transform hover:scale-105 ${plan.is_popular ? "ring-2 ring-orange-500" : ""}`} data-testid={`plan-${plan.id}`}>
                {plan.is_popular && (
                  <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    POPULAIRE
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                    {plan.id === "decouverte" && <Gift className="w-8 h-8 text-orange-600" />}
                    {plan.id === "gourmet" && <ChefHat className="w-8 h-8 text-orange-600" />}
                    {plan.id === "famille" && <Crown className="w-8 h-8 text-orange-600" />}
                  </div>
                  <CardTitle className="font-heading text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    <span className="font-heading text-4xl font-bold text-orange-600">{getPrice(plan).toFixed(0)}€</span>
                    <span className="text-stone-500">/{billingCycle === "monthly" ? "mois" : billingCycle === "quarterly" ? "trim." : "an"}</span>
                    {getSavings(plan) > 0 && (
                      <p className="text-green-600 text-sm mt-1">Économisez {getSavings(plan).toFixed(0)}€</p>
                    )}
                  </div>
                  <ul className="space-y-3 text-left mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button onClick={() => handleSelectPlan(plan)} className={`w-full rounded-full py-6 ${plan.is_popular ? "bg-orange-600 hover:bg-orange-700" : "bg-stone-800 hover:bg-stone-900"}`} data-testid={`select-plan-${plan.id}`}>
                    Choisir ce plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-4 gap-6 mt-12">
          {[
            { icon: Truck, title: "Livraison gratuite", desc: "Partout en France" },
            { icon: Gift, title: "Cadeaux surprise", desc: "Avec l'abonnement Famille" },
            { icon: Pause, title: "Pause flexible", desc: "Suspendez quand vous voulez" },
            { icon: X, title: "Sans engagement", desc: "Annulez à tout moment" }
          ].map((f, i) => (
            <div key={i} className="text-center">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                <f.icon className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="font-semibold text-stone-900">{f.title}</h4>
              <p className="text-sm text-stone-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Finaliser l'abonnement {selectedPlan?.name}</DialogTitle>
            <DialogDescription>
              {selectedPlan ? `${getPrice(selectedPlan).toFixed(0)}€/${billingCycle === "monthly" ? "mois" : billingCycle === "quarterly" ? "trimestre" : "an"}` : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubscribe} className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-600" />Adresse de livraison</Label>
              <Input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="123 Rue des Saveurs, Paris" required data-testid="sub-address" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Phone className="w-4 h-4 text-orange-600" />Téléphone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" required data-testid="sub-phone" />
            </div>
            <div className="space-y-2">
              <Label>Pays préférés (optionnel)</Label>
              <div className="grid grid-cols-2 gap-2">
                {countries.map((c) => (
                  <div key={c.id} className="flex items-center space-x-2">
                    <Checkbox id={c.id} checked={preferredCountries.includes(c.id)} onCheckedChange={(checked) => {
                      if (checked) setPreferredCountries([...preferredCountries, c.id]);
                      else setPreferredCountries(preferredCountries.filter(p => p !== c.id));
                    }} />
                    <label htmlFor={c.id} className="text-sm">{c.flag} {c.name}</label>
                  </div>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 rounded-full py-6" disabled={subscribing} data-testid="confirm-subscription">
              {subscribing ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" /> : <Check className="w-5 h-5 mr-2" />}
              Confirmer l'abonnement
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPage;
