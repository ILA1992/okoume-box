import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, CalendarIcon, MapPin, Phone, CreditCard, Check } from "lucide-react";

const CartPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [phone, setPhone] = useState("");

  const fetchCart = () => {
    axios.get(`${API}/cart`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setCart(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCart(); }, [token]);

  const updateQuantity = (boxId, qty) => {
    axios.put(`${API}/cart/${boxId}?quantity=${qty}`, {}, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => fetchCart())
      .catch(() => toast.error("Erreur"));
  };

  const removeItem = (boxId) => {
    axios.delete(`${API}/cart/${boxId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => { fetchCart(); toast.success("Supprimé"); })
      .catch(() => toast.error("Erreur"));
  };

  const handleOrder = (e) => {
    e.preventDefault();
    if (!deliveryDate || !deliveryAddress || !phone) { toast.error("Remplissez tous les champs"); return; }
    setOrdering(true);
    axios.post(`${API}/orders`, { delivery_address: deliveryAddress, delivery_date: format(deliveryDate, "yyyy-MM-dd"), phone }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => { toast.success("Commande passée !"); navigate("/profile"); })
      .catch(() => toast.error("Erreur"))
      .finally(() => setOrdering(false));
  };

  if (loading) return <div className="min-h-screen bg-amber-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-amber-50" data-testid="cart-page">
      <div className="bg-white border-b border-stone-200">
        <div className="container-custom py-4">
          <Link to="/catalogue" className="inline-flex items-center gap-2 text-stone-600 hover:text-amber-600"><ArrowLeft className="w-4 h-4" />Continuer mes achats</Link>
        </div>
      </div>

      <div className="container-custom py-12">
        <h1 className="font-heading text-3xl font-bold text-stone-900 mb-8">Mon Panier</h1>

        {cart.items.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-20 text-center">
              <ShoppingCart className="w-10 h-10 text-amber-600 mx-auto mb-4" />
              <h2 className="font-heading text-xl font-semibold mb-2">Panier vide</h2>
              <Link to="/catalogue"><Button className="bg-amber-600 hover:bg-amber-700 rounded-full px-8">Voir les box</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map(item => (
                <Card key={item.box_id} className="border-0 shadow-sm" data-testid={`cart-item-${item.box_id}`}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img src={item.image_url} alt={item.name} className="w-24 h-24 rounded-xl object-cover" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-heading font-semibold">{item.name}</h3>
                          <Button variant="ghost" size="icon" className="text-stone-400 hover:text-red-500" onClick={() => removeItem(item.box_id)} data-testid={`remove-item-${item.box_id}`}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                        <p className="font-heading text-lg font-bold text-amber-600 mb-3">{item.price.toFixed(2)}€</p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-stone-200 rounded-full">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item.box_id, item.quantity - 1)} disabled={item.quantity <= 1}><Minus className="w-4 h-4" /></Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item.box_id, item.quantity + 1)}><Plus className="w-4 h-4" /></Button>
                          </div>
                          <span className="text-sm text-stone-500">Total: <strong>{(item.price * item.quantity).toFixed(2)}€</strong></span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <Card className="border-0 shadow-sm sticky top-24">
                <CardHeader><CardTitle className="font-heading">Récapitulatif</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between"><span>Sous-total</span><span>{cart.total.toFixed(2)}€</span></div>
                  <div className="flex justify-between"><span>Livraison</span><span className="text-green-600">Gratuite</span></div>
                  <div className="border-t pt-4 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-heading text-2xl font-bold text-amber-600">{cart.total.toFixed(2)}€</span>
                  </div>

                  {!showCheckout ? (
                    <Button className="w-full bg-amber-600 hover:bg-amber-700 rounded-full py-6" onClick={() => setShowCheckout(true)} data-testid="proceed-checkout-btn"><CreditCard className="w-5 h-5 mr-2" />Commander</Button>
                  ) : (
                    <form onSubmit={handleOrder} className="space-y-4 pt-4 border-t">
                      <div><Label><MapPin className="w-4 h-4 inline mr-1 text-amber-600" />Adresse</Label><Input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} required data-testid="delivery-address-input" /></div>
                      <div><Label><Phone className="w-4 h-4 inline mr-1 text-amber-600" />Téléphone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} required data-testid="phone-input" /></div>
                      <div><Label><CalendarIcon className="w-4 h-4 inline mr-1 text-amber-600" />Date</Label>
                        <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start" data-testid="delivery-date-btn">{deliveryDate ? format(deliveryDate, "PPP", { locale: fr }) : "Choisir"}</Button></PopoverTrigger>
                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={deliveryDate} onSelect={setDeliveryDate} disabled={d => d < new Date()} /></PopoverContent>
                        </Popover>
                      </div>
                      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 rounded-full py-6" disabled={ordering} data-testid="confirm-order-btn">{ordering ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" /> : <Check className="w-5 h-5 mr-2" />}Confirmer</Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
