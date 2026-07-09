import { useAppData } from '../store-context'
import Avatar from '../components/Avatar'

export default function GoalsRewards() {
  const { students, goals, rewards, toggleGoal } = useAppData()

  return (
    <div className="page">
      <h1>Goals & Rewards</h1>
      <p className="muted">Tap a goal to mark it done and unlock the reward.</p>

      {students.map((student) => {
        const studentGoals = goals.filter((g) => g.studentId === student.id)

        return (
          <section key={student.id} className="card">
            <div className="student-head">
              <Avatar student={student} editable />
              <div>
                <h2>{student.name}</h2>
                <span className="muted">{student.grade}</span>
              </div>
            </div>

            {studentGoals.length === 0 ? (
              <p className="muted">No goals yet.</p>
            ) : (
              <ul className="list">
                {studentGoals.map((goal) => {
                  const reward = rewards.find((r) => r.id === goal.rewardId)
                  return (
                    <li key={goal.id}>
                      <button
                        className={goal.done ? 'goal done' : 'goal'}
                        onClick={() => toggleGoal(goal.id)}
                      >
                        <span className="check">{goal.done ? '✅' : '⬜'}</span>
                        <span className="goal-text">
                          <strong>{goal.title}</strong>
                          <span className="muted">
                            {reward ? `${reward.icon} ${reward.name}` : '🎁 Reward'}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
