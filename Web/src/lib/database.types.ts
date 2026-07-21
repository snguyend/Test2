/**
 * Database schema types for the Supabase (PostgreSQL) backend.
 *
 * These mirror the tables defined in `Data_Model.md` and follow the shape that
 * `@supabase/supabase-js` expects for `createClient<Database>()`. They use
 * `snake_case` to match the SQL columns exactly. The app-facing (camelCase)
 * domain types live in `src/types.ts`; `utils/supabaseStore.ts` maps between them.
 *
 * When the schema stabilises you can replace this file with the output of:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */

export type MemberRole = 'owner' | 'parent' | 'guardian' | 'viewer'
export type Semester = 'first' | 'second'

import type { AboutContent } from '../types'

/** Generic helper for a table with distinct Row / Insert / Update shapes. */
// Row types below are `type` aliases (not `interface`) on purpose — object
// `interface`s do not satisfy `Record<string, unknown>`, which would make
// Supabase's schema constraint resolve every table to `never`.
type TableShape<Row, Insert, Update> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

/* ------------------------------------------------------------------ */
/* Row types                                                           */
/* ------------------------------------------------------------------ */

export type UserRow = {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export type FamilyRow = {
  id: string
  name: string
  owner_user_id: string
  created_at: string
}

export type FamilyMemberRow = {
  id: string
  family_id: string
  user_id: string
  role: MemberRole
  created_at: string
}

export type ChildRow = {
  id: string
  family_id: string
  name: string
  grade: string | null
  avatar: string | null
  color: string | null
  birth_year: number | null
  photo_url: string | null
  created_at: string
}

export type RewardRow = {
  id: string
  family_id: string
  name: string
  icon: string | null
  cost: number
  category: string | null
  claimed: boolean
  created_at: string
}

export type ScoreRow = {
  id: string
  child_id: string
  subject: string
  score: number
  max_score: number
  score_date: string
  semester: Semester | null
  grade_level: number | null
  term: string | null
  notes: string | null
  created_at: string
}

export type AcademicGoalRow = {
  id: string
  child_id: string
  title: string | null
  subject: string | null
  target_score: number | null
  reward_id: string | null
  points: number
  done: boolean
  done_at: string | null
  created_at: string
}

export type HabitRow = {
  id: string
  child_id: string
  name: string
  icon: string | null
  unit: string | null
  target_weekly_value: number
  created_at: string
}

export type HabitCheckinRow = {
  id: string
  habit_id: string
  value: number
  checkin_date: string
  created_at: string
}

export type WeeklySnapshotRow = {
  id: string
  child_id: string
  year: number
  week_number: number
  week_start: string
  academic_score: number | null
  habit_score: number | null
  growth_score: number | null
  created_at: string
}

export type AchievementRow = {
  id: string
  child_id: string
  badge_type: string
  earned_at: string
  meta: Record<string, unknown> | null
}

export type EncouragementRow = {
  id: string
  child_id: string
  message: string
  author: string
  author_user_id: string | null
  created_at: string
}

export type JournalEntryRow = {
  id: string
  child_id: string
  entry_date: string
  went_well: string[]
  to_improve: string[]
  next_goals: string[]
  parent_reflection: string | null
  created_at: string
}

export type DailyCheckinRow = {
  id: string
  child_id: string
  checkin_date: string
  created_at: string
}

export type HomeworkRow = {
  id: string
  child_id: string
  title: string
  subject: string | null
  description: string | null
  due_date: string | null
  done: boolean
  done_at: string | null
  created_at: string
}

export type BlogPostRow = {
  id: string
  family_id: string
  title: string
  excerpt: string | null
  date_label: string | null
  read_mins: number
  emoji: string | null
  color: string | null
  tag: string | null
  image_url: string | null
  created_at: string
}

export type AboutContentRow = {
  family_id: string
  content: AboutContent
  updated_at: string
}

/* ------------------------------------------------------------------ */
/* Insert / Update helpers                                             */
/* ------------------------------------------------------------------ */

/** DB-managed columns that callers never provide on insert. */
type Generated = 'id' | 'created_at'

/** Flatten an intersection into a single object type (assignable to Record). */
type Flatten<T> = { [K in keyof T]: T[K] }

type InsertOf<Row, Optional extends keyof Row = never> = Flatten<
  Omit<Row, Generated | Optional> & Partial<Pick<Row, (Generated | Optional) & keyof Row>>
>

export type UpdateOf<Row> = Flatten<Partial<Omit<Row, 'id' | 'created_at'>>>

/* ------------------------------------------------------------------ */
/* Database interface for createClient<Database>()                     */
/* ------------------------------------------------------------------ */

export type Database = {
  public: {
    Tables: {
      users: TableShape<
        UserRow,
        InsertOf<UserRow, 'display_name' | 'avatar_url'>,
        UpdateOf<UserRow>
      >
      families: TableShape<FamilyRow, InsertOf<FamilyRow>, UpdateOf<FamilyRow>>
      family_members: TableShape<
        FamilyMemberRow,
        InsertOf<FamilyMemberRow, 'role'>,
        UpdateOf<FamilyMemberRow>
      >
      children: TableShape<
        ChildRow,
        InsertOf<ChildRow, 'grade' | 'avatar' | 'color' | 'birth_year' | 'photo_url'>,
        UpdateOf<ChildRow>
      >
      rewards: TableShape<
        RewardRow,
        InsertOf<RewardRow, 'icon' | 'cost' | 'category' | 'claimed'>,
        UpdateOf<RewardRow>
      >
      scores: TableShape<
        ScoreRow,
        InsertOf<ScoreRow, 'max_score' | 'semester' | 'grade_level' | 'term' | 'notes'>,
        UpdateOf<ScoreRow>
      >
      academic_goals: TableShape<
        AcademicGoalRow,
        InsertOf<
          AcademicGoalRow,
          'title' | 'subject' | 'target_score' | 'reward_id' | 'points' | 'done' | 'done_at'
        >,
        UpdateOf<AcademicGoalRow>
      >
      habits: TableShape<
        HabitRow,
        InsertOf<HabitRow, 'icon' | 'unit'>,
        UpdateOf<HabitRow>
      >
      habit_checkins: TableShape<
        HabitCheckinRow,
        InsertOf<HabitCheckinRow>,
        UpdateOf<HabitCheckinRow>
      >
      weekly_snapshots: TableShape<
        WeeklySnapshotRow,
        InsertOf<WeeklySnapshotRow, 'academic_score' | 'habit_score' | 'growth_score'>,
        UpdateOf<WeeklySnapshotRow>
      >
      achievements: TableShape<
        AchievementRow,
        InsertOf<AchievementRow, 'earned_at' | 'meta'>,
        UpdateOf<AchievementRow>
      >
      encouragements: TableShape<
        EncouragementRow,
        InsertOf<EncouragementRow, 'author_user_id'>,
        UpdateOf<EncouragementRow>
      >
      journal_entries: TableShape<
        JournalEntryRow,
        InsertOf<
          JournalEntryRow,
          'went_well' | 'to_improve' | 'next_goals' | 'parent_reflection'
        >,
        UpdateOf<JournalEntryRow>
      >
      daily_checkins: TableShape<
        DailyCheckinRow,
        InsertOf<DailyCheckinRow>,
        UpdateOf<DailyCheckinRow>
      >
      homework: TableShape<
        HomeworkRow,
        InsertOf<HomeworkRow, 'subject' | 'description' | 'due_date' | 'done' | 'done_at'>,
        UpdateOf<HomeworkRow>
      >
      blog_posts: TableShape<
        BlogPostRow,
        InsertOf<
          BlogPostRow,
          'excerpt' | 'date_label' | 'read_mins' | 'emoji' | 'color' | 'tag' | 'image_url'
        >,
        UpdateOf<BlogPostRow>
      >
      about_content: TableShape<
        AboutContentRow,
        InsertOf<AboutContentRow, 'updated_at'>,
        UpdateOf<AboutContentRow>
      >
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    CompositeTypes: Record<string, never>
    Enums: {
      member_role: MemberRole
      semester_enum: Semester
    }
  }
}
