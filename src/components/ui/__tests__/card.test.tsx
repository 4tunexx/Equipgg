import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

describe('Card', () => {
  it('renders card with header and content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Card Content</CardContent>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies custom classNames', () => {
    const { container } = render(
      <Card className="custom-class">
        <CardHeader className="header-class">
          <CardTitle className="title-class">Title</CardTitle>
        </CardHeader>
      </Card>
    );

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
    expect(container.querySelector('.header-class')).toBeInTheDocument();
    expect(container.querySelector('.title-class')).toBeInTheDocument();
  });

  it('forwards refs correctly', () => {
    const ref = { current: null };
    render(<Card ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});