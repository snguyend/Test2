import { useRef } from 'react'
import { useAppData } from '../store'
import type { Student } from '../types'

interface AvatarProps {
  student: Student
  size?: number
  editable?: boolean
}

export default function Avatar({ student, size = 50, editable = false }: AvatarProps) {
  const { photos, setStudentPhoto } = useAppData()
  const inputRef = useRef<HTMLInputElement>(null)
  const photo = photos[student.id]

  const openPicker = (e: React.MouseEvent) => {
    if (!editable) return
    // Prevent parent links/cards from handling the click.
    e.preventDefault()
    e.stopPropagation()
    inputRef.current?.click()
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setStudentPhoto(student.id, reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = '' // allow re-selecting the same file
  }

  return (
    <span
      className={editable ? 'avatar editable' : 'avatar'}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.32,
        background: photo ? '#fff' : student.color,
      }}
      onClick={openPicker}
      title={editable ? 'Click to change photo' : undefined}
    >
      {photo ? <img src={photo} alt={student.name} /> : student.avatar}
      {editable && <span className="avatar-edit">📷</span>}
      {editable && (
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} hidden />
      )}
    </span>
  )
}
