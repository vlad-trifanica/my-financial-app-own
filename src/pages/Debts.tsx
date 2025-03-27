import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FinancialEntry } from '@/types/financial';
import { debtService } from '@/lib/services/debtService';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DebtForm } from '@/components/forms/DebtForm';
import { Trash2, Search, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
  useReactTable,
  FilterFn,
} from '@tanstack/react-table';
import { useCurrency } from '@/components/ui/currency-selector';

// Helper function to format category names
const formatCategoryName = (category: string): string => {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

const Debts: React.FC = () => {
  const [debts, setDebts] = useState<FinancialEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingDebt, setEditingDebt] = useState<FinancialEntry | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { formatAmount } = useCurrency();
  const { user } = useAuth();

  // Fetch debts from Supabase when component mounts
  useEffect(() => {
    const fetchDebts = async () => {
      try {
        setIsLoading(true);
        const data = await debtService.getDebts();
        setDebts(data);
      } catch (error) {
        console.error('Error fetching debts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDebts();
  }, []);

  const handleAddDebt = async (newDebt: Omit<FinancialEntry, 'id'>) => {
    try {
      // Check if user is authenticated
      if (!user) {
        console.error('User is not authenticated');
        alert('Please log in to add debts');
        return;
      }
      
      // Add user_id to the debt before saving to Supabase
      const debtWithUserId = {
        ...newDebt,
        user_id: user.id,
        last_updated: new Date().toISOString()
      };
      
      const addedDebt = await debtService.addDebt(debtWithUserId);
      if (addedDebt) {
        setDebts([...debts, addedDebt as FinancialEntry]);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error adding debt:', error);
      alert('Failed to add debt. Please check if you are logged in.');
    }
  };

  const handleEditDebt = async (updatedDebt: FinancialEntry) => {
    try {
      // Check if user is authenticated
      if (!user) {
        console.error('User is not authenticated');
        alert('Please log in to edit debts');
        return;
      }
      
      // Add last_updated date before updating
      const debtToUpdate = {
        ...updatedDebt,
        user_id: user.id, // Ensure user_id is set correctly
        last_updated: new Date().toISOString()
      };
      
      const updated = await debtService.updateDebt(updatedDebt.id, debtToUpdate);
      if (updated) {
        setDebts(debts.map(debt => 
          debt.id === updated.id ? updated : debt
        ));
      }
      setEditingDebt(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating debt:', error);
      alert('Failed to update debt. Please check if you are logged in.');
    }
  };

  const handleDeleteDebt = async (id: string) => {
    try {
      // Check if user is authenticated
      if (!user) {
        console.error('User is not authenticated');
        alert('Please log in to delete debts');
        return;
      }
      
      await debtService.deleteDebt(id);
      setDebts(debts.filter(debt => debt.id !== id));
    } catch (error) {
      console.error('Error deleting debt:', error);
      alert('Failed to delete debt. Please check if you are logged in.');
    }
  };

  // Custom global filter function that handles formatted category names
  const fuzzyFilter: FilterFn<FinancialEntry> = (row, columnId, filterValue) => {
    const value = row.getValue(columnId);
    
    // Handle category special case
    if (columnId === 'category' && typeof value === 'string') {
      const formattedCategory = formatCategoryName(value as string);
      return formattedCategory.toLowerCase().includes(filterValue.toLowerCase());
    }
    
    // Standard string filtering for other columns
    if (typeof value === 'string') {
      return value.toLowerCase().includes(filterValue.toLowerCase());
    }
    
    return true;
  };

  // Define table columns
  const columns = useMemo<ColumnDef<FinancialEntry>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
        filterFn: 'includesString',
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => {
          const category = row.getValue('category') as string;
          const formattedCategory = formatCategoryName(category);
          return <div>{formattedCategory}</div>;
        },
        filterFn: fuzzyFilter,
      },
      {
        accessorKey: 'value',
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => {
          const value = row.getValue('value') as number;
          const currency = row.original.currency;
          return <div className="text-right">{formatAmount(value, currency)}</div>;
        },
      },
      {
        accessorKey: 'last_updated',
        header: 'Last Updated',
        cell: ({ row }) => {
          const date = row.getValue('last_updated') as string;
          return <div>{new Date(date).toLocaleDateString()}</div>
        },
      },
      {
        accessorKey: 'comments',
        header: 'Comments',
        cell: ({ row }) => {
          const comments = row.getValue('comments') as string | undefined;
          return <div>{comments || ''}</div>;
        },
      },
      {
        id: 'actions',
        header: "",
        cell: ({ row }) => {
          const debt = row.original;
          return (
            <div className="flex items-center justify-end space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-primary hover:bg-primary/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingDebt(debt);
                  setIsDialogOpen(true);
                }}
                title="Edit debt"
              >
                <Pencil size={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteDebt(debt.id);
                }}
                title="Delete debt"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          );
        },
      },
    ],
    [handleDeleteDebt, setEditingDebt, setIsDialogOpen, formatAmount]
  );

  // Initialize the table
  const table = useReactTable({
    data: debts,
    columns,
    state: {
      columnFilters,
      globalFilter,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: {
      fuzzy: fuzzyFilter
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId);
      
      // Skip filtering on certain columns
      if (columnId === 'actions' || columnId === 'id') return true;
      
      // Handle category formatting for global search
      if (columnId === 'category' && typeof value === 'string') {
        const formattedCategory = formatCategoryName(value as string);
        return formattedCategory.toLowerCase().includes(filterValue.toLowerCase());
      }
      
      // For other columns that contain string values
      if (value !== null && value !== undefined) {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(filterValue.toLowerCase());
        }
        // Convert non-string values to string for comparison
        return String(value).toLowerCase().includes(filterValue.toLowerCase());
      }
      
      return false;
    }
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Debts</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search debts..."
              className="pl-8 w-full"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => setIsDialogOpen(true)} 
            className="cursor-pointer hover:scale-105 transition-transform whitespace-nowrap"
          >
            Add New Debt
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="border rounded-md p-8 text-center">
          <p>Loading debts...</p>
        </div>
      ) : debts.length === 0 ? (
        <div className="border rounded-md p-8 text-center">
          <p>No debts added yet.</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="whitespace-nowrap">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="max-w-[150px] sm:max-w-none truncate">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingDebt(null);
      }}>
        <DialogContent className="max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDebt ? 'Edit Debt' : 'Add New Debt'}</DialogTitle>
          </DialogHeader>
          <DebtForm 
            onSubmit={editingDebt ? handleEditDebt : handleAddDebt} 
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingDebt(null);
            }}
            initialDebt={editingDebt || undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Debts;