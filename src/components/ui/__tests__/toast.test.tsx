import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/ui/toast';

// Mock the useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

describe('Toast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders toast with title and description', () => {
    render(
      <Toast>
        <div className="grid gap-1">
          <div className="font-medium">Toast Title</div>
          <div className="text-sm opacity-90">Toast Description</div>
        </div>
      </Toast>
    );

    expect(screen.getByText('Toast Title')).toBeInTheDocument();
    expect(screen.getByText('Toast Description')).toBeInTheDocument();
  });

  it('can be dismissed', async () => {
    const mockDismiss = jest.fn();
    (useToast as jest.Mock).mockReturnValue({ dismiss: mockDismiss });

    render(
      <Toast>
        <div>Dismissible Toast</div>
      </Toast>
    );

    const closeButton = screen.getByRole('button');
    await userEvent.click(closeButton);

    expect(mockDismiss).toHaveBeenCalled();
  });

  it('applies variant classes correctly', () => {
    const { rerender } = render(
      <Toast variant="default">
        <div>Default Toast</div>
      </Toast>
    );

    expect(screen.getByText('Default Toast').parentElement).toHaveClass('bg-background');

    rerender(
      <Toast variant="destructive">
        <div>Destructive Toast</div>
      </Toast>
    );

    expect(screen.getByText('Destructive Toast').parentElement).toHaveClass('bg-destructive');
  });
});