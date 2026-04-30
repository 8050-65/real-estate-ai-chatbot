import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useLeads } from '@/hooks/useLeads'
import api from '@/lib/api'

jest.mock('@/lib/api')

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useLeads Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches leads successfully', async () => {
    const mockLeads = {
      content: [
        {
          id: '1',
          tenantId: 'tenant1',
          name: 'John Doe',
          phone: '9876543210',
          status: 'new',
          createdAt: '2026-04-26',
        },
      ],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
      hasNext: false,
    }

    ;(api.get as jest.Mock).mockResolvedValue({ data: mockLeads })

    const { result } = renderHook(() => useLeads(1, 10), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockLeads)
    expect(result.current.data?.content).toHaveLength(1)
    expect(result.current.data?.content[0].name).toBe('John Doe')
  })

  it('handles fetch error', async () => {
    ;(api.get as jest.Mock).mockRejectedValue(
      new Error('Network error')
    )

    const { result } = renderHook(() => useLeads(1, 10), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('paginates correctly', async () => {
    const mockLeads = {
      content: [],
      page: 1,
      size: 10,
      totalElements: 25,
      totalPages: 3,
      hasNext: true,
    }

    ;(api.get as jest.Mock).mockResolvedValue({ data: mockLeads })

    const { result } = renderHook(() => useLeads(2, 10), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.page).toBe(1)
    expect(result.current.data?.hasNext).toBe(true)
  })

  it('filters by search term', async () => {
    ;(api.get as jest.Mock).mockResolvedValue({
      data: {
        content: [],
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
      },
    })

    renderHook(() => useLeads(1, 10, 'John'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('search=John')
      )
    })
  })
})
