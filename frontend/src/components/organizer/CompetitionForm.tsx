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
  const [dateErrors, setDateErrors] = useState<Record<string, string>>({});

  const validateDates = (name: string, value: string) => {
    const newDateErrors: Record<string, string> = { ...dateErrors };
    delete newDateErrors[name]; // Clear existing error for this field
    
    // Get timestamp values for comparison
    const regStartDate = name === 'reg_start_at' ? new Date(value).getTime() : 
                          formData.reg_start_at ? new Date(formData.reg_start_at).getTime() : null;
    const regEndDate = name === 'reg_end_at' ? new Date(value).getTime() : 
                        formData.reg_end_at ? new Date(formData.reg_end_at).getTime() : null;
    const compStartDate = name === 'comp_start_at' ? new Date(value).getTime() : 
                          formData.comp_start_at ? new Date(formData.comp_start_at).getTime() : null;
    const compEndDate = name === 'comp_end_at' ? new Date(value).getTime() : 
                        formData.comp_end_at ? new Date(formData.comp_end_at).getTime() : null;
    
    // Current time
    const now = new Date().getTime();
    
    // Validate current field
    if (name === 'reg_start_at') {
      if (regStartDate && regStartDate < now) {
        newDateErrors[name] = 'Дата начала регистрации не может быть в прошлом';
      }
      if (regStartDate && regEndDate && regStartDate >= regEndDate) {
        newDateErrors[name] = 'Дата начала регистрации должна быть раньше окончания';
      }
    } 
    else if (name === 'reg_end_at') {
      if (regEndDate && regStartDate && regEndDate <= regStartDate) {
        newDateErrors[name] = 'Дата окончания регистрации должна быть позже начала';
      }
      if (regEndDate && compStartDate && regEndDate > compStartDate) {
        newDateErrors[name] = 'Регистрация должна закончиться до начала соревнования';
      }
    }
    else if (name === 'comp_start_at') {
      if (compStartDate && regEndDate && compStartDate < regEndDate) {
        newDateErrors[name] = 'Соревнование не может начаться до окончания регистрации';
      }
      if (compStartDate && compEndDate && compStartDate >= compEndDate) {
        newDateErrors[name] = 'Дата начала соревнования должна быть раньше окончания';
      }
    }
    else if (name === 'comp_end_at') {
      if (compEndDate && compStartDate && compEndDate <= compStartDate) {
        newDateErrors[name] = 'Дата окончания соревнования должна быть позже начала';
      }
    }
    
    setDateErrors(newDateErrors);
    return Object.keys(newDateErrors).length === 0;
  };

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
          
          // Validate date relationships
          validateDates(name, value);
          
          setFormData(prev => ({ ...prev, [name]: value }));
        } catch (error) {
          // If there's an error parsing the date, don't update the form
          console.error('Invalid date input:', error);
        }
      } else {
        // If empty, just clear the field
        setFormData(prev => ({ ...prev, [name]: '' }));
        
        // Clear any errors for this field
        const newDateErrors = { ...dateErrors };
        delete newDateErrors[name];
        setDateErrors(newDateErrors);
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
    
    // Date validations
    if (!formData.reg_start_at || !formData.reg_end_at || !formData.comp_start_at || !formData.comp_end_at) {
      setError('Все даты должны быть заполнены');
      return;
    }
    
    // Validate all dates before submission
    let isValid = true;
    ['reg_start_at', 'reg_end_at', 'comp_start_at', 'comp_end_at'].forEach(field => {
      const fieldValue = formData[field as keyof typeof formData] as string;
      if (fieldValue && !validateDates(field, fieldValue)) {
        isValid = false;
      }
    });
    
    if (!isValid || Object.keys(dateErrors).length > 0) {
      setError('Пожалуйста, исправьте ошибки с датами перед сохранением');
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

  // Render date field with error handling
  const renderDateField = (id: string, label: string, name: keyof typeof formData) => (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        name={name}
        type="datetime-local"
        value={formData[name] || ''}
        onChange={handleChange}
        className={`date-input ${dateErrors[name] ? 'border-red-500' : ''}`}
        required
      />
      {dateErrors[name] && (
        <p className="text-xs text-red-500">{dateErrors[name]}</p>
      )}
    </div>
  );

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
            {renderDateField("reg_start_at", "Начало регистрации", "reg_start_at")}
            {renderDateField("reg_end_at", "Окончание регистрации", "reg_end_at")}
          </div>

          {/* Competition Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderDateField("comp_start_at", "Начало соревнования", "comp_start_at")}
            {renderDateField("comp_end_at", "Окончание соревнования", "comp_end_at")}
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