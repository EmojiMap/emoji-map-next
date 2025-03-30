import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ApiReferencesPage from '../page';

describe('ApiReferencesPage', () => {
  it('renders the page title and description correctly', () => {
    render(<ApiReferencesPage />);
    expect(screen.getByText('API References')).toBeInTheDocument();
    expect(
      screen.getByText(/Overview of available API endpoints/)
    ).toBeInTheDocument();
  });

  it('renders all API section components with correct titles and descriptions', () => {
    render(<ApiReferencesPage />);

    // Check section titles and descriptions
    const sections = [
      {
        title: 'User API',
        description: 'Endpoints for user management and authentication',
      },
      {
        title: 'Places API',
        description: 'Search, manage and interact with places',
      },
      {
        title: 'Merchant API',
        description: 'Endpoints for merchant management and operations',
      },
      {
        title: 'Inngest API',
        description: 'Background job and event processing',
      },
      {
        title: 'Admin API',
        description: 'Endpoints used for this admin dashboard',
      },
      {
        title: 'Support API',
        description: 'Customer support and help desk functionality',
      },
      {
        title: 'Webhooks API',
        description: 'Handle external service webhooks',
      },
      {
        title: 'Health API',
        description: 'System health and monitoring',
      },
      {
        title: 'Debug API',
        description: 'Debugging tools and utilities',
      },
      {
        title: 'Test Logger API',
        description: 'Testing and logging functionality',
      },
    ];

    sections.forEach(({ title, description }) => {
      expect(screen.getByText(title)).toBeInTheDocument();
      expect(screen.getByText(description)).toBeInTheDocument();
    });
  });

  it('renders HTTP method badges with correct styling', () => {
    render(<ApiReferencesPage />);

    // Test GET badge
    const getMethodBadges = screen.getAllByText('GET');
    expect(getMethodBadges[0]).toHaveClass(
      'bg-emerald-100',
      'text-emerald-700'
    );

    // Test POST badge
    const postMethodBadges = screen.getAllByText('POST');
    expect(postMethodBadges[0]).toHaveClass('bg-amber-100', 'text-amber-700');

    // Test DELETE badge
    const deleteMethodBadges = screen.getAllByText('DELETE');
    expect(deleteMethodBadges[0]).toHaveClass('bg-red-100', 'text-red-700');
  });

  it('renders endpoints with correct methods and descriptions', () => {
    render(<ApiReferencesPage />);

    // Test User API endpoints
    expect(screen.getByText('/api/user')).toBeInTheDocument();
    expect(screen.getByText('/api/user/sync')).toBeInTheDocument();
    expect(screen.getByText('Sync user data')).toBeInTheDocument();

    // Test Places API endpoints
    expect(screen.getByText('/api/places/search')).toBeInTheDocument();
    expect(screen.getByText('Search for places')).toBeInTheDocument();
    expect(screen.getByText('/api/places/details')).toBeInTheDocument();
    expect(screen.getByText('Get place details')).toBeInTheDocument();

    // Test Admin API endpoints
    expect(
      screen.getByText('/api/admin/app-store-connect')
    ).toBeInTheDocument();
    expect(screen.getByText('/api/admin/clerk-users')).toBeInTheDocument();
    expect(screen.getByText('/api/admin/db-users')).toBeInTheDocument();
  });

  it('renders links to detailed documentation with correct hrefs', () => {
    render(<ApiReferencesPage />);

    const sections = [
      'user',
      'places',
      'merchant',
      'inngest',
      'admin',
      'support',
      'webhooks',
      'health',
      'debug',
      'test-logger',
    ];

    const links = screen.getAllByRole('link', {
      name: 'View detailed documentation →',
    });

    expect(links).toHaveLength(sections.length);

    links.forEach((link, index) => {
      expect(link).toHaveAttribute(
        'href',
        `/admin/api-reference/${sections[index]}`
      );
    });
  });

  it('renders the API authentication section with all methods', () => {
    render(<ApiReferencesPage />);

    expect(screen.getByText('API Authentication')).toBeInTheDocument();
    expect(
      screen.getByText(/Most API endpoints require authentication/)
    ).toBeInTheDocument();

    // Check authentication methods
    expect(
      screen.getByText(/Session-based authentication/)
    ).toBeInTheDocument();
    expect(screen.getByText(/x-api-key/)).toBeInTheDocument();
    expect(screen.getByText(/Authorization: Bearer/)).toBeInTheDocument();

    // Check help section
    expect(screen.getByText('Need help with our API?')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Contact the development team for API integration support or feature requests./
      )
    ).toBeInTheDocument();
  });

  it('renders endpoints in a monospace font with correct styling', () => {
    render(<ApiReferencesPage />);

    const endpoints = screen.getAllByText((content, element) => {
      return (
        element?.tagName.toLowerCase() === 'span' && content.startsWith('/api/')
      );
    });

    endpoints.forEach((endpoint) => {
      expect(endpoint).toHaveClass('font-mono', 'text-xs');
    });
  });
});
