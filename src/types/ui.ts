import { LucideIcon } from 'lucide-react';

export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingProps extends BaseProps {
  loading?: boolean;
}

export interface ErrorProps extends BaseProps {
  error?: string;
}

export interface IconProps {
  icon: LucideIcon;
  className?: string;
  size?: number;
}

export interface ButtonProps extends BaseProps {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends BaseProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  error?: string;
}

export interface SelectProps extends BaseProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  options: Array<{ label: string; value: string }>;
  error?: string;
}

export interface CardProps extends BaseProps {
  title?: string;
  description?: string;
}

export interface DialogProps extends BaseProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
}

export interface ToastProps extends BaseProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

export interface TabsProps extends BaseProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

export interface TableProps extends BaseProps {
  data: any[];
  columns: Array<{
    header: string;
    accessorKey: string;
    cell?: (row: any) => React.ReactNode;
  }>;
}

export interface FormProps extends BaseProps {
  onSubmit?: (data: any) => void;
  defaultValues?: any;
}

export interface ModalProps extends BaseProps {
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  description?: string;
}

export interface DrawerProps extends BaseProps {
  isOpen?: boolean;
  onClose?: () => void;
  side?: 'left' | 'right' | 'top' | 'bottom';
}

export interface MenuProps extends BaseProps {
  items: Array<{
    label: string;
    onClick?: () => void;
    icon?: LucideIcon;
    disabled?: boolean;
  }>;
}