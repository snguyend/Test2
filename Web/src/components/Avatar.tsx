import { useAppData } from '../store'
import type { Student } from '../types'

interface AvatarProps {
  student: Student
  size?: number
  editable?: boolean
}

export default function Avatar({ student, size = 50, editable = false }: AvatarProps) {
  const { photos, setStudentPhoto } = useAppData()
  const photo = photos[student.id]

  const style = {
    width: size,
    height: size,
    fontSize: size * 0.32,
    background: photo ? '#fff' : student.color,
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setStudentPhoto(student.id, reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = '' // allow re-selecting the same file
  }

  const content = photo ? <img src={photo} alt={student.name} /> : student.avatar

  if (!editable) {
    return (
      <span className="avatar" style={style}>
        {content}
      </span>
    )
  }

  // Using a <label> makes the browser open the native file explorer on click,
  // which is the most reliable cross-browser way to pick a file.
  return (
    <label
      className="avatar editable"
      style={style}
      title="Click to change photo"
      onClick={(e) => e.stopPropagation()}
    >
      {content}
      <span className="avatar-edit">📷</span>
      <input type="file" accept="image/*" onChange={handleFile} hidden />
    </label>
  )
}
