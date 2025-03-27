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
import { Asset, ASSET_CATEGORIES } from '@/types/financial';
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

interface AssetFormProps {
  onSubmit: (asset: Asset) => void;
  onCancel: () => void;
  initialAsset?: Asset;
}

// Use currency codes from the centralized list
const CURRENCY_CODES = AVAILABLE_CURRENCIES.map(currency => currency.code);

// Define validation schema using zod
const assetFormSchema = z.object({
  name: z.string()
    .min(1, 'Asset name is required')
    .max(100, 'Asset name must be less than 100 characters'),
  category: z.enum(['cash', 'bank_deposit', 'savings_account', 'investment', 'real_estate', 'vehicle', 'other'], {
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

type AssetFormValues = z.infer<typeof assetFormSchema>;

const formatCurrency = (value: number): string => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const AssetForm: React.FC<AssetFormProps> = ({ onSubmit, onCancel, initialAsset }) => {
  // Helper to ensure the category is one of the allowed values
  const getValidCategory = (category?: string): 'cash' | 'bank_deposit' | 'savings_account' | 'investment' | 'real_estate' | 'vehicle' | 'other' => {
    if (!category || !ASSET_CATEGORIES.includes(category as any)) {
      return 'other';
    }
    return category as any;
  };

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: initialAsset?.name || '',
      category: getValidCategory(initialAsset?.category),
      value: initialAsset?.value || undefined,
      currency: initialAsset?.currency || 'USD',
      comments: initialAsset?.comments || '',
    },
  });

  // Reset form when initialAsset changes
  useEffect(() => {
    if (initialAsset) {
      form.reset({
        name: initialAsset.name,
        category: getValidCategory(initialAsset.category),
        value: initialAsset.value,
        currency: initialAsset.currency,
        comments: initialAsset.comments || '',
      });
    }
  }, [initialAsset, form]);

  const handleSubmit = (values: AssetFormValues) => {
    if (initialAsset) {
      // If we're editing, maintain the original ID and date_added
      const updatedAsset: Asset = {
        ...initialAsset,
        ...values,
        last_updated: new Date().toISOString()
      };
      onSubmit(updatedAsset);
    } else {
      // If we're adding a new asset
      const newAsset: Asset = {
        id: uuidv4(),
        last_updated: new Date().toISOString(),
        ...values,
      };
      onSubmit(newAsset);
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
              <FormLabel className="text-sm font-medium">Asset Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter asset name" className="w-full" {...field} />
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
                  {ASSET_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                <FormLabel className="text-sm font-medium">Value</FormLabel>
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
                  placeholder="Add any notes about this asset" 
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
          <Button type="submit">{initialAsset ? 'Update Asset' : 'Save Asset'}</Button>
        </div>
      </form>
    </Form>
  );
};

export { AssetForm, formatCurrency };