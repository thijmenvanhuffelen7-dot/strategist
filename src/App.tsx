import { BrowserRouter, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom'
import { FileText, Bookmark, FlaskConical } from 'lucide-react'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { ProjectsList } from './pages/projects/ProjectsList'
import { ProjectForm } from './pages/projects/ProjectForm'
import { ProjectDetail } from './pages/projects/ProjectDetail'
import { Settings } from './pages/Settings'
import { Placeholder } from './pages/Placeholder'

// Als ingesloten webpagina (claude.ai) blijft de routering intern; lokaal gebruiken we echte URL's.
const Router = import.meta.env.MODE === 'artifact' ? MemoryRouter : BrowserRouter

export function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="projecten" element={<ProjectsList />} />
          <Route path="projecten/nieuw" element={<ProjectForm key="nieuw" />} />
          <Route path="projecten/:id" element={<ProjectDetail />} />
          <Route path="projecten/:id/bewerken" element={<ProjectForm key="bewerken" />} />
          <Route
            path="briefs"
            element={
              <Placeholder title="Brief Builder" description="Van klantonderzoek naar creative brief in 4 stappen." icon={<FileText />} phase={2}>
                Stap 1 klantonderzoek → stap 2 angles → stap 3 hooks → stap 4 creative brief, telkens met AI-output die je kunt bewerken,
                opnieuw genereren of goedkeuren, plus een kritische review als creative director.
              </Placeholder>
            }
          />
          <Route
            path="swipe"
            element={
              <Placeholder title="Swipe File" description="Ads die je als inspiratie bewaart." icon={<Bookmark />} phase={3}>
                Bewaar ads met screenshot of video, transcript en tags, en laat de AI hook, angle, structuur en toepassingsideeën analyseren.
              </Placeholder>
            }
          />
          <Route
            path="testlog"
            element={
              <Placeholder title="Testlog" description="Creative-tests, metrics en lessen." icon={<FlaskConical />} phase={4}>
                Handmatige invoer en CSV-import uit Meta/TikTok Ads Manager, automatisch berekende metrics, grafieken en AI-analyse.
              </Placeholder>
            }
          />
          <Route path="instellingen" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  )
}
