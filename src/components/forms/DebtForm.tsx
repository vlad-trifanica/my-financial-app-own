import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Debt, DEBT_CATEGORIES } from '@/types/financial';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from '@/components/ui/form';
import { v4 as uuidv4 } from 'uuid';
import { AVAILABLE_CURRENCIES } from '@/lib/utils';

interface DebtFormProps {
  onSubmit: (debt: Debt) => void;
  onCancel: () => void;
  initialDebt?: Debt;
}

// Use currency codes from the centralized list
const CURRENCY_CODES = AVAILABLE_CURRENCIES.map(currency => currency.code);

// Define validation schema using zod
const debtFormSchema = z.object({
  name: z.string()
    .min(1, 'Debt name is required')
    .max(100, 'Debt name must be less than 100 characters'),
  category: z.enum(['credit_card', 'student_loan', 'mortgage', 'auto_loan', 'personal_loan', 'medical_debt', 'tax_debt', 'other'], {
    required_error: 'Please select a category',
  }),
  value: z.coerce.number()
    .gt(0, 'Value must be greater than 0')
    .transform(val => Number(val.toFixed(2))),
  currency: z.string({
    required_error: 'Please select a currency',
  }),
  comments: z.string().optional(),
});

type DebtFormValues = z.infer<typeof debtFormSchema>;

const formatCurrency = (value: number): string => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const DebtForm: React.FC<DebtFormProps> = ({ onSubmit, onCancel, initialDebt }) => {
  // Helper to ensure the category is one of the allowed values
  const getValidCategory = (category?: string): 'credit_card' | 'student_loan' | 'mortgage' | 'auto_loan' | 'personal_loan' | 'medical_debt' | 'tax_debt' | 'other' => {
    if (!category || !DEBT_CATEGORIES.includes(category as any)) {
      return 'other';
    }
    return category as any;
  };

  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtFormSchema),
    defaultValues: {
      name: initialDebt?.name || '',
      category: getValidCategory(initialDebt?.category),
      value: initialDebt?.value || undefined,
      currency: initialDebt?.currency || 'USD',
      comments: initialDebt?.comments || '',
    },
  });

  // Reset form when initialDebt changes
  useEffect(() => {
    if (initialDebt) {
      form.reset({
        name: initialDebt.name,
        category: getValidCategory(initialDebt.category),
        value: initialDebt.value,
        currency: initialDebt.currency,
        comments: initialDebt.comments || '',
      });
    }
  }, [initialDebt, form]);

  const handleSubmit = (values: DebtFormValues) => {
    if (initialDebt) {
      // If we're editing, maintain the original ID and date_added
      const updatedDebt: Debt = {
        ...initialDebt,
        ...values,
        last_updated: new Date().toISOString()
      };
      onSubmit(updatedDebt);
    } else {
      // If we're adding a new debt
      const newDebt: Debt = {
        id: uuidv4(),
        last_updated: new Date().toISOString(),
        ...values,
      };
      onSubmit(newDebt);
    }
    
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 w-full px-1">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Debt Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter debt name" className="w-full" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Category</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DEBT_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Amount</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0.01" 
                    step="0.01" 
                    placeholder="0.00"
                    className="w-full"
                    {...field}
                    value={field.value === undefined ? '' : field.value}
                    onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Currency</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCY_CODES.map(currency => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>


        <FormField
          control={form.control}
          name="comments"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Comments (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any notes about this debt" 
                  className="resize-none w-full"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3 pt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{initialDebt ? 'Update Debt' : 'Save Debt'}</Button>
        </div>
      </form>
    </Form>
  );
};

export { DebtForm, formatCurrency };