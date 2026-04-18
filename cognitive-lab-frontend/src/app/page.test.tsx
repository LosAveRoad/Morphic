import { render, screen } from '@testing-library/react'
import HomePage from './page'

describe('HomePage', () => {
  it('renders the workspace shell title', () => {
    render(<HomePage />)

    expect(screen.getByText('Cognitive Lab')).toBeInTheDocument()
    expect(screen.getByText('Infinite canvas for thinking')).toBeInTheDocument()
  })
})
