import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Package, Clock, MapPin, Calendar, 
  ShoppingBag, ChefHat, ArrowRight 
} from "lucide-react";

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-purple-100 text-purple-700",
  shipped: "bg-cyan-100 text-cyan-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const statusLabels = {
  pending: "En attente",
  confirmed: "Confirmée",
  preparing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const ProfilePage = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${API}/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(response.data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  return (
    <div className="min-h-screen bg-amber-50" data-testid="profile-page">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="container-custom py-12">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-stone-900">
                {user?.name}
              </h1>
              <p className="text-stone-500">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-12">
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="bg-white border border-stone-200 p-1 rounded-full mb-8">
            <TabsTrigger 
              value="orders" 
              className="rounded-full data-[state=active]:bg-amber-600 data-[state=active]:text-white"
            >
              <Package className="w-4 h-4 mr-2" />
              Mes commandes
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="rounded-full data-[state=active]:bg-amber-600 data-[state=active]:text-white"
            >
              <User className="w-4 h-4 mr-2" />
              Mon profil
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl h-32 skeleton" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="w-10 h-10 text-amber-600" />
                  </div>
                  <h2 className="font-heading text-xl font-semibold text-stone-900 mb-2">
                    Aucune commande
                  </h2>
                  <p className="text-stone-500 mb-6">
                    Vous n&apos;avez pas encore passé de commande.
                  </p>
                  <Link to="/catalogue">
                    <Button className="bg-amber-600 hover:bg-amber-700 rounded-full px-8">
                      Découvrir nos box
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order, idx) => (
                  <Card 
                    key={order.id} 
                    className="border-0 shadow-sm animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                    data-testid={`order-${order.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                            <Package className="w-6 h-6 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm text-stone-500">
                              Commande #{order.id.slice(0, 8)}
                            </p>
                            <p className="font-heading text-lg font-semibold text-stone-900">
                              {order.total.toFixed(2)}€
                            </p>
                          </div>
                        </div>
                        <Badge className={`${statusColors[order.status]} border-0 font-medium`}>
                          {statusLabels[order.status]}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-stone-600">
                          <Calendar className="w-4 h-4 text-amber-500" />
                          <span>Livraison: {order.delivery_date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-stone-600">
                          <MapPin className="w-4 h-4 text-amber-500" />
                          <span className="truncate">{order.delivery_address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-stone-600">
                          <Clock className="w-4 h-4 text-amber-500" />
                          <span>{new Date(order.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {order.items.map((item) => (
                          <div 
                            key={item.box_id} 
                            className="flex items-center gap-2 bg-stone-50 rounded-full px-3 py-2 flex-shrink-0"
                          >
                            <img 
                              src={item.image_url} 
                              alt={item.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <span className="text-sm font-medium text-stone-700">
                              {item.name} x{item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <User className="w-5 h-5 text-amber-600" />
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-stone-500 mb-1">Nom complet</p>
                    <p className="font-medium text-stone-900">{user?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500 mb-1">Email</p>
                    <p className="font-medium text-stone-900">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500 mb-1">Membre depuis</p>
                    <p className="font-medium text-stone-900">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : '-'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white">
                <CardContent className="p-6">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
                    <ChefHat className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-stone-900 mb-2">
                    Besoin d&apos;aide ?
                  </h3>
                  <p className="text-stone-600 mb-4">
                    Notre assistant IA peut vous aider à personnaliser vos box 
                    selon vos besoins nutritionnels.
                  </p>
                  <Button 
                    variant="outline" 
                    className="border-amber-600 text-amber-600 hover:bg-amber-50"
                    onClick={() => document.querySelector('[data-testid="chat-toggle-btn"]')?.click()}
                  >
                    Parler à l&apos;assistant
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;
