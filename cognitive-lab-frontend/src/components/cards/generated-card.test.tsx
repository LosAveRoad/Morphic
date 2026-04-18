import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GeneratedCard } from './generated-card'

describe('GeneratedCard', () => {
  it('renders title and calls redo handler', async () => {
    const user = userEvent.setup()
    const onRedo = vi.fn()
    const onMove = vi.fn()

    render(
      <GeneratedCard
        card={{
          id: 'card-1',
          x: 100,
          y: 120,
          width: 320,
          height: 220,
          type: 'text',
          title: '概念解释',
          content: { body: '谱定理相关内容' },
          variantKey: 'explain',
          redoOptions: ['outline'],
        }}
        onRedo={onRedo}
        onMove={onMove}
      />,
    )

    expect(screen.getByText('概念解释')).toBeInTheDocument()
    await user.click(screen.getByText('Redo'))
    expect(onRedo).toHaveBeenCalledWith('card-1')
  })
})
