import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import StudentDetails from './pages/StudentDetails'
import AddScore from './pages/AddScore'
import ProgressCharts from './pages/ProgressCharts'
import GoalsRewards from './pages/GoalsRewards'
import About from './pages/About'
import Courses from './pages/Courses'
import Viewer from './pages/Viewer'
import Homework from './pages/Homework'
import Blog from './pages/Blog'
import Contact from './pages/Contact'

export default function App() {
  // Local-first: the app is always usable on this device. Signing in (via the
  // header Join / Log In buttons) upgrades to cloud sync — see AuthModal.
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<StudentDetails />} />
        <Route path="students/:id" element={<StudentDetails />} />
        <Route path="add-score" element={<AddScore />} />
        <Route path="progress" element={<ProgressCharts />} />
        <Route path="goals" element={<GoalsRewards />} />
        <Route path="homework" element={<Homework />} />
        <Route path="blog" element={<Blog />} />
        <Route path="viewer" element={<Viewer />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="courses" element={<Courses />} />
      </Route>
    </Routes>
  )
}
