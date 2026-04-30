import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'
import * as authLib from '@/lib/auth'
import api from '@/lib/api'

jest.mock('@/lib/auth')
jest.mock('@/lib/api')
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(authLib.getStoredUser as jest.Mock).mockReturnValue(null)
    ;(authLib.storeUser as jest.Mock).mockImplementation(() => {})
    ;(authLib.clearUser as jest.Mock).mockImplementation(() => {})
  })

  it('initializes with no user', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('loads stored user on mount', async () => {
    const mockUser = {
      userId: '123',
      email: 'test@example.com',
      role: 'ADMIN',
      tenantId: 'tenant1',
      accessToken: 'token',
      tokenType: 'Bearer',
      expiresIn: 86400000,
    }
    ;(authLib.getStoredUser as jest.Mock).mockReturnValue(mockUser)

    const { result } = renderHook(() => useAuth())
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  it('handles login successfully', async () => {
    const mockUser = {
      userId: '123',
      email: 'admin@crm-cbt.com',
      role: 'ADMIN',
      tenantId: 'tenant1',
      accessToken: 'jwt-token',
      tokenType: 'Bearer',
      expiresIn: 86400000,
    }

    ;(api.post as jest.Mock).mockResolvedValue({
      data: { data: mockUser },
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.login('admin@crm-cbt.com', 'Admin@123!')
    })

    await waitFor(() => {
      expect(authLib.storeUser).toHaveBeenCalledWith(mockUser)
      expect(result.current.user).toEqual(mockUser)
    })
  })

  it('handles login error', async () => {
    ;(api.post as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.login('wrong@email.com', 'wrongpassword')
    })

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
      expect(result.current.isLoggingIn).toBe(false)
    })
  })

  it('clears user on logout', async () => {
    const mockUser = {
      userId: '123',
      email: 'test@example.com',
      role: 'ADMIN',
      tenantId: 'tenant1',
      accessToken: 'token',
      tokenType: 'Bearer',
      expiresIn: 86400000,
    }
    ;(authLib.getStoredUser as jest.Mock).mockReturnValue(mockUser)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    act(() => {
      result.current.logout()
    })

    expect(authLib.clearUser).toHaveBeenCalled()
  })
})
