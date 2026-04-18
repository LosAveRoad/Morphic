import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecommendationPanel } from './recommendation-panel'

describe('RecommendationPanel', () => {
  it('shows recommendations and submits manual input', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onSubmit = vi.fn()

    render(
      <RecommendationPanel
        recommendations={[
          { id: 'explain', label: '解释这个概念', description: '生成说明卡' },
        ]}
        prompt=""
        onPromptChange={() => {}}
        onSelect={onSelect}
        onSubmit={onSubmit}
      />,
    )

    await user.click(screen.getByText('解释这个概念'))
    await user.type(screen.getByPlaceholderText('输入一句话，让 AI 帮你整理'), '谱定理')
    await user.click(screen.getByText('生成卡片'))

    expect(onSelect).toHaveBeenCalledWith('explain')
    expect(onSubmit).toHaveBeenCalled()
  })
})
