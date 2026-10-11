import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from '../components/Pagination';

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    const { container } = render(<Pagination meta={{ page: 1, totalPages: 1 }} onPageChange={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('disables Previous on the first page and moves forward with Next', async () => {
    const onPageChange = jest.fn();
    render(<Pagination meta={{ page: 1, totalPages: 3 }} onPageChange={onPageChange} />);

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
