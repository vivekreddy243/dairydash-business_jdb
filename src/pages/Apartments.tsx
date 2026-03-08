import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Card from '../components/Card';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Button from '../components/Button';
import { Input } from '../components/Input';
import { supabase } from '../lib/supabase';

interface Apartment {
  id: string;
  name: string;
  number_of_blocks: number;
  address: string;
  status: string;
}

export default function Apartments() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    number_of_blocks: 1,
    address: '',
  });

  useEffect(() => {
    fetchApartments();
  }, []);

  const fetchApartments = async () => {
    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApartments(data || []);
    } catch (error) {
      console.error('Error fetching apartments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingApartment) {
        const { error } = await supabase
          .from('apartments')
          .update(formData)
          .eq('id', editingApartment.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('apartments').insert([formData]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      setFormData({ name: '', number_of_blocks: 1, address: '' });
      setEditingApartment(null);
      fetchApartments();
    } catch (error) {
      console.error('Error saving apartment:', error);
      alert('Error saving apartment. Please try again.');
    }
  };

  const handleEdit = (apartment: Apartment) => {
    setEditingApartment(apartment);
    setFormData({
      name: apartment.name,
      number_of_blocks: apartment.number_of_blocks,
      address: apartment.address,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this apartment?')) return;

    try {
      const { error } = await supabase.from('apartments').delete().eq('id', id);

      if (error) throw error;
      fetchApartments();
    } catch (error) {
      console.error('Error deleting apartment:', error);
      alert('Error deleting apartment. Please try again.');
    }
  };

  const columns = [
    { key: 'name', label: 'Apartment Name' },
    { key: 'number_of_blocks', label: 'Number of Blocks' },
    { key: 'address', label: 'Address' },
    {
      key: 'status',
      label: 'Status',
      render: (value: unknown) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            value === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {(value as string).toUpperCase()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, row: Record<string, unknown>) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row as Apartment)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id as string)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">All Apartments</h3>
          <p className="text-sm text-gray-500">Manage your apartment complexes</p>
        </div>
        <Button
          onClick={() => {
            setEditingApartment(null);
            setFormData({ name: '', number_of_blocks: 1, address: '' });
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Apartment
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <Table columns={columns} data={apartments} />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingApartment(null);
        }}
        title={editingApartment ? 'Edit Apartment' : 'Add Apartment'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Apartment Name"
            placeholder="Enter apartment name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Number of Blocks"
            type="number"
            min="1"
            value={formData.number_of_blocks}
            onChange={(e) =>
              setFormData({ ...formData, number_of_blocks: parseInt(e.target.value) })
            }
            required
          />
          <Input
            label="Address"
            placeholder="Enter address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingApartment(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingApartment ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
