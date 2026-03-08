import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { Input } from '../components/Input';
import { supabase } from '../lib/supabase';

const COMPANY_NAME = 'Jai Durga Bhavani Milk Center';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    company_name: COMPANY_NAME,
    default_milk_price: 50,
    tax_rate: 0,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('settings').select('*').maybeSingle();

      if (error) throw error;
      if (data) {
        setFormData({
          company_name: COMPANY_NAME,
          default_milk_price: Number(data.default_milk_price),
          tax_rate: Number(data.tax_rate),
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...formData, company_name: COMPANY_NAME };

    try {
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('settings')
          .update(payload)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('settings').insert([payload]);

        if (error) throw error;
      }

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">Loading settings...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
        <p className="text-sm text-gray-500">Manage application configuration</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">
              Company Details
            </h4>
            <Input
              label="Company Name"
              value={COMPANY_NAME}
              disabled
              required
            />
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">
              Pricing Configuration
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Default Milk Price (₹ per Liter)"
                type="number"
                step="0.01"
                min="0"
                value={formData.default_milk_price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    default_milk_price: parseFloat(e.target.value),
                  })
                }
                required
              />
              <Input
                label="Tax Rate (%)"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.tax_rate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tax_rate: parseFloat(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">
              Delivery Rules
            </h4>
            <p className="text-sm text-gray-500">
              Delivery rules configuration coming soon
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">
              Notifications
            </h4>
            <p className="text-sm text-gray-500">
              Notification settings coming soon
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
