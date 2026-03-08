import { X, Phone, Mail, Clock } from 'lucide-react';
import Button from './Button';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Contact Support</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex gap-3">
              <Phone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-lg font-semibold text-gray-900">+91 9921491249</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-semibold text-gray-900">support@dairydash.com</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Business Hours</p>
                <p className="text-lg font-semibold text-gray-900">6 AM - 10 PM IST</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href="tel:+919921491249"
              className="flex-1"
            >
              <Button className="w-full" onClick={onClose}>
                <Phone className="w-4 h-4 mr-2" />
                Call Now
              </Button>
            </a>
            <a
              href="https://wa.me/919921491249?text=Hello%2C%20I%20need%20help%20with%20DairyDash."
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="secondary" className="w-full" onClick={onClose}>
                WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
