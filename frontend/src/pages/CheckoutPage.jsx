import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Lock, ArrowLeft, CheckCircle } from "lucide-react";

const CheckoutPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    delivery_address: "",
    delivery_date: "",
    phone: "",
  });
  const [cardForm, setCardForm] = useState({
    number: "",
    name: "",
    expiry: "",
    cvc: "",
  });
  const [step, setStep] = useState(1); // 1 = livraison, 2 = paiement, 3 = confirmation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  const handleDeliverySubmit = (e) => {
    e.preventDefault();
    if (!form.delivery_address || !form.delivery_date || !form.phone) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Créer l'intent de paiement Stripe
      const intentRes = await axios.post(
        `${API}/payments/create-intent`,
        { delivery_address: form.delivery_address, delivery_date: form.delivery_date, phone: form.phone },
        { headers }
      );

      const { client_secret, order_id } = intentRes.data;

      // 2. Confirmer avec Stripe (si Stripe.js est chargé) ou simulation
      if (window.Stripe && client_secret) {
        const stripe = window.Stripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);
        const { error: stripeError } = await stripe.confirmCardPayment(client_secret, {
          payment_method: {
            card: { number: cardForm.number.replace(/\s/g, ""), exp_month: cardForm.expiry.split("/")[0], exp_year: cardForm.expiry.split("/")[1], cvc: cardForm.cvc },
            billing_details: { name: cardForm.name },
          },
        });
        if (stripeError) throw new Error(stripeError.message);
      }

      // 3. Confirmer la commande côté backend
      const confirmRes = await axios.post(
        `${API}/payments/confirm`,
        { order_id, payment_intent_id: client_secret?.split("_secret")[0] || "pi_simulated" },
        { headers }
      );

      setOrder(confirmRes.data);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Erreur lors du paiement.");
    } finally {
      setLoading(false);
    }
  };

  const formatCard = (val) => val.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
  const formatExpiry = (val) => val.replace(/\D/g, "").replace(/^(\d{2})(\d)/, "$1/$2").slice(0, 5);

  if (step === 3 && order) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
        <Card className="border-0 shadow-sm max-w-md w-full text-center">
          <CardContent className="p-10">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Commande confirmée !</h2>
            <p className="text-stone-500 mb-6">
              Merci {user?.name}. Votre commande <strong>#{order.id.slice(0, 8).toUpperCase()}</strong> a été enregistrée.
              Un email de confirmation vous sera envoyé.
            </p>
            <div className="bg-amber-50 rounded-2xl p-4 mb-6 text-left space-y-2">
              <p className="text-sm text-stone-600"><span className="font-medium">Livraison :</span> {order.delivery_date}</p>
              <p className="text-sm text-stone-600"><span className="font-medium">Adresse :</span> {order.delivery_address}</p>
              <p className="text-sm font-semibold text-orange-600">Total : {order.total?.toFixed(2)} €</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/profile")}>
                Mes commandes
              </Button>
              <Button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white" onClick={() => navigate("/catalogue")}>
                Continuer les achats
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 py-10 px-4" data-testid="checkout-page">
      <div className="max-w-lg mx-auto">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[{ n: 1, label: "Livraison" }, { n: 2, label: "Paiement" }].map(({ n, label }) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${step >= n ? "bg-orange-600 text-white" : "bg-stone-200 text-stone-400"}`}>{n}</div>
              <span className={`text-sm ${step >= n ? "text-stone-900 font-medium" : "text-stone-400"}`}>{label}</span>
              {n < 2 && <div className="flex-1 h-px bg-stone-300 w-8" />}
            </div>
          ))}
        </div>

        {/* Step 1 — Livraison */}
        {step === 1 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <button onClick={() => navigate("/cart")} className="text-stone-400 hover:text-stone-600">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="font-semibold text-stone-900 text-lg">Informations de livraison</h2>
              </div>
              <form onSubmit={handleDeliverySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Adresse de livraison *</label>
                  <textarea
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                    rows={3}
                    placeholder="123 rue des Saveurs, 75001 Paris"
                    value={form.delivery_address}
                    onChange={e => setForm({ ...form, delivery_address: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Date de livraison souhaitée *</label>
                  <input
                    type="date"
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    min={new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0]}
                    value={form.delivery_date}
                    onChange={e => setForm({ ...form, delivery_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Téléphone *</label>
                  <input
                    type="tel"
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="+33 6 12 34 56 78"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl py-5">
                  Continuer vers le paiement →
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2 — Paiement */}
        {step === 2 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <button onClick={() => setStep(1)} className="text-stone-400 hover:text-stone-600">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="font-semibold text-stone-900 text-lg">Paiement sécurisé</h2>
                <Lock className="w-4 h-4 text-green-500 ml-auto" />
              </div>

              {/* Test mode banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 text-xs text-blue-700">
                <strong>Mode test Stripe :</strong> Utilisez la carte <code>4242 4242 4242 4242</code>, date future, CVC 123.
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Numéro de carte</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                    <input
                      className="w-full border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 tracking-widest"
                      placeholder="4242 4242 4242 4242"
                      value={cardForm.number}
                      onChange={e => setCardForm({ ...cardForm, number: formatCard(e.target.value) })}
                      maxLength={19}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Nom sur la carte</label>
                  <input
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="LAILA ONGAYE"
                    value={cardForm.name}
                    onChange={e => setCardForm({ ...cardForm, name: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Expiration</label>
                    <input
                      className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="MM/AA"
                      value={cardForm.expiry}
                      onChange={e => setCardForm({ ...cardForm, expiry: formatExpiry(e.target.value) })}
                      maxLength={5}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">CVC</label>
                    <input
                      className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="123"
                      value={cardForm.cvc}
                      onChange={e => setCardForm({ ...cardForm, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      maxLength={4}
                      required
                    />
                  </div>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl py-5"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Traitement en cours…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Payer maintenant
                    </span>
                  )}
                </Button>
                <p className="text-center text-xs text-stone-400 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" /> Paiement sécurisé par Stripe SSL 256-bit
                </p>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
