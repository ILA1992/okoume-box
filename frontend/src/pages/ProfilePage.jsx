import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Package, Clock, MapPin, Calendar, ShoppingBag, ChefHat, ArrowRight } from "lucide-react";

const ProfilePage = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setOrders(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  const getStatusColor = (s) => s === "pending" ? "bg-amber-100 text-amber-700" : s === "confirmed" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700";
  const getStatusLabel = (s) => s === "pending" ? "En attente" : s === "confirmed" ? "Confirmée" : "Livrée";

  return (
    <div className="min-h-screen bg-amber-50" data-testid="profile-page">
      <div className="bg-white border-b border-stone-200">
        <div className="container-custom py-12">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-stone-900">{user?.name}</h1>
              <p className="text-stone-500">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-12">
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="bg-white border border-stone-200 p-1 rounded-full mb-8">
            <TabsTrigger value="orders" className="rounded-full data-[state=active]:bg-amber-600 data-[state=active]:text-white"><Package className="w-4 h-4 mr-2" />Mes commandes</TabsTrigger>
            <TabsTrigger value="profile" className="rounded-full data-[state=active]:bg-amber-600 data-[state=active]:text-white"><User className="w-4 h-4 mr-2" />Mon profil</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            {loading ? (
              <div className="bg-white rounded-2xl h-32 skeleton" />
            ) : orders.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-16 text-center">
                  <ShoppingBag className="w-10 h-10 text-amber-600 mx-auto mb-4" />
                  <h2 className="font-heading text-xl font-semibold mb-2">Aucune commande</h2>
                  <Link to="/catalogue"><Button className="bg-amber-600 hover:bg-amber-700 rounded-full px-8">Découvrir nos box</Button></Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <Card key={order.id} className="border-0 shadow-sm" data-testid={`order-${order.id}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-4">
                          <Package className="w-6 h-6 text-amber-600" />
                          <div>
                            <p className="text-sm text-stone-500">Commande #{order.id.slice(0, 8)}</p>
                            <p className="font-heading text-lg font-semibold">{order.total.toFixed(2)}€</p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} border-0`}>{getStatusLabel(order.status)}</Badge>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-amber-500" />{order.delivery_date}</div>
                        <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-amber-500" />{order.delivery_address}</div>
                        <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-amber-500" />{new Date(order.created_at).toLocaleDateString("fr-FR")}</div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {order.items.map(item => (
                          <div key={item.box_id} className="flex items-center gap-2 bg-stone-50 rounded-full px-3 py-2">
                            <img src={item.image_url} alt={item.name} className="w-8 h-8 rounded-full object-cover" />
                            <span className="text-sm">{item.name} x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="font-heading"><User className="w-5 h-5 inline mr-2 text-amber-600" />Informations</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div><p className="text-sm text-stone-500">Nom</p><p className="font-medium">{user?.name}</p></div>
                  <div><p className="text-sm text-stone-500">Email</p><p className="font-medium">{user?.email}</p></div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white">
                <CardContent className="p-6">
                  <ChefHat className="w-8 h-8 text-amber-600 mb-4" />
                  <h3 className="font-heading text-xl font-semibold mb-2">Besoin d'aide ?</h3>
                  <p className="text-stone-600 mb-4">Notre assistant IA peut personnaliser vos box.</p>
                  <Button variant="outline" className="border-amber-600 text-amber-600" onClick={() => document.querySelector('[data-testid="chat-toggle-btn"]')?.click()}>
                    Parler à l'assistant<ArrowRight className="w-4 h-4 ml-2" />
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
