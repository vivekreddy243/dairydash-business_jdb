import { MessageCircle } from 'lucide-react';

export default function FloatingWhatsAppButton() {
  return (
    <a
      href="https://wa.me/919059516633?text=Hello%2C%20I%20need%20help%20with%20Jai%20Durga%20Bhavani%20Milk%20Center."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 z-40"
      title="Chat with us on WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
}
