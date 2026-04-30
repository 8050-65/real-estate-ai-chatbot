import { render, screen } from '@testing-library/react'
import { KPICard } from '@/components/dashboard/KPICard'
import { TrendingUp } from 'lucide-react'

describe('KPICard', () => {
  it('renders title and value', () => {
    render(<KPICard title="Total Leads" value={152} />)
    expect(screen.getByText('Total Leads')).toBeInTheDocument()
    expect(screen.getByText('152')).toBeInTheDocument()
  })

  it('displays positive change', () => {
    render(<KPICard title="Growth" value={100} change={12} />)
    expect(screen.getByText('12%')).toBeInTheDocument()
  })

  it('displays negative change', () => {
    render(<KPICard title="Churn" value={5} change={-8} />)
    expect(screen.getByText('8%')).toBeInTheDocument()
  })

  it('renders loading state', () => {
    const { container } = render(<KPICard title="Loading" value={0} loading />)
    const skeleton = container.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })

  it('renders with icon', () => {
    render(
      <KPICard
        title="Leads"
        value={50}
        icon={<TrendingUp data-testid="icon" />}
      />
    )
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })
})
