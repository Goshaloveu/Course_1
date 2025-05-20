import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompetitionDetail, CompetitionType } from '@/types/api';
import { formatDateForInput, parseInputDate } from '@/utils/dateUtils';

interface CompetitionFormProps {
  initialData?: Partial<CompetitionDetail>;
  onSubmit: (data: Partial<CompetitionDetail>) => Promise<void>;
  isLoading?: boolean;
}

export const CompetitionForm = ({ 
  initialData = {}, 
  onSubmit,
  isLoading = false
}: CompetitionFormProps) => {
  const [formData, setFormData] = useState<Partial<CompetitionDetail>>({
    title: '',
    description: '',
    type: 'individual',
    reg_start_at: '',
    reg_end_at: '',
    comp_start_at: '',
    comp_end_at: '',
    external_links_json: '',
    ...initialData
  });

  // Format initial date fields
  useEffect(() => {
    if (initialData) {
      const formattedDates: Partial<CompetitionDetail> = { ...initialData };
      
      // Format dates for display if they exist
      if (initialData.reg_start_at) {
        formattedDates.reg_start_at = formatDateForInput(initialData.reg_start_at);
      }
      if (initialData.reg_end_at) {
        formattedDates.reg_end_at = formatDateForInput(initialData.reg_end_at);
      }
      if (initialData.comp_start_at) {
        formattedDates.comp_start_at = formatDateForInput(initialData.comp_start_at);
      }
      if (initialData.comp_end_at) {
        formattedDates.comp_end_at = formatDateForInput(initialData.comp_end_at);
      }
      
      setFormData(prev => ({ ...prev, ...formattedDates }));
    }
  }, [initialData]);

  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for date fields
    if (['reg_start_at', 'reg_end_at', 'comp_start_at', 'comp_end_at'].includes(name)) {
      if (value) {
        try {
          // Validate that the input is a valid date
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            // Invalid date, don't update the form
            return;
          }
          setFormData(prev => ({ ...prev, [name]: value }));
        } catch (error) {
          // If there's an error parsing the date, don't update the form
          console.error('Invalid date input:', error);
        }
      } else {
        // If empty, just clear the field
        setFormData(prev => ({ ...prev, [name]: '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Simple validation
    if (!formData.title) {
      setError('Название соревнования обязательно');
      return;
    }

    try {
      // Format date fields for submission
      const formattedData = {
        ...formData,
        reg_start_at: formData.reg_start_at ? parseInputDate(formData.reg_start_at) : '',
        reg_end_at: formData.reg_end_at ? parseInputDate(formData.reg_end_at) : '',
        comp_start_at: formData.comp_start_at ? parseInputDate(formData.comp_start_at) : '',
        comp_end_at: formData.comp_end_at ? parseInputDate(formData.comp_end_at) : '',
      };

      await onSubmit(formattedData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Ошибка при сохранении соревнования. Пожалуйста, попробуйте снова.');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{initialData.id ? 'Редактирование соревнования' : 'Создание нового соревнования'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Название соревнования
            </label>
            <Input
              id="title"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              placeholder="Введите название соревнования"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Описание
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              placeholder="Введите описание соревнования"
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Competition Type */}
          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">
              Тип соревнования
            </label>
            <select
              id="type"
              name="type"
              value={formData.type || 'individual'}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="individual">Индивидуальное</option>
              <option value="team">Командное</option>
              <option value="other">Другое</option>
            </select>
          </div>

          {/* Registration Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="reg_start_at" className="text-sm font-medium">
                Начало регистрации
              </label>
              <Input
                id="reg_start_at"
                name="reg_start_at"
                type="datetime-local"
                value={formData.reg_start_at || ''}
                onChange={handleChange}
                className="date-input"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="reg_end_at" className="text-sm font-medium">
                Окончание регистрации
              </label>
              <Input
                id="reg_end_at"
                name="reg_end_at"
                type="datetime-local"
                value={formData.reg_end_at || ''}
                onChange={handleChange}
                className="date-input"
                required
              />
            </div>
          </div>

          {/* Competition Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="comp_start_at" className="text-sm font-medium">
                Начало соревнования
              </label>
              <Input
                id="comp_start_at"
                name="comp_start_at"
                type="datetime-local"
                value={formData.comp_start_at || ''}
                onChange={handleChange}
                className="date-input"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="comp_end_at" className="text-sm font-medium">
                Окончание соревнования
              </label>
              <Input
                id="comp_end_at"
                name="comp_end_at"
                type="datetime-local"
                value={formData.comp_end_at || ''}
                onChange={handleChange}
                className="date-input"
                required
              />
            </div>
          </div>

          {/* External Links */}
          <div className="space-y-2">
            <label htmlFor="external_links_json" className="text-sm font-medium">
              Внешние ссылки (JSON формат)
            </label>
            <Input
              id="external_links_json"
              name="external_links_json"
              value={formData.external_links_json || ''}
              onChange={handleChange}
              placeholder='{"telegram": "https://t.me/example", "website": "https://example.com"}'
            />
          </div>

          {/* Error message */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Submit button */}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Сохранение...' : initialData.id ? 'Сохранить изменения' : 'Создать соревнование'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}; 