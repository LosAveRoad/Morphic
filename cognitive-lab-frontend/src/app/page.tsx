import { WorkspaceApp } from '@/components/shell/workspace-app'
import { WorkspaceShell } from '@/components/shell/workspace-shell'

export default function HomePage() {
  return (
    <WorkspaceShell>
      <WorkspaceApp />
    </WorkspaceShell>
  )
}
