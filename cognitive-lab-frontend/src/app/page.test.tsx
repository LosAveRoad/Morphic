import { render, screen } from '@testing-library/react'
import HomePage from './page'

vi.mock('@/components/shell/workspace-app', () => ({
  WorkspaceApp: () => <div data-testid="workspace-app" />,
}))

describe('HomePage', () => {
  it('renders the workspace shell title', () => {
    render(<HomePage />)

    expect(screen.getByText('Cognitive Lab')).toBeInTheDocument()
    expect(screen.getByText('Infinite canvas for thinking')).toBeInTheDocument()
    expect(screen.getByTestId('workspace-app')).toBeInTheDocument()
  })
})
