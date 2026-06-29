import { useState, useRef, useEffect } from "react";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Sparkles, User } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const { user, token } = useAuth();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    if (!user) {
      toast.error("Veuillez vous connecter pour utiliser l'assistant");
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post(
        `${API}/chat`,
        { message: userMessage, session_id: sessionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSessionId(response.data.session_id);
      setMessages(prev => [...prev, { role: "assistant", content: response.data.response }]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Erreur de communication avec l'assistant");
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Désolé, je rencontre des difficultés. Veuillez réessayer." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const startChat = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Bonjour ! Je suis votre assistant nutrition Okoumé Box. Je peux vous aider à personnaliser votre box selon vos besoins (poids, taille, régime alimentaire, allergies...). Comment puis-je vous aider aujourd'hui ?"
      }]);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-[9999]" data-testid="chat-widget">
      {/* Chat Window */}
      {isOpen && (
        <div 
          className="absolute bottom-20 right-0 w-[360px] h-[500px] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-slide-in"
          data-testid="chat-window"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Assistant Okoumé Box</h3>
                <p className="text-xs text-orange-100">Personnalisez votre box</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              data-testid="close-chat-btn"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-orange-600" />
                    </div>
                  )}
                  <div 
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === "user" 
                        ? "bg-orange-600 text-white rounded-tr-sm" 
                        : "bg-stone-100 text-stone-700 rounded-tl-sm"
                    }`}
                    data-testid={`chat-message-${msg.role}`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-stone-600" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-orange-600 animate-pulse" />
                  </div>
                  <div className="bg-stone-100 p-3 rounded-2xl rounded-tl-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-stone-100">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={user ? "Écrivez votre message..." : "Connectez-vous pour discuter"}
                disabled={!user || loading}
                className="flex-1 rounded-full border-stone-200 focus:border-orange-500 focus:ring-orange-500/20"
                data-testid="chat-input"
              />
              <Button 
                type="submit" 
                disabled={!user || loading || !input.trim()}
                className="w-10 h-10 rounded-full bg-orange-600 hover:bg-orange-700 p-0"
                data-testid="send-message-btn"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={startChat}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${
          isOpen ? "bg-stone-700" : "bg-gradient-to-br from-orange-500 to-orange-700 animate-pulse-glow"
        }`}
        data-testid="chat-toggle-btn"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
