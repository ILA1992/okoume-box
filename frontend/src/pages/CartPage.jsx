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
import { 
  ShoppingCart, Trash2, Plus, Minus, ArrowLeft, 
  CalendarIcon, MapPin, Phone, CreditCard, Check 
} from "lucide-react";

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

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(response.data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [token]);

  const updateQuantity = async (boxId, newQuantity) => {
    try {
      await axios.put(
        `${API}/cart/${boxId}?quantity=${newQuantity}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const removeItem = async (boxId) => {
    try {
      await axios.delete(`${API}/cart/${boxId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCart();
      toast.success("Article supprimé du panier");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    
    if (!deliveryDate || !deliveryAddress || !phone) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setOrdering(true);
    try {
      await axios.post(
        `${API}/orders`,
        {
          delivery_address: deliveryAddress,
          delivery_date: format(deliveryDate, "yyyy-MM-dd"),
          phone: phone
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Commande passée avec succès !");
      navigate("/profile");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Erreur lors de la commande");
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50" data-testid="cart-page">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="container-custom py-4">
          <Link 
            to="/catalogue" 
            className="inline-flex items-center gap-2 text-stone-600 hover:text-amber-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Continuer mes achats
          </Link>
        </div>
      </div>

      <div className="container-custom py-12">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-stone-900 mb-8">
          Mon Panier
        </h1>

        {cart.items.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-10 h-10 text-amber-600" />
              </div>
              <h2 className="font-heading text-xl font-semibold text-stone-900 mb-2">
                Votre panier est vide
              </h2>
              <p className="text-stone-500 mb-6">
                Découvrez nos délicieuses box africaines !
              </p>
              <Link to="/catalogue">
                <Button className="bg-amber-600 hover:bg-amber-700 rounded-full px-8">
                  Voir les box
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <Card key={item.box_id} className="border-0 shadow-sm" data-testid={`cart-item-${item.box_id}`}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-heading font-semibold text-stone-900">
                            {item.name}
                          </h3>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-stone-400 hover:text-red-500 -mt-1 -mr-2"
                            onClick={() => removeItem(item.box_id)}
                            data-testid={`remove-item-${item.box_id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="font-heading text-lg font-bold text-amber-600 mb-3">
                          {item.price.toFixed(2)}€
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-stone-200 rounded-full">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-full"
                              onClick={() => updateQuantity(item.box_id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-full"
                              onClick={() => updateQuantity(item.box_id, item.quantity + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <span className="text-sm text-stone-500">
                            Total: <strong className="text-stone-900">{(item.price * item.quantity).toFixed(2)}€</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="border-0 shadow-sm sticky top-24">
                <CardHeader>
                  <CardTitle className="font-heading">Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-stone-600">
                    <span>Sous-total</span>
                    <span>{cart.total.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Livraison</span>
                    <span className="text-green-600">Gratuite</span>
                  </div>
                  <div className="border-t border-stone-200 pt-4">
                    <div className="flex justify-between">
                      <span className="font-heading font-semibold text-stone-900">Total</span>
                      <span className="font-heading text-2xl font-bold text-amber-600">
                        {cart.total.toFixed(2)}€
                      </span>
                    </div>
                  </div>

                  {!showCheckout ? (
                    <Button 
                      className="w-full bg-amber-600 hover:bg-amber-700 rounded-full py-6 text-lg"
                      onClick={() => setShowCheckout(true)}
                      data-testid="proceed-checkout-btn"
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      Passer commande
                    </Button>
                  ) : (
                    <form onSubmit={handleOrder} className="space-y-4 pt-4 border-t border-stone-200">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-amber-600" />
                          Adresse de livraison
                        </Label>
                        <Input 
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="123 Rue de la Paix, Paris"
                          required
                          className="border-stone-200 focus:border-amber-500"
                          data-testid="delivery-address-input"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-amber-600" />
                          Téléphone
                        </Label>
                        <Input 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+33 6 12 34 56 78"
                          required
                          className="border-stone-200 focus:border-amber-500"
                          data-testid="phone-input"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-amber-600" />
                          Date de livraison
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="w-full justify-start text-left font-normal border-stone-200"
                              data-testid="delivery-date-btn"
                            >
                              {deliveryDate ? (
                                format(deliveryDate, "PPP", { locale: fr })
                              ) : (
                                <span className="text-stone-500">Choisir une date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={deliveryDate}
                              onSelect={setDeliveryDate}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <Button 
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 rounded-full py-6"
                        disabled={ordering}
                        data-testid="confirm-order-btn"
                      >
                        {ordering ? (
                          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                        ) : (
                          <Check className="w-5 h-5 mr-2" />
                        )}
                        Confirmer la commande
                      </Button>
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
