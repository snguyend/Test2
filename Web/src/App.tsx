import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import StudentDetails from './pages/StudentDetails'
import AddScore from './pages/AddScore'
import ProgressCharts from './pages/ProgressCharts'
import GoalsRewards from './pages/GoalsRewards'
import About from './pages/About'
import Courses from './pages/Courses'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<StudentDetails />} />
        <Route path="students/:id" element={<StudentDetails />} />
        <Route path="add-score" element={<AddScore />} />
        <Route path="progress" element={<ProgressCharts />} />
        <Route path="goals" element={<GoalsRewards />} />
        <Route path="about" element={<About />} />
        <Route path="courses" element={<Courses />} />
      </Route>
    </Routes>
  )
}
