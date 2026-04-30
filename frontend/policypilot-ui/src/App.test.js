import { render, screen } from '@testing-library/react';
import App from './App';

test('renders loading screen initially', () => {
  render(<App />);
  const linkElement = screen.getByText(/Loading PolicyPilot/i);
  expect(linkElement).toBeInTheDocument();
});
